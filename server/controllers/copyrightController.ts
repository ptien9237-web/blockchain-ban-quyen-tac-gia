import type { Request, Response, NextFunction } from 'express';
import { copyrightService } from '../services/copyrightService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import type { RoleCode } from '../types/index.js';

export class CopyrightController {
  /**
   * Prepares on-chain registration parameters and creates/queues the database record.
   * POST /api/copyright/prepare
   */
  async prepare(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const user = (req as any).user as { userId: string; roles: RoleCode[] };
      const { bookId, bookFileId, authorWallet } = req.body;

      if (!bookId || typeof bookId !== 'string') {
        return sendError(res, 'bookId is required.', 'VALIDATION_ERROR', 400);
      }
      if (!bookFileId || typeof bookFileId !== 'string') {
        return sendError(res, 'bookFileId is required.', 'VALIDATION_ERROR', 400);
      }
      if (!authorWallet || typeof authorWallet !== 'string') {
        return sendError(res, 'authorWallet address is required.', 'VALIDATION_ERROR', 400);
      }

      const prepared = await copyrightService.prepareRegistration(
        user.userId,
        user.roles,
        {
          bookId: bookId.trim(),
          bookFileId: bookFileId.trim(),
          authorWallet: authorWallet.trim(),
        }
      );

      return sendSuccess(res, prepared);
    } catch (err: any) {
      if (err.message?.startsWith('FORBIDDEN:')) {
        return sendError(res, err.message, 'FORBIDDEN', 403);
      }
      if (err.message?.startsWith('INVALID_WALLET:') || err.message?.startsWith('FILE_NOT_FOUND:')) {
        return sendError(res, err.message, 'VALIDATION_ERROR', 400);
      }
      return next(err);
    }
  }

  /**
   * Synchronizes an on-chain transaction executed by the user via MetaMask.
   * POST /api/copyright/sync
   */
  async sync(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const user = (req as any).user as { userId: string; roles: RoleCode[] };
      const { copyrightRecordId, txHash } = req.body;

      if (!copyrightRecordId || typeof copyrightRecordId !== 'string') {
        return sendError(res, 'copyrightRecordId is required.', 'VALIDATION_ERROR', 400);
      }
      if (!txHash || typeof txHash !== 'string') {
        return sendError(res, 'txHash is required.', 'VALIDATION_ERROR', 400);
      }

      const result = await copyrightService.syncTransaction(
        user.userId,
        user.roles,
        {
          copyrightRecordId: copyrightRecordId.trim(),
          txHash: txHash.trim(),
        }
      );

      return sendSuccess(res, result);
    } catch (err: any) {
      if (err.message?.startsWith('FORBIDDEN:')) {
        return sendError(res, err.message, 'FORBIDDEN', 403);
      }
      if (err.message?.startsWith('RECORD_NOT_FOUND:')) {
        return sendError(res, err.message, 'NOT_FOUND', 404);
      }
      if (err.message?.startsWith('INVALID_TX_HASH:') || err.message?.startsWith('TRANSACTION_REVERTED:')) {
        return sendError(res, err.message, 'TRANSACTION_ERROR', 400);
      }
      return next(err);
    }
  }

  /**
   * Relay registration via server registrar signer when author does not have REGISTRAR_ROLE.
   * POST /api/copyright/relay
   */
  async relay(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const user = (req as any).user as { userId: string; roles: RoleCode[] };
      const { copyrightRecordId } = req.body;

      if (!copyrightRecordId || typeof copyrightRecordId !== 'string') {
        return sendError(res, 'copyrightRecordId is required.', 'VALIDATION_ERROR', 400);
      }

      const result = await copyrightService.relayRegistration(
        user.userId,
        user.roles,
        copyrightRecordId.trim()
      );

      return sendSuccess(res, result);
    } catch (err: any) {
      if (err.message?.startsWith('FORBIDDEN:')) {
        return sendError(res, err.message, 'FORBIDDEN', 403);
      }
      if (err.message?.startsWith('RECORD_NOT_FOUND:')) {
        return sendError(res, err.message, 'NOT_FOUND', 404);
      }
      return next(err);
    }
  }

  /**
   * Retrieves all copyright records for a book.
   * GET /api/copyright/books/:bookId/records
   */
  async getByBook(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { bookId } = req.params;
      if (!bookId) {
        return sendError(res, 'bookId parameter is required.', 'VALIDATION_ERROR', 400);
      }

      const records = await copyrightService.getRecordsByBookId(bookId);
      return sendSuccess(res, records);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Verifies copyright record publicly by SHA-256 hash or Record ID.
   * GET /api/copyright/verify/:query
   */
  async verify(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { query } = req.params;
      if (!query) {
        return sendError(res, 'Verification query is required.', 'VALIDATION_ERROR', 400);
      }

      const result = await copyrightService.verifyCopyright(query);
      return sendSuccess(res, result);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Reconciles all pending or out-of-sync blockchain transactions with SQL Server.
   * POST /api/copyright/reconcile
   */
  async reconcile(_req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await copyrightService.reconcilePendingTransactions();
      return sendSuccess(res, result);
    } catch (err) {
      return next(err);
    }
  }
}

export const copyrightController = new CopyrightController();
