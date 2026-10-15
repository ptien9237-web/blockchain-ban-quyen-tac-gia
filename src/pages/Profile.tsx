import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Shield,
  Feather,
  LogOut,
  CheckCircle,
  AlertCircle,
  Clock,
  Save,
  Plus,
  Upload,
  UserPlus,
  BookOpen,
  X,
  RefreshCw,
  Key,
  Ban,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';
import { booksApi, invitationsApi, type ApiBook } from '../services/api';
import './Profile.css';

export function Profile() {
  const { user, logout, updateProfile, registerAsAuthor, refreshUser, isLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [penName, setPenName] = useState(user?.authorProfile?.penName || '');
  const [bio, setBio] = useState(user?.authorProfile?.bio || '');

  const [authorSectionTab, setAuthorSectionTab] = useState<'REGISTER' | 'INVITATION'>('REGISTER');

  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [authorMsg, setAuthorMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [authorSaving, setAuthorSaving] = useState(false);

  // Author invitation redemption state
  const [invitationCode, setInvitationCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Author works list
  const [myBooks, setMyBooks] = useState<ApiBook[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [worksMsg, setWorksMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
  const [uploadingFile, setUploadingFile] = useState(false);

  // Add co-author modal state
  const [coAuthorTarget, setCoAuthorTarget] = useState<ApiBook | null>(null);
  const [coAuthorProfileId, setCoAuthorProfileId] = useState('');
  const [coAuthorRole, setCoAuthorRole] = useState<'CO_AUTHOR' | 'EDITOR' | 'TRANSLATOR'>('CO_AUTHOR');
  const [addingCoAuthor, setAddingCoAuthor] = useState(false);

  // Sync state if user loads after mount
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setAvatarUrl(user.avatarUrl || '');
      if (user.authorProfile) {
        setPenName(user.authorProfile.penName);
        setBio(user.authorProfile.bio || '');
      }
    }
  }, [user]);

  const loadMyBooks = async () => {
    if (!user || (!user.roles.includes('AUTHOR') && !user.authorProfile)) return;
    try {
      setBooksLoading(true);
      const data = await booksApi.getMyBooks();
      setMyBooks(data);
    } catch {
      // Ignore if not author yet
    } finally {
      setBooksLoading(false);
    }
  };

  useEffect(() => {
    loadMyBooks();
  }, [user]);

  if (isLoading) {
    return (
      <div className="container py-24 text-center">
        <div className="font-mono text-muted text-sm">{t('auth.saving')}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-24 text-center">
        <h2 className="serif text-2xl mb-4">{t('auth.notLoggedIn' as any) || 'Please sign in'}</h2>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>
          {t('auth.signIn')}
        </button>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      setProfileSaving(true);
      await updateProfile({ displayName, avatarUrl: avatarUrl.trim() || null });
      setProfileMsg({ type: 'success', text: t('auth.updateSuccess') });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Update failed' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleRegisterAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthorMsg(null);
    try {
      setAuthorSaving(true);
      await registerAsAuthor({ penName, bio });
      setAuthorMsg({ type: 'success', text: t('auth.authorSuccess') });
      loadMyBooks();
    } catch (err: any) {
      setAuthorMsg({ type: 'error', text: err.message || 'Author registration failed' });
    } finally {
      setAuthorSaving(false);
    }
  };

  const handleRedeemInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitationCode.trim()) return;
    try {
      setRedeeming(true);
      setRedeemMsg(null);
      const res = await invitationsApi.redeem(invitationCode.trim());
      setRedeemMsg({ type: 'success', text: res.message || t('invitation.success') });
      setInvitationCode('');
      await refreshUser();
      loadMyBooks();
    } catch (err: any) {
      setRedeemMsg({ type: 'error', text: err.message || 'Mã mời không hợp lệ.' });
    } finally {
      setRedeeming(false);
    }
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setWorksMsg(null);
    try {
      setCreatingBook(true);
      await booksApi.createBook({
        title: newBookTitle,
        description: newBookDesc.trim() || null,
        coverUrl: newBookCover.trim() || null,
        languageCode: newBookLang,
        publicationStatus: newBookStatus,
      });
      setShowCreateBookModal(false);
      setNewBookTitle('');
      setNewBookDesc('');
      setNewBookCover('');
      setWorksMsg({ type: 'success', text: 'Tạo bản ghi tác phẩm mới thành công!' });
      loadMyBooks();
    } catch (err: any) {
      setWorksMsg({ type: 'error', text: err.message || 'Lỗi khi tạo tác phẩm' });
    } finally {
      setCreatingBook(false);
    }
  };

  const handleUploadVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadBookTarget || !uploadFileObj) return;

    try {
      setUploadingFile(true);
      setWorksMsg(null);
      await booksApi.uploadFile(uploadBookTarget.bookId, uploadFileObj, {
        accessLevel: uploadAccessLevel,
        isCurrent: true,
      });
      setUploadBookTarget(null);
      setUploadFileObj(null);
      setWorksMsg({ type: 'success', text: 'Tải lên phiên bản tệp thành công!' });
      loadMyBooks();
    } catch (err: any) {
      setWorksMsg({ type: 'error', text: err.message || 'Lỗi khi tải tệp' });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleToggleStatus = async (book: ApiBook) => {
    const nextStatus = book.publicationStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await booksApi.updateStatus(book.bookId, nextStatus);
      loadMyBooks();
    } catch (err: any) {
      setWorksMsg({ type: 'error', text: err.message || 'Không thể đổi trạng thái xuất bản' });
    }
  };

  const handleAddCoAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coAuthorTarget || !coAuthorProfileId.trim()) return;

    try {
      setAddingCoAuthor(true);
      await booksApi.addCoAuthor(coAuthorTarget.bookId, {
        authorProfileId: coAuthorProfileId.trim(),
        contributionRole: coAuthorRole,
      });
      setCoAuthorTarget(null);
      setCoAuthorProfileId('');
      setWorksMsg({ type: 'success', text: 'Thêm đồng tác giả thành công!' });
      loadMyBooks();
    } catch (err: any) {
      setWorksMsg({ type: 'error', text: err.message || 'Lỗi khi thêm đồng tác giả' });
    } finally {
      setAddingCoAuthor(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isAuthor = user.roles.includes('AUTHOR');
  const isAdmin = user.roles.includes('ADMIN');

  return (
    <div className="profile-page container py-12">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* User Header Card */}
        <div className="profile-header-card archival-border p-8 bg-surface flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="profile-avatar-circle flex items-center justify-center font-serif text-2xl">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} className="avatar-img" />
              ) : (
                user.displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="serif text-2xl">{user.displayName}</h1>
                <span className="status-badge font-mono text-xs px-2 py-0.5 rounded-sm">
                  {user.status}
                </span>
              </div>
              <p className="text-muted font-mono text-sm mb-3">{user.email}</p>

              <div className="role-tags flex flex-wrap items-center gap-2">
                {user.roles.map((role) => (
                  <span key={role} className={`role-tag font-mono text-xs px-2.5 py-1 ${role.toLowerCase()}`}>
                    {role === 'READER' && <Shield size={12} className="inline mr-1" />}
                    {role === 'AUTHOR' && <Feather size={12} className="inline mr-1" />}
                    {role === 'ADMIN' && <Key size={12} className="inline mr-1 text-purple-600" />}
                    {role === 'READER'
                      ? t('auth.roleReader')
                      : role === 'AUTHOR'
                      ? t('auth.roleAuthor')
                      : t('auth.roleAdmin')}
                  </span>
                ))}
                {isAuthor && (
                  <Link
                    to="/author/studio"
                    className="role-tag font-mono text-xs px-2.5 py-1 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1 hover:underline"
                  >
                    <Feather size={12} />
                    <span>Xưởng Tác Giả</span>
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="role-tag font-mono text-xs px-2.5 py-1 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1 hover:underline"
                  >
                    <Key size={12} />
                    <span>{t('admin.title')}</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-secondary flex items-center gap-2 text-sm text-muted hover:text-ink"
          >
            <LogOut size={16} />
            <span>{t('auth.signOut')}</span>
          </button>
        </div>

        {/* Two Column Layout for Profile details and Author credentials */}
        <div className="profile-grid grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* General Profile Section */}
          <div className="profile-card archival-border p-6 bg-surface flex flex-col justify-between">
            <div>
              <div className="card-header flex items-center gap-2 mb-6 pb-3 archival-border-bottom">
                <User size={18} className="text-interactive" />
                <h2 className="serif text-lg">{t('auth.profile')}</h2>
              </div>

              {profileMsg && (
                <div
                  className={`login-alert flex items-start gap-2 p-3 mb-4 text-xs ${
                    profileMsg.type === 'success' ? 'success' : 'error'
                  }`}
                >
                  {profileMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="block text-xs font-mono font-medium mb-1 text-muted">
                    {t('auth.displayName')}
                  </label>
                  <input
                    type="text"
                    className="form-input archival-border w-full p-2.5 font-sans text-sm"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    disabled={profileSaving}
                  />
                </div>

                <div className="form-group">
                  <label className="block text-xs font-mono font-medium mb-1 text-muted">
                    AVATAR URL
                  </label>
                  <input
                    type="url"
                    className="form-input archival-border w-full p-2.5 font-sans text-sm"
                    placeholder="https://..."
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    disabled={profileSaving}
                  />
                </div>

                <div className="form-group">
                  <label className="block text-xs font-mono font-medium mb-1 text-muted">
                    {t('auth.memberSince')}
                  </label>
                  <div className="font-mono text-xs text-muted p-2.5 archival-border bg-ground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary py-2.5 mt-2 flex items-center justify-center gap-2 text-sm"
                  disabled={profileSaving}
                >
                  <Save size={14} />
                  <span>{profileSaving ? t('auth.saving') : t('auth.saveChanges')}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Author Section: Shows Pen Name & Verification Status if authorProfile exists, OR provides Register/Redeem options for Reader */}
          {user.authorProfile ? (
            <div className="profile-card archival-border p-6 bg-surface flex flex-col justify-between">
              <div>
                <div className="card-header flex items-center justify-between mb-4 pb-3 archival-border-bottom">
                  <div className="flex items-center gap-2">
                    <Feather size={18} className="text-accent" />
                    <h2 className="serif text-lg">{t('auth.authorSectionTitle')}</h2>
                  </div>
                  <span
                    className={`font-mono text-xs px-2 py-0.5 rounded-sm flex items-center gap-1 ${
                      user.authorProfile.verificationStatus === 'VERIFIED'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : user.authorProfile.verificationStatus === 'REJECTED'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {user.authorProfile.verificationStatus === 'VERIFIED' ? (
                      <CheckCircle size={12} />
                    ) : user.authorProfile.verificationStatus === 'REJECTED' ? (
                      <Ban size={12} />
                    ) : (
                      <Clock size={12} />
                    )}
                    {user.authorProfile.verificationStatus}
                  </span>
                </div>

                {user.authorProfile.verificationStatus === 'PENDING' && (
                  <div className="p-3 mb-4 rounded-sm bg-amber-50/70 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <Clock size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Hồ sơ bút danh đang chờ Quản trị viên xét duyệt (PENDING).</p>
                      <p className="text-[11px] mt-0.5 opacity-90">
                        Sau khi được Quản trị viên phê duyệt, bạn sẽ được cấp quyền Tác giả chính thức và có thể đăng tải tác phẩm.
                      </p>
                    </div>
                  </div>
                )}

                {user.authorProfile.verificationStatus === 'REJECTED' && (
                  <div className="p-3 mb-4 rounded-sm bg-rose-50/70 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                    <Ban size={14} className="text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Hồ sơ bút danh đã bị từ chối phê duyệt (REJECTED).</p>
                      {user.authorProfile.verificationNote && (
                        <p className="text-[11px] mt-0.5 italic">
                          Lý do: "{user.authorProfile.verificationNote}"
                        </p>
                      )}
                      <p className="text-[11px] mt-1 opacity-90">
                        Bạn có thể chỉnh sửa lại thông tin bút danh/tiểu sử bên dưới và lưu lại để gửi lại yêu cầu xét duyệt mới.
                      </p>
                    </div>
                  </div>
                )}

                {user.authorProfile.verificationStatus === 'VERIFIED' && (
                  <div className="p-3 mb-4 rounded-sm bg-emerald-50/70 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                    <CheckCircle size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Hồ sơ bút danh đã được chứng thực (VERIFIED).</p>
                      <p className="text-[11px] mt-0.5 opacity-90">
                        Bạn có toàn quyền quản lý ấn bản số và đăng ký bản quyền blockchain cho các tác phẩm của mình.
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted mb-4">{t('auth.authorSectionDesc')}</p>

                {authorMsg && (
                  <div
                    className={`login-alert flex items-start gap-2 p-3 mb-4 text-xs ${
                      authorMsg.type === 'success' ? 'success' : 'error'
                    }`}
                  >
                    {authorMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    <span>{authorMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterAuthor} className="flex flex-col gap-4">
                  <div className="form-group">
                    <label className="block text-xs font-mono font-medium mb-1 text-muted">
                      {t('auth.penName')}
                    </label>
                    <input
                      type="text"
                      className="form-input archival-border w-full p-2.5 font-sans text-sm"
                      placeholder={t('auth.penNamePlaceholder')}
                      value={penName}
                      onChange={(e) => setPenName(e.target.value)}
                      required
                      disabled={authorSaving}
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-xs font-mono font-medium mb-1 text-muted">
                      {t('auth.bio')}
                    </label>
                    <textarea
                      rows={4}
                      className="form-input archival-border w-full p-2.5 font-sans text-sm resize-none"
                      placeholder={t('auth.bioPlaceholder')}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      disabled={authorSaving}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary py-2.5 mt-2 flex items-center justify-center gap-2 text-sm"
                    disabled={authorSaving}
                  >
                    <Feather size={14} />
                    <span>
                      {authorSaving
                        ? t('auth.saving')
                        : user.authorProfile?.verificationStatus === 'REJECTED'
                        ? 'Cập nhật & Gửi lại yêu cầu xét duyệt'
                        : t('auth.saveChanges')}
                    </span>
                  </button>
                </form>

                {/* Optional: Invitation code redemption accordion for reader */}
                {!isAuthor && (
                  <div className="mt-6 pt-4 border-t border-border">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted hover:text-ink font-mono text-[11px] flex items-center gap-1.5 select-none">
                        <Key size={12} className="text-accent" />
                        <span>Có mã mời từ Quản trị viên? Kích hoạt trực tiếp tại đây</span>
                      </summary>
                      <form onSubmit={handleRedeemInvitation} className="flex items-center gap-2 mt-3">
                        <input
                          type="text"
                          className="form-input archival-border flex-1 p-2 font-mono text-xs uppercase"
                          placeholder="BKC-XXXX-YYYY-ZZZZ"
                          value={invitationCode}
                          onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                          disabled={redeeming}
                        />
                        <button
                          type="submit"
                          className="btn btn-secondary text-xs px-3 py-2 flex items-center gap-1 whitespace-nowrap"
                          disabled={redeeming || !invitationCode.trim()}
                        >
                          {redeeming ? <RefreshCw size={12} className="animate-spin" /> : <Key size={12} />}
                          <span>Kích hoạt</span>
                        </button>
                      </form>
                      {redeemMsg && (
                        <div
                          className={`mt-2 p-2 rounded-sm text-[11px] ${
                            redeemMsg.type === 'success' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                          }`}
                        >
                          {redeemMsg.text}
                        </div>
                      )}
                    </details>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* User does not have an author profile yet: Show options to Register or Redeem */
            <div className="profile-card archival-border p-6 bg-surface flex flex-col justify-between">
              <div>
                <div className="card-header flex items-center justify-between mb-4 pb-3 archival-border-bottom">
                  <div className="flex items-center gap-2">
                    <Feather size={18} className="text-accent" />
                    <h2 className="serif text-lg">{t('invitation.becomeAuthor')}</h2>
                  </div>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-sm bg-surface-secondary text-muted border border-border">
                    TÁC GIẢ & BÚT DANH
                  </span>
                </div>

                {/* Sub-tabs: Register Pen Name vs Redeem Code */}
                <div className="flex items-center gap-2 mb-4 border-b border-border pb-2 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setAuthorSectionTab('REGISTER')}
                    className={`pb-1 font-medium transition-colors ${
                      authorSectionTab === 'REGISTER'
                        ? 'border-b-2 border-accent text-accent font-bold'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    1. Đăng ký Bút danh
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthorSectionTab('INVITATION')}
                    className={`pb-1 font-medium transition-colors ${
                      authorSectionTab === 'INVITATION'
                        ? 'border-b-2 border-accent text-accent font-bold'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    2. Nhập Mã mời Tác giả
                  </button>
                </div>

                {authorSectionTab === 'REGISTER' ? (
                  <>
                    <p className="text-xs text-muted mb-4 leading-relaxed">
                      Đăng ký bút danh của bạn để gửi yêu cầu phê duyệt tới Ban Quản trị. Sau khi được duyệt, bạn sẽ được cấp quyền Tác giả chính thức.
                    </p>

                    {authorMsg && (
                      <div
                        className={`login-alert flex items-start gap-2 p-3 mb-4 text-xs ${
                          authorMsg.type === 'success' ? 'success' : 'error'
                        }`}
                      >
                        {authorMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        <span>{authorMsg.text}</span>
                      </div>
                    )}

                    <form onSubmit={handleRegisterAuthor} className="flex flex-col gap-4">
                      <div className="form-group">
                        <label className="block text-xs font-mono font-medium mb-1 text-muted">
                          {t('auth.penName')}
                        </label>
                        <input
                          type="text"
                          className="form-input archival-border w-full p-2.5 font-sans text-sm"
                          placeholder={t('auth.penNamePlaceholder')}
                          value={penName}
                          onChange={(e) => setPenName(e.target.value)}
                          required
                          disabled={authorSaving}
                        />
                      </div>

                      <div className="form-group">
                        <label className="block text-xs font-mono font-medium mb-1 text-muted">
                          {t('auth.bio')}
                        </label>
                        <textarea
                          rows={4}
                          className="form-input archival-border w-full p-2.5 font-sans text-sm resize-none"
                          placeholder={t('auth.bioPlaceholder')}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          disabled={authorSaving}
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary py-2.5 mt-2 flex items-center justify-center gap-2 text-sm"
                        disabled={authorSaving}
                      >
                        <Feather size={14} />
                        <span>{authorSaving ? t('auth.saving') : 'Gửi yêu cầu Đăng ký Bút danh'}</span>
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-muted mb-4 leading-relaxed">
                      {t('invitation.readerNotice')}
                    </p>

                    {redeemMsg && (
                      <div
                        className={`login-alert flex items-start gap-2 p-3 mb-4 text-xs ${
                          redeemMsg.type === 'success' ? 'success' : 'error'
                        }`}
                      >
                        {redeemMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        <span>{redeemMsg.text}</span>
                      </div>
                    )}

                    <form onSubmit={handleRedeemInvitation} className="flex flex-col gap-4">
                      <div className="form-group">
                        <label className="block text-xs font-mono font-medium mb-1 text-muted">
                          {t('invitation.enterCode')}
                        </label>
                        <input
                          type="text"
                          className="form-input archival-border w-full p-2.5 font-mono text-sm uppercase tracking-wider"
                          placeholder={t('invitation.placeholder')}
                          value={invitationCode}
                          onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                          required
                          disabled={redeeming}
                        />
                        <span className="text-[11px] text-muted font-mono mt-1 block">
                          Format: BKC-XXXX-YYYY-ZZZZ (do Ban quản trị cấp)
                        </span>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary py-2.5 mt-2 flex items-center justify-center gap-2 text-sm"
                        disabled={redeeming || !invitationCode.trim()}
                      >
                        {redeeming ? <RefreshCw size={14} className="animate-spin" /> : <Key size={14} />}
                        <span>{redeeming ? t('invitation.redeeming') : t('invitation.redeemBtn')}</span>
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Author Works & Manuscript Repository Section */}
        {isAuthor && (
          <div className="author-works-card archival-border p-8 bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 archival-border-bottom">
              <div>
                <h2 className="serif text-xl flex items-center gap-2">
                  <BookOpen size={20} className="text-interactive" />
                  Quản Lý Tác Phẩm & Bản Thảo Của Bạn (Author Works)
                </h2>
                <p className="text-xs text-muted mt-1">
                  Quản lý các ấn bản số, lịch sử phiên bản tệp và đối soát mã băm SHA-256 an toàn.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  to="/author/studio"
                  className="btn btn-secondary flex items-center gap-1.5 text-xs py-2 px-3"
                  title="Mở toàn bộ công cụ Xưởng Tác Giả & Đăng ký Bản quyền On-Chain"
                >
                  <Feather size={14} className="text-accent" />
                  <span>Xưởng Tác Giả Đầy Đủ →</span>
                </Link>
                <button
                  className="btn btn-secondary flex items-center gap-1.5 text-xs"
                  onClick={loadMyBooks}
                  title="Tải lại danh sách"
                >
                  <RefreshCw size={14} className={booksLoading ? 'animate-spin' : ''} />
                  <span>Làm mới</span>
                </button>
                <button
                  className="btn btn-primary flex items-center gap-1.5 text-xs py-2 px-3"
                  onClick={() => setShowCreateBookModal(true)}
                >
                  <Plus size={16} />
                  <span>Tạo Tác Phẩm Mới</span>
                </button>
              </div>
            </div>

            {worksMsg && (
              <div
                className={`login-alert flex items-start gap-2 p-3 mb-6 text-xs ${
                  worksMsg.type === 'success' ? 'success' : 'error'
                }`}
              >
                {worksMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                <span>{worksMsg.text}</span>
              </div>
            )}

            {booksLoading ? (
              <div className="py-12 text-center text-xs font-mono text-muted">
                Đang nạp danh sách tác phẩm từ cơ sở dữ liệu...
              </div>
            ) : myBooks.length === 0 ? (
              <div className="p-8 archival-border text-center bg-ground">
                <p className="text-muted text-sm mb-4">Bạn chưa đăng ký tác phẩm nào trên hệ thống.</p>
                <button
                  className="btn btn-primary text-xs"
                  onClick={() => setShowCreateBookModal(true)}
                >
                  Bắt đầu đăng ký tác phẩm đầu tiên
                </button>
              </div>
            ) : (
              <div className="works-list">
                {myBooks.map((b) => (
                  <div key={b.bookId} className="work-item flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={`work-status-pill ${
                            b.publicationStatus === 'PUBLISHED'
                              ? 'work-status-published'
                              : b.publicationStatus === 'DRAFT'
                              ? 'work-status-draft'
                              : 'work-status-unlisted'
                          }`}
                        >
                          {b.publicationStatus}
                        </span>
                        <h3 className="font-serif font-bold text-base">{b.title}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/book/${b.bookId}`}
                          className="btn btn-secondary text-xs py-1 px-2.5 flex items-center gap-1"
                        >
                          <BookOpen size={12} /> Xem Chi Tiết
                        </Link>
                        <button
                          className="btn btn-secondary text-xs py-1 px-2.5"
                          onClick={() => handleToggleStatus(b)}
                        >
                          {b.publicationStatus === 'PUBLISHED' ? 'Chuyển về DRAFT' : 'Xuất Bản Ngay'}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-muted line-clamp-1">{b.description || 'Chưa có mô tả.'}</p>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t font-mono">
                      <div className="flex items-center gap-3 text-muted">
                        <span>
                          Tác giả: {b.authors.map((a) => a.penName).join(', ')} ({b.authors.length})
                        </span>
                        <span>•</span>
                        <span>
                          {b.currentFile
                            ? `Phiên bản: v${b.currentFile.versionNumber} (${b.currentFile.accessLevel})`
                            : 'Chưa có tệp'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-secondary text-xs py-1 px-2 flex items-center gap-1"
                          onClick={() => setCoAuthorTarget(b)}
                        >
                          <UserPlus size={12} /> Thêm Đồng Tác Giả
                        </button>
                        <button
                          className="btn btn-primary text-xs py-1 px-2.5 flex items-center gap-1"
                          onClick={() => setUploadBookTarget(b)}
                        >
                          <Upload size={12} /> Tải Phiên Bản Mới
                        </button>
                      </div>
                    </div>

                    {b.currentFile && (
                      <div className="bg-surface p-2 rounded-sm archival-border font-mono text-[11px] text-muted truncate">
                        SHA-256: {b.currentFile.sha256}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal 1: Create New Book */}
      {showCreateBookModal && (
        <div className="profile-modal-overlay" onClick={() => setShowCreateBookModal(false)}>
          <div className="profile-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3 className="serif text-base font-bold">Đăng Ký Tác Phẩm Mới</h3>
              <button
                className="btn btn-secondary p-1"
                onClick={() => setShowCreateBookModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateBook} className="profile-modal-body flex flex-col gap-4">
              <div className="form-group">
                <label className="block text-xs font-mono font-medium mb-1 text-muted">
                  TIÊU ĐỀ TÁC PHẨM (*)
                </label>
                <input
                  type="text"
                  className="form-input archival-border w-full p-2.5 text-sm"
                  placeholder="Nhập tiêu đề sách..."
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="block text-xs font-mono font-medium mb-1 text-muted">
                  TÓM TẮT NỘI DUNG
                </label>
                <textarea
                  rows={3}
                  className="form-input archival-border w-full p-2.5 text-sm resize-none"
                  placeholder="Giới thiệu khái quát tác phẩm..."
                  value={newBookDesc}
                  onChange={(e) => setNewBookDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="block text-xs font-mono font-medium mb-1 text-muted">
                  LINK ẢNH BÌA (TÙY CHỌN)
                </label>
                <input
                  type="url"
                  className="form-input archival-border w-full p-2.5 text-sm"
                  placeholder="https://..."
                  value={newBookCover}
                  onChange={(e) => setNewBookCover(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="block text-xs font-mono font-medium mb-1 text-muted">
                    NGÔN NGỮ
                  </label>
                  <select
                    className="form-input archival-border w-full p-2.5 text-sm"
                    value={newBookLang}
                    onChange={(e) => setNewBookLang(e.target.value)}
                  >
                    <option value="vi">Tiếng Việt (vi)</option>
                    <option value="en">English (en)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="block text-xs font-mono font-medium mb-1 text-muted">
                    TRẠNG THÁI KHỞI TẠO
                  </label>
                  <select
                    className="form-input archival-border w-full p-2.5 text-sm"
                    value={newBookStatus}
                    onChange={(e) => setNewBookStatus(e.target.value as any)}
                  >
                    <option value="DRAFT">DRAFT (Bản Thảo Riêng)</option>
                    <option value="PUBLISHED">PUBLISHED (Xuất Bản)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                <button
                  type="button"
                  className="btn btn-secondary text-xs"
                  onClick={() => setShowCreateBookModal(false)}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs py-2 px-4"
                  disabled={creatingBook}
                >
                  {creatingBook ? 'Đang Tạo...' : 'Tạo Bản Ghi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Upload Version */}
      {uploadBookTarget && (
        <div className="profile-modal-overlay" onClick={() => setUploadBookTarget(null)}>
          <div className="profile-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3 className="serif text-base font-bold">
                Tải Lên Bản Thảo: {uploadBookTarget.title}
              </h3>
              <button
                className="btn btn-secondary p-1"
                onClick={() => setUploadBookTarget(null)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUploadVersion} className="profile-modal-body flex flex-col gap-4">
              <div className="form-group">
                <label className="block text-xs font-mono font-medium mb-1 text-muted">
                  CHỌN TỆP BẢN THẢO (PDF, EPUB, TXT — TỐI ĐA 50MB)
                </label>
                <input
                  type="file"
                  accept=".pdf,.epub,.txt"
                  className="archival-border w-full p-2 text-sm bg-ground"
                  onChange={(e) => setUploadFileObj(e.target.files?.[0] || null)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="block text-xs font-mono font-medium mb-1 text-muted">
                  QUYỀN TRUY CẬP TỆP (ACCESS LEVEL)
                </label>
                <select
                  className="form-input archival-border w-full p-2.5 text-sm"
                  value={uploadAccessLevel}
                  onChange={(e) => setUploadAccessLevel(e.target.value as any)}
                >
                  <option value="PUBLIC_READ">PUBLIC_READ (Chỉ cho phép đọc trực tuyến, chặn tải)</option>
                  <option value="PUBLIC_DOWNLOAD">PUBLIC_DOWNLOAD (Cho phép độc giả tải tệp gốc)</option>
                  <option value="PRIVATE">PRIVATE (Riêng tư — chỉ tác giả được đọc/tải)</option>
                </select>
              </div>

              <div className="p-3 archival-border bg-ground text-xs font-mono text-muted">
                Lưu ý: Backend sẽ tính toán mã băm SHA-256 từ nội dung byte thực tế của tệp để bảo đảm tính toàn vẹn bất biến.
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                <button
                  type="button"
                  className="btn btn-secondary text-xs"
                  onClick={() => setUploadBookTarget(null)}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs py-2 px-4"
                  disabled={uploadingFile || !uploadFileObj}
                >
                  {uploadingFile ? 'Đang Tính SHA-256 & Lưu...' : 'Xác Nhận Tải Lên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add Co-Author */}
      {coAuthorTarget && (
        <div className="profile-modal-overlay" onClick={() => setCoAuthorTarget(null)}>
          <div className="profile-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3 className="serif text-base font-bold">
                Thêm Đồng Tác Giả: {coAuthorTarget.title}
              </h3>
              <button
                className="btn btn-secondary p-1"
                onClick={() => setCoAuthorTarget(null)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddCoAuthor} className="profile-modal-body flex flex-col gap-4">
              <div className="form-group">
                <label className="block text-xs font-mono font-medium mb-1 text-muted">
                  MÃ HỒ SƠ TÁC GIẢ (AUTHOR PROFILE ID GUID)
                </label>
                <input
                  type="text"
                  className="form-input archival-border w-full p-2.5 font-mono text-sm"
                  placeholder="Ví dụ: 4D7FD0AD-CCC5-F111-..."
                  value={coAuthorProfileId}
                  onChange={(e) => setCoAuthorProfileId(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="block text-xs font-mono font-medium mb-1 text-muted">
                  VAI TRÒ ĐÓNG GÓP
                </label>
                <select
                  className="form-input archival-border w-full p-2.5 text-sm"
                  value={coAuthorRole}
                  onChange={(e) => setCoAuthorRole(e.target.value as any)}
                >
                  <option value="CO_AUTHOR">CO_AUTHOR (Đồng Tác Giả)</option>
                  <option value="EDITOR">EDITOR (Biên Tập Viên)</option>
                  <option value="TRANSLATOR">TRANSLATOR (Dịch Giả)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                <button
                  type="button"
                  className="btn btn-secondary text-xs"
                  onClick={() => setCoAuthorTarget(null)}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs py-2 px-4"
                  disabled={addingCoAuthor || !coAuthorProfileId.trim()}
                >
                  {addingCoAuthor ? 'Đang Liên Kết...' : 'Thêm Vào Tác Phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
