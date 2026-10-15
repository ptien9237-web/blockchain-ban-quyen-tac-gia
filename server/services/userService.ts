import { userRepository } from '../repositories/userRepository.js';
import { roleRepository } from '../repositories/roleRepository.js';
import { authorProfileRepository } from '../repositories/authorProfileRepository.js';
import type { UserPublicProfile, AuthorProfilePublic } from '../types/index.js';

export class UserService {
  async updateProfile(
    userId: string,
    data: { displayName?: string; avatarUrl?: string | null }
  ): Promise<UserPublicProfile> {
    if (data.displayName !== undefined) {
      const trimmed = data.displayName.trim();
      if (trimmed.length < 2 || trimmed.length > 100) {
        throw new Error('Display name must be between 2 and 100 characters.');
      }
      data.displayName = trimmed;
    }

    if (data.avatarUrl) {
      if (data.avatarUrl.length > 500) {
        throw new Error('Avatar URL cannot exceed 500 characters.');
      }
    }

    const updated = await userRepository.updateProfile(userId, data);
    if (!updated) {
      throw new Error('User not found.');
    }

    const roles = await roleRepository.getRolesForUser(userId);
    const authorRecord = await authorProfileRepository.findByUserId(userId);
    const authorProfile: AuthorProfilePublic | null = authorRecord
      ? {
          authorProfileId: authorRecord.AuthorProfileId,
          penName: authorRecord.PenName,
          bio: authorRecord.Bio,
          verificationStatus: authorRecord.VerificationStatus,
          verificationNote: authorRecord.VerificationNote,
          reviewedAt: authorRecord.ReviewedAt,
          createdAt: authorRecord.CreatedAt,
        }
      : null;

    return {
      userId: updated.UserId,
      email: updated.Email,
      displayName: updated.DisplayName,
      avatarUrl: updated.AvatarUrl,
      status: updated.Status,
      roles,
      createdAt: updated.CreatedAt,
      lastLoginAt: updated.LastLoginAt,
      authorProfile,
    };
  }

  async registerAuthorProfile(
    userId: string,
    data: { penName: string; bio?: string | null }
  ): Promise<UserPublicProfile> {
    const penName = data.penName?.trim();
    if (!penName || penName.length < 2 || penName.length > 150) {
      throw new Error('Pen name must be between 2 and 150 characters.');
    }

    // Upsert AuthorProfile record with PENDING verification status
    await authorProfileRepository.createOrUpdate(userId, {
      penName,
      bio: data.bio?.trim() || null,
    });

    // Assign AUTHOR role to user if not already assigned
    await roleRepository.assignRoleToUser(userId, 'AUTHOR');

    // Return refreshed user profile
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found.');

    const roles = await roleRepository.getRolesForUser(userId);
    const authorRecord = await authorProfileRepository.findByUserId(userId);
    const authorProfile: AuthorProfilePublic | null = authorRecord
      ? {
          authorProfileId: authorRecord.AuthorProfileId,
          penName: authorRecord.PenName,
          bio: authorRecord.Bio,
          verificationStatus: authorRecord.VerificationStatus,
          verificationNote: authorRecord.VerificationNote,
          reviewedAt: authorRecord.ReviewedAt,
          createdAt: authorRecord.CreatedAt,
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

export const userService = new UserService();
