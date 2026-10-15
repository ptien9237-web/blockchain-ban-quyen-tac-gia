import type { Request, Response, NextFunction } from 'express';
import { invitationService } from '../services/invitationService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class InvitationController {
  async redeemInvitation(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const user = req.user;
      if (!user) {
        return sendError(res, 'Authentication required.', 'UNAUTHORIZED', 401);
      }

      const { code } = req.body;
      if (!code || typeof code !== 'string' || code.trim().length === 0) {
        return sendError(res, 'Vui lòng nhập mã mời tác giả.', 'VALIDATION_ERROR', 400);
      }

      const result = await invitationService.redeemInvitation(user.userId, code.trim());
      return sendSuccess(res, result);
    } catch (err: any) {
      if (
        err.message?.includes('INVALID_CODE') ||
        err.message?.includes('INVITATION_EXPIRED') ||
        err.message?.includes('INVITATION_REVOKED') ||
        err.message?.includes('INVITATION_EXHAUSTED') ||
        err.message?.includes('INVITATION_ALREADY_USED')
      ) {
        return sendError(res, err.message, 'INVITATION_ERROR', 400);
      }
      return next(err);
    }
  }
}

export const invitationController = new InvitationController();
