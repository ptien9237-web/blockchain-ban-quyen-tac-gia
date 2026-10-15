import type { Request, Response } from 'express';
import { checkDatabaseHealth } from '../db/sqlServer.js';
import { sendSuccess } from '../utils/response.js';

export class HealthController {
  async getHealth(_req: Request, res: Response): Promise<any> {
    const dbHealth = await checkDatabaseHealth();
    const isHealthy = dbHealth.connected;

    const data = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        connected: dbHealth.connected,
        latencyMs: dbHealth.latencyMs,
        databaseName: dbHealth.database || 'BookChainLibrary',
        ...(dbHealth.error ? { message: 'Database connection failed' } : {}),
      },
      environment: process.env.NODE_ENV || 'development',
    };

    if (isHealthy) {
      return sendSuccess(res, data, 200);
    } else {
      return res.status(503).json({
        success: false,
        data,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Backend server is running but database connection is unavailable.',
        },
      });
    }
  }
}

export const healthController = new HealthController();
