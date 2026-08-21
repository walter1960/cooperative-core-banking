import { GLAccount, JournalEntryInput, JournalEntryRecord, JournalLine } from './types';
import { BCEAO_CHART_OF_ACCOUNTS } from './chartOfAccounts';
import { STANDARD_GL_ACCOUNTS } from '../config/constants';

export class UnbalancedJournalEntryError extends Error {
  constructor(public totalDebit: number, public totalCredit: number, public difference: number) {
    super(`Unbalanced Journal Entry: Total Debit (${totalDebit}) does not equal Total Credit (${totalCredit}). Difference: ${difference}`);
    this.name = 'UnbalancedJournalEntryError';
  }
}

export class InvalidAccountError extends Error {
  constructor(public accountNumber: string) {
    super(`Invalid or non-existent GL Account: ${accountNumber}`);
    this.name = 'InvalidAccountError';
  }
}

export class GeneralLedgerEngine {
  private accounts: Map<string, GLAccount> = new Map();
  private journalEntries: JournalEntryRecord[] = [];
  private sequenceCounter: number = 1;

  constructor(initialAccounts: GLAccount[] = BCEAO_CHART_OF_ACCOUNTS) {
    for (const acc of initialAccounts) {
      this.accounts.set(acc.accountNumber, { ...acc });
    }
  }

  public getAccount(accountNumber: string): GLAccount {
    const acc = this.accounts.get(accountNumber);
    if (!acc) {
      throw new InvalidAccountError(accountNumber);
    }
    return acc;
  }

  public getAllAccounts(): GLAccount[] {
    return Array.from(this.accounts.values());
  }

  public getJournalEntries(): JournalEntryRecord[] {
    return [...this.journalEntries];
  }

  /**
   * Posts an atomic, multi-line double-entry journal record.
   * Strictly enforces sum(debit) === sum(credit).
   */
  public postJournalEntry(input: JournalEntryInput): JournalEntryRecord {
    if (!input.lines || input.lines.length < 2) {
      throw new Error('A journal entry must contain at least 2 lines.');
    }

    let totalDebit = 0;
    let totalCredit = 0;

    // Validate account existence & sum lines
    for (const line of input.lines) {
      if (!this.accounts.has(line.glAccount)) {
        throw new InvalidAccountError(line.glAccount);
      }
      if (line.debit < 0 || line.credit < 0) {
        throw new Error(`Negative amounts are strictly disallowed on line: ${line.glAccount}`);
      }
      if (line.debit > 0 && line.credit > 0) {
        throw new Error(`A single line cannot have both debit and credit: ${line.glAccount}`);
      }
      totalDebit += line.debit;
      totalCredit += line.credit;
    }

    // Zero-sum invariant assertion (tolerance 0.0001)
    const difference = Math.abs(totalDebit - totalCredit);
    if (difference > 0.0001) {
      throw new UnbalancedJournalEntryError(totalDebit, totalCredit, difference);
    }

    // Generate entry number
    const datePrefix = (input.dateAccounting || new Date().toISOString().substring(0, 10)).replace(/-/g, '');
    const entrySeq = String(this.sequenceCounter++).padStart(5, '0');
    const entryNumber = input.entryNumber || `JRN-${datePrefix}-${entrySeq}`;

    const record: JournalEntryRecord = {
      ...input,
      id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      entryNumber,
      isPosted: true,
      createdAt: new Date().toISOString()
    };

    // Mutate running account balances
    for (const line of input.lines) {
      const acc = this.accounts.get(line.glAccount)!;
      acc.currentDebit += line.debit;
      acc.currentCredit += line.credit;
    }

    this.journalEntries.push(record);
    return record;
  }

  /**
   * Helper: Deposit Cash into Member Ordinary Savings (DAV)
   */
  public postDeposit(params: {
    agencyId: string;
    tellerAccount?: string;
    memberDAVAccount?: string;
    amount: number;
    memberCode: string;
    date: string;
    createdBy: string;
    transactionId?: string;
  }) {
    return this.postJournalEntry({
      agencyId: params.agencyId,
      transactionId: params.transactionId,
      dateAccounting: params.date,
      description: `Versement espèces adhérent ${params.memberCode}`,
      createdBy: params.createdBy,
      lines: [
        { glAccount: params.tellerAccount || STANDARD_GL_ACCOUNTS.TELLER_CASH, debit: params.amount, credit: 0, lineDescription: 'Encaissement espèces guichet' },
        { glAccount: params.memberDAVAccount || STANDARD_GL_ACCOUNTS.ORDINARY_SAVINGS_DAV, debit: 0, credit: params.amount, lineDescription: `Crédit DAV ${params.memberCode}` }
      ]
    });
  }

