import type { Request, Response, NextFunction } from 'express';
import { verifyAuthToken } from '../utils/tokens.js';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { roleRepository } from '../repositories/roleRepository.js';
import { sendError } from '../utils/response.js';
import type { RoleCode, UserStatus } from '../types/index.js';

export interface AuthenticatedUser {
  userId: string;
  sessionId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  status: UserStatus;
  roles: RoleCode[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<any> {
  const token =
    req.cookies?.bookchain_token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7).trim()
      : null);

  if (!token) {
    return sendError(res, 'Authentication required. Please sign in.', 'AUTHENTICATION_REQUIRED', 401);
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return sendError(res, 'Invalid or expired authentication token.', 'TOKEN_INVALID', 401);
  }

  try {
    // Stateful check: ensure session is not revoked in dbo.Sessions
    const session = await sessionRepository.findActiveById(payload.sessionId);
    if (!session) {
      return sendError(res, 'Session has expired or was revoked.', 'SESSION_REVOKED', 401);
    }

    const user = await userRepository.findById(payload.userId);
    if (!user) {
      return sendError(res, 'User not found.', 'USER_NOT_FOUND', 401);
    }

    if (user.Status !== 'ACTIVE') {
      return sendError(res, 'Account is suspended or pending verification.', 'ACCOUNT_INACTIVE', 403);
    }

    const currentRoles = await roleRepository.getRolesForUser(user.UserId);

    req.user = {
      userId: user.UserId,
      sessionId: session.SessionId,
      email: user.Email,
      displayName: user.DisplayName,
      avatarUrl: user.AvatarUrl,
      status: user.Status,
      roles: currentRoles,
    };

    // Update LastUsedAt in background without blocking
    sessionRepository.touchSession(session.SessionId).catch(() => {});

    return next();
  } catch (err: any) {
    return sendError(res, 'Authentication verification failed.', 'AUTH_ERROR', 500, err.message);
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<any> {
  const token =
    req.cookies?.bookchain_token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7).trim()
      : null);

  if (!token) {
    return next();
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return next();
  }

  try {
    const session = await sessionRepository.findActiveById(payload.sessionId);
    if (!session) {
      return next();
    }

    const user = await userRepository.findById(payload.userId);
    if (!user || user.Status !== 'ACTIVE') {
      return next();
    }

    const currentRoles = await roleRepository.getRolesForUser(user.UserId);

    req.user = {
      userId: user.UserId,
      sessionId: session.SessionId,
      email: user.Email,
      displayName: user.DisplayName,
      avatarUrl: user.AvatarUrl,
      status: user.Status,
      roles: currentRoles,
    };

    sessionRepository.touchSession(session.SessionId).catch(() => {});
  } catch {
    // Silently continue as unauthenticated on error
  }

  return next();
}
