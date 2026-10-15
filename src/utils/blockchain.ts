/**
 * Normalizes and formats a 64-character SHA-256 hexadecimal string to a Solidity bytes32 hex string.
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
 * Formats an Ethereum address for display (e.g. 0x1234...5678).
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Converts a UUID into a deterministic bytes32 value.
 */
export function uuidToBytes32(uuid: string): string {
  if (!uuid || typeof uuid !== 'string') {
    throw new Error('UUID must be a non-empty string');
  }

  const clean = uuid.trim().replace(/[{}-]/g, '').toLowerCase();
  if (clean.length !== 32 || /[^0-9a-f]/.test(clean)) {
    throw new Error(`Invalid UUID format: '${uuid}'.`);
  }

  return `0x${clean.padStart(64, '0')}`;
}
