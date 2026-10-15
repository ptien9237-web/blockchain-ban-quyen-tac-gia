import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { reportController } from '../controllers/reportController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleGuard.js';

const router = Router();

// Protect all admin routes with authentication and ADMIN role requirement
router.use(requireAuth, requireRole('ADMIN'));

// Administrative Overview
router.get('/overview', (req, res, next) => adminController.getOverviewStats(req, res, next));

// Invitation management
router.get('/invitations', (req, res, next) => adminController.listInvitations(req, res, next));
router.post('/invitations', (req, res, next) => adminController.createInvitation(req, res, next));
router.patch('/invitations/:id/revoke', (req, res, next) => adminController.revokeInvitation(req, res, next));

// Report & Dispute management
router.get('/reports', (req, res) => reportController.getAdminReports(req, res));
router.get('/reports/:id', (req, res) => reportController.getReportById(req, res));
router.post('/reports/:id/actions', (req, res) => reportController.addAdminAction(req, res));
router.post('/reports/:id/dispute-onchain', (req, res) => reportController.executeDisputeOnChain(req, res));

// Smart Contract Governance & Circuit Breaker
router.get('/circuit-breaker', (req, res) => reportController.getCircuitBreakerStatus(req, res));
router.post('/circuit-breaker', (req, res) => reportController.toggleCircuitBreaker(req, res));

// Author / Pen Name Request Review & Approval
router.get('/author-requests', (req, res, next) => adminController.listAuthorRequests(req, res, next));
router.patch('/author-requests/:id/approve', (req, res, next) => adminController.approveAuthorRequest(req, res, next));
router.post('/author-requests/:id/approve', (req, res, next) => adminController.approveAuthorRequest(req, res, next));
router.patch('/author-requests/:id/reject', (req, res, next) => adminController.rejectAuthorRequest(req, res, next));
router.post('/author-requests/:id/reject', (req, res, next) => adminController.rejectAuthorRequest(req, res, next));

export const adminRoutes = router;

