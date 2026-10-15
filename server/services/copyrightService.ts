import { ethers } from 'ethers';
import { bookRepository } from '../repositories/bookRepository.js';
import { bookFileRepository } from '../repositories/bookFileRepository.js';
import { copyrightRepository } from '../repositories/copyrightRepository.js';
import {
  blockchainClient,
  REGISTRAR_ROLE,
  type OnChainVerificationResult,
} from '../blockchain/contractClient.js';
import { sha256ToBytes32, uuidToBytes32, bytes32ToSha256 } from '../blockchain/utils.js';
import { unifiedStorageService as storageService } from './storage/storageManager.js';
import type {
  PrepareCopyrightRegistrationDto,
  CopyrightRecordDto,
  RoleCode,
  OnChainRecordStatus,
} from '../types/index.js';

export interface VerifyPublicCopyrightResult {
  found: boolean;
  query: string;
  queryType: 'CONTENT_HASH' | 'RECORD_ID';
  onChain: {
    exists: boolean;
    recordId?: string;
    bookId?: string;
    versionNumber?: number;
    contentHash?: string;
    authorWallet?: string;
    registrant?: string;
    registeredAt?: number;
    status?: OnChainRecordStatus;
    contractAddress: string;
    chainId: number;
  };
  database?: {
    bookId: string;
    bookTitle: string;
    versionNumber: number;
    sha256: string;
    recordNumber?: string;
    recordStatus?: string;
    submittedAt?: Date | null;
    txHash?: string | null;
    blockNumber?: number | null;
  } | null;
  isConsistent: boolean;
  verifiedAt: string;
}

export class CopyrightService {
  /**
   * Enforces that currentUser is an author of the book or an ADMIN.
   */
  private async assertCanManageBook(
    userId: string,
    userRoles: RoleCode[],
    bookId: string
  ): Promise<void> {
    if (userRoles.includes('ADMIN')) {
      return;
    }

    const isAuthor = await bookRepository.isUserBookAuthor(bookId, userId);
    if (!isAuthor) {
      throw new Error(
        'FORBIDDEN: You do not have ownership or author rights to register copyright for this work.'
      );
    }
  }

