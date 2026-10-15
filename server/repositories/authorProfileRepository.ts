import { getPool, sql } from '../db/sqlServer.js';
import type {
  AuthorProfileRecord,
  AuthorRequestDto,
  AdminAuthorRequestsResult,
  AuthorVerificationStatus,
} from '../types/index.js';

export class AuthorProfileRepository {
  async findById(authorProfileId: string): Promise<AuthorProfileRecord | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('authorProfileId', sql.UniqueIdentifier, authorProfileId)
      .query('SELECT * FROM dbo.AuthorProfiles WHERE AuthorProfileId = @authorProfileId');

    return result.recordset[0] || null;
  }

  async findByUserId(userId: string): Promise<AuthorProfileRecord | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query('SELECT * FROM dbo.AuthorProfiles WHERE UserId = @userId');

    return result.recordset[0] || null;
  }

  async getByUserId(userId: string): Promise<AuthorProfileRecord | null> {
    return this.findByUserId(userId);
  }

  async getPublicAuthors(): Promise<Array<{
    authorProfileId: string;
    penName: string;
    bio: string | null;
    avatarUrl: string | null;
    publishedBookCount: number;
    createdAt: Date;
  }>> {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        ap.AuthorProfileId,
        ap.PenName,
        ap.Bio,
        u.AvatarUrl,
        ap.CreatedAt,
        COUNT(DISTINCT b.BookId) AS PublishedBookCount
      FROM dbo.AuthorProfiles ap
      INNER JOIN dbo.Users u ON ap.UserId = u.UserId
      LEFT JOIN dbo.BookAuthors ba ON ap.AuthorProfileId = ba.AuthorProfileId
      LEFT JOIN dbo.Books b ON ba.BookId = b.BookId AND b.PublicationStatus = 'PUBLISHED'
      WHERE ap.VerificationStatus = 'VERIFIED'
      GROUP BY ap.AuthorProfileId, ap.PenName, ap.Bio, u.AvatarUrl, ap.CreatedAt
      ORDER BY PublishedBookCount DESC, ap.CreatedAt ASC;
    `);

    return result.recordset.map((row: any) => ({
      authorProfileId: row.AuthorProfileId,
      penName: row.PenName,
      bio: row.Bio,
      avatarUrl: row.AvatarUrl,
      publishedBookCount: row.PublishedBookCount || 0,
      createdAt: row.CreatedAt,
    }));
  }

  async createOrUpdate(
    userId: string,
    params: { penName: string; bio?: string | null }
  ): Promise<AuthorProfileRecord> {
    const pool = await getPool();
    const existing = await this.findByUserId(userId);

    if (existing) {
      // If pen name changed or was previously REJECTED, reset to PENDING for re-review
      const shouldResetToPending =
        existing.VerificationStatus === 'REJECTED' ||
        existing.PenName.trim().toLowerCase() !== params.penName.trim().toLowerCase();

      const req = pool.request()
        .input('userId', sql.UniqueIdentifier, userId)
        .input('penName', sql.NVarChar(150), params.penName.trim())
        .input('bio', sql.NVarChar(sql.MAX), params.bio?.trim() || null);

      let query = '';
      if (shouldResetToPending) {
        query = `
          UPDATE dbo.AuthorProfiles
          SET PenName = @penName,
              Bio = @bio,
              VerificationStatus = 'PENDING',
              VerificationNote = NULL,
              ReviewedByUserId = NULL,
              ReviewedAt = NULL,
              UpdatedAt = SYSUTCDATETIME()
          OUTPUT inserted.*
          WHERE UserId = @userId;
        `;
      } else {
        query = `
          UPDATE dbo.AuthorProfiles
          SET PenName = @penName,
              Bio = @bio,
              UpdatedAt = SYSUTCDATETIME()
          OUTPUT inserted.*
          WHERE UserId = @userId;
        `;
      }

      const result = await req.query(query);
      return result.recordset[0];
    } else {
      const result = await pool
        .request()
        .input('userId', sql.UniqueIdentifier, userId)
        .input('penName', sql.NVarChar(150), params.penName.trim())
        .input('bio', sql.NVarChar(sql.MAX), params.bio?.trim() || null)
        .query(`
          INSERT INTO dbo.AuthorProfiles (
            UserId,
            PenName,
            Bio,
            VerificationStatus,
            CreatedAt,
            UpdatedAt
          )
          OUTPUT inserted.*
          VALUES (
            @userId,
            @penName,
            @bio,
            'PENDING',
            SYSUTCDATETIME(),
            SYSUTCDATETIME()
          );
        `);
      return result.recordset[0];
    }
  }

  async getAuthorRequests(options?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminAuthorRequestsResult> {
    const pool = await getPool();
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(100, Math.max(1, options?.limit || 20));
    const offset = (page - 1) * limit;

    const req = pool.request();
    const whereClauses: string[] = ['1=1'];

    if (options?.status && options.status !== 'ALL') {
      req.input('status', sql.VarChar(20), options.status);
      whereClauses.push('ap.VerificationStatus = @status');
    }

    if (options?.search && options.search.trim().length > 0) {
      req.input('search', sql.NVarChar(200), `%${options.search.trim()}%`);
      whereClauses.push(
        '(ap.PenName LIKE @search OR u.DisplayName LIKE @search OR u.Email LIKE @search)'
      );
    }

    const whereSql = whereClauses.join(' AND ');

    // Get total count
    const countRes = await req.query(`
      SELECT COUNT(1) AS TotalCount
      FROM dbo.AuthorProfiles ap
      INNER JOIN dbo.Users u ON ap.UserId = u.UserId
      WHERE ${whereSql};
    `);
    const total = countRes.recordset[0]?.TotalCount || 0;

    // Get paginated items
    req.input('offset', sql.Int, offset);
    req.input('limit', sql.Int, limit);

    const itemsRes = await req.query(`
      SELECT 
        ap.AuthorProfileId,
        ap.UserId,
        ap.PenName,
        ap.Bio,
        ap.VerificationStatus,
        ap.VerificationNote,
        ap.ReviewedByUserId,
        ap.ReviewedAt,
        ap.CreatedAt,
        ap.UpdatedAt,
        u.Email AS UserEmail,
        u.DisplayName AS UserDisplayName,
        u.AvatarUrl AS UserAvatarUrl,
        u.Status AS UserStatus,
        ru.DisplayName AS ReviewerDisplayName,
        ru.Email AS ReviewerEmail
      FROM dbo.AuthorProfiles ap
      INNER JOIN dbo.Users u ON ap.UserId = u.UserId
      LEFT JOIN dbo.Users ru ON ap.ReviewedByUserId = ru.UserId
      WHERE ${whereSql}
      ORDER BY 
        CASE WHEN ap.VerificationStatus = 'PENDING' THEN 0 ELSE 1 END,
        ap.CreatedAt DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `);

    const items: AuthorRequestDto[] = itemsRes.recordset.map((row: any) => ({
      authorProfileId: row.AuthorProfileId,
      userId: row.UserId,
      penName: row.PenName,
      bio: row.Bio,
      verificationStatus: row.VerificationStatus as AuthorVerificationStatus,
      verificationNote: row.VerificationNote,
      reviewedByUserId: row.ReviewedByUserId,
      reviewedAt: row.ReviewedAt,
      createdAt: row.CreatedAt,
      updatedAt: row.UpdatedAt,
      userEmail: row.UserEmail,
      userDisplayName: row.UserDisplayName,
      userAvatarUrl: row.UserAvatarUrl,
      userStatus: row.UserStatus,
      reviewerDisplayName: row.ReviewerDisplayName,
      reviewerEmail: row.ReviewerEmail,
    }));

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async approveAuthorRequest(
    authorProfileId: string,
    adminUserId: string,
    note?: string | null
  ): Promise<AuthorProfileRecord> {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Lock author profile row
      const selectReq = new sql.Request(transaction);
      const existingRes = await selectReq
        .input('id', sql.UniqueIdentifier, authorProfileId)
        .query(`
          SELECT AuthorProfileId, UserId, VerificationStatus
          FROM dbo.AuthorProfiles WITH (UPDLOCK, ROWLOCK)
          WHERE AuthorProfileId = @id;
        `);

      if (existingRes.recordset.length === 0) {
        throw new Error('REQUEST_NOT_FOUND: Yêu cầu đăng ký bút danh không tồn tại.');
      }

      const existing = existingRes.recordset[0];
      if (existing.VerificationStatus !== 'PENDING') {
        throw new Error(
          `REQUEST_ALREADY_PROCESSED: Yêu cầu này đã được xử lý trước đó (trạng thái hiện tại: ${existing.VerificationStatus}). Không thể phê duyệt lại.`
        );
      }

      // 2. Update status to VERIFIED
      const updateReq = new sql.Request(transaction);
      const updateRes = await updateReq
        .input('id', sql.UniqueIdentifier, authorProfileId)
        .input('adminUserId', sql.UniqueIdentifier, adminUserId)
        .input('note', sql.NVarChar(sql.MAX), note?.trim() || null)
        .query(`
          UPDATE dbo.AuthorProfiles
          SET VerificationStatus = 'VERIFIED',
              VerificationNote = @note,
              ReviewedByUserId = @adminUserId,
              ReviewedAt = SYSUTCDATETIME(),
              UpdatedAt = SYSUTCDATETIME()
          OUTPUT inserted.*
          WHERE AuthorProfileId = @id;
        `);

      const updatedRecord: AuthorProfileRecord = updateRes.recordset[0];

      // 3. Grant AUTHOR role to the user in dbo.UserRoles if not exists
      const roleReq = new sql.Request(transaction);
      await roleReq
        .input('userId', sql.UniqueIdentifier, existing.UserId)
        .query(`
          INSERT INTO dbo.UserRoles (UserId, RoleId)
          SELECT @userId, RoleId
          FROM dbo.Roles
          WHERE Code = 'AUTHOR'
            AND NOT EXISTS (
              SELECT 1 FROM dbo.UserRoles WHERE UserId = @userId AND RoleId = Roles.RoleId
            );
        `);

      await transaction.commit();
      return updatedRecord;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async rejectAuthorRequest(
    authorProfileId: string,
    adminUserId: string,
    reason: string
  ): Promise<AuthorProfileRecord> {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Lock author profile row
      const selectReq = new sql.Request(transaction);
      const existingRes = await selectReq
        .input('id', sql.UniqueIdentifier, authorProfileId)
        .query(`
          SELECT AuthorProfileId, UserId, VerificationStatus
          FROM dbo.AuthorProfiles WITH (UPDLOCK, ROWLOCK)
          WHERE AuthorProfileId = @id;
        `);

      if (existingRes.recordset.length === 0) {
        throw new Error('REQUEST_NOT_FOUND: Yêu cầu đăng ký bút danh không tồn tại.');
      }

      const existing = existingRes.recordset[0];
      if (existing.VerificationStatus !== 'PENDING') {
        throw new Error(
          `REQUEST_ALREADY_PROCESSED: Yêu cầu này đã được xử lý trước đó (trạng thái hiện tại: ${existing.VerificationStatus}). Không thể từ chối lại.`
        );
      }

      // 2. Update status to REJECTED with note
      const updateReq = new sql.Request(transaction);
      const updateRes = await updateReq
        .input('id', sql.UniqueIdentifier, authorProfileId)
        .input('adminUserId', sql.UniqueIdentifier, adminUserId)
        .input('reason', sql.NVarChar(sql.MAX), reason.trim())
        .query(`
          UPDATE dbo.AuthorProfiles
          SET VerificationStatus = 'REJECTED',
              VerificationNote = @reason,
              ReviewedByUserId = @adminUserId,
              ReviewedAt = SYSUTCDATETIME(),
              UpdatedAt = SYSUTCDATETIME()
          OUTPUT inserted.*
          WHERE AuthorProfileId = @id;
        `);

      const updatedRecord: AuthorProfileRecord = updateRes.recordset[0];

      // 3. Remove AUTHOR role unless user has a valid redeemed invitation
      const roleReq = new sql.Request(transaction);
      await roleReq
        .input('userId', sql.UniqueIdentifier, existing.UserId)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM dbo.InvitationUses WHERE UserId = @userId)
          BEGIN
            DELETE ur
            FROM dbo.UserRoles ur
            JOIN dbo.Roles r ON ur.RoleId = r.RoleId
            WHERE ur.UserId = @userId AND r.Code = 'AUTHOR';
          END
        `);

      await transaction.commit();
      return updatedRecord;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}

export const authorProfileRepository = new AuthorProfileRepository();
