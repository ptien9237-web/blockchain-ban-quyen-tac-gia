import type { Request, Response, NextFunction } from 'express';
import { bookService } from '../services/bookService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import type { RoleCode, PublicationStatus, ContributionRole, AccessLevel } from '../types/index.js';

export class BookController {
  async getAllPublished(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const books = await bookService.getAllPublished({ search });
      return sendSuccess(res, books);
    } catch (err) {
      return next(err);
    }
  }

  async getAuthors(_req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const authors = await bookService.getPublicAuthors();
      return sendSuccess(res, authors);
    } catch (err) {
      return next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user as { userId: string; roles: RoleCode[] } | undefined;
      const book = await bookService.getById(id, currentUser);
      if (!book) {
        return sendError(res, 'Work not found or access restricted.', 'NOT_FOUND', 404);
      }
      return sendSuccess(res, book);
    } catch (err) {
      return next(err);
    }
  }

  async getMyBooks(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const user = (req as any).user;
      if (!user) {
        return sendError(res, 'Authentication required.', 'UNAUTHORIZED', 401);
      }
      const books = await bookService.getMyBooks(user.userId);
      return sendSuccess(res, books);
    } catch (err) {
      return next(err);
    }
  }

  async createBook(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const user = (req as any).user;
      if (!user) {
        return sendError(res, 'Authentication required.', 'UNAUTHORIZED', 401);
      }

      // Check author profile first
      const authorProfile = await bookService.getAuthorProfileByUserId(user.userId);
      if (!authorProfile) {
        return sendError(
          res,
          'AUTHOR_PROFILE_REQUIRED: You must create an Author Profile (Pen Name) before creating works.',
          'AUTHOR_PROFILE_REQUIRED',
          403
        );
      }

      if (authorProfile.VerificationStatus === 'REJECTED') {
        const reasonSuffix = authorProfile.VerificationNote
          ? ` (Lý do: ${authorProfile.VerificationNote})`
          : '';
        return sendError(
          res,
          `AUTHOR_PROFILE_REJECTED: Hồ sơ tác giả của bạn đã bị từ chối phê duyệt${reasonSuffix}. Bạn không thể đăng ký tác phẩm mới.`,
          'AUTHOR_PROFILE_REJECTED',
          403
        );
      }

      const roles: string[] = user.roles || [];
      if (!roles.includes('AUTHOR') && !roles.includes('ADMIN')) {
        return sendError(
          res,
          'AUTHOR_ROLE_REQUIRED: Bạn cần có vai trò Tác giả (AUTHOR) được phê duyệt để tạo tác phẩm.',
          'AUTHOR_ROLE_REQUIRED',
          403
        );
      }

      const { title, description, coverUrl, languageCode, publicationStatus } = req.body;

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return sendError(res, 'Title is required.', 'VALIDATION_ERROR', 400);
      }

      const book = await bookService.createBook(user.userId, {
        title,
        description,
        coverUrl,
        languageCode,
        publicationStatus: publicationStatus as PublicationStatus,
      });

      return sendSuccess(res, book, 201);
    } catch (err: any) {
      if (err.message?.includes('AUTHOR_PROFILE_REQUIRED')) {
        return sendError(res, err.message, 'AUTHOR_PROFILE_REQUIRED', 403);
      }
      if (err.message?.includes('AUTHOR_PROFILE_REJECTED')) {
        return sendError(res, err.message, 'AUTHOR_PROFILE_REJECTED', 403);
      }
      return next(err);
    }
  }

  async updateBook(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { title, description, coverUrl, languageCode } = req.body;

      const book = await bookService.updateBook(user.userId, user.roles, id, {
        title,
        description,
        coverUrl,
        languageCode,
      });

      return sendSuccess(res, book);
    } catch (err: any) {
      if (err.message?.includes('FORBIDDEN')) {
        return sendError(res, err.message, 'FORBIDDEN', 403);
      }
      return next(err);
    }
  }

  async updatePublicationStatus(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return sendError(res, 'Publication status is required.', 'VALIDATION_ERROR', 400);
      }

      const book = await bookService.updatePublicationStatus(
        user.userId,
        user.roles,
        id,
        status as PublicationStatus
      );

      return sendSuccess(res, book);
    } catch (err: any) {
      if (err.message?.includes('FORBIDDEN')) {
        return sendError(res, err.message, 'FORBIDDEN', 403);
      }
      return next(err);
    }
  }

  async addCoAuthor(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { authorProfileId, contributionRole, displayOrder } = req.body;

      if (!authorProfileId) {
        return sendError(res, 'authorProfileId is required.', 'VALIDATION_ERROR', 400);
      }

      const book = await bookService.addCoAuthor(user.userId, user.roles, id, {
        authorProfileId,
        contributionRole: (contributionRole as ContributionRole) || 'CO_AUTHOR',
        displayOrder,
      });

      return sendSuccess(res, book);
    } catch (err: any) {
      if (err.message?.includes('FORBIDDEN')) {
        return sendError(res, err.message, 'FORBIDDEN', 403);
      }
      if (err.message?.includes('AuthorProfile not found')) {
        return sendError(res, err.message, 'NOT_FOUND', 404);
      }
      return next(err);
    }
  }

  async removeCoAuthor(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const user = (req as any).user;
      const { id, authorProfileId } = req.params;

      const book = await bookService.removeCoAuthor(user.userId, user.roles, id, authorProfileId);
      return sendSuccess(res, book);
    } catch (err: any) {
      if (err.message?.includes('FORBIDDEN')) {
        return sendError(res, err.message, 'FORBIDDEN', 403);
      }
      return next(err);
    }
  }

  async uploadFileVersion(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        return sendError(res, 'File is required for upload.', 'VALIDATION_ERROR', 400);
      }

      const accessLevel = (req.body.accessLevel as AccessLevel) || 'PUBLIC_READ';
      const isCurrent = req.body.isCurrent !== undefined ? req.body.isCurrent === 'true' || req.body.isCurrent === true : true;
      const storageProvider = (req.body.storageProvider as 'LOCAL' | 'IPFS' | undefined);

      const fileDto = await bookService.uploadFileVersion(
        user.userId,
        user.roles,
        id,
        {
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        },
        {
          accessLevel,
          isCurrent,
          storageProvider,
        }
      );

      return sendSuccess(res, fileDto, 201);
    } catch (err: any) {
      if (err.message?.includes('FORBIDDEN')) {
        return sendError(res, err.message, 'FORBIDDEN', 403);
      }
      return next(err);
    }
  }

  async getFileVersions(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;
      const files = await bookService.getFileVersions(currentUser, id);
      return sendSuccess(res, files);
    } catch (err: any) {
      if (err.message?.includes('Book not found')) {
        return sendError(res, 'Work not found.', 'NOT_FOUND', 404);
      }
      return next(err);
    }
  }

  async readFileStream(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { id, fileId } = req.params;
      const currentUser = (req as any).user;

      const result = await bookService.getFileForReading(currentUser, id, fileId);

      res.setHeader('Content-Type', result.mimeType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(result.originalFileName)}"`
      );
      res.setHeader('Content-Length', result.sizeBytes);
      result.stream.pipe(res);
    } catch (err: any) {
      if (err.message?.includes('NOT_FOUND')) {
        return sendError(res, err.message, 'NOT_FOUND', 404);
      }
      if (err.message?.includes('FORBIDDEN')) {
        return sendError(res, err.message, 'FORBIDDEN', 403);
      }
      return next(err);
    }
  }

  async downloadFileStream(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { id, fileId } = req.params;
      const currentUser = (req as any).user;

      const result = await bookService.getFileForDownload(currentUser, id, fileId);

      res.setHeader('Content-Type', result.mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(result.originalFileName)}"`
      );
      res.setHeader('Content-Length', result.sizeBytes);
      result.stream.pipe(res);
    } catch (err: any) {
      if (err.message?.includes('NOT_FOUND')) {
        return sendError(res, err.message, 'NOT_FOUND', 404);
      }
      if (err.message?.includes('FORBIDDEN')) {
        return sendError(res, err.message, 'FORBIDDEN', 403);
      }
      return next(err);
    }
  }

  async verifyFileIntegrity(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { id, fileId } = req.params;
      const currentUser = (req as any).user;

      const verification = await bookService.verifyFileIntegrity(currentUser, id, fileId);
      return sendSuccess(res, verification);
    } catch (err: any) {
      if (err.message?.includes('NOT_FOUND')) {
        return sendError(res, err.message, 'NOT_FOUND', 404);
      }
      if (err.message?.includes('FORBIDDEN')) {
        return sendError(res, err.message, 'FORBIDDEN', 403);
      }
      return next(err);
    }
  }

  async verifyPublicHash(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const sha256 = (req.params.hash || req.body?.sha256 || req.body?.hash || '').trim();
      if (!sha256 || typeof sha256 !== 'string' || sha256.length !== 64) {
        return sendError(
          res,
          'A valid 64-character hexadecimal SHA-256 hash is required.',
          'VALIDATION_ERROR',
          400
        );
      }

      const result = await bookService.verifyByHash(sha256);
      return sendSuccess(res, result);
    } catch (err) {
      return next(err);
    }
  }
}

export const bookController = new BookController();
