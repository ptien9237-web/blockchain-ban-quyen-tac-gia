import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/app.js';
import { getPool } from '../server/db/sqlServer.js';
import { bootstrapAdmin } from '../server/scripts/bootstrapAdmin.js';

describe('Step 07 — Pen Name Approval Flow & RBAC Verification', () => {
  const domain = 'step07-approval.test';

  const adminEmail = `admin_${Date.now()}@${domain}`;
  const reader1Email = `reader1_${Date.now()}@${domain}`;
  const reader2Email = `reader2_${Date.now()}@${domain}`;
  const regularUserEmail = `reguser_${Date.now()}@${domain}`;
  const password = 'SecurePassword#2026!';

  let adminToken = '';
  let reader1Token = '';
  let reader2Token = '';
  let regularUserToken = '';

  let adminUserId = '';
  let reader1UserId = '';
  let reader2UserId = '';
  let regularUserId = '';

  let reader1ProfileId = '';
  let reader2ProfileId = '';
  const createdBookIds: string[] = [];

  beforeAll(async () => {
    // 1. Register Admin User
    const adminReg = await request(app).post('/api/auth/register').send({
      email: adminEmail,
      password,
      displayName: 'System Admin Approver',
    });
    adminUserId = adminReg.body.data.userId;

    // 2. Register Reader 1 (will be approved)
    const r1Reg = await request(app).post('/api/auth/register').send({
      email: reader1Email,
      password,
      displayName: 'Reader Approval Candidate',
    });
    reader1UserId = r1Reg.body.data.userId;

    // 3. Register Reader 2 (will be rejected)
    const r2Reg = await request(app).post('/api/auth/register').send({
      email: reader2Email,
      password,
      displayName: 'Reader Rejection Candidate',
    });
    reader2UserId = r2Reg.body.data.userId;

    // 4. Register Regular User (no author profile, for testing RBAC)
    const ruReg = await request(app).post('/api/auth/register').send({
      email: regularUserEmail,
      password,
      displayName: 'Regular Reader Only',
    });
    regularUserId = ruReg.body.data.userId;

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

    // Login Regular User
    const ruLogin = await request(app).post('/api/auth/login').send({
      email: regularUserEmail,
      password,
    });
    regularUserToken = ruLogin.body.data.token;
  });

  afterAll(async () => {
    const pool = await getPool();
    // Delete any created books
    if (createdBookIds.length > 0) {
      const idsStr = createdBookIds.map((id) => `'${id}'`).join(',');
      await pool.request().query(`
        DELETE FROM dbo.BookFiles WHERE BookId IN (${idsStr});
        DELETE FROM dbo.BookAuthors WHERE BookId IN (${idsStr});
        DELETE FROM dbo.Books WHERE BookId IN (${idsStr});
      `);
    }

    // Clean up test users, profiles, roles, sessions
    await pool.request().query(`
      DELETE FROM dbo.Sessions WHERE UserId IN ('${adminUserId}', '${reader1UserId}', '${reader2UserId}', '${regularUserId}');
      DELETE FROM dbo.UserRoles WHERE UserId IN ('${adminUserId}', '${reader1UserId}', '${reader2UserId}', '${regularUserId}');
      DELETE FROM dbo.AuthorProfiles WHERE UserId IN ('${adminUserId}', '${reader1UserId}', '${reader2UserId}', '${regularUserId}');
      DELETE FROM dbo.Users WHERE UserId IN ('${adminUserId}', '${reader1UserId}', '${reader2UserId}', '${regularUserId}');
    `);
  });

  // =========================================================================
  // TEST SUITE: AUTHOR REGISTRATION & ADMIN APPROVAL FLOW
  // =========================================================================

  describe('1. Author Registration & Initial PENDING State', () => {
    it('1.1. Regular user without author profile cannot create books (403 AUTHOR_PROFILE_REQUIRED)', async () => {
      const createRes = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          title: 'Sách Của Độc Giả Chưa Có Bút Danh',
          isbn: '978-0000000001',
          category: 'FICTION',
          primaryLanguage: 'vi',
          synopsis: 'Thử đăng sách khi chưa có hồ sơ tác giả.',
        });

      expect(createRes.status).toBe(403);
      expect(createRes.body.success).toBe(false);
      expect(createRes.body.error.code).toBe('AUTHOR_PROFILE_REQUIRED');
    });

    it('1.2. Reader 1 registers a pen name -> profile is PENDING', async () => {
      const regRes = await request(app)
        .post('/api/users/author-profile')
        .set('Authorization', `Bearer ${reader1Token}`)
        .send({
          penName: 'Nhà Văn Nam Cao Số',
          bio: 'Chuyên sáng tác các tác phẩm hiện thực phê phán số.',
        });

      expect(regRes.status).toBe(200);
      expect(regRes.body.success).toBe(true);
      expect(regRes.body.data.authorProfile).toBeDefined();
      expect(regRes.body.data.authorProfile.penName).toBe('Nhà Văn Nam Cao Số');
      expect(regRes.body.data.authorProfile.verificationStatus).toBe('PENDING');

      reader1ProfileId = regRes.body.data.authorProfile.authorProfileId;
      expect(reader1ProfileId).toBeDefined();
    });

    it('1.3. Reader 1 registration appears in Admin author requests list', async () => {
      const listRes = await request(app)
        .get('/api/admin/author-requests?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);
      expect(listRes.body.data.items).toBeDefined();

      const found = listRes.body.data.items.find(
        (r: any) => r.authorProfileId === reader1ProfileId
      );
      expect(found).toBeDefined();
      expect(found.penName).toBe('Nhà Văn Nam Cao Số');
      expect(found.userEmail).toBe(reader1Email);
      expect(found.verificationStatus).toBe('PENDING');
      expect(found.createdAt).toBeDefined();
    });
  });

  describe('2. RBAC & Security Enforcement on Admin Endpoints', () => {
    it('2.1. Anonymous request to list author requests is rejected (401)', async () => {
      const res = await request(app).get('/api/admin/author-requests');
      expect(res.status).toBe(401);
    });

    it('2.2. Non-admin user cannot access GET /api/admin/author-requests (403)', async () => {
      const res = await request(app)
        .get('/api/admin/author-requests')
        .set('Authorization', `Bearer ${reader1Token}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('2.3. Non-admin user cannot approve author request (403)', async () => {
      const res = await request(app)
        .post(`/api/admin/author-requests/${reader1ProfileId}/approve`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({ note: 'Tự duyệt trái phép' });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('2.4. Non-admin user cannot reject author request (403)', async () => {
      const res = await request(app)
        .post(`/api/admin/author-requests/${reader1ProfileId}/reject`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({ reason: 'Từ chối trái phép' });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('3. Admin Approves Request -> Status & Role Synchronization', () => {
    it('3.1. Admin approves Reader 1 request with an audit note', async () => {
      const approveRes = await request(app)
        .post(`/api/admin/author-requests/${reader1ProfileId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: 'Hồ sơ đạt tiêu chuẩn sáng tác số, duyệt cấp quyền Tác giả.' });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.success).toBe(true);
      expect(approveRes.body.data.verificationStatus).toBe('VERIFIED');
      expect(approveRes.body.data.verificationNote).toBe(
        'Hồ sơ đạt tiêu chuẩn sáng tác số, duyệt cấp quyền Tác giả.'
      );
      expect(approveRes.body.data.reviewedAt).toBeDefined();
    });

    it('3.2. Reader 1 profile reflects VERIFIED status and audit fields', async () => {
      const profileRes = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${reader1Token}`);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.data.authorProfile.verificationStatus).toBe('VERIFIED');
      expect(profileRes.body.data.authorProfile.verificationNote).toBe(
        'Hồ sơ đạt tiêu chuẩn sáng tác số, duyệt cấp quyền Tác giả.'
      );
      expect(profileRes.body.data.authorProfile.reviewedAt).toBeDefined();

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${reader1Token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.roles).toContain('AUTHOR');
    });

    it('3.3. Reader 1 can successfully create a new book as an approved Author', async () => {
      const createRes = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${reader1Token}`)
        .send({
          title: 'Hồi Ký Số Một: Hành Trình Blockchain',
          isbn: '978-0000000099',
          category: 'NON_FICTION',
          primaryLanguage: 'vi',
          synopsis: 'Tác phẩm đầu tay của tác giả sau khi được admin phê duyệt bút danh.',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data.bookId).toBeDefined();
      createdBookIds.push(createRes.body.data.bookId);
    });

    it('3.4. Idempotency Guard: Re-approving an already approved request returns 400 REQUEST_ALREADY_PROCESSED', async () => {
      const res = await request(app)
        .post(`/api/admin/author-requests/${reader1ProfileId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: 'Cố gắng duyệt lần 2' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('REQUEST_ALREADY_PROCESSED');
    });

    it('3.5. Idempotency Guard: Rejecting an already approved request returns 400 REQUEST_ALREADY_PROCESSED', async () => {
      const res = await request(app)
        .post(`/api/admin/author-requests/${reader1ProfileId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Cố gắng từ chối sau khi đã duyệt' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('REQUEST_ALREADY_PROCESSED');
    });
  });

  describe('4. Admin Rejects Request -> Status & Permission Denial', () => {
    it('4.1. Reader 2 registers a pen name', async () => {
      const regRes = await request(app)
        .post('/api/users/author-profile')
        .set('Authorization', `Bearer ${reader2Token}`)
        .send({
          penName: 'Bút Danh Vi Phạm Bản Quyền',
          bio: 'Tôi muốn dùng tên nhà văn nổi tiếng.',
        });

      expect(regRes.status).toBe(200);
      expect(regRes.body.data.authorProfile.verificationStatus).toBe('PENDING');
      reader2ProfileId = regRes.body.data.authorProfile.authorProfileId;
    });

    it('4.2. Admin rejects request with mandatory reason', async () => {
      // Rejection without reason should fail validation
      const invalidRes = await request(app)
        .post(`/api/admin/author-requests/${reader2ProfileId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(invalidRes.status).toBe(400);
      expect(invalidRes.body.error.code).toBe('VALIDATION_ERROR');

      // Rejection with valid reason
      const rejectRes = await request(app)
        .post(`/api/admin/author-requests/${reader2ProfileId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Bút danh trùng với thương hiệu và tác giả đã có bản quyền bảo hộ.' });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.success).toBe(true);
      expect(rejectRes.body.data.verificationStatus).toBe('REJECTED');
      expect(rejectRes.body.data.verificationNote).toBe(
        'Bút danh trùng với thương hiệu và tác giả đã có bản quyền bảo hộ.'
      );
    });

    it('4.3. Reader 2 profile shows REJECTED and AUTHOR role is revoked', async () => {
      const profileRes = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${reader2Token}`);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.data.authorProfile.verificationStatus).toBe('REJECTED');
      expect(profileRes.body.data.authorProfile.verificationNote).toBe(
        'Bút danh trùng với thương hiệu và tác giả đã có bản quyền bảo hộ.'
      );

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${reader2Token}`);

      expect(meRes.body.data.roles).not.toContain('AUTHOR');
    });

    it('4.4. Reader 2 cannot create book after rejection (403 AUTHOR_PROFILE_REJECTED)', async () => {
      const createRes = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${reader2Token}`)
        .send({
          title: 'Sách Của Tài Khoản Bị Từ Chối',
          isbn: '978-0000000088',
          category: 'FICTION',
          primaryLanguage: 'vi',
          synopsis: 'Không thể đăng sách khi hồ sơ bị từ chối.',
        });

      expect(createRes.status).toBe(403);
      expect(createRes.body.success).toBe(false);
      expect(createRes.body.error.code).toBe('AUTHOR_PROFILE_REJECTED');
    });

    it('4.5. Idempotency Guard: Re-rejecting or approving an already rejected request returns 400', async () => {
      const resReject = await request(app)
        .post(`/api/admin/author-requests/${reader2ProfileId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Từ chối lần 2' });

      expect(resReject.status).toBe(400);
      expect(resReject.body.error.code).toBe('REQUEST_ALREADY_PROCESSED');

      const resApprove = await request(app)
        .post(`/api/admin/author-requests/${reader2ProfileId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: 'Thử duyệt hồ sơ đã từ chối' });

      expect(resApprove.status).toBe(400);
      expect(resApprove.body.error.code).toBe('REQUEST_ALREADY_PROCESSED');
    });
  });

  describe('5. Resubmission & Listing Filters', () => {
    it('5.1. Reader 2 can update profile to re-submit with new pen name -> resets to PENDING', async () => {
      const resubmitRes = await request(app)
        .post('/api/users/author-profile')
        .set('Authorization', `Bearer ${reader2Token}`)
        .send({
          penName: 'Tác Giả Hợp Lệ Sáng Tạo Mới',
          bio: 'Hồ sơ đã được sửa lại đúng theo tiêu chuẩn.',
        });

      expect(resubmitRes.status).toBe(200);
      expect(resubmitRes.body.data.authorProfile.penName).toBe('Tác Giả Hợp Lệ Sáng Tạo Mới');
      expect(resubmitRes.body.data.authorProfile.verificationStatus).toBe('PENDING');
      expect(resubmitRes.body.data.authorProfile.verificationNote).toBeNull();
    });

    it('5.2. Admin filters author requests by status and searches by keyword', async () => {
      // Filter status=PENDING
      const pendingRes = await request(app)
        .get('/api/admin/author-requests?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(pendingRes.status).toBe(200);
      const pendingFound = pendingRes.body.data.items.find(
        (r: any) => r.authorProfileId === reader2ProfileId
      );
      expect(pendingFound).toBeDefined();
      expect(pendingFound.verificationStatus).toBe('PENDING');

      // Filter status=VERIFIED
      const verifiedRes = await request(app)
        .get('/api/admin/author-requests?status=VERIFIED')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(verifiedRes.status).toBe(200);
      const verifiedFound = verifiedRes.body.data.items.find(
        (r: any) => r.authorProfileId === reader1ProfileId
      );
      expect(verifiedFound).toBeDefined();
      expect(verifiedFound.verificationStatus).toBe('VERIFIED');

      // Search keyword
      const searchRes = await request(app)
        .get(`/api/admin/author-requests?search=${encodeURIComponent('Nam Cao Số')}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(searchRes.body.data.items[0].penName).toContain('Nam Cao Số');
    });
  });
});
