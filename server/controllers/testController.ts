import type { Request, Response } from 'express';
import { sendSuccess } from '../utils/response.js';

export class TestController {
  publicAccess(_req: Request, res: Response) {
    return sendSuccess(res, {
      message: 'Public endpoint accessed successfully. No authentication required.',
    });
  }

  readerAccess(req: Request, res: Response) {
    return sendSuccess(res, {
      message: 'Reader endpoint accessed successfully.',
      user: {
        userId: req.user?.userId,
        roles: req.user?.roles,
      },
    });
  }

  authorAccess(req: Request, res: Response) {
    return sendSuccess(res, {
      message: 'Author endpoint accessed successfully.',
      user: {
        userId: req.user?.userId,
        roles: req.user?.roles,
      },
    });
  }

  adminAccess(req: Request, res: Response) {
    return sendSuccess(res, {
      message: 'Admin endpoint accessed successfully.',
      user: {
        userId: req.user?.userId,
        roles: req.user?.roles,
      },
    });
  }
}

export const testController = new TestController();
