import type { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';
import type { RoleCode } from '../types/index.js';

export function requireRole(...requiredRoles: RoleCode[]) {
  return (req: Request, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 'AUTHENTICATION_REQUIRED', 401);
    }

    const hasRole = req.user.roles.some((role) => requiredRoles.includes(role));
    if (!hasRole) {
      return sendError(
        res,
        `Access denied. Requires one of roles: [${requiredRoles.join(', ')}].`,
        'FORBIDDEN',
        403
      );
    }

    return next();
  };
}
