import { useState } from 'react';
import {
  X,
  AlertTriangle,
  Send,
  CheckCircle2,
  FileWarning,
  Copy,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { reportApi, type ApiReport } from '../../services/api';
import { useTranslation } from '../../contexts/I18nContext';
import './ReportModal.css';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId?: string | null;
  bookTitle?: string | null;
  copyrightRecordId?: string | null;
  contentHash?: string | null;
  onSuccess?: (report: ApiReport) => void;
}

export function ReportModal({
  isOpen,
  onClose,
  bookId,
  bookTitle,
  copyrightRecordId,
  contentHash,
  onSuccess,
}: ReportModalProps) {
  const { t } = useTranslation();

  const [reason, setReason] = useState<string>('PLAGIARISM');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedReport, setSubmittedReport] = useState<ApiReport | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 10) {
      setError(t('report.errorMinDesc') || 'Vui lòng cung cấp mô tả chi tiết tối thiểu 10 ký tự.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const report = await reportApi.submit({
        bookId: bookId || null,
        copyrightRecordId: copyrightRecordId || null,
        reason,
        description: description.trim(),
      });

      setSubmittedReport(report);
      if (onSuccess) onSuccess(report);
    } catch (err: any) {
      setError(err.message || 'Gửi báo cáo khiếu nại thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleClose = () => {
    setSubmittedReport(null);
    setDescription('');
    setReason('PLAGIARISM');
    setError(null);
    onClose();
  };

  return (
    <div className="report-modal-overlay" onClick={handleClose}>
      <div className="report-modal-dialog archival-border bg-surface" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="report-modal-icon-badge">
              <ShieldAlert size={20} className="text-accent" />
            </div>
            <div>
              <h2 className="serif text-xl font-bold leading-tight">
                {t('report.modalTitle') || 'Khiếu nại & Báo cáo Vi phạm Bản quyền'}
              </h2>
              <p className="text-xs text-muted">
                {t('report.modalSubtitle') || 'Hội đồng Quản trị Thư viện sẽ thụ lý và xác minh bằng chứng'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-muted hover:text-foreground rounded transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {submittedReport ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h3 className="serif text-2xl font-bold">
                {t('report.successTitle') || 'Đã tiếp nhận Hồ sơ Khiếu nại'}
              </h3>
              <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
                {t('report.successDesc') ||
                  'Khiếu nại của bạn đã được ghi nhận vào hệ thống lưu trữ với mã số định danh bên dưới. Ban quản trị sẽ đối soát bằng chứng mật mã và tiến hành điều tra on-chain theo quy chế thư viện.'}
              </p>
            </div>

            <div className="report-summary-box archival-border p-4 bg-muted/20 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted font-mono">{t('report.reportId') || 'Mã hồ sơ'}:</span>
                <div className="flex items-center gap-2 font-mono font-bold">
                  <span>{submittedReport.reportId}</span>
                  <button
                    onClick={() => handleCopyId(submittedReport.reportId)}
                    className="p-1 hover:text-accent transition-colors"
                    title="Copy Report ID"
                  >
                    {copiedId ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              {submittedReport.bookTitle && (
                <div className="flex items-center justify-between">
                  <span className="text-muted">{t('report.targetWork') || 'Tác phẩm'}:</span>
                  <span className="font-medium truncate max-w-[240px]">{submittedReport.bookTitle}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted">{t('report.status') || 'Trạng thái'}:</span>
                <span className="font-mono text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded font-bold">
                  {submittedReport.status}
                </span>
              </div>
            </div>

            <button onClick={handleClose} className="btn-primary w-full py-3 text-sm">
              {t('common.close') || 'Đóng cửa sổ'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3.5 bg-accent/10 border border-accent/20 rounded flex items-start gap-3 text-xs text-accent">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Target Information Card */}
            <div className="report-target-card archival-border p-3.5 bg-muted/15 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-muted font-mono text-[11px]">
                <FileWarning size={14} />
                <span>{t('report.targetSummary') || 'Đối tượng bị khiếu nại'}:</span>
              </div>
              {bookTitle && (
                <div className="font-medium text-sm text-foreground">
                  {bookTitle}
                </div>
              )}
              {copyrightRecordId && (
                <div className="font-mono text-[11px] text-muted truncate">
                  Record ID: {copyrightRecordId}
                </div>
              )}
              {contentHash && (
                <div className="font-mono text-[11px] text-muted truncate">
                  SHA-256: {contentHash}
                </div>
              )}
            </div>

            {/* Dispute Reason */}
            <div>
              <label className="block text-xs font-mono font-medium mb-1.5">
                {t('report.reasonLabel') || 'Lý do khiếu nại'} <span className="text-accent">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full form-input archival-border p-2.5 text-xs bg-surface"
              >
                <option value="PLAGIARISM">
                  {t('report.reasonPlagiarism') || 'Đạo văn / Sao chép trái phép không trích dẫn'}
                </option>
                <option value="UNLICENSED_DISTRIBUTION">
                  {t('report.reasonUnlicensed') || 'Phân phối tác phẩm số không có sự đồng ý của tác giả'}
                </option>
                <option value="WRONG_AUTHOR">
                  {t('report.reasonWrongAuthor') || 'Mạo danh tác giả / Đăng ký thay mặt người khác trái phép'}
                </option>
                <option value="FRAUDULENT_RECORD">
                  {t('report.reasonFraudulent') || 'Bản ghi on-chain giả mạo / Mã băm tệp không tương xứng'}
                </option>
                <option value="INACCURATE_METADATA">
                  {t('report.reasonInaccurateMetadata') || 'Thông tin metadata, năm xuất bản hoặc tên gốc sai lệch'}
                </option>
                <option value="OTHER">{t('report.reasonOther') || 'Lý do khác'}</option>
              </select>
            </div>

            {/* Detailed Description */}
            <div>
              <label className="block text-xs font-mono font-medium mb-1.5">
                {t('report.descriptionLabel') || 'Chi tiết & Bằng chứng đối chiếu'}{' '}
                <span className="text-accent">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                className="w-full form-input archival-border p-3 text-xs bg-surface leading-relaxed"
                placeholder={
                  t('report.descriptionPlaceholder') ||
                  'Mô tả chi tiết hành vi vi phạm, cung cấp đường dẫn bài báo, sách gốc, số trang hoặc bằng chứng sở hữu trí tuệ hợp pháp...'
                }
              />
              <span className="text-[10px] text-muted block mt-1">
                {t('report.minCharsHint') || 'Tối thiểu 10 ký tự. Vui lòng cung cấp thông tin trung thực và khách quan.'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="btn-secondary text-xs px-4 py-2"
              >
                {t('common.cancel') || 'Hủy bỏ'}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary text-xs px-5 py-2 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>{t('report.submitting') || 'Đang gửi hồ sơ...'}</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>{t('report.submitButton') || 'Gửi Khiếu nại'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
