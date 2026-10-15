import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/profile', requireAuth, (req, res, next) => userController.getProfile(req, res, next));
router.put('/profile', requireAuth, (req, res, next) => userController.updateProfile(req, res, next));
router.post('/author-profile', requireAuth, (req, res, next) => userController.registerAuthorProfile(req, res, next));

export const userRoutes = router;
