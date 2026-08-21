import { Member, Account, LoanFile, CashRegister, Transaction } from './types';

export const initialCashRegister: CashRegister = {
  id: 'caisse-001',
  code: '001',
  name: 'CAISSE PRINCIPALE',
  agencyCode: 'A01',
  agencyName: 'Agence Siège',
  cashierName: 'MINDIZINA TOMROM (0000)',
  balance: 233243,
  status: 'OPEN',
  lastOpenedAt: '19/08/2026 07:30'
};

export const initialMembers: Member[] = [
  {
    code: 'A0200225',
    manualNumber: '610',
    fullName: 'MILDZINA Tomrom',
    birthDate: '18/08/1978',
    registrationDate: '29/07/2009',
    address: 'BP : 10151',
    city: 'LOMÉ',
    phone: '22262101',
    spouseName: 'KODJO Afiwa',
    sharesPurchased: 5000,
    sharesSold: 0,
    sharesAvailable: 5000,
    shareUnitPrice: 5000,
    status: 'ACTIF',
    fingerprintEnrolled: true
  },
  {
    code: 'A0200226',
    manualNumber: '611',
    fullName: 'AGBODJAN Koffi Mensah',
    birthDate: '12/04/1985',
    registrationDate: '15/01/2012',
    address: 'Quartier Bè-Château',
    city: 'LOMÉ',
    phone: '90123456',
    spouseName: 'AGBODJAN Akossiwa',
    sharesPurchased: 10000,
    sharesSold: 0,
    sharesAvailable: 10000,
    shareUnitPrice: 5000,
    status: 'ACTIF',
    fingerprintEnrolled: true
  },
  {
    code: 'A0200227',
    manualNumber: '612',
    fullName: 'AMOUZOU Ablavi',
    birthDate: '03/11/1990',
    registrationDate: '04/06/2018',
    address: 'Marché d\'Adawlato',
    city: 'LOMÉ',
    phone: '98765432',
    spouseName: '',
    sharesPurchased: 5000,
    sharesSold: 0,
    sharesAvailable: 5000,
    shareUnitPrice: 5000,
    status: 'ACTIF',
    fingerprintEnrolled: false
  }
];

export const initialAccounts: Record<string, Account[]> = {
  'A0200225': [
    {
      accountNumber: '25121100A020022501',
      productName: 'EPARGNE ORDINAIRE (001)',
      type: 'SAVINGS',
      realBalance: 280424,
      frozenBalance: 0,
      availableBalance: 280424,
      currency: 'F.CFA',
      status: 'ACTIF'
    },
    {
      accountNumber: '20412110A020022501',
      productName: 'CREDIT AU PERSONNEL (002)',
      type: 'LOAN',
      realBalance: 5257109,
      frozenBalance: 0,
      availableBalance: 5257109,
      currency: 'F.CFA',
      status: 'ACTIF'
    },
    {
      accountNumber: '25331010A020022501',
      productName: 'EPARGNE REMBOURSEMENT CREDIT / PLAN (003)',
      type: 'CAREER_PLAN',
      realBalance: 125839,
      frozenBalance: 0,
      availableBalance: 125839,
      currency: 'F.CFA',
      status: 'ACTIF'
    },
    {
      accountNumber: '25331020A020022501',
      productName: 'PLAN EPARGNE PROJET PLUS (004)',
      type: 'PROJECT_PLAN',
      realBalance: 0,
      frozenBalance: 0,
      availableBalance: 0,
      currency: 'F.CFA',
      status: 'ACTIF'
    }
  ]
};

export const initialLoans: Record<string, LoanFile[]> = {
  'A0200225': [
    {
      loanNumber: 'CR-2025-089',
      productName: 'CREDIT AU PERSONNEL (002)',
      amountGranted: 6000000,
      interestRate: 8.5,
      durationMonths: 24,
      disbursementDate: '10/01/2025',
      maturityDate: '10/01/2027',
      monthlyPayment: 272800,
      remainingPrincipal: 5257109,
      overdueAmount: 0,
      status: 'EN_COURS'
    }
  ]
};

export const initialTransactions: Transaction[] = [
  {
    id: 'tx-001',
    receiptNumber: 'REC-20260819-001',
    memberCode: 'A0200225',
    memberName: 'MILDZINA Tomrom',
    accountNumber: '25121100A020022501',
    productName: 'EPARGNE ORDINAIRE (001)',
    type: 'DEPOSIT',
    amount: 50000,
    paymentMethod: 'CASH',
    cashierName: 'MINDIZINA TOMROM (0000)',
    agencyCode: 'A02',
    timestamp: '19/08/2026 09:14',
    syncStatus: 'SYNCED',
    idempotencyKey: 'idemp-tx-001'
  }
];
