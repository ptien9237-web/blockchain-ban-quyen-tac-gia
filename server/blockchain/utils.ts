import crypto from 'node:crypto';

/**
 * Normalizes and formats a 64-character SHA-256 hexadecimal string to a Solidity bytes32 hex string.
 * Ensures the '0x' prefix and strictly 64 hexadecimal characters.
 */
export function sha256ToBytes32(sha256Hex: string): string {
  if (!sha256Hex || typeof sha256Hex !== 'string') {
    throw new Error('SHA-256 hash must be a non-empty string');
  }

  const clean = sha256Hex.trim().replace(/^0x/i, '').toLowerCase();
  if (clean.length !== 64 || /[^0-9a-f]/.test(clean)) {
    throw new Error(`Invalid SHA-256 hex string: length=${clean.length}, expected 64 hex characters.`);
  }

  return `0x${clean}`;
}

/**
 * Normalizes a Solidity bytes32 hex string back into a standard 64-character lowercase SHA-256 string.
 */
export function bytes32ToSha256(bytes32Hex: string): string {
  if (!bytes32Hex || typeof bytes32Hex !== 'string') {
    throw new Error('Bytes32 hex must be a non-empty string');
  }

  const clean = bytes32Hex.trim().replace(/^0x/i, '').toLowerCase();
  if (clean.length !== 64 || /[^0-9a-f]/.test(clean)) {
    throw new Error(`Invalid bytes32 hex string: length=${clean.length}, expected 64 hex characters.`);
  }

  return clean;
}

/**
 * Converts a standard UUID (e.g. from SQL Server UNIQUEIDENTIFIER) into a deterministic bytes32 value.
 * Strips hyphens (leaving 32 hex chars = 16 bytes), and zero-pads to 32 bytes (64 hex characters).
 */
export function uuidToBytes32(uuid: string): string {
  if (!uuid || typeof uuid !== 'string') {
    throw new Error('UUID must be a non-empty string');
  }

  const clean = uuid.trim().replace(/[{}-]/g, '').toLowerCase();
  if (clean.length !== 32 || /[^0-9a-f]/.test(clean)) {
    throw new Error(`Invalid UUID format: '${uuid}'. Expected 32 hex digits after stripping hyphens.`);
  }

  // Left-pad with zeros to make 32 bytes (64 hex digits)
  return `0x${clean.padStart(64, '0')}`;
}

/**
 * Converts a business record number (e.g. 'BCR-2026-0001') to a deterministic bytes32 hash via SHA-256.
 */
export function stringIdToBytes32(identifier: string): string {
  if (!identifier || typeof identifier !== 'string') {
    throw new Error('Identifier must be a non-empty string');
  }

  return `0x${crypto.createHash('sha256').update(identifier.trim()).digest('hex')}`;
}
