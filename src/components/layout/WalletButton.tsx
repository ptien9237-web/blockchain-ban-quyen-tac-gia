import { useState, useRef, useEffect } from 'react';
import {
  Wallet,
  ChevronDown,
  Check,
  Copy,
  AlertTriangle,
  Loader2,
  LogOut,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';
import { useTranslation } from '../../contexts/I18nContext';
import { shortenAddress } from '../../utils/blockchain';

export function WalletButton() {
  const {
    account,
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
  } = useWallet();

  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCopy = (text: string, type: 'account' | 'contract') => {
    navigator.clipboard.writeText(text);
    if (type === 'account') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
    }
  };

  return (
    <div className="relative wallet-button-container" ref={dropdownRef}>
      {/* 1. NOT CONNECTED STATE */}
      {!isConnected ? (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="nav-action-wallet flex items-center gap-2 cursor-pointer transition-all"
          title="Connect MetaMask Wallet (Hardhat Local)"
          id="btn-connect-wallet"
        >
          {isConnecting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm font-medium hidden-mobile">{t('wallet.connecting')}</span>
            </>
          ) : (
            <>
              <Wallet size={18} />
              <span className="text-sm font-medium hidden-mobile">{t('nav.connectWallet')}</span>
            </>
          )}
        </button>
      ) : isWrongNetwork ? (
        /* 2. WRONG NETWORK STATE */
        <button
          onClick={switchNetwork}
          className="nav-action-wallet-wrong flex items-center gap-2 cursor-pointer text-xs font-mono px-3 py-1.5 rounded-sm"
          title={t('wallet.switchToHardhat')}
          id="btn-switch-network"
        >
          <AlertTriangle size={15} className="text-amber-500" />
          <span className="hidden-mobile font-medium">{t('wallet.wrongNetwork')}</span>
          <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1 py-0.5 rounded">
            Switch 31337
          </span>
        </button>
      ) : (
        /* 3. CONNECTED TO HARDHAT LOCAL */
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className={`nav-action-wallet-connected flex items-center gap-2 cursor-pointer px-3 py-1.5 archival-border rounded-sm transition-all ${
            isOpen ? 'active' : ''
          }`}
          title={account || ''}
          id="btn-wallet-dropdown"
        >
          <span className="wallet-dot-connected" />
          <Wallet size={15} />
          <span className="font-mono text-xs font-medium">
            {shortenAddress(account || '', 4)}
          </span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {/* ERROR TOAST / BANNER */}
      {error && !isConnected && (
        <div className="wallet-error-toast archival-border rounded-sm shadow-md animate-fade-in">
          <div className="flex items-start gap-2">
            <AlertTriangle size={15} className="text-red-500 mt-0.5 shrink-0" />
            <div className="text-xs text-ink flex-1 pr-2">{error}</div>
            <button
              onClick={clearError}
              className="text-muted hover:text-ink cursor-pointer p-0.5"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* DROPDOWN POPUP */}
      {isOpen && isConnected && (
        <div className="wallet-dropdown-panel archival-border rounded-sm shadow-xl animate-fade-in">
          {/* Header */}
          <div className="wallet-dropdown-header px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="wallet-dot-connected" />
              <span className="text-xs font-serif font-bold text-ink">
                {t('wallet.connected')}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
              {networkName}
            </span>
          </div>

          <div className="p-4 space-y-3">
            {/* Account Box */}
            <div className="wallet-info-box p-2.5 rounded-sm bg-ground">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-muted font-mono uppercase">
                  MetaMask Account
                </span>
                <button
                  onClick={() => account && handleCopy(account, 'account')}
                  className="copy-btn flex items-center gap-1 text-[11px] text-interactive hover:underline cursor-pointer"
                  title="Copy full address"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-green-500" />
                      <span className="text-green-500">{t('wallet.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>{t('wallet.copyAddress')}</span>
                    </>
                  )}
                </button>
              </div>
              <div className="font-mono text-xs text-ink break-all select-all">
                {account}
              </div>
            </div>

            {/* Smart Contract Status */}
            <div className="wallet-info-box p-2.5 rounded-sm bg-ground">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-muted font-mono uppercase flex items-center gap-1">
                  <ShieldCheck size={13} className="text-interactive" />
                  {t('wallet.contract')}
                </span>
                {contractAddress && (
                  <button
                    onClick={() => handleCopy(contractAddress, 'contract')}
                    className="copy-btn flex items-center gap-1 text-[11px] text-interactive hover:underline cursor-pointer"
                  >
                    {copiedContract ? (
                      <Check size={12} className="text-green-500" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                )}
              </div>
              <div className="font-mono text-[11px] text-muted break-all">
                {contractAddress || 'Not configured'}
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                <span className="text-muted">Status:</span>
                {isContractAvailable ? (
                  <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                    ✓ {t('wallet.contractVerified')}
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    {t('wallet.contractNotDetected')}
                  </span>
                )}
              </div>
              {isContractAvailable && contractTotalRecords !== null && (
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-muted">{t('wallet.totalRecords')}:</span>
                  <span className="font-mono font-bold text-ink">
                    {contractTotalRecords}
                  </span>
                </div>
              )}
            </div>

            {/* Network Info */}
            <div className="flex items-center justify-between text-xs py-1 px-1">
              <span className="text-muted">{t('wallet.chainId')}:</span>
              <span className="font-mono text-ink">31337 (0x7a69)</span>
            </div>

            {/* Disconnect Action */}
            <div className="pt-2 border-t border-border">
              <button
                onClick={() => {
                  disconnectWallet();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-sm border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                id="btn-wallet-disconnect"
              >
                <LogOut size={14} />
                <span>{t('wallet.disconnect')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
