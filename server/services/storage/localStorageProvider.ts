import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { IStorageProvider, StorageResult, VerifyHashResult } from './storageProvider.js';

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor(customBaseDir?: string) {
    this.baseDir = customBaseDir || path.resolve(process.cwd(), 'storage', 'books');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  /**
   * Generates a safe, collision-free storage key.
   * Format: YYYYMMDD_<uuid>.<ext>
   */
  private generateStorageKey(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const cleanExt = ext.length > 0 && ext.length <= 10 ? ext : '.bin';
    const uuid = crypto.randomUUID();
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `${datePrefix}_${uuid}${cleanExt}`;
  }

  /**
   * Resolves storageKey to an absolute path and guards against path traversal.
   */
  private resolveSafePath(storageKey: string): string {
    const normalizedKey = path.basename(storageKey);
    const targetPath = path.resolve(this.baseDir, normalizedKey);
    if (!targetPath.startsWith(this.baseDir)) {
      throw new Error('Path traversal attempt detected');
    }
    return targetPath;
  }

  async saveFile(
    fileBuffer: Buffer,
    originalName: string,
    _mimeType: string
  ): Promise<StorageResult> {
    const storageKey = this.generateStorageKey(originalName);
    const targetPath = this.resolveSafePath(storageKey);

    // Compute actual SHA-256 hash from exact file bytes
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    const sha256 = hash.digest('hex').toLowerCase();

    // Write file to disk
    await fs.promises.writeFile(targetPath, fileBuffer);

    return {
      storageKey,
      sizeBytes: fileBuffer.length,
      sha256,
      storageProvider: 'LOCAL',
    };
  }

  async getFileStream(storageKey: string): Promise<fs.ReadStream> {
    const filePath = this.resolveSafePath(storageKey);
    if (!fs.existsSync(filePath)) {
      throw new Error('Requested storage file does not exist on disk.');
    }
    return fs.createReadStream(filePath);
  }

  async fileExists(storageKey: string): Promise<boolean> {
    try {
      const filePath = this.resolveSafePath(storageKey);
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  }

  async deleteFile(storageKey: string): Promise<void> {
    try {
      const filePath = this.resolveSafePath(storageKey);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch {
      // Ignored if file does not exist
    }
  }

  async verifyFileHash(storageKey: string, expectedSha256: string): Promise<VerifyHashResult> {
    try {
      const filePath = this.resolveSafePath(storageKey);
      if (!fs.existsSync(filePath)) {
        return {
          fileExists: false,
          expectedSha256,
          matches: false,
          error: 'File not found on storage disk',
        };
      }

      const fileBuffer = await fs.promises.readFile(filePath);
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
        error: err.message || 'Error reading or hashing file',
      };
    }
  }
}

export const storageService = new LocalStorageProvider();
