import { describe, expect, it } from 'vitest';
import { ethers } from 'ethers';
import { shortenAddress } from '../src/utils/blockchain.js';
import {
  HARDHAT_CHAIN_ID_DECIMAL,
  HARDHAT_CHAIN_ID_HEX,
  HARDHAT_RPC_URL,
} from '../src/contexts/WalletContext.js';
import deployedAddresses from '../src/contracts/deployedAddresses.json';
import { BookCopyrightRegistryAbi } from '../src/contracts/BookCopyrightRegistry.js';

describe('Step 03.1: MetaMask Connection & Hardhat Local Verification', () => {
  describe('1. Wallet Helper Utilities', () => {
    it('shortens Ethereum addresses properly', () => {
      const fullAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      const shortened = shortenAddress(fullAddress);
      expect(shortened).toBe('0xf39F...2266');
    });

    it('handles empty or short inputs gracefully', () => {
      expect(shortenAddress('')).toBe('');
      expect(shortenAddress('0x123')).toBe('0x123');
    });
  });

  describe('2. Hardhat Local Configuration Constants', () => {
    it('defines accurate chain ID and RPC URL for Hardhat Local', () => {
      expect(HARDHAT_CHAIN_ID_HEX).toBe('0x7a69');
      expect(HARDHAT_CHAIN_ID_DECIMAL).toBe('31337');
      expect(HARDHAT_RPC_URL).toBe('http://127.0.0.1:8545');
      expect(parseInt(HARDHAT_CHAIN_ID_HEX, 16).toString()).toBe('31337');
    });

    it('verifies deployed contract address configuration exists and is valid', () => {
      const localDeployment = deployedAddresses.localhost || deployedAddresses.hardhat;
      expect(localDeployment).toBeDefined();
      expect(localDeployment.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
      expect(localDeployment.chainId).toBe('31337');
    });

    it('verifies BookCopyrightRegistry ABI contains all mandatory functions', () => {
      const functionNames = BookCopyrightRegistryAbi.filter(
        (item: { type: string; name?: string }) => item.type === 'function'
      ).map((item: { name?: string }) => item.name);

      expect(functionNames).toContain('registerCopyright');
      expect(functionNames).toContain('verifyHash');
      expect(functionNames).toContain('getCopyright');
      expect(functionNames).toContain('totalRecords');
      expect(functionNames).toContain('disputeCopyright');
      expect(functionNames).toContain('resolveDispute');
      expect(functionNames).toContain('revokeCopyright');
      expect(functionNames).toContain('pause');
      expect(functionNames).toContain('unpause');
    });
  });

  describe('3. Live Hardhat Node & Contract Verification', () => {
    it('connects to live local Hardhat node and verifies Chain ID 31337', async () => {
      const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      const network = await provider.getNetwork();
      expect(network.chainId.toString()).toBe('31337');
    });

    it('verifies that BookCopyrightRegistry bytecode is deployed on the running local node', async () => {
      const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      const contractAddress = deployedAddresses.localhost.address;
      const code = await provider.getCode(contractAddress);

      expect(code).not.toBe('0x');
      expect(code.length).toBeGreaterThan(100); // Has real deployed bytecode
    });

    it('calls totalRecords() on the live deployed contract instance successfully', async () => {
      const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      const contractAddress = deployedAddresses.localhost.address;
      const contract = new ethers.Contract(contractAddress, BookCopyrightRegistryAbi, provider);

      const total = await contract.totalRecords();
      expect(Number(total)).toBeGreaterThanOrEqual(0);
    });

    it('calls verifyHash() on live contract with a zero hash and confirms exists = false', async () => {
      const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      const contractAddress = deployedAddresses.localhost.address;
      const contract = new ethers.Contract(contractAddress, BookCopyrightRegistryAbi, provider);

      const dummyHash = '0x' + '0'.repeat(64);
      const res = await contract.verifyHash(dummyHash);
      expect(res[0]).toBe(false); // exists
    });
  });
});
