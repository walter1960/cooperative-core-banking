import { Router, Request, Response } from 'express';
import { MemberRepository } from '../db/repositories/member.repo';
import { AccountRepository } from '../db/repositories/account.repo';
import { LoanRepository } from '../db/repositories/loan.repo';
import { db } from '../db/sqlite';

export const membersRouter = Router();

// GET all members or search
membersRouter.get('/', (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    const members = q ? MemberRepository.search(q) : MemberRepository.getAll();
    res.json({ success: true, count: members.length, members });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single member by code with full profile (accounts, loans, savings lock)
membersRouter.get('/:code', (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const member = MemberRepository.getByCode(code);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Sociétaire introuvable' });
    }

    const accounts = AccountRepository.getByMember(code);
    const loans = LoanRepository.getByMember(code);
    const lock = db.prepare('SELECT * FROM savings_locks WHERE member_code = ? AND status = \'ACTIVE\'').get(code);

    res.json({
      success: true,
      member,
      accounts,
      loans,
      savingsLock: lock || null
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST register new member
membersRouter.post('/', (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data.fullName || !data.phone || !data.address) {
      return res.status(400).json({ success: false, error: 'Champs obligatoires manquants (nom complet, téléphone, adresse)' });
    }

    // Générer code sociétaire si non fourni
    const nextSeq = MemberRepository.getNextSequence();
    const generatedCode = data.code || `13${String(nextSeq).padStart(4, '0')}`;
    const memberId = `MEM-${Date.now()}`;
    const regDate = data.registrationDate || new Date().toISOString().split('T')[0];

    const newMember = MemberRepository.create({
      id: memberId,
      code: generatedCode,
      manual_number: data.manualNumber || generatedCode,
      legal_type: data.legalType || 'INDIVIDUAL',
      full_name: data.fullName,
      gender: data.gender,
      birth_date: data.birthDate,
      nationality: data.nationality || 'Togolaise',
      id_type: data.idType || 'CNI',
      id_number: data.idNumber || `ID-${Date.now().toString().slice(-6)}`,
      phone: data.phone,
      email: data.email,
      address: data.address,
      city: data.city || 'Lomé',
      profession: data.profession,
      monthly_income: Number(data.monthlyIncome) || 0,
      shares_purchased: Number(data.sharesPurchased) || 1,
      shares_non_liberated: Number(data.sharesNonLiberated) || 0,
      share_unit_price: Number(data.shareUnitPrice) || 10000,
      status: 'ACTIVE',
      registration_date: regDate
    });

    // Création automatique du compte d'épargne ordinaire (SYSCOA 251211)
    const savingsAccNumber = `25121100${generatedCode}01`;
    AccountRepository.create({
      id: `ACC-EPG-${Date.now()}`,
      account_number: savingsAccNumber,
      member_code: generatedCode,
      product_code: 'EPG_VOLONTAIRE',
      type: 'SAVINGS',
      balance: 0,
      blocked_balance: 0,
      currency: 'XOF',
      status: 'ACTIVE'
    });

    // Création du compte de capital parts sociales (SYSCOA 101100)
    const shareCapitalAmount = (newMember.shares_purchased - newMember.shares_non_liberated) * newMember.share_unit_price;
    const shareAccNumber = `10110000${generatedCode}01`;
    AccountRepository.create({
      id: `ACC-PS-${Date.now()}`,
      account_number: shareAccNumber,
      member_code: generatedCode,
      product_code: 'PARTS_SOCIALES',
      type: 'SHARE_CAPITAL',
      balance: shareCapitalAmount,
      blocked_balance: shareCapitalAmount, // Capital bloqué par nature
      currency: 'XOF',
      status: 'ACTIVE'
    });

    const accounts = AccountRepository.getByMember(generatedCode);

    res.status(201).json({
      success: true,
      message: 'Sociétaire inscrit avec succès dans le Core Banking réel',
      member: newMember,
      accounts
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH update member status
membersRouter.patch('/:code/status', (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, error: 'Statut manquant' });

    const updated = MemberRepository.updateStatus(code, status);
    if (!updated) return res.status(404).json({ success: false, error: 'Sociétaire introuvable' });

    res.json({ success: true, message: 'Statut mis à jour', code, status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
