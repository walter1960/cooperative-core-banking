import { Router, Request, Response } from 'express';
import { db } from '../db/sqlite';
import { CaisseRepository } from '../db/repositories/caisse.repo';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', (_req: Request, res: Response) => {
  try {
    const totalMembers = (db.prepare('SELECT COUNT(*) as count FROM members').get() as any).count;
    const activeMembers = (db.prepare('SELECT COUNT(*) as count FROM members WHERE status = \'ACTIVE\'').get() as any).count;

    const totalSavings = (db.prepare('SELECT COALESCE(SUM(balance), 0) as total FROM accounts WHERE type = \'SAVINGS\'').get() as any).total;
    const totalBlockedSavings = (db.prepare('SELECT COALESCE(SUM(blocked_balance), 0) as total FROM accounts WHERE type = \'SAVINGS\'').get() as any).total;
    const totalShareCapital = (db.prepare('SELECT COALESCE(SUM(balance), 0) as total FROM accounts WHERE type = \'SHARE_CAPITAL\'').get() as any).total;

    const totalLoansAmount = (db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM loans').get() as any).total;
    const pendingLoansCount = (db.prepare('SELECT COUNT(*) as count FROM loans WHERE status = \'EN_INSTRUCTION\'').get() as any).count;
    const activeLoansCount = (db.prepare('SELECT COUNT(*) as count FROM loans WHERE status IN (\'APPROUVE\', \'DECAISSE\', \'EN_COURS\')').get() as any).count;

    const pendingMobileRequests = (db.prepare('SELECT COUNT(*) as count FROM mobile_requests WHERE status = \'EN_ATTENTE\'').get() as any).count;

    const activeShift = CaisseRepository.getActiveShift();
    const cashInVault = activeShift ? activeShift.system_balance : 0;

    const recentTransactions = db.prepare(`
      SELECT * FROM transactions 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all();

    res.json({
      success: true,
      stats: {
        totalMembers,
        activeMembers,
        financials: {
          totalSavings,
          totalBlockedSavings,
          totalAvailableSavings: totalSavings - totalBlockedSavings,
          totalShareCapital,
          totalLoansAmount,
          cashInVault
        },
        credits: {
          pendingCount: pendingLoansCount,
          activeCount: activeLoansCount
        },
        mobileRequests: {
          pendingCount: pendingMobileRequests
        }
      },
      recentTransactions
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