  /**
   * Helper: Cash Withdrawal from DAV with optional fee
   */
  public postWithdrawal(params: {
    agencyId: string;
    tellerAccount?: string;
    memberDAVAccount?: string;
    amount: number;
    feeAmount?: number;
    memberCode: string;
    date: string;
    createdBy: string;
    transactionId?: string;
  }) {
    const fee = params.feeAmount || 0;
    const lines: JournalLine[] = [];

    if (fee > 0) {
      lines.push(
        { glAccount: params.memberDAVAccount || STANDARD_GL_ACCOUNTS.ORDINARY_SAVINGS_DAV, debit: params.amount + fee, credit: 0, lineDescription: `Débit DAV ${params.memberCode}` },
        { glAccount: params.tellerAccount || STANDARD_GL_ACCOUNTS.TELLER_CASH, debit: 0, credit: params.amount, lineDescription: 'Décaissement espèces guichet' },
        { glAccount: STANDARD_GL_ACCOUNTS.ACCOUNT_MAINTENANCE_FEES, debit: 0, credit: fee, lineDescription: 'Frais de retrait guichet' }
      );
    } else {
      lines.push(
        { glAccount: params.memberDAVAccount || STANDARD_GL_ACCOUNTS.ORDINARY_SAVINGS_DAV, debit: params.amount, credit: 0, lineDescription: `Débit DAV ${params.memberCode}` },
        { glAccount: params.tellerAccount || STANDARD_GL_ACCOUNTS.TELLER_CASH, debit: 0, credit: params.amount, lineDescription: 'Décaissement espèces guichet' }
      );
    }

    return this.postJournalEntry({
      agencyId: params.agencyId,
      transactionId: params.transactionId,
      dateAccounting: params.date,
      description: `Retrait espèces adhérent ${params.memberCode}`,
      createdBy: params.createdBy,
      lines
    });
  }

  /**
   * Helper: Share Capital Subscription + Admission Fee
   */
  public postShareSubscription(params: {
    agencyId: string;
    tellerAccount?: string;
    shareAmount: number;
    feeAmount: number;
    unpaidShareAmount?: number;
    memberCode: string;
    date: string;
    createdBy: string;
    transactionId?: string;
  }) {
    const unpaid = params.unpaidShareAmount || 0;
    const paid = params.shareAmount;
    const fee = params.feeAmount;
    const totalCash = paid + fee;

    const lines: JournalLine[] = [
      { glAccount: params.tellerAccount || STANDARD_GL_ACCOUNTS.TELLER_CASH, debit: totalCash, credit: 0, lineDescription: 'Paiement souscription guichet' }
    ];

    if (unpaid > 0) {
      lines.push({ glAccount: STANDARD_GL_ACCOUNTS.SHARE_CAPITAL_UNPAID, debit: unpaid, credit: 0, lineDescription: 'Parts souscrites non libérées' });
      lines.push({ glAccount: STANDARD_GL_ACCOUNTS.SHARE_CAPITAL_INDIVIDUAL, debit: 0, credit: paid + unpaid, lineDescription: `Capital souscrit ${params.memberCode}` });
    } else {
      lines.push({ glAccount: STANDARD_GL_ACCOUNTS.SHARE_CAPITAL_INDIVIDUAL, debit: 0, credit: paid, lineDescription: `Parts sociales ${params.memberCode}` });
    }

    if (fee > 0) {
      lines.push({ glAccount: STANDARD_GL_ACCOUNTS.MEMBERSHIP_AND_PASSBOOK_FEES, debit: 0, credit: fee, lineDescription: 'Droits d\'adhésion SFD' });
    }

    return this.postJournalEntry({
      agencyId: params.agencyId,
      transactionId: params.transactionId,
      dateAccounting: params.date,
      description: `Souscription parts sociales & adhésion ${params.memberCode}`,
      createdBy: params.createdBy,
      lines
    });
  }