  /**
   * Step 1: Validates prerequisites and prepares on-chain registration parameters.
   * Creates or retrieves a QUEUED record in SQL Server.
   */
  async prepareRegistration(
    userId: string,
    userRoles: RoleCode[],
    params: {
      bookId: string;
      bookFileId: string;
      authorWallet: string;
    }
  ): Promise<PrepareCopyrightRegistrationDto> {
    const { bookId, bookFileId, authorWallet } = params;

    // 1. Author ownership verification
    await this.assertCanManageBook(userId, userRoles, bookId);

    // 2. Validate author wallet address format
    if (!authorWallet || !ethers.isAddress(authorWallet)) {
      throw new Error('INVALID_WALLET: Please provide a valid 42-character Ethereum address (0x...).');
    }
    const normalizedWallet = ethers.getAddress(authorWallet);

    // 3. Fetch file version from SQL Server
    const file = await bookFileRepository.getFileById(bookFileId);
    if (!file || file.BookId.toLowerCase() !== bookId.toLowerCase()) {
      throw new Error('FILE_NOT_FOUND: The specified book version file does not belong to this book.');
    }

    // 4. Verify physical file byte hash on disk or IPFS matches database Sha256
    const diskCheck = await storageService.verifyFileHash(file.StorageKey, file.Sha256, file.StorageProvider);
    if (!diskCheck.fileExists) {
      throw new Error('FILE_MISSING_ON_DISK: Physical file is missing from storage. Cannot register missing file.');
    }
    if (!diskCheck.matches) {
      throw new Error('INTEGRITY_MISMATCH: Stored file byte hash does not match recorded SHA-256 fingerprint.');
    }

    // 5. Check if already on-chain
    let onChainCheck: OnChainVerificationResult;
    try {
      onChainCheck = await blockchainClient.verifyHash(file.Sha256);
    } catch {
      onChainCheck = {
        exists: false,
        recordId: ethers.ZeroHash,
        bookId: ethers.ZeroHash,
        versionNumber: 0,
        authorWallet: ethers.ZeroAddress,
        registrant: ethers.ZeroAddress,
        registeredAt: 0,
        status: 'ACTIVE',
      };
    }

    // 6. Find or create CopyrightRecords entry
    let record = await copyrightRepository.getCopyrightRecordByBookAndFile(bookId, bookFileId);
    if (!record) {
      record = await copyrightRepository.createCopyrightRecord({
        bookId,
        bookFileId,
        submittedByUserId: userId,
        claimStatement: `Original literary authorship claim for version ${file.VersionNumber} registered via BookChain Library.`,
        recordStatus: onChainCheck.exists ? 'ON_CHAIN' : 'QUEUED',
      });
    } else if (onChainCheck.exists && record.RecordStatus !== 'ON_CHAIN') {
      await copyrightRepository.updateCopyrightRecordStatus(record.CopyrightRecordId, 'ON_CHAIN');
      record.RecordStatus = 'ON_CHAIN';
    }

    // 7. Ensure BlockchainTransactions record exists
    let txRecord = await copyrightRepository.getLatestTransactionByRecordId(record.CopyrightRecordId);
    if (!txRecord || txRecord.Status === 'FAILED') {
      txRecord = await copyrightRepository.createBlockchainTransaction({
        copyrightRecordId: record.CopyrightRecordId,
        chainId: blockchainClient.chainId,
        transactionType: 'REGISTER_DIRECT_METAMASK',
        status: onChainCheck.exists ? 'CONFIRMED' : 'QUEUED',
        contractAddress: blockchainClient.contractAddress,
      });
    }

    // 8. Deterministic parameters formatted for smart contract
    const recordIdBytes32 = uuidToBytes32(record.CopyrightRecordId);
    const bookIdBytes32 = uuidToBytes32(bookId);
    const contentHashBytes32 = sha256ToBytes32(file.Sha256);
    const metadataUri = `bookchain://books/${bookId}/versions/${file.VersionNumber}/${file.OriginalFileName}`;

    return {
      copyrightRecordId: record.CopyrightRecordId,
      recordNumber: record.RecordNumber,
      recordIdBytes32,
      bookIdBytes32,
      versionNumber: file.VersionNumber,
      contentHashBytes32,
      rawSha256: file.Sha256.trim().toLowerCase(),
      authorWallet: normalizedWallet,
      metadataUri,
      contractAddress: blockchainClient.contractAddress,
      chainId: blockchainClient.chainId,
      contractRegistrarRole: REGISTRAR_ROLE,
      isAlreadyOnChain: onChainCheck.exists,
    };
  }

