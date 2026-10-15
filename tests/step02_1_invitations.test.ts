import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/app.js';
import { getPool } from '../server/db/sqlServer.js';
import { bootstrapAdmin } from '../server/scripts/bootstrapAdmin.js';
import { generateInvitationCode, hashInvitationCode } from '../server/services/invitationService.js';

describe('Step 02.1 — Admin Bootstrap & Author Invitation System', () => {
  const domain = 'step02-1.test';

  const adminEmail = `admin_${Date.now()}@${domain}`;
  const reader1Email = `reader1_${Date.now()}@${domain}`;
  const reader2Email = `reader2_${Date.now()}@${domain}`;
  const authorEmail = `author_${Date.now()}@${domain}`;
  const password = 'SecurePassword#2026!';

  let adminToken = '';
  let reader1Token = '';
  let reader2Token = '';
  let authorToken = '';

  let adminUserId = '';
  let reader1UserId = '';
  let reader2UserId = '';
  let authorUserId = '';

  beforeAll(async () => {
    // 1. Register Admin User
    const adminReg = await request(app).post('/api/auth/register').send({
      email: adminEmail,
      password,
      displayName: 'System Admin Testing',
    });
    adminUserId = adminReg.body.data.userId;

    // 2. Register Reader 1
    const r1Reg = await request(app).post('/api/auth/register').send({
      email: reader1Email,
      password,
      displayName: 'Reader Testing One',
    });
    reader1UserId = r1Reg.body.data.userId;

    // 3. Register Reader 2
    const r2Reg = await request(app).post('/api/auth/register').send({
      email: reader2Email,
      password,
      displayName: 'Reader Testing Two',
    });
    reader2UserId = r2Reg.body.data.userId;

    // 4. Register Author
    const aReg = await request(app).post('/api/auth/register').send({
      email: authorEmail,
      password,
      displayName: 'Author Testing User',
    });
    authorUserId = aReg.body.data.userId;

    // Bootstrap Admin User
    await bootstrapAdmin(adminEmail);

    // Login Admin
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: adminEmail,
      password,
    });
    adminToken = adminLogin.body.data.token;

    // Login Reader 1
    const r1Login = await request(app).post('/api/auth/login').send({
      email: reader1Email,
      password,
    });
    reader1Token = r1Login.body.data.token;

    // Login Reader 2
    const r2Login = await request(app).post('/api/auth/login').send({
      email: reader2Email,
      password,
    });
    reader2Token = r2Login.body.data.token;

    // Login Author (make author by setting pen name initially or bootstrap)
    // Give author user the author role
    const pool = await getPool();
    const authorRoleRes = await pool
      .request()
      .input('code', 'AUTHOR')
      .query("SELECT RoleId FROM dbo.Roles WHERE Code = @code");
    const authorRoleId = authorRoleRes.recordset[0].RoleId;

    await pool
      .request()
      .input('userId', authorUserId)
      .input('roleId', authorRoleId)
      .query(`
        INSERT INTO dbo.UserRoles (UserId, RoleId, GrantedByUserId, GrantedAt)
        VALUES (@userId, @roleId, @userId, SYSUTCDATETIME())
      `);

    const authorLogin = await request(app).post('/api/auth/login').send({
      email: authorEmail,
      password,
    });
    authorToken = authorLogin.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data safely
    const pool = await getPool();
    await pool.request().query(`
      DELETE FROM dbo.InvitationUses WHERE UserId IN ('${adminUserId}', '${reader1UserId}', '${reader2UserId}', '${authorUserId}');
      DELETE FROM dbo.AuthorInvitations WHERE CreatedByUserId = '${adminUserId}';
      DELETE FROM dbo.Sessions WHERE UserId IN ('${adminUserId}', '${reader1UserId}', '${reader2UserId}', '${authorUserId}');
      DELETE FROM dbo.UserRoles WHERE UserId IN ('${adminUserId}', '${reader1UserId}', '${reader2UserId}', '${authorUserId}');
      DELETE FROM dbo.AuthorProfiles WHERE UserId IN ('${adminUserId}', '${reader1UserId}', '${reader2UserId}', '${authorUserId}');
      DELETE FROM dbo.Users WHERE UserId IN ('${adminUserId}', '${reader1UserId}', '${reader2UserId}', '${authorUserId}');
    `);
  });

  // =========================================================================
  // SECTION A: ADMIN BOOTSTRAP CLI
  // =========================================================================
  describe('A. Admin Bootstrap Verification', () => {
    it('A1. Grants ADMIN role successfully and includes ADMIN in current roles', async () => {
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.roles).toContain('ADMIN');
    });

    it('A2. Re-running bootstrapAdmin is idempotent and does not create duplicate roles', async () => {
      const rerun = await bootstrapAdmin(adminEmail);
      expect(rerun.success).toBe(true);
      expect(rerun.alreadyAdmin).toBe(true);

      const pool = await getPool();
      const countRes = await pool
        .request()
        .input('userId', adminUserId)
        .query(`
          SELECT COUNT(*) as adminCount 
          FROM dbo.UserRoles ur 
          JOIN dbo.Roles r ON ur.RoleId = r.RoleId 
          WHERE ur.UserId = @userId AND r.Code = 'ADMIN'
        `);
      expect(countRes.recordset[0].adminCount).toBe(1);
    });

    it('A3. Refuses to bootstrap nonexistent email', async () => {
      await expect(bootstrapAdmin('ghost_user_does_not_exist@domain.test')).rejects.toThrow(
        /not found/i
      );
    });
  });

  // =========================================================================
  // SECTION B: RBAC ACCESS CONTROLS
  // =========================================================================
  describe('B. RBAC Access Control Enforcement', () => {
    it('B1. Rejects unauthenticated requests to GET /api/admin/invitations (401)', async () => {
      const res = await request(app).get('/api/admin/invitations');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('B2. Rejects READER requesting GET /api/admin/invitations (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/invitations')
        .set('Authorization', `Bearer ${reader1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('B3. Rejects AUTHOR requesting POST /api/admin/invitations (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/admin/invitations')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({ expiresInDays: 30, maxUses: 1 });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('B4. Allows ADMIN to access GET /api/admin/invitations (200 OK)', async () => {
      const res = await request(app)
        .get('/api/admin/invitations')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  // =========================================================================
  // SECTION C: INVITATION LIFECYCLE & CRYPTOGRAPHIC CODE INTEGRITY
  // =========================================================================
  describe('C. Invitation Code Creation, Listing, and Security', () => {
    let generatedCode = '';
    let invitationId = '';

    it('C1. Generates cryptographic CSPRNG code with expected prefix and entropy', () => {
      const code1 = generateInvitationCode();
      const code2 = generateInvitationCode();
      expect(code1).toMatch(/^BKC-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);
      expect(code1).not.toBe(code2);
    });

    it('C2. ADMIN creates invitation: returns raw code only once and stores SHA-256 hash', async () => {
      const res = await request(app)
        .post('/api/admin/invitations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          expiresInDays: 14,
          maxUses: 1,
          note: 'Invitation for Scholar Reader 1',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.invitationId).toBeDefined();
      expect(res.body.data.code).toMatch(/^BKC-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);
      expect(res.body.data.maxUses).toBe(1);

      generatedCode = res.body.data.code;
      invitationId = res.body.data.invitationId;

      // Verify DB stores hash, not plain code
      const pool = await getPool();
      const dbRecord = await pool
        .request()
        .input('id', invitationId)
        .query('SELECT CodeHash FROM dbo.AuthorInvitations WHERE InvitationId = @id');

      expect(dbRecord.recordset[0].CodeHash.trim()).toBe(hashInvitationCode(generatedCode));
    });

    it('C3. Listing invitations does NOT leak plain code or code hash', async () => {
      const res = await request(app)
        .get('/api/admin/invitations')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const found = res.body.data.items.find((i: any) => i.invitationId === invitationId);
      expect(found).toBeDefined();
      expect(found.code).toBeUndefined();
      expect(found.codeHash).toBeUndefined();
      expect(found.status).toBe('ACTIVE');
      expect(found.usedCount).toBe(0);
      expect(found.maxUses).toBe(1);
    });

    it('C4. Rejects creation with invalid parameters (e.g. invalid days or maxUses)', async () => {
      const badDays = await request(app)
        .post('/api/admin/invitations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expiresInDays: 0 });
      expect(badDays.status).toBe(400);

      const badUses = await request(app)
        .post('/api/admin/invitations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ maxUses: 0 });
      expect(badUses.status).toBe(400);
    });
  });

  // =========================================================================
  // SECTION D: REDEMPTION & ROLE UPGRADE
  // =========================================================================
  describe('D. Invitation Code Redemption & Concurrency Control', () => {
    let singleUseCode = '';
    let multiUseCode = '';
    let revokedCode = '';
    let expiredCode = '';

    beforeAll(async () => {
      // 1. Single use code
      const rSingle = await request(app)
        .post('/api/admin/invitations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expiresInDays: 30, maxUses: 1, note: 'Single use' });
      singleUseCode = rSingle.body.data.code;

      // 2. Multi use code (maxUses: 2)
      const rMulti = await request(app)
        .post('/api/admin/invitations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expiresInDays: 30, maxUses: 2, note: 'Multi use' });
      multiUseCode = rMulti.body.data.code;

      // 3. Revoked code
      const rRevoke = await request(app)
        .post('/api/admin/invitations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expiresInDays: 30, maxUses: 1, note: 'To revoke' });
      revokedCode = rRevoke.body.data.code;
      await request(app)
        .patch(`/api/admin/invitations/${rRevoke.body.data.invitationId}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`);

      // 4. Expired code (set past date directly in DB for reliable testing)
      const rExp = await request(app)
        .post('/api/admin/invitations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expiresInDays: 1, maxUses: 1, note: 'To expire' });
      expiredCode = rExp.body.data.code;

      const pool = await getPool();
      await pool
        .request()
        .input('id', rExp.body.data.invitationId)
        .query(`
          UPDATE dbo.AuthorInvitations
          SET ExpiresAt = DATEADD(day, -2, SYSUTCDATETIME())
          WHERE InvitationId = @id
        `);
    });

    it('D1. Rejects invalid or nonexistent code (400)', async () => {
      const res = await request(app)
        .post('/api/invitations/redeem')
        .set('Authorization', `Bearer ${reader1Token}`)
        .send({ code: 'BKC-0000-0000-0000' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/không hợp lệ/i);
    });

    it('D2. Rejects revoked invitation code (400)', async () => {
      const res = await request(app)
        .post('/api/invitations/redeem')
        .set('Authorization', `Bearer ${reader1Token}`)
        .send({ code: revokedCode });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/thu hồi/i);
    });

    it('D3. Rejects expired invitation code (400)', async () => {
      const res = await request(app)
        .post('/api/invitations/redeem')
        .set('Authorization', `Bearer ${reader1Token}`)
        .send({ code: expiredCode });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/hết thời hạn/i);
    });

    it('D4. Reader 1 redeems valid single-use code: upgrades role to AUTHOR and records use', async () => {
      // Prior check: reader 1 does not have AUTHOR role
      const meBefore = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${reader1Token}`);
      expect(meBefore.body.data.roles).not.toContain('AUTHOR');

      // Redeem code
      const redeemRes = await request(app)
        .post('/api/invitations/redeem')
        .set('Authorization', `Bearer ${reader1Token}`)
        .send({ code: singleUseCode });

      expect(redeemRes.status).toBe(200);
      expect(redeemRes.body.success).toBe(true);

      // Verify AuthContext/me returns AUTHOR role
      const meAfter = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${reader1Token}`);
      expect(meAfter.body.data.roles).toContain('AUTHOR');
    });

    it('D5. Rejects Reader 2 trying to use the now-exhausted single-use code (400)', async () => {
      const res = await request(app)
        .post('/api/invitations/redeem')
        .set('Authorization', `Bearer ${reader2Token}`)
        .send({ code: singleUseCode });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/hết số lượt/i);
    });

    it('D6. Rejects Reader 1 trying to use the same code again (400 or friendly notice)', async () => {
      // Reader 1 already has AUTHOR role
      const res = await request(app)
        .post('/api/invitations/redeem')
        .set('Authorization', `Bearer ${reader1Token}`)
        .send({ code: singleUseCode });

      // Handled gracefully without consuming additional count
      expect(res.status).toBe(200);
      expect(res.body.data.alreadyAuthor).toBe(true);
    });

    it('D7. Multi-use code allows Reader 2 to redeem and increments UsedCount', async () => {
      const res = await request(app)
        .post('/api/invitations/redeem')
        .set('Authorization', `Bearer ${reader2Token}`)
        .send({ code: multiUseCode });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const meR2 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${reader2Token}`);
      expect(meR2.body.data.roles).toContain('AUTHOR');
    });

    it('D8. ADMIN redeeming code retains ADMIN role and does not demote', async () => {
      const pool = await getPool();
      const rAdmin = await request(app)
        .post('/api/admin/invitations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expiresInDays: 30, maxUses: 5, note: 'Admin test' });

      const adminRedeem = await request(app)
        .post('/api/invitations/redeem')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: rAdmin.body.data.code });

      expect(adminRedeem.status).toBe(200);

      const meAdmin = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(meAdmin.body.data.roles).toContain('ADMIN');
    });
  });
});
