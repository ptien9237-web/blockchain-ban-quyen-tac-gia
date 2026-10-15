import type fs from 'fs';
import { bookRepository } from '../repositories/bookRepository.js';
import { bookFileRepository } from '../repositories/bookFileRepository.js';
import { authorProfileRepository } from '../repositories/authorProfileRepository.js';
import { unifiedStorageService as storageService } from './storage/storageManager.js';
import type {
  BookDetailDto,
  BookFileDto,
  PublicationStatus,
  ContributionRole,
  AccessLevel,
  RoleCode,
} from '../types/index.js';

export interface FileDownloadStreamResult {
  stream: fs.ReadStream;
  mimeType: string;
  originalFileName: string;
  sizeBytes: number;
}

export class BookService {
  async getAuthorProfileByUserId(userId: string) {
    return authorProfileRepository.findByUserId(userId);
  }

  async getPublicAuthors() {
    return authorProfileRepository.getPublicAuthors();
  }

  async getAllPublished(options?: { search?: string }): Promise<BookDetailDto[]> {
    return bookRepository.getAllPublished(options);
  }

  async getById(bookId: string, currentUser?: { userId: string; roles: RoleCode[] }): Promise<BookDetailDto | null> {
    const book = await bookRepository.getById(bookId);
    if (!book) return null;

    // Visibility rules:
    // If PUBLISHED or UNLISTED, anyone can view metadata
    if (book.publicationStatus === 'PUBLISHED' || book.publicationStatus === 'UNLISTED') {
      return book;
    }

    // If DRAFT or ARCHIVED, only an author of this book or an ADMIN can view
    if (!currentUser) {
      return null;
    }

    if (currentUser.roles.includes('ADMIN')) {
      return book;
    }

    const isAuthor = await bookRepository.isUserBookAuthor(bookId, currentUser.userId);
    if (!isAuthor) {
      return null;
    }

    return book;
  }

  async getMyBooks(userId: string): Promise<BookDetailDto[]> {
    return bookRepository.getBooksByAuthorUserId(userId);
  }

  async createBook(
    userId: string,
    params: {
      title: string;
      description?: string | null;
      coverUrl?: string | null;
      languageCode?: string | null;
      publicationStatus?: PublicationStatus;
    }
  ): Promise<BookDetailDto> {
    // 1. User must have an AuthorProfile
    const authorProfile = await authorProfileRepository.findByUserId(userId);
    if (!authorProfile) {
      throw new Error(
        'AUTHOR_PROFILE_REQUIRED: You must create an Author Profile (Pen Name) before creating works.'
      );
    }

    if (authorProfile.VerificationStatus === 'REJECTED') {
      const reasonSuffix = authorProfile.VerificationNote
        ? ` (Lý do: ${authorProfile.VerificationNote})`
        : '';
      throw new Error(
        `AUTHOR_PROFILE_REJECTED: Hồ sơ tác giả của bạn đã bị từ chối phê duyệt${reasonSuffix}. Bạn không thể đăng ký tác phẩm mới.`
      );
    }

    if (!params.title || params.title.trim().length === 0) {
      throw new Error('Title is required and cannot be empty.');
    }

    return bookRepository.createBook({
      title: params.title.trim(),
      description: params.description?.trim() || null,
      coverUrl: params.coverUrl?.trim() || null,
      languageCode: params.languageCode?.trim() || 'vi',
      publicationStatus: params.publicationStatus || 'DRAFT',
      primaryAuthorProfileId: authorProfile.AuthorProfileId,
    });
  }

  async updateBook(
    userId: string,
    userRoles: RoleCode[],
    bookId: string,
    params: {
      title?: string;
      description?: string | null;
      coverUrl?: string | null;
      languageCode?: string | null;
    }
  ): Promise<BookDetailDto> {
    await this.assertCanManageBook(userId, userRoles, bookId);

    if (params.title !== undefined && params.title.trim().length === 0) {
      throw new Error('Title cannot be empty.');
    }

    await bookRepository.updateBook(bookId, params);
    const updated = await bookRepository.getById(bookId);
    if (!updated) throw new Error('Book not found after update.');
    return updated;
  }