  /**
   * Helper: Tontine Daily Collection on the field
   */
  public postTontineCollection(params: {
    agencyId: string;
    collectorAccount?: string;
    dailyAmount: number;
    carnetNumber: string;
    memberCode: string;
    date: string;
    createdBy: string;
    transactionId?: string;
  }) {
    return this.postJournalEntry({
      agencyId: params.agencyId,
      transactionId: params.transactionId,
      dateAccounting: params.date,
      description: `Collecte journalière tontine carnet ${params.carnetNumber} (${params.memberCode})`,
      createdBy: params.createdBy,
      lines: [
        { glAccount: params.collectorAccount || STANDARD_GL_ACCOUNTS.COLLECTOR_CASH, debit: params.dailyAmount, credit: 0, lineDescription: 'Encaissement terrain collecteur' },
        { glAccount: STANDARD_GL_ACCOUNTS.TONTINE_SUSPENSE, debit: 0, credit: params.dailyAmount, lineDescription: `Attente tontine carnet ${params.carnetNumber}` }
      ]
    });
  }

  /**
   * Helper: Tontine Cycle Maturity Settlement (30 days to DAV, 1 day to 704000)
   */
  public postTontineSettlement(params: {
    agencyId: string;
    totalCollected: number;
    sfdCommission: number;
    memberDAVAccount?: string;
    carnetNumber: string;
    memberCode: string;
    date: string;
    createdBy: string;
    transactionId?: string;
  }) {
    const memberAmount = params.totalCollected - params.sfdCommission;
    return this.postJournalEntry({
      agencyId: params.agencyId,
      transactionId: params.transactionId,
      dateAccounting: params.date,
      description: `Reversement fin de cycle tontine carnet ${params.carnetNumber} (${params.memberCode})`,
      createdBy: params.createdBy,
      lines: [
        { glAccount: STANDARD_GL_ACCOUNTS.TONTINE_SUSPENSE, debit: params.totalCollected, credit: 0, lineDescription: `Solde compte d'attente carnet ${params.carnetNumber}` },
        { glAccount: params.memberDAVAccount || STANDARD_GL_ACCOUNTS.ORDINARY_SAVINGS_DAV, debit: 0, credit: memberAmount, lineDescription: 'Reversement épargne tontine adhérent' },
        { glAccount: STANDARD_GL_ACCOUNTS.TONTINE_COMMISSION_INCOME, debit: 0, credit: params.sfdCommission, lineDescription: 'Commission de gestion tontine SFD' }
      ]
    });
  }

  /**
   * Helper: Loan Disbursement
   */
  public postLoanDisbursement(params: {
    agencyId: string;
    loanAmount: number;
    feeAmount: number;
    disbursementAccount?: string;
    loanGLAccount?: string;
    loanNumber: string;
    date: string;
    createdBy: string;
    transactionId?: string;
  }) {
    const netDisbursed = params.loanAmount - params.feeAmount;
    const lines: JournalLine[] = [
      { glAccount: params.loanGLAccount || STANDARD_GL_ACCOUNTS.LOANS_SHORT_TERM, debit: params.loanAmount, credit: 0, lineDescription: `Créance crédit ${params.loanNumber}` },
      { glAccount: params.disbursementAccount || STANDARD_GL_ACCOUNTS.TELLER_CASH, debit: 0, credit: netDisbursed, lineDescription: 'Net décaissé au membre' }
    ];
    if (params.feeAmount > 0) {
      lines.push({ glAccount: STANDARD_GL_ACCOUNTS.LOAN_COMMISSIONS_FEES, debit: 0, credit: params.feeAmount, lineDescription: 'Frais de dossier et commissions crédit' });
    }

    return this.postJournalEntry({
      agencyId: params.agencyId,
      transactionId: params.transactionId,
      dateAccounting: params.date,
      description: `Décaissement crédit ${params.loanNumber}`,
      createdBy: params.createdBy,
      lines
    });
  }

  /**
   * Helper: Loan Repayment Installment
   */
  public postLoanRepayment(params: {
    agencyId: string;
    tellerAccount?: string;
    principalPaid: number;
    interestPaid: number;
    penaltyPaid?: number;
    loanGLAccount?: string;
    loanNumber: string;
    date: string;
    createdBy: string;
    transactionId?: string;
  }) {
    const penalty = params.penaltyPaid || 0;
    const totalCash = params.principalPaid + params.interestPaid + penalty;
    const lines: JournalLine[] = [
      { glAccount: params.tellerAccount || STANDARD_GL_ACCOUNTS.TELLER_CASH, debit: totalCash, credit: 0, lineDescription: `Remboursement échéance crédit ${params.loanNumber}` }
    ];

    if (params.principalPaid > 0) {
      lines.push({ glAccount: params.loanGLAccount || STANDARD_GL_ACCOUNTS.LOANS_SHORT_TERM, debit: 0, credit: params.principalPaid, lineDescription: 'Amortissement principal' });
    }
    if (params.interestPaid > 0) {
      lines.push({ glAccount: STANDARD_GL_ACCOUNTS.INTEREST_INCOME_SHORT_TERM, debit: 0, credit: params.interestPaid, lineDescription: 'Intérêts sur crédit' });
    }
    if (penalty > 0) {
      lines.push({ glAccount: STANDARD_GL_ACCOUNTS.LATE_PENALTIES_INCOME, debit: 0, credit: penalty, lineDescription: 'Pénalités de retard perçues' });
    }

    return this.postJournalEntry({
      agencyId: params.agencyId,
      transactionId: params.transactionId,
      dateAccounting: params.date,
      description: `Règlement mensualité crédit ${params.loanNumber}`,
      createdBy: params.createdBy,
      lines
    });
  }

