import { reportRepository } from '../repositories/reportRepository.js';
import { copyrightRepository } from '../repositories/copyrightRepository.js';
import { bookRepository } from '../repositories/bookRepository.js';
import { blockchainClient } from '../blockchain/contractClient.js';
import { uuidToBytes32 } from '../blockchain/utils.js';
import type {
  ReportReason,
  ReportStatus,
  ReportActionType,
  DisputeActionType,
  ReportDto,
  ReportActionDto,
} from '../types/index.js';

const VALID_REASONS: ReportReason[] = [
  'PLAGIARISM',
  'UNLICENSED_DISTRIBUTION',
  'WRONG_AUTHOR',
  'FRAUDULENT_RECORD',
  'INACCURATE_METADATA',
  'OTHER',
];

export class ReportService {
  /**
   * User submits a report / copyright infringement notice.
   */
  async submitReport(
    reporterUserId: string | null,
    data: {
      bookId?: string | null;
      copyrightRecordId?: string | null;
      reason: string;
      description: string;
    }
  ): Promise<ReportDto> {
    if (!data.bookId && !data.copyrightRecordId) {
      throw new Error('Either bookId or copyrightRecordId must be provided.');
    }

    if (!data.reason || !VALID_REASONS.includes(data.reason as ReportReason)) {
      throw new Error(`Invalid report reason. Valid options: ${VALID_REASONS.join(', ')}`);
    }

    if (!data.description || data.description.trim().length < 10) {
      throw new Error('Description must be at least 10 characters detailing the issue.');
    }

    let resolvedBookId = data.bookId || null;
    let resolvedCopyrightRecordId = data.copyrightRecordId || null;

    if (resolvedBookId) {
      const book = await bookRepository.getById(resolvedBookId);
      if (!book) {
        throw new Error(`Target book with ID ${resolvedBookId} does not exist.`);
      }

      // If copyrightRecordId was not passed, see if there is an active on-chain record for this book
      if (!resolvedCopyrightRecordId) {
        const records = await copyrightRepository.getCopyrightRecordsByBookId(resolvedBookId);
        const activeRecord = records.find((r) => r.recordStatus === 'ON_CHAIN') || records[0];
        if (activeRecord) {
          resolvedCopyrightRecordId = activeRecord.copyrightRecordId;
        }
      }
    }

    if (resolvedCopyrightRecordId) {
      const record = await copyrightRepository.getCopyrightRecordById(resolvedCopyrightRecordId);
      if (!record) {
        throw new Error(`Target copyright record with ID ${resolvedCopyrightRecordId} does not exist.`);
      }
      if (!resolvedBookId) {
        resolvedBookId = record.BookId;
      }
    }

    const created = await reportRepository.createReport({
      reporterUserId,
      bookId: resolvedBookId,
      copyrightRecordId: resolvedCopyrightRecordId,
      reason: data.reason as ReportReason,
      description: data.description.trim(),
    });

    if (reporterUserId) {
      await reportRepository.createReportAction({
        reportId: created.ReportId,
        actorUserId: reporterUserId,
        action: 'NOTE',
        note: 'Report officially submitted to the library board.',
      });
    }

    const detailed = await reportRepository.getReportById(created.ReportId);
    return this.mapToDto(detailed || created);
  }

  /**
   * Retrieves reports submitted by the logged-in user.
   */
  async getUserReports(userId: string): Promise<ReportDto[]> {
    const records = await reportRepository.getReportsByReporter(userId);
    return records.map((r) => this.mapToDto(r));
  }

