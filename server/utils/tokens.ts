import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import type { AuthTokenPayload } from '../types/index.js';

export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: `${config.jwt.expiresInDays}d`,
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AuthTokenPayload;
    return decoded;
  } catch {
    return null;
  }
}
