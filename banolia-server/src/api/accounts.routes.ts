import { Router, Request, Response } from 'express';
import { AccountRepository } from '../db/repositories/account.repo';
import { CaisseRepository } from '../db/repositories/caisse.repo';

export const accountsRouter = Router();

// GET all accounts of a member
accountsRouter.get('/member/:code', (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const accounts = AccountRepository.getByMember(code);
    res.json({ success: true, count: accounts.length, accounts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single account by account number
accountsRouter.get('/:number', (req: Request, res: Response) => {
  try {
    const { number } = req.params;
    const account = AccountRepository.getByNumber(number);
    if (!account) return res.status(404).json({ success: false, error: 'Compte introuvable' });
    res.json({ success: true, account });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET transaction history for member
accountsRouter.get('/member/:code/transactions', (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const limit = Number(req.query.limit) || 50;
    const transactions = AccountRepository.getTransactionsByMember(code, limit);
    res.json({ success: true, count: transactions.length, transactions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Deposit into account
accountsRouter.post('/:number/deposit', (req: Request, res: Response) => {
  try {
    const { number } = req.params;
    const { amount, reference, category, subtitle, shiftId } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, error: 'Montant invalide' });

    const ref = reference || `DEP-${Date.now().toString().slice(-6)}`;
    const cat = category || 'VERSEMENT_ESPECES';
    const sub = subtitle || 'Dépôt au guichet';

    const result = AccountRepository.deposit(number, Number(amount), ref, cat, sub);

    // Si une caisse est active, ajuster le solde de la caisse
    if (shiftId) {
      CaisseRepository.recordTransaction({
        reference: ref,
        shiftId,
        accountNumber: number,
        type: 'DEPOSIT',
        amount: Number(amount),
        category: cat,
        subtitle: sub
      });
    }

    res.json({
      success: true,
      message: 'Dépôt effectué avec succès',
      newBalance: result.newBalance,
      reference: ref
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST Withdraw from account (with blocked balance safety check)
accountsRouter.post('/:number/withdraw', (req: Request, res: Response) => {
  try {
    const { number } = req.params;
    const { amount, reference, category, subtitle, shiftId } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, error: 'Montant invalide' });

    const ref = reference || `RET-${Date.now().toString().slice(-6)}`;
    const cat = category || 'RETRAIT_ESPECES';
    const sub = subtitle || 'Retrait au guichet';

    const result = AccountRepository.withdraw(number, Number(amount), ref, cat, sub);

    // Si une caisse est active, ajuster le solde de la caisse
    if (shiftId) {
      CaisseRepository.recordTransaction({
        reference: ref,
        shiftId,
        accountNumber: number,
        type: 'WITHDRAWAL',
        amount: Number(amount),
        category: cat,
        subtitle: sub
      });
    }

    res.json({
      success: true,
      message: 'Retrait effectué avec succès',
      newBalance: result.newBalance,
      reference: ref
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST Configure Voluntary Savings Lock
accountsRouter.post('/lock', (req: Request, res: Response) => {
  try {
    const { memberCode, isBlocked, percentage, durationMonths } = req.body;
    if (!memberCode) return res.status(400).json({ success: false, error: 'Code sociétaire requis' });

    const result = AccountRepository.configureLock({
      memberCode,
      isBlocked: Boolean(isBlocked),
      percentage: Number(percentage) || 0,
      durationMonths: Number(durationMonths) || 12
    });

    res.json({
      success: true,
      message: isBlocked ? 'Épargne bloquée avec succès' : 'Épargne débloquée avec succès',
      blockedAmount: result.blockedAmount
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
