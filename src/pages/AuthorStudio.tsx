import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Feather,
  BookOpen,
  ShieldCheck,
  Plus,
  Upload,
  UserPlus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  Wallet,
  Search,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';
import { useWallet } from '../contexts/WalletContext';
import {
  booksApi,
  copyrightApi,
  type ApiBook,
  type ApiBookFile,
  type VerifyIntegrityResult,
} from '../services/api';
import { RegisterCopyrightModal } from '../components/copyright/RegisterCopyrightModal';
import { shortenAddress } from '../utils/blockchain';
import './AuthorStudio.css';

type StudioTab = 'WORKS' | 'COPYRIGHT' | 'REPORTS';

export function AuthorStudio() {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const { account, isConnected, connectWallet } = useWallet();

  const [activeTab, setActiveTab] = useState<StudioTab>('WORKS');

  // Author works state
  const [myBooks, setMyBooks] = useState<ApiBook[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [worksMsg, setWorksMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [showCreateBookModal, setShowCreateBookModal] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookDesc, setNewBookDesc] = useState('');
  const [newBookCover, setNewBookCover] = useState('');
  const [newBookLang, setNewBookLang] = useState('vi');
  const [newBookStatus, setNewBookStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [creatingBook, setCreatingBook] = useState(false);

  // Upload modal state
  const [uploadBookTarget, setUploadBookTarget] = useState<ApiBook | null>(null);
  const [uploadFileObj, setUploadFileObj] = useState<File | null>(null);
  const [uploadAccessLevel, setUploadAccessLevel] = useState<'PUBLIC_READ' | 'PUBLIC_DOWNLOAD' | 'PRIVATE'>('PUBLIC_READ');
  const [uploadStorageProvider, setUploadStorageProvider] = useState<'LOCAL' | 'IPFS'>('LOCAL');
  const [uploadingFile, setUploadingFile] = useState(false);

  // Add co-author modal state
  const [coAuthorTarget, setCoAuthorTarget] = useState<ApiBook | null>(null);
  const [coAuthorProfileId, setCoAuthorProfileId] = useState('');
  const [coAuthorRole, setCoAuthorRole] = useState<'CO_AUTHOR' | 'EDITOR' | 'TRANSLATOR'>('CO_AUTHOR');
  const [addingCoAuthor, setAddingCoAuthor] = useState(false);

  // Copyright modal state
  const [copyrightTarget, setCopyrightTarget] = useState<{ book: ApiBook; file: ApiBookFile } | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<string | null>(null);

  // Verification integrity state
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyResults, setVerifyResults] = useState<Record<string, VerifyIntegrityResult>>({});

  const isVerifiedAuthor = user?.authorProfile?.verificationStatus === 'VERIFIED';
  const isPendingAuthor = user?.authorProfile?.verificationStatus === 'PENDING';
  const isRejectedAuthor = user?.authorProfile?.verificationStatus === 'REJECTED';
  const hasNoProfile = !user?.authorProfile;

  const loadMyBooks = async () => {
    if (!user || (!isVerifiedAuthor && !user.roles?.includes('ADMIN'))) return;
    try {
      setBooksLoading(true);
      const books = await booksApi.getMyBooks();
      setMyBooks(books);
    } catch (err: any) {
      setWorksMsg({ type: 'error', text: err.message || 'Failed to load works.' });
    } finally {
      setBooksLoading(false);
    }
  };

  useEffect(() => {
    loadMyBooks();
  }, [user]);

  // Handle Create Book
  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim()) {
      setWorksMsg({ type: 'error', text: 'Title is required.' });
      return;
    }

    try {
      setCreatingBook(true);
      setWorksMsg(null);
      await booksApi.createBook({
        title: newBookTitle.trim(),
        description: newBookDesc.trim() || null,
        coverUrl: newBookCover.trim() || null,
        languageCode: newBookLang,
        publicationStatus: newBookStatus,
      });

      setShowCreateBookModal(false);
      setNewBookTitle('');
      setNewBookDesc('');
      setNewBookCover('');
      setWorksMsg({ type: 'success', text: 'Work created successfully.' });
      await loadMyBooks();
    } catch (err: any) {
      setWorksMsg({ type: 'error', text: err.message || 'Failed to create work.' });
    } finally {
      setCreatingBook(false);
    }
  };

  // Handle Upload Version
  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadBookTarget || !uploadFileObj) return;

    try {
      setUploadingFile(true);
      setWorksMsg(null);
      await booksApi.uploadFile(uploadBookTarget.bookId, uploadFileObj, {
        accessLevel: uploadAccessLevel,
        storageProvider: uploadStorageProvider,
      });
      setUploadBookTarget(null);
      setUploadFileObj(null);
      setWorksMsg({ type: 'success', text: 'File version uploaded successfully.' });
      await loadMyBooks();
    } catch (err: any) {
      setWorksMsg({ type: 'error', text: err.message || 'Failed to upload file.' });
    } finally {
      setUploadingFile(false);
    }
  };

  // Handle Add Co-Author
  const handleAddCoAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coAuthorTarget || !coAuthorProfileId.trim()) return;

    try {
      setAddingCoAuthor(true);
      setWorksMsg(null);
      await booksApi.addCoAuthor(coAuthorTarget.bookId, {
        authorProfileId: coAuthorProfileId.trim(),
        contributionRole: coAuthorRole,
      });
      setCoAuthorTarget(null);
      setCoAuthorProfileId('');
      setWorksMsg({ type: 'success', text: 'Co-author added successfully.' });
      await loadMyBooks();
    } catch (err: any) {
      setWorksMsg({ type: 'error', text: err.message || 'Failed to add co-author.' });
    } finally {
      setAddingCoAuthor(false);
    }
  };

  // Handle Status Toggle
  const handleToggleStatus = async (book: ApiBook) => {
    const nextStatus = book.publicationStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      setWorksMsg(null);
      await booksApi.updateStatus(book.bookId, nextStatus);
      setWorksMsg({
        type: 'success',
        text: `Work updated to ${nextStatus}.`,
      });
      await loadMyBooks();
    } catch (err: any) {
      setWorksMsg({ type: 'error', text: err.message || 'Failed to update publication status.' });
    }
  };

  // Handle Reconcile
  const handleReconcile = async () => {
    try {
      setReconciling(true);
      setReconcileResult(null);
      const res = await copyrightApi.reconcile();
      setReconcileResult(`Đối soát hoàn tất: Đã quét ${res.scannedCount} giao dịch, đối soát ${res.reconciledCount} bản ghi.`);
      await loadMyBooks();
    } catch (err: any) {
      setReconcileResult(`Lỗi đối soát: ${err.message}`);
    } finally {
      setReconciling(false);
    }
  };

  // Handle Verify Integrity
  const handleVerifyIntegrity = async (bookId: string, fileId: string) => {
    try {
      setVerifyingId(fileId);
      const res = await booksApi.verifyFileIntegrity(bookId, fileId);
      setVerifyResults((prev) => ({ ...prev, [fileId]: res }));
    } catch (err: any) {
      setWorksMsg({ type: 'error', text: err.message || 'Verification error' });
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredBooks = myBooks.filter((book) => {
    if (statusFilter !== 'ALL' && book.publicationStatus !== statusFilter) return false;
    if (searchFilter.trim()) {
      return book.title.toLowerCase().includes(searchFilter.toLowerCase());
    }
    return true;
  });

  if (authLoading) {
    return (
      <div className="container py-24 text-center">
        <div className="spinner mx-auto mb-3"></div>
        <div className="font-mono text-xs text-muted">Đang tải không gian tác giả...</div>
      </div>
    );
  }

  return (
    <div className="author-studio-root">
      {/* Studio Header */}
      <section className="studio-hero py-10 archival-border-bottom bg-ground">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="serif text-3xl md:text-4xl font-bold text-ink mb-2">
                {t('authorStudio.title') || 'Không gian Tác giả'}
              </h1>
              <p className="text-muted text-sm max-w-xl">
                {t('authorStudio.subtitle') || 'Quản lý tác phẩm, phiên bản và chứng thư bản quyền số trên hệ thống BookChain Library.'}
              </p>
            </div>

            {/* Author Status Badge & Wallet */}
            <div className="flex flex-wrap items-center gap-3">
              {user?.authorProfile && (
                <div className="status-chip px-3 py-1.5 archival-border rounded-sm bg-surface flex items-center gap-2 text-xs font-mono">
                  <span className="text-muted font-sans">{t('profile.penName')}:</span>
                  <strong className="text-ink">{user.authorProfile.penName}</strong>
                  {isVerifiedAuthor ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold ml-1">
                      <CheckCircle2 size={14} /> VERIFIED
                    </span>
                  ) : isPendingAuthor ? (
                    <span className="inline-flex items-center gap-1 text-amber-700 font-bold ml-1">
                      <Clock size={14} /> PENDING
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-700 font-bold ml-1">
                      <Ban size={14} /> REJECTED
                    </span>
                  )}
                </div>
              )}

              {/* Wallet Status */}
              <div className="wallet-chip px-3 py-1.5 archival-border rounded-sm bg-surface flex items-center gap-2 text-xs font-mono">
                <Wallet size={14} className="text-interactive" />
                {isConnected && account ? (
                  <span className="text-ink font-semibold">{shortenAddress(account)}</span>
                ) : (
                  <button onClick={connectWallet} className="text-interactive hover:underline">
                    {t('wallet.connect') || 'Kết nối ví'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Author Status Alert Banner if PENDING or REJECTED */}
      {isPendingAuthor && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/40 py-3.5 px-4 text-xs">
          <div className="container max-w-6xl mx-auto flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
            <Clock size={16} className="shrink-0 text-amber-600" />
            <span>
              {t('authorStudio.pendingNotice') ||
                'Hồ sơ đăng ký bút danh của bạn đang được Quản trị viên xem xét. Bạn sẽ có quyền tạo tác phẩm mới và phát hành sách ngay sau khi được phê duyệt.'}
            </span>
          </div>
        </div>
      )}

      {isRejectedAuthor && (
        <div className="bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-800/40 py-3.5 px-4 text-xs">
          <div className="container max-w-6xl mx-auto flex items-center justify-between gap-4 text-red-900 dark:text-red-200">
            <div className="flex items-center gap-2.5">
              <Ban size={16} className="shrink-0 text-red-600" />
              <span>
                <strong>Hồ sơ bút danh bị từ chối:</strong>{' '}
                {user?.authorProfile?.verificationNote || 'Vui lòng chỉnh sửa lại thông tin bút danh hợp lệ để được xem xét.'}
              </span>
            </div>
            <Link to="/profile" className="btn btn-secondary btn-xs shrink-0">
              {t('authorStudio.editProfileToResubmit') || 'Chỉnh sửa & Nộp lại'}
            </Link>
          </div>
        </div>
      )}

      {hasNoProfile && (
        <div className="bg-sky-50 dark:bg-sky-950/30 border-b border-sky-200 dark:border-sky-800/40 py-4 px-4 text-xs">
          <div className="container max-w-6xl mx-auto flex items-center justify-between gap-4 text-sky-900 dark:text-sky-200">
            <div className="flex items-center gap-2.5">
              <Feather size={16} className="shrink-0 text-sky-600" />
              <span>
                {t('authorStudio.noProfileNotice') ||
                  'Bạn chưa đăng ký bút danh tác giả. Vui lòng đăng ký bút danh hoặc đổi mã mời tại trang cá nhân để mở khóa các tính năng tác giả.'}
              </span>
            </div>
            <Link to="/profile" className="btn btn-primary btn-sm shrink-0">
              {t('authorStudio.registerPenNameAction') || 'Đăng ký Bút danh'}
            </Link>
          </div>
        </div>
      )}

      {/* Studio Navigation Tabs */}
      <div className="studio-tabs-bar archival-border-bottom bg-surface">
        <div className="container max-w-6xl mx-auto flex items-center gap-2">
          <button
            className={`studio-tab-btn ${activeTab === 'WORKS' ? 'active' : ''}`}
            onClick={() => setActiveTab('WORKS')}
          >
            <BookOpen size={16} />
            <span>{t('authorStudio.tabWorks') || 'Tác phẩm của tôi'}</span>
            <span className="font-mono text-xs opacity-70">({myBooks.length})</span>
          </button>

          <button
            className={`studio-tab-btn ${activeTab === 'COPYRIGHT' ? 'active' : ''}`}
            onClick={() => setActiveTab('COPYRIGHT')}
          >
            <ShieldCheck size={16} />
            <span>{t('authorStudio.tabCopyright') || 'Sổ cái Bản quyền'}</span>
          </button>

          <button
            className={`studio-tab-btn ${activeTab === 'REPORTS' ? 'active' : ''}`}
            onClick={() => setActiveTab('REPORTS')}
          >
            <AlertTriangle size={16} />
            <span>{t('authorStudio.tabDisputes') || 'Khiếu nại & Tranh chấp'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="container max-w-6xl mx-auto py-8">
        {worksMsg && (
          <div
            className={`p-4 mb-6 rounded-sm text-xs flex items-center justify-between ${
              worksMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <span>{worksMsg.text}</span>
            <button onClick={() => setWorksMsg(null)} className="text-muted hover:text-ink">
              ✕
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: MY WORKS */}
        {/* ========================================================================= */}
        {activeTab === 'WORKS' && (
          <div>
            <div className="studio-filter-toolbar">
              {/* Search */}
              <div className="studio-search-wrapper">
                <Search size={14} className="studio-search-icon" />
                <input
                  type="text"
                  placeholder="Tìm theo tựa sách..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="studio-search-input"
                />
              </div>

              {/* Status Filter Pills & Create Action */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="pills-group">
                  {['ALL', 'DRAFT', 'PUBLISHED'].map((st) => (
                    <button
                      key={st}
                      className={`pill-btn ${statusFilter === st ? 'active' : ''}`}
                      onClick={() => setStatusFilter(st)}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    if (!isVerifiedAuthor && !user?.roles?.includes('ADMIN')) {
                      setWorksMsg({
                        type: 'error',
                        text: 'Bạn cần được Quản trị viên phê duyệt bút danh trước khi đăng tác phẩm.',
                      });
                      return;
                    }
                    setShowCreateBookModal(true);
                  }}
                >
                  <Plus size={15} />
                  <span>{t('profile.newBook') || 'Tạo tác phẩm mới'}</span>
                </button>
              </div>
            </div>

            {/* Books List */}
            {booksLoading ? (
              <div className="text-center py-16 text-muted font-mono text-xs">
                <span>Đang tải danh sách tác phẩm...</span>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="archival-border bg-surface p-12 text-center rounded-sm max-w-xl mx-auto">
                <BookOpen size={36} className="mx-auto mb-3 text-muted" />
                <h3 className="serif text-lg font-bold text-ink mb-2">Chưa có tác phẩm nào</h3>
                <p className="text-xs text-muted mb-6">
                  {searchFilter
                    ? 'Không tìm thấy tác phẩm phù hợp với từ khóa.'
                    : 'Bắt đầu đăng tải tác phẩm đầu tay của bạn để xác thực bản quyền số.'}
                </p>
                {isVerifiedAuthor && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowCreateBookModal(true)}
                  >
                    <Plus size={15} />
                    <span>Tạo tác phẩm mới</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredBooks.map((book) => (
                  <div
                    key={book.bookId}
                    className="book-item-card"
                  >
                    <div className="flex gap-4">
                      {/* Cover */}
                      <div className="w-20 h-28 bg-ground archival-border rounded-sm shrink-0 flex items-center justify-center overflow-hidden">
                        {book.coverUrl ? (
                          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen size={24} className="text-muted" />
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className={`badge ${
                              book.publicationStatus === 'PUBLISHED'
                                ? 'badge-success'
                                : 'badge-warning'
                            }`}
                          >
                            {book.publicationStatus}
                          </span>
                          <span className="text-xs text-muted font-mono">{book.languageCode?.toUpperCase() || 'VI'}</span>
                        </div>

                        <h3 className="serif text-lg font-bold text-ink mb-1">
                          <Link to={`/book/${book.bookId}`} className="hover:underline">
                            {book.title}
                          </Link>
                        </h3>

                        <p className="text-xs text-muted max-w-xl line-clamp-2 mb-3">
                          {book.description || 'Không có mô tả tóm tắt.'}
                        </p>

                        {/* Co-authors */}
                        <div className="text-xs text-muted font-mono flex items-center gap-2 flex-wrap">
                          <span>Tác giả: {book.authors?.map((a) => a.penName).join(', ') || 'Chính bạn'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Book Actions */}
                    <div className="book-card-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setUploadBookTarget(book)}
                      >
                        <Upload size={14} />
                        <span>Tải tệp / Phiên bản</span>
                      </button>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setCoAuthorTarget(book)}
                      >
                        <UserPlus size={14} />
                        <span>Thêm đồng tác giả</span>
                      </button>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleToggleStatus(book)}
                      >
                        <span>{book.publicationStatus === 'PUBLISHED' ? 'Chuyển về Bản nháp' : 'Xuất bản tác phẩm'}</span>
                      </button>

                      <Link
                        to={`/book/${book.bookId}`}
                        className="btn btn-subtle btn-sm"
                      >
                        <span>Xem trang đọc sách →</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: COPYRIGHT REGISTRY */}
        {/* ========================================================================= */}
        {activeTab === 'COPYRIGHT' && (
          <div>
            <div className="flex items-center justify-between gap-4 mb-6 bg-ground p-4 archival-border rounded-sm">
              <div>
                <h3 className="serif font-bold text-sm text-ink mb-1">
                  Đăng ký &amp; Quản trị Bản quyền Blockchain
                </h3>
                <p className="text-xs text-muted max-w-2xl">
                  Mỗi tệp tài liệu được băm mật mã SHA-256 từ chuỗi byte nhị phân thực tế, tạo thành vân tay số duy nhất được ghi bất biến vào Smart Contract trên mạng Sepolia / Hardhat.
                </p>
              </div>

              <button
                className="btn btn-secondary text-xs py-2 px-3 inline-flex items-center gap-2 shrink-0"
                onClick={handleReconcile}
                disabled={reconciling}
              >
                <RefreshCw size={14} className={reconciling ? 'animate-spin' : ''} />
                <span>{reconciling ? 'Đang đối soát...' : 'Đối soát giao dịch'}</span>
              </button>
            </div>

            {reconcileResult && (
              <div className="p-3 mb-6 bg-surface archival-border rounded-sm text-xs font-mono text-ink">
                {reconcileResult}
              </div>
            )}

            {/* List all versions and files for copyright */}
            <div className="space-y-6">
              {myBooks.map((book) => (
                <div key={book.bookId} className="archival-border bg-surface p-6 rounded-sm">
                  <div className="flex items-center justify-between border-b pb-3 mb-4">
                    <div>
                      <h4 className="serif font-bold text-base text-ink">{book.title}</h4>
                      <span className="text-xs text-muted font-mono">Book ID: {book.bookId}</span>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-sm font-semibold uppercase ${
                        book.publicationStatus === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {book.publicationStatus}
                    </span>
                  </div>

                  {book.currentFile ? (
                    <div className="p-4 bg-ground archival-border rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-semibold px-1.5 py-0.5 bg-surface archival-border rounded-sm">
                            Phiên bản v{book.currentFile.versionNumber}
                          </span>
                          <span className="text-muted font-mono">{book.currentFile.originalFileName}</span>
                          <span className="text-[10px] text-muted font-mono uppercase">({book.currentFile.accessLevel})</span>
                        </div>

                        {/* SHA-256 */}
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span className="text-muted">SHA-256:</span>
                          <span className="truncate max-w-xs md:max-w-md text-ink bg-surface px-2 py-0.5 rounded-sm archival-border select-all">
                            {book.currentFile.sha256}
                          </span>
                        </div>
                      </div>

                      {/* Copyright Action */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          className="btn btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
                          onClick={() => handleVerifyIntegrity(book.bookId, book.currentFile!.bookFileId)}
                          disabled={verifyingId === book.currentFile.bookFileId}
                        >
                          <FileCheck size={14} />
                          <span>{verifyingId === book.currentFile.bookFileId ? 'Đang kiểm tra...' : 'Kiểm tra Hash'}</span>
                        </button>

                        <button
                          className="btn btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
                          onClick={() => setCopyrightTarget({ book, file: book.currentFile! })}
                        >
                          <ShieldCheck size={14} />
                          <span>Đăng ký Bản quyền</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-ground archival-border rounded-sm text-center text-xs text-muted">
                      Chưa có tệp tài liệu nào được tải lên cho tác phẩm này.{' '}
                      <button
                        onClick={() => setUploadBookTarget(book)}
                        className="text-interactive hover:underline ml-1 font-medium"
                      >
                        Tải tệp ngay
                      </button>
                    </div>
                  )}

                  {/* Verification result preview if checked */}
                  {book.currentFile && verifyResults[book.currentFile.bookFileId] && (
                    <div className="mt-3 p-3 text-xs font-mono bg-surface archival-border rounded-sm">
                      {verifyResults[book.currentFile.bookFileId].matches ? (
                        <div className="flex items-center gap-2 text-emerald-700">
                          <CheckCircle2 size={14} />
                          <span>Toàn vẹn tệp lưu trữ tuyệt đối: Mã băm SHA-256 khớp 100% với dữ liệu lưu trên đĩa.</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-700">
                          <AlertTriangle size={14} />
                          <span>Cảnh báo: Tệp tin không khớp mã băm SHA-256 hoặc không tìm thấy trên máy chủ lưu trữ.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DISPUTES & REPORTS */}
        {/* ========================================================================= */}
        {activeTab === 'REPORTS' && (
          <div className="archival-border bg-surface p-8 rounded-sm">
            <h3 className="serif text-lg font-bold text-ink mb-2">Báo cáo &amp; Tranh chấp Tác quyền</h3>
            <p className="text-xs text-muted mb-6 max-w-2xl leading-relaxed">
              Theo dõi và giải trình các khiếu nại về quyền sở hữu trí tuệ, tác phẩm phái sinh hoặc nội dung không hợp lệ được độc giả gửi tới Quản trị viên.
            </p>

            <div className="p-8 text-center bg-ground archival-border rounded-sm max-w-md mx-auto">
              <ShieldCheck size={36} className="mx-auto mb-3 text-emerald-600" />
              <h4 className="serif font-bold text-sm text-ink mb-1">Không có tranh chấp đang mở</h4>
              <p className="text-xs text-muted leading-relaxed">
                Tất cả các tác phẩm của bạn hiện đều tuân thủ đầy đủ tiêu chuẩn bản quyền số và không ghi nhận báo cáo vi phạm nào.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CREATE BOOK */}
      {/* ========================================================================= */}
      {showCreateBookModal && (
        <div className="studio-modal-overlay" onClick={() => setShowCreateBookModal(false)}>
          <div className="studio-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="studio-modal-header">
              <h3 className="serif text-lg font-bold text-ink">
                {t('profile.newBook') || 'Tạo tác phẩm mới'}
              </h3>
              <button
                type="button"
                className="btn btn-subtle btn-xs"
                onClick={() => setShowCreateBookModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBook} className="studio-modal-body">
              <div className="studio-form-group">
                <label className="studio-form-label">
                  Tựa đề tác phẩm <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  placeholder="Ví dụ: Lược khảo Lịch sử Văn hóa..."
                  className="studio-form-control"
                />
              </div>

              <div className="studio-form-group">
                <label className="studio-form-label">Mô tả / Tóm tắt nội dung</label>
                <textarea
                  rows={4}
                  value={newBookDesc}
                  onChange={(e) => setNewBookDesc(e.target.value)}
                  placeholder="Tóm tắt công trình nghiên cứu, cấu trúc tác phẩm..."
                  className="studio-form-control"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 studio-form-group">
                <div>
                  <label className="studio-form-label">Ngôn ngữ chính</label>
                  <select
                    value={newBookLang}
                    onChange={(e) => setNewBookLang(e.target.value)}
                    className="studio-form-control"
                  >
                    <option value="vi">Tiếng Việt (vi)</option>
                    <option value="en">English (en)</option>
                    <option value="fr">Français (fr)</option>
                  </select>
                </div>

                <div>
                  <label className="studio-form-label">Trạng thái phát hành</label>
                  <select
                    value={newBookStatus}
                    onChange={(e) => setNewBookStatus(e.target.value as any)}
                    className="studio-form-control"
                  >
                    <option value="DRAFT">Bản nháp (DRAFT)</option>
                    <option value="PUBLISHED">Xuất bản (PUBLISHED)</option>
                  </select>
                </div>
              </div>

              <div className="studio-form-group">
                <label className="studio-form-label">URL Ảnh bìa (Tùy chọn)</label>
                <input
                  type="url"
                  value={newBookCover}
                  onChange={(e) => setNewBookCover(e.target.value)}
                  placeholder="https://example.com/cover.jpg"
                  className="studio-form-control"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowCreateBookModal(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={creatingBook}
                  className="btn btn-primary btn-sm"
                >
                  {creatingBook ? 'Đang tạo...' : 'Tạo tác phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UPLOAD FILE */}
      {/* ========================================================================= */}
      {uploadBookTarget && (
        <div className="studio-modal-overlay" onClick={() => setUploadBookTarget(null)}>
          <div className="studio-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="studio-modal-header">
              <div>
                <h3 className="serif text-base font-bold text-ink">Tải tệp &amp; Tạo phiên bản mới</h3>
                <p className="text-xs text-muted truncate max-w-sm">{uploadBookTarget.title}</p>
              </div>
              <button
                type="button"
                className="btn btn-subtle btn-xs"
                onClick={() => setUploadBookTarget(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadFile} className="studio-modal-body">
              <div className="studio-form-group">
                <label className="studio-form-label">
                  Chọn tệp tài liệu (PDF, EPUB, TXT) <span className="text-accent">*</span>
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.epub,.txt"
                  onChange={(e) => setUploadFileObj(e.target.files?.[0] || null)}
                  className="studio-form-control"
                />
              </div>

              <div className="studio-form-group">
                <label className="studio-form-label">Quyền truy cập tài liệu</label>
                <select
                  value={uploadAccessLevel}
                  onChange={(e) => setUploadAccessLevel(e.target.value as any)}
                  className="studio-form-control"
                >
                  <option value="PUBLIC_READ">Chỉ đọc trực tuyến (PUBLIC_READ)</option>
                  <option value="PUBLIC_DOWNLOAD">Cho phép tải tệp gốc (PUBLIC_DOWNLOAD)</option>
                  <option value="PRIVATE">Bảo mật riêng tư (PRIVATE)</option>
                </select>
              </div>

              <div className="studio-form-group">
                <label className="studio-form-label">Động cơ lưu trữ</label>
                <select
                  value={uploadStorageProvider}
                  onChange={(e) => setUploadStorageProvider(e.target.value as any)}
                  className="studio-form-control"
                >
                  <option value="LOCAL">Kho lưu trữ Cục bộ (Local Vault)</option>
                  <option value="IPFS">Mạng lưu trữ Phi tập trung IPFS (CIDv0)</option>
                </select>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setUploadBookTarget(null)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={uploadingFile || !uploadFileObj}
                  className="btn btn-primary btn-sm"
                >
                  {uploadingFile ? 'Đang tải lên...' : 'Tải lên & Băm SHA-256'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD CO-AUTHOR */}
      {/* ========================================================================= */}
      {coAuthorTarget && (
        <div className="studio-modal-overlay" onClick={() => setCoAuthorTarget(null)}>
          <div className="studio-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="studio-modal-header">
              <div>
                <h3 className="serif text-base font-bold text-ink">Thêm đồng tác giả</h3>
                <p className="text-xs text-muted truncate max-w-sm">{coAuthorTarget.title}</p>
              </div>
              <button
                type="button"
                className="btn btn-subtle btn-xs"
                onClick={() => setCoAuthorTarget(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCoAuthor} className="studio-modal-body">
              <div className="studio-form-group">
                <label className="studio-form-label">
                  Author Profile ID của đồng tác giả <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Mã định danh GUID (Ví dụ: 4D325142-...)"
                  value={coAuthorProfileId}
                  onChange={(e) => setCoAuthorProfileId(e.target.value)}
                  className="studio-form-control font-mono text-xs"
                />
              </div>

              <div className="studio-form-group">
                <label className="studio-form-label">Vai trò đóng góp</label>
                <select
                  value={coAuthorRole}
                  onChange={(e) => setCoAuthorRole(e.target.value as any)}
                  className="studio-form-control"
                >
                  <option value="CO_AUTHOR">Đồng tác giả (CO_AUTHOR)</option>
                  <option value="EDITOR">Chủ biên / Hiệu đính (EDITOR)</option>
                  <option value="TRANSLATOR">Dịch giả (TRANSLATOR)</option>
                </select>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCoAuthorTarget(null)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={addingCoAuthor}
                  className="btn btn-primary btn-sm"
                >
                  {addingCoAuthor ? 'Đang thêm...' : 'Xác nhận thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTER COPYRIGHT */}
      {/* ========================================================================= */}
      {copyrightTarget && (
        <RegisterCopyrightModal
          isOpen={Boolean(copyrightTarget)}
          onClose={() => setCopyrightTarget(null)}
          book={copyrightTarget.book}
          file={copyrightTarget.file}
          onRegisteredSuccess={() => {
            setCopyrightTarget(null);
            setWorksMsg({
              type: 'success',
              text: 'Đã hoàn tất quá trình ghi nhận bản quyền trên blockchain.',
            });
            loadMyBooks();
          }}
        />
      )}
    </div>
  );
}