  /**
   * Helper: Cash Discrepancy Shift Settlement (Manquant / Excédent)
   */
  public postCashDiscrepancy(params: {
    agencyId: string;
    tellerAccount?: string;
    discrepancyAmount: number; // positive = surplus (excédent), negative = shortage (manquant)
    date: string;
    createdBy: string;
  }) {
    if (params.discrepancyAmount === 0) return null;

    if (params.discrepancyAmount > 0) {
      // Surplus (Excédent de caisse)
      return this.postJournalEntry({
        agencyId: params.agencyId,
        dateAccounting: params.date,
        description: `Excédent de caisse constaté à l'arrêté`,
        createdBy: params.createdBy,
        lines: [
          { glAccount: params.tellerAccount || STANDARD_GL_ACCOUNTS.TELLER_CASH, debit: params.discrepancyAmount, credit: 0, lineDescription: 'Excédent physique caisse' },
          { glAccount: STANDARD_GL_ACCOUNTS.CASH_SURPLUS_OVERAGE, debit: 0, credit: params.discrepancyAmount, lineDescription: 'Compte d\'attente excédent' }
        ]
      });
    } else {
      // Shortage (Manquant de caisse)
      const absAmount = Math.abs(params.discrepancyAmount);
      return this.postJournalEntry({
        agencyId: params.agencyId,
        dateAccounting: params.date,
        description: `Manquant de caisse constaté à l'arrêté`,
        createdBy: params.createdBy,
        lines: [
          { glAccount: STANDARD_GL_ACCOUNTS.CASH_DEFICIT_SHORTAGE, debit: absAmount, credit: 0, lineDescription: 'Débit régularisation manquant' },
          { glAccount: params.tellerAccount || STANDARD_GL_ACCOUNTS.TELLER_CASH, debit: 0, credit: absAmount, lineDescription: 'Sortie manquant caisse' }
        ]
      });
    }
  }

  /**
   * Helper: DAT Accrued Interest Monthly Accrual
   */
  public postDATInterestAccrual(params: {
    agencyId: string;
    amount: number;
    date: string;
    createdBy: string;
  }) {
    return this.postJournalEntry({
      agencyId: params.agencyId,
      dateAccounting: params.date,
      description: 'Constatation intérêts courus sur dépôts à terme (DAT)',
      createdBy: params.createdBy,
      lines: [
        { glAccount: STANDARD_GL_ACCOUNTS.INTEREST_EXPENSE_DAT, debit: params.amount, credit: 0, lineDescription: 'Charge financière intérêts DAT' },
        { glAccount: STANDARD_GL_ACCOUNTS.DAT_ACCRUED_INTEREST, debit: 0, credit: params.amount, lineDescription: 'Intérêts courus non échus sur DAT' }
      ]
    });
  }

  /**
   * Helper: PAR Provisioning
   */
  public postPARProvision(params: {
    agencyId: string;
    provisionAmount: number;
    targetAccount: '299100' | '299200' | '299300';
    date: string;
    createdBy: string;
  }) {
    return this.postJournalEntry({
      agencyId: params.agencyId,
      dateAccounting: params.date,
      description: `Dotation aux provisions pour créances douteuses (${params.targetAccount})`,
      createdBy: params.createdBy,
      lines: [
        { glAccount: STANDARD_GL_ACCOUNTS.PROVISION_EXPENSE_LOANS, debit: params.provisionAmount, credit: 0, lineDescription: 'Dotation charges d\'exploitation' },
        { glAccount: params.targetAccount, debit: 0, credit: params.provisionAmount, lineDescription: 'Provision pour dépréciation portefeuille' }
      ]
    });
  }
}