  /**
   * Retrieves reports for administrative review with pagination and filtering.
   */
  async getAdminReports(filters: {
    status?: ReportStatus | string;
    bookId?: string;
    copyrightRecordId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: ReportDto[]; total: number; page: number; limit: number }> {
    const { items, total } = await reportRepository.getReports(filters);
    return {
      items: items.map((r) => this.mapToDto(r)),
      total,
      page: filters.page || 1,
      limit: filters.limit || 20,
    };
  }

  /**
   * Retrieves detailed report information including action timeline and on-chain status.
   */
  async getReportDetails(reportId: string): Promise<ReportDto> {
    const report = await reportRepository.getReportById(reportId);
    if (!report) {
      throw new Error(`Report with ID ${reportId} not found.`);
    }

    const actions = await reportRepository.getReportActions(reportId);
    const dto = this.mapToDto(report);
    dto.actions = actions.map((a) => ({
      reportActionId: a.ReportActionId,
      reportId: a.ReportId,
      actorUserId: a.ActorUserId,
      actorName: a.ActorName,
      action: a.Action as any,
      note: a.Note,
      createdAt: a.CreatedAt,
    }));

    // If there is an associated copyright record, query live on-chain status
    if (report.CopyrightRecordId) {
      try {
        const recordBytes32 = uuidToBytes32(report.CopyrightRecordId);
        const onChain = await blockchainClient.getCopyright(recordBytes32);
        dto.onChainStatus = onChain.status;
      } catch {
        // Silently catch if not registered on-chain yet
      }
    }

    return dto;
  }

  /**
   * Admin adds an action or note to a report.
   */
  async addReportAction(
    reportId: string,
    adminUserId: string,
    action: ReportActionType,
    note?: string
  ): Promise<ReportActionDto> {
    const report = await reportRepository.getReportById(reportId);
    if (!report) {
      throw new Error(`Report with ID ${reportId} not found.`);
    }

    // Determine status transition
    let newStatus: ReportStatus | null = null;
    if (action === 'START_REVIEW' && report.Status === 'OPEN') {
      newStatus = 'IN_REVIEW';
    } else if (action === 'DISMISS') {
      newStatus = 'DISMISSED';
    } else if (action === 'RESOLVE') {
      newStatus = 'RESOLVED';
    }

    if (newStatus && newStatus !== report.Status) {
      await reportRepository.updateReportStatus(reportId, newStatus, adminUserId);
    }

    const createdAction = await reportRepository.createReportAction({
      reportId,
      actorUserId: adminUserId,
      action,
      note: note?.trim() || null,
    });

    return {
      reportActionId: createdAction.ReportActionId,
      reportId: createdAction.ReportId,
      actorUserId: createdAction.ActorUserId,
      action: createdAction.Action as ReportActionType,
      note: createdAction.Note,
      createdAt: createdAction.CreatedAt,
    };
  }

  /**
   * Admin executes an on-chain status update (Dispute, Resolve, or Revoke).
   */
  async executeDisputeOnChain(
    reportId: string,
    adminUserId: string,
    actionType: DisputeActionType,
    reason: string
  ): Promise<{
    txHash: string;
    blockNumber: number;
    newStatus: string;
    report: ReportDto;
  }> {
    if (!reason || reason.trim().length < 5) {
      throw new Error('A clear justification reason (minimum 5 characters) is required for on-chain status update.');
    }

    const report = await reportRepository.getReportById(reportId);
    if (!report) {
      throw new Error(`Report with ID ${reportId} not found.`);
    }

    if (!report.CopyrightRecordId) {
      throw new Error('This report is not linked to a copyright record; cannot perform on-chain operations.');
    }

    const record = await copyrightRepository.getCopyrightRecordById(report.CopyrightRecordId);
    if (!record) {
      throw new Error(`Copyright record ${report.CopyrightRecordId} not found.`);
    }

    const recordBytes32 = uuidToBytes32(report.CopyrightRecordId);
    let txHash: string;
    let blockNumber: number;
    let newRecordStatus: string;

    switch (actionType) {
      case 'DISPUTE': {
        const result = await blockchainClient.disputeCopyright(recordBytes32, reason.trim());
        txHash = result.txHash;
        blockNumber = result.blockNumber;
        newRecordStatus = 'DISPUTED';

        await reportRepository.updateCopyrightRecordStatus(report.CopyrightRecordId, 'DISPUTED');
        await reportRepository.updateReportStatus(reportId, 'IN_REVIEW', adminUserId);
        break;
      }
      case 'RESOLVE_ACTIVE': {
        const result = await blockchainClient.resolveDispute(recordBytes32, 'ACTIVE', reason.trim());
        txHash = result.txHash;
        blockNumber = result.blockNumber;
        newRecordStatus = 'ON_CHAIN';

        await reportRepository.updateCopyrightRecordStatus(report.CopyrightRecordId, 'ON_CHAIN');
        await reportRepository.updateReportStatus(reportId, 'RESOLVED', adminUserId);
        break;
      }
      case 'RESOLVE_REVOKE': {
        const onChain = await blockchainClient.getCopyright(recordBytes32);
        let result: { txHash: string; blockNumber: number };
        if (onChain.status === 'DISPUTED') {
          result = await blockchainClient.resolveDispute(recordBytes32, 'REVOKED', reason.trim());
        } else {
          result = await blockchainClient.revokeCopyright(recordBytes32, reason.trim());
        }
        txHash = result.txHash;
        blockNumber = result.blockNumber;
        newRecordStatus = 'WITHDRAWN';

        await reportRepository.updateCopyrightRecordStatus(report.CopyrightRecordId, 'WITHDRAWN');
        await reportRepository.updateReportStatus(reportId, 'RESOLVED', adminUserId);
        break;
      }
      case 'REVOKE': {
        const result = await blockchainClient.revokeCopyright(recordBytes32, reason.trim());
        txHash = result.txHash;
        blockNumber = result.blockNumber;
        newRecordStatus = 'WITHDRAWN';

        await reportRepository.updateCopyrightRecordStatus(report.CopyrightRecordId, 'WITHDRAWN');
        await reportRepository.updateReportStatus(reportId, 'RESOLVED', adminUserId);
        break;
      }
      default:
        throw new Error(`Unsupported dispute action type: ${actionType}`);
    }

    // Record on-chain transaction in dbo.BlockchainTransactions (idempotent)
    try {
      await copyrightRepository.createBlockchainTransaction({
        copyrightRecordId: report.CopyrightRecordId,
        chainId: blockchainClient.chainId,
        transactionType: `DISPUTE_${actionType}`,
        txHash,
        contractAddress: blockchainClient.contractAddress,
        status: 'CONFIRMED',
      });
    } catch {
      // Transaction hash already exists, update record
      await copyrightRepository.updateBlockchainTransaction({
        copyrightRecordId: report.CopyrightRecordId,
        txHash,
        blockNumber,
        status: 'CONFIRMED',
        contractAddress: blockchainClient.contractAddress,
      });
    }

    // Record audit action in dbo.ReportActions
    await reportRepository.createReportAction({
      reportId,
      actorUserId: adminUserId,
      action: actionType === 'DISPUTE' ? 'START_REVIEW' : 'RESOLVE',
      note: `On-chain action [${actionType}] executed successfully. TxHash: ${txHash}. Block: ${blockNumber}. Reason: ${reason.trim()}`,
    });

    const updatedReport = await this.getReportDetails(reportId);
    return {
      txHash,
      blockNumber,
      newStatus: newRecordStatus,
      report: updatedReport,
    };
  }

  /**
   * Queries circuit breaker (pause) status and stats.
   */
  async getCircuitBreakerStatus(): Promise<{
    isPaused: boolean;
    contractAddress: string;
    chainId: number;
    totalRecords: number;
  }> {
    const isPaused = await blockchainClient.isPaused();
    const totalRecords = await blockchainClient.totalRecords();
    return {
      isPaused,
      contractAddress: blockchainClient.contractAddress,
      chainId: blockchainClient.chainId,
      totalRecords,
    };
  }

  /**
   * Admin triggers pause/unpause circuit breaker.
   */
  async toggleCircuitBreaker(
    adminUserId: string,
    pauseState: boolean
  ): Promise<{ isPaused: boolean; txHash: string; blockNumber: number }> {
    let result: { txHash: string; blockNumber: number };
    if (pauseState) {
      result = await blockchainClient.pause();
    } else {
      result = await blockchainClient.unpause();
    }

    return {
      isPaused: pauseState,
      txHash: result.txHash,
      blockNumber: result.blockNumber,
    };
  }

  private mapToDto(r: any): ReportDto {
    return {
      reportId: r.ReportId,
      reporterUserId: r.ReporterUserId || null,
      reporterName: r.ReporterName,
      reporterEmail: r.ReporterEmail,
      bookId: r.BookId || null,
      bookTitle: r.BookTitle,
      copyrightRecordId: r.CopyrightRecordId || null,
      recordNumber: r.RecordNumber,
      recordStatus: r.CopyrightRecordStatus,
      contentHash: r.Sha256,
      reason: r.Reason as ReportReason,
      description: r.Description,
      status: r.Status as ReportStatus,
      handledByUserId: r.HandledByUserId || null,
      handledByName: r.HandledByName,
      createdAt: r.CreatedAt,
      updatedAt: r.UpdatedAt,
    };
  }
}

export const reportService = new ReportService();
