/**
 * Banolia Server Express Application Setup
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { aiRouter } from './api/ai.routes';

export function createApp(): Express {
  const app = express();

  // Security & standard middlewares
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Latency tracking middleware
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as any)._startTime = Date.now();
    next();
  });

  // Base Health Check
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'UP', app: 'BANOLIA Core Banking', timestamp: new Date().toISOString() });
  });

  // AI & Voice Assistant Routes
  app.use('/api/ai', aiRouter);
  app.use('/api/v1/ai', aiRouter);
  app.use('/api/v1/voice', aiRouter);

  // Global 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[App Error]', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });

  return app;
}

export const app = createApp();
