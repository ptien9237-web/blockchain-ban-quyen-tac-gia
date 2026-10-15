import { getPool, sql } from '../db/sqlServer.js';
import type {
  CopyrightRecord,
  CopyrightRecordStatus,
  BlockchainTransactionRecord,
  BlockchainTxStatus,
  CopyrightRecordDto,
} from '../types/index.js';

export class CopyrightRepository {
  /**
   * Generates a unique sequential RecordNumber for business tracking (e.g. BCR-20261014-0001).
   */
  private async generateRecordNumber(transaction?: sql.Transaction): Promise<string> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `BCR-${today}-`;
    const runner = transaction || (await getPool());

    const result = await runner.request()
      .input('prefix', sql.NVarChar(40), `${prefix}%`)
      .query(`
        SELECT COUNT(*) AS CurrentCount
        FROM dbo.CopyrightRecords WITH (UPDLOCK, HOLDLOCK)
        WHERE RecordNumber LIKE @prefix;
      `);

    const count = (result.recordset[0]?.CurrentCount || 0) + 1;
    return `${prefix}${count.toString().padStart(4, '0')}`;
  }

  /**
   * Creates a new copyright record in dbo.CopyrightRecords.
   */
  async createCopyrightRecord(params: {
    bookId: string;
    bookFileId: string;
    submittedByUserId: string;
    claimStatement: string;
    recordStatus?: CopyrightRecordStatus;
  }): Promise<CopyrightRecord> {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const recordNumber = await this.generateRecordNumber(transaction);
      const status: CopyrightRecordStatus = params.recordStatus || 'QUEUED';

      const insertResult = await transaction
        .request()
        .input('bookId', sql.UniqueIdentifier, params.bookId)
        .input('bookFileId', sql.UniqueIdentifier, params.bookFileId)
        .input('submittedByUserId', sql.UniqueIdentifier, params.submittedByUserId)
        .input('recordNumber', sql.NVarChar(40), recordNumber)
        .input('claimStatement', sql.NVarChar(sql.MAX), params.claimStatement)
        .input('recordStatus', sql.VarChar(25), status)
        .query(`
          INSERT INTO dbo.CopyrightRecords (
            CopyrightRecordId,
            RecordNumber,
            BookId,
            BookFileId,
            SubmittedByUserId,
            ClaimStatement,
            RecordStatus,
            SubmittedAt,
            CreatedAt,
            UpdatedAt
          )
          OUTPUT inserted.*
          VALUES (
            NEWID(),
            @recordNumber,
            @bookId,
            @bookFileId,
            @submittedByUserId,
            @claimStatement,
            @recordStatus,
            SYSUTCDATETIME(),
            SYSUTCDATETIME(),
            SYSUTCDATETIME()
          );
        `);

      await transaction.commit();
      return insertResult.recordset[0] as CopyrightRecord;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Finds a copyright record by its ID.
   */
  async getCopyrightRecordById(copyrightRecordId: string): Promise<CopyrightRecord | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, copyrightRecordId)
      .query(`
        SELECT *
        FROM dbo.CopyrightRecords
        WHERE CopyrightRecordId = @id;
      `);

    return (result.recordset[0] as CopyrightRecord) || null;
  }

  /**
   * Finds a copyright record by BookId and BookFileId.
   */
  async getCopyrightRecordByBookAndFile(
    bookId: string,
    bookFileId: string
  ): Promise<CopyrightRecord | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('bookId', sql.UniqueIdentifier, bookId)
      .input('bookFileId', sql.UniqueIdentifier, bookFileId)
      .query(`
        SELECT TOP 1 *
        FROM dbo.CopyrightRecords
        WHERE BookId = @bookId AND BookFileId = @bookFileId
        ORDER BY CreatedAt DESC;
      `);

    return (result.recordset[0] as CopyrightRecord) || null;
  }

  /**
   * Updates the status of a copyright record.
   */
  async updateCopyrightRecordStatus(
    copyrightRecordId: string,
    status: CopyrightRecordStatus
  ): Promise<void> {
    const pool = await getPool();
    await pool
      .request()
      .input('id', sql.UniqueIdentifier, copyrightRecordId)
      .input('status', sql.VarChar(25), status)
      .query(`
        UPDATE dbo.CopyrightRecords
        SET RecordStatus = @status,
            UpdatedAt = SYSUTCDATETIME()
        WHERE CopyrightRecordId = @id;
      `);
  }

  /**
   * Creates a blockchain transaction audit row in dbo.BlockchainTransactions.
   */
  async createBlockchainTransaction(params: {
    copyrightRecordId: string;
    walletId?: string | null;
    chainId: number;
    transactionType: string;
    txHash?: string | null;
    contractAddress?: string | null;
    status: BlockchainTxStatus;
    errorMessage?: string | null;
  }): Promise<BlockchainTransactionRecord> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('copyrightRecordId', sql.UniqueIdentifier, params.copyrightRecordId)
      .input('walletId', sql.UniqueIdentifier, params.walletId || null)
      .input('chainId', sql.BigInt, params.chainId)
      .input('transactionType', sql.VarChar(30), params.transactionType)
      .input('txHash', sql.VarChar(66), params.txHash || null)
      .input('contractAddress', sql.VarChar(42), params.contractAddress || null)
      .input('status', sql.VarChar(20), params.status)
      .input('errorMessage', sql.NVarChar(1000), params.errorMessage || null)
      .query(`
        INSERT INTO dbo.BlockchainTransactions (
          BlockchainTransactionId,
          CopyrightRecordId,
          WalletId,
          ChainId,
          TransactionType,
          TxHash,
          ContractAddress,
          Status,
          BlockNumber,
          ErrorMessage,
          SubmittedAt,
          ConfirmedAt,
          CreatedAt,
          UpdatedAt
        )
        OUTPUT inserted.*
        VALUES (
          NEWID(),
          @copyrightRecordId,
          @walletId,
          @chainId,
          @transactionType,
          @txHash,
          @contractAddress,
          @status,
          NULL,
          @errorMessage,
          CASE WHEN @txHash IS NOT NULL THEN SYSUTCDATETIME() ELSE NULL END,
          NULL,
          SYSUTCDATETIME(),
          SYSUTCDATETIME()
        );
      `);

    return result.recordset[0] as BlockchainTransactionRecord;
  }

  /**
   * Updates an existing blockchain transaction status and block confirmation.
   */
  async updateBlockchainTransaction(params: {
    copyrightRecordId: string;
    txHash?: string | null;
    blockNumber?: number | null;
    status: BlockchainTxStatus;
    errorMessage?: string | null;
    contractAddress?: string | null;
    transactionType?: string | null;
  }): Promise<void> {
    const pool = await getPool();
    await pool
      .request()
      .input('copyrightRecordId', sql.UniqueIdentifier, params.copyrightRecordId)
      .input('txHash', sql.VarChar(66), params.txHash || null)
      .input('blockNumber', sql.BigInt, params.blockNumber != null ? params.blockNumber : null)
      .input('status', sql.VarChar(20), params.status)
      .input('errorMessage', sql.NVarChar(1000), params.errorMessage || null)
      .input('contractAddress', sql.VarChar(42), params.contractAddress || null)
      .input('transactionType', sql.VarChar(50), params.transactionType || null)
      .query(`
        UPDATE dbo.BlockchainTransactions
        SET Status = @status,
            TxHash = COALESCE(@txHash, TxHash),
            BlockNumber = COALESCE(@blockNumber, BlockNumber),
            ErrorMessage = @errorMessage,
            ContractAddress = COALESCE(@contractAddress, ContractAddress),
            TransactionType = COALESCE(@transactionType, TransactionType),
            ConfirmedAt = CASE WHEN @status = 'CONFIRMED' THEN SYSUTCDATETIME() ELSE ConfirmedAt END,
            SubmittedAt = CASE WHEN SubmittedAt IS NULL AND @txHash IS NOT NULL THEN SYSUTCDATETIME() ELSE SubmittedAt END,
            UpdatedAt = SYSUTCDATETIME()
        WHERE CopyrightRecordId = @copyrightRecordId;
      `);
  }

  /**
   * Fetches all pending or unconfirmed copyright records to reconcile with blockchain.
   */
  async getPendingTransactions(): Promise<Array<{
    copyrightRecordId: string;
    bookId: string;
    sha256: string;
    txHash: string | null;
    status: BlockchainTxStatus;
    recordStatus: CopyrightRecordStatus;
  }>> {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        cr.CopyrightRecordId,
        cr.BookId,
        bf.Sha256,
        bt.TxHash,
        bt.Status AS TxStatus,
        cr.RecordStatus
      FROM dbo.CopyrightRecords cr
      INNER JOIN dbo.BookFiles bf ON cr.BookFileId = bf.BookFileId
      LEFT JOIN dbo.BlockchainTransactions bt ON cr.CopyrightRecordId = bt.CopyrightRecordId
      WHERE cr.RecordStatus IN ('QUEUED', 'DRAFT', 'SUBMITTED')
         OR bt.Status IN ('QUEUED', 'PENDING');
    `);
    return result.recordset.map((r) => ({
      copyrightRecordId: r.CopyrightRecordId,
      bookId: r.BookId,
      sha256: r.Sha256,
      txHash: r.TxHash,
      status: r.TxStatus,
      recordStatus: r.RecordStatus,
    }));
  }

  /**
   * Finds the latest transaction for a copyright record.
   */
  async getLatestTransactionByRecordId(
    copyrightRecordId: string
  ): Promise<BlockchainTransactionRecord | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('copyrightRecordId', sql.UniqueIdentifier, copyrightRecordId)
      .query(`
        SELECT TOP 1 *
        FROM dbo.BlockchainTransactions
        WHERE CopyrightRecordId = @copyrightRecordId
        ORDER BY CreatedAt DESC;
      `);

    return (result.recordset[0] as BlockchainTransactionRecord) || null;
  }

  /**
   * Retrieves all copyright records for a book, joined with file details and transaction details.
   */
  async getCopyrightRecordsByBookId(bookId: string): Promise<CopyrightRecordDto[]> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('bookId', sql.UniqueIdentifier, bookId)
      .query(`
        SELECT 
          cr.CopyrightRecordId,
          cr.RecordNumber,
          cr.BookId,
          cr.BookFileId,
          cr.SubmittedByUserId,
          cr.ClaimStatement,
          cr.RecordStatus,
          cr.SubmittedAt,
          cr.CreatedAt,
          bf.VersionNumber,
          bf.Sha256,
          bt.TxHash,
          bt.Status AS TxStatus,
          bt.BlockNumber,
          bt.ContractAddress,
          bt.ChainId,
          bt.ConfirmedAt,
          bt.ErrorMessage
        FROM dbo.CopyrightRecords cr
        INNER JOIN dbo.BookFiles bf 
          ON cr.BookFileId = bf.BookFileId AND cr.BookId = bf.BookId
        LEFT JOIN dbo.BlockchainTransactions bt 
          ON cr.CopyrightRecordId = bt.CopyrightRecordId
        WHERE cr.BookId = @bookId
        ORDER BY bf.VersionNumber DESC, cr.CreatedAt DESC;
      `);

    return result.recordset.map((row: any) => ({
      copyrightRecordId: row.CopyrightRecordId,
      recordNumber: row.RecordNumber,
      bookId: row.BookId,
      bookFileId: row.BookFileId,
      versionNumber: row.VersionNumber,
      sha256: (row.Sha256 || '').trim(),
      submittedByUserId: row.SubmittedByUserId,
      claimStatement: row.ClaimStatement,
      recordStatus: row.RecordStatus,
      submittedAt: row.SubmittedAt,
      createdAt: row.CreatedAt,
      transaction: row.TxStatus
        ? {
            txHash: row.TxHash,
            status: row.TxStatus,
            blockNumber: row.BlockNumber != null ? Number(row.BlockNumber) : null,
            contractAddress: row.ContractAddress,
            chainId: Number(row.ChainId || 31337),
            confirmedAt: row.ConfirmedAt,
            errorMessage: row.ErrorMessage,
          }
        : null,
    }));
  }

  /**
   * Finds matching book and copyright record by file content SHA-256 hash.
   */
  async getRecordByContentHash(sha256Hex: string): Promise<any | null> {
    const cleanHash = sha256Hex.trim().replace(/^0x/i, '').toLowerCase();
    const pool = await getPool();
    const result = await pool
      .request()
      .input('sha256', sql.Char(64), cleanHash)
      .query(`
        SELECT TOP 1
          bf.BookFileId,
          bf.BookId,
          bf.VersionNumber,
          bf.OriginalFileName,
          bf.Sha256,
          bf.SizeBytes,
          b.Title AS BookTitle,
          b.PublicationStatus,
          cr.CopyrightRecordId,
          cr.RecordNumber,
          cr.RecordStatus,
          cr.SubmittedAt,
          bt.TxHash,
          bt.BlockNumber,
          bt.Status AS TxStatus,
          bt.ConfirmedAt
        FROM dbo.BookFiles bf
        INNER JOIN dbo.Books b ON bf.BookId = b.BookId
        LEFT JOIN dbo.CopyrightRecords cr 
          ON bf.BookId = cr.BookId AND bf.BookFileId = cr.BookFileId
        LEFT JOIN dbo.BlockchainTransactions bt 
          ON cr.CopyrightRecordId = bt.CopyrightRecordId
        WHERE bf.Sha256 = @sha256
        ORDER BY cr.CreatedAt DESC;
      `);

    return result.recordset[0] || null;
  }

  /**
   * Retrieves a copyright record by its primary key ID.
   */
  async getRecordById(copyrightRecordId: string): Promise<CopyrightRecord | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('copyrightRecordId', sql.UniqueIdentifier, copyrightRecordId)
      .query(`SELECT * FROM dbo.CopyrightRecords WHERE CopyrightRecordId = @copyrightRecordId;`);
    return (result.recordset[0] as CopyrightRecord) || null;
  }
}

export const copyrightRepository = new CopyrightRepository();