  /**
   * Step 2: Synchronizes an on-chain transaction executed by the user via MetaMask.
   * Reads the on-chain receipt and smart contract state, then updates SQL Server.
   */
  async syncTransaction(
    userId: string,
    userRoles: RoleCode[],
    params: {
      copyrightRecordId: string;
      txHash: string;
    }
  ): Promise<{
    synchronized: boolean;
    status: string;
    txHash: string;
    blockNumber: number | null;
    record: CopyrightRecordDto;
  }> {
    const { copyrightRecordId, txHash } = params;

    const record = await copyrightRepository.getCopyrightRecordById(copyrightRecordId);
    if (!record) {
      throw new Error('RECORD_NOT_FOUND: Copyright record does not exist in database.');
    }

    await this.assertCanManageBook(userId, userRoles, record.BookId);

    if (!txHash || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
      throw new Error('INVALID_TX_HASH: Transaction hash must be a 66-character hex string starting with 0x.');
    }

    // Query on-chain transaction receipt via JSON-RPC
    const receipt = await blockchainClient.getTransactionReceipt(txHash);

    if (!receipt) {
      // Transaction still in mempool (pending)
      await copyrightRepository.updateBlockchainTransaction({
        copyrightRecordId,
        txHash,
        status: 'PENDING',
        contractAddress: blockchainClient.contractAddress,
      });

      const updatedRecords = await copyrightRepository.getCopyrightRecordsByBookId(record.BookId);
      const updated = updatedRecords.find((r) => r.copyrightRecordId === copyrightRecordId)!;

      return {
        synchronized: false,
        status: 'PENDING',
        txHash,
        blockNumber: null,
        record: updated,
      };
    }

    if (receipt.status === 1) {
      // Transaction CONFIRMED on-chain!
      const blockNumber = Number(receipt.blockNumber);

      // Update SQL Server
      await copyrightRepository.updateBlockchainTransaction({
        copyrightRecordId,
        txHash,
        blockNumber,
        status: 'CONFIRMED',
        contractAddress: receipt.to || blockchainClient.contractAddress,
      });

      await copyrightRepository.updateCopyrightRecordStatus(copyrightRecordId, 'ON_CHAIN');

      const updatedRecords = await copyrightRepository.getCopyrightRecordsByBookId(record.BookId);
      const updated = updatedRecords.find((r) => r.copyrightRecordId === copyrightRecordId)!;

      return {
        synchronized: true,
        status: 'CONFIRMED',
        txHash,
        blockNumber,
        record: updated,
      };
    } else {
      // Transaction REVERTED on-chain
      await copyrightRepository.updateBlockchainTransaction({
        copyrightRecordId,
        txHash,
        status: 'FAILED',
        errorMessage: 'Transaction reverted on-chain by the smart contract.',
        contractAddress: receipt.to || blockchainClient.contractAddress,
      });

      await copyrightRepository.updateCopyrightRecordStatus(copyrightRecordId, 'FAILED');

      throw new Error('TRANSACTION_REVERTED: The transaction failed or was reverted on the blockchain.');
    }
  }

  /**
   * Relay Registration:
   * When an author does not have REGISTRAR_ROLE and uses the official Registrar Service to broadcast.
   */
  async relayRegistration(
    userId: string,
    userRoles: RoleCode[],
    copyrightRecordId: string
  ): Promise<{
    txHash: string;
    blockNumber: number;
    record: CopyrightRecordDto;
  }> {
    const record = await copyrightRepository.getCopyrightRecordById(copyrightRecordId);
    if (!record) {
      throw new Error('RECORD_NOT_FOUND: Copyright record does not exist.');
    }

    await this.assertCanManageBook(userId, userRoles, record.BookId);

    const file = await bookFileRepository.getFileById(record.BookFileId);
    if (!file) {
      throw new Error('FILE_NOT_FOUND: Associated book file does not exist.');
    }

    const recordIdBytes32 = uuidToBytes32(record.CopyrightRecordId);
    const bookIdBytes32 = uuidToBytes32(record.BookId);
    const contentHashBytes32 = sha256ToBytes32(file.Sha256);
    const metadataUri = `bookchain://books/${record.BookId}/versions/${file.VersionNumber}/${file.OriginalFileName}`;

    // Execute on-chain via Registrar wallet
    const result = await blockchainClient.registerCopyrightViaRegistrar({
      recordId: recordIdBytes32,
      bookId: bookIdBytes32,
      versionNumber: file.VersionNumber,
      contentHash: contentHashBytes32,
      authorWallet: blockchainClient.getRegistrarAddress() || ethers.ZeroAddress,
      metadataUri,
    });

    // Update SQL Server with explicit relay distinction
    await copyrightRepository.updateBlockchainTransaction({
      copyrightRecordId,
      txHash: result.txHash,
      blockNumber: result.blockNumber,
      status: 'CONFIRMED',
      contractAddress: blockchainClient.contractAddress,
      transactionType: 'REGISTER_RELAY_SIGNER',
    });

    await copyrightRepository.updateCopyrightRecordStatus(copyrightRecordId, 'ON_CHAIN');

    const updatedRecords = await copyrightRepository.getCopyrightRecordsByBookId(record.BookId);
    const updated = updatedRecords.find((r) => r.copyrightRecordId === copyrightRecordId)!;

    return {
      txHash: result.txHash,
      blockNumber: result.blockNumber,
      record: updated,
    };
  }

