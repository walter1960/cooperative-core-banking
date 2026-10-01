/**
 * Banolia Server Express Application Setup
 * Real Persistent Core Banking Backend with SQLite ACID Engine
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeDatabase } from './db/sqlite';
import { aiRouter } from './api/ai.routes';
import { mobileRouter } from './api/mobile.routes';
import { membersRouter } from './api/members.routes';
import { accountsRouter } from './api/accounts.routes';
import { loansRouter } from './api/loans.routes';
import { caisseRouter } from './api/caisse.routes';
import { dashboardRouter } from './api/dashboard.routes';

export function createApp(): Express {
  // Initialisation de la vraie base de données SQLite
  initializeDatabase();

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
    res.status(200).json({ 
      status: 'UP', 
      app: 'BANOLIA Core Banking', 
      database: 'SQLite Persistent (WAL mode)',
      timestamp: new Date().toISOString() 
    });
  });

  // Core Banking REST API Endpoints
  app.use('/api/members', membersRouter);
  app.use('/api/accounts', accountsRouter);
  app.use('/api/loans', loansRouter);
  app.use('/api/caisse', caisseRouter);
  app.use('/api/dashboard', dashboardRouter);

  // Mobile Inbound Requests Routes
  app.use('/api/mobile', mobileRouter);
  app.use('/api/v1/mobile', mobileRouter);

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
