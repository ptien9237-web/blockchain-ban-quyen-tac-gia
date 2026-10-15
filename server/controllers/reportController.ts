import type { Request, Response } from 'express';
import { reportService } from '../services/reportService.js';

export class ReportController {
  /**
   * POST /api/reports
   * Submit an infringement report or dispute request.
   */
  async submitReport(req: Request, res: Response): Promise<void> {
    try {
      const reporterUserId = req.user?.userId || null;
      const { bookId, copyrightRecordId, reason, description } = req.body;

      const report = await reportService.submitReport(reporterUserId, {
        bookId,
        copyrightRecordId,
        reason,
        description,
      });

      res.status(201).json({
        success: true,
        data: report,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'REPORT_SUBMISSION_FAILED',
          message: err.message,
        },
      });
    }
  }

  /**
   * GET /api/reports/my-reports
   * Get reports submitted by the logged-in user.
   */
  async getMyReports(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
        return;
      }

      const reports = await reportService.getUserReports(req.user.userId);
      res.json({
        success: true,
        data: reports,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_REPORTS_FAILED', message: err.message },
      });
    }
  }

  /**
   * GET /api/reports/:id
   * Get report details.
   */
  async getReportById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const report = await reportService.getReportDetails(id);

      // Authorization: must be admin or the reporter
      const isAdmin = req.user?.roles?.includes('ADMIN');
      const isReporter = req.user && req.user.userId === report.reporterUserId;

      if (!isAdmin && !isReporter) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You are not authorized to view this report' },
        });
        return;
      }

      res.json({
        success: true,
        data: report,
      });
    } catch (err: any) {
      const status = err.message?.includes('not found') ? 404 : 500;
      res.status(status).json({
        success: false,
        error: { code: 'REPORT_NOT_FOUND', message: err.message },
      });
    }
  }

  /**
   * GET /api/admin/reports
   * List reports for administrators.
   */
  async getAdminReports(req: Request, res: Response): Promise<void> {
    try {
      const { status, page, limit, bookId, copyrightRecordId } = req.query;
      const result = await reportService.getAdminReports({
        status: status as string,
        bookId: bookId as string,
        copyrightRecordId: copyrightRecordId as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'ADMIN_REPORTS_FAILED', message: err.message },
      });
    }
  }

  /**
   * POST /api/admin/reports/:id/actions
   * Admin adds an action or note to a report.
   */
  async addAdminAction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { action, note } = req.body;
      const adminUserId = req.user!.userId;

      if (!action) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_ACTION', message: 'Action type is required' },
        });
        return;
      }

      const createdAction = await reportService.addReportAction(id, adminUserId, action, note);
      res.status(201).json({
        success: true,
        data: createdAction,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'ACTION_FAILED', message: err.message },
      });
    }
  }

  /**
   * POST /api/admin/reports/:id/dispute-onchain
   * Admin triggers an on-chain status update (DISPUTE, RESOLVE_ACTIVE, RESOLVE_REVOKE, REVOKE).
   */
  async executeDisputeOnChain(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { actionType, reason } = req.body;
      const adminUserId = req.user!.userId;

      if (!actionType || !['DISPUTE', 'RESOLVE_ACTIVE', 'RESOLVE_REVOKE', 'REVOKE'].includes(actionType)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DISPUTE_ACTION',
            message: 'actionType must be one of DISPUTE, RESOLVE_ACTIVE, RESOLVE_REVOKE, REVOKE',
          },
        });
        return;
      }

      const result = await reportService.executeDisputeOnChain(id, adminUserId, actionType, reason);
      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ONCHAIN_DISPUTE_FAILED',
          message: err.message,
        },
      });
    }
  }

  /**
   * GET /api/admin/circuit-breaker
   * Admin views circuit breaker status.
   */
  async getCircuitBreakerStatus(_req: Request, res: Response): Promise<void> {
    try {
      const status = await reportService.getCircuitBreakerStatus();
      res.json({
        success: true,
        data: {
          ...status,
          paused: status.isPaused,
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'CIRCUIT_BREAKER_FAILED', message: err.message },
      });
    }
  }

  /**
   * POST /api/admin/circuit-breaker
   * Admin toggles pause/unpause.
   */
  async toggleCircuitBreaker(req: Request, res: Response): Promise<void> {
    try {
      const pauseVal = req.body.pause !== undefined ? req.body.pause : req.body.paused;
      if (typeof pauseVal !== 'boolean') {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_PAYLOAD', message: 'pause or paused field must be a boolean' },
        });
        return;
      }

      const adminUserId = req.user!.userId;
      const result = await reportService.toggleCircuitBreaker(adminUserId, pauseVal);
      res.json({
        success: true,
        data: {
          ...result,
          paused: result.isPaused,
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'CIRCUIT_BREAKER_TOGGLE_FAILED', message: err.message },
      });
    }
  }
}

export const reportController = new ReportController();
