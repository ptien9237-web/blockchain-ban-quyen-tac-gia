import type fs from 'fs';
import type { IStorageProvider, StorageResult, VerifyHashResult } from './storageProvider.js';
import { LocalStorageProvider, storageService as localProvider } from './localStorageProvider.js';
import { IpfsStorageProvider, ipfsStorageService as ipfsProvider } from './ipfsStorageProvider.js';

export class StorageManager implements IStorageProvider {
  private local: LocalStorageProvider;
  private ipfs: IpfsStorageProvider;
  private defaultDriver: 'LOCAL' | 'IPFS';

  constructor(
    local?: LocalStorageProvider,
    ipfs?: IpfsStorageProvider,
    defaultDriver?: 'LOCAL' | 'IPFS'
  ) {
    this.local = local || localProvider;
    this.ipfs = ipfs || ipfsProvider;
    const envDriver = (process.env.STORAGE_DRIVER || 'local').toUpperCase();
    this.defaultDriver = defaultDriver || (envDriver === 'IPFS' ? 'IPFS' : 'LOCAL');
  }

  public getProvider(providerType?: 'LOCAL' | 'IPFS' | string): IStorageProvider {
    if (providerType === 'IPFS') {
      return this.ipfs;
    }
    return this.local;
  }

  async saveFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    preferredProvider?: 'LOCAL' | 'IPFS'
  ): Promise<StorageResult> {
    const targetProvider = preferredProvider || this.defaultDriver;
    if (targetProvider === 'IPFS') {
      return this.ipfs.saveFile(fileBuffer, originalName, mimeType);
    }
    return this.local.saveFile(fileBuffer, originalName, mimeType);
  }

  async getFileStream(storageKey: string, providerHint?: 'LOCAL' | 'IPFS'): Promise<fs.ReadStream> {
    if (providerHint === 'IPFS' || storageKey.startsWith('ipfs://')) {
      return this.ipfs.getFileStream(storageKey);
    }
    return this.local.getFileStream(storageKey);
  }

  async fileExists(storageKey: string, providerHint?: 'LOCAL' | 'IPFS'): Promise<boolean> {
    if (providerHint === 'IPFS' || storageKey.startsWith('ipfs://')) {
      return this.ipfs.fileExists(storageKey);
    }
    return this.local.fileExists(storageKey);
  }

  async deleteFile(storageKey: string, providerHint?: 'LOCAL' | 'IPFS'): Promise<void> {
    if (providerHint === 'IPFS' || storageKey.startsWith('ipfs://')) {
      return this.ipfs.deleteFile(storageKey);
    }
    return this.local.deleteFile(storageKey);
  }

  async verifyFileHash(
    storageKey: string,
    expectedSha256: string,
    providerHint?: 'LOCAL' | 'IPFS'
  ): Promise<VerifyHashResult> {
    if (providerHint === 'IPFS' || storageKey.startsWith('ipfs://')) {
      return this.ipfs.verifyFileHash(storageKey, expectedSha256);
    }
    return this.local.verifyFileHash(storageKey, expectedSha256);
  }
}

export const unifiedStorageService = new StorageManager();
