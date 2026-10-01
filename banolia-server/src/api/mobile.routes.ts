import { Router, Request, Response } from 'express';
import { MobileRequestRepository } from '../db/repositories/mobile_request.repo';

export const mobileRouter = Router();

// GET all mobile requests from real SQLite DB
mobileRouter.get('/requests', (_req: Request, res: Response) => {
  try {
    const rawRequests = MobileRequestRepository.getAll();
    const formatted = rawRequests.map(r => {
      let details: any = {};
      if (r.details) {
        try {
          details = JSON.parse(r.details);
        } catch (_) {}
      }
      return {
        id: r.id,
        type: r.type,
        requestNumber: r.request_number,
        memberCode: r.member_code,
        memberName: r.member_name,
        memberPhone: r.member_phone,
        amount: r.amount,
        purpose: r.purpose,
        status: r.status,
        submittedAt: r.created_at,
        durationMonths: details.durationMonths,
        interestRate: details.interestRate,
        estimatedMonthlyPayment: details.estimatedMonthlyPayment,
        selectedAccount: details.selectedAccount,
        selectedAgency: details.selectedAgency,
        guarantorName: details.guarantorName,
        attachmentName: details.attachmentName,
        writtenStatement: details.writtenStatement,
        processedAt: details.processedAt,
        processedBy: details.processedBy,
        notes: details.notes
      };
    });

    res.json({
      success: true,
      total: formatted.length,
      requests: formatted
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST submit a new request from mobile (Smartphone -> SQLite)
mobileRouter.post('/requests', (req: Request, res: Response) => {
  try {
    const data = req.body;
    const count = MobileRequestRepository.getAll().length;
    const newNumber = data.type === 'WITHDRAWAL'
      ? `RET-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`
      : `DEM-${new Date().getFullYear()}-${String(count + 1001)}`;

    const details = {
      durationMonths: data.durationMonths ? Number(data.durationMonths) : undefined,
      interestRate: data.interestRate ? Number(data.interestRate) : undefined,
      estimatedMonthlyPayment: data.estimatedMonthlyPayment ? Number(data.estimatedMonthlyPayment) : undefined,
      selectedAccount: data.selectedAccount,
      selectedAgency: data.selectedAgency || 'Siège Principal',
      guarantorName: data.guarantorName,
      attachmentName: data.attachmentName,
      writtenStatement: data.writtenStatement,
      notes: data.notes
    };

    const record = MobileRequestRepository.create({
      request_number: data.requestNumber || newNumber,
      type: data.type || 'LOAN',
      member_code: data.memberCode || '0200225',
      member_name: data.memberName || 'Sociétaire Mobile',
      member_phone: data.memberPhone || '',
      amount: Number(data.amount) || 0,
      purpose: data.purpose || 'Demande via smartphone',
      status: 'EN_ATTENTE',
      details
    });

    console.log(`[Mobile API Persistent] New ${record.type} request stored in SQLite: ${record.request_number} from ${record.member_name} (${record.amount} F)`);

    res.status(201).json({
      success: true,
      message: 'Demande enregistrée avec succès dans la base de données réelle',
      request: {
        id: record.id,
        requestNumber: record.request_number,
        type: record.type,
        memberCode: record.member_code,
        memberName: record.member_name,
        memberPhone: record.member_phone,
        amount: record.amount,
        purpose: record.purpose,
        status: record.status,
        submittedAt: record.created_at,
        ...details
      }
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH update request status (Approve, Reject, Serve at Cash Desk)
mobileRouter.patch('/requests/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, processedBy, notes } = req.body;

    const updated = MobileRequestRepository.updateStatus(id, status, processedBy, notes);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Demande introuvable' });
    }

    res.json({
      success: true,
      message: 'Statut de la demande mis à jour dans SQLite',
      request: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE request
mobileRouter.delete('/requests/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    MobileRequestRepository.delete(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
