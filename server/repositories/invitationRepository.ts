import sql from 'mssql';
import { getPool } from '../db/sqlServer.js';
import type { AuthorInvitationRecord, AuthorInvitationDto, InvitationStatus } from '../types/index.js';

export function computeInvitationStatus(invitation: {
  RevokedAt: Date | null;
  ExpiresAt: Date;
  UsedCount: number;
  MaxUses: number;
}): InvitationStatus {
  if (invitation.RevokedAt) {
    return 'REVOKED';
  }
  if (new Date() > new Date(invitation.ExpiresAt)) {
    return 'EXPIRED';
  }
  if (invitation.UsedCount >= invitation.MaxUses) {
    return 'EXHAUSTED';
  }
  return 'ACTIVE';
}

export class InvitationRepository {
  async createInvitation(data: {
    codeHash: string;
    createdByUserId: string;
    expiresAt: Date;
    maxUses: number;
    note?: string | null;
  }): Promise<AuthorInvitationRecord> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('codeHash', sql.Char(64), data.codeHash)
      .input('createdByUserId', sql.UniqueIdentifier, data.createdByUserId)
      .input('expiresAt', sql.DateTime2(3), data.expiresAt)
      .input('maxUses', sql.Int, data.maxUses)
      .input('note', sql.NVarChar(255), data.note || null)
      .query(`
        INSERT INTO dbo.AuthorInvitations (CodeHash, CreatedByUserId, ExpiresAt, MaxUses, UsedCount, Note, CreatedAt)
        OUTPUT inserted.*
        VALUES (@codeHash, @createdByUserId, @expiresAt, @maxUses, 0, @note, SYSUTCDATETIME());
      `);

