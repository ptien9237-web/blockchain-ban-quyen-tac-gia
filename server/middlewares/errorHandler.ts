import type { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';
import { config } from '../config/env.js';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  const statusCode = err.statusCode || (err.code === 'EMAIL_ALREADY_EXISTS' ? 409 : 400);
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred.';

  const details = config.nodeEnv === 'development' ? err.stack : undefined;
  return sendError(res, message, code, statusCode, details);
}
