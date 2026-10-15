import { getPool, sql } from '../db/sqlServer.js';
import type { RoleCode, RoleRecord } from '../types/index.js';

export class RoleRepository {
  async getRoleByCode(code: RoleCode): Promise<RoleRecord | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('code', sql.VarChar(30), code)
      .query('SELECT RoleId, Code, Name, Description FROM dbo.Roles WHERE Code = @code');

    return result.recordset[0] || null;
  }

  async getRolesForUser(userId: string): Promise<RoleCode[]> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT r.Code
        FROM dbo.UserRoles ur
        INNER JOIN dbo.Roles r ON ur.RoleId = r.RoleId
        WHERE ur.UserId = @userId
      `);

    return result.recordset.map((row) => row.Code as RoleCode);
  }

  async assignRoleToUser(
    userId: string,
    roleCode: RoleCode,
    grantedByUserId?: string
  ): Promise<void> {
    const pool = await getPool();
    const role = await this.getRoleByCode(roleCode);
    if (!role) {
      throw new Error(`Role ${roleCode} not found in database.`);
    }

    const request = pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .input('roleId', sql.Int, role.RoleId);

    if (grantedByUserId) {
      request.input('grantedByUserId', sql.UniqueIdentifier, grantedByUserId);
    } else {
      request.input('grantedByUserId', sql.UniqueIdentifier, null);
    }

    await request.query(`
      IF NOT EXISTS (SELECT 1 FROM dbo.UserRoles WHERE UserId = @userId AND RoleId = @roleId)
      BEGIN
        INSERT INTO dbo.UserRoles (UserId, RoleId, GrantedByUserId, GrantedAt)
        VALUES (@userId, @roleId, @grantedByUserId, SYSUTCDATETIME());
      END;
    `);
  }
}

export const roleRepository = new RoleRepository();