    return result.recordset[0] as AuthorInvitationRecord;
  }

  async findByCodeHash(codeHash: string): Promise<AuthorInvitationRecord | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('codeHash', sql.Char(64), codeHash)
      .query(`
        SELECT * FROM dbo.AuthorInvitations
        WHERE CodeHash = @codeHash
      `);

    if (result.recordset.length === 0) return null;
    return result.recordset[0] as AuthorInvitationRecord;
  }

  async findById(invitationId: string): Promise<AuthorInvitationRecord | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('invitationId', sql.UniqueIdentifier, invitationId)
      .query(`
        SELECT * FROM dbo.AuthorInvitations
        WHERE InvitationId = @invitationId
      `);

    if (result.recordset.length === 0) return null;
    return result.recordset[0] as AuthorInvitationRecord;
  }

  async listInvitations(page = 1, limit = 50): Promise<{ items: AuthorInvitationDto[]; total: number }> {
    const pool = await getPool();
    const offset = (page - 1) * limit;

    const countResult = await pool.request().query('SELECT COUNT(*) as total FROM dbo.AuthorInvitations');
    const total = countResult.recordset[0].total;

    const result = await pool
      .request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT 
          ai.InvitationId,
          ai.ExpiresAt,
          ai.MaxUses,
          ai.UsedCount,
          ai.RevokedAt,
          ai.Note,
          ai.CreatedAt,
          u.UserId as CreatedBy_UserId,
          u.DisplayName as CreatedBy_DisplayName,
          u.Email as CreatedBy_Email
        FROM dbo.AuthorInvitations ai
        LEFT JOIN dbo.Users u ON ai.CreatedByUserId = u.UserId
        ORDER BY ai.CreatedAt DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY;
      `);

    const items: AuthorInvitationDto[] = result.recordset.map((row) => ({
      invitationId: row.InvitationId,
      expiresAt: row.ExpiresAt,
      maxUses: row.MaxUses,
      usedCount: row.UsedCount,
      revokedAt: row.RevokedAt,
      status: computeInvitationStatus({
        RevokedAt: row.RevokedAt,
        ExpiresAt: row.ExpiresAt,
        UsedCount: row.UsedCount,
        MaxUses: row.MaxUses,
      }),
      note: row.Note,
      createdAt: row.CreatedAt,
      createdByUser: row.CreatedBy_UserId
        ? {
            userId: row.CreatedBy_UserId,
            displayName: row.CreatedBy_DisplayName,
            email: row.CreatedBy_Email,
          }
        : undefined,
    }));

    return { items, total };
  }

  async revokeInvitation(invitationId: string): Promise<boolean> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('invitationId', sql.UniqueIdentifier, invitationId)
      .query(`
        UPDATE dbo.AuthorInvitations
        SET RevokedAt = SYSUTCDATETIME()
        WHERE InvitationId = @invitationId AND RevokedAt IS NULL
      `);

    return result.rowsAffected[0] > 0;
  }

  async hasUserRedeemed(invitationId: string, userId: string): Promise<boolean> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('invitationId', sql.UniqueIdentifier, invitationId)
      .input('userId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT 1 FROM dbo.InvitationUses
        WHERE InvitationId = @invitationId AND UserId = @userId
      `);

    return result.recordset.length > 0;
  }

  /**
   * Concurrency-safe, transactional redemption.
   * Locks the invitation row, validates state, increments count, records use, and grants AUTHOR role.
   */
  async redeemInvitationTransaction(invitationId: string, userId: string): Promise<void> {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      // 1. Lock invitation row with UPDLOCK, ROWLOCK to prevent race condition exceeding MaxUses
      const inviteReq = new sql.Request(transaction);
      const inviteRes = await inviteReq
        .input('invitationId', sql.UniqueIdentifier, invitationId)
        .query(`
          SELECT InvitationId, MaxUses, UsedCount, ExpiresAt, RevokedAt
          FROM dbo.AuthorInvitations WITH (UPDLOCK, ROWLOCK)
          WHERE InvitationId = @invitationId
        `);

      if (inviteRes.recordset.length === 0) {
        throw new Error('INVITATION_NOT_FOUND: Mã mời không tồn tại.');
      }

      const invite = inviteRes.recordset[0];

      if (invite.RevokedAt) {
        throw new Error('INVITATION_REVOKED: Mã mời đã bị thu hồi bởi Quản trị viên.');
      }

      if (new Date() > new Date(invite.ExpiresAt)) {
        throw new Error('INVITATION_EXPIRED: Mã mời đã hết thời hạn sử dụng.');
      }

      if (invite.UsedCount >= invite.MaxUses) {
        throw new Error('INVITATION_EXHAUSTED: Mã mời đã hết số lượt sử dụng tối đa.');
      }

      // 2. Check if this specific user already redeemed this invitation
      const checkReq = new sql.Request(transaction);
      const checkRes = await checkReq
        .input('invitationId', sql.UniqueIdentifier, invitationId)
        .input('userId', sql.UniqueIdentifier, userId)
        .query(`
          SELECT 1 FROM dbo.InvitationUses
          WHERE InvitationId = @invitationId AND UserId = @userId
        `);

      if (checkRes.recordset.length > 0) {
        throw new Error('INVITATION_ALREADY_USED: Bạn đã sử dụng mã mời này trước đó.');
      }

      // 3. Record use in dbo.InvitationUses
      const recordReq = new sql.Request(transaction);
      await recordReq
        .input('invitationId', sql.UniqueIdentifier, invitationId)
        .input('userId', sql.UniqueIdentifier, userId)
        .query(`
          INSERT INTO dbo.InvitationUses (InvitationId, UserId, UsedAt)
          VALUES (@invitationId, @userId, SYSUTCDATETIME())
        `);

      // 4. Increment UsedCount in dbo.AuthorInvitations
      const updateReq = new sql.Request(transaction);
      await updateReq
        .input('invitationId', sql.UniqueIdentifier, invitationId)
        .query(`
          UPDATE dbo.AuthorInvitations
          SET UsedCount = UsedCount + 1
          WHERE InvitationId = @invitationId
        `);

      // 5. Grant AUTHOR role in dbo.UserRoles
      const roleReq = new sql.Request(transaction);
      const roleRes = await roleReq
        .input('code', 'AUTHOR')
        .query("SELECT RoleId FROM dbo.Roles WHERE Code = @code");

      if (roleRes.recordset.length === 0) {
        throw new Error("System error: 'AUTHOR' role definition not found.");
      }

      const authorRoleId = roleRes.recordset[0].RoleId;

      const userRoleReq = new sql.Request(transaction);
      const hasAuthorRole = await userRoleReq
        .input('userId', sql.UniqueIdentifier, userId)
        .input('roleId', authorRoleId)
        .query('SELECT 1 FROM dbo.UserRoles WHERE UserId = @userId AND RoleId = @roleId');

      if (hasAuthorRole.recordset.length === 0) {
        const grantReq = new sql.Request(transaction);
        await grantReq
          .input('userId', sql.UniqueIdentifier, userId)
          .input('roleId', authorRoleId)
          .query(`
            INSERT INTO dbo.UserRoles (UserId, RoleId, GrantedByUserId, GrantedAt)
            VALUES (@userId, @roleId, @userId, SYSUTCDATETIME())
          `);
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}

export const invitationRepository = new InvitationRepository();
