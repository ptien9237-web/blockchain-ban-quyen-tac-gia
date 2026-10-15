import { Router } from 'express';
import { healthController } from '../controllers/healthController.js';

const router = Router();

router.get('/', (req, res) => healthController.getHealth(req, res));

export const healthRoutes = router;
