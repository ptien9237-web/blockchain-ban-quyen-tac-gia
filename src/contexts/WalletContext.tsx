import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import deployedAddresses from '../contracts/deployedAddresses.json';
import { BookCopyrightRegistryAbi } from '../contracts/BookCopyrightRegistry';

export const HARDHAT_CHAIN_ID_HEX = '0x7a69'; // 31337 in hex
export const HARDHAT_CHAIN_ID_DECIMAL = '31337';
export const HARDHAT_RPC_URL = 'http://127.0.0.1:8545';

export const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7'; // 11155111 in hex
export const SEPOLIA_CHAIN_ID_DECIMAL = '11155111';
export const SEPOLIA_RPC_URL = 'https://rpc.sepolia.org';

export interface WalletContextType {
  account: string | null;
  chainId: string | null;
  networkName: string;
  isConnected: boolean;
  isConnecting: boolean;
  isWrongNetwork: boolean;
  contractAddress: string | null;
  isContractAvailable: boolean;
  contractTotalRecords: number | null;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (targetChain?: 'hardhat' | 'sepolia' | unknown) => Promise<void>;
  clearError: () => void;
  refreshContractState: () => Promise<void>;
  getSigner: () => Promise<any | null>;
  getBrowserProvider: () => BrowserProvider | null;
  checkHasRole: (role: string, targetAccount?: string) => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [isContractAvailable, setIsContractAvailable] = useState<boolean>(false);
  const [contractTotalRecords, setContractTotalRecords] = useState<number | null>(null);

  const getTargetContractAddress = useCallback((targetChainId: string | null): string | null => {
    const isHardhat =
      targetChainId === HARDHAT_CHAIN_ID_HEX ||
      targetChainId === HARDHAT_CHAIN_ID_DECIMAL;
    if (isHardhat) {
      return (
        deployedAddresses.localhost?.address ||
        deployedAddresses.hardhat?.address ||
        '0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44'
      );
    }
    const isSepolia =
      targetChainId === SEPOLIA_CHAIN_ID_HEX ||
      targetChainId === SEPOLIA_CHAIN_ID_DECIMAL;
    if (isSepolia) {
      return (deployedAddresses as Record<string, { address?: string }>).sepolia?.address || null;
    }
    return null;
  }, []);

  const checkContractOnChain = useCallback(
    async (currentChainId: string | null) => {
      const targetAddress = getTargetContractAddress(currentChainId);
      setContractAddress(targetAddress);

      if (!targetAddress || !window.ethereum) {
        setIsContractAvailable(false);
        setContractTotalRecords(null);
        return;
      }

      try {
        const code = (await window.ethereum.request({
          method: 'eth_getCode',
          params: [targetAddress, 'latest'],
        })) as string;

        if (code && code !== '0x' && code.length > 2) {
          setIsContractAvailable(true);
          // Query live contract read call
          try {
            const provider = new BrowserProvider(window.ethereum);
            const contract = new Contract(targetAddress, BookCopyrightRegistryAbi, provider);
            const count = await contract.totalRecords();
            setContractTotalRecords(Number(count));
          } catch {
            // Keep available even if call fails temporarily
          }
        } else {
          setIsContractAvailable(false);
          setContractTotalRecords(null);
        }
      } catch {
        setIsContractAvailable(false);
        setContractTotalRecords(null);
      }
    },
    [getTargetContractAddress]
  );

  const refreshContractState = useCallback(async () => {
    if (chainId) {
      await checkContractOnChain(chainId);
    }
  }, [chainId, checkContractOnChain]);

