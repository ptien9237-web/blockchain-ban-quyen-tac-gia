import { getPool, sql } from '../db/sqlServer.js';
import type {
  BookFileRecord,
  BookFileDto,
  AccessLevel,
  StorageProviderType,
} from '../types/index.js';

export class BookFileRepository {
  /**
   * Adds a new file version to a book inside a transaction to prevent duplicate version numbers
   * and enforce single IsCurrent version constraint.
   */
  async createFileVersion(params: {
    bookId: string;
    storageProvider: StorageProviderType;
    storageKey: string;
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    sha256: string;
    accessLevel: AccessLevel;
    isCurrent: boolean;
    uploadedByUserId: string;
  }): Promise<BookFileDto> {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Get next VersionNumber
      const versionResult = await transaction
        .request()
        .input('bookId', sql.UniqueIdentifier, params.bookId)
        .query(`
          SELECT ISNULL(MAX(VersionNumber), 0) + 1 AS NextVersion
          FROM dbo.BookFiles WITH (UPDLOCK, HOLDLOCK)
          WHERE BookId = @bookId;
        `);
      const nextVersion: number = versionResult.recordset[0].NextVersion;

      // 2. Determine if this should be IsCurrent
      // If isCurrent is true OR if this is the first version (NextVersion === 1), set isCurrent = 1
      const shouldBeCurrent = params.isCurrent || nextVersion === 1;

      if (shouldBeCurrent) {
        // Reset any existing current version
        await transaction
          .request()
          .input('bookId', sql.UniqueIdentifier, params.bookId)
          .query(`
            UPDATE dbo.BookFiles
            SET IsCurrent = 0
            WHERE BookId = @bookId AND IsCurrent = 1;
          `);
      }

      // 3. Insert new file version
      const insertResult = await transaction
        .request()
        .input('bookId', sql.UniqueIdentifier, params.bookId)
        .input('versionNumber', sql.Int, nextVersion)
        .input('storageProvider', sql.VarChar(20), params.storageProvider)
        .input('storageKey', sql.NVarChar(1000), params.storageKey)
        .input('originalFileName', sql.NVarChar(255), params.originalFileName)
        .input('mimeType', sql.VarChar(150), params.mimeType)
        .input('sizeBytes', sql.BigInt, params.sizeBytes)
        .input('sha256', sql.Char(64), params.sha256.toUpperCase())
        .input('accessLevel', sql.VarChar(20), params.accessLevel)
        .input('isCurrent', sql.Bit, shouldBeCurrent ? 1 : 0)
        .input('uploadedByUserId', sql.UniqueIdentifier, params.uploadedByUserId)
        .query(`
          INSERT INTO dbo.BookFiles (
            BookId,
            VersionNumber,
            StorageProvider,
            StorageKey,
            OriginalFileName,
            MimeType,
            SizeBytes,
            Sha256,
            AccessLevel,
            IsCurrent,
            UploadedByUserId
          )
          OUTPUT
            INSERTED.BookFileId,
            INSERTED.BookId,
            INSERTED.VersionNumber,
            INSERTED.StorageProvider,
            INSERTED.StorageKey,
            INSERTED.OriginalFileName,
            INSERTED.MimeType,
            INSERTED.SizeBytes,
            INSERTED.Sha256,
            INSERTED.AccessLevel,
            INSERTED.IsCurrent,
            INSERTED.UploadedByUserId,
            INSERTED.CreatedAt
          VALUES (
            @bookId,
            @versionNumber,
            @storageProvider,
            @storageKey,
            @originalFileName,
            @mimeType,
            @sizeBytes,
            @sha256,
            @accessLevel,
            @isCurrent,
            @uploadedByUserId
          );
        `);

      await transaction.commit();

      const row = insertResult.recordset[0];
      return {
        bookFileId: row.BookFileId,
        bookId: row.BookId,
        versionNumber: row.VersionNumber,
        originalFileName: row.OriginalFileName,
        mimeType: row.MimeType,
        sizeBytes: Number(row.SizeBytes),
        sha256: row.Sha256.trim().toLowerCase(),
        accessLevel: row.AccessLevel,
        isCurrent: Boolean(row.IsCurrent),
        storageProvider: row.StorageProvider,
        createdAt: row.CreatedAt,
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async getFileById(fileId: string): Promise<BookFileRecord | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('fileId', sql.UniqueIdentifier, fileId)
      .query(`
        SELECT *
        FROM dbo.BookFiles
        WHERE BookFileId = @fileId;
      `);

    return result.recordset[0] || null;
  }

  async getFilesByBookId(bookId: string): Promise<BookFileDto[]> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('bookId', sql.UniqueIdentifier, bookId)
      .query(`
        SELECT
          BookFileId,
          BookId,
          VersionNumber,
          StorageProvider,
          OriginalFileName,
          MimeType,
          SizeBytes,
          Sha256,
          AccessLevel,
          IsCurrent,
          CreatedAt
        FROM dbo.BookFiles
        WHERE BookId = @bookId
        ORDER BY VersionNumber DESC;
      `);

    return result.recordset.map((row) => ({
      bookFileId: row.BookFileId,
      bookId: row.BookId,
      versionNumber: row.VersionNumber,
      originalFileName: row.OriginalFileName,
      mimeType: row.MimeType,
      sizeBytes: Number(row.SizeBytes),
      sha256: row.Sha256.trim().toLowerCase(),
      accessLevel: row.AccessLevel,
      isCurrent: Boolean(row.IsCurrent),
      storageProvider: row.StorageProvider,
      createdAt: row.CreatedAt,
    }));
  }

  async getCurrentFileForBook(bookId: string): Promise<BookFileRecord | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('bookId', sql.UniqueIdentifier, bookId)
      .query(`
        SELECT *
        FROM dbo.BookFiles
        WHERE BookId = @bookId AND IsCurrent = 1;
      `);

    return result.recordset[0] || null;
  }

  async findFileBySha256(sha256: string): Promise<
    | (BookFileDto & {
        bookTitle: string;
        bookPublicationStatus: string;
      })
    | null
  > {
    const pool = await getPool();
    const normalizedHash = sha256.trim().toUpperCase();
    const result = await pool
      .request()
      .input('sha256', sql.Char(64), normalizedHash)
      .query(`
        SELECT
          bf.BookFileId,
          bf.BookId,
          bf.VersionNumber,
          bf.StorageProvider,
          bf.OriginalFileName,
          bf.MimeType,
          bf.SizeBytes,
          bf.Sha256,
          bf.AccessLevel,
          bf.IsCurrent,
          bf.CreatedAt,
          b.Title AS BookTitle,
          b.PublicationStatus AS BookPublicationStatus
        FROM dbo.BookFiles bf
        INNER JOIN dbo.Books b ON bf.BookId = b.BookId
        WHERE bf.Sha256 = @sha256;
      `);

    if (result.recordset.length === 0) return null;
    const row = result.recordset[0];
    return {
      bookFileId: row.BookFileId,
      bookId: row.BookId,
      versionNumber: row.VersionNumber,
      originalFileName: row.OriginalFileName,
      mimeType: row.MimeType,
      sizeBytes: Number(row.SizeBytes),
      sha256: row.Sha256.trim().toLowerCase(),
      accessLevel: row.AccessLevel,
      isCurrent: Boolean(row.IsCurrent),
      storageProvider: row.StorageProvider,
      createdAt: row.CreatedAt,
      bookTitle: row.BookTitle,
      bookPublicationStatus: row.BookPublicationStatus,
    };
  }
}

export const bookFileRepository = new BookFileRepository();
