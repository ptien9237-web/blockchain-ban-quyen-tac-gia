import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Key,
  Copy,
  Check,
  Plus,
  X,
  Clock,
  Ban,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  AlertTriangle,
  Gavel,
  PauseCircle,
  PlayCircle,
  ExternalLink,
  Send,
  Feather,
  Search,
  UserCheck,
  UserX,
  LayoutDashboard,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';
import {
  adminApi,
  type AdminInvitation,
  type CreateInvitationResult,
  type ApiReport,
  type AdminAuthorRequest,
  type AdminOverviewStats,
} from '../services/api';
import { shortenAddress } from '../utils/blockchain';
import './AdminDashboard.css';

type AdminTab = 'OVERVIEW' | 'AUTHOR_REQUESTS' | 'INVITATIONS' | 'DISPUTES' | 'GOVERNANCE';

export function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');

  // --- TAB 0: OVERVIEW STATE ---
  const [overviewStats, setOverviewStats] = useState<AdminOverviewStats | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // --- TAB 1: INVITATIONS STATE ---
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(true);
  const [invitationsError, setInvitationsError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [maxUses, setMaxUses] = useState(1);
  const [note, setNote] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const [createdResult, setCreatedResult] = useState<CreateInvitationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // --- TAB 2: AUTHOR REQUESTS STATE ---
  const [authorRequests, setAuthorRequests] = useState<AdminAuthorRequest[]>([]);
  const [authorRequestsLoading, setAuthorRequestsLoading] = useState(false);
  const [authorRequestsError, setAuthorRequestsError] = useState<string | null>(null);
  const [authorStatusFilter, setAuthorStatusFilter] = useState<string>('ALL');
  const [authorSearch, setAuthorSearch] = useState<string>('');

  const [approvingRequest, setApprovingRequest] = useState<AdminAuthorRequest | null>(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [approvingSubmitting, setApprovingSubmitting] = useState(false);

  const [rejectingRequest, setRejectingRequest] = useState<AdminAuthorRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingSubmitting, setRejectingSubmitting] = useState(false);

  const [authorActionMsg, setAuthorActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- TAB 3: DISPUTES & REPORTS STATE ---
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Detail Modal / Drawer
  const [selectedReport, setSelectedReport] = useState<ApiReport | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<'START_REVIEW' | 'REQUEST_INFO' | 'NOTE' | 'DISMISS' | 'RESOLVE'>('NOTE');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // On-Chain Action Dialog
  const [onChainAction, setOnChainAction] = useState<'DISPUTE' | 'RESOLVE_ACTIVE' | 'RESOLVE_REVOKE' | 'REVOKE' | null>(null);
  const [onChainReason, setOnChainReason] = useState('');
  const [onChainExecuting, setOnChainExecuting] = useState(false);
  const [onChainError, setOnChainError] = useState<string | null>(null);
  const [onChainSuccessMsg, setOnChainSuccessMsg] = useState<string | null>(null);

  // --- TAB 4: SMART CONTRACT GOVERNANCE STATE ---
  const [circuitBreaker, setCircuitBreaker] = useState<{
    isPaused: boolean;
    contractAddress: string;
    chainId: number;
    totalRecords: number;
  } | null>(null);
  const [circuitLoading, setCircuitLoading] = useState(false);
  const [circuitToggling, setCircuitToggling] = useState(false);
  const [circuitError, setCircuitError] = useState<string | null>(null);
  const [circuitSuccessMsg, setCircuitSuccessMsg] = useState<string | null>(null);

  // Fetch Invitations
  const fetchInvitations = async () => {
    try {
      setInvitationsLoading(true);
      setInvitationsError(null);
      const res = await adminApi.getInvitations(1, 100);
      setInvitations(res.items);
    } catch (err: any) {
      setInvitationsError(err.message || 'Không thể tải danh sách mã mời.');
    } finally {
      setInvitationsLoading(false);
    }
  };

  // Fetch Author Requests
  const fetchAuthorRequests = async () => {
    try {
      setAuthorRequestsLoading(true);
      setAuthorRequestsError(null);
      const res = await adminApi.getAuthorRequests({
        status: authorStatusFilter === 'ALL' ? undefined : authorStatusFilter,
        search: authorSearch.trim() || undefined,
        page: 1,
        limit: 100,
      });
      setAuthorRequests(res.items);
    } catch (err: any) {
      setAuthorRequestsError(err.message || 'Không thể tải danh sách yêu cầu bút danh.');
    } finally {
      setAuthorRequestsLoading(false);
    }
  };

  // Fetch Reports
  const fetchReports = async () => {
    try {
      setReportsLoading(true);
      setReportsError(null);
      const res = await adminApi.getReports({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page: 1,
        limit: 100,
      });
      setReports(res.items);
    } catch (err: any) {
      setReportsError(err.message || 'Không thể tải danh sách khiếu nại.');
    } finally {
      setReportsLoading(false);
    }
  };

  // Fetch Circuit Breaker
  const fetchCircuitBreaker = async () => {
    try {
      setCircuitLoading(true);
      setCircuitError(null);
      const res = await adminApi.getCircuitBreakerStatus();
      setCircuitBreaker(res);
    } catch (err: any) {
      setCircuitError(err.message || 'Không thể đọc trạng thái Smart Contract.');
    } finally {
      setCircuitLoading(false);
    }
  };

  // Fetch Overview Stats
  const fetchOverview = async () => {
    try {
      setOverviewLoading(true);
      setOverviewError(null);
      const [stats] = await Promise.all([
        adminApi.getOverviewStats(),
        fetchCircuitBreaker(),
      ]);
      setOverviewStats(stats);
    } catch (err: any) {
      setOverviewError(err.message || 'Không thể tải số liệu tổng quan hệ thống.');
    } finally {
      setOverviewLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.roles.includes('ADMIN')) {
      if (activeTab === 'OVERVIEW') {
        fetchOverview();
      } else if (activeTab === 'INVITATIONS') {
        fetchInvitations();
      } else if (activeTab === 'AUTHOR_REQUESTS') {
        fetchAuthorRequests();
      } else if (activeTab === 'DISPUTES') {
        fetchReports();
      } else if (activeTab === 'GOVERNANCE') {
        fetchCircuitBreaker();
      }
    }
  }, [user, activeTab, statusFilter, authorStatusFilter]);

  // Initial background load of pending count and overview
  useEffect(() => {
    if (user && user.roles.includes('ADMIN')) {
      fetchOverview();
      adminApi.getAuthorRequests({ status: 'PENDING', limit: 100 }).then((res) => {
        setAuthorRequests((prev) => (prev.length === 0 ? res.items : prev));
      }).catch(() => {});
    }
  }, [user]);

  const handleApproveAuthorRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingRequest) return;
    try {
      setApprovingSubmitting(true);
      setAuthorActionMsg(null);
      const res = await adminApi.approveAuthorRequest(approvingRequest.authorProfileId, approvalNote);
      setAuthorActionMsg({ type: 'success', text: res.message || 'Đã phê duyệt yêu cầu bút danh thành công!' });
      setApprovingRequest(null);
      setApprovalNote('');
      fetchAuthorRequests();
    } catch (err: any) {
      setAuthorActionMsg({ type: 'error', text: err.message || 'Phê duyệt thất bại.' });
    } finally {
      setApprovingSubmitting(false);
    }
  };

  const handleRejectAuthorRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequest) return;
    if (!rejectionReason.trim() || rejectionReason.trim().length < 3) {
      setAuthorActionMsg({ type: 'error', text: 'Vui lòng cung cấp lý do từ chối rõ ràng (tối thiểu 3 ký tự).' });
      return;
    }
    try {
      setRejectingSubmitting(true);
      setAuthorActionMsg(null);
      const res = await adminApi.rejectAuthorRequest(rejectingRequest.authorProfileId, rejectionReason.trim());
      setAuthorActionMsg({ type: 'success', text: res.message || 'Đã từ chối yêu cầu bút danh.' });
      setRejectingRequest(null);
      setRejectionReason('');
      fetchAuthorRequests();
    } catch (err: any) {
      setAuthorActionMsg({ type: 'error', text: err.message || 'Từ chối thất bại.' });
    } finally {
      setRejectingSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container py-24 text-center">
        <div className="font-mono text-sm text-muted">Loading authentication...</div>
      </div>
    );
  }

  // Access Guard
  if (!user || !user.roles.includes('ADMIN')) {
    return (
      <div className="container py-16">
        <div className="admin-denied-box">
          <ShieldAlert size={48} className="mx-auto mb-4 text-accent" />
          <h2 className="serif text-xl font-bold mb-2">403 — Access Denied</h2>
          <p className="text-muted text-sm mb-6">
            You do not possess the required administrator credentials to access the platform control room.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/" className="btn-secondary text-xs">
              Return to Library
            </Link>
            {!user && (
              <Link to="/login" className="btn-primary text-xs">
                Sign In as Administrator
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Handlers: Invitations ---
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setCreateError(null);
      const res = await adminApi.createInvitation({
        expiresInDays,
        maxUses,
        note: note.trim() || null,
      });

      setCreatedResult(res);
      setShowCreateModal(false);
      setNote('');
      setExpiresInDays(30);
      setMaxUses(1);
      fetchInvitations();
    } catch (err: any) {
      setCreateError(err.message || 'Không thể tạo mã mời.');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCode = async () => {
    if (!createdResult) return;
    try {
      await navigator.clipboard.writeText(createdResult.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleRevoke = async (invitationId: string) => {
    if (!window.confirm(t('admin.confirmRevoke') || 'Bạn có chắc chắn muốn thu hồi mã mời này?')) return;
    try {
      setRevokingId(invitationId);
      await adminApi.revokeInvitation(invitationId);
      fetchInvitations();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thu hồi mã mời.');
    } finally {
      setRevokingId(null);
    }
  };

  // --- Handlers: Reports & Disputes ---
  const handleOpenReportDetail = async (reportId: string) => {
    try {
      setActionError(null);
      setOnChainError(null);
      setOnChainSuccessMsg(null);
      const detail = await adminApi.getReportById(reportId);
      setSelectedReport(detail);
    } catch (err: any) {
      alert(err.message || 'Không thể tải chi tiết khiếu nại.');
    }
  };

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    try {
      setActionSubmitting(true);
      setActionError(null);
      await adminApi.addReportAction(selectedReport.reportId, {
        action: selectedActionType,
        note: actionNote.trim() || undefined,
      });
      setActionNote('');
      const updated = await adminApi.getReportById(selectedReport.reportId);
      setSelectedReport(updated);
      fetchReports();
    } catch (err: any) {
      setActionError(err.message || 'Thêm hoạt động thất bại.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleExecuteOnChain = async () => {
    if (!selectedReport || !onChainAction) return;
    if (!onChainReason.trim() || onChainReason.trim().length < 5) {
      setOnChainError('Vui lòng nhập lý do tối thiểu 5 ký tự để ghi lên bằng chứng giao dịch on-chain.');
      return;
    }

    try {
      setOnChainExecuting(true);
      setOnChainError(null);
      setOnChainSuccessMsg(null);

      const res = await adminApi.executeDisputeOnChain(selectedReport.reportId, {
        actionType: onChainAction,
        reason: onChainReason.trim(),
      });

      setOnChainSuccessMsg(
        `Thao tác On-chain [${onChainAction}] thành công! TxHash: ${shortenAddress(res.txHash, 8)} | Block: #${res.blockNumber}`
      );
      setOnChainReason('');
      setOnChainAction(null);

      const updated = await adminApi.getReportById(selectedReport.reportId);
      setSelectedReport(updated);
      fetchReports();
    } catch (err: any) {
      setOnChainError(err.message || 'Giao dịch on-chain thất bại.');
    } finally {
      setOnChainExecuting(false);
    }
  };

  // --- Handlers: Circuit Breaker ---
  const handleToggleCircuitBreaker = async (pause: boolean) => {
    const promptMsg = pause
      ? 'CẢNH BÁO: Tạm dừng khẩn cấp sẽ đóng băng toàn bộ hoạt động đăng ký bản quyền mới trên Smart Contract. Bạn có chắc chắn muốn kích hoạt Circuit Breaker?'
      : 'Xác nhận mở lại hợp đồng thông minh để tiếp tục nhận các giao dịch đăng ký bản quyền?';

    if (!window.confirm(promptMsg)) return;

    try {
      setCircuitToggling(true);
      setCircuitError(null);
      setCircuitSuccessMsg(null);

      const res = await adminApi.toggleCircuitBreaker(pause);
      setCircuitSuccessMsg(
        `Trạng thái hợp đồng đã cập nhật: ${pause ? 'ĐÃ TẠM DỪNG (PAUSED)' : 'ĐANG HOẠT ĐỘNG (ACTIVE)'}! TxHash: ${shortenAddress(res.txHash, 8)}`
      );
      fetchCircuitBreaker();
    } catch (err: any) {
      setCircuitError(err.message || 'Thay đổi trạng thái Circuit Breaker thất bại.');
    } finally {
      setCircuitToggling(false);
    }
  };

  // Stats computation
  const totalCount = invitations.length;
  const activeCount = invitations.filter((i) => i.status === 'ACTIVE').length;
  const exhaustedCount = invitations.filter((i) => i.status === 'EXHAUSTED').length;
  const revokedCount = invitations.filter((i) => i.status === 'REVOKED').length;

  const totalAuthorRequests = authorRequests.length;
  const pendingAuthorRequests = authorRequests.filter((a) => a.verificationStatus === 'PENDING').length;
  const verifiedAuthorRequests = authorRequests.filter((a) => a.verificationStatus === 'VERIFIED').length;
  const rejectedAuthorRequests = authorRequests.filter((a) => a.verificationStatus === 'REJECTED').length;

  const totalReports = reports.length;
  const openReports = reports.filter((r) => r.status === 'OPEN').length;
  const inReviewReports = reports.filter((r) => r.status === 'IN_REVIEW').length;
  const resolvedReports = reports.filter((r) => r.status === 'RESOLVED').length;

  return (
    <div className="container py-12 admin-dashboard">
      {/* Header */}
      <div className="admin-header flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="serif text-3xl font-bold tracking-tight mb-2">{t('admin.title')}</h1>
          <p className="text-muted text-sm max-w-2xl">{t('admin.subtitle')}</p>
        </div>

        {activeTab === 'OVERVIEW' && (
          <button
            onClick={fetchOverview}
            disabled={overviewLoading}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={14} className={overviewLoading ? 'animate-spin' : ''} />
            <span>Làm mới số liệu</span>
          </button>
        )}

        {activeTab === 'INVITATIONS' && (
          <div className="flex items-center gap-2">
            <button
              onClick={fetchInvitations}
              disabled={invitationsLoading}
              className="btn btn-secondary btn-icon"
              title="Refresh list"
            >
              <RefreshCw size={15} className={invitationsLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus size={15} />
              <span>{t('admin.createInvitation')}</span>
            </button>
          </div>
        )}

        {activeTab === 'AUTHOR_REQUESTS' && (
          <button
            onClick={fetchAuthorRequests}
            disabled={authorRequestsLoading}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={14} className={authorRequestsLoading ? 'animate-spin' : ''} />
            <span>Làm mới danh sách</span>
          </button>
        )}

        {activeTab === 'DISPUTES' && (
          <button
            onClick={fetchReports}
            disabled={reportsLoading}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={14} className={reportsLoading ? 'animate-spin' : ''} />
            <span>Làm mới danh sách</span>
          </button>
        )}
      </div>

      {/* Tabs Navigation Strip */}
      <div className="admin-tabs">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`admin-tab-btn ${activeTab === 'OVERVIEW' ? 'active' : ''}`}
        >
          <LayoutDashboard size={14} />
          <span>Tổng quan</span>
        </button>

        <button
          onClick={() => setActiveTab('AUTHOR_REQUESTS')}
          className={`admin-tab-btn ${activeTab === 'AUTHOR_REQUESTS' ? 'active' : ''}`}
        >
          <Feather size={14} />
          <span>Duyệt tác giả ({pendingAuthorRequests > 0 ? `${pendingAuthorRequests} chờ duyệt` : authorRequests.length})</span>
          {pendingAuthorRequests > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Có yêu cầu chờ duyệt" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('INVITATIONS')}
          className={`admin-tab-btn ${activeTab === 'INVITATIONS' ? 'active' : ''}`}
        >
          <Key size={14} />
          <span>Mã mời tác giả ({invitations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DISPUTES')}
          className={`admin-tab-btn ${activeTab === 'DISPUTES' ? 'active' : ''}`}
        >
          <Gavel size={14} />
          <span>Khiếu nại & Tranh chấp ({reports.length})</span>
          {openReports > 0 && (
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" title="Có khiếu nại mới" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('GOVERNANCE')}
          className={`admin-tab-btn ${activeTab === 'GOVERNANCE' ? 'active' : ''}`}
        >
          <ShieldCheck size={14} />
          <span>Smart Contract & Circuit Breaker</span>
        </button>
      </div>

      {/* =========================================================
          TAB 0: OVERVIEW
          ========================================================= */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8">
          {overviewError && (
            <div className="p-4 bg-red-50 text-red-800 border border-red-200 text-xs rounded-sm">
              {overviewError}
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="admin-stat-card archival-border p-5 rounded-sm bg-surface flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-muted text-xs mb-2">
                  <span>Bút danh Chờ duyệt</span>
                  <Feather size={16} className={overviewStats?.pendingAuthorRequests ? 'text-amber-600' : 'text-muted'} />
                </div>
                <div className="font-mono text-2xl font-bold text-ink">
                  {overviewLoading ? '...' : (overviewStats?.pendingAuthorRequests ?? 0)}
                </div>
                <p className="text-xs text-muted mt-1">
                  {overviewStats?.pendingAuthorRequests
                    ? `${overviewStats.pendingAuthorRequests} tác giả đang chờ xét duyệt`
                    : 'Không có yêu cầu chờ xử lý'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('AUTHOR_REQUESTS')}
                className="mt-4 text-xs font-mono text-interactive hover:underline flex items-center gap-1"
              >
                <span>Xem danh sách duyệt →</span>
              </button>
            </div>

            <div className="admin-stat-card archival-border p-5 rounded-sm bg-surface flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-muted text-xs mb-2">
                  <span>Tranh chấp Đang mở</span>
                  <Gavel size={16} className={overviewStats?.openDisputes ? 'text-accent' : 'text-muted'} />
                </div>
                <div className="font-mono text-2xl font-bold text-ink">
                  {overviewLoading ? '...' : (overviewStats?.openDisputes ?? 0)}
                </div>
                <p className="text-xs text-muted mt-1">
                  {overviewStats?.resolvedDisputes ?? 0} vụ việc đã giải quyết thành công
                </p>
              </div>
              <button
                onClick={() => setActiveTab('DISPUTES')}
                className="mt-4 text-xs font-mono text-interactive hover:underline flex items-center gap-1"
              >
                <span>Xử lý khiếu nại →</span>
              </button>
            </div>

            <div className="admin-stat-card archival-border p-5 rounded-sm bg-surface flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-muted text-xs mb-2">
                  <span>Bản quyền On-chain</span>
                  <ShieldCheck size={16} className="text-emerald-600" />
                </div>
                <div className="font-mono text-2xl font-bold text-ink">
                  {overviewLoading ? '...' : (overviewStats?.onChainRecords ?? 0)}
                </div>
                <p className="text-xs text-muted mt-1">
                  Chứng thư số đã neo bất biến trên Smart Contract
                </p>
              </div>
              <button
                onClick={() => setActiveTab('GOVERNANCE')}
                className="mt-4 text-xs font-mono text-interactive hover:underline flex items-center gap-1"
              >
                <span>Kiểm soát Hợp đồng →</span>
              </button>
            </div>

            <div className="admin-stat-card archival-border p-5 rounded-sm bg-surface flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-muted text-xs mb-2">
                  <span>Mã mời Hoạt động</span>
                  <Key size={16} className="text-purple-600" />
                </div>
                <div className="font-mono text-2xl font-bold text-ink">
                  {overviewLoading ? '...' : (overviewStats?.activeInvitations ?? 0)}
                </div>
                <p className="text-xs text-muted mt-1">
                  Mã cấp quyền tác giả đang lưu hành
                </p>
              </div>
              <button
                onClick={() => setActiveTab('INVITATIONS')}
                className="mt-4 text-xs font-mono text-interactive hover:underline flex items-center gap-1"
              >
                <span>Quản lý mã mời →</span>
              </button>
            </div>
          </div>

          {/* Infrastructure Health & Catalog Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Blockchain Health */}
            <div className="archival-border bg-surface p-6 rounded-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-ink" />
                  <h3 className="serif font-bold text-base text-ink">Hạ tầng Blockchain &amp; Smart Contract</h3>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-sm uppercase font-semibold ${
                    circuitBreaker?.isPaused
                      ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {circuitBreaker?.isPaused ? 'CIRCUIT BREAKER: PAUSED' : 'LEDGER: OPERATIONAL'}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1.5 border-b border-dashed">
                  <span className="text-muted">Mạng kết nối:</span>
                  <span className="text-ink font-semibold">
                    {circuitBreaker?.chainId === 31337 ? 'Hardhat Local Node (31337)' : `EVM Network (${circuitBreaker?.chainId || 'N/A'})`}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed">
                  <span className="text-muted">Địa chỉ Smart Contract:</span>
                  <span className="text-ink select-all">
                    {circuitBreaker?.contractAddress ? shortenAddress(circuitBreaker.contractAddress, 8) : 'Chưa kết nối'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed">
                  <span className="text-muted">Số lượng Bản ghi On-chain:</span>
                  <span className="text-ink font-semibold">{overviewStats?.onChainRecords ?? (circuitBreaker?.totalRecords ?? 0)}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted">Trạng thái Cầu dao Khẩn cấp:</span>
                  <span className={circuitBreaker?.isPaused ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
                    {circuitBreaker?.isPaused ? 'ĐANG TẠM DỪNG TOÀN HỆ THỐNG' : 'BÌNH THƯỜNG (CHO PHÉP GHI BẢN QUYỀN)'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('GOVERNANCE')}
                  className="btn btn-secondary text-xs py-1.5 px-3 w-full justify-center flex items-center gap-1.5"
                >
                  <span>Mở bảng điều khiển Circuit Breaker</span>
                </button>
              </div>
            </div>

            {/* Catalog & User Distribution */}
            <div className="archival-border bg-surface p-6 rounded-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-ink" />
                  <h3 className="serif font-bold text-base text-ink">Kho thư viện &amp; Người dùng</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-ground text-ink archival-border">
                  SQL DATABASE VAULT
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1.5 border-b border-dashed">
                  <span className="text-muted">Tổng số tài khoản:</span>
                  <span className="text-ink font-semibold">{overviewStats?.totalUsers ?? 0}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed">
                  <span className="text-muted">Tác giả đã xác thực (Verified Authors):</span>
                  <span className="text-ink font-semibold text-emerald-600">{overviewStats?.verifiedAuthors ?? 0}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed">
                  <span className="text-muted">Tác phẩm đã xuất bản (Published):</span>
                  <span className="text-ink font-semibold text-interactive">{overviewStats?.publishedBooks ?? 0}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted">Lưu trữ phân tán IPFS:</span>
                  <span className="text-emerald-600 font-semibold">SẴN SÀNG (CIDv0 Multihash)</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setActiveTab('AUTHOR_REQUESTS')}
                  className="btn btn-secondary text-xs py-1.5 px-3 flex-1 justify-center flex items-center gap-1.5"
                >
                  <Feather size={14} />
                  <span>Duyệt tác giả</span>
                </button>
                <Link
                  to="/discover"
                  className="btn btn-secondary text-xs py-1.5 px-3 flex-1 justify-center flex items-center gap-1.5"
                >
                  <BookOpen size={14} />
                  <span>Xem Thư viện</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 1: INVITATIONS
          ========================================================= */}
      {activeTab === 'INVITATIONS' && (
        <>
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="stat-label">{t('admin.totalCodes')}</div>
              <div className="stat-value">{totalCount}</div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-label">{t('admin.activeCodes')}</div>
              <div className="stat-value text-emerald-600">{activeCount}</div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-label">{t('admin.exhaustedCodes')}</div>
              <div className="stat-value text-purple-600">{exhaustedCount}</div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-label">{t('admin.revokedCodes')}</div>
              <div className="stat-value text-rose-600">{revokedCount}</div>
            </div>
          </div>

          <div className="admin-section">
            <div className="admin-section-header">
              <div className="flex items-center gap-2 font-serif font-bold text-sm">
                <Key size={16} />
                <span>{t('admin.invitations')}</span>
              </div>
              <span className="font-mono text-xs text-muted">
                {invitations.length} records
              </span>
            </div>

            {invitationsError && (
              <div className="p-6 text-center text-sm text-rose-600 flex items-center justify-center gap-2">
                <AlertCircle size={16} />
                <span>{invitationsError}</span>
              </div>
            )}

            {invitationsLoading ? (
              <div className="p-12 text-center text-muted font-mono text-xs">
                Loading invitation ledger...
              </div>
            ) : invitations.length === 0 ? (
              <div className="p-12 text-center text-muted text-sm">
                {t('admin.noInvitations')}
              </div>
            ) : (
              <div className="invitations-table-wrapper">
                <table className="invitations-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>{t('admin.status')}</th>
                      <th>{t('admin.usage')}</th>
                      <th>{t('admin.expires')}</th>
                      <th>{t('admin.created')}</th>
                      <th>{t('admin.note')}</th>
                      <th className="text-right">{t('admin.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((inv) => (
                      <tr key={inv.invitationId}>
                        <td className="font-mono text-xs text-muted">
                          {inv.invitationId.substring(0, 8)}...
                        </td>
                        <td>
                          <span className={`status-badge status-${inv.status.toLowerCase()}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="font-mono text-xs">
                          {inv.usedCount} / {inv.maxUses}
                        </td>
                        <td className="text-xs text-muted">
                          {new Date(inv.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="text-xs text-muted">
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </td>
                        <td className="text-xs text-muted max-w-xs truncate">
                          {inv.note || '—'}
                        </td>
                        <td className="text-right">
                          {inv.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleRevoke(inv.invitationId)}
                              disabled={revokingId === inv.invitationId}
                              className="btn-revoke"
                              title="Thu hồi mã mời này"
                            >
                              <Ban size={14} />
                              <span>{t('admin.revoke')}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* =========================================================
          TAB 2: AUTHOR REQUESTS
          ========================================================= */}
      {activeTab === 'AUTHOR_REQUESTS' && (
        <>
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="stat-label">TỔNG YÊU CẦU BÚT DANH</div>
              <div className="stat-value">{totalAuthorRequests}</div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-label">CHỜ XÉT DUYỆT</div>
              <div className="stat-value text-amber-600">{pendingAuthorRequests}</div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-label">ĐÃ PHÊ DUYỆT (VERIFIED)</div>
              <div className="stat-value text-emerald-600">{verifiedAuthorRequests}</div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-label">ĐÃ TỪ CHỐI (REJECTED)</div>
              <div className="stat-value text-rose-600">{rejectedAuthorRequests}</div>
            </div>
          </div>

          {authorActionMsg && (
            <div
              className={`p-4 mb-6 rounded-sm text-xs flex items-center gap-2 ${
                authorActionMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
              }`}
            >
              {authorActionMsg.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
              )}
              <span>{authorActionMsg.text}</span>
            </div>
          )}

          <div className="admin-section">
            <div className="admin-section-header">
              <div className="flex items-center gap-2 font-serif font-bold text-sm">
                <Feather size={16} className="text-accent" />
                <span>Danh sách Đăng ký Bút danh & Quyền Tác giả</span>
              </div>

              {/* Status Filters & Search Bar */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="admin-search-wrapper">
                  <Search size={14} className="admin-search-icon" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên, email, bút danh..."
                    value={authorSearch}
                    onChange={(e) => setAuthorSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchAuthorRequests()}
                    className="admin-search-input"
                  />
                </div>

                <div className="pills-group">
                  {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setAuthorStatusFilter(st)}
                      className={`pill-btn ${authorStatusFilter === st ? 'active' : ''}`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {authorRequestsError && (
              <div className="p-6 text-center text-sm text-rose-600 flex items-center justify-center gap-2">
                <AlertCircle size={16} />
                <span>{authorRequestsError}</span>
              </div>
            )}

            {authorRequestsLoading ? (
              <div className="p-12 text-center text-muted font-mono text-xs">
                Đang tải danh sách yêu cầu bút danh từ cơ sở dữ liệu...
              </div>
            ) : authorRequests.length === 0 ? (
              <div className="p-12 text-center text-muted text-sm">
                Không tìm thấy yêu cầu đăng ký bút danh nào theo điều kiện lọc.
              </div>
            ) : (
              <div className="invitations-table-wrapper">
                <table className="invitations-table">
                  <thead>
                    <tr>
                      <th>NGƯỜI ĐĂNG KÝ</th>
                      <th>BÚT DANH YÊU CẦU</th>
                      <th>TRẠNG THÁI</th>
                      <th>THỜI GIAN GỬI</th>
                      <th>THÔNG TIN XÉT DUYỆT</th>
                      <th className="text-right">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {authorRequests.map((req) => (
                      <tr key={req.authorProfileId} className="hover:bg-surface-secondary/40 transition-colors">
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-ground border border-border flex items-center justify-center font-serif text-xs font-bold text-muted overflow-hidden">
                              {req.userAvatarUrl ? (
                                <img src={req.userAvatarUrl} alt={req.userDisplayName} className="w-full h-full object-cover" />
                              ) : (
                                req.userDisplayName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-ink">{req.userDisplayName}</div>
                              <div className="font-mono text-[11px] text-muted">{req.userEmail}</div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div>
                            <div className="font-serif font-bold text-ink flex items-center gap-1.5">
                              <Feather size={13} className="text-accent" />
                              <span>{req.penName}</span>
                            </div>
                            {req.bio && (
                              <div className="text-xs text-muted max-w-xs truncate" title={req.bio}>
                                {req.bio}
                              </div>
                            )}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-sm font-medium ${
                              req.verificationStatus === 'VERIFIED'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                : req.verificationStatus === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {req.verificationStatus === 'VERIFIED' && <CheckCircle2 size={12} />}
                            {req.verificationStatus === 'REJECTED' && <Ban size={12} />}
                            {req.verificationStatus === 'PENDING' && <Clock size={12} />}
                            {req.verificationStatus}
                          </span>
                        </td>

                        <td>
                          <div className="font-mono text-xs text-muted">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </div>
                          <div className="font-mono text-[10px] text-muted/70">
                            {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        <td>
                          {req.verificationStatus !== 'PENDING' ? (
                            <div className="text-xs">
                              <div className="text-muted font-mono text-[11px]">
                                {req.reviewerDisplayName ? `Duyệt bởi: ${req.reviewerDisplayName}` : 'Đã thẩm định'}
                              </div>
                              {req.verificationNote && (
                                <div className="text-muted italic text-[11px] mt-0.5 max-w-xs truncate" title={req.verificationNote}>
                                  "{req.verificationNote}"
                                </div>
                              )}
                              {req.reviewedAt && (
                                <div className="font-mono text-[10px] text-muted/70">
                                  {new Date(req.reviewedAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted text-xs font-mono italic">Chờ xem xét</span>
                          )}
                        </td>

                        <td className="text-right">
                          {req.verificationStatus === 'PENDING' ? (
                            <div className="table-action-group justify-end">
                              <button
                                onClick={() => {
                                  setApprovingRequest(req);
                                  setApprovalNote('');
                                }}
                                className="btn btn-primary btn-xs"
                                title="Phê duyệt yêu cầu này"
                              >
                                <UserCheck size={13} />
                                <span>Duyệt</span>
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingRequest(req);
                                  setRejectionReason('');
                                }}
                                className="btn btn-secondary btn-xs text-danger"
                                title="Từ chối yêu cầu này"
                              >
                                <UserX size={13} />
                                <span>Từ chối</span>
                              </button>
                            </div>
                          ) : (
                            <span className="font-mono text-xs text-muted">
                              Đã xử lý
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* =========================================================
          TAB 3: DISPUTES & REPORTS
          ========================================================= */}
      {activeTab === 'DISPUTES' && (
        <>
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="stat-label">TỔNG SỐ KHIẾU NẠI</div>
              <div className="stat-value">{totalReports}</div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-label">ĐANG CHỜ THỤ LÝ</div>
              <div className="stat-value text-amber-600">{openReports}</div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-label">ĐANG ĐIỀU TRA ON-CHAIN</div>
              <div className="stat-value text-blue-600">{inReviewReports}</div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-label">ĐÃ XỬ LÝ HOÀN TẤT</div>
              <div className="stat-value text-emerald-600">{resolvedReports}</div>
            </div>
          </div>

          <div className="admin-section">
            <div className="admin-section-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-serif font-bold text-sm">
                <Gavel size={16} />
                <span>Hồ sơ Khiếu nại Sở hữu Trí tuệ</span>
              </div>

              {/* Status Filters */}
              <div className="pills-group">
                {(['ALL', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`pill-btn ${statusFilter === st ? 'active' : ''}`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {reportsError && (
              <div className="p-6 text-center text-sm text-rose-600 flex items-center justify-center gap-2">
                <AlertCircle size={16} />
                <span>{reportsError}</span>
              </div>
            )}

            {reportsLoading ? (
              <div className="p-12 text-center text-muted font-mono text-xs">
                Đang tải dữ liệu hồ sơ khiếu nại...
              </div>
            ) : reports.length === 0 ? (
              <div className="p-12 text-center text-muted text-sm">
                Không tìm thấy khiếu nại nào theo bộ lọc đã chọn.
              </div>
            ) : (
              <div className="invitations-table-wrapper">
                <table className="invitations-table">
                  <thead>
                    <tr>
                      <th>MÃ HỒ SƠ</th>
                      <th>NGƯỜI KHIẾU NẠI</th>
                      <th>TÁC PHẨM</th>
                      <th>LÝ DO</th>
                      <th>TRẠNG THÁI</th>
                      <th>NGÀY GỬI</th>
                      <th className="text-right">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.reportId} className="hover:bg-muted/10 transition-colors">
                        <td className="font-mono text-xs text-accent font-bold">
                          {r.reportId.substring(0, 8)}...
                        </td>
                        <td className="text-xs">
                          <span className="font-medium text-foreground block">
                            {r.reporterName || 'Người dùng'}
                          </span>
                          <span className="text-muted text-[11px] font-mono">
                            {r.reporterEmail || 'N/A'}
                          </span>
                        </td>
                        <td className="text-xs max-w-[200px] truncate">
                          {r.bookTitle ? (
                            <Link to={`/book/${r.bookId}`} className="hover:underline font-medium">
                              {r.bookTitle}
                            </Link>
                          ) : (
                            <span className="text-muted">Chỉ định Record ID</span>
                          )}
                          {r.recordNumber && (
                            <span className="block text-[11px] font-mono text-muted">
                              {r.recordNumber}
                            </span>
                          )}
                        </td>
                        <td className="text-xs">
                          <span className="font-mono text-[11px] bg-muted/20 px-2 py-0.5 rounded">
                            {r.reason}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge status-${r.status.toLowerCase()}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="text-xs text-muted font-mono">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => handleOpenReportDetail(r.reportId)}
                            className="btn btn-secondary btn-xs flex items-center gap-1.5 ml-auto"
                          >
                            <span>Thụ lý</span>
                            <ExternalLink size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* =========================================================
          TAB 3: SMART CONTRACT GOVERNANCE & CIRCUIT BREAKER
          ========================================================= */}
      {activeTab === 'GOVERNANCE' && (
        <div className="space-y-6 max-w-4xl">
          {circuitSuccessMsg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-600 flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{circuitSuccessMsg}</span>
            </div>
          )}

          {circuitError && (
            <div className="p-4 bg-accent/10 border border-accent/30 rounded text-xs text-accent flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{circuitError}</span>
            </div>
          )}

          {circuitLoading ? (
            <div className="p-12 text-center text-muted font-mono text-xs">
              Đang kết nối JSON-RPC Hardhat Local...
            </div>
          ) : circuitBreaker ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contract Information Card */}
              <div className="archival-border bg-surface p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b">
                  <ShieldCheck size={20} className="text-accent" />
                  <h3 className="serif font-bold text-lg">Thông số Sổ cái Bản quyền</h3>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div>
                    <span className="text-muted block mb-1">SMART CONTRACT ADDRESS:</span>
                    <span className="font-bold text-foreground break-all">
                      {circuitBreaker.contractAddress}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted block mb-1">MẠNG LƯỚI / CHAIN ID:</span>
                    <span className="font-bold">
                      Hardhat Local (ID: {circuitBreaker.chainId})
                    </span>
                  </div>

                  <div>
                    <span className="text-muted block mb-1">TỔNG SỐ HỒ SƠ ON-CHAIN:</span>
                    <span className="text-xl font-bold text-accent">
                      {circuitBreaker.totalRecords} bản ghi
                    </span>
                  </div>

                  <div>
                    <span className="text-muted block mb-1">VÍ QUẢN TRỊ VIÊN (ADMIN SIGNER):</span>
                    <span className="text-muted break-all">
                      0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (Account #0)
                    </span>
                  </div>
                </div>
              </div>

              {/* Circuit Breaker Emergency Control Card */}
              <div className="archival-border bg-surface p-6 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 pb-3 border-b">
                    <AlertTriangle size={20} className={circuitBreaker.isPaused ? 'text-accent' : 'text-emerald-600'} />
                    <h3 className="serif font-bold text-lg">Circuit Breaker (Ngắt mạch)</h3>
                  </div>

                  <div className="py-4 text-center space-y-2">
                    <span className="text-xs text-muted block uppercase font-mono tracking-wider">
                      TRẠNG THÁI HỆ THỐNG
                    </span>
                    {circuitBreaker.isPaused ? (
                      <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-accent/15 border border-accent text-accent font-mono font-bold text-sm">
                        <PauseCircle size={16} />
                        <span>PAUSED (ĐÃ TẠM DỪNG ĐĂNG KÝ)</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-emerald-500/15 border border-emerald-500 text-emerald-600 font-mono font-bold text-sm">
                        <PlayCircle size={16} />
                        <span>OPERATIONAL (ĐANG HOẠT ĐỘNG)</span>
                      </div>
                    )}
                    <p className="text-xs text-muted leading-relaxed pt-2">
                      {circuitBreaker.isPaused
                        ? 'Smart Contract hiện đang trong trạng thái ngắt mạch khẩn cấp. Mọi giao dịch registerCopyright() mới đều sẽ bị revert bảo đảm an toàn.'
                        : 'Hệ thống đang hoạt động bình thường, sẵn sàng ký duyệt và xác nhận các giao dịch đăng ký bản quyền mới.'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  {circuitBreaker.isPaused ? (
                    <button
                      onClick={() => handleToggleCircuitBreaker(false)}
                      disabled={circuitToggling}
                      className="btn-primary w-full py-3 text-xs flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <PlayCircle size={16} />
                      <span>{circuitToggling ? 'Đang thực hiện...' : 'Khôi phục hoạt động (Unpause)'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleCircuitBreaker(true)}
                      disabled={circuitToggling}
                      className="btn-primary w-full py-3 text-xs flex items-center justify-center gap-2 bg-accent hover:bg-accent/90"
                    >
                      <PauseCircle size={16} />
                      <span>{circuitToggling ? 'Đang thực hiện...' : 'Kích hoạt Circuit Breaker (Emergency Pause)'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* =========================================================
          REPORT DETAIL & ON-CHAIN DISPUTE DRAWER / MODAL
          ========================================================= */}
      {selectedReport && (
        <div className="report-modal-overlay" onClick={() => setSelectedReport(null)}>
          <div
            className="report-modal-dialog archival-border bg-surface max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gavel size={20} className="text-accent" />
                <div>
                  <h3 className="serif text-lg font-bold">
                    Hồ sơ Khiếu nại #{selectedReport.reportId.substring(0, 8)}
                  </h3>
                  <span className={`status-badge status-${selectedReport.status.toLowerCase()} text-[11px]`}>
                    Trạng thái: {selectedReport.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 text-muted hover:text-foreground rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {onChainSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-600 flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{onChainSuccessMsg}</span>
                </div>
              )}

              {onChainError && (
                <div className="p-3 bg-accent/10 border border-accent/30 rounded text-xs text-accent flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{onChainError}</span>
                </div>
              )}

              {/* Statement & Details Card */}
              <div className="archival-border p-4 bg-muted/10 space-y-3 text-xs font-mono">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted">LÝ DO KHIẾU NẠI:</span>
                  <span className="font-bold text-accent">{selectedReport.reason}</span>
                </div>
                {selectedReport.bookTitle && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted">TÁC PHẨM LIÊN QUAN:</span>
                    <span className="font-medium text-foreground">{selectedReport.bookTitle}</span>
                  </div>
                )}
                {selectedReport.recordNumber && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted">MÃ BẢN GHI ON-CHAIN:</span>
                    <span className="font-bold">{selectedReport.recordNumber}</span>
                  </div>
                )}
                {selectedReport.onChainStatus && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted">TRẠNG THÁI ON-CHAIN HIỆN TẠI:</span>
                    <span className="font-bold text-accent">{selectedReport.onChainStatus}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted block mb-1">NỘI DUNG KHIẾU NẠI & BẰNG CHỨNG:</span>
                  <div className="p-3 bg-surface archival-border text-foreground font-sans leading-relaxed text-xs">
                    {selectedReport.description}
                  </div>
                </div>
              </div>

              {/* On-Chain Execution Actions Card */}
              {selectedReport.copyrightRecordId && (
                <div className="archival-border p-4 bg-ground space-y-3">
                  <div className="flex items-center gap-2 text-xs font-serif font-bold text-foreground">
                    <ShieldCheck size={16} className="text-accent" />
                    <span>Thao tác Trực tiếp lên Smart Contract (On-Chain Governance)</span>
                  </div>

                  <p className="text-[11px] text-muted">
                    Hội đồng quản trị có thẩm quyền cập nhật trạng thái bản quyền trên sổ cái blockchain Hardhat Local.
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setOnChainAction('DISPUTE')}
                      className="btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5 border-amber-500/30 text-amber-700 hover:bg-amber-500/10"
                    >
                      <AlertTriangle size={13} />
                      <span>Đánh dấu Tranh chấp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOnChainAction('RESOLVE_ACTIVE')}
                      className="btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10"
                    >
                      <CheckCircle2 size={13} />
                      <span>Giải quyết: Khôi phục Hiệu lực</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOnChainAction('RESOLVE_REVOKE')}
                      className="btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5 border-accent/30 text-accent hover:bg-accent/10"
                    >
                      <Ban size={13} />
                      <span>Giải quyết: Thu hồi Vi phạm</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOnChainAction('REVOKE')}
                      className="btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5 border-rose-600/30 text-rose-600 hover:bg-rose-600/10"
                    >
                      <X size={13} />
                      <span>Thu hồi Trực tiếp</span>
                    </button>
                  </div>

                  {/* Sub-form when an on-chain action is selected */}
                  {onChainAction && (
                    <div className="mt-4 p-4 border border-accent/30 rounded bg-surface space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-accent">
                        <span>Xác nhận phát sóng giao dịch: [{onChainAction}]</span>
                        <button
                          onClick={() => setOnChainAction(null)}
                          className="text-muted hover:text-foreground"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={onChainReason}
                        onChange={(e) => setOnChainReason(e.target.value)}
                        placeholder="Nhập căn cứ pháp lý / lý do on-chain (tối thiểu 5 ký tự)..."
                        className="form-input archival-border w-full p-2.5 text-xs bg-ground font-mono"
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setOnChainAction(null)}
                          className="btn-secondary text-xs px-3 py-1.5"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={handleExecuteOnChain}
                          disabled={onChainExecuting}
                          className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5"
                        >
                          {onChainExecuting ? (
                            <span>Đang ký giao dịch...</span>
                          ) : (
                            <>
                              <Gavel size={13} />
                              <span>Xác nhận Ký & Phát sóng</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action History Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-serif font-bold text-foreground">
                  Lịch sử Xử lý & Ghi chú Hồ sơ ({selectedReport.actions?.length || 0})
                </h4>

                <div className="space-y-2">
                  {selectedReport.actions && selectedReport.actions.length > 0 ? (
                    selectedReport.actions.map((act) => (
                      <div key={act.reportActionId} className="p-3 bg-muted/15 archival-border text-xs space-y-1">
                        <div className="flex justify-between font-mono text-[11px]">
                          <span className="font-bold text-accent">{act.action}</span>
                          <span className="text-muted">
                            {new Date(act.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {act.note && (
                          <p className="text-muted text-[11px] leading-relaxed break-all">
                            {act.note}
                          </p>
                        )}
                        <span className="text-[10px] text-muted block">
                          Thực hiện bởi: {act.actorName || 'Hệ thống'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted p-2">Chưa có hành động nào được ghi nhận.</div>
                  )}
                </div>
              </div>

              {/* Add Note / Action Form */}
              <form onSubmit={handleAddAction} className="pt-4 border-t space-y-3">
                <h4 className="text-xs font-serif font-bold text-foreground">
                  Cập nhật Tiến trình Điều tra
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-muted mb-1">
                      HÀNH ĐỘNG
                    </label>
                    <select
                      value={selectedActionType}
                      onChange={(e) => setSelectedActionType(e.target.value as any)}
                      className="form-input archival-border w-full p-2 text-xs bg-surface"
                    >
                      <option value="START_REVIEW">START_REVIEW (Bắt đầu thụ lý)</option>
                      <option value="REQUEST_INFO">REQUEST_INFO (Yêu cầu thêm tài liệu)</option>
                      <option value="NOTE">NOTE (Ghi chú điều tra)</option>
                      <option value="DISMISS">DISMISS (Bác bỏ khiếu nại)</option>
                      <option value="RESOLVE">RESOLVE (Hoàn tất giải quyết)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-muted mb-1">
                      GHI CHÚ HỘI ĐỒNG
                    </label>
                    <input
                      type="text"
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder="Ghi chú kết quả đối soát..."
                      className="form-input archival-border w-full p-2 text-xs bg-surface"
                    />
                  </div>
                </div>

                {actionError && (
                  <div className="text-xs text-accent">{actionError}</div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={actionSubmitting}
                    className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>{actionSubmitting ? 'Đang lưu...' : 'Lưu Tiến trình'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Key size={18} className="text-accent" />
                <h3 className="serif font-bold text-lg">{t('admin.generateTitle')}</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted hover:text-primary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="modal-body">
              {createError && (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-sm text-xs mb-4">
                  {createError}
                </div>
              )}

              <div className="form-group mb-4">
                <label className="form-label">{t('admin.validityPeriod')}</label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="form-select"
                >
                  <option value={7}>7 {t('admin.days')}</option>
                  <option value={14}>14 {t('admin.days')}</option>
                  <option value={30}>30 {t('admin.days')}</option>
                  <option value={90}>90 {t('admin.days')}</option>
                  <option value={365}>365 {t('admin.days')}</option>
                </select>
              </div>

              <div className="form-group mb-4">
                <label className="form-label">{t('admin.maxUses')}</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={maxUses}
                  onChange={(e) => setMaxUses(Math.max(1, Number(e.target.value)))}
                  className="form-input"
                />
              </div>

              <div className="form-group mb-6">
                <label className="form-label">{t('admin.note')}</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('admin.notePlaceholder')}
                  rows={3}
                  className="form-input resize-none"
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  disabled={creating}
                >
                  {t('admin.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? t('admin.generating') : t('admin.generate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {createdResult && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <h3 className="serif font-bold text-lg">{t('admin.codeCreatedTitle')}</h3>
              </div>
              <button
                onClick={() => setCreatedResult(null)}
                className="text-muted hover:text-primary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="warning-callout mb-4">
                <Clock size={16} className="text-amber-600 shrink-0" />
                <div className="text-xs text-amber-800">{t('admin.codeWarning')}</div>
              </div>

              <div className="code-display-box mb-4">
                <div className="code-text font-mono text-lg font-bold">{createdResult.code}</div>
                <button onClick={handleCopyCode} className="btn-copy" title="Copy to clipboard">
                  {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                </button>
              </div>

              <div className="code-metadata">
                <div className="meta-row">
                  <span className="meta-label">{t('admin.validUntil')}:</span>
                  <span className="meta-val font-mono">
                    {new Date(createdResult.expiresAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">{t('admin.totalUses')}:</span>
                  <span className="meta-val font-mono">{createdResult.maxUses}</span>
                </div>
                {createdResult.note && (
                  <div className="meta-row">
                    <span className="meta-label">{t('admin.note')}:</span>
                    <span className="meta-val">{createdResult.note}</span>
                  </div>
                )}
              </div>

              <div className="modal-footer mt-6">
                <button
                  type="button"
                  onClick={() => setCreatedResult(null)}
                  className="btn btn-primary w-full"
                >
                  {t('admin.done')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {approvingRequest && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <UserCheck size={18} className="text-emerald-600" />
                <h3 className="serif font-bold text-lg">{t('admin.approveModalTitle')}</h3>
              </div>
              <button
                onClick={() => setApprovingRequest(null)}
                className="text-muted hover:text-primary transition-colors"
                disabled={approvingSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApproveAuthorRequest} className="modal-body">
              <div className="p-3 mb-4 rounded-sm bg-surface-secondary border border-border text-xs leading-relaxed">
                <div className="font-bold text-ink mb-1">{approvingRequest.userDisplayName} ({approvingRequest.userEmail})</div>
                <div className="flex items-center gap-1.5 text-accent font-serif text-sm font-semibold mb-1">
                  <Feather size={14} />
                  <span>Bút danh: {approvingRequest.penName}</span>
                </div>
                {approvingRequest.bio && <p className="text-muted text-[11px]">{approvingRequest.bio}</p>}
              </div>

              <p className="text-xs text-muted mb-4">
                {t('admin.approveModalDesc')}
              </p>

              <div className="form-group mb-6">
                <label className="form-label">{t('admin.note')}</label>
                <textarea
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder={t('admin.approvalNotePlaceholder')}
                  rows={3}
                  className="form-input resize-none"
                  disabled={approvingSubmitting}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setApprovingRequest(null)}
                  className="btn btn-secondary"
                  disabled={approvingSubmitting}
                >
                  {t('admin.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                  disabled={approvingSubmitting}
                >
                  {approvingSubmitting ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  <span>{approvingSubmitting ? 'Đang duyệt...' : t('admin.approveConfirmBtn')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingRequest && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <UserX size={18} className="text-rose-600" />
                <h3 className="serif font-bold text-lg">{t('admin.rejectModalTitle')}</h3>
              </div>
              <button
                onClick={() => setRejectingRequest(null)}
                className="text-muted hover:text-primary transition-colors"
                disabled={rejectingSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRejectAuthorRequest} className="modal-body">
              <div className="p-3 mb-4 rounded-sm bg-surface-secondary border border-border text-xs leading-relaxed">
                <div className="font-bold text-ink mb-1">{rejectingRequest.userDisplayName} ({rejectingRequest.userEmail})</div>
                <div className="flex items-center gap-1.5 text-rose-600 font-serif text-sm font-semibold">
                  <Feather size={14} />
                  <span>Bút danh: {rejectingRequest.penName}</span>
                </div>
              </div>

              <p className="text-xs text-muted mb-4">
                {t('admin.rejectModalDesc')}
              </p>

              <div className="form-group mb-6">
                <label className="form-label font-bold text-rose-700 dark:text-rose-400">
                  {t('admin.rejectReasonLabel')} *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={t('admin.rejectReasonPlaceholder')}
                  rows={3}
                  required
                  className="form-input resize-none border-rose-300 dark:border-rose-800"
                  disabled={rejectingSubmitting}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setRejectingRequest(null)}
                  className="btn btn-secondary"
                  disabled={rejectingSubmitting}
                >
                  {t('admin.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5"
                  disabled={rejectingSubmitting || !rejectionReason.trim()}
                >
                  {rejectingSubmitting ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Ban size={14} />
                  )}
                  <span>{rejectingSubmitting ? 'Đang từ chối...' : t('admin.rejectConfirmBtn')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
