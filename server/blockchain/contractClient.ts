import { ethers } from 'ethers';
import { config } from '../config/env.js';
import { BookCopyrightRegistryAbi } from '../contracts/BookCopyrightRegistry.js';
import deployedAddresses from '../contracts/deployedAddresses.json' assert { type: 'json' };
import { sha256ToBytes32 } from './utils.js';
import type { OnChainRecordStatus } from '../types/index.js';

export const REGISTRAR_ROLE = ethers.keccak256(ethers.toUtf8Bytes('REGISTRAR_ROLE'));
export const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;

export interface OnChainVerificationResult {
  exists: boolean;
  recordId: string;
  bookId: string;
  versionNumber: number;
  authorWallet: string;
  registrant: string;
  registeredAt: number;
  status: OnChainRecordStatus;
  metadataUri?: string;
}

export class BlockchainContractClient {
  private provider: ethers.JsonRpcProvider;
  private readContract: ethers.Contract;
  private registrarSigner: ethers.Wallet | null = null;
  private writeContract: ethers.Contract | null = null;
  public readonly contractAddress: string;
  public readonly chainId: number;

  constructor() {
    this.chainId = config.blockchain.chainId;
    this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl, undefined, {
      staticNetwork: true,
    });

    const addresses = deployedAddresses as Record<string, { address: string }>;
    const isSepolia = this.chainId === 11155111 || process.env.BLOCKCHAIN_NETWORK === 'sepolia';
    const deployed = isSepolia
      ? addresses.sepolia?.address
      : (addresses.localhost?.address || addresses.hardhat?.address);

    this.contractAddress = process.env.CONTRACT_ADDRESS || deployed || config.blockchain.contractAddress;
    this.readContract = new ethers.Contract(this.contractAddress, BookCopyrightRegistryAbi, this.provider);

