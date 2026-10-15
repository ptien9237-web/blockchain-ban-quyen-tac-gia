import { Router } from 'express';
import { copyrightController } from '../controllers/copyrightController.js';
import { requireAuth, optionalAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Prepare registration parameters (Authors/Admins)
router.post('/prepare', requireAuth, (req, res, next) =>
  copyrightController.prepare(req, res, next)
);

// Synchronize MetaMask on-chain transaction (Authors/Admins)
router.post('/sync', requireAuth, (req, res, next) =>
  copyrightController.sync(req, res, next)
);

// Relay registration via backend registrar signer
router.post('/relay', requireAuth, (req, res, next) =>
  copyrightController.relay(req, res, next)
);

// Query copyright records by book
router.get('/books/:bookId/records', optionalAuth, (req, res, next) =>
  copyrightController.getByBook(req, res, next)
);

// Public verification by SHA-256 or recordId
router.get('/verify/:query', (req, res, next) =>
  copyrightController.verify(req, res, next)
);

// Reconcile pending or unconfirmed transactions
router.post('/reconcile', requireAuth, (req, res, next) =>
  copyrightController.reconcile(req, res, next)
);

export const copyrightRoutes = router;
