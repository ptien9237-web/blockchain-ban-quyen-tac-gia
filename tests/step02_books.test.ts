import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { app } from '../server/app.js';
import { closePool, getPool, sql } from '../server/db/sqlServer.js';

describe('BookChain Library — Step 02: Book Management & Digital Reading Foundation', () => {
  const ts = Date.now();

  const authorUser = {
    email: `author_step02_${ts}@bookchain-step02.test`,
    password: 'Password123!',
    displayName: 'Nguyen Du Author',
    penName: `Nguyen Du Pen_${ts}`,
  };

  const coAuthorUser = {
    email: `coauthor_step02_${ts}@bookchain-step02.test`,
    password: 'Password123!',
    displayName: 'Ho Xuan Huong',
    penName: `Ho Xuan Huong Pen_${ts}`,
  };

  const readerUser = {
    email: `reader_step02_${ts}@bookchain-step02.test`,
    password: 'Password123!',
    displayName: 'Reader Fan',
  };

  let authorToken = '';
  let authorCookie = '';
  let coAuthorToken = '';
  let coAuthorProfileId = '';
  let readerToken = '';
  let readerCookie = '';

  let createdBookId = '';
  let file1Id = '';
  let file2Id = '';
  let storageKey1 = '';
  let storageKey2 = '';
  let realFile1Sha256 = '';

  const samplePdfBytes = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Archival Test Book) >>\nendobj\ntrailer\n<<>>\n%%EOF');
  const samplePdfV2Bytes = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Archival Test Book V2) >>\nendobj\ntrailer\n<<>>\n%%EOF');

  beforeAll(async () => {
    await getPool();

    // 1. Register Author
    const resAuth = await request(app).post('/api/auth/register').send({
      email: authorUser.email,
      password: authorUser.password,
      displayName: authorUser.displayName,
    });
    expect(resAuth.status).toBe(201);

    const loginAuth = await request(app).post('/api/auth/login').send({
      email: authorUser.email,
      password: authorUser.password,
    });
    expect(loginAuth.status).toBe(200);
    authorToken = loginAuth.body.data.token;
    authorCookie = loginAuth.headers['set-cookie']?.[0] || '';

    // Register PenName to become AUTHOR
    const penRes = await request(app)
      .post('/api/users/author-profile')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ penName: authorUser.penName, bio: 'Classical poet & writer' });
    expect(penRes.status).toBe(200);

    // 2. Register Co-Author
    const resCo = await request(app).post('/api/auth/register').send({
      email: coAuthorUser.email,
      password: coAuthorUser.password,
      displayName: coAuthorUser.displayName,
    });
    expect(resCo.status).toBe(201);

    const loginCo = await request(app).post('/api/auth/login').send({
      email: coAuthorUser.email,
      password: coAuthorUser.password,
    });
    coAuthorToken = loginCo.body.data.token;

    const coPenRes = await request(app)
      .post('/api/users/author-profile')
      .set('Authorization', `Bearer ${coAuthorToken}`)
      .send({ penName: coAuthorUser.penName, bio: 'Eminent poetess' });
    expect(coPenRes.status).toBe(200);
    coAuthorProfileId = coPenRes.body.data.authorProfile.authorProfileId;

    // 3. Register Reader (No author profile)
    const resReader = await request(app).post('/api/auth/register').send({
      email: readerUser.email,
      password: readerUser.password,
      displayName: readerUser.displayName,
    });
    expect(resReader.status).toBe(201);

    const loginReader = await request(app).post('/api/auth/login').send({
      email: readerUser.email,
      password: readerUser.password,
    });
    readerToken = loginReader.body.data.token;
    readerCookie = loginReader.headers['set-cookie']?.[0] || '';
  });

  afterAll(async () => {
    try {
      const pool = await getPool();

      // Clean up storage files created during test
      if (storageKey1) {
        const p1 = path.resolve(process.cwd(), 'storage', 'books', storageKey1);
        if (fs.existsSync(p1)) fs.unlinkSync(p1);
      }
      if (storageKey2) {
        const p2 = path.resolve(process.cwd(), 'storage', 'books', storageKey2);
        if (fs.existsSync(p2)) fs.unlinkSync(p2);
      }

      // Cleanup SQL Server test data
      await pool
        .request()
        .input('emailPattern', sql.NVarChar(254), `%@bookchain-step02.test`)
        .query(`
          DECLARE @TestUserIds TABLE (UserId UNIQUEIDENTIFIER);
          INSERT INTO @TestUserIds (UserId)
          SELECT UserId FROM dbo.Users WHERE Email LIKE @emailPattern;

          DECLARE @TestBookIds TABLE (BookId UNIQUEIDENTIFIER);
          INSERT INTO @TestBookIds (BookId)
          SELECT DISTINCT ba.BookId
          FROM dbo.BookAuthors ba
          INNER JOIN dbo.AuthorProfiles ap ON ba.AuthorProfileId = ap.AuthorProfileId
          WHERE ap.UserId IN (SELECT UserId FROM @TestUserIds);

          DELETE FROM dbo.BookFiles WHERE BookId IN (SELECT BookId FROM @TestBookIds);
          DELETE FROM dbo.BookAuthors WHERE BookId IN (SELECT BookId FROM @TestBookIds);
          DELETE FROM dbo.Books WHERE BookId IN (SELECT BookId FROM @TestBookIds);

          DELETE FROM dbo.Sessions WHERE UserId IN (SELECT UserId FROM @TestUserIds);
          DELETE FROM dbo.UserRoles WHERE UserId IN (SELECT UserId FROM @TestUserIds);
          DELETE FROM dbo.AuthorProfiles WHERE UserId IN (SELECT UserId FROM @TestUserIds);
          DELETE FROM dbo.Users WHERE UserId IN (SELECT UserId FROM @TestUserIds);
        `);
    } catch (e) {
      console.warn('Cleanup error in Step 02 test:', e);
    }
  });

  describe('1. Book Creation & Author Ownership', () => {
    it('1.1. Rejects book creation when user has no Author Profile', async () => {
      const res = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${readerToken}`)
        .send({
          title: 'Unauthorized Book By Reader',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHOR_PROFILE_REQUIRED');
    });

    it('1.2. Rejects book creation with empty or missing title', async () => {
      const res = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          title: '   ',
          description: 'A book without title',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('1.3. Author successfully creates a new book in DRAFT status', async () => {
      const res = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          title: 'Truyện Kiều — Bản Khảo Dị Học Thuật',
          description: 'Công trình nghiên cứu và chú giải các văn bản Nôm cổ.',
          coverUrl: 'https://example.com/covers/kieu.jpg',
          languageCode: 'vi',
          publicationStatus: 'DRAFT',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookId).toBeDefined();
      expect(res.body.data.title).toBe('Truyện Kiều — Bản Khảo Dị Học Thuật');
      expect(res.body.data.publicationStatus).toBe('DRAFT');
      expect(res.body.data.authors).toHaveLength(1);
      expect(res.body.data.authors[0].contributionRole).toBe('PRIMARY_AUTHOR');
      expect(res.body.data.authors[0].displayOrder).toBe(1);

      createdBookId = res.body.data.bookId;
    });

    it('1.4. GET /api/books/my-books lists books for authenticated author', async () => {
      const res = await request(app)
        .get('/api/books/my-books')
        .set('Authorization', `Bearer ${authorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.some((b: any) => b.bookId === createdBookId)).toBe(true);
    });

    it('1.5. GET /api/books hides DRAFT books from public discovery', async () => {
      const res = await request(app).get('/api/books');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const found = res.body.data.some((b: any) => b.bookId === createdBookId);
      expect(found).toBe(false);
    });

    it('1.6. Prevents IDOR: Non-author cannot update book metadata', async () => {
      const res = await request(app)
        .put(`/api/books/${createdBookId}`)
        .set('Authorization', `Bearer ${readerToken}`)
        .send({
          title: 'Hacked Title By Reader',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('1.7. Author can update book metadata', async () => {
      const res = await request(app)
        .put(`/api/books/${createdBookId}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          title: 'Truyện Kiều — Khảo Dị & Chú Giải',
          description: 'Bản chú giải chuẩn mực cho thư viện số.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Truyện Kiều — Khảo Dị & Chú Giải');
    });
  });

  describe('2. Multi-Author Collaboration', () => {
    it('2.1. Author can add a valid co-author to book', async () => {
      const res = await request(app)
        .post(`/api/books/${createdBookId}/authors`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          authorProfileId: coAuthorProfileId,
          contributionRole: 'CO_AUTHOR',
          displayOrder: 2,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.authors).toHaveLength(2);
      expect(res.body.data.authors.some((a: any) => a.authorProfileId === coAuthorProfileId)).toBe(true);
    });

    it('2.2. Rejects adding a non-existent author profile', async () => {
      const res = await request(app)
        .post(`/api/books/${createdBookId}/authors`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          authorProfileId: '00000000-0000-0000-0000-000000000000',
          contributionRole: 'EDITOR',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('2.3. Author can publish the book, making it visible to public', async () => {
      const res = await request(app)
        .patch(`/api/books/${createdBookId}/status`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({ status: 'PUBLISHED' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.publicationStatus).toBe('PUBLISHED');
      expect(res.body.data.publishedAt).not.toBeNull();

      // Check public discovery now includes it
      const publicList = await request(app).get('/api/books');
      expect(publicList.body.data.some((b: any) => b.bookId === createdBookId)).toBe(true);
    });
  });

  describe('3. File Upload, Versioning & Real SHA-256 Calculation', () => {
    it('3.1. Rejects upload of executable or unsupported file extension', async () => {
      const res = await request(app)
        .post(`/api/books/${createdBookId}/files`)
        .set('Authorization', `Bearer ${authorToken}`)
        .attach('file', Buffer.from('malicious binary'), 'virus.exe');

      expect(res.status).toBe(400); // Invalid file format rejected with 400 Bad Request
      expect(res.body.success).toBe(false);
    });

    it('3.2. Author uploads Version 1 (PUBLIC_READ) and backend computes real SHA-256', async () => {
      // Pre-calculate expected SHA-256 from samplePdfBytes
      realFile1Sha256 = crypto.createHash('sha256').update(samplePdfBytes).digest('hex').toLowerCase();

      const res = await request(app)
        .post(`/api/books/${createdBookId}/files`)
        .set('Authorization', `Bearer ${authorToken}`)
        .field('accessLevel', 'PUBLIC_READ')
        .field('isCurrent', 'true')
        .attach('file', samplePdfBytes, 'truyen_kieu_v1.pdf');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.versionNumber).toBe(1);
      expect(res.body.data.isCurrent).toBe(true);
      expect(res.body.data.accessLevel).toBe('PUBLIC_READ');
      expect(res.body.data.sizeBytes).toBe(samplePdfBytes.length);
      // Verify SHA-256 matches actual byte hash
      expect(res.body.data.sha256).toBe(realFile1Sha256);

      file1Id = res.body.data.bookFileId;

      // Check database record directly
      const pool = await getPool();
      const dbFile = await pool.request().input('fId', sql.UniqueIdentifier, file1Id).query(
        'SELECT StorageKey, Sha256, IsCurrent FROM dbo.BookFiles WHERE BookFileId = @fId;'
      );
      storageKey1 = dbFile.recordset[0].StorageKey;
      expect(dbFile.recordset[0].Sha256.trim().toLowerCase()).toBe(realFile1Sha256);
      expect(dbFile.recordset[0].IsCurrent).toBe(true);
    });

    it('3.3. Author uploads Version 2: Version increments, previous version IsCurrent becomes false', async () => {
      const realFile2Sha256 = crypto.createHash('sha256').update(samplePdfV2Bytes).digest('hex').toLowerCase();

      const res = await request(app)
        .post(`/api/books/${createdBookId}/files`)
        .set('Authorization', `Bearer ${authorToken}`)
        .field('accessLevel', 'PUBLIC_DOWNLOAD')
        .field('isCurrent', 'true')
        .attach('file', samplePdfV2Bytes, 'truyen_kieu_v2.pdf');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.versionNumber).toBe(2);
      expect(res.body.data.isCurrent).toBe(true);
      expect(res.body.data.sha256).toBe(realFile2Sha256);

      file2Id = res.body.data.bookFileId;

      // Verify in DB that Version 1 is no longer current and Version 2 is current
      const pool = await getPool();
      const files = await pool.request().input('bookId', sql.UniqueIdentifier, createdBookId).query(
        'SELECT BookFileId, VersionNumber, IsCurrent, StorageKey FROM dbo.BookFiles WHERE BookId = @bookId ORDER BY VersionNumber ASC;'
      );

      expect(files.recordset).toHaveLength(2);
      expect(files.recordset[0].VersionNumber).toBe(1);
      expect(files.recordset[0].IsCurrent).toBe(false); // Version 1 updated to false
      expect(files.recordset[1].VersionNumber).toBe(2);
      expect(files.recordset[1].IsCurrent).toBe(true); // Version 2 is current

      storageKey2 = files.recordset[1].StorageKey;
    });

    it('3.4. GET /api/books/:id/files lists version history', async () => {
      const res = await request(app)
        .get(`/api/books/${createdBookId}/files`)
        .set('Authorization', `Bearer ${authorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].versionNumber).toBe(2);
      expect(res.body.data[1].versionNumber).toBe(1);
    });
  });

  describe('4. SHA-256 Verification & Tamper Detection', () => {
    it('4.1. Verifies authentic file on disk: status is MATCH', async () => {
      const res = await request(app)
        .get(`/api/books/${createdBookId}/files/${file1Id}/verify`)
        .set('Authorization', `Bearer ${authorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('MATCH');
      expect(res.body.data.matches).toBe(true);
      expect(res.body.data.fileExistsOnDisk).toBe(true);
      expect(res.body.data.recordedSha256).toBe(realFile1Sha256);
      expect(res.body.data.actualSha256).toBe(realFile1Sha256);
    });

    it('4.2. Tamper Detection: Changing 1 byte in physical file triggers MISMATCH', async () => {
      const filePath = path.resolve(process.cwd(), 'storage', 'books', storageKey1);
      expect(fs.existsSync(filePath)).toBe(true);

      // Alter 1 byte in the file
      const originalBytes = fs.readFileSync(filePath);
      const tamperedBytes = Buffer.from(originalBytes);
      tamperedBytes[0] = tamperedBytes[0] ^ 0xff; // Flip bits
      fs.writeFileSync(filePath, tamperedBytes);

      const res = await request(app)
        .get(`/api/books/${createdBookId}/files/${file1Id}/verify`)
        .set('Authorization', `Bearer ${authorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('MISMATCH');
      expect(res.body.data.matches).toBe(false);
      expect(res.body.data.actualSha256).not.toBe(realFile1Sha256);

      // Restore original file
      fs.writeFileSync(filePath, originalBytes);
    });

    it('4.3. POST /api/books/verify-hash verifies public hash across the registry', async () => {
      const res = await request(app)
        .post('/api/books/verify-hash')
        .send({ sha256: realFile1Sha256 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.found).toBe(true);
      expect(res.body.data.book.bookId).toBe(createdBookId);
      expect(res.body.data.integrityCheck.matches).toBe(true);
    });

    it('4.4. POST /api/books/verify-hash returns found: false for unknown hash', async () => {
      const res = await request(app)
        .post('/api/books/verify-hash')
        .send({ sha256: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.found).toBe(false);
    });
  });

  describe('5. Access Control for Reading & Downloading', () => {
    it('5.1. Unauthenticated or Reader can read stream of PUBLIC_READ file', async () => {
      const res = await request(app).get(`/api/books/${createdBookId}/files/${file1Id}/read`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['content-disposition']).toContain('inline');
    });

    it('5.2. Reader is FORBIDDEN from downloading original file if access level is PUBLIC_READ', async () => {
      const res = await request(app)
        .get(`/api/books/${createdBookId}/files/${file1Id}/download`)
        .set('Authorization', `Bearer ${readerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('5.3. Author CAN download original file even if access level is PUBLIC_READ', async () => {
      const res = await request(app)
        .get(`/api/books/${createdBookId}/files/${file1Id}/download`)
        .set('Authorization', `Bearer ${authorToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toContain('attachment');
    });

    it('5.4. Reader CAN download file when access level is PUBLIC_DOWNLOAD (Version 2)', async () => {
      const res = await request(app)
        .get(`/api/books/${createdBookId}/files/${file2Id}/download`)
        .set('Authorization', `Bearer ${readerToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toContain('attachment');
    });
  });
});
