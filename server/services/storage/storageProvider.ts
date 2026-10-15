import type fs from 'fs';

export interface StorageResult {
  storageKey: string;
  sizeBytes: number;
  sha256: string;
  storageProvider: 'LOCAL' | 'IPFS';
}

export interface VerifyHashResult {
  fileExists: boolean;
  actualSha256?: string;
  expectedSha256: string;
  matches: boolean;
  error?: string;
}

export interface IStorageProvider {
  saveFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<StorageResult>;

  getFileStream(storageKey: string): Promise<fs.ReadStream>;

  fileExists(storageKey: string): Promise<boolean>;

  deleteFile(storageKey: string): Promise<void>;

  verifyFileHash(storageKey: string, expectedSha256: string): Promise<VerifyHashResult>;
}
