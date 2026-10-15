import { Router } from 'express';
import { reportController } from '../controllers/reportController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Authenticated user can submit reports
router.post('/', requireAuth, (req, res) => reportController.submitReport(req, res));

// Authenticated user can view their submitted reports
router.get('/my-reports', requireAuth, (req, res) => reportController.getMyReports(req, res));

// View single report details (must be reporter or admin)
router.get('/:id', requireAuth, (req, res) => reportController.getReportById(req, res));

export const reportRoutes = router;
