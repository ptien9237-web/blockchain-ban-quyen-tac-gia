import { getPool, sql } from '../db/sqlServer.js';
import type { SessionRecord } from '../types/index.js';

export class SessionRepository {
  async createSession(params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<SessionRecord> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('userId', sql.UniqueIdentifier, params.userId)
      .input('tokenHash', sql.NVarChar(255), params.tokenHash)
      .input('expiresAt', sql.DateTime2(3), params.expiresAt)
      .query(`
        INSERT INTO dbo.Sessions (
          UserId,
          TokenHash,
          ExpiresAt,
          CreatedAt,
          LastUsedAt
        )
        OUTPUT inserted.*
        VALUES (
          @userId,
          @tokenHash,
          @expiresAt,
          SYSUTCDATETIME(),
          SYSUTCDATETIME()
        );
      `);

    return result.recordset[0];
  }

  async findActiveByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('tokenHash', sql.NVarChar(255), tokenHash)
      .query(`
        SELECT *
        FROM dbo.Sessions
        WHERE TokenHash = @tokenHash
          AND RevokedAt IS NULL
          AND ExpiresAt > SYSUTCDATETIME();
      `);

    return result.recordset[0] || null;
  }

  async findActiveById(sessionId: string): Promise<SessionRecord | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('sessionId', sql.UniqueIdentifier, sessionId)
      .query(`
        SELECT *
        FROM dbo.Sessions
        WHERE SessionId = @sessionId
          AND RevokedAt IS NULL
          AND ExpiresAt > SYSUTCDATETIME();
      `);

    return result.recordset[0] || null;
  }

  async revokeSession(sessionId: string): Promise<void> {
    const pool = await getPool();
    await pool
      .request()
      .input('sessionId', sql.UniqueIdentifier, sessionId)
      .query(`
        UPDATE dbo.Sessions
        SET RevokedAt = SYSUTCDATETIME()
        WHERE SessionId = @sessionId;
      `);
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    const pool = await getPool();
    await pool
      .request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query(`
        UPDATE dbo.Sessions
        SET RevokedAt = SYSUTCDATETIME()
        WHERE UserId = @userId
          AND RevokedAt IS NULL;
      `);
  }

  async touchSession(sessionId: string): Promise<void> {
    const pool = await getPool();
    await pool
      .request()
      .input('sessionId', sql.UniqueIdentifier, sessionId)
      .query(`
        UPDATE dbo.Sessions
        SET LastUsedAt = SYSUTCDATETIME()
        WHERE SessionId = @sessionId;
      `);
  }
}

export const sessionRepository = new SessionRepository();
