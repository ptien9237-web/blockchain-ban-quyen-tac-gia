import crypto from 'crypto';
import { invitationRepository } from '../repositories/invitationRepository.js';
import { roleRepository } from '../repositories/roleRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import type {
  AuthorInvitationDto,
  CreateInvitationResultDto,
} from '../types/index.js';

/**
 * Generates a cryptographically secure random invitation code.
 * Example format: BKC-A1B2-C3D4-E5F6
 */
export function generateInvitationCode(): string {
  const bytes = crypto.randomBytes(6);
  const part1 = bytes.subarray(0, 2).toString('hex').toUpperCase();
  const part2 = bytes.subarray(2, 4).toString('hex').toUpperCase();
  const part3 = bytes.subarray(4, 6).toString('hex').toUpperCase();
  return `BKC-${part1}-${part2}-${part3}`;
}

/**
 * Computes deterministic SHA-256 hash of the normalized invitation code.
 */
export function hashInvitationCode(rawCode: string): string {
  const normalized = rawCode.trim().toUpperCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export class InvitationService {
  async createInvitation(
    adminUserId: string,
    input: {
      expiresInDays?: number;
      maxUses?: number;
      note?: string | null;
    }
  ): Promise<CreateInvitationResultDto> {
    const days =
      input.expiresInDays !== undefined && input.expiresInDays !== null
        ? Number(input.expiresInDays)
        : 30;
    if (isNaN(days) || days < 1 || days > 365) {
      throw new Error('Thời hạn mã mời phải từ 1 đến 365 ngày.');
    }

    const maxUses =
      input.maxUses !== undefined && input.maxUses !== null
        ? Number(input.maxUses)
        : 1;
    if (isNaN(maxUses) || maxUses < 1 || maxUses > 1000) {
      throw new Error('Số lượt sử dụng tối đa phải từ 1 đến 1000 lượt.');
    }

    const note = input.note ? input.note.trim() : null;
    if (note && note.length > 255) {
      throw new Error('Ghi chú không được vượt quá 255 ký tự.');
    }

    const rawCode = generateInvitationCode();
    const codeHash = hashInvitationCode(rawCode);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const record = await invitationRepository.createInvitation({
      codeHash,
      createdByUserId: adminUserId,
      expiresAt,
      maxUses,
      note,
    });

    return {
      invitationId: record.InvitationId,
      code: rawCode, // One-time plain display for the Admin to copy
      expiresAt: record.ExpiresAt,
      maxUses: record.MaxUses,
      note: record.Note,
      createdAt: record.CreatedAt,
    };
  }

  async listInvitations(
    _adminUserId: string,
    page = 1,
    limit = 50
  ): Promise<{ items: AuthorInvitationDto[]; total: number; page: number; limit: number }> {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));

    const { items, total } = await invitationRepository.listInvitations(safePage, safeLimit);
    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  async revokeInvitation(_adminUserId: string, invitationId: string): Promise<boolean> {
    const invitation = await invitationRepository.findById(invitationId);
    if (!invitation) {
      throw new Error('NOT_FOUND: Mã mời không tồn tại.');
    }
    if (invitation.RevokedAt) {
      throw new Error('ALREADY_REVOKED: Mã mời này đã được thu hồi trước đó.');
    }

    const success = await invitationRepository.revokeInvitation(invitationId);
    return success;
  }

  async redeemInvitation(
    userId: string,
    rawCode: string
  ): Promise<{ success: boolean; alreadyAuthor?: boolean; message: string }> {
    if (!rawCode || typeof rawCode !== 'string' || rawCode.trim().length === 0) {
      throw new Error('Vui lòng cung cấp mã mời tác giả.');
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('Tài khoản người dùng không tồn tại.');
    }

    // 1. Check if user already has AUTHOR role
    const currentRoles = await roleRepository.getRolesForUser(userId);
    if (currentRoles.includes('AUTHOR')) {
      return {
        success: true,
        alreadyAuthor: true,
        message: 'Tài khoản của bạn đã sở hữu quyền Tác giả (AUTHOR).',
      };
    }

    // 2. Hash code and find record
    const codeHash = hashInvitationCode(rawCode);
    const invitation = await invitationRepository.findByCodeHash(codeHash);

    if (!invitation) {
      throw new Error('INVALID_CODE: Mã mời không hợp lệ hoặc không tồn tại trên hệ thống.');
    }

    // 3. Concurrency-safe atomic transaction
    await invitationRepository.redeemInvitationTransaction(invitation.InvitationId, userId);

    return {
      success: true,
      message: 'Chúc mừng! Bạn đã kích hoạt mã mời và được cấp quyền Tác giả (AUTHOR) thành công.',
    };
  }
}

export const invitationService = new InvitationService();
