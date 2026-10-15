import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  bytes32ToSha256,
  sha256ToBytes32,
  stringIdToBytes32,
  uuidToBytes32,
} from '../server/blockchain/utils.js';

describe('Step 03: Blockchain Cryptographic Utilities & Parity Tests', () => {
  it('converts a valid 64-char lowercase SHA-256 to 0x-prefixed bytes32', () => {
    const raw = crypto.createHash('sha256').update('BookChain Library Archival').digest('hex');
    const bytes32 = sha256ToBytes32(raw);

    expect(bytes32.startsWith('0x')).toBe(true);
    expect(bytes32.length).toBe(66); // '0x' + 64 hex chars
    expect(bytes32.slice(2)).toBe(raw);
  });

  it('normalizes uppercase SHA-256 strings to lowercase bytes32', () => {
    const raw = crypto.createHash('sha256').update('Edition 2').digest('hex');
    const upper = raw.toUpperCase();
    const bytes32 = sha256ToBytes32(upper);

    expect(bytes32).toBe(`0x${raw.toLowerCase()}`);
  });

  it('handles existing 0x prefix gracefully', () => {
    const raw = crypto.createHash('sha256').update('With Prefix').digest('hex');
    const withPrefix = `0x${raw}`;
    const bytes32 = sha256ToBytes32(withPrefix);

    expect(bytes32).toBe(`0x${raw}`);
  });

  it('rejects invalid length or non-hex characters for sha256ToBytes32', () => {
    expect(() => sha256ToBytes32('too_short')).toThrow(/Invalid SHA-256/);
    expect(() => sha256ToBytes32('0x' + 'g'.repeat(64))).toThrow(/Invalid SHA-256/);
    expect(() => sha256ToBytes32('')).toThrow(/non-empty string/);
  });

  it('performs lossless roundtrip between sha256ToBytes32 and bytes32ToSha256', () => {
    const raw = crypto.createHash('sha256').update('Roundtrip Test').digest('hex');
    const bytes32 = sha256ToBytes32(raw);
    const roundtrip = bytes32ToSha256(bytes32);

    expect(roundtrip).toBe(raw);
  });

  it('converts standard UUID with hyphens to 32-byte left-padded bytes32', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const bytes32 = uuidToBytes32(uuid);

    expect(bytes32.startsWith('0x')).toBe(true);
    expect(bytes32.length).toBe(66);
    // 32 zeros of padding + 32 chars of uuid
    expect(bytes32.slice(2, 34)).toBe('0'.repeat(32));
    expect(bytes32.slice(34)).toBe('550e8400e29b41d4a716446655440000');
  });

  it('generates deterministic bytes32 hashes for record numbers via stringIdToBytes32', () => {
    const recordNumber = 'BCR-2026-0001';
    const hash1 = stringIdToBytes32(recordNumber);
    const hash2 = stringIdToBytes32(recordNumber);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(66);
    expect(hash1.startsWith('0x')).toBe(true);
  });
});
