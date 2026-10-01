import { Router, Request, Response } from 'express';
import { LoanRepository } from '../db/repositories/loan.repo';

export const loansRouter = Router();

// GET all loans
loansRouter.get('/', (_req: Request, res: Response) => {
  try {
    const loans = LoanRepository.getAll();
    res.json({ success: true, count: loans.length, loans });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET loans by member code
loansRouter.get('/member/:code', (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const loans = LoanRepository.getByMember(code);
    res.json({ success: true, count: loans.length, loans });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET loan by ID or loan number, including schedules
loansRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let loan = LoanRepository.getByNumber(id);
    if (!loan) {
      const all = LoanRepository.getAll();
      loan = all.find(l => l.id === id);
    }

    if (!loan) return res.status(404).json({ success: false, error: 'Dossier de prêt introuvable' });

    const schedules = LoanRepository.getSchedules(loan.id);

    res.json({ success: true, loan, schedules });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create a new loan application with amortization schedule
loansRouter.post('/', (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data.memberCode || !data.amount || !data.durationMonths || !data.interestRate) {
      return res.status(400).json({ success: false, error: 'Paramètres du prêt obligatoires manquants' });
    }

    const newLoan = LoanRepository.createLoan({
      memberCode: data.memberCode,
      productName: data.productName || 'Prêt Ordinaire Équipement / Commerce',
      amount: Number(data.amount),
      durationMonths: Number(data.durationMonths),
      interestRate: Number(data.interestRate),
      calculationMethod: data.calculationMethod || 'LINEAIRE',
      purpose: data.purpose || 'Financement d\'activité',
      guarantorName: data.guarantorName,
      attachmentName: data.attachmentName,
      writtenStatement: data.writtenStatement
    });

    const schedules = LoanRepository.getSchedules(newLoan.id);

    res.status(201).json({
      success: true,
      message: 'Dossier de crédit constitué et échéancier généré',
      loan: newLoan,
      schedules
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH update loan status (e.g., APPROUVE, REJETE, DECAISSE)
loansRouter.patch('/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, error: 'Statut manquant' });

    const updated = LoanRepository.updateStatus(id, status);
    if (!updated) return res.status(404).json({ success: false, error: 'Prêt introuvable' });

    res.json({ success: true, message: 'Statut du prêt mis à jour', id, status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
