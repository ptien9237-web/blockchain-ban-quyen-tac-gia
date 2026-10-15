import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Shield,
  FileText,
  ChevronRight,
  Hash,
  Download,
  Calendar,
  User,
  X,
  CheckCircle2,
  AlertTriangle,
  History,
  BookOpen,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Flag,
} from 'lucide-react';
import {
  booksApi,
  copyrightApi,
  type ApiBook,
  type ApiBookFile,
  type VerifyIntegrityResult,
  type ApiCopyrightRecord,
} from '../services/api';
import { useTranslation } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { RegisterCopyrightModal } from '../components/copyright/RegisterCopyrightModal';
import { ReportModal } from '../components/dispute/ReportModal';
import { shortenAddress } from '../utils/blockchain';
import './BookDetail.css';

export function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [book, setBook] = useState<ApiBook | null>(null);
  const [files, setFiles] = useState<ApiBookFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ApiBookFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Digital Reader state
  const [isReading, setIsReading] = useState(false);

  // SHA-256 integrity verification state
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyIntegrityResult | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Blockchain copyright state
  const [copyrightRecords, setCopyrightRecords] = useState<ApiCopyrightRecord[]>([]);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);


  useEffect(() => {
    if (!id) return;

    const loadBookData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await booksApi.getById(id);
        setBook(data);

        // Fetch version history
        try {
          const fileList = await booksApi.getFiles(id);
          setFiles(fileList);
          const current = fileList.find((f) => f.isCurrent) || fileList[0] || data.currentFile || null;
          setSelectedFile(current);
        } catch {
          if (data.currentFile) {
            setSelectedFile(data.currentFile);
            setFiles([data.currentFile]);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Work not found.');
      } finally {
        setLoading(false);
      }
    };

    const loadCopyrightRecords = async () => {
      try {
        const records = await copyrightApi.getByBook(id);
        setCopyrightRecords(records);
      } catch {
        // Silently catch in case of network issue
      }
    };

    loadBookData();
    loadCopyrightRecords();
  }, [id]);

  const reloadCopyright = async () => {
    if (!id) return;
    try {
      const records = await copyrightApi.getByBook(id);
      setCopyrightRecords(records);
    } catch {
      // ignore
    }
  };

  const handleVerifyIntegrity = async () => {
    if (!book || !selectedFile) return;
    try {
      setVerifying(true);
      const res = await booksApi.verifyFileIntegrity(book.bookId, selectedFile.bookFileId);
      setVerifyResult(res);
    } catch (err: any) {
      setVerifyResult({
        bookId: book.bookId,
        fileId: selectedFile.bookFileId,
        versionNumber: selectedFile.versionNumber,
        recordedSha256: selectedFile.sha256,
        actualSha256: null,
        matches: false,
        fileExistsOnDisk: false,
        status: 'FILE_NOT_FOUND',
        details: err.message || 'Failed to verify file integrity on storage server.',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleDownload = () => {
    if (!book || !selectedFile) return;
    setDownloadError(null);

    if (selectedFile.accessLevel === 'PUBLIC_READ') {
      setDownloadError(
        'This document is published for online archival reading only. Direct raw download is restricted to authors/administrators.'
      );
      return;
    }

    const downloadUrl = booksApi.getDownloadUrl(book.bookId, selectedFile.bookFileId);
    window.open(downloadUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="container py-24 text-center">
        <div className="font-mono text-muted text-sm">{t('auth.saving')}</div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="container py-16 text-center">
        <h2 className="serif text-2xl mb-4">{t('book.notFound')}</h2>
        <p className="text-muted text-sm mb-6">{error || 'Work could not be found or has restricted access.'}</p>
        <Link to="/discover" className="btn btn-primary">
          {t('book.returnToLibrary')}
        </Link>
      </div>
    );
  }

  const primaryAuthor = book.authors.find((a) => a.contributionRole === 'PRIMARY_AUTHOR') || book.authors[0];
  const allAuthorsText = book.authors.map((a) => a.penName).join(', ') || 'Anonymous';
  const publishedYear = book.publishedAt ? new Date(book.publishedAt).getFullYear() : 'DRAFT';
  const hasFile = Boolean(selectedFile);

  const currentRecord = copyrightRecords.find(
    (r) =>
      selectedFile &&
      (r.bookFileId === selectedFile.bookFileId || r.versionNumber === selectedFile.versionNumber)
  );

  const isAuthor = Boolean(
    user &&
      (user.roles?.includes('ADMIN') ||
        book.authors.some((a) => a.authorProfileId === user.authorProfile?.authorProfileId))
  );

  const copyTxToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 2000);
  };

  return (
    <div className="book-detail-root">
      {/* Breadcrumbs */}
      <div className="archival-border-bottom">
        <div className="container py-4 flex items-center gap-2 text-sm text-muted mono">
          <Link to="/discover" className="hover:underline">
            {t('book.library')}
          </Link>
          <ChevronRight size={14} />
          <span className="uppercase">{book.languageCode || 'VI'}</span>
          <ChevronRight size={14} />
          <span className="text-ink truncate">{book.title}</span>
        </div>
      </div>

      <div className="container py-12">
        <div className="book-detail-grid">
          {/* Left Column: Visual & Action */}
          <div className="book-detail-visual">
            <div className="book-detail-cover archival-border flex items-center justify-center mb-6">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <>
                  <div className="book-detail-spine"></div>
                  <h2 className="serif text-center px-6 text-2xl">{book.title}</h2>
                </>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {hasFile ? (
                <>
                  <button
                    className="btn btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
                    onClick={() => setIsReading(true)}
                  >
                    <BookOpen size={20} /> {t('book.readWork')}
                  </button>

                  <button
                    className="btn btn-secondary w-full flex items-center justify-center gap-2"
                    onClick={handleDownload}
                  >
                    <Download size={18} /> {t('book.downloadPdf')}
                  </button>
                  {downloadError && (
                    <div className="text-xs text-warning p-2 archival-border bg-ground">
                      {downloadError}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 archival-border text-center text-sm text-muted bg-ground">
                  No manuscript file uploaded yet.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Info & Record */}
          <div className="book-detail-info">
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-2">
                <span className="badge badge-success font-mono text-xs uppercase">
                  {book.publicationStatus}
                </span>
                {selectedFile && (
                  <span className="font-mono text-xs text-muted">
                    Version {selectedFile.versionNumber} ({selectedFile.accessLevel})
                  </span>
                )}
              </div>

              <h1 className="serif text-4xl mb-4 leading-tight">{book.title}</h1>

              <div className="flex flex-wrap items-center gap-4 mb-6">
                <span className="text-xl font-medium">{allAuthorsText}</span>
                <span className="text-muted">•</span>
                <span className="text-muted font-mono">{publishedYear}</span>
                <span className="text-muted">•</span>
                <span className="tag-category text-sm font-mono uppercase">
                  {book.languageCode || 'VI'}
                </span>
              </div>

              {/* Multi-author detailed breakdown */}
              {book.authors.length > 1 && (
                <div className="mb-6 p-4 archival-border bg-ground text-xs font-mono">
                  <span className="text-muted block mb-2 font-bold uppercase">Contributors:</span>
                  <div className="flex flex-col gap-1">
                    {book.authors.map((author) => (
                      <div key={author.authorProfileId} className="flex justify-between items-center">
                        <span>{author.penName}</span>
                        <span className="text-muted">[{author.contributionRole}]</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="prose text-base text-muted max-w-3xl leading-relaxed">
                <p>{book.description || 'No detailed synopsis provided.'}</p>
              </div>
            </div>

            {/* Version switcher if multiple versions exist */}
            {files.length > 1 && (
              <div className="mb-6 p-4 archival-border bg-surface">
                <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                  <History size={16} /> Version History ({files.length} versions)
                </div>
                <div className="flex flex-wrap gap-2">
                  {files.map((f) => (
                    <button
                      key={f.bookFileId}
                      className={`version-pill font-mono ${
                        selectedFile?.bookFileId === f.bookFileId ? 'active' : ''
                      }`}
                      onClick={() => {
                        setSelectedFile(f);
                        setVerifyResult(null);
                        setDownloadError(null);
                      }}
                    >
                      v{f.versionNumber} {f.isCurrent ? '(Current)' : ''} — {f.accessLevel}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Copyright & Real SHA-256 Fingerprint Panel */}
            <div className="copyright-record-panel archival-border">
              <div className="record-header p-6 archival-border-bottom flex justify-between items-center bg-ground">
                <h3 className="serif font-medium text-xl flex items-center gap-3">
                  <Shield className="text-success" />
                  {t('book.verifiedRecord')}
                </h3>
                <span className="badge badge-success mono text-xs">REGISTRY VERIFIED</span>
              </div>

              <div className="record-body p-6">
                <div className="record-grid">
                  <div className="record-field">
                    <span className="field-label flex items-center gap-1">
                      <Hash size={14} /> BOOK ID
                    </span>
                    <span className="field-value mono truncate" title={book.bookId}>
                      {book.bookId}
                    </span>
                  </div>

                  <div className="record-field">
                    <span className="field-label flex items-center gap-1">
                      <User size={14} /> PRIMARY AUTHOR
                    </span>
                    <span className="field-value">{primaryAuthor?.penName || 'Anonymous'}</span>
                  </div>

                  <div className="record-field">
                    <span className="field-label flex items-center gap-1">
                      <Calendar size={14} /> PUBLICATION DATE
                    </span>
                    <span className="field-value">
                      {book.publishedAt ? new Date(book.publishedAt).toLocaleDateString() : 'Draft'}
                    </span>
                  </div>

                  <div className="record-field">
                    <span className="field-label flex items-center gap-1">
                      <FileText size={14} /> ACTIVE FILE VERSION
                    </span>
                    <span className="field-value mono">
                      {selectedFile ? `v${selectedFile.versionNumber} (${selectedFile.accessLevel})` : 'N/A'}
                    </span>
                  </div>

                  {selectedFile && (
                    <div className="record-field full-width mt-2">
                      <span className="field-label flex items-center gap-1">
                        <Hash size={14} /> SHA-256 DIGITAL FINGERPRINT (AUTHENTIC FILE HASH)
                      </span>
                      <div className="field-value mono break-all text-xs p-3 archival-border bg-ground mt-1">
                        {selectedFile.sha256}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted font-mono">
                          Size: {(selectedFile.sizeBytes / 1024).toFixed(1)} KB | {selectedFile.originalFileName}
                        </span>
                        <button
                          className="btn btn-secondary text-xs py-1 px-3"
                          onClick={handleVerifyIntegrity}
                          disabled={verifying}
                        >
                          {verifying ? 'Verifying...' : 'Verify SHA-256 On Disk'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Real-time verification result box */}
                  {verifyResult && (
                    <div
                      className={`record-field full-width p-4 mt-2 archival-border ${
                        verifyResult.status === 'MATCH' ? 'bg-success-subtle' : 'bg-warning-subtle'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm mb-1">
                        {verifyResult.status === 'MATCH' ? (
                          <>
                            <CheckCircle2 size={16} className="text-success" />
                            <span className="text-success">INTEGRITY VERIFIED: 100% BYTE MATCH</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={16} className="text-warning" />
                            <span className="text-warning">INTEGRITY WARNING: {verifyResult.status}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted mb-2">{verifyResult.details}</p>
                      {verifyResult.actualSha256 && (
                        <div className="text-[11px] font-mono">
                          <div>Recorded: {verifyResult.recordedSha256}</div>
                          <div>Actual: &nbsp;&nbsp;{verifyResult.actualSha256}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Blockchain On-Chain Copyright Registry Card */}
            <div className="copyright-record-panel archival-border mt-6">
              <div className="record-header p-6 archival-border-bottom flex justify-between items-center bg-ground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-accent" />
                  <h3 className="serif font-medium text-xl">
                    {t('book.blockchainCopyright')}
                  </h3>
                </div>
                {currentRecord?.recordStatus === 'ON_CHAIN' ? (
                  <span className="badge badge-success mono text-xs">
                    ON_CHAIN (ACTIVE)
                  </span>
                ) : currentRecord?.recordStatus === 'DISPUTED' ? (
                  <span className="badge badge-warning mono text-xs font-bold text-amber-700 bg-amber-500/15 border border-amber-500/30">
                    DISPUTED (INVESTIGATION)
                  </span>
                ) : currentRecord?.recordStatus === 'WITHDRAWN' ? (
                  <span className="badge badge-accent mono text-xs font-bold text-red-700 bg-red-500/15 border border-red-500/30">
                    REVOKED (TERMINATED)
                  </span>
                ) : currentRecord?.recordStatus === 'QUEUED' ? (
                  <span className="badge badge-warning mono text-xs">
                    {t('book.statusQueued')}
                  </span>
                ) : (
                  <span className="badge badge-secondary mono text-xs">
                    {t('book.statusUnregistered')}
                  </span>
                )}
              </div>

              <div className="record-body p-6 space-y-4">
                {/* Active Dispute Alert Notice */}
                {currentRecord?.recordStatus === 'DISPUTED' && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                      <AlertTriangle size={15} />
                      <span>{t('dispute.warningTitle') || 'CẢNH BÁO: TÁC PHẨM ĐANG CÓ TRANH CHẤP BẢN QUYỀN'}</span>
                    </div>
                    <p className="text-muted leading-relaxed">
                      {t('dispute.warningDesc') ||
                        'Hồ sơ bản quyền của tác phẩm này đang trong diện điều tra do có khiếu nại về quyền sở hữu trí tuệ. Hội đồng quản trị đang thụ lý giải quyết.'}
                    </p>
                  </div>
                )}

                {/* Revoked Notice */}
                {currentRecord?.recordStatus === 'WITHDRAWN' && (
                  <div className="p-3.5 bg-accent/10 border border-accent/30 rounded text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-accent">
                      <AlertTriangle size={15} />
                      <span>{t('dispute.revokedTitle') || 'BẢN QUYỀN ĐÃ BỊ THU HỒI ON-CHAIN'}</span>
                    </div>
                    <p className="text-muted leading-relaxed">
                      {t('dispute.revokedDesc') ||
                        'Chứng nhận bản quyền của tác phẩm này đã bị vô hiệu hóa hoặc thu hồi do vi phạm bản quyền hoặc có phán quyết pháp lý hủy bỏ hiệu lực.'}
                    </p>
                  </div>
                )}

                {currentRecord?.recordStatus === 'ON_CHAIN' || currentRecord?.recordStatus === 'DISPUTED' || currentRecord?.recordStatus === 'WITHDRAWN' ? (
                  <div className="space-y-3 text-xs font-mono">
                    <div className="p-3 bg-ground archival-border space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted">RECORD NUMBER:</span>
                        <span className="font-bold text-accent">{currentRecord.recordNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">VERSION:</span>
                        <span>v{currentRecord.versionNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">STATUS:</span>
                        <span className="font-bold">{currentRecord.recordStatus}</span>
                      </div>
                      {currentRecord.transaction?.txHash && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted">TX HASH:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-foreground">
                              {shortenAddress(currentRecord.transaction.txHash, 6)}
                            </span>
                            <button
                              type="button"
                              className="btn-icon-copy p-1 text-muted hover:text-foreground"
                              onClick={() => copyTxToClipboard(currentRecord.transaction!.txHash!)}
                              title="Copy TxHash"
                            >
                              {copiedTx ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>
                      )}
                      {currentRecord.transaction?.blockNumber && (
                        <div className="flex justify-between">
                          <span className="text-muted">BLOCK NUMBER:</span>
                          <span className="font-bold">#{currentRecord.transaction.blockNumber}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted">SMART CONTRACT:</span>
                        <span className="text-muted">0x5FbDB...0aa3 (Hardhat Local)</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setIsReportModalOpen(true)}
                        className="text-xs text-muted hover:text-accent flex items-center gap-1.5 transition-colors"
                      >
                        <Flag size={13} />
                        <span>{t('report.reportInfringement') || 'Khiếu nại bản quyền'}</span>
                      </button>

                      {selectedFile && (
                        <Link
                          to={`/verify/${selectedFile.sha256}`}
                          className="btn btn-secondary text-xs flex items-center gap-1.5"
                        >
                          <ExternalLink size={12} /> {t('book.viewProof')}
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted leading-relaxed">
                      {selectedFile
                        ? `Phiên bản v${selectedFile.versionNumber} của tác phẩm này chưa được đăng ký trên sổ cái Smart Contract BookCopyrightRegistry.`
                        : t('book.notRegistered')}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      {isAuthor && selectedFile && (
                        <button
                          type="button"
                          className="btn btn-primary text-xs flex items-center gap-2"
                          onClick={() => setIsRegisterModalOpen(true)}
                        >
                          <ShieldCheck size={16} />
                          <Sparkles size={14} className="text-accent" />
                          {t('book.registerOnChain')}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsReportModalOpen(true)}
                        className="text-xs text-muted hover:text-accent flex items-center gap-1.5 ml-auto transition-colors"
                      >
                        <Flag size={13} />
                        <span>{t('report.reportInfringement') || 'Khiếu nại bản quyền'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report & Copyright Dispute Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        bookId={book.bookId}
        bookTitle={book.title}
        copyrightRecordId={currentRecord?.copyrightRecordId || null}
        contentHash={selectedFile?.sha256 || null}
      />

      {/* On-Chain Copyright Registration Modal */}
      {selectedFile && (
        <RegisterCopyrightModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          book={book}
          file={selectedFile}
          onRegisteredSuccess={reloadCopyright}
        />
      )}

      {/* Archival Reading Room Modal */}
      {isReading && selectedFile && (
        <div className="reader-modal-overlay" onClick={() => setIsReading(false)}>
          <div className="reader-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="reader-modal-header">
              <div className="flex items-center gap-3">
                <BookOpen size={18} />
                <span className="serif font-medium">{book.title}</span>
                <span className="font-mono text-xs text-muted">
                  [v{selectedFile.versionNumber} • Archival Reading Room]
                </span>
              </div>
              <button
                className="btn btn-secondary p-1.5 flex items-center justify-center"
                onClick={() => setIsReading(false)}
                title="Close Reading Room"
              >
                <X size={18} />
              </button>
            </div>

            <iframe
              src={booksApi.getReadUrl(book.bookId, selectedFile.bookFileId)}
              className="reader-frame"
              title={`Reading Room: ${book.title}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