  async updatePublicationStatus(
    userId: string,
    userRoles: RoleCode[],
    bookId: string,
    status: PublicationStatus
  ): Promise<BookDetailDto> {
    await this.assertCanManageBook(userId, userRoles, bookId);

    const validStatuses: PublicationStatus[] = ['DRAFT', 'PUBLISHED', 'UNLISTED', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid publication status '${status}'.`);
    }

    await bookRepository.updatePublicationStatus(bookId, status);
    const updated = await bookRepository.getById(bookId);
    if (!updated) throw new Error('Book not found after status change.');
    return updated;
  }

  async addCoAuthor(
    userId: string,
    userRoles: RoleCode[],
    bookId: string,
    params: {
      authorProfileId: string;
      contributionRole: ContributionRole;
      displayOrder?: number;
    }
  ): Promise<BookDetailDto> {
    await this.assertCanManageBook(userId, userRoles, bookId);

    const validRoles: ContributionRole[] = ['PRIMARY_AUTHOR', 'CO_AUTHOR', 'EDITOR', 'TRANSLATOR'];
    if (!validRoles.includes(params.contributionRole)) {
      throw new Error(`Invalid contribution role '${params.contributionRole}'.`);
    }

    await bookRepository.addBookAuthor({
      bookId,
      authorProfileId: params.authorProfileId,
      contributionRole: params.contributionRole,
      displayOrder: params.displayOrder,
    });

    const updated = await bookRepository.getById(bookId);
    if (!updated) throw new Error('Book not found.');
    return updated;
  }

  async removeCoAuthor(
    userId: string,
    userRoles: RoleCode[],
    bookId: string,
    authorProfileId: string
  ): Promise<BookDetailDto> {
    await this.assertCanManageBook(userId, userRoles, bookId);

    await bookRepository.removeBookAuthor(bookId, authorProfileId);
    const updated = await bookRepository.getById(bookId);
    if (!updated) throw new Error('Book not found.');
    return updated;
  }

  async uploadFileVersion(
    userId: string,
    userRoles: RoleCode[],
    bookId: string,
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    },
    options?: {
      accessLevel?: AccessLevel;
      isCurrent?: boolean;
      storageProvider?: 'LOCAL' | 'IPFS';
    }
  ): Promise<BookFileDto> {
    await this.assertCanManageBook(userId, userRoles, bookId);

    const accessLevel: AccessLevel = options?.accessLevel || 'PUBLIC_READ';
    const isCurrent = options?.isCurrent !== undefined ? options.isCurrent : true;

    // 1. Save file to safe storage (Local or IPFS) and compute exact SHA-256
    const storageRes = await storageService.saveFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      options?.storageProvider
    );

    try {
      // 2. Persist version in database transaction
      const fileRecord = await bookFileRepository.createFileVersion({
        bookId,
        storageProvider: storageRes.storageProvider,
        storageKey: storageRes.storageKey,
        originalFileName: file.originalname,
        mimeType: file.mimetype || 'application/pdf',
        sizeBytes: storageRes.sizeBytes,
        sha256: storageRes.sha256,
        accessLevel,
        isCurrent,
        uploadedByUserId: userId,
      });

      return fileRecord;
    } catch (dbErr) {
      // Cleanup orphaned file if database write fails
      await storageService.deleteFile(storageRes.storageKey);
      throw dbErr;
    }
  }

  async getFileVersions(
    currentUser: { userId: string; roles: RoleCode[] } | null,
    bookId: string
  ): Promise<BookFileDto[]> {
    const book = await bookRepository.getById(bookId);
    if (!book) throw new Error('Book not found.');

    const isAuthor =
      currentUser &&
      (currentUser.roles.includes('ADMIN') ||
        (await bookRepository.isUserBookAuthor(bookId, currentUser.userId)));

    const allFiles = await bookFileRepository.getFilesByBookId(bookId);

    if (isAuthor) {
      return allFiles;
    }

    // Public readers only see files with PUBLIC_READ or PUBLIC_DOWNLOAD
    return allFiles.filter(
      (f) => f.accessLevel === 'PUBLIC_READ' || f.accessLevel === 'PUBLIC_DOWNLOAD'
    );
  }

  async getFileForReading(
    currentUser: { userId: string; roles: RoleCode[] } | null,
    bookId: string,
    fileId: string
  ): Promise<FileDownloadStreamResult> {
    const file = await bookFileRepository.getFileById(fileId);
    if (!file || file.BookId !== bookId) {
      throw new Error('NOT_FOUND: Book file not found.');
    }

    // Check reading permission
    if (file.AccessLevel === 'PRIVATE') {
      const canAccess =
        currentUser &&
        (currentUser.roles.includes('ADMIN') ||
          (await bookRepository.isUserBookAuthor(bookId, currentUser.userId)));
      if (!canAccess) {
        throw new Error('FORBIDDEN: You do not have permission to read this private file.');
      }
    }

    const stream = await storageService.getFileStream(file.StorageKey, file.StorageProvider);
    return {
      stream,
      mimeType: file.MimeType,
      originalFileName: file.OriginalFileName,
      sizeBytes: Number(file.SizeBytes),
    };
  }

  async getFileForDownload(
    currentUser: { userId: string; roles: RoleCode[] } | null,
    bookId: string,
    fileId: string
  ): Promise<FileDownloadStreamResult> {
    const file = await bookFileRepository.getFileById(fileId);
    if (!file || file.BookId !== bookId) {
      throw new Error('NOT_FOUND: Book file not found.');
    }

    const isAuthorOrAdmin =
      currentUser &&
      (currentUser.roles.includes('ADMIN') ||
        (await bookRepository.isUserBookAuthor(bookId, currentUser.userId)));

    if (file.AccessLevel === 'PRIVATE') {
      if (!isAuthorOrAdmin) {
        throw new Error('FORBIDDEN: You do not have permission to download this private file.');
      }
    } else if (file.AccessLevel === 'PUBLIC_READ') {
      // PUBLIC_READ means online reading only; downloading original file is reserved for author/admin
      if (!isAuthorOrAdmin) {
        throw new Error(
          'FORBIDDEN: This document is published for online reading only. Direct raw download is restricted.'
        );
      }
    }
    // PUBLIC_DOWNLOAD: everyone is allowed

    const stream = await storageService.getFileStream(file.StorageKey, file.StorageProvider);
    return {
      stream,
      mimeType: file.MimeType,
      originalFileName: file.OriginalFileName,
      sizeBytes: Number(file.SizeBytes),
    };
  }

  async verifyFileIntegrity(
    currentUser: { userId: string; roles: RoleCode[] } | null,
    bookId: string,
    fileId: string
  ): Promise<{
    bookId: string;
    fileId: string;
    versionNumber: number;
    recordedSha256: string;
    actualSha256: string | null;
    matches: boolean;
    fileExistsOnDisk: boolean;
    status: 'MATCH' | 'MISMATCH' | 'FILE_NOT_FOUND';
    details: string;
  }> {
    const file = await bookFileRepository.getFileById(fileId);
    if (!file || file.BookId !== bookId) {
      throw new Error('NOT_FOUND: File not found.');
    }

    if (file.AccessLevel === 'PRIVATE') {
      const canAccess =
        currentUser &&
        (currentUser.roles.includes('ADMIN') ||
          (await bookRepository.isUserBookAuthor(bookId, currentUser.userId)));
      if (!canAccess) {
        throw new Error('FORBIDDEN: Access denied to private file.');
      }
    }

    const verifyResult = await storageService.verifyFileHash(file.StorageKey, file.Sha256, file.StorageProvider);

    let status: 'MATCH' | 'MISMATCH' | 'FILE_NOT_FOUND' = 'FILE_NOT_FOUND';
    let details = 'File is missing from disk storage.';

    if (verifyResult.fileExists) {
      if (verifyResult.matches) {
        status = 'MATCH';
        details = 'File bytes match the recorded SHA-256 fingerprint exactly 100%.';
      } else {
        status = 'MISMATCH';
        details = 'Integrity alert: File bytes on storage have been altered or corrupted.';
      }
    }

    return {
      bookId,
      fileId,
      versionNumber: file.VersionNumber,
      recordedSha256: file.Sha256.trim().toLowerCase(),
      actualSha256: verifyResult.actualSha256 || null,
      matches: verifyResult.matches,
      fileExistsOnDisk: verifyResult.fileExists,
      status,
      details,
    };
  }

  async verifyByHash(sha256: string): Promise<{
    found: boolean;
    file?: BookFileDto;
    book?: {
      bookId: string;
      title: string;
      publicationStatus: string;
    };
    integrityCheck?: {
      matches: boolean;
      fileExists: boolean;
    };
  }> {
    const match = await bookFileRepository.findFileBySha256(sha256);
    if (!match) {
      return { found: false };
    }

    const fileRecord = await bookFileRepository.getFileById(match.bookFileId);
    let integrityCheck = { matches: false, fileExists: false };

    if (fileRecord) {
      const res = await storageService.verifyFileHash(fileRecord.StorageKey, fileRecord.Sha256);
      integrityCheck = { matches: res.matches, fileExists: res.fileExists };
    }

    return {
      found: true,
      file: match,
      book: {
        bookId: match.bookId,
        title: match.bookTitle,
        publicationStatus: match.bookPublicationStatus,
      },
      integrityCheck,
    };
  }

  /**
   * Enforces that currentUser is an author of the book or an ADMIN.
   * Prevents IDOR vulnerabilities.
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
        'FORBIDDEN: You do not have ownership or author rights to modify this work.'
      );
    }
  }
}

export const bookService = new BookService();
