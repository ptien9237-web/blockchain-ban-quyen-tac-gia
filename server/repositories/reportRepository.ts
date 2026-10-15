import sql from 'mssql';
import { getPool } from '../db/sqlServer.js';
import type {
  ReportRecord,
  ReportActionRecord,
  ReportStatus,
  ReportReason,
  ReportActionType,
  CopyrightRecordStatus,
} from '../types/index.js';

export interface ReportWithDetails extends ReportRecord {
  ReporterName?: string;
  ReporterEmail?: string;
  BookTitle?: string;
  RecordNumber?: string;
  CopyrightRecordStatus?: string;
  Sha256?: string;
  VersionNumber?: number;
  HandledByName?: string;
}

export class ReportRepository {
  /**
   * Creates a new report in dbo.Reports.
   */
  async createReport(data: {
    reporterUserId?: string | null;
    bookId?: string | null;
    copyrightRecordId?: string | null;
    reason: ReportReason | string;
    description: string;
  }): Promise<ReportRecord> {
    const pool = await getPool();
    const query = `
      INSERT INTO dbo.Reports (
        ReporterUserId,
        BookId,
        CopyrightRecordId,
        Reason,
        Description,
        Status,
        CreatedAt,
        UpdatedAt
      )
      OUTPUT
        INSERTED.ReportId,
        INSERTED.ReporterUserId,
        INSERTED.BookId,
        INSERTED.CopyrightRecordId,
        INSERTED.Reason,
        INSERTED.Description,
        INSERTED.Status,
        INSERTED.HandledByUserId,
        INSERTED.CreatedAt,
        INSERTED.UpdatedAt
      VALUES (
        @reporterUserId,
        @bookId,
        @copyrightRecordId,
        @reason,
        @description,
        'OPEN',
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
      );
    `;

    const request = pool.request();
    request.input('reporterUserId', sql.UniqueIdentifier, data.reporterUserId || null);
    request.input('bookId', sql.UniqueIdentifier, data.bookId || null);
    request.input('copyrightRecordId', sql.UniqueIdentifier, data.copyrightRecordId || null);
    request.input('reason', sql.VarChar(50), data.reason);
    request.input('description', sql.NVarChar(sql.MAX), data.description);

    const result = await request.query(query);
    return result.recordset[0] as ReportRecord;
  }

  /**
   * Retrieves a report by ID with enriched book, copyright, and user info.
   */
  async getReportById(reportId: string): Promise<ReportWithDetails | null> {
    const pool = await getPool();
    const query = `
      SELECT
        r.ReportId,
        r.ReporterUserId,
        r.BookId,
        r.CopyrightRecordId,
        r.Reason,
        r.Description,
        r.Status,
        r.HandledByUserId,
        r.CreatedAt,
        r.UpdatedAt,
        u.DisplayName AS ReporterName,
        u.Email AS ReporterEmail,
        b.Title AS BookTitle,
        cr.RecordNumber,
        cr.RecordStatus AS CopyrightRecordStatus,
        bf.Sha256,
        bf.VersionNumber,
        handler.DisplayName AS HandledByName
      FROM dbo.Reports r
      LEFT JOIN dbo.Users u ON r.ReporterUserId = u.UserId
      LEFT JOIN dbo.Books b ON r.BookId = b.BookId
      LEFT JOIN dbo.CopyrightRecords cr ON r.CopyrightRecordId = cr.CopyrightRecordId
      LEFT JOIN dbo.BookFiles bf ON cr.BookFileId = bf.BookFileId
      LEFT JOIN dbo.Users handler ON r.HandledByUserId = handler.UserId
      WHERE r.ReportId = @reportId;
    `;

    const result = await pool.request().input('reportId', sql.UniqueIdentifier, reportId).query(query);
    return (result.recordset[0] as ReportWithDetails) || null;
  }

  /**
   * Lists reports with optional status filtering and pagination.
   */
  async getReports(filters: {
    status?: ReportStatus | string;
    bookId?: string;
    copyrightRecordId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: ReportWithDetails[]; total: number }> {
    const pool = await getPool();
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 20));
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    if (filters.status) {
      whereClause += ' AND r.Status = @status';
    }
    if (filters.bookId) {
      whereClause += ' AND r.BookId = @bookId';
    }
    if (filters.copyrightRecordId) {
      whereClause += ' AND r.CopyrightRecordId = @copyrightRecordId';
    }

    const countQuery = `
      SELECT COUNT(*) AS Total
      FROM dbo.Reports r
      WHERE ${whereClause};
    `;

