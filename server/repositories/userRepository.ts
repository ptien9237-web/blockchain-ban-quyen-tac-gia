import { getPool, sql } from '../db/sqlServer.js';
import type { UserRecord, UserStatus } from '../types/index.js';

export class UserRepository {
  async createUser(params: {
    email: string;
    emailNormalized: string;
    passwordHash: string;
    displayName: string;
    avatarUrl?: string | null;
    status?: UserStatus;
  }): Promise<UserRecord> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('email', sql.NVarChar(254), params.email)
      .input('emailNormalized', sql.NVarChar(254), params.emailNormalized)
      .input('passwordHash', sql.NVarChar(255), params.passwordHash)
      .input('displayName', sql.NVarChar(100), params.displayName)
      .input('avatarUrl', sql.NVarChar(500), params.avatarUrl || null)
      .input('status', sql.VarChar(20), params.status || 'ACTIVE')
      .query(`
        INSERT INTO dbo.Users (
          Email,
          EmailNormalized,
          PasswordHash,
          DisplayName,
          AvatarUrl,
          Status,
          CreatedAt,
          UpdatedAt
        )
        OUTPUT inserted.*
        VALUES (
          @email,
          @emailNormalized,
          @passwordHash,
          @displayName,
          @avatarUrl,
          @status,
          SYSUTCDATETIME(),
          SYSUTCDATETIME()
        );
      `);

    return result.recordset[0];
  }

  async findByEmailNormalized(emailNormalized: string): Promise<UserRecord | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('emailNormalized', sql.NVarChar(254), emailNormalized)
      .query('SELECT * FROM dbo.Users WHERE EmailNormalized = @emailNormalized');

    return result.recordset[0] || null;
  }

  async findById(userId: string): Promise<UserRecord | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query('SELECT * FROM dbo.Users WHERE UserId = @userId');

    return result.recordset[0] || null;
  }

  async updateProfile(
    userId: string,
    data: { displayName?: string; avatarUrl?: string | null }
  ): Promise<UserRecord | null> {
    const pool = await getPool();
    const updates: string[] = ['UpdatedAt = SYSUTCDATETIME()'];
    const request = pool.request().input('userId', sql.UniqueIdentifier, userId);

    if (data.displayName !== undefined) {
      updates.push('DisplayName = @displayName');
      request.input('displayName', sql.NVarChar(100), data.displayName);
    }
    if (data.avatarUrl !== undefined) {
      updates.push('AvatarUrl = @avatarUrl');
      request.input('avatarUrl', sql.NVarChar(500), data.avatarUrl);
    }

    const query = `
      UPDATE dbo.Users
      SET ${updates.join(', ')}
      OUTPUT inserted.*
      WHERE UserId = @userId;
    `;

    const result = await request.query(query);
    return result.recordset[0] || null;
  }

  async updateLastLogin(userId: string): Promise<void> {
    const pool = await getPool();
    await pool
      .request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query(`
        UPDATE dbo.Users
        SET LastLoginAt = SYSUTCDATETIME(),
            UpdatedAt = SYSUTCDATETIME()
        WHERE UserId = @userId;
      `);
  }
}

export const userRepository = new UserRepository();
