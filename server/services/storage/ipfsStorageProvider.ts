import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { IStorageProvider, StorageResult, VerifyHashResult } from './storageProvider.js';

// Standard Base58 Bitcoin alphabet for IPFS CIDv0
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function toBase58(buffer: Buffer): string {
  const digits: number[] = [0];
  for (let i = 0; i < buffer.length; i++) {
    let carry = buffer[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }

  let leadingZeros = 0;
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    leadingZeros++;
  }

  let str = '';
  for (let i = 0; i < leadingZeros; i++) {
    str += BASE58_ALPHABET[0];
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    str += BASE58_ALPHABET[digits[i]];
  }
  return str;
}

/**
 * Calculates a canonical IPFS CIDv0 representation from raw file bytes.
 * Multihash format: <0x12 = sha2-256><0x20 = 32-bytes length><32-byte sha256 digest>
 */
export function computeIpfsCid(buffer: Buffer): string {
  const sha256Digest = crypto.createHash('sha256').update(buffer).digest();
  const multihash = Buffer.concat([Buffer.from([0x12, 0x20]), sha256Digest]);
  return toBase58(multihash);
}

export interface IpfsConfig {
  apiUrl?: string;       // e.g. http://127.0.0.1:5001
  gatewayUrl?: string;   // e.g. https://ipfs.io/ipfs/
  pinataJwt?: string;
  pinataApiKey?: string;
  pinataSecret?: string;
  localCacheDir?: string;
}

export class IpfsStorageProvider implements IStorageProvider {
  private localDir: string;
  private apiUrl: string | null;
  private gatewayUrl: string;
  private pinataJwt: string | null;

  constructor(customConfig?: IpfsConfig) {
    this.localDir =
      customConfig?.localCacheDir ||
      path.resolve(process.cwd(), 'storage', 'ipfs');

    if (!fs.existsSync(this.localDir)) {
      fs.mkdirSync(this.localDir, { recursive: true });
    }

    this.apiUrl = customConfig?.apiUrl || process.env.IPFS_API_URL || null;
    this.gatewayUrl =
      customConfig?.gatewayUrl ||
      process.env.IPFS_GATEWAY_URL ||
      'https://gateway.pinata.cloud/ipfs/';
    this.pinataJwt = customConfig?.pinataJwt || process.env.PINATA_JWT || null;
  }

  /**
   * Resolves safe local IPFS cache file path for a CID.
   */
  private resolveCachePath(cid: string): string {
    const cleanCid = cid.replace(/^ipfs:\/\//, '').trim();
    // Validate CID characters (Base58 or Base32 alphanumeric)
    if (!/^[a-zA-Z0-9]+$/.test(cleanCid)) {
      throw new Error(`INVALID_CID: The provided IPFS CID format is invalid: ${cid}`);
    }
    const targetPath = path.resolve(this.localDir, cleanCid);
    if (!targetPath.startsWith(this.localDir)) {
      throw new Error('Path traversal attempt detected in IPFS storage key');
    }
    return targetPath;
  }

  async saveFile(
    fileBuffer: Buffer,
    _originalName: string,
    _mimeType: string
  ): Promise<StorageResult> {
    // 1. Calculate SHA-256
    const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex').toLowerCase();

    // 2. Calculate cryptographic IPFS CID
    const cid = computeIpfsCid(fileBuffer);
    const targetPath = this.resolveCachePath(cid);

    // 3. Persist to local IPFS cache
    await fs.promises.writeFile(targetPath, fileBuffer);

    // 4. If remote Pinata or IPFS API configured, pin asynchronously (non-blocking fallback)
    if (this.pinataJwt) {
      this.pinToPinata(fileBuffer, cid, _originalName).catch((err) => {
        console.warn(`[IpfsStorageProvider] Pinata background pin warning for ${cid}:`, err.message);
      });
    }

    return {
      storageKey: `ipfs://${cid}`,
      sizeBytes: fileBuffer.length,
      sha256,
      storageProvider: 'IPFS',
    };
  }

  private async pinToPinata(fileBuffer: Buffer, cid: string, filename: string): Promise<void> {
    try {
      // Using native FormData / fetch if available
      const boundary = `----BookChainIpfsBoundary${Date.now()}`;
      const header = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`
      );
      const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
      const body = Buffer.concat([header, fileBuffer, footer]);

      const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.pinataJwt}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body,
      });

      if (!res.ok) {
        const text = await res.text();
        console.warn(`[IpfsStorageProvider] Pinata pin rejected: ${res.status} - ${text}`);
      }
    } catch (err: any) {
      console.warn(`[IpfsStorageProvider] Remote Pinata pin exception:`, err.message);
    }
  }

  async getFileStream(storageKey: string): Promise<fs.ReadStream> {
    const cleanCid = storageKey.replace(/^ipfs:\/\//, '');
    const cachePath = this.resolveCachePath(cleanCid);

    if (fs.existsSync(cachePath)) {
      return fs.createReadStream(cachePath);
    }

    // If not in local cache, attempt to fetch from IPFS Gateway
    try {
      const gatewayUrl = `${this.gatewayUrl.replace(/\/$/, '')}/${cleanCid}`;
      const response = await fetch(gatewayUrl);
      if (response.ok && response.body) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await fs.promises.writeFile(cachePath, buffer);
        return fs.createReadStream(cachePath);
      }
    } catch {
      // Gateway fetch failed
    }

    throw new Error(`FILE_NOT_FOUND: IPFS document with CID ${cleanCid} is not available in local cache or gateway.`);
  }

  async fileExists(storageKey: string): Promise<boolean> {
    try {
      const cleanCid = storageKey.replace(/^ipfs:\/\//, '');
      const cachePath = this.resolveCachePath(cleanCid);
      return fs.existsSync(cachePath);
    } catch {
      return false;
    }
  }

  async deleteFile(storageKey: string): Promise<void> {
    try {
      const cleanCid = storageKey.replace(/^ipfs:\/\//, '');
      const cachePath = this.resolveCachePath(cleanCid);
      if (fs.existsSync(cachePath)) {
        await fs.promises.unlink(cachePath);
      }
    } catch {
      // Ignored if missing
    }
  }

  async verifyFileHash(storageKey: string, expectedSha256: string): Promise<VerifyHashResult> {
    try {
      const cleanCid = storageKey.replace(/^ipfs:\/\//, '');
      const cachePath = this.resolveCachePath(cleanCid);

      if (!fs.existsSync(cachePath)) {
        return {
          fileExists: false,
          expectedSha256,
          matches: false,
          error: 'File not found in IPFS local cache',
        };
      }

      const fileBuffer = await fs.promises.readFile(cachePath);
      const hash = crypto.createHash('sha256');
      hash.update(fileBuffer);
      const actualSha256 = hash.digest('hex').toLowerCase();
      const normalizedExpected = expectedSha256.trim().toLowerCase();

      return {
        fileExists: true,
        actualSha256,
        expectedSha256: normalizedExpected,
        matches: actualSha256 === normalizedExpected,
      };
    } catch (err: any) {
      return {
        fileExists: false,
        expectedSha256,
        matches: false,
        error: err.message || 'Error reading or hashing IPFS cached file',
      };
    }
  }
}

export const ipfsStorageService = new IpfsStorageProvider();
