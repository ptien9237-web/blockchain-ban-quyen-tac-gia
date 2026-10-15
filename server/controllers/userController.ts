import type { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService.js';
import { authService } from '../services/authService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) {
        return sendError(res, 'Authentication required.', 'AUTHENTICATION_REQUIRED', 401);
      }

      const user = await authService.getCurrentUser(req.user.userId);
      if (!user) {
        return sendError(res, 'User not found.', 'USER_NOT_FOUND', 404);
      }

      return sendSuccess(res, user);
    } catch (err) {
      return next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) {
        return sendError(res, 'Authentication required.', 'AUTHENTICATION_REQUIRED', 401);
      }

      const { displayName, avatarUrl } = req.body;
      const updated = await userService.updateProfile(req.user.userId, {
        displayName,
        avatarUrl,
      });

      return sendSuccess(res, updated);
    } catch (err) {
      return next(err);
    }
  }

  async registerAuthorProfile(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) {
        return sendError(res, 'Authentication required.', 'AUTHENTICATION_REQUIRED', 401);
      }

      const { penName, bio } = req.body;
      const updated = await userService.registerAuthorProfile(req.user.userId, {
        penName,
        bio,
      });

      return sendSuccess(res, updated);
    } catch (err) {
      return next(err);
    }
  }
}

export const userController = new UserController();
