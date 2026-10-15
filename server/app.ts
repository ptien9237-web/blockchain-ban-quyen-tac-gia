import express, { type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { authRoutes } from './routes/authRoutes.js';
import { userRoutes } from './routes/userRoutes.js';
import { healthRoutes } from './routes/healthRoutes.js';
import { testRoutes } from './routes/testRoutes.js';
import { bookRoutes } from './routes/bookRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';
import { invitationRoutes } from './routes/invitationRoutes.js';
import { copyrightRoutes } from './routes/copyrightRoutes.js';
import { reportRoutes } from './routes/reportRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { sendError } from './utils/response.js';

export function createApp() {
  const app = express();

  // Basic security and parsing middlewares
  app.use(
    cors({
      origin: [config.clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Route mountings
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/books', bookRoutes);
  app.use('/api/copyright', copyrightRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/invitations', invitationRoutes);
  app.use('/api/test', testRoutes);


  // 404 catch-all
  app.use((_req: Request, res: Response) => {
    return sendError(res, 'Endpoint not found', 'NOT_FOUND', 404);
  });

  // Centralized error handling
  app.use(errorHandler);

  return app;
}

export const app = createApp();
