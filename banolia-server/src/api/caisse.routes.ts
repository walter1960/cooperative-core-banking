import { Router, Request, Response } from 'express';
import { CaisseRepository } from '../db/repositories/caisse.repo';
import { AccountRepository } from '../db/repositories/account.repo';

export const caisseRouter = Router();

// GET active shift
caisseRouter.get('/shift/active', (_req: Request, res: Response) => {
  try {
    const activeShift = CaisseRepository.getActiveShift();
    res.json({ success: true, activeShift: activeShift || null });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all shifts
caisseRouter.get('/shifts', (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const shifts = CaisseRepository.getAllShifts(limit);
    res.json({ success: true, count: shifts.length, shifts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST open shift
caisseRouter.post('/shift/open', (req: Request, res: Response) => {
  try {
    const { cashierId, agencyId, openingBalance } = req.body;
    if (!cashierId) return res.status(400).json({ success: false, error: 'Identifiant caissier requis' });

    const shift = CaisseRepository.openShift({
      cashierId,
      agencyId,
      openingBalance: Number(openingBalance) || 0
    });

    res.status(201).json({ success: true, message: 'Session de caisse ouverte', shift });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST close shift
caisseRouter.post('/shift/close', (req: Request, res: Response) => {
  try {
    const { shiftId, closingBalance } = req.body;
    if (!shiftId) return res.status(400).json({ success: false, error: 'ID de session requis' });

    const shift = CaisseRepository.closeShift(shiftId, Number(closingBalance) || 0);
    res.json({ success: true, message: 'Session de caisse clôturée', shift });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET transactions
caisseRouter.get('/transactions', (req: Request, res: Response) => {
  try {
    const shiftId = req.query.shiftId as string;
    const transactions = shiftId
      ? CaisseRepository.getTransactionsByShift(shiftId)
      : CaisseRepository.getTransactions(Number(req.query.limit) || 100);
    res.json({ success: true, count: transactions.length, transactions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Guichet cash operation (DEPOSIT or WITHDRAWAL with active shift connection)
caisseRouter.post('/operation', (req: Request, res: Response) => {
  try {
    const { type, accountNumber, amount, memberCode, category, subtitle } = req.body;
    if (!type || !accountNumber || !amount) {
      return res.status(400).json({ success: false, error: 'Champs obligatoires manquants' });
    }

    const activeShift = CaisseRepository.getActiveShift();
    const ref = `REC-${Date.now().toString().slice(-8)}`;

    let result;
    if (type === 'DEPOSIT') {
      result = AccountRepository.deposit(
        accountNumber,
        Number(amount),
        ref,
        category || 'VERSEMENT_ESPECES',
        subtitle || 'Versement guichet'
      );
    } else if (type === 'WITHDRAWAL') {
      result = AccountRepository.withdraw(
        accountNumber,
        Number(amount),
        ref,
        category || 'RETRAIT_ESPECES',
        subtitle || 'Retrait guichet'
      );
    } else {
      return res.status(400).json({ success: false, error: 'Type d\'opération non supporté' });
    }

    // Enregistrer transaction dans la session de caisse
    const tx = CaisseRepository.recordTransaction({
      reference: ref,
      shiftId: activeShift?.id,
      memberCode,
      accountNumber,
      type,
      amount: Number(amount),
      category: category || (type === 'DEPOSIT' ? 'VERSEMENT_ESPECES' : 'RETRAIT_ESPECES'),
      subtitle: subtitle || (type === 'DEPOSIT' ? 'Versement guichet' : 'Retrait guichet')
    });

    res.status(201).json({
      success: true,
      message: `${type === 'DEPOSIT' ? 'Versement' : 'Retrait'} validé avec succès`,
      transaction: tx,
      newBalance: result.newBalance,
      cashierShiftBalance: activeShift ? CaisseRepository.getActiveShift()?.system_balance : undefined
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