  /**
   * Retrieves all copyright records for a book, with on-chain status checked.
   */
  async getRecordsByBookId(bookId: string): Promise<CopyrightRecordDto[]> {
    const records = await copyrightRepository.getCopyrightRecordsByBookId(bookId);

    // Enrich with on-chain status
    const enriched = await Promise.all(
      records.map(async (rec) => {
        try {
          const onChain = await blockchainClient.verifyHash(rec.sha256);
          return {
            ...rec,
            onChain: onChain.exists
              ? {
                  exists: true,
                  status: onChain.status,
                  authorWallet: onChain.authorWallet,
                  registrant: onChain.registrant,
                  registeredAt: onChain.registeredAt,
                }
              : {
                  exists: false,
                  status: null,
                  authorWallet: null,
                  registrant: null,
                  registeredAt: null,
                },
          };
        } catch {
          return rec;
        }
      })
    );

    return enriched;
  }

  /**
   * Public Verification: Verifies copyright evidence either by SHA-256 hash or Record ID.
   */
  async verifyCopyright(query: string): Promise<VerifyPublicCopyrightResult> {
    if (!query || typeof query !== 'string') {
      throw new Error('Query string is required for verification.');
    }

    const trimmed = query.trim();
    const isHash = /^(0x)?[0-9a-fA-F]{64}$/.test(trimmed);

    let onChainResult: OnChainVerificationResult | null = null;
    let queryType: 'CONTENT_HASH' | 'RECORD_ID' = 'CONTENT_HASH';
    let dbMatch: any = null;

    if (isHash) {
      queryType = 'CONTENT_HASH';
      const cleanHash = trimmed.replace(/^0x/i, '').toLowerCase();

      try {
        onChainResult = await blockchainClient.verifyHash(cleanHash);
      } catch {
        onChainResult = null;
      }

      dbMatch = await copyrightRepository.getRecordByContentHash(cleanHash);
    } else {
      queryType = 'RECORD_ID';
      // Treat as UUID or bytes32 recordId
      let recordIdBytes32 = trimmed;
      if (/^[0-9a-fA-F-]{36}$/.test(trimmed)) {
        recordIdBytes32 = uuidToBytes32(trimmed);
      }

      try {
        const full = await blockchainClient.getCopyright(recordIdBytes32);
        onChainResult = full;
      } catch {
        onChainResult = null;
      }

      // Check DB by UUID if applicable
      if (/^[0-9a-fA-F-]{36}$/.test(trimmed)) {
        const rec = await copyrightRepository.getCopyrightRecordById(trimmed);
        if (rec) {
          const file = await bookFileRepository.getFileById(rec.BookFileId);
          if (file) {
            dbMatch = await copyrightRepository.getRecordByContentHash(file.Sha256);
          }
        }
      }
    }

    const onChainExists = Boolean(onChainResult && onChainResult.exists);
    const dbExists = Boolean(dbMatch);

    let isConsistent = false;
    if (onChainExists && dbExists) {
      // Check if on-chain contentHash matches DB file sha256
      const onChainSha = onChainResult?.recordId
        ? bytes32ToSha256(
            (onChainResult as any).contentHash || sha256ToBytes32(dbMatch.Sha256)
          )
        : '';
      isConsistent = !onChainSha || onChainSha === dbMatch.Sha256.trim().toLowerCase();
    } else if (onChainExists && !dbExists) {
      // On-chain exists without local library metadata
      isConsistent = true;
    }

    return {
      found: onChainExists || dbExists,
      query: trimmed,
      queryType,
      onChain: {
        exists: onChainExists,
        recordId: onChainResult?.recordId,
        bookId: onChainResult?.bookId,
        versionNumber: onChainResult?.versionNumber,
        authorWallet: onChainResult?.authorWallet,
        registrant: onChainResult?.registrant,
        registeredAt: onChainResult?.registeredAt,
        status: onChainResult?.status,
        contractAddress: blockchainClient.contractAddress,
        chainId: blockchainClient.chainId,
      },
      database: dbMatch
        ? {
            bookId: dbMatch.BookId,
            bookTitle: dbMatch.BookTitle,
            versionNumber: dbMatch.VersionNumber,
            sha256: dbMatch.Sha256.trim().toLowerCase(),
            recordNumber: dbMatch.RecordNumber,
            recordStatus: dbMatch.RecordStatus,
            submittedAt: dbMatch.SubmittedAt,
            txHash: dbMatch.TxHash,
            blockNumber: dbMatch.BlockNumber != null ? Number(dbMatch.BlockNumber) : null,
          }
        : null,
      isConsistent,
      verifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Reconciliation Mechanism:
   * Scans pending or queued records, checks on-chain state via JSON-RPC or verifyHash,
   * and synchronizes SQL Server with on-chain reality safely and idempotently.
   */
  async reconcilePendingTransactions(): Promise<{
    scannedCount: number;
    reconciledCount: number;
    details: Array<{
      copyrightRecordId: string;
      status: string;
      actionTaken: string;
    }>;
  }> {
    const pendingList = await copyrightRepository.getPendingTransactions();
    const details: Array<{ copyrightRecordId: string; status: string; actionTaken: string }> = [];
    let reconciledCount = 0;

    for (const item of pendingList) {
      try {
        // 1. If txHash exists, check receipt
        if (item.txHash) {
          const receipt = await blockchainClient.getTransactionReceipt(item.txHash);
          if (receipt && receipt.status === 1) {
            await copyrightRepository.updateBlockchainTransaction({
              copyrightRecordId: item.copyrightRecordId,
              txHash: item.txHash,
              blockNumber: Number(receipt.blockNumber),
              status: 'CONFIRMED',
              contractAddress: receipt.to || blockchainClient.contractAddress,
            });
            await copyrightRepository.updateCopyrightRecordStatus(item.copyrightRecordId, 'ON_CHAIN');
            reconciledCount++;
            details.push({
              copyrightRecordId: item.copyrightRecordId,
              status: 'CONFIRMED',
              actionTaken: `Confirmed via on-chain receipt in block ${receipt.blockNumber}`,
            });
            continue;
          } else if (receipt && receipt.status === 0) {
            await copyrightRepository.updateBlockchainTransaction({
              copyrightRecordId: item.copyrightRecordId,
              txHash: item.txHash,
              status: 'FAILED',
              errorMessage: 'Transaction reverted on-chain.',
            });
            await copyrightRepository.updateCopyrightRecordStatus(item.copyrightRecordId, 'FAILED');
            reconciledCount++;
            details.push({
              copyrightRecordId: item.copyrightRecordId,
              status: 'FAILED',
              actionTaken: 'Marked FAILED due to on-chain transaction revert',
            });
            continue;
          }
        }

        // 2. Cross-check hash directly on contract
        const onChain = await blockchainClient.verifyHash(item.sha256);
        if (onChain.exists) {
          await copyrightRepository.updateCopyrightRecordStatus(item.copyrightRecordId, 'ON_CHAIN');
          await copyrightRepository.updateBlockchainTransaction({
            copyrightRecordId: item.copyrightRecordId,
            status: 'CONFIRMED',
            contractAddress: blockchainClient.contractAddress,
          });
          reconciledCount++;
          details.push({
            copyrightRecordId: item.copyrightRecordId,
            status: 'CONFIRMED',
            actionTaken: 'Reconciled to ON_CHAIN: file hash is actively registered on smart contract',
          });
        }
      } catch (err: any) {
        details.push({
          copyrightRecordId: item.copyrightRecordId,
          status: 'ERROR',
          actionTaken: `Reconciliation skipped due to RPC error: ${err.message}`,
        });
      }
    }

    return {
      scannedCount: pendingList.length,
      reconciledCount,
      details,
    };
  }
}

export const copyrightService = new CopyrightService();
