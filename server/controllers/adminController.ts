import type { Request, Response, NextFunction } from 'express';
import { invitationService } from '../services/invitationService.js';
import { authorProfileRepository } from '../repositories/authorProfileRepository.js';
import { getPool } from '../db/sqlServer.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AdminController {
  async getOverviewStats(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const user = req.user;
      if (!user) {
        return sendError(res, 'Authentication required.', 'UNAUTHORIZED', 401);
      }

      const pool = await getPool();
      const result = await pool.request().query(`
        SELECT 
          (SELECT COUNT(1) FROM dbo.AuthorProfiles WHERE VerificationStatus = 'PENDING') AS PendingAuthorRequests,
          (SELECT COUNT(1) FROM dbo.AuthorProfiles WHERE VerificationStatus = 'VERIFIED') AS VerifiedAuthors,
          (SELECT COUNT(1) FROM dbo.AuthorInvitations WHERE RevokedAt IS NULL AND ExpiresAt > SYSUTCDATETIME() AND (MaxUses = 0 OR UsedCount < MaxUses)) AS ActiveInvitations,
          (SELECT COUNT(1) FROM dbo.Reports WHERE Status IN ('OPEN', 'IN_REVIEW')) AS OpenDisputes,
          (SELECT COUNT(1) FROM dbo.Reports WHERE Status = 'RESOLVED') AS ResolvedDisputes,
          (SELECT COUNT(1) FROM dbo.CopyrightRecords WHERE RecordStatus = 'ON_CHAIN') AS OnChainRecords,
          (SELECT COUNT(1) FROM dbo.Books WHERE PublicationStatus = 'PUBLISHED') AS PublishedBooks,
          (SELECT COUNT(1) FROM dbo.Users WHERE Status = 'ACTIVE') AS TotalUsers;
      `);

      const stats = result.recordset[0] || {};
      return sendSuccess(res, {
        pendingAuthorRequests: stats.PendingAuthorRequests || 0,
        verifiedAuthors: stats.VerifiedAuthors || 0,
        activeInvitations: stats.ActiveInvitations || 0,
        openDisputes: stats.OpenDisputes || 0,
        resolvedDisputes: stats.ResolvedDisputes || 0,
        onChainRecords: stats.OnChainRecords || 0,
        publishedBooks: stats.PublishedBooks || 0,
        totalUsers: stats.TotalUsers || 0,
      });
    } catch (err) {
      return next(err);
    }
  }

  async listInvitations(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const user = req.user;
      if (!user) {
        return sendError(res, 'Authentication required.', 'UNAUTHORIZED', 401);
      }

      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;

      const result = await invitationService.listInvitations(user.userId, page, limit);
      return sendSuccess(res, result);
    } catch (err) {
      return next(err);
    }
  }

  async createInvitation(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const user = req.user;
      if (!user) {
        return sendError(res, 'Authentication required.', 'UNAUTHORIZED', 401);
      }

      const { expiresInDays, maxUses, note } = req.body;
      const result = await invitationService.createInvitation(user.userId, {
        expiresInDays,
        maxUses,
        note,
      });

      return sendSuccess(res, result, 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Không thể tạo mã mời.', 'VALIDATION_ERROR', 400);
    }
  }

  async revokeInvitation(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const user = req.user;
      if (!user) {
        return sendError(res, 'Authentication required.', 'UNAUTHORIZED', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Invitation ID is required.', 'VALIDATION_ERROR', 400);
      }

      await invitationService.revokeInvitation(user.userId, id);
      return sendSuccess(res, { message: 'Đã thu hồi mã mời thành công.' });
    } catch (err: any) {
      if (err.message?.includes('NOT_FOUND')) {
        return sendError(res, err.message, 'NOT_FOUND', 404);
      }
      return sendError(res, err.message || 'Không thể thu hồi mã mời.', 'BAD_REQUEST', 400);
    }
  }

  async listAuthorRequests(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const user = req.user;
      if (!user) {
        return sendError(res, 'Authentication required.', 'UNAUTHORIZED', 401);
      }

      const status = (req.query.status as string) || 'ALL';
      const search = (req.query.search as string) || '';
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;

      const result = await authorProfileRepository.getAuthorRequests({
        status,
        search,
        page,
        limit,
      });

      return sendSuccess(res, result);
    } catch (err) {
      return next(err);
    }
  }

  async approveAuthorRequest(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const user = req.user;
      if (!user) {
        return sendError(res, 'Authentication required.', 'UNAUTHORIZED', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Author profile ID is required.', 'VALIDATION_ERROR', 400);
      }

      const { note } = req.body || {};
      const updated = await authorProfileRepository.approveAuthorRequest(
        id,
        user.userId,
        note
      );

      return sendSuccess(res, {
        message: 'Đã phê duyệt yêu cầu bút danh tác giả thành công.',
        authorProfileId: updated.AuthorProfileId,
        userId: updated.UserId,
        penName: updated.PenName,
        bio: updated.Bio,
        verificationStatus: updated.VerificationStatus,
        verificationNote: updated.VerificationNote,
        reviewedByUserId: updated.ReviewedByUserId,
        reviewedAt: updated.ReviewedAt,
        authorProfile: {
          authorProfileId: updated.AuthorProfileId,
          userId: updated.UserId,
          penName: updated.PenName,
          bio: updated.Bio,
          verificationStatus: updated.VerificationStatus,
          verificationNote: updated.VerificationNote,
          reviewedByUserId: updated.ReviewedByUserId,
          reviewedAt: updated.ReviewedAt,
        },
      });
    } catch (err: any) {
      if (err.message?.includes('REQUEST_NOT_FOUND')) {
        return sendError(res, err.message, 'NOT_FOUND', 404);
      }
      if (err.message?.includes('REQUEST_ALREADY_PROCESSED')) {
        return sendError(res, err.message, 'REQUEST_ALREADY_PROCESSED', 400);
      }
      return sendError(res, err.message || 'Không thể phê duyệt yêu cầu bút danh.', 'BAD_REQUEST', 400);
    }
  }

  async rejectAuthorRequest(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const user = req.user;
      if (!user) {
        return sendError(res, 'Authentication required.', 'UNAUTHORIZED', 401);
      }

      const { id } = req.params;
      if (!id) {
        return sendError(res, 'Author profile ID is required.', 'VALIDATION_ERROR', 400);
      }

      const { reason } = req.body || {};
      if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
        return sendError(
          res,
          'Vui lòng cung cấp lý do từ chối rõ ràng (tối thiểu 3 ký tự).',
          'VALIDATION_ERROR',
          400
        );
      }

      const updated = await authorProfileRepository.rejectAuthorRequest(
        id,
        user.userId,
        reason.trim()
      );

      return sendSuccess(res, {
        message: 'Đã từ chối yêu cầu bút danh tác giả.',
        authorProfileId: updated.AuthorProfileId,
        userId: updated.UserId,
        penName: updated.PenName,
        bio: updated.Bio,
        verificationStatus: updated.VerificationStatus,
        verificationNote: updated.VerificationNote,
        reviewedByUserId: updated.ReviewedByUserId,
        reviewedAt: updated.ReviewedAt,
        authorProfile: {
          authorProfileId: updated.AuthorProfileId,
          userId: updated.UserId,
          penName: updated.PenName,
          bio: updated.Bio,
          verificationStatus: updated.VerificationStatus,
          verificationNote: updated.VerificationNote,
          reviewedByUserId: updated.ReviewedByUserId,
          reviewedAt: updated.ReviewedAt,
        },
      });
    } catch (err: any) {
      if (err.message?.includes('REQUEST_NOT_FOUND')) {
        return sendError(res, err.message, 'NOT_FOUND', 404);
      }
      if (err.message?.includes('REQUEST_ALREADY_PROCESSED')) {
        return sendError(res, err.message, 'REQUEST_ALREADY_PROCESSED', 400);
      }
      return sendError(res, err.message || 'Không thể từ chối yêu cầu bút danh.', 'BAD_REQUEST', 400);
    }
  }
}

export const adminController = new AdminController();
