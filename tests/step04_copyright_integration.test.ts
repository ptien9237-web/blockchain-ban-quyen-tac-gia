import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { ethers } from 'ethers';
import { app } from '../server/app.js';
import { getPool, closePool } from '../server/db/sqlServer.js';
import { BookCopyrightRegistryAbi } from '../src/contracts/BookCopyrightRegistry.js';
import deployedAddresses from '../src/contracts/deployedAddresses.json';
import { sha256ToBytes32, uuidToBytes32 } from '../src/utils/blockchain.js';

describe('BookChain Library — Step 04: Blockchain Copyright Integration & On-Chain Verification', () => {
  const ts = Date.now();
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const contractAddress = deployedAddresses.localhost.address;
  const hardhatRegistrarSigner = new ethers.Wallet(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    provider
  );
  const contractWithRegistrar = new ethers.Contract(
    contractAddress,
    BookCopyrightRegistryAbi,
    hardhatRegistrarSigner
  );

  const authorUser = {
    email: `author_step04_${ts}@bookchain-step04.test`,
    password: 'Password123!',
    displayName: 'Nguyen Trai Author',
    penName: `Nguyen Trai Pen_${ts}`,
    wallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Hardhat Account #1
  };

  const readerUser = {
    email: `reader_step04_${ts}@bookchain-step04.test`,
    password: 'Password123!',
    displayName: 'Thich Doc Sach',
  };

  let authorToken = '';
  let readerToken = '';
  let createdBookId = '';
  let file1Id = '';
  let file2Id = '';
  let file1Sha256 = '';
  let file2Sha256 = '';

  const sampleBookV1Content = Buffer.from(
    `Binh Ngo Dai Cao — Archival Volume 1 (Timestamp: ${ts})\n` +
      `Tung nghe: Viec nhan nghia cot o yen dan, Quan dieu phat truoc lo tru bao.`
  );
  const sampleBookV2Content = Buffer.from(
    `Binh Ngo Dai Cao — Archival Volume 2 (Revised Edition, Timestamp: ${ts})\n` +
      `Nhu nuoc Dai Viet ta tu truoc, Von xung nen van hien da lau.`
  );

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
    authorToken = loginAuth.body.data.token;

    // Create PenName to acquire AUTHOR role
    await request(app)
      .post('/api/users/author-profile')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ penName: authorUser.penName, bio: 'Historical author & scholar' });

    // 2. Register Reader
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

    // 3. Create a Book
    const bookRes = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        title: `Binh Ngo Dai Cao — Heritage Archival Edition (${ts})`,
        description: 'Historic epic declaration of sovereignty and peace.',
        languageCode: 'vi',
        publicationStatus: 'PUBLISHED',
      });
    expect(bookRes.status).toBe(201);
    createdBookId = bookRes.body.data.bookId;

    // 4. Upload Version 1
    const uploadV1 = await request(app)
      .post(`/api/books/${createdBookId}/files`)
      .set('Authorization', `Bearer ${authorToken}`)
      .attach('file', sampleBookV1Content, 'binh_ngo_dai_cao_v1.txt')
      .field('accessLevel', 'PUBLIC_READ');
    expect(uploadV1.status).toBe(201);
    file1Id = uploadV1.body.data.bookFileId;
    file1Sha256 = uploadV1.body.data.sha256.toLowerCase();

    // 5. Upload Version 2
    const uploadV2 = await request(app)
      .post(`/api/books/${createdBookId}/files`)
      .set('Authorization', `Bearer ${authorToken}`)
      .attach('file', sampleBookV2Content, 'binh_ngo_dai_cao_v2.txt')
      .field('accessLevel', 'PUBLIC_READ');
    expect(uploadV2.status).toBe(201);
    file2Id = uploadV2.body.data.bookFileId;
    file2Sha256 = uploadV2.body.data.sha256.toLowerCase();
  });

  afterAll(async () => {
    await closePool();
  });

  describe('1. Registration Preparation & Access Control (POST /api/copyright/prepare)', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).post('/api/copyright/prepare').send({
        bookId: createdBookId,
        bookFileId: file1Id,
        authorWallet: authorUser.wallet,
      });
      expect(res.status).toBe(401);
    });

    it('rejects readers or non-authors of the book with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/copyright/prepare')
        .set('Authorization', `Bearer ${readerToken}`)
        .send({
          bookId: createdBookId,
          bookFileId: file1Id,
          authorWallet: authorUser.wallet,
        });
      expect(res.status).toBe(403);
    });

    it('rejects invalid or malformed Ethereum wallet addresses with 400', async () => {
      const res = await request(app)
        .post('/api/copyright/prepare')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          bookId: createdBookId,
          bookFileId: file1Id,
          authorWallet: 'not-an-eth-address',
        });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('successfully prepares on-chain parameters and queues record in SQL Server', async () => {
      const res = await request(app)
        .post('/api/copyright/prepare')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          bookId: createdBookId,
          bookFileId: file1Id,
          authorWallet: authorUser.wallet,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.copyrightRecordId).toBeDefined();
      expect(data.recordNumber).toMatch(/^BCR-\d{8}-\d{4}$/);
      expect(data.versionNumber).toBe(1);
      expect(data.rawSha256).toBe(file1Sha256);
      expect(data.contentHashBytes32).toBe(sha256ToBytes32(file1Sha256));
      expect(data.bookIdBytes32).toBe(uuidToBytes32(createdBookId));
      expect(data.recordIdBytes32).toBe(uuidToBytes32(data.copyrightRecordId));
      expect(data.authorWallet.toLowerCase()).toBe(authorUser.wallet.toLowerCase());
      expect(data.contractAddress.toLowerCase()).toBe(contractAddress.toLowerCase());
      expect(data.chainId).toBe(31337);
      expect(data.isAlreadyOnChain).toBe(false);
    });
  });

  describe('2. MetaMask Simulation & Live Hardhat Contract Execution', () => {
    let preparedData: any;
    let minedTxHash = '';
    let minedReceipt: ethers.TransactionReceipt | null = null;

    it('prepares Version 1 parameters for signing', async () => {
      const res = await request(app)
        .post('/api/copyright/prepare')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          bookId: createdBookId,
          bookFileId: file1Id,
          authorWallet: authorUser.wallet,
        });

      expect(res.status).toBe(200);
      preparedData = res.body.data;
    });

    it('broadcasts registerCopyright transaction to live Hardhat Local node and mines block', async () => {
      // Execute the exact transaction that MetaMask would execute on Hardhat Local
      const tx = await contractWithRegistrar.registerCopyright(
        preparedData.recordIdBytes32,
        preparedData.bookIdBytes32,
        preparedData.versionNumber,
        preparedData.contentHashBytes32,
        preparedData.authorWallet,
        preparedData.metadataUri
      );

      minedTxHash = tx.hash;
      expect(minedTxHash).toMatch(/^0x[0-9a-fA-F]{64}$/);

      minedReceipt = await tx.wait(1);
      expect(minedReceipt).not.toBeNull();
      expect(minedReceipt?.status).toBe(1); // 1 = Success
      expect(Number(minedReceipt?.blockNumber)).toBeGreaterThan(0);
    });

    it('verifies on-chain state directly via contract.verifyHash()', async () => {
      const onChainRecord = await contractWithRegistrar.verifyHash(preparedData.contentHashBytes32);
      expect(onChainRecord[0]).toBe(true); // exists
      expect(onChainRecord[1]).toBe(preparedData.recordIdBytes32); // recordId
      expect(onChainRecord[2]).toBe(preparedData.bookIdBytes32); // bookId
      expect(Number(onChainRecord[3])).toBe(1); // versionNumber
      expect(onChainRecord[4].toLowerCase()).toBe(authorUser.wallet.toLowerCase()); // authorWallet
      expect(Number(onChainRecord[6])).toBeGreaterThan(0); // registeredAt timestamp
      expect(Number(onChainRecord[7])).toBe(0); // status 0 = ACTIVE
    });

    it('synchronizes on-chain transaction receipt into SQL Server via POST /api/copyright/sync', async () => {
      const syncRes = await request(app)
        .post('/api/copyright/sync')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          copyrightRecordId: preparedData.copyrightRecordId,
          txHash: minedTxHash,
        });

      expect(syncRes.status).toBe(200);
      expect(syncRes.body.success).toBe(true);

      const syncData = syncRes.body.data;
      expect(syncData.synchronized).toBe(true);
      expect(syncData.status).toBe('CONFIRMED');
      expect(syncData.txHash).toBe(minedTxHash);
      expect(syncData.blockNumber).toBe(Number(minedReceipt?.blockNumber));
      expect(syncData.record.recordStatus).toBe('ON_CHAIN');
      expect(syncData.record.transaction.status).toBe('CONFIRMED');
      expect(syncData.record.transaction.blockNumber).toBe(Number(minedReceipt?.blockNumber));
    });
  });

  describe('3. Multi-Version Relay Registration (POST /api/copyright/relay)', () => {
    it('registers Version 2 seamlessly through Registrar Relay service', async () => {
      // 1. Prepare Version 2
      const prepRes = await request(app)
        .post('/api/copyright/prepare')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          bookId: createdBookId,
          bookFileId: file2Id,
          authorWallet: authorUser.wallet,
        });
      expect(prepRes.status).toBe(200);
      const v2Prep = prepRes.body.data;

      // 2. Author triggers relay broadcast
      const relayRes = await request(app)
        .post('/api/copyright/relay')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          copyrightRecordId: v2Prep.copyrightRecordId,
        });

      expect(relayRes.status).toBe(200);
      expect(relayRes.body.success).toBe(true);
      expect(relayRes.body.data.txHash).toMatch(/^0x[0-9a-fA-F]{64}$/);
      expect(relayRes.body.data.blockNumber).toBeGreaterThan(0);
      expect(relayRes.body.data.record.recordStatus).toBe('ON_CHAIN');

      // 3. Confirm both Version 1 and Version 2 exist independently on-chain
      const v1OnChain = await contractWithRegistrar.verifyHash(sha256ToBytes32(file1Sha256));
      const v2OnChain = await contractWithRegistrar.verifyHash(sha256ToBytes32(file2Sha256));

      expect(v1OnChain[0]).toBe(true);
      expect(Number(v1OnChain[3])).toBe(1);
      expect(v2OnChain[0]).toBe(true);
      expect(Number(v2OnChain[3])).toBe(2);
    });
  });

  describe('4. Book Copyright History & Audit Records (GET /api/copyright/books/:bookId/records)', () => {
    it('retrieves full copyright history with on-chain confirmation for the book', async () => {
      const res = await request(app).get(`/api/copyright/books/${createdBookId}/records`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const records = res.body.data;
      expect(records.length).toBeGreaterThanOrEqual(2);

      const v1Record = records.find((r: any) => r.versionNumber === 1);
      const v2Record = records.find((r: any) => r.versionNumber === 2);

      expect(v1Record).toBeDefined();
      expect(v1Record.recordStatus).toBe('ON_CHAIN');
      expect(v1Record.transaction.status).toBe('CONFIRMED');
      expect(v1Record.onChain.exists).toBe(true);
      expect(v1Record.onChain.status).toBe('ACTIVE');

      expect(v2Record).toBeDefined();
      expect(v2Record.recordStatus).toBe('ON_CHAIN');
      expect(v2Record.onChain.exists).toBe(true);
    });
  });

  describe('5. Public Cryptographic Verification (GET /api/copyright/verify/:query)', () => {
    it('verifies registered SHA-256 hash and returns complete dual-source proof', async () => {
      const res = await request(app).get(`/api/copyright/verify/${file1Sha256}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const cert = res.body.data;
      expect(cert.found).toBe(true);
      expect(cert.queryType).toBe('CONTENT_HASH');
      expect(cert.onChain.exists).toBe(true);
      expect(cert.onChain.status).toBe('ACTIVE');
      expect(cert.onChain.versionNumber).toBe(1);
      expect(cert.database.bookId).toBe(createdBookId);
      expect(cert.database.sha256).toBe(file1Sha256);
      expect(cert.isConsistent).toBe(true);
    });

    it('handles unknown/unregistered SHA-256 gracefully with found = false', async () => {
      const fakeHash = crypto.createHash('sha256').update('Unpublished dummy content').digest('hex');
      const res = await request(app).get(`/api/copyright/verify/${fakeHash}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const cert = res.body.data;
      expect(cert.found).toBe(false);
      expect(cert.onChain.exists).toBe(false);
    });
  });

  describe('6. Smart Contract Invariance & Duplicate Rejection', () => {
    it('reverts when attempting to register an already-registered content hash', async () => {
      const duplicateRecordId = uuidToBytes32(crypto.randomUUID());
      const duplicateBookId = uuidToBytes32(crypto.randomUUID());
      const existingHashBytes32 = sha256ToBytes32(file1Sha256);

      await expect(
        contractWithRegistrar.registerCopyright(
          duplicateRecordId,
          duplicateBookId,
          99,
          existingHashBytes32,
          authorUser.wallet,
          'metadata'
        )
      ).rejects.toThrow();
    });

    it('rejects registration attempt from an account without REGISTRAR_ROLE', async () => {
      // Connect as account #2 (who is not an admin/registrar)
      const unauthorizedSigner = new ethers.Wallet(
        '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a', // Hardhat Account #2
        provider
      );
      const unauthorizedContract = new ethers.Contract(
        contractAddress,
        BookCopyrightRegistryAbi,
        unauthorizedSigner
      );

      const freshRecordId = uuidToBytes32(crypto.randomUUID());
      const freshBookId = uuidToBytes32(crypto.randomUUID());
      const freshHash = sha256ToBytes32(crypto.randomBytes(32).toString('hex'));

      await expect(
        unauthorizedContract.registerCopyright(
          freshRecordId,
          freshBookId,
          1,
          freshHash,
          authorUser.wallet,
          'metadata'
        )
      ).rejects.toThrow();
    });
  });
});
