import { userRepository } from '../repositories/userRepository.js';
import { roleRepository } from '../repositories/roleRepository.js';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { authorProfileRepository } from '../repositories/authorProfileRepository.js';
import { hashPassword, comparePassword, normalizeEmail, hashToken } from '../utils/hash.js';
import { generateOpaqueToken, signAuthToken } from '../utils/tokens.js';
import { config } from '../config/env.js';
import type { UserPublicProfile, AuthorProfilePublic } from '../types/index.js';

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: UserPublicProfile;
  token: string;
  expiresAt: Date;
}

export class AuthService {
  async register(input: RegisterInput): Promise<UserPublicProfile> {
    const email = input.email?.trim();
    const displayName = input.displayName?.trim();
    const password = input.password;

    if (!email) {
      throw new Error('Email is required.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format.');
    }

    if (!displayName || displayName.length < 2 || displayName.length > 100) {
      throw new Error('Display name must be between 2 and 100 characters.');
    }

    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const emailNormalized = normalizeEmail(email);
    const existing = await userRepository.findByEmailNormalized(emailNormalized);
    if (existing) {
      const err = new Error('Email already registered.');
      (err as any).code = 'EMAIL_ALREADY_EXISTS';
      throw err;
    }

    const passwordHash = await hashPassword(password);
    const userRecord = await userRepository.createUser({
      email,
      emailNormalized,
      passwordHash,
      displayName,
      avatarUrl: input.avatarUrl || null,
      status: 'ACTIVE',
    });

    // Assign default role: READER (never grant ADMIN from registration)
    await roleRepository.assignRoleToUser(userRecord.UserId, 'READER');

    return {
      userId: userRecord.UserId,
      email: userRecord.Email,
      displayName: userRecord.DisplayName,
      avatarUrl: userRecord.AvatarUrl,
      status: userRecord.Status,
      roles: ['READER'],
      createdAt: userRecord.CreatedAt,
      lastLoginAt: userRecord.LastLoginAt,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const email = input.email?.trim();
    const password = input.password;

    if (!email || !password) {
      const err = new Error('Email and password are required.');
      (err as any).code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const emailNormalized = normalizeEmail(email);
    const user = await userRepository.findByEmailNormalized(emailNormalized);

    // Generic error message prevents account enumeration
    if (!user) {
      const err = new Error('Invalid email or password.');
      (err as any).code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const isMatch = await comparePassword(password, user.PasswordHash);
    if (!isMatch) {
      const err = new Error('Invalid email or password.');
      (err as any).code = 'INVALID_CREDENTIALS';
      throw err;
    }

    if (user.Status !== 'ACTIVE') {
      const err = new Error('Account is suspended or pending verification.');
      (err as any).code = 'ACCOUNT_INACTIVE';
      throw err;
    }

    const roles = await roleRepository.getRolesForUser(user.UserId);
    if (!roles.includes('READER')) {
      roles.push('READER');
    }

    // Create session in dbo.Sessions
    const rawOpaqueToken = generateOpaqueToken();
    const tokenHash = hashToken(rawOpaqueToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.jwt.expiresInDays);

    const session = await sessionRepository.createSession({
      userId: user.UserId,
      tokenHash,
      expiresAt,
    });

    // Update LastLoginAt
    await userRepository.updateLastLogin(user.UserId);

    // Sign JWT token containing sessionId for fast stateless lookup with stateful revocation check
    const jwtToken = signAuthToken({
      userId: user.UserId,
      sessionId: session.SessionId,
      roles,
    });

    const authorProfileRecord = await authorProfileRepository.findByUserId(user.UserId);
    const authorProfile: AuthorProfilePublic | null = authorProfileRecord
      ? {
          authorProfileId: authorProfileRecord.AuthorProfileId,
          penName: authorProfileRecord.PenName,
          bio: authorProfileRecord.Bio,
          verificationStatus: authorProfileRecord.VerificationStatus,
          verificationNote: authorProfileRecord.VerificationNote,
          reviewedAt: authorProfileRecord.ReviewedAt,
          createdAt: authorProfileRecord.CreatedAt,
        }
      : null;

    const userProfile: UserPublicProfile = {
      userId: user.UserId,
      email: user.Email,
      displayName: user.DisplayName,
      avatarUrl: user.AvatarUrl,
      status: user.Status,
      roles,
      createdAt: user.CreatedAt,
      lastLoginAt: new Date(),
      authorProfile,
    };

    return {
      user: userProfile,
      token: jwtToken,
      expiresAt,
    };
  }

  async logout(sessionId: string): Promise<void> {
    if (sessionId) {
      await sessionRepository.revokeSession(sessionId);
    }
  }

  async getCurrentUser(userId: string): Promise<UserPublicProfile | null> {
    const user = await userRepository.findById(userId);
    if (!user) return null;

    const roles = await roleRepository.getRolesForUser(user.UserId);
    const authorProfileRecord = await authorProfileRepository.findByUserId(user.UserId);
    const authorProfile: AuthorProfilePublic | null = authorProfileRecord
      ? {
          authorProfileId: authorProfileRecord.AuthorProfileId,
          penName: authorProfileRecord.PenName,
          bio: authorProfileRecord.Bio,
          verificationStatus: authorProfileRecord.VerificationStatus,
          verificationNote: authorProfileRecord.VerificationNote,
          reviewedAt: authorProfileRecord.ReviewedAt,
          createdAt: authorProfileRecord.CreatedAt,
        }
      : null;

    return {
      userId: user.UserId,
      email: user.Email,
      displayName: user.DisplayName,
      avatarUrl: user.AvatarUrl,
      status: user.Status,
      roles,
      createdAt: user.CreatedAt,
      lastLoginAt: user.LastLoginAt,
      authorProfile,
    };
  }
}

export const authService = new AuthService();
