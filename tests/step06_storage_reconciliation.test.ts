import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { app } from '../server/app.js';
import { getPool, closePool } from '../server/db/sqlServer.js';
import { bootstrapAdmin } from '../server/scripts/bootstrapAdmin.js';
import {
  IpfsStorageProvider,
  computeIpfsCid,
} from '../server/services/storage/ipfsStorageProvider.js';
import { StorageManager } from '../server/services/storage/storageManager.js';
import { LocalStorageProvider } from '../server/services/storage/localStorageProvider.js';

describe('BookChain Library — Phase 4 & 5: Storage (IPFS/Local) & Blockchain Reconciliation', () => {
  const ts = Date.now();
  const adminEmail = `admin_recon_${ts}@bookchain.test`;
  const authorEmail = `author_recon_${ts}@bookchain.test`;
  const password = 'ReconPassword#2026!';

  let adminToken = '';
  let authorToken = '';
  let authorProfileId = '';
  let testBookId = '';

  const testTempDir = path.resolve(process.cwd(), 'storage', 'test_ipfs_' + ts);

  beforeAll(async () => {
    // 1. Create Admin
    await request(app)
      .post('/api/auth/register')
      .send({
        email: adminEmail,
        password,
        displayName: 'Recon Admin',
      });

    await bootstrapAdmin(adminEmail);

    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password });
    adminToken = adminLoginRes.body.data.token;

    // 2. Register Author
    const authorRegRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: authorEmail,
        password,
        displayName: 'Recon Author',
      });
    expect(authorRegRes.status).toBe(201);

    const authorLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: authorEmail, password });
    authorToken = authorLoginRes.body.data.token;

    const profileRes = await request(app)
      .post('/api/users/author-profile')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        penName: 'Recon PenName',
        bio: 'Storage & Recon Tester',
      });
    authorProfileId = profileRes.body.data.authorProfileId;

    // 3. Create a test book
    const bookRes = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        title: `Storage & Reconciliation Test Book ${ts}`,
        description: 'Comprehensive test for IPFS storage and blockchain sync reconciliation',
        primaryAuthorProfileId: authorProfileId,
      });
    testBookId = bookRes.body.data.bookId;
  });

  afterAll(async () => {
    // Clean up temporary test storage folder
    if (fs.existsSync(testTempDir)) {
      fs.rmSync(testTempDir, { recursive: true, force: true });
    }
    await closePool();
  });

  describe('1. Cryptographic IPFS CID & IpfsStorageProvider', () => {
    it('should compute canonical Base58 IPFS CIDv0 correctly', () => {
      const sampleText = Buffer.from('BookChain Library IPFS Content Test', 'utf-8');
      const cid = computeIpfsCid(sampleText);

      expect(cid).toBeDefined();
      expect(typeof cid).toBe('string');
      expect(cid.startsWith('Qm')).toBe(true);
      expect(cid.length).toBe(46);
    });

    it('should save, retrieve stream, and verify hash using IpfsStorageProvider', async () => {
      const ipfsProvider = new IpfsStorageProvider({ localCacheDir: testTempDir });
      const testContent = Buffer.from(`Testing IPFS archival storage bytes at timestamp ${Date.now()}`);
      const expectedSha256 = crypto.createHash('sha256').update(testContent).digest('hex').toLowerCase();

      // 1. Save file
      const result = await ipfsProvider.saveFile(testContent, 'archival_test.pdf', 'application/pdf');
      expect(result.storageProvider).toBe('IPFS');
      expect(result.storageKey.startsWith('ipfs://Qm')).toBe(true);
      expect(result.sha256).toBe(expectedSha256);
      expect(result.sizeBytes).toBe(testContent.length);

      // 2. Check existence
      const exists = await ipfsProvider.fileExists(result.storageKey);
      expect(exists).toBe(true);

      // 3. Verify hash
      const hashVerify = await ipfsProvider.verifyFileHash(result.storageKey, expectedSha256);
      expect(hashVerify.fileExists).toBe(true);
      expect(hashVerify.matches).toBe(true);
      expect(hashVerify.actualSha256).toBe(expectedSha256);

      // 4. Verify mismatched hash detection
      const wrongVerify = await ipfsProvider.verifyFileHash(result.storageKey, '0000000000000000000000000000000000000000000000000000000000000000');
      expect(wrongVerify.matches).toBe(false);

      // 5. Read stream
      const stream = await ipfsProvider.getFileStream(result.storageKey);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const streamBuffer = Buffer.concat(chunks);
      expect(streamBuffer.toString()).toBe(testContent.toString());

      // 6. Delete file
      await ipfsProvider.deleteFile(result.storageKey);
      const existsAfter = await ipfsProvider.fileExists(result.storageKey);
      expect(existsAfter).toBe(false);
    });
  });

  describe('2. Unified StorageManager (Local & IPFS)', () => {
    it('should delegate to Local or IPFS depending on preference', async () => {
      const local = new LocalStorageProvider(path.join(testTempDir, 'local'));
      const ipfs = new IpfsStorageProvider({ localCacheDir: path.join(testTempDir, 'ipfs') });
      const manager = new StorageManager(local, ipfs, 'LOCAL');

      const sample = Buffer.from('Dual storage dispatcher verification');

      // Save via LOCAL
      const localRes = await manager.saveFile(sample, 'test.pdf', 'application/pdf', 'LOCAL');
      expect(localRes.storageProvider).toBe('LOCAL');
      expect(localRes.storageKey).not.toContain('ipfs://');

      // Save via IPFS
      const ipfsRes = await manager.saveFile(sample, 'test.pdf', 'application/pdf', 'IPFS');
      expect(ipfsRes.storageProvider).toBe('IPFS');
      expect(ipfsRes.storageKey.startsWith('ipfs://')).toBe(true);

      // Verify hash via manager
      const checkLocal = await manager.verifyFileHash(localRes.storageKey, localRes.sha256, 'LOCAL');
      expect(checkLocal.matches).toBe(true);

      const checkIpfs = await manager.verifyFileHash(ipfsRes.storageKey, ipfsRes.sha256, 'IPFS');
      expect(checkIpfs.matches).toBe(true);
    });
  });

  describe('3. File Upload with IPFS Provider Support in API', () => {
    it('should allow uploading a book version with storageProvider = IPFS', async () => {
      const fileBytes = Buffer.from('%PDF-1.4 Mock Archival PDF Content on IPFS');

      const uploadRes = await request(app)
        .post(`/api/books/${testBookId}/files`)
        .set('Authorization', `Bearer ${authorToken}`)
        .field('accessLevel', 'PUBLIC_READ')
        .field('storageProvider', 'IPFS')
        .attach('file', fileBytes, 'archival_edition.pdf');

      expect(uploadRes.status).toBe(201);
      expect(uploadRes.body.success).toBe(true);
      expect(uploadRes.body.data.storageProvider).toBe('IPFS');
      expect(uploadRes.body.data.versionNumber).toBe(1);
      expect(uploadRes.body.data.sha256).toBeDefined();

      // Verify reading stream
      const readRes = await request(app)
        .get(`/api/books/${testBookId}/files/${uploadRes.body.data.bookFileId}/read`)
        .set('Authorization', `Bearer ${authorToken}`);

      expect(readRes.status).toBe(200);
      expect(readRes.body.toString()).toBe(fileBytes.toString());

      // Verify integrity endpoint
      const integrityRes = await request(app)
        .get(`/api/books/${testBookId}/files/${uploadRes.body.data.bookFileId}/verify`)
        .set('Authorization', `Bearer ${authorToken}`);

      expect(integrityRes.status).toBe(200);
      expect(integrityRes.body.data.status).toBe('MATCH');
      expect(integrityRes.body.data.matches).toBe(true);
    });
  });

  describe('4. Blockchain Reconciliation Endpoint (POST /api/copyright/reconcile)', () => {
    it('should reject unauthenticated calls to reconcile', async () => {
      const res = await request(app).post('/api/copyright/reconcile').send();
      expect(res.status).toBe(401);
    });

    it('should successfully execute reconciliation and return report summary', async () => {
      const res = await request(app)
        .post('/api/copyright/reconcile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(typeof res.body.data.scannedCount).toBe('number');
      expect(typeof res.body.data.reconciledCount).toBe('number');
      expect(Array.isArray(res.body.data.details)).toBe(true);
    });
  });

  describe('5. Scripts & Network Configuration Validation', () => {
    it('should verify grantRole.cjs script exists and exports correct syntax', () => {
      const scriptPath = path.resolve(process.cwd(), 'scripts', 'grantRole.cjs');
      expect(fs.existsSync(scriptPath)).toBe(true);
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('REGISTRAR_ROLE');
      expect(content).toContain('grantRole');
    });

    it('should verify hardhat.config.cjs configures both hardhat, localhost and sepolia', () => {
      const configPath = path.resolve(process.cwd(), 'hardhat.config.cjs');
      const content = fs.readFileSync(configPath, 'utf-8');
      expect(content).toContain('31337');
      expect(content).toContain('11155111');
      expect(content).toContain('etherscan');
    });
  });
});
