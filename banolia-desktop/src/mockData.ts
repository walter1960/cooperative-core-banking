import { Member, Account, LoanFile, CashRegister, Transaction } from './types';

// Registre de caisse initialisé neutre (sans données fictives)
export const initialCashRegister: CashRegister = {
  id: 'caisse-001',
  code: '001',
  name: 'CAISSE PRINCIPALE',
  agencyCode: 'AG-01',
  agencyName: 'Agence Siège Principal',
  cashierName: 'Caissier Guichet',
  balance: 0,
  status: 'OPEN',
  lastOpenedAt: new Date().toLocaleDateString('fr-FR')
};

// Aucune donnée fictive : Les sociétaires proviennent de la base de données réelle
export const initialMembers: Member[] = [];

export const initialAccounts: Record<string, Account[]> = {};

export const initialLoans: Record<string, LoanFile[]> = {};

export const initialTransactions: Transaction[] = [];
