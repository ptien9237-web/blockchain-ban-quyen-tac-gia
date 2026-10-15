import { getPool, sql } from '../db/sqlServer.js';
import type {
  BookDetailDto,
  PublicationStatus,
  ContributionRole,
} from '../types/index.js';

export class BookRepository {
  /**
   * Creates a new book and assigns the author profile as PRIMARY_AUTHOR (DisplayOrder 1)
   * in an ACID transaction.
   */
  async createBook(params: {
    title: string;
    description?: string | null;
    coverUrl?: string | null;
    languageCode?: string | null;
    publicationStatus?: PublicationStatus;
    primaryAuthorProfileId: string;
  }): Promise<BookDetailDto> {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const pubStatus: PublicationStatus = params.publicationStatus || 'DRAFT';
      const isPublished = pubStatus === 'PUBLISHED';

      // 1. Insert into dbo.Books
      const insertBookRes = await transaction
        .request()
        .input('title', sql.NVarChar(255), params.title.trim())
        .input('description', sql.NVarChar(sql.MAX), params.description ? params.description.trim() : null)
        .input('coverUrl', sql.NVarChar(500), params.coverUrl ? params.coverUrl.trim() : null)
        .input('languageCode', sql.VarChar(10), params.languageCode ? params.languageCode.trim() : 'vi')
        .input('publicationStatus', sql.VarChar(20), pubStatus)
        .query(`
          INSERT INTO dbo.Books (
            Title,
            Description,
            CoverUrl,
            LanguageCode,
            PublicationStatus,
            PublishedAt
          )
          OUTPUT
            INSERTED.BookId,
            INSERTED.Title,
            INSERTED.Description,
            INSERTED.CoverUrl,
            INSERTED.LanguageCode,
            INSERTED.PublicationStatus,
            INSERTED.PublishedAt,
            INSERTED.CreatedAt,
            INSERTED.UpdatedAt
          VALUES (
            @title,
            @description,
            @coverUrl,
            @languageCode,
            @publicationStatus,
            ${isPublished ? 'SYSUTCDATETIME()' : 'NULL'}
          );
        `);

      const newBook = insertBookRes.recordset[0];
      const newBookId: string = newBook.BookId;

      // 2. Insert primary author relation into dbo.BookAuthors
      await transaction
        .request()
        .input('bookId', sql.UniqueIdentifier, newBookId)
        .input('authorProfileId', sql.UniqueIdentifier, params.primaryAuthorProfileId)
        .input('contributionRole', sql.VarChar(30), 'PRIMARY_AUTHOR')
        .input('displayOrder', sql.Int, 1)
        .query(`
          INSERT INTO dbo.BookAuthors (
            BookId,
            AuthorProfileId,
            ContributionRole,
            DisplayOrder
          )
          VALUES (
            @bookId,
            @authorProfileId,
            @contributionRole,
            @displayOrder
          );
        `);

      // 3. Fetch author details to return rich DTO
      const authorRes = await transaction
        .request()
        .input('authorProfileId', sql.UniqueIdentifier, params.primaryAuthorProfileId)
        .query(`
          SELECT PenName
          FROM dbo.AuthorProfiles
          WHERE AuthorProfileId = @authorProfileId;
        `);

      const penName = authorRes.recordset[0]?.PenName || 'Unknown Author';

      await transaction.commit();

      return {
        bookId: newBook.BookId,
        title: newBook.Title,
        description: newBook.Description,
        coverUrl: newBook.CoverUrl,
        languageCode: newBook.LanguageCode,
        publicationStatus: newBook.PublicationStatus,
        publishedAt: newBook.PublishedAt,
        createdAt: newBook.CreatedAt,
        updatedAt: newBook.UpdatedAt,
        authors: [
          {
            authorProfileId: params.primaryAuthorProfileId,
            penName,
            contributionRole: 'PRIMARY_AUTHOR',
            displayOrder: 1,
          },
        ],
        currentFile: null,
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async updateBook(
    bookId: string,
    params: {
      title?: string;
      description?: string | null;
      coverUrl?: string | null;
      languageCode?: string | null;
    }
  ): Promise<void> {
    const pool = await getPool();
    await pool
      .request()
      .input('bookId', sql.UniqueIdentifier, bookId)
      .input('title', sql.NVarChar(255), params.title ? params.title.trim() : null)
      .input('description', sql.NVarChar(sql.MAX), params.description !== undefined ? params.description : null)
      .input('coverUrl', sql.NVarChar(500), params.coverUrl !== undefined ? params.coverUrl : null)
      .input('languageCode', sql.VarChar(10), params.languageCode ? params.languageCode.trim() : null)
      .query(`
        UPDATE dbo.Books
        SET
          Title = ISNULL(@title, Title),
          Description = CASE WHEN @description IS NOT NULL THEN @description ELSE Description END,
          CoverUrl = CASE WHEN @coverUrl IS NOT NULL THEN @coverUrl ELSE CoverUrl END,
          LanguageCode = ISNULL(@languageCode, LanguageCode),
          UpdatedAt = SYSUTCDATETIME()
        WHERE BookId = @bookId;
      `);
  }

  async updatePublicationStatus(bookId: string, status: PublicationStatus): Promise<void> {
    const pool = await getPool();
    await pool
      .request()
      .input('bookId', sql.UniqueIdentifier, bookId)
      .input('status', sql.VarChar(20), status)
      .query(`
        UPDATE dbo.Books
        SET
          PublicationStatus = @status,
          PublishedAt = CASE
            WHEN @status = 'PUBLISHED' AND PublishedAt IS NULL THEN SYSUTCDATETIME()
            ELSE PublishedAt
          END,
          UpdatedAt = SYSUTCDATETIME()
        WHERE BookId = @bookId;
      `);
  }

  /**
   * Checks whether a given user is an author (primary or co-author) of the book.
   */
  async isUserBookAuthor(bookId: string, userId: string): Promise<boolean> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('bookId', sql.UniqueIdentifier, bookId)
      .input('userId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT 1 AS IsAuthor
        FROM dbo.BookAuthors ba
        INNER JOIN dbo.AuthorProfiles ap ON ba.AuthorProfileId = ap.AuthorProfileId
        WHERE ba.BookId = @bookId AND ap.UserId = @userId;
      `);

    return result.recordset.length > 0;
  }

  /**
   * Adds a co-author/contributor to a book.
   */
  async addBookAuthor(params: {
    bookId: string;
    authorProfileId: string;
    contributionRole: ContributionRole;
    displayOrder?: number;
  }): Promise<void> {
    const pool = await getPool();

    // Verify author profile exists
    const apCheck = await pool
      .request()
      .input('authorProfileId', sql.UniqueIdentifier, params.authorProfileId)
      .query(`SELECT 1 FROM dbo.AuthorProfiles WHERE AuthorProfileId = @authorProfileId;`);
    if (apCheck.recordset.length === 0) {
      throw new Error('AuthorProfile not found.');
    }

    // Determine display order if not specified
    let displayOrder = params.displayOrder;
    if (!displayOrder) {
      const orderRes = await pool
        .request()
        .input('bookId', sql.UniqueIdentifier, params.bookId)
        .query(`SELECT ISNULL(MAX(DisplayOrder), 0) + 1 AS NextOrder FROM dbo.BookAuthors WHERE BookId = @bookId;`);
      displayOrder = orderRes.recordset[0].NextOrder;
    }

    await pool
      .request()
      .input('bookId', sql.UniqueIdentifier, params.bookId)
      .input('authorProfileId', sql.UniqueIdentifier, params.authorProfileId)
      .input('contributionRole', sql.VarChar(30), params.contributionRole)
      .input('displayOrder', sql.Int, displayOrder)
      .query(`
        INSERT INTO dbo.BookAuthors (BookId, AuthorProfileId, ContributionRole, DisplayOrder)
        VALUES (@bookId, @authorProfileId, @contributionRole, @displayOrder);
      `);
  }

  /**
   * Removes a co-author from a book.
   */
  async removeBookAuthor(bookId: string, authorProfileId: string): Promise<void> {
    const pool = await getPool();

    // Check count of authors remaining
    const countRes = await pool
      .request()
      .input('bookId', sql.UniqueIdentifier, bookId)
      .query(`SELECT COUNT(*) AS Cnt FROM dbo.BookAuthors WHERE BookId = @bookId;`);
    if (countRes.recordset[0].Cnt <= 1) {
      throw new Error('Cannot remove the only author of a book.');
    }

    await pool
      .request()
      .input('bookId', sql.UniqueIdentifier, bookId)
      .input('authorProfileId', sql.UniqueIdentifier, authorProfileId)
      .query(`
        DELETE FROM dbo.BookAuthors
        WHERE BookId = @bookId AND AuthorProfileId = @authorProfileId;
      `);
  }

  async getAllPublished(options?: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<BookDetailDto[]> {
    const pool = await getPool();
    const searchPattern = options?.search ? `%${options.search.trim().toLowerCase()}%` : null;

    const request = pool.request();
    if (searchPattern) {
      request.input('search', sql.NVarChar(255), searchPattern);
    }

    const query = `
      SELECT
        b.BookId,
        b.Title,
        b.Description,
        b.CoverUrl,
        b.LanguageCode,
        b.PublicationStatus,
        b.PublishedAt,
        b.CreatedAt,
        b.UpdatedAt,
        ap.AuthorProfileId,
        ap.PenName,
        ba.ContributionRole,
        ba.DisplayOrder,
        bf.BookFileId,
        bf.VersionNumber,
        bf.OriginalFileName,
        bf.MimeType,
        bf.SizeBytes,
        bf.Sha256,
        bf.AccessLevel,
        bf.IsCurrent,
        bf.StorageProvider,
        bf.CreatedAt AS FileCreatedAt
      FROM dbo.Books b
      LEFT JOIN dbo.BookAuthors ba ON b.BookId = ba.BookId
      LEFT JOIN dbo.AuthorProfiles ap ON ba.AuthorProfileId = ap.AuthorProfileId
      LEFT JOIN dbo.BookFiles bf ON b.BookId = bf.BookId AND bf.IsCurrent = 1
      WHERE b.PublicationStatus = 'PUBLISHED'
      ${
        searchPattern
          ? `AND (LOWER(b.Title) LIKE @search OR LOWER(b.Description) LIKE @search OR LOWER(ap.PenName) LIKE @search)`
          : ''
      }
      ORDER BY b.PublishedAt DESC, ba.DisplayOrder ASC;
    `;

    const result = await request.query(query);
    return this.mapRowsToBooks(result.recordset);
  }

  /**
   * Returns all books authored by a user (including DRAFT, UNLISTED, ARCHIVED).
   */
  async getBooksByAuthorUserId(userId: string): Promise<BookDetailDto[]> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT
          b.BookId,
          b.Title,
          b.Description,
          b.CoverUrl,
          b.LanguageCode,
          b.PublicationStatus,
          b.PublishedAt,
          b.CreatedAt,
          b.UpdatedAt,
          ap.AuthorProfileId,
          ap.PenName,
          ba.ContributionRole,
          ba.DisplayOrder,
          bf.BookFileId,
          bf.VersionNumber,
          bf.OriginalFileName,
          bf.MimeType,
          bf.SizeBytes,
          bf.Sha256,
          bf.AccessLevel,
          bf.IsCurrent,
          bf.StorageProvider,
          bf.CreatedAt AS FileCreatedAt
        FROM dbo.Books b
        INNER JOIN dbo.BookAuthors myBa ON b.BookId = myBa.BookId
        INNER JOIN dbo.AuthorProfiles myAp ON myBa.AuthorProfileId = myAp.AuthorProfileId AND myAp.UserId = @userId
        LEFT JOIN dbo.BookAuthors ba ON b.BookId = ba.BookId
        LEFT JOIN dbo.AuthorProfiles ap ON ba.AuthorProfileId = ap.AuthorProfileId
        LEFT JOIN dbo.BookFiles bf ON b.BookId = bf.BookId AND bf.IsCurrent = 1
        ORDER BY b.UpdatedAt DESC, ba.DisplayOrder ASC;
      `);

    return this.mapRowsToBooks(result.recordset);
  }

  async getById(bookId: string): Promise<BookDetailDto | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('bookId', sql.UniqueIdentifier, bookId)
      .query(`
        SELECT
          b.BookId,
          b.Title,
          b.Description,
          b.CoverUrl,
          b.LanguageCode,
          b.PublicationStatus,
          b.PublishedAt,
          b.CreatedAt,
          b.UpdatedAt,
          ap.AuthorProfileId,
          ap.PenName,
          ba.ContributionRole,
          ba.DisplayOrder,
          bf.BookFileId,
          bf.VersionNumber,
          bf.OriginalFileName,
          bf.MimeType,
          bf.SizeBytes,
          bf.Sha256,
          bf.AccessLevel,
          bf.IsCurrent,
          bf.StorageProvider,
          bf.CreatedAt AS FileCreatedAt
        FROM dbo.Books b
        LEFT JOIN dbo.BookAuthors ba ON b.BookId = ba.BookId
        LEFT JOIN dbo.AuthorProfiles ap ON ba.AuthorProfileId = ap.AuthorProfileId
        LEFT JOIN dbo.BookFiles bf ON b.BookId = bf.BookId AND bf.IsCurrent = 1
        WHERE b.BookId = @bookId
        ORDER BY ba.DisplayOrder ASC;
      `);

    if (result.recordset.length === 0) return null;
    const books = this.mapRowsToBooks(result.recordset);
    return books[0] || null;
  }

  private mapRowsToBooks(recordset: any[]): BookDetailDto[] {
    const booksMap = new Map<string, BookDetailDto>();

    for (const row of recordset) {
      if (!booksMap.has(row.BookId)) {
        booksMap.set(row.BookId, {
          bookId: row.BookId,
          title: row.Title,
          description: row.Description,
          coverUrl: row.CoverUrl,
          languageCode: row.LanguageCode,
          publicationStatus: row.PublicationStatus,
          publishedAt: row.PublishedAt,
          createdAt: row.CreatedAt,
          updatedAt: row.UpdatedAt,
          authors: [],
          currentFile: row.BookFileId
            ? {
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
                createdAt: row.FileCreatedAt,
              }
            : null,
        });
      }

      if (row.AuthorProfileId) {
        const book = booksMap.get(row.BookId)!;
        if (!book.authors.some((a) => a.authorProfileId === row.AuthorProfileId)) {
          book.authors.push({
            authorProfileId: row.AuthorProfileId,
            penName: row.PenName,
            contributionRole: row.ContributionRole,
            displayOrder: row.DisplayOrder,
          });
        }
      }
    }

    return Array.from(booksMap.values());
  }
}

export const bookRepository = new BookRepository();
