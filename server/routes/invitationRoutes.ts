import { Router } from 'express';
import { invitationController } from '../controllers/invitationController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Redeem invitation code requires valid session
router.post('/redeem', requireAuth, (req, res, next) =>
  invitationController.redeemInvitation(req, res, next)
);

export const invitationRoutes = router;
