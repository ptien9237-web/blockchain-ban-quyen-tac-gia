import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  UploadCloud,
  CheckCircle2,
  ShieldAlert,
  BookOpen,
  RefreshCw,
  Search,
  Copy,
  Check,
  Hash,
  AlertTriangle,
  Flag,
} from 'lucide-react';

import { copyrightApi, type VerifyCopyrightResult } from '../services/api';
import { useTranslation } from '../contexts/I18nContext';
import { shortenAddress } from '../utils/blockchain';
import { ReportModal } from '../components/dispute/ReportModal';
import './Verify.css';


type VerifyTab = 'FILE' | 'QUERY';
type VerifyStep = 'INPUT' | 'CALCULATING' | 'RESULT';

export function Verify() {
  const { query: urlQuery } = useParams<{ query?: string }>();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<VerifyTab>(urlQuery ? 'QUERY' : 'FILE');
  const [step, setStep] = useState<VerifyStep>(urlQuery ? 'CALCULATING' : 'INPUT');
  const [file, setFile] = useState<File | null>(null);
  const [inputHash, setInputHash] = useState<string>(urlQuery || '');
  const [calculatedHash, setCalculatedHash] = useState<string>('');
  const [verifyData, setVerifyData] = useState<VerifyCopyrightResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const copyToClipboard = (text: string, fieldId: string) => {

    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const calculateSha256 = async (inputFile: File): Promise<string> => {
    const arrayBuffer = await inputFile.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const runVerification = async (targetQuery: string) => {
    try {
      setStep('CALCULATING');
      setError(null);
      const res = await copyrightApi.verify(targetQuery);
      setVerifyData(res);
      setStep('RESULT');
    } catch (err: any) {
      setError(err.message || 'Error occurred while verifying on-chain record.');
      setStep('RESULT');
    }
  };

  // If URL has query param on initial mount, run verification immediately
  useEffect(() => {
    if (urlQuery && urlQuery.trim()) {
      setInputHash(urlQuery.trim());
      setActiveTab('QUERY');
      runVerification(urlQuery.trim());
    }
  }, [urlQuery]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    try {
      setFile(selectedFile);
      setStep('CALCULATING');
      setError(null);

      // Compute SHA-256 from actual file bytes
      const hash = await calculateSha256(selectedFile);
      setCalculatedHash(hash);

      await runVerification(hash);
    } catch (err: any) {
      setError(err.message || 'Error processing file bytes.');
      setStep('RESULT');
    }
  };

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputHash.trim()) return;
    setCalculatedHash(inputHash.trim());
    await runVerification(inputHash.trim());
  };

  const reset = () => {
    setStep('INPUT');
    setFile(null);
    setCalculatedHash('');
    setVerifyData(null);
    setError(null);
  };

  const currentDisplayHash =
    calculatedHash ||
    verifyData?.query ||
    (verifyData?.database?.sha256 ? verifyData.database.sha256 : '');

  return (
    <div className="verify-root container py-16">
      <div className="verify-header text-center mb-8">
        <h1 className="serif text-4xl mb-4">{t('verify.title')}</h1>
        <p className="text-muted max-w-2xl mx-auto">{t('verify.subtitle')}</p>
      </div>

      <div className="verify-card archival-border max-w-3xl mx-auto p-8 bg-surface">
        {/* TABS */}
        {step === 'INPUT' && (
          <div className="flex border-b border-border mb-6">
            <button
              className={`py-3 px-6 font-mono text-xs uppercase tracking-wider font-semibold border-b-2 transition-all ${
                activeTab === 'FILE'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
              onClick={() => setActiveTab('FILE')}
            >
              {t('verify.tabFile')}
            </button>
            <button
              className={`py-3 px-6 font-mono text-xs uppercase tracking-wider font-semibold border-b-2 transition-all ${
                activeTab === 'QUERY'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
              onClick={() => setActiveTab('QUERY')}
            >
              {t('verify.tabQuery')}
            </button>
          </div>
        )}

        {/* INPUT: FILE UPLOAD */}
        {step === 'INPUT' && activeTab === 'FILE' && (
          <div className="upload-zone border-dashed border-2 p-12 text-center rounded-sm">
            <UploadCloud size={48} className="text-muted mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">{t('verify.selectDrop')}</h3>
            <p className="text-sm text-muted mb-6">{t('verify.supports')}</p>
            <input
              type="file"
              id="file-upload"
              className="hidden-input"
              onChange={handleFileUpload}
            />
            <label htmlFor="file-upload" className="btn btn-primary cursor-pointer">
              {t('verify.browseFiles')}
            </label>
          </div>
        )}

        {/* INPUT: QUERY / SEARCH BAR */}
        {step === 'INPUT' && activeTab === 'QUERY' && (
          <form onSubmit={handleQuerySubmit} className="query-zone py-8 px-4 text-center space-y-4">
            <Search size={36} className="text-muted mx-auto mb-2" />
            <p className="text-xs text-muted max-w-md mx-auto">
              Nhập mã băm SHA-256 (64 ký tự hex) hoặc mã định danh bản ghi (UUID) để tra cứu dữ liệu trực tiếp trên Smart Contract.
            </p>
            <div className="flex gap-2 max-w-xl mx-auto">
              <input
                type="text"
                className="input font-mono text-xs flex-1"
                placeholder={t('verify.queryPlaceholder')}
                value={inputHash}
                onChange={(e) => setInputHash(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="btn btn-primary text-xs shrink-0 flex items-center gap-1.5"
                disabled={!inputHash.trim()}
              >
                <Search size={14} /> {t('verify.btnSearch')}
              </button>
            </div>
          </form>
        )}

        {/* CALCULATING / SEARCHING STATE */}
        {step === 'CALCULATING' && (
          <div className="calculating-zone text-center py-12 space-y-4">
            <RefreshCw size={36} className="animate-spin text-accent mx-auto mb-2" />
            <h3 className="font-medium text-lg">
              {file ? t('verify.calculating') : t('verify.searching')}
            </h3>
            {file && (
              <p className="text-xs text-muted font-mono">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
            <p className="text-xs text-muted font-sans">
              Đang tra cứu hàm verifyHash() trên Hardhat Local (Chain 31337)...
            </p>
          </div>
        )}

        {/* RESULT STATE */}
        {step === 'RESULT' && (
          <div className="result-zone">
            {error ? (
              <div className="text-center py-8">
                <ShieldAlert size={48} className="text-warning mx-auto mb-4" />
                <h3 className="serif text-xl mb-2">Lỗi xác minh</h3>
                <p className="text-muted text-xs mb-6">{error}</p>
                <button className="btn btn-secondary" onClick={reset}>
                  {t('verify.tryAnother')}
                </button>
              </div>
            ) : verifyData?.found && verifyData.onChain.exists ? (
              /* ON-CHAIN MATCH FOUND */
              <div className="result-success text-center space-y-6">
                <div
                  className={`cert-status-badge p-5 archival-border text-center ${
                    verifyData.onChain.status === 'ACTIVE'
                      ? 'bg-success-subtle text-success'
                      : verifyData.onChain.status === 'DISPUTED'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                      : 'bg-accent/10 border-accent/30 text-accent'
                  }`}
                >
                  {verifyData.onChain.status === 'ACTIVE' ? (
                    <CheckCircle2 size={40} className="text-success mx-auto mb-2" />
                  ) : verifyData.onChain.status === 'DISPUTED' ? (
                    <AlertTriangle size={40} className="text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                  ) : (
                    <ShieldAlert size={40} className="text-accent mx-auto mb-2" />
                  )}

                  <h2 className="serif text-2xl font-medium tracking-wide">
                    {verifyData.onChain.status === 'ACTIVE'
                      ? t('verify.onChainActive')
                      : verifyData.onChain.status === 'DISPUTED'
                      ? t('verify.onChainDisputed')
                      : t('verify.onChainRevoked')}
                  </h2>

                  <p className="text-xs text-muted mt-1 max-w-md mx-auto">
                    {verifyData.onChain.status === 'ACTIVE'
                      ? t('verify.matchFoundDesc')
                      : verifyData.onChain.status === 'DISPUTED'
                      ? 'CẢNH BÁO: Bản ghi bản quyền này hiện đang có tranh chấp sở hữu trí tuệ và đang được hội đồng quản trị thư viện tiến hành điều tra on-chain.'
                      : 'CẢNH BÁO: Chứng nhận bản quyền của tác phẩm này đã bị thu hồi hoặc hủy bỏ hiệu lực trên Smart Contract do vi phạm bản quyền hoặc có phán quyết pháp lý.'}
                  </p>
                </div>

                <div className="archival-border bg-ground p-6 text-left text-xs font-mono space-y-3">
                  <div className="flex flex-col gap-1 pb-2 border-b border-border">
                    <span className="text-muted flex items-center gap-1">
                      <Hash size={13} /> {t('verify.fileHash')}
                    </span>
                    <div className="flex items-center justify-between gap-2 bg-surface p-2 rounded">
                      <span className="break-all font-bold text-accent">
                        {currentDisplayHash}
                      </span>
                      <button
                        className="btn-icon-copy shrink-0"
                        onClick={() => copyToClipboard(currentDisplayHash, 'hash')}
                        title="Copy Hash"
                      >
                        {copiedField === 'hash' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-muted block mb-0.5">ON-CHAIN RECORD ID:</span>
                      <span className="font-bold text-foreground break-all text-[11px]">
                        {verifyData.onChain.recordId}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted block mb-0.5">VÍ TÁC GIẢ (OWNER WALLET):</span>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-foreground">
                          {verifyData.onChain.authorWallet
                            ? shortenAddress(verifyData.onChain.authorWallet, 6)
                            : 'N/A'}
                        </span>
                        {verifyData.onChain.authorWallet && (
                          <button
                            className="btn-icon-copy"
                            onClick={() => copyToClipboard(verifyData.onChain.authorWallet!, 'wallet')}
                            title="Copy Wallet"
                          >
                            {copiedField === 'wallet' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-muted block mb-0.5">MẠNG LƯỚI & SỐ KHỐI:</span>
                      <span className="font-bold">
                        Hardhat Local (#{verifyData.database?.blockNumber || 1})
                      </span>
                    </div>

                    <div>
                      <span className="text-muted block mb-0.5">MỐC THỜI GIAN BLOCK:</span>
                      <span className="font-bold">
                        {verifyData.onChain.registeredAt
                          ? new Date(verifyData.onChain.registeredAt * 1000).toLocaleString()
                          : 'Confirmed'}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted block mb-0.5">SMART CONTRACT:</span>
                      <span className="text-muted" title={verifyData.onChain.contractAddress}>
                        {shortenAddress(verifyData.onChain.contractAddress, 6)}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted block mb-0.5">PHIÊN BẢN TÁC PHẨM:</span>
                      <span className="badge badge-success text-[10px]">
                        Version {verifyData.onChain.versionNumber || verifyData.database?.versionNumber || 1}
                      </span>
                    </div>
                  </div>

                  {/* Database Cross-check details */}
                  {verifyData.database && (
                    <div className="pt-3 mt-3 border-t border-border flex justify-between items-center text-xs">
                      <div>
                        <span className="text-muted block mb-0.5">{t('verify.dbMatched')}:</span>
                        <span className="font-sans font-medium text-foreground">
                          {verifyData.database.bookTitle}
                        </span>
                      </div>
                      {verifyData.isConsistent && (
                        <span className="badge badge-success flex items-center gap-1 font-sans">
                          <Check size={12} /> {t('verify.consistent')}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-center pt-2 flex-wrap">
                  <button className="btn btn-secondary text-xs" onClick={reset}>
                    {t('verify.verifyAnother')}
                  </button>
                  {verifyData.database?.bookId && (
                    <Link
                      to={`/book/${verifyData.database.bookId}`}
                      className="btn btn-primary text-xs flex items-center gap-1.5"
                    >
                      <BookOpen size={14} /> Xem Tác Phẩm Trong Thư Viện
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    className="btn btn-secondary text-xs text-accent flex items-center gap-1.5 border-accent/30 hover:bg-accent/10"
                  >
                    <Flag size={14} /> Khiếu Nại Bản Quyền
                  </button>
                </div>
              </div>

            ) : (
              /* NO MATCH FOUND */
              <div className="result-not-found text-center space-y-6">
                <div className="cert-status-badge p-4 bg-warning-subtle archival-border text-center">
                  <ShieldAlert size={40} className="text-warning mx-auto mb-2" />
                  <h2 className="serif text-2xl text-warning font-medium">
                    {t('verify.noMatch')}
                  </h2>
                  <p className="text-xs text-muted mt-1">{t('verify.noMatchDesc')}</p>
                </div>

                <div className="archival-border bg-ground p-6 text-left text-xs font-mono space-y-2">
                  <span className="text-muted block mb-1">{t('verify.calculatedHash')}:</span>
                  <div className="flex items-center justify-between gap-2 bg-surface p-2 rounded">
                    <span className="break-all font-bold text-muted">
                      {currentDisplayHash}
                    </span>
                    <button
                      className="btn-icon-copy shrink-0"
                      onClick={() => copyToClipboard(currentDisplayHash, 'hash')}
                      title="Copy Hash"
                    >
                      {copiedField === 'hash' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                    </button>
                  </div>

                  {file && (
                    <div className="text-[11px] text-muted pt-2">
                      Tệp gốc: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>

                <div className="flex gap-4 justify-center pt-2">
                  <button className="btn btn-secondary text-xs" onClick={reset}>
                    {t('verify.tryAnother')}
                  </button>
                  <Link to="/profile" className="btn btn-primary text-xs">
                    {t('verify.registerThis')}
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-12 text-center max-w-xl mx-auto text-xs text-muted leading-relaxed">
        <p>
          <strong>{t('verify.note')}</strong> {t('verify.noteDesc')}
        </p>
      </div>

      {/* Report & Copyright Dispute Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        bookId={verifyData?.database?.bookId || null}
        bookTitle={verifyData?.database?.bookTitle || null}
        copyrightRecordId={verifyData?.onChain?.recordId || null}
        contentHash={currentDisplayHash || null}
      />
    </div>
  );
}

