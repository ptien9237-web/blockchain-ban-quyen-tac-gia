import { fileURLToPath } from 'url';
import { getPool } from '../db/sqlServer.js';
import { userRepository } from '../repositories/userRepository.js';
import { roleRepository } from '../repositories/roleRepository.js';
import { normalizeEmail } from '../utils/hash.js';

export interface BootstrapAdminResult {
  success: boolean;
  userId: string;
  email: string;
  displayName: string;
  roles: string[];
  message: string;
  alreadyAdmin: boolean;
}

/**
 * Safely grants the ADMIN role to an existing user in the database.
 * Does not expose passwords, tokens or secrets.
 * Idempotent: running multiple times for the same user will not duplicate role records.
 */
export async function bootstrapAdmin(rawEmail: string): Promise<BootstrapAdminResult> {
  if (!rawEmail || typeof rawEmail !== 'string' || rawEmail.trim().length === 0) {
    throw new Error('Email address is required to bootstrap an admin user.');
  }

  const emailNormalized = normalizeEmail(rawEmail);
  const user = await userRepository.findByEmailNormalized(emailNormalized);

  if (!user) {
    throw new Error(
      `User with email [${rawEmail.trim()}] not found. Please register the account first before bootstrapping.`
    );
  }

  const pool = await getPool();

  // 1. Ensure ADMIN role exists in dbo.Roles
  const roleCheck = await pool
    .request()
    .input('code', 'ADMIN')
    .query('SELECT RoleId, Code FROM dbo.Roles WHERE Code = @code');

  if (roleCheck.recordset.length === 0) {
    throw new Error("System error: Role 'ADMIN' does not exist in dbo.Roles.");
  }

  const adminRoleId = roleCheck.recordset[0].RoleId;

  // 2. Check if user already has ADMIN role
  const existingRole = await pool
    .request()
    .input('userId', user.UserId)
    .input('roleId', adminRoleId)
    .query('SELECT 1 FROM dbo.UserRoles WHERE UserId = @userId AND RoleId = @roleId');

  let alreadyAdmin = false;
  if (existingRole.recordset.length > 0) {
    alreadyAdmin = true;
  } else {
    // 3. Grant ADMIN role
    await pool
      .request()
      .input('userId', user.UserId)
      .input('roleId', adminRoleId)
      .input('grantedByUserId', user.UserId) // Self-bootstrap audit reference
      .query(`
        INSERT INTO dbo.UserRoles (UserId, RoleId, GrantedByUserId, GrantedAt)
        VALUES (@userId, @roleId, @grantedByUserId, SYSUTCDATETIME())
      `);
  }

  const currentRoles = await roleRepository.getRolesForUser(user.UserId);

  return {
    success: true,
    userId: user.UserId,
    email: user.Email,
    displayName: user.DisplayName,
    roles: currentRoles,
    alreadyAdmin,
    message: alreadyAdmin
      ? `User [${user.Email}] is already an ADMIN. No duplicate assigned.`
      : `User [${user.Email}] has been successfully granted the ADMIN role.`,
  };
}

async function main() {
  const emailArg = process.argv[2];
  if (!emailArg) {
    console.log('===============================================================');
    console.log('BOOKCHAIN LIBRARY - ADMIN BOOTSTRAP CLI');
    console.log('===============================================================');
    console.log('Usage: npx tsx server/scripts/bootstrapAdmin.ts <user-email>');
    console.log('Example: npx tsx server/scripts/bootstrapAdmin.ts admin@bookchain.io');
    console.log('---------------------------------------------------------------');
    process.exit(1);
  }

  try {
    const result = await bootstrapAdmin(emailArg);
    console.log('===============================================================');
    console.log('ADMIN BOOTSTRAP RESULT: SUCCESS');
    console.log('===============================================================');
    console.log(`User ID:      ${result.userId}`);
    console.log(`Email:        ${result.email}`);
    console.log(`Display Name: ${result.displayName}`);
    console.log(`Roles:        ${result.roles.join(', ')}`);
    console.log(`Status:       ${result.message}`);
    console.log('===============================================================');
    process.exit(0);
  } catch (err: any) {
    console.error('===============================================================');
    console.error('ADMIN BOOTSTRAP ERROR:');
    console.error(err.message || err);
    console.error('===============================================================');
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