    const selectQuery = `
      SELECT
        r.ReportId,
        r.ReporterUserId,
        r.BookId,
        r.CopyrightRecordId,
        r.Reason,
        r.Description,
        r.Status,
        r.HandledByUserId,
        r.CreatedAt,
        r.UpdatedAt,
        u.DisplayName AS ReporterName,
        u.Email AS ReporterEmail,
        b.Title AS BookTitle,
        cr.RecordNumber,
        cr.RecordStatus AS CopyrightRecordStatus,
        bf.Sha256,
        bf.VersionNumber,
        handler.DisplayName AS HandledByName
      FROM dbo.Reports r
      LEFT JOIN dbo.Users u ON r.ReporterUserId = u.UserId
      LEFT JOIN dbo.Books b ON r.BookId = b.BookId
      LEFT JOIN dbo.CopyrightRecords cr ON r.CopyrightRecordId = cr.CopyrightRecordId
      LEFT JOIN dbo.BookFiles bf ON cr.BookFileId = bf.BookFileId
      LEFT JOIN dbo.Users handler ON r.HandledByUserId = handler.UserId
      WHERE ${whereClause}
      ORDER BY r.CreatedAt DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;

    const req = pool.request();
    if (filters.status) req.input('status', sql.VarChar(20), filters.status);
    if (filters.bookId) req.input('bookId', sql.UniqueIdentifier, filters.bookId);
    if (filters.copyrightRecordId) req.input('copyrightRecordId', sql.UniqueIdentifier, filters.copyrightRecordId);
    req.input('offset', sql.Int, offset);
    req.input('limit', sql.Int, limit);

    const countRes = await req.query(countQuery);
    const total = countRes.recordset[0]?.Total || 0;

    const selectRes = await req.query(selectQuery);
    return {
      items: selectRes.recordset as ReportWithDetails[],
      total,
    };
  }

  /**
   * Retrieves reports submitted by a specific user.
   */
  async getReportsByReporter(userId: string): Promise<ReportWithDetails[]> {
    const pool = await getPool();
    const query = `
      SELECT
        r.ReportId,
        r.ReporterUserId,
        r.BookId,
        r.CopyrightRecordId,
        r.Reason,
        r.Description,
        r.Status,
        r.HandledByUserId,
        r.CreatedAt,
        r.UpdatedAt,
        b.Title AS BookTitle,
        cr.RecordNumber,
        cr.RecordStatus AS CopyrightRecordStatus
      FROM dbo.Reports r
      LEFT JOIN dbo.Books b ON r.BookId = b.BookId
      LEFT JOIN dbo.CopyrightRecords cr ON r.CopyrightRecordId = cr.CopyrightRecordId
      WHERE r.ReporterUserId = @userId
      ORDER BY r.CreatedAt DESC;
    `;

    const result = await pool.request().input('userId', sql.UniqueIdentifier, userId).query(query);
    return result.recordset as ReportWithDetails[];
  }

  /**
   * Updates report status and handler.
   */
  async updateReportStatus(reportId: string, status: ReportStatus, handledByUserId: string): Promise<void> {
    const pool = await getPool();
    const query = `
      UPDATE dbo.Reports
      SET
        Status = @status,
        HandledByUserId = @handledByUserId,
        UpdatedAt = SYSUTCDATETIME()
      WHERE ReportId = @reportId;
    `;

    await pool
      .request()
      .input('reportId', sql.UniqueIdentifier, reportId)
      .input('status', sql.VarChar(20), status)
      .input('handledByUserId', sql.UniqueIdentifier, handledByUserId)
      .query(query);
  }

  /**
   * Appends an audit action to dbo.ReportActions.
   */
  async createReportAction(data: {
    reportId: string;
    actorUserId: string;
    action: ReportActionType | string;
    note?: string | null;
  }): Promise<ReportActionRecord> {
    const pool = await getPool();
    const query = `
      INSERT INTO dbo.ReportActions (
        ReportId,
        ActorUserId,
        Action,
        Note,
        CreatedAt
      )
      OUTPUT
        INSERTED.ReportActionId,
        INSERTED.ReportId,
        INSERTED.ActorUserId,
        INSERTED.Action,
        INSERTED.Note,
        INSERTED.CreatedAt
      VALUES (
        @reportId,
        @actorUserId,
        @action,
        @note,
        SYSUTCDATETIME()
      );
    `;

    const result = await pool
      .request()
      .input('reportId', sql.UniqueIdentifier, data.reportId)
      .input('actorUserId', sql.UniqueIdentifier, data.actorUserId)
      .input('action', sql.VarChar(30), data.action)
      .input('note', sql.NVarChar(sql.MAX), data.note || null)
      .query(query);

    return result.recordset[0] as ReportActionRecord;
  }

  /**
   * Retrieves all actions associated with a report in chronological order.
   */
  async getReportActions(reportId: string): Promise<(ReportActionRecord & { ActorName?: string })[]> {
    const pool = await getPool();
    const query = `
      SELECT
        ra.ReportActionId,
        ra.ReportId,
        ra.ActorUserId,
        ra.Action,
        ra.Note,
        ra.CreatedAt,
        u.DisplayName AS ActorName
      FROM dbo.ReportActions ra
      LEFT JOIN dbo.Users u ON ra.ActorUserId = u.UserId
      WHERE ra.ReportId = @reportId
      ORDER BY ra.CreatedAt ASC;
    `;

    const result = await pool.request().input('reportId', sql.UniqueIdentifier, reportId).query(query);
    return result.recordset as (ReportActionRecord & { ActorName?: string })[];
  }

  /**
   * Updates CopyrightRecord status in SQL Server (e.g. to DISPUTED or WITHDRAWN).
   */
  async updateCopyrightRecordStatus(copyrightRecordId: string, status: CopyrightRecordStatus): Promise<void> {
    const pool = await getPool();
    const query = `
      UPDATE dbo.CopyrightRecords
      SET
        RecordStatus = @status,
        UpdatedAt = SYSUTCDATETIME()
      WHERE CopyrightRecordId = @copyrightRecordId;
    `;

    await pool
      .request()
      .input('copyrightRecordId', sql.UniqueIdentifier, copyrightRecordId)
      .input('status', sql.VarChar(20), status)
      .query(query);
  }
}

export const reportRepository = new ReportRepository();
