import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  ShieldCheck,
  X,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Wallet,
  ArrowRight,
  FileCheck,
} from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';
import { useTranslation } from '../../contexts/I18nContext';
import {
  copyrightApi,
  type ApiBook,
  type ApiBookFile,
} from '../../services/api';
import { BookCopyrightRegistryAbi } from '../../contracts/BookCopyrightRegistry';
import { shortenAddress } from '../../utils/blockchain';
import './RegisterCopyrightModal.css';

interface RegisterCopyrightModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: ApiBook;
  file: ApiBookFile;
  onRegisteredSuccess: () => void;
}

type ModalStep = 'REVIEW' | 'SIGNING' | 'SYNCING' | 'SUCCESS' | 'ERROR';

const REGISTRAR_ROLE_HASH = ethers.keccak256(ethers.toUtf8Bytes('REGISTRAR_ROLE'));

export function RegisterCopyrightModal({
  isOpen,
  onClose,
  book,
  file,
  onRegisteredSuccess,
}: RegisterCopyrightModalProps) {
  const { t } = useTranslation();
  const {
    account,
    isConnected,
    isWrongNetwork,
    connectWallet,
    switchNetwork,
    contractAddress,
    getSigner,
    checkHasRole,
  } = useWallet();

  const [step, setStep] = useState<ModalStep>('REVIEW');
  const [hasRegistrarRole, setHasRegistrarRole] = useState<boolean>(false);
  const [checkingRole, setCheckingRole] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [txHash, setTxHash] = useState<string>('');
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check role whenever account or contract changes
  useEffect(() => {
    let active = true;
    const verifyRole = async () => {
      if (!account || !contractAddress) {
        setHasRegistrarRole(false);
        return;
      }
      setCheckingRole(true);
      try {
        const has = await checkHasRole(REGISTRAR_ROLE_HASH, account);
        if (active) setHasRegistrarRole(has);
      } catch {
        if (active) setHasRegistrarRole(false);
      } finally {
        if (active) setCheckingRole(false);
      }
    };

    if (isOpen) {
      verifyRole();
      setStep('REVIEW');
      setErrorMessage(null);
      setTxHash('');
      setBlockNumber(null);
    }

    return () => {
      active = false;
    };
  }, [isOpen, account, contractAddress, checkHasRole]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  /**
   * Flow A: Direct signing via MetaMask (when user has REGISTRAR_ROLE e.g. Account #0)
   */
  const handleSignMetaMask = async () => {
    if (!account) return;
    try {
      setErrorMessage(null);
      setStep('SIGNING');

      // 1. Prepare registration on backend
      const prep = await copyrightApi.prepare({
        bookId: book.bookId,
        bookFileId: file.bookFileId,
        authorWallet: account,
      });

      // 2. Obtain signer from MetaMask
      const signer = await getSigner();
      if (!signer) {
        throw new Error('Could not access MetaMask signer. Please unlock your wallet.');
      }

      // 3. Instantiate contract with signer
      const contract = new ethers.Contract(
        prep.contractAddress || contractAddress!,
        BookCopyrightRegistryAbi,
        signer
      );

      // 4. Trigger MetaMask transaction
      const tx = await contract.registerCopyright(
        prep.recordIdBytes32,
        prep.bookIdBytes32,
        prep.versionNumber,
        prep.contentHashBytes32,
        prep.authorWallet,
        prep.metadataUri
      );

      setTxHash(tx.hash);
      setStep('SYNCING');

      // 5. Wait for block confirmation
      const receipt = await tx.wait(1);
      const minedBlock = Number(receipt.blockNumber);
      setBlockNumber(minedBlock);

      // 6. Synchronize with SQL Server
      await copyrightApi.sync({
        copyrightRecordId: prep.copyrightRecordId,
        txHash: tx.hash,
      });

      setStep('SUCCESS');
    } catch (err: any) {
      console.error('[RegisterCopyright] Error:', err);
      let msg = err.reason || err.message || 'Transaction failed.';
      if (err.code === 4001 || err.info?.error?.code === 4001) {
        msg = 'Transaction rejected in MetaMask by user.';
      } else if (err.code === 'ACTION_REJECTED') {
        msg = 'User denied transaction signature in MetaMask.';
      }
      setErrorMessage(msg);
      setStep('ERROR');
    }
  };

  /**
   * Flow B: Registrar Relay (when author does not have REGISTRAR_ROLE)
   */
  const handleRelay = async () => {
    if (!account) return;
    try {
      setErrorMessage(null);
      setStep('SIGNING');

      // 1. Prepare registration
      const prep = await copyrightApi.prepare({
        bookId: book.bookId,
        bookFileId: file.bookFileId,
        authorWallet: account,
      });

      setStep('SYNCING');

      // 2. Request backend registrar relay
      const relayRes = await copyrightApi.relay({
        copyrightRecordId: prep.copyrightRecordId,
      });

      setTxHash(relayRes.txHash);
      setBlockNumber(relayRes.blockNumber);
      setStep('SUCCESS');
    } catch (err: any) {
      console.error('[RegisterCopyright Relay] Error:', err);
      setErrorMessage(err.message || 'Relay registration failed.');
      setStep('ERROR');
    }
  };

  const handleFinish = () => {
    onRegisteredSuccess();
    onClose();
  };

  return (
    <div className="copyright-modal-backdrop" onClick={onClose}>
      <div
        className="copyright-modal-card archival-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <ShieldCheck size={24} className="text-accent" />
            <h3 className="serif text-xl">{t('book.modalTitle')}</h3>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <p className="modal-subtitle text-xs text-muted">
          {t('book.modalSubtitle')}
        </p>

        {/* STEP 1: REVIEW DETAILS */}
        {step === 'REVIEW' && (
          <div className="modal-body space-y-4">
            <div className="review-notice text-xs p-3 archival-border bg-ground">
              <span className="font-semibold block mb-1">
                {t('book.reviewNotice')}
              </span>
              <p className="text-muted leading-relaxed">
                Mã băm SHA-256 dưới đây được trích xuất trực tiếp từ các byte của tệp nhị phân phiên bản sách. Dữ liệu này sẽ được neo bất biến vào sổ cái blockchain.
              </p>
            </div>

            <div className="details-table text-xs font-mono space-y-2">
              <div className="detail-row flex justify-between py-1 border-b border-border">
                <span className="text-muted">TÁC PHẨM:</span>
                <span className="font-medium text-right truncate max-w-xs font-sans">
                  {book.title}
                </span>
              </div>
              <div className="detail-row flex justify-between py-1 border-b border-border">
                <span className="text-muted">PHIÊN BẢN:</span>
                <span className="font-semibold text-accent">
                  Version {file.versionNumber} ({file.originalFileName})
                </span>
              </div>
              <div className="detail-row flex flex-col py-1 border-b border-border">
                <span className="text-muted mb-1">SHA-256 FINGERPRINT (CONTENT HASH):</span>
                <div className="flex items-center gap-2 bg-ground p-2 rounded">
                  <span className="break-all text-xs font-bold text-accent" title={file.sha256}>
                    {file.sha256}
                  </span>
                  <button
                    className="btn-icon-copy shrink-0"
                    onClick={() => copyToClipboard(file.sha256, 'hash')}
                    title="Copy SHA-256"
                  >
                    {copiedField === 'hash' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="detail-row flex justify-between py-1 border-b border-border">
                <span className="text-muted">MẠNG LƯỚI:</span>
                <span className="font-semibold">Hardhat Local (Chain ID: 31337)</span>
              </div>

              <div className="detail-row flex justify-between py-1 border-b border-border">
                <span className="text-muted">CONTRACT:</span>
                <span className="font-mono text-muted" title={contractAddress || ''}>
                  {contractAddress ? shortenAddress(contractAddress, 6) : 'Not Deployed'}
                </span>
              </div>

              <div className="detail-row flex justify-between py-1">
                <span className="text-muted">VÍ TÁC GIẢ KẾT NỐI:</span>
                <span className="font-bold text-foreground">
                  {account ? shortenAddress(account, 6) : 'Chưa kết nối ví'}
                </span>
              </div>
            </div>

            {/* Wallet Preconditions */}
            {!isConnected ? (
              <div className="wallet-warning p-3 bg-ground archival-border text-center space-y-2">
                <p className="text-xs text-muted">{t('book.walletRequired')}</p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm flex items-center gap-2 mx-auto"
                  onClick={connectWallet}
                >
                  <Wallet size={16} /> Kết nối MetaMask
                </button>
              </div>
            ) : isWrongNetwork ? (
              <div className="wallet-warning p-3 bg-ground archival-border text-center space-y-2">
                <p className="text-xs text-warning flex items-center justify-center gap-1 font-medium">
                  <AlertTriangle size={14} /> {t('book.wrongNetworkWarning')}
                </p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm mx-auto"
                  onClick={switchNetwork}
                >
                  Chuyển sang 31337
                </button>
              </div>
            ) : checkingRole ? (
              <div className="text-center py-2 text-xs text-muted flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin" /> Đang kiểm tra quyền REGISTRAR_ROLE trên Smart Contract...
              </div>
            ) : hasRegistrarRole ? (
              <div className="role-badge p-2 bg-success-muted text-success text-xs archival-border flex items-center gap-2">
                <Check size={16} />
                <span>Ví của bạn có quyền <strong>REGISTRAR_ROLE</strong>. Bạn có thể tự ký và phát sóng trực tiếp bằng MetaMask.</span>
              </div>
            ) : (
              <div className="role-warning p-3 bg-ground archival-border text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-warning font-semibold">
                      {t('book.registrarRoleRequired')}
                    </strong>
                    <p className="text-muted text-xs leading-relaxed mt-1">
                      {t('book.registrarRoleExplanation')}
                    </p>
                  </div>
                </div>
                <div className="text-xs pt-2 border-t border-border space-y-1">
                  <p className="text-muted">
                    • <em>Cách 1:</em> Đổi sang tài khoản Registrar trong MetaMask (Ví dụ Account #0: <code>0xf39F...2266</code>) để tự ký.
                  </p>
                  <p className="text-muted">
                    • <em>Cách 2:</em> Bấm nút <strong>Ủy quyền Registrar Relay</strong> bên dưới để hệ thống xác nhận và phát sóng thay bạn.
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="modal-actions pt-2 flex justify-end gap-3">
              <button type="button" className="btn btn-secondary text-xs" onClick={onClose}>
                {t('book.closeModal')}
              </button>

              {isConnected && !isWrongNetwork && (
                hasRegistrarRole ? (
                  <button
                    type="button"
                    className="btn btn-primary text-xs flex items-center gap-2"
                    onClick={handleSignMetaMask}
                  >
                    <ShieldCheck size={16} />
                    {t('book.btnSignMetaMask')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary text-xs flex items-center gap-2"
                    onClick={handleRelay}
                  >
                    <ArrowRight size={16} />
                    {t('book.btnRelay')}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* STEP 2: SIGNING / BROADCASTING */}
        {(step === 'SIGNING' || step === 'SYNCING') && (
          <div className="modal-body text-center py-8 space-y-4">
            <RefreshCw size={40} className="animate-spin text-accent mx-auto" />
            <h4 className="serif text-lg font-medium">
              {step === 'SIGNING'
                ? 'Đang chờ xác nhận giao dịch...'
                : 'Đang đồng bộ sổ cái blockchain với cơ sở dữ liệu...'}
            </h4>
            <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
              {step === 'SIGNING'
                ? 'Vui lòng xác nhận giao dịch trong cửa sổ popup MetaMask của bạn. Không đóng trang này.'
                : 'Đang đọc biên lai giao dịch và mốc thời gian khối để cập nhật chứng chỉ bản quyền.'}
            </p>
            {txHash && (
              <div className="text-xs font-mono bg-ground p-2 archival-border inline-block max-w-md break-all">
                TxHash: {txHash}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 'SUCCESS' && (
          <div className="modal-body text-center py-6 space-y-4">
            <div className="success-icon-wrap mx-auto">
              <FileCheck size={48} className="text-success mx-auto" />
            </div>
            <h4 className="serif text-2xl text-success font-medium">
              {t('book.broadcastSuccess')}
            </h4>
            <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
              Chứng chỉ bản quyền kỹ thuật số đã được ghi nhận thành công và bất biến trên Smart Contract BookCopyrightRegistry.
            </p>

            <div className="archival-border bg-ground p-4 text-left text-xs font-mono space-y-2 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-muted">MÃ GIAO DỊCH:</span>
                <span className="font-bold text-accent truncate max-w-xs" title={txHash}>
                  {shortenAddress(txHash, 8)}
                </span>
              </div>
              {blockNumber && (
                <div className="flex justify-between">
                  <span className="text-muted">SỐ KHỐI (BLOCK):</span>
                  <span className="font-bold">#{blockNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted">TRẠNG THÁI:</span>
                <span className="badge badge-success">ON_CHAIN (ACTIVE)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">VÍ SỞ HỮU:</span>
                <span className="text-foreground">{account ? shortenAddress(account, 6) : ''}</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                className="btn btn-secondary text-xs"
                onClick={handleFinish}
              >
                {t('book.closeModal')}
              </button>
              <a
                href={`/verify/${file.sha256}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary text-xs flex items-center gap-2"
              >
                <ExternalLink size={14} />
                {t('book.viewProof')}
              </a>
            </div>
          </div>
        )}

        {/* STEP 4: ERROR */}
        {step === 'ERROR' && (
          <div className="modal-body text-center py-6 space-y-4">
            <AlertTriangle size={48} className="text-warning mx-auto" />
            <h4 className="serif text-xl font-medium text-warning">
              Không thể hoàn tất đăng ký bản quyền
            </h4>
            <div className="bg-ground p-3 archival-border text-xs text-muted max-w-md mx-auto break-words text-left font-mono">
              {errorMessage || 'Đã xảy ra lỗi trong quá trình xử lý giao dịch on-chain.'}
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                className="btn btn-secondary text-xs"
                onClick={onClose}
              >
                {t('book.closeModal')}
              </button>
              <button
                type="button"
                className="btn btn-primary text-xs"
                onClick={() => setStep('REVIEW')}
              >
                Thử lại
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