    if (config.blockchain.registrarPrivateKey) {
      try {
        let key = config.blockchain.registrarPrivateKey.trim();
        if (!key.startsWith('0x')) key = `0x${key}`;
        this.registrarSigner = new ethers.Wallet(key, this.provider);
        this.writeContract = new ethers.Contract(this.contractAddress, BookCopyrightRegistryAbi, this.registrarSigner);
      } catch (err) {
        console.warn('[BlockchainContractClient] Failed to initialize registrar signer:', err);
      }
    }
  }

  public getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  public getRegistrarAddress(): string | null {
    return this.registrarSigner?.address || null;
  }

  private mapStatus(statusIndex: number | bigint): OnChainRecordStatus {
    const idx = Number(statusIndex);
    switch (idx) {
      case 0:
        return 'ACTIVE';
      case 1:
        return 'DISPUTED';
      case 2:
        return 'REVOKED';
      default:
        return 'ACTIVE';
    }
  }

  /**
   * Verifies if a given SHA-256 hash exists on the smart contract.
   * Safe public call that does not revert if not found.
   */
  async verifyHash(sha256Hex: string): Promise<OnChainVerificationResult> {
    const bytes32Hash = sha256ToBytes32(sha256Hex);
    try {
      const result = await this.readContract.verifyHash(bytes32Hash);
      const exists: boolean = result[0];
      if (!exists) {
        return {
          exists: false,
          recordId: ethers.ZeroHash,
          bookId: ethers.ZeroHash,
          versionNumber: 0,
          authorWallet: ethers.ZeroAddress,
          registrant: ethers.ZeroAddress,
          registeredAt: 0,
          status: 'ACTIVE',
        };
      }

      return {
        exists: true,
        recordId: result[1],
        bookId: result[2],
        versionNumber: Number(result[3]),
        authorWallet: result[4],
        registrant: result[5],
        registeredAt: Number(result[6]),
        status: this.mapStatus(result[7]),
      };
    } catch (err: any) {
      throw new Error(`Failed to call verifyHash on-chain: ${err.message}`);
    }
  }

  /**
   * Fetches full CopyrightRecord struct by recordId (bytes32).
   */
  async getCopyright(recordIdBytes32: string): Promise<OnChainVerificationResult & { contentHash: string; metadataUri: string }> {
    try {
      const record = await this.readContract.getCopyright(recordIdBytes32);
      return {
        exists: true,
        recordId: record.recordId,
        bookId: record.bookId,
        versionNumber: Number(record.versionNumber),
        contentHash: record.contentHash,
        authorWallet: record.authorWallet,
        registrant: record.registrant,
        registeredAt: Number(record.registeredAt),
        status: this.mapStatus(record.status),
        metadataUri: record.metadataUri,
      };
    } catch (err: any) {
      throw new Error(`Failed to get copyright record on-chain: ${err.message}`);
    }
  }

  /**
   * Checks whether an address has a given role.
   */
  async hasRole(role: string, account: string): Promise<boolean> {
    try {
      return await this.readContract.hasRole(role, account);
    } catch {
      return false;
    }
  }

  /**
   * Retrieves transaction receipt for a given txHash.
   */
  async getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null> {
    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch {
      return null;
    }
  }

  /**
   * Checks total registered records.
   */
  async totalRecords(): Promise<number> {
    try {
      const total = await this.readContract.totalRecords();
      return Number(total);
    } catch (err: any) {
      throw new Error(`Failed to query totalRecords: ${err.message}`);
    }
  }

  /**
   * Submits a copyright registration on-chain using the configured Registrar signer.
   */
  async registerCopyrightViaRegistrar(params: {
    recordId: string;
    bookId: string;
    versionNumber: number;
    contentHash: string;
    authorWallet: string;
    metadataUri: string;
  }): Promise<{ txHash: string; blockNumber: number; receipt: ethers.TransactionReceipt }> {
    if (!this.writeContract || !this.registrarSigner) {
      throw new Error('Registrar signer is not configured on this server.');
    }

    try {
      const tx = await this.writeContract.registerCopyright(
        params.recordId,
        params.bookId,
        params.versionNumber,
        params.contentHash,
        params.authorWallet,
        params.metadataUri
      );

      const receipt = await tx.wait(1);
      if (!receipt || receipt.status !== 1) {
        throw new Error('Transaction execution failed or reverted on blockchain.');
      }

      return {
        txHash: tx.hash,
        blockNumber: Number(receipt.blockNumber),
        receipt,
      };
    } catch (err: any) {
      // Decode known errors if possible
      const message = err.reason || err.message || 'Unknown blockchain error';
      throw new Error(`On-chain registration failed: ${message}`);
    }
  }

  private async getNextNonce(): Promise<number> {
    if (!this.registrarSigner) return 0;
    const hex = await this.provider.send('eth_getTransactionCount', [this.registrarSigner.address, 'latest']);
    return parseInt(hex, 16);
  }

  /**
   * Flags a copyright record as DISPUTED on-chain.
   * Requires DEFAULT_ADMIN_ROLE.
   */
  async disputeCopyright(recordIdBytes32: string, reason: string): Promise<{ txHash: string; blockNumber: number; receipt: ethers.TransactionReceipt }> {
    if (!this.writeContract || !this.registrarSigner) {
      throw new Error('Admin/Registrar signer is not configured on this server.');
    }
    if (!reason || reason.trim() === '') {
      throw new Error('Dispute reason cannot be empty.');
    }

    try {
      const nonce = await this.getNextNonce();
      const tx = await this.writeContract.disputeCopyright(recordIdBytes32, reason.trim(), { nonce });
      const receipt = await tx.wait(1);
      if (!receipt || receipt.status !== 1) {
        throw new Error('On-chain dispute transaction failed or reverted.');
      }
      return {
        txHash: tx.hash,
        blockNumber: Number(receipt.blockNumber),
        receipt,
      };
    } catch (err: any) {
      const message = err.reason || err.message || 'Unknown blockchain dispute error';
      throw new Error(`On-chain dispute failed: ${message}`);
    }
  }

  /**
   * Resolves an existing dispute by transitioning status to ACTIVE (0) or REVOKED (2).
   * Requires DEFAULT_ADMIN_ROLE.
   */
  async resolveDispute(
    recordIdBytes32: string,
    newStatus: 'ACTIVE' | 'REVOKED',
    reason: string
  ): Promise<{ txHash: string; blockNumber: number; receipt: ethers.TransactionReceipt }> {
    if (!this.writeContract || !this.registrarSigner) {
      throw new Error('Admin/Registrar signer is not configured on this server.');
    }
    if (!reason || reason.trim() === '') {
      throw new Error('Resolution reason cannot be empty.');
    }

    const statusCode = newStatus === 'ACTIVE' ? 0 : 2;

    try {
      const nonce = await this.getNextNonce();
      const tx = await this.writeContract.resolveDispute(recordIdBytes32, statusCode, reason.trim(), { nonce });
      const receipt = await tx.wait(1);
      if (!receipt || receipt.status !== 1) {
        throw new Error('On-chain resolveDispute transaction failed or reverted.');
      }
      return {
        txHash: tx.hash,
        blockNumber: Number(receipt.blockNumber),
        receipt,
      };
    } catch (err: any) {
      const message = err.reason || err.message || 'Unknown blockchain resolve error';
      throw new Error(`On-chain resolve dispute failed: ${message}`);
    }
  }

  /**
   * Revokes a copyright record on-chain directly.
   * Requires DEFAULT_ADMIN_ROLE.
   */
  async revokeCopyright(recordIdBytes32: string, reason: string): Promise<{ txHash: string; blockNumber: number; receipt: ethers.TransactionReceipt }> {
    if (!this.writeContract || !this.registrarSigner) {
      throw new Error('Admin/Registrar signer is not configured on this server.');
    }
    if (!reason || reason.trim() === '') {
      throw new Error('Revocation reason cannot be empty.');
    }

    try {
      const nonce = await this.getNextNonce();
      const tx = await this.writeContract.revokeCopyright(recordIdBytes32, reason.trim(), { nonce });
      const receipt = await tx.wait(1);
      if (!receipt || receipt.status !== 1) {
        throw new Error('On-chain revokeCopyright transaction failed or reverted.');
      }
      return {
        txHash: tx.hash,
        blockNumber: Number(receipt.blockNumber),
        receipt,
      };
    } catch (err: any) {
      const message = err.reason || err.message || 'Unknown blockchain revocation error';
      throw new Error(`On-chain revocation failed: ${message}`);
    }
  }

  /**
   * Emergency Circuit Breaker: pause registrations.
   */
  async pause(): Promise<{ txHash: string; blockNumber: number }> {
    if (!this.writeContract || !this.registrarSigner) {
      throw new Error('Admin signer not configured.');
    }
    try {
      const currentlyPaused = await this.readContract.paused();
      if (currentlyPaused) {
        return { txHash: '0x0000000000000000000000000000000000000000000000000000000000000000', blockNumber: 0 };
      }
      const nonce = await this.getNextNonce();
      const tx = await this.writeContract.pause({ nonce });
      const receipt = await tx.wait(1);
      return { txHash: tx.hash, blockNumber: Number(receipt.blockNumber) };
    } catch (err: any) {
      console.error('[ContractClient.pause] Error:', err);
      throw new Error(`Failed to pause contract: ${err.reason || err.message}`);
    }
  }

  /**
   * Emergency Circuit Breaker: unpause registrations.
   */
  async unpause(): Promise<{ txHash: string; blockNumber: number }> {
    if (!this.writeContract || !this.registrarSigner) {
      throw new Error('Admin signer not configured.');
    }
    try {
      const currentlyPaused = await this.readContract.paused();
      if (!currentlyPaused) {
        return { txHash: '0x0000000000000000000000000000000000000000000000000000000000000000', blockNumber: 0 };
      }
      const nonce = await this.getNextNonce();
      const tx = await this.writeContract.unpause({ nonce });
      const receipt = await tx.wait(1);
      return { txHash: tx.hash, blockNumber: Number(receipt.blockNumber) };
    } catch (err: any) {
      console.error('[ContractClient.unpause] Error:', err);
      throw new Error(`Failed to unpause contract: ${err.reason || err.message}`);
    }
  }

  /**
   * Checks whether contract registration is currently paused.
   */
  async isPaused(): Promise<boolean> {
    try {
      return await this.readContract.paused();
    } catch {
      return false;
    }
  }
}

export const blockchainClient = new BlockchainContractClient();