  // Initial silent verification on load (no popup)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) {
      return;
    }

    const ethereum = window.ethereum;

    let isMounted = true;

    async function checkExistingConnection() {
      try {
        const accounts = (await ethereum.request({ method: 'eth_accounts' })) as string[];
        if (!isMounted) return;

        if (accounts && accounts.length > 0) {
          const currentAccount = accounts[0].toLowerCase();
          setAccount(currentAccount);

          const currentChainId = (await ethereum.request({ method: 'eth_chainId' })) as string;
          if (!isMounted) return;
          setChainId(currentChainId);
          await checkContractOnChain(currentChainId);
        }
      } catch {
        // Silently ignore background query error on initial mount
      }
    }

    checkExistingConnection();

    const handleAccountsChanged = (rawAccounts: unknown) => {
      const accounts = rawAccounts as string[];
      if (!accounts || accounts.length === 0) {
        setAccount(null);
        setIsContractAvailable(false);
        setContractTotalRecords(null);
      } else {
        const nextAccount = accounts[0].toLowerCase();
        setAccount(nextAccount);
        setError(null);
      }
    };

    const handleChainChanged = (newChainIdRaw: unknown) => {
      const nextChainId = String(newChainIdRaw);
      setChainId(nextChainId);
      setError(null);
      checkContractOnChain(nextChainId);
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      isMounted = false;
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [checkContractOnChain]);

  const connectWallet = async () => {
    if (isConnecting) return;
    setError(null);

    if (typeof window === 'undefined' || !window.ethereum) {
      setError('MetaMask not detected. Please install MetaMask to connect your wallet.');
      return;
    }

    setIsConnecting(true);

    try {
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];

      if (accounts && accounts.length > 0) {
        const selectedAccount = accounts[0].toLowerCase();
        setAccount(selectedAccount);

        const currentChainId = (await window.ethereum.request({
          method: 'eth_chainId',
        })) as string;

        setChainId(currentChainId);
        await checkContractOnChain(currentChainId);
      }
    } catch (err: unknown) {
      const errorObj = err as { code?: number; message?: string };
      if (errorObj?.code === 4001) {
        setError('Connection request was rejected by user.');
      } else if (errorObj?.code === -32002) {
        setError('Connection request is already pending in MetaMask. Please open your extension.');
      } else {
        setError(errorObj?.message || 'Failed to connect MetaMask wallet.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setError(null);
    setIsContractAvailable(false);
    setContractTotalRecords(null);
  };

  const switchNetwork = async (targetChain: 'hardhat' | 'sepolia' | unknown = 'hardhat') => {
    if (!window.ethereum) {
      setError('MetaMask not detected.');
      return;
    }

    setError(null);

    const isSepoliaTarget = targetChain === 'sepolia';
    const targetChainIdHex = isSepoliaTarget ? SEPOLIA_CHAIN_ID_HEX : HARDHAT_CHAIN_ID_HEX;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainIdHex }],
      });
    } catch (switchError: unknown) {
      const err = switchError as { code?: number; message?: string };
      // Error code 4902 indicates that the chain has not been added to MetaMask yet
      if (err?.code === 4902) {
        try {
          if (!isSepoliaTarget) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: HARDHAT_CHAIN_ID_HEX,
                  chainName: 'Hardhat Local',
                  rpcUrls: [HARDHAT_RPC_URL],
                  nativeCurrency: {
                    name: 'Ether',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                },
              ],
            });
          }
        } catch (addError: unknown) {
          const addErr = addError as { code?: number; message?: string };
          if (addErr?.code === 4001) {
            setError('Adding network was rejected by user.');
          } else {
            setError(addErr?.message || 'Failed to add network.');
          }
        }
      } else if (err?.code === 4001) {
        setError('Switching network was rejected by user.');
      } else {
        setError(err?.message || 'Failed to switch network.');
      }
    }
  };

  const clearError = () => setError(null);

  const isConnected = !!account;
  const isSupportedChain =
    chainId === HARDHAT_CHAIN_ID_HEX ||
    chainId === HARDHAT_CHAIN_ID_DECIMAL ||
    chainId === SEPOLIA_CHAIN_ID_HEX ||
    chainId === SEPOLIA_CHAIN_ID_DECIMAL;
  const isWrongNetwork = isConnected && chainId !== null && !isSupportedChain;

  let networkName = 'Disconnected';
  if (chainId) {
    if (chainId === HARDHAT_CHAIN_ID_HEX || chainId === HARDHAT_CHAIN_ID_DECIMAL) {
      networkName = 'Hardhat Local';
    } else if (chainId === SEPOLIA_CHAIN_ID_HEX || chainId === SEPOLIA_CHAIN_ID_DECIMAL) {
      networkName = 'Ethereum Sepolia';
    } else if (chainId === '0x1' || chainId === '1') {
      networkName = 'Ethereum Mainnet';
    } else {
      networkName = `Network (${chainId})`;
    }
  }

  const getBrowserProvider = useCallback((): BrowserProvider | null => {
    if (typeof window === 'undefined' || !window.ethereum) return null;
    return new BrowserProvider(window.ethereum);
  }, []);

  const getSigner = useCallback(async (): Promise<any | null> => {
    const provider = getBrowserProvider();
    if (!provider) return null;
    try {
      return await provider.getSigner();
    } catch {
      return null;
    }
  }, [getBrowserProvider]);

  const checkHasRole = useCallback(
    async (role: string, targetAccount?: string): Promise<boolean> => {
      const target = targetAccount || account;
      if (!target || !contractAddress) return false;
      const provider = getBrowserProvider();
      if (!provider) return false;
      try {
        const contract = new Contract(contractAddress, BookCopyrightRegistryAbi, provider);
        return await contract.hasRole(role, target);
      } catch {
        return false;
      }
    },
    [account, contractAddress, getBrowserProvider]
  );

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        networkName,
        isConnected,
        isConnecting,
        isWrongNetwork,
        contractAddress,
        isContractAvailable,
        contractTotalRecords,
        error,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        clearError,
        refreshContractState,
        getSigner,
        getBrowserProvider,
        checkHasRole,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
