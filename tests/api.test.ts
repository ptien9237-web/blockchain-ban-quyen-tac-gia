import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/app.js';
import { closePool, getPool, sql } from '../server/db/sqlServer.js';

describe('BookChain Library API Integration Tests (Step 01)', () => {
  const timestamp = Date.now();
  const testUser = {
    email: `reader_${timestamp}@bookchain.test`,
    password: 'Password123!',
    displayName: 'Nguyen Van Reader',
  };

  let authToken = '';
  let authCookie = '';
  let userId = '';

  beforeAll(async () => {
    // Verify DB connectivity
    await getPool();
  });

  afterAll(async () => {
    // Cleanup test data from SQL Server database
    try {
      const pool = await getPool();
      await pool
        .request()
        .input('emailPattern', sql.NVarChar(254), `%_${timestamp}@bookchain.test`)
        .query(`
          DECLARE @TestUserIds TABLE (UserId UNIQUEIDENTIFIER);
          INSERT INTO @TestUserIds (UserId)
          SELECT UserId FROM dbo.Users WHERE Email LIKE @emailPattern;

          DELETE FROM dbo.Sessions WHERE UserId IN (SELECT UserId FROM @TestUserIds);
          DELETE FROM dbo.UserRoles WHERE UserId IN (SELECT UserId FROM @TestUserIds);
          DELETE FROM dbo.AuthorProfiles WHERE UserId IN (SELECT UserId FROM @TestUserIds);
          DELETE FROM dbo.Users WHERE UserId IN (SELECT UserId FROM @TestUserIds);
        `);
    } catch (e) {
      console.warn('Cleanup error:', e);
    }
    await closePool();
  });

  // Test 1: Health check endpoint
  it('1. GET /api/health returns healthy database status without leaking secrets', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.database.connected).toBe(true);
    expect(res.body.data.database.databaseName).toBe('BookChainLibrary');
    // Ensure no password or sensitive connection string is returned
    expect(res.body.data.database.password).toBeUndefined();
    expect(res.body.data.database.connectionString).toBeUndefined();
  });

  // Test 2: Register with missing fields
  it('2. POST /api/auth/register rejects missing fields or invalid email', async () => {
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({ email: '', password: 'Password123!', displayName: 'Test' });
    expect(res1.status).toBe(400);
    expect(res1.body.success).toBe(false);

    const res2 = await request(app)
      .post('/api/auth/register')
      .send({ email: 'invalid-email-format', password: 'Password123!', displayName: 'Test' });
    expect(res2.status).toBe(400);
    expect(res2.body.success).toBe(false);

    const res3 = await request(app)
      .post('/api/auth/register')
      .send({ email: 'valid@test.com', password: 'short', displayName: 'Test' });
    expect(res3.status).toBe(400);
    expect(res3.body.success).toBe(false);
  });

  // Test 3: Register valid user
  it('3. POST /api/auth/register registers user, hashes password, assigns default role READER', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ...testUser,
        role: 'ADMIN', // Client tries to supply ADMIN role
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email);
    expect(res.body.data.displayName).toBe(testUser.displayName);
    expect(res.body.data.roles).toContain('READER');
    // Security check: Client MUST NOT become ADMIN by passing role in body
    expect(res.body.data.roles).not.toContain('ADMIN');
    // Security check: PasswordHash MUST NOT be returned in response
    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.PasswordHash).toBeUndefined();
    expect(res.body.data.passwordHash).toBeUndefined();

    userId = res.body.data.userId;
    expect(userId).toBeDefined();
  });

  // Test 4: Duplicate email rejected
  it('4. POST /api/auth/register rejects duplicate normalized email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `  ${testUser.email.toUpperCase()}  `, // Test normalization
        password: 'AnotherPassword123!',
        displayName: 'Imposter',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  // Test 5: Login with wrong password
  it('5. POST /api/auth/login rejects incorrect password with generic error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  // Test 6: Login with correct credentials
  it('6. POST /api/auth/login succeeds, sets HttpOnly cookie and returns valid token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.roles).toContain('READER');
    expect(res.body.data.token).toBeDefined();

    authToken = res.body.data.token;
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    authCookie = Array.isArray(cookies) ? cookies.find((c) => c.startsWith('bookchain_token')) || '' : '';
    expect(authCookie).toContain('HttpOnly');
  });

  // Test 7: Protected API rejects unauthenticated calls
  it('7. GET /api/auth/me rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  // Test 8: Protected API with valid token or cookie
  it('8. GET /api/auth/me returns current authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBe(userId);
    expect(res.body.data.email).toBe(testUser.email);
    expect(res.body.data.displayName).toBe(testUser.displayName);
    expect(res.body.data.roles).toContain('READER');
  });

  // Test 9: Update profile allows modifying displayName & avatarUrl
  it('9. PUT /api/users/profile allows updating displayName and avatarUrl', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        displayName: 'Nguyen Van Updated',
        avatarUrl: 'https://example.com/avatar.png',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.displayName).toBe('Nguyen Van Updated');
    expect(res.body.data.avatarUrl).toBe('https://example.com/avatar.png');
  });

  // Test 10: Register author profile grants AUTHOR role
  it('10. POST /api/users/author-profile registers pen name and grants AUTHOR role', async () => {
    const res = await request(app)
      .post('/api/users/author-profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        penName: 'Archival Scholar NV',
        bio: 'Researcher in digital archival systems.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.roles).toContain('AUTHOR');
    expect(res.body.data.authorProfile.penName).toBe('Archival Scholar NV');
    expect(res.body.data.authorProfile.verificationStatus).toBe('PENDING');
  });

  // Test 11: RBAC guard enforces role access
  it('11. RBAC correctly allows author endpoint but forbids admin endpoint for regular user', async () => {
    // Public endpoint: always allowed
    const publicRes = await request(app).get('/api/test/public');
    expect(publicRes.status).toBe(200);

    // Reader endpoint: allowed
    const readerRes = await request(app)
      .get('/api/test/reader-only')
      .set('Authorization', `Bearer ${authToken}`);
    expect(readerRes.status).toBe(200);

    // Author endpoint: allowed because user registered as author
    const authorRes = await request(app)
      .get('/api/test/author-only')
      .set('Authorization', `Bearer ${authToken}`);
    expect(authorRes.status).toBe(200);

    // Admin endpoint: forbidden! User does not have ADMIN role
    const adminRes = await request(app)
      .get('/api/test/admin-only')
      .set('Authorization', `Bearer ${authToken}`);
    expect(adminRes.status).toBe(403);
    expect(adminRes.body.success).toBe(false);
    expect(adminRes.body.error.code).toBe('FORBIDDEN');
  });

  // Test 12: Logout revokes session
  it('12. POST /api/auth/logout revokes session in database', async () => {
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${authToken}`);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // After logout, token must be rejected because session is revoked in dbo.Sessions
    const checkRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(checkRes.status).toBe(401);
    expect(checkRes.body.error.code).toBe('SESSION_REVOKED');
  });

  // Test 13: Library books public endpoint
  it('13. GET /api/books returns published books metadata without authentication', async () => {
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
