import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { config } from '../config/env.js';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { email, password, displayName, avatarUrl } = req.body;
      const user = await authService.register({
        email,
        password,
        displayName,
        avatarUrl,
      });

      return sendSuccess(res, user, 201);
    } catch (err) {
      return next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });

      // Set HttpOnly cookie for web security
      res.cookie('bookchain_token', result.token, {
        httpOnly: true,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
        expires: result.expiresAt,
      });

      return sendSuccess(res, {
        user: result.user,
        token: result.token,
      });
    } catch (err) {
      return next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      if (req.user?.sessionId) {
        await authService.logout(req.user.sessionId);
      }

      res.clearCookie('bookchain_token', {
        httpOnly: true,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
      });

      return sendSuccess(res, { message: 'Logged out successfully.' });
    } catch (err) {
      return next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthenticated', 'AUTHENTICATION_REQUIRED', 401);
      }

      const user = await authService.getCurrentUser(req.user.userId);
      if (!user) {
        return sendError(res, 'User not found', 'USER_NOT_FOUND', 404);
      }

      return sendSuccess(res, user);
    } catch (err) {
      return next(err);
    }
  }
}

export const authController = new AuthController();
