import { BanoliaDatabase } from './database';
import {
  DbMember,
  DbAccount,
  DbLoanFile,
  DbLoanSchedule,
  DbCashShift,
  DbCashBilletage,
  DbTransaction,
  DbAuditLog
} from '../types/database';
import { CryptoService } from '../services/crypto/CryptoService';

export const seedDatabase = async (database: BanoliaDatabase): Promise<void> => {
  const memberCount = await database.members.count();
  if (memberCount > 0) {
    return; // Already seeded
  }

  const now = new Date().toISOString();

  // 1. Members
  const members: DbMember[] = [
    {
      id: 'mem-001',
      code: '130049',
      manualNumber: '130049',
      fullName: 'MINDIZINA Tomrom',
      birthDate: '1978-08-18',
      registrationDate: '2009-07-29',
      address: 'BP : 10151 Quartier Totsi',
      city: 'LOMÉ',
      phone: '22262101',
      spouseName: 'KODJO Afiwa',
      sharesPurchased: 5000,
      sharesSold: 0,
      sharesAvailable: 5000,
      shareUnitPrice: 5000,
      status: 'ACTIF',
      fingerprintEnrolled: true,
      version: 1,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'mem-002',
      code: '130050',
      manualNumber: '130050',
      fullName: 'AGBODJAN Koffi Mensah',
      birthDate: '1985-04-12',
      registrationDate: '2012-01-15',
      address: 'Quartier Bè-Château',
      city: 'LOMÉ',
      phone: '90123456',
      spouseName: 'AGBODJAN Akossiwa',
      sharesPurchased: 10000,
      sharesSold: 0,
      sharesAvailable: 10000,
      shareUnitPrice: 5000,
      status: 'ACTIF',
      fingerprintEnrolled: true,
      version: 1,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'mem-003',
      code: '130051',
      manualNumber: '130051',
      fullName: 'AMOUZOU Ablavi',
      birthDate: '1990-11-03',
      registrationDate: '2018-06-04',
      address: 'Marché Grand Lomé (Adawlato)',
      city: 'LOMÉ',
      phone: '98765432',
      spouseName: '',
      sharesPurchased: 5000,
      sharesSold: 0,
      sharesAvailable: 5000,
      shareUnitPrice: 5000,
      status: 'ACTIF',
      fingerprintEnrolled: false,
      version: 1,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'mem-004',
      code: '130052',
      manualNumber: '130052',
      fullName: 'KOUASSI Yao Jean',
      birthDate: '1982-05-20',
      registrationDate: '2019-09-10',
      address: 'Boulevard du 13 Janvier',
      city: 'LOMÉ',
      phone: '91238899',
      spouseName: 'KOUASSI Akou',
      sharesPurchased: 15000,
      sharesSold: 0,
      sharesAvailable: 15000,
      shareUnitPrice: 5000,
      status: 'ACTIF',
      fingerprintEnrolled: true,
      version: 1,
      createdAt: now,
      updatedAt: now
    }
  ];

  // 2. Accounts
  const accounts: DbAccount[] = [
    {
      id: 'acc-001',
      accountNumber: '2512110013004901',
      memberCode: '130049',
      productCode: '251211',
      productName: 'EPARGNE ORDINAIRE (001)',
      type: 'SAVINGS',
      realBalance: 280424,
      frozenBalance: 0,
      availableBalance: 280424,
      currency: 'XOF',
      status: 'ACTIF',
      version: 1,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'acc-002',
      accountNumber: '2041211013004901',
      memberCode: '130049',
      productCode: '204121',
      productName: 'CREDIT AU PERSONNEL (002)',
      type: 'LOAN',
      realBalance: 5257109,
      frozenBalance: 0,
      availableBalance: 5257109,
      currency: 'XOF',
      status: 'ACTIF',
      version: 1,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'acc-003',
      accountNumber: '2533101013004901',
      memberCode: '130049',
      productCode: '253310',
      productName: 'EPARGNE REMBOURSEMENT CREDIT / PLAN (003)',
      type: 'CAREER_PLAN',
      realBalance: 125839,
      frozenBalance: 0,
      availableBalance: 125839,
      currency: 'XOF',
      status: 'ACTIF',
      version: 1,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'acc-004',
      accountNumber: '2512110013005001',
      memberCode: '130050',
      productCode: '251211',
      productName: 'EPARGNE ORDINAIRE (001)',
      type: 'SAVINGS',
      realBalance: 850000,
      frozenBalance: 50000, // 50 000 XOF pledged
      availableBalance: 800000,
      currency: 'XOF',
      status: 'ACTIF',
      version: 1,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'acc-005',
      accountNumber: '2512110013005101',
      memberCode: '130051',
      productCode: '251211',
      productName: 'EPARGNE ORDINAIRE (001)',
      type: 'SAVINGS',
      realBalance: 145000,
      frozenBalance: 0,
      availableBalance: 145000,
      currency: 'XOF',
      status: 'ACTIF',
      version: 1,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'acc-006',
      accountNumber: '2512110013005201',
      memberCode: '130052',
      productCode: '251211',
      productName: 'EPARGNE ORDINAIRE (001)',
      type: 'SAVINGS',
      realBalance: 2450000,
      frozenBalance: 0,
      availableBalance: 2450000,
      currency: 'XOF',
      status: 'ACTIF',
      version: 1,
      createdAt: now,
      updatedAt: now
    }
  ];

  // 3. Loan Files
  const loans: DbLoanFile[] = [
    {
      id: 'loan-001',
      loanNumber: 'CR-2025-089',
      memberCode: '130049',
      productName: 'CREDIT AU PERSONNEL (002)',
      amountGranted: 6000000,
      interestRate: 8.5,
      durationMonths: 24,
      amortizationType: 'CONSTANT_ANNUITY',
      disbursementDate: '2025-01-10',
      maturityDate: '2027-01-10',
      monthlyPayment: 272800,
      remainingPrincipal: 5257109,
      overdueAmount: 0,
      penaltyRate: 2.0,
      status: 'EN_COURS',
      createdAt: now,
      updatedAt: now
    }
  ];

  // 4. Loan Schedules
  const schedules: DbLoanSchedule[] = [
    {
      id: 'sch-001-01',
      loanNumber: 'CR-2025-089',
      installmentNumber: 1,
      dueDate: '2025-02-10',
      principalAmount: 230300,
      interestAmount: 42500,
      feeAmount: 0,
      totalInstallment: 272800,
      remainingPrincipal: 5769700,
      paidAmount: 272800,
      status: 'PAID',
      paidAt: '2025-02-09T10:15:00Z'
    },
    {
      id: 'sch-001-02',
      loanNumber: 'CR-2025-089',
      installmentNumber: 2,
      dueDate: '2025-03-10',
      principalAmount: 231932,
      interestAmount: 40868,
      feeAmount: 0,
      totalInstallment: 272800,
      remainingPrincipal: 5537768,
      paidAmount: 272800,
      status: 'PAID',
      paidAt: '2025-03-08T14:22:00Z'
    },
    {
      id: 'sch-001-03',
      loanNumber: 'CR-2025-089',
      installmentNumber: 3,
      dueDate: '2025-04-10',
      principalAmount: 233575,
      interestAmount: 39225,
      feeAmount: 0,
      totalInstallment: 272800,
      remainingPrincipal: 5304193,
      paidAmount: 272800,
      status: 'PAID',
      paidAt: '2025-04-09T11:05:00Z'
    }
  ];

  // 5. Active Cash Shift
  const shiftId = 'shift-20260820-001';
  const cashShift: DbCashShift = {
    id: shiftId,
    shiftCode: 'SHIFT-20260820-001',
    cashierId: 'csh-001',
    cashierName: 'MINDIZINA TOMROM (0000)',
    agencyCode: 'A02',
    agencyName: 'COOPEC BANOLIA - AGENCE CENTRALE LOMÉ',
    openedAt: '2026-08-20T07:30:00.000Z',
    openingBalance: 500000,
    totalDeposits: 50000,
    totalWithdrawals: 0,
    totalTransfersIn: 0,
    totalTransfersOut: 0,
    totalVaultIn: 0,
    totalVaultOut: 0,
    theoreticalClosingBalance: 550000,
    status: 'OPEN_ACTIVE',
    createdAt: now
  };

  // 6. Opening Billetage for the shift
  const openingBilletage: DbCashBilletage = {
    id: 'bil-open-001',
    shiftId: shiftId,
    type: 'OPENING',
    b10000: 30, // 300 000
    b5000: 20,  // 100 000
    b2000: 30,  // 60 000
    b1000: 25,  // 25 000
    b500: 20,   // 10 000
    p500: 6,    // 3 000
    p200: 5,    // 1 000
    p100: 8,    // 800
    p50: 2,     // 100
    p25: 2,     // 50
    p10: 4,     // 40
    p5: 2,      // 10
    totalCalculated: 500000,
    countedAt: '2026-08-20T07:30:00.000Z',
    countedBy: 'MINDIZINA TOMROM (0000)'
  };

  // 7. Initial Transaction
  const initialTx: DbTransaction = {
    id: 'tx-001',
    receiptNumber: 'REC-20260820-0001',
    shiftId: shiftId,
    memberCode: 'A0200225',
    memberName: 'MINDIZINA Tomrom',
    accountNumber: '25121100A020022501',
    productName: 'EPARGNE ORDINAIRE (001)',
    type: 'DEPOSIT',
    amount: 50000,
    feeAmount: 0,
    paymentMethod: 'CASH',
    cashierName: 'MINDIZINA TOMROM (0000)',
    agencyCode: 'A02',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    idempotencyKey: 'idemp_A02_1787213700000_genesis001',
    previousTxHash: 'GENESIS_A02',
    signatureHmac: 'hmac_genesis_signature_ok_001',
    syncStatus: 'SYNCED',
    syncAttempts: 0,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  };

  // 8. Audit Log
  const auditLog: DbAuditLog = {
    id: 'audit-001',
    userId: 'csh-001',
    action: 'SHIFT_OPENED',
    resourceType: 'CASH_SHIFT',
    resourceId: shiftId,
    deviceFingerprint: CryptoService.getDeviceFingerprint(),
    timestamp: '2026-08-20T07:30:00.000Z'
  };

  // Populate tables
  await database.members.bulkAdd(members);
  await database.accounts.bulkAdd(accounts);
  await database.loanFiles.bulkAdd(loans);
  await database.loanSchedules.bulkAdd(schedules);
  await database.cashShifts.add(cashShift);
  await database.cashBilletages.add(openingBilletage);
  await database.transactions.add(initialTx);
  await database.auditLogs.add(auditLog);
};
