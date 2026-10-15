import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { ethers } from 'ethers';
import { app } from '../server/app.js';
import { getPool, closePool } from '../server/db/sqlServer.js';
import { bootstrapAdmin } from '../server/scripts/bootstrapAdmin.js';
import { BookCopyrightRegistryAbi } from '../src/contracts/BookCopyrightRegistry.js';
import deployedAddresses from '../src/contracts/deployedAddresses.json';
import { sha256ToBytes32, uuidToBytes32 } from '../src/utils/blockchain.js';
import { blockchainClient } from '../server/blockchain/contractClient.js';

describe('BookChain Library — Step 05: Dispute Management, On-Chain Resolution & Circuit Breaker', () => {
  const ts = Date.now();
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const contractAddress = blockchainClient.contractAddress;
  const hardhatRegistrarSigner = new ethers.Wallet(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    provider
  );
  const contractWithRegistrar = new ethers.Contract(
    contractAddress,
    BookCopyrightRegistryAbi,
    hardhatRegistrarSigner
  );

  const adminEmail = `admin_step05_${ts}@bookchain.test`;
  const authorEmail = `author_step05_${ts}@bookchain.test`;
  const reporterEmail = `reporter_step05_${ts}@bookchain.test`;
  const otherUserEmail = `other_step05_${ts}@bookchain.test`;
  const password = 'Step05Password#2026!';

  let adminToken = '';
  let authorToken = '';
  let reporterToken = '';
  let otherUserToken = '';

  let createdBookId = '';
  let createdFileId = '';
  let fileSha256 = '';
  let copyrightRecordId = '';
  let sampleReportId = '';

  const testFileContent = Buffer.from(
    `Truyen Kieu — Heritage Masterpiece (Dispute Specimen Timestamp: ${ts})\n` +
      `Tram nam trong coi nguoi ta, Chu tai chu menh kheo la ghet nhau.`
  );

  beforeAll(async () => {
    await getPool();

    // Ensure contract starts in unpaused state
    try {
      if (await contractWithRegistrar.paused()) {
        const hex = await provider.send('eth_getTransactionCount', [hardhatRegistrarSigner.address, 'latest']);
        const unpauseTx = await contractWithRegistrar.unpause({ nonce: parseInt(hex, 16) });
        await unpauseTx.wait(1);
      }
    } catch {
      // ignore
    }

    // 1. Register & Bootstrap Admin
    const adminReg = await request(app).post('/api/auth/register').send({
      email: adminEmail,
      password,
      displayName: 'Step 05 Admin Overseer',
    });
    expect(adminReg.status).toBe(201);
    await bootstrapAdmin(adminEmail);
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: adminEmail,
      password,
    });
    adminToken = adminLogin.body.data.token;

    // 2. Register Author
    const authorReg = await request(app).post('/api/auth/register').send({
      email: authorEmail,
      password,
      displayName: 'Nguyen Du Author',
    });
    expect(authorReg.status).toBe(201);
    const authorLogin = await request(app).post('/api/auth/login').send({
      email: authorEmail,
      password,
    });
    authorToken = authorLogin.body.data.token;
    await request(app)
      .post('/api/users/author-profile')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ penName: `Nguyen Du Pen_${ts}`, bio: 'Great national poet' });

    // 3. Register Reporter
    const reporterReg = await request(app).post('/api/auth/register').send({
      email: reporterEmail,
      password,
      displayName: 'Reader Reporter',
    });
    expect(reporterReg.status).toBe(201);
    const reporterLogin = await request(app).post('/api/auth/login').send({
      email: reporterEmail,
      password,
    });
    reporterToken = reporterLogin.body.data.token;

    // 4. Register Other User
    const otherReg = await request(app).post('/api/auth/register').send({
      email: otherUserEmail,
      password,
      displayName: 'Casual Observer',
    });
    expect(otherReg.status).toBe(201);
    const otherLogin = await request(app).post('/api/auth/login').send({
      email: otherUserEmail,
      password,
    });
    otherUserToken = otherLogin.body.data.token;

    // 5. Create a Book & Upload File
    const bookRes = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        title: `Doan Truong Tan Thanh — Rare Edition (${ts})`,
        description: 'Epic poem registered for blockchain copyright dispute testing.',
        languageCode: 'vi',
      });
    expect(bookRes.status).toBe(201);
    createdBookId = bookRes.body.data.bookId;

    const uploadRes = await request(app)
      .post(`/api/books/${createdBookId}/files`)
      .set('Authorization', `Bearer ${authorToken}`)
      .attach('file', testFileContent, `kieu_specimen_${ts}.txt`)
      .field('accessLevel', 'PUBLIC_READ');
    expect(uploadRes.status).toBe(201);
    createdFileId = uploadRes.body.data.bookFileId;
    fileSha256 = uploadRes.body.data.sha256.toLowerCase();

    // 6. Prepare Copyright
    const authorWallet = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Hardhat Account #1
    const prepareRes = await request(app)
      .post('/api/copyright/prepare')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        bookId: createdBookId,
        bookFileId: createdFileId,
        authorWallet,
      });
    expect(prepareRes.status).toBe(200);
    const preparedData = prepareRes.body.data;
    copyrightRecordId = preparedData.copyrightRecordId;

    // 7. Register on-chain
    const tx = await contractWithRegistrar.registerCopyright(
      preparedData.recordIdBytes32,
      preparedData.bookIdBytes32,
      preparedData.versionNumber,
      preparedData.contentHashBytes32,
      preparedData.authorWallet,
      preparedData.metadataUri
    );
    const receipt = await tx.wait();

    // 8. Sync with backend API
    const syncRes = await request(app)
      .post('/api/copyright/sync')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        copyrightRecordId,
        txHash: receipt.hash,
      });
    expect(syncRes.status).toBe(200);
  });

  afterAll(async () => {
    // Ensure contract is unpaused if left paused
    try {
      if (await blockchainClient.isPaused()) {
        await blockchainClient.unpause();
      }
    } catch {
      // ignore
    }
    await closePool();
  });

  describe('1. Report Submission & Validation (User Facing)', () => {
    it('rejects unauthenticated report submissions with 401', async () => {
      const res = await request(app).post('/api/reports').send({
        bookId: createdBookId,
        reason: 'PLAGIARISM',
        description: 'Unauthorized copy of ancient poetic verses.',
      });
      expect(res.status).toBe(401);
    });

    it('rejects report submission with missing targetId or invalid reason with 400', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          reason: 'INVALID_REASON',
          description: 'This is invalid.',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects report submission with description shorter than 10 characters', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          bookId: createdBookId,
          reason: 'PLAGIARISM',
          description: 'Short',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('allows authenticated reader to submit a valid infringement report', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          bookId: createdBookId,
          copyrightRecordId,
          reason: 'PLAGIARISM',
          description:
            'This publication copies original stanzas without proper attribution or royalty allocation.',
        });

      if (res.status !== 201) {
        console.error('SUBMIT REPORT ERROR:', res.status, JSON.stringify(res.body));
      }

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reportId).toBeDefined();
      expect(res.body.data.status).toBe('OPEN');
      expect(res.body.data.reason).toBe('PLAGIARISM');

      sampleReportId = res.body.data.reportId;
    });

    it('allows authenticated reader to view their own reports list', async () => {
      const res = await request(app)
        .get('/api/reports/my-reports')
        .set('Authorization', `Bearer ${reporterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((r: any) => r.reportId === sampleReportId)).toBe(true);
    });

    it('allows reporter to view details of their filed report', async () => {
      const res = await request(app)
        .get(`/api/reports/${sampleReportId}`)
        .set('Authorization', `Bearer ${reporterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reportId).toBe(sampleReportId);
      expect(res.body.data.bookId).toBe(createdBookId);
      expect(res.body.data.actions).toBeDefined();
    });

    it('forbids other non-admin users from viewing another user report', async () => {
      const res = await request(app)
        .get(`/api/reports/${sampleReportId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('2. Admin Dispute Management & Audit Actions', () => {
    it('forbids non-admin users from accessing admin reports endpoints', async () => {
      const resList = await request(app)
        .get('/api/admin/reports')
        .set('Authorization', `Bearer ${reporterToken}`);
      expect(resList.status).toBe(403);

      const resAction = await request(app)
        .post(`/api/admin/reports/${sampleReportId}/actions`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          action: 'NOTE',
          note: 'Unauthorized attempt to inspect note',
        });
      expect(resAction.status).toBe(403);

      const resDispute = await request(app)
        .post(`/api/admin/reports/${sampleReportId}/dispute-onchain`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          actionType: 'DISPUTE',
          reason: 'Unauthorized on-chain dispute attempt',
        });
      expect(resDispute.status).toBe(403);
    });

    it('allows admin to list all reports with filtering and pagination', async () => {
      const res = await request(app)
        .get('/api/admin/reports?status=OPEN&page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('allows admin to add an investigation note and update report status', async () => {
      const res = await request(app)
        .post(`/api/admin/reports/${sampleReportId}/actions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'START_REVIEW',
          note: 'Legal department is reviewing historical archive rights.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.action).toBe('START_REVIEW');
    });

    it('reflects audit action in report details timeline', async () => {
      const res = await request(app)
        .get(`/api/admin/reports/${sampleReportId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('IN_REVIEW');
      expect(res.body.data.actions.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.actions.some((a: any) => a.note?.includes('Legal department'))).toBe(true);
    });
  });

  describe('3. On-Chain Dispute Lifecycle (Dispute -> Resolve Active -> Revoke)', () => {
    it('executes on-chain DISPUTE action and transitions contract & DB record to DISPUTED', async () => {
      const res = await request(app)
        .post(`/api/admin/reports/${sampleReportId}/dispute-onchain`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          actionType: 'DISPUTE',
          reason: 'Formal legal dispute filed regarding poetic ownership rights.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.newStatus).toBe('DISPUTED');
      expect(res.body.data.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      // Verify on-chain state via direct contract query
      const recordBytes32 = uuidToBytes32(copyrightRecordId);
      const onChainRecord = await contractWithRegistrar.getCopyright(recordBytes32);
      expect(Number(onChainRecord.status)).toBe(1); // 1 = CopyrightStatus.DISPUTED

      // Verify via public verification API
      const verifyRes = await request(app).get(`/api/copyright/verify/${fileSha256}`);
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.onChain.status).toBe('DISPUTED');
      expect(verifyRes.body.data.database.recordStatus).toBe('DISPUTED');
    });

    it('executes on-chain RESOLVE_ACTIVE action and restores status to ON_CHAIN (0)', async () => {
      const res = await request(app)
        .post(`/api/admin/reports/${sampleReportId}/dispute-onchain`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          actionType: 'RESOLVE_ACTIVE',
          reason: 'Legal review verified author originality. Restoring active status.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.newStatus).toBe('ON_CHAIN');
      expect(res.body.data.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      // Verify on-chain state via direct contract query
      const recordBytes32 = uuidToBytes32(copyrightRecordId);
      const onChainRecord = await contractWithRegistrar.getCopyright(recordBytes32);
      expect(Number(onChainRecord.status)).toBe(0); // 0 = CopyrightStatus.ACTIVE

      // Verify via public verification API
      const verifyRes = await request(app).get(`/api/copyright/verify/${fileSha256}`);
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.onChain.status).toBe('ACTIVE');
      expect(verifyRes.body.data.database.recordStatus).toBe('ON_CHAIN');
    });

    it('executes on-chain RESOLVE_REVOKE action and sets status to WITHDRAWN / REVOKED (2)', async () => {
      const res = await request(app)
        .post(`/api/admin/reports/${sampleReportId}/dispute-onchain`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          actionType: 'RESOLVE_REVOKE',
          reason: 'Confirmed severe plagiarism infringement. Certificate revoked permanently.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.newStatus).toBe('WITHDRAWN');
      expect(res.body.data.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      // Verify on-chain state via direct contract query
      const recordBytes32 = uuidToBytes32(copyrightRecordId);
      const onChainRecord = await contractWithRegistrar.getCopyright(recordBytes32);
      expect(Number(onChainRecord.status)).toBe(2); // 2 = CopyrightStatus.REVOKED

      // Verify via public verification API
      const verifyRes = await request(app).get(`/api/copyright/verify/${fileSha256}`);
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.onChain.status).toBe('REVOKED');
      expect(verifyRes.body.data.database.recordStatus).toBe('WITHDRAWN');

      // Check report status is updated to RESOLVED
      const reportRes = await request(app)
        .get(`/api/admin/reports/${sampleReportId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(reportRes.body.data.status).toBe('RESOLVED');
    });
  });

  describe('4. Governance & Emergency Circuit Breaker (Pause/Unpause)', () => {
    it('forbids non-admin users from accessing circuit breaker controls', async () => {
      const resGet = await request(app)
        .get('/api/admin/circuit-breaker')
        .set('Authorization', `Bearer ${reporterToken}`);
      expect(resGet.status).toBe(403);

      const resPost = await request(app)
        .post('/api/admin/circuit-breaker')
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({ paused: true });
      expect(resPost.status).toBe(403);
    });

    it('allows admin to query circuit breaker status', async () => {
      const res = await request(app)
        .get('/api/admin/circuit-breaker')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.paused).toBe('boolean');
    });

    it('allows admin to activate circuit breaker (pause) and blocks new registrations', async () => {
      const pauseRes = await request(app)
        .post('/api/admin/circuit-breaker')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ paused: true });

      expect(pauseRes.status).toBe(200);
      expect(pauseRes.body.success).toBe(true);
      expect(pauseRes.body.data.paused).toBe(true);

      const isPaused = await contractWithRegistrar.paused();
      expect(isPaused).toBe(true);

      // Attempting to register copyright while paused must revert
      const dummyRecordIdBytes32 = uuidToBytes32(crypto.randomUUID());
      const dummyBookIdBytes32 = uuidToBytes32(crypto.randomUUID());
      const dummyFileHashBytes32 = ethers.keccak256(ethers.toUtf8Bytes('circuit_breaker_test'));
      await expect(
        contractWithRegistrar.registerCopyright.staticCall(
          dummyRecordIdBytes32,
          dummyBookIdBytes32,
          1,
          dummyFileHashBytes32,
          '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          'ipfs://dummy'
        )
      ).rejects.toThrow();
    });

    it('allows admin to deactivate circuit breaker (unpause) and restores normal operations', async () => {
      const unpauseRes = await request(app)
        .post('/api/admin/circuit-breaker')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ paused: false });

      expect(unpauseRes.status).toBe(200);
      expect(unpauseRes.body.success).toBe(true);
      expect(unpauseRes.body.data.paused).toBe(false);

      const isPaused = await contractWithRegistrar.paused();
      expect(isPaused).toBe(false);
    });
  });
});
