import { Router } from 'express';
import { testController } from '../controllers/testController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleGuard.js';

const router = Router();

router.get('/public', (req, res) => testController.publicAccess(req, res));
router.get('/reader-only', requireAuth, requireRole('READER'), (req, res) =>
  testController.readerAccess(req, res)
);
router.get('/author-only', requireAuth, requireRole('AUTHOR'), (req, res) =>
  testController.authorAccess(req, res)
);
router.get('/admin-only', requireAuth, requireRole('ADMIN'), (req, res) =>
  testController.adminAccess(req, res)
);

export const testRoutes = router;
