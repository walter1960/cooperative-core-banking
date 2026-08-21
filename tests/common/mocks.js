/**
 * BANOLIA High-Fidelity Mock Engines & Hardware Adapters
 * Implements deterministic simulation for SYSCOA-SFD Ledger, ESC/POS, Biometrics, Telecoms, and Voice AI.
 */

import { FIXTURES } from './fixtures.js';
import { harness } from './harness.js';
import { performance } from 'node:perf_hooks';
import crypto from 'node:crypto';

// ============================================================================
// 1. SYSCOA-SFD GENERAL LEDGER ENGINE
// ============================================================================

export class MockGeneralLedger {
  constructor(initialAccounts = FIXTURES.STANDARD_SYSCOA_ACCOUNTS) {
    this.accounts = new Map();
    this.journalEntries = [];
    this.sequence = 1;

    for (const acc of initialAccounts) {
      this.accounts.set(acc.accountNumber, {
        ...acc,
        currentDebit: 0,
        currentCredit: 0
      });
    }
  }

  getAccount(accountNumber) {
    const acc = this.accounts.get(accountNumber);
    if (!acc) throw new Error(`GL Account ${accountNumber} not found in chart of accounts`);
    return acc;
  }

  postJournalEntry({ date, description, lines, agencyCode = 'A02', createdBy = 'usr-01' }) {
    if (!lines || lines.length < 2) {
      throw new Error('A journal entry must contain at least 2 lines');
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      if (!this.accounts.has(line.accountNumber)) {
        throw new Error(`Account ${line.accountNumber} not recognized`);
      }
      const dr = Number(line.debit || 0);
      const cr = Number(line.credit || 0);
      if (dr < 0 || cr < 0) throw new Error('Negative amounts forbidden in GL');
      if (dr > 0 && cr > 0) throw new Error('A single line cannot have both debit and credit');
      totalDebit += dr;
      totalCredit += cr;
    }

    const diff = Math.abs(totalDebit - totalCredit);
    if (diff > 0.0001) {
      throw new Error(`Unbalanced entry! Debit: ${totalDebit} != Credit: ${totalCredit} (Diff: ${diff})`);
    }

    // Record in global test invariant tracker
    harness.recordLedgerEntry(totalDebit, totalCredit);

    const entryNumber = `JRN-${(date || '2026-08-20').replace(/-/g, '')}-${String(this.sequence++).padStart(5, '0')}`;
    const record = {
      entryNumber,
      date: date || '2026-08-20',
      description,
      agencyCode,
      createdBy,
      totalDebit,
      totalCredit,
      lines: lines.map(l => ({ ...l, debit: Number(l.debit || 0), credit: Number(l.credit || 0) })),
      postedAt: new Date().toISOString()
    };

    for (const line of record.lines) {
      const acc = this.accounts.get(line.accountNumber);
      acc.currentDebit += line.debit;
      acc.currentCredit += line.credit;
    }

    this.journalEntries.push(record);
    return record;
  }

  postDeposit({ memberCode, amount, date = '2026-08-20' }) {
    return this.postJournalEntry({
      date,
      description: `Versement espèces adhérent ${memberCode}`,
      lines: [
        { accountNumber: '571200', debit: amount, credit: 0, desc: 'Caisse guichet' },
        { accountNumber: '251211', debit: 0, credit: amount, desc: `Crédit DAV ${memberCode}` }
      ]
    });
  }

  postWithdrawal({ memberCode, amount, fee = 0, date = '2026-08-20' }) {
    const lines = [
      { accountNumber: '251211', debit: amount + fee, credit: 0, desc: `Débit DAV ${memberCode}` },
      { accountNumber: '571200', debit: 0, credit: amount, desc: 'Décaissement espèces' }
    ];
    if (fee > 0) {
      lines.push({ accountNumber: '705000', debit: 0, credit: fee, desc: 'Frais de retrait' });
    }
    return this.postJournalEntry({
      date,
      description: `Retrait espèces adhérent ${memberCode}`,
      lines
    });
  }

  postSharePurchase({ memberCode, sharesCount, unitPrice = 5000, fee = 2000, date = '2026-08-20' }) {
    const shareTotal = sharesCount * unitPrice;
    const totalCash = shareTotal + fee;
    const lines = [
      { accountNumber: '571200', debit: totalCash, credit: 0, desc: 'Encaissement souscription' },
      { accountNumber: '101100', debit: 0, credit: shareTotal, desc: `Parts sociales ${memberCode}` }
    ];
    if (fee > 0) {
      lines.push({ accountNumber: '706000', debit: 0, credit: fee, desc: 'Droits adhésion' });
    }
    return this.postJournalEntry({
      date,
      description: `Souscription parts sociales ${memberCode}`,
      lines
    });
  }

  postTontineDailyCollection({ collectorAccount = '571300', dailyAmount, carnetNumber, date = '2026-08-20' }) {
    return this.postJournalEntry({
      date,
      description: `Collecte journalière tontine ${carnetNumber}`,
      lines: [
        { accountNumber: collectorAccount, debit: dailyAmount, credit: 0, desc: 'Caisse collecteur' },
        { accountNumber: '258000', debit: 0, credit: dailyAmount, desc: 'Attente tontine' }
      ]
    });
  }

  postTontineSettlement({ totalCollected, sfdCommission, memberDAVAccount = '251100', carnetNumber, date = '2026-08-20' }) {
    const memberPayout = totalCollected - sfdCommission;
    return this.postJournalEntry({
      date,
      description: `Reversement fin de cycle tontine ${carnetNumber}`,
      lines: [
        { accountNumber: '258000', debit: totalCollected, credit: 0, desc: 'Solde attente tontine' },
        { accountNumber: memberDAVAccount, debit: 0, credit: memberPayout, desc: 'Reversement membre' },
        { accountNumber: '704000', debit: 0, credit: sfdCommission, desc: 'Commission SFD (1 mise)' }
      ]
    });
  }

  postLoanDisbursement({ loanNumber, amount, fee = 0, date = '2026-08-20' }) {
    const netDisbursed = amount - fee;
    const lines = [
      { accountNumber: '201100', debit: amount, credit: 0, desc: `Créance prêt ${loanNumber}` },
      { accountNumber: '251100', debit: 0, credit: netDisbursed, desc: 'Crédit compte membre' }
    ];
    if (fee > 0) {
      lines.push({ accountNumber: '702000', debit: 0, credit: fee, desc: 'Frais dossier crédit' });
    }
    return this.postJournalEntry({
      date,
      description: `Décaissement prêt ${loanNumber}`,
      lines
    });
  }

  postLoanRepayment({ loanNumber, principal, interest, penalty = 0, date = '2026-08-20' }) {
    const totalPayment = principal + interest + penalty;
    const lines = [
      { accountNumber: '571200', debit: totalPayment, credit: 0, desc: 'Encaissement remboursement' }
    ];
    if (principal > 0) lines.push({ accountNumber: '201100', debit: 0, credit: principal, desc: 'Principal remboursé' });
    if (interest > 0) lines.push({ accountNumber: '701100', debit: 0, credit: interest, desc: 'Intérêts perçus' });
    if (penalty > 0) lines.push({ accountNumber: '703000', debit: 0, credit: penalty, desc: 'Pénalités retard' });

    return this.postJournalEntry({
      date,
      description: `Remboursement échéance prêt ${loanNumber}`,
      lines
    });
  }

  postShiftDiscrepancy({ discrepancyAmount, date = '2026-08-20' }) {
    if (discrepancyAmount === 0) return null;
    if (discrepancyAmount > 0) {
      // Surplus (Excédent)
      return this.postJournalEntry({
        date,
        description: 'Excédent de caisse constaté à l\'arrêté',
        lines: [
          { accountNumber: '571200', debit: discrepancyAmount, credit: 0, desc: 'Caisse guichet' },
          { accountNumber: '472200', debit: 0, credit: discrepancyAmount, desc: 'Excédent guichet' }
        ]
      });
    } else {
      // Shortage (Manquant)
      const absAmount = Math.abs(discrepancyAmount);
      return this.postJournalEntry({
        date,
        description: 'Manquant de caisse constaté à l\'arrêté',
        lines: [
          { accountNumber: '471200', debit: absAmount, credit: 0, desc: 'Manquant guichet' },
          { accountNumber: '571200', debit: 0, credit: absAmount, desc: 'Caisse guichet' }
        ]
      });
    }
  }

  generateTrialBalance() {
    let totalDebit = 0;
    let totalCredit = 0;
    const rows = [];

    for (const acc of this.accounts.values()) {
      totalDebit += acc.currentDebit;
      totalCredit += acc.currentCredit;
      const net = acc.currentDebit - acc.currentCredit;
      rows.push({
        accountNumber: acc.accountNumber,
        name: acc.name,
        debit: acc.currentDebit,
        credit: acc.currentCredit,
        netBalance: net
      });
    }

    return {
      rows,
      totalDebit,
      totalCredit,
      balanced: Math.abs(totalDebit - totalCredit) < 0.0001
    };
  }

  generateBilan() {
    let actif = 0;
    let passif = 0;
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const acc of this.accounts.values()) {
      const net = acc.currentDebit - acc.currentCredit;
      if (acc.type === 'ASSET') actif += Math.max(0, net);
      if (acc.type === 'CONTRA_ASSET') actif -= Math.max(0, -net);
      if (acc.type === 'LIABILITY' || acc.type === 'EQUITY') passif += Math.max(0, -net);
      if (acc.type === 'INCOME') totalIncome += Math.max(0, -net);
      if (acc.type === 'EXPENSE') totalExpenses += Math.max(0, net);
    }

    const netResult = totalIncome - totalExpenses;
    passif += netResult;

    return {
      totalActif: actif,
      totalPassif: passif,
      netResult,
      balanced: Math.abs(actif - passif) < 0.0001
    };
  }

  calculatePrudentialRatios({
    liquidAssets = 120000000,
    shortTermLiabilities = 100000000,
    grossPortfolio = 200000000,
    overdue30 = 6000000,
    overdue90 = 2000000,
    netEquity = 36000000,
    riskWeightedAssets = 200000000,
    totalIncome = 25000000,
    totalExpenses = 20000000
  } = {}) {
    const rLiq = (liquidAssets / shortTermLiabilities) * 100;
    const par30 = grossPortfolio > 0 ? (overdue30 / grossPortfolio) * 100 : 0;
    const par90 = grossPortfolio > 0 ? (overdue90 / grossPortfolio) * 100 : 0;
    const car = (netEquity / riskWeightedAssets) * 100;
    const oss = totalExpenses > 0 ? (totalIncome / totalExpenses) * 100 : 100;

    return {
      rLiq: { value: Math.round(rLiq * 100) / 100, compliant: rLiq >= 100, min: 100 },
      par30: { value: Math.round(par30 * 100) / 100, compliant: par30 <= 5.0, max: 5.0 },
      par90: { value: Math.round(par90 * 100) / 100, compliant: par90 <= 3.0, max: 3.0 },
      car: { value: Math.round(car * 100) / 100, compliant: car >= 15.0, min: 15.0 },
      oss: { value: Math.round(oss * 100) / 100, compliant: oss >= 100.0, min: 100 }
    };
  }
}

// ============================================================================
// 2. AMORTIZATION & INTEREST ENGINE
// ============================================================================

export class MockAmortizationEngine {
  static simulate({ principal, annualRate, months, formula = 'CONSTANT_ANNUITY' }) {
    if (annualRate > 27.0) {
      harness.recordUsuryRate(annualRate, false);
      throw new Error(`Usury ceiling violation: Rate ${annualRate}% exceeds BCEAO maximum limit of 27.0%`);
    }
    harness.recordUsuryRate(annualRate, true);

    const monthlyRate = (annualRate / 100) / 12;
    const schedule = [];
    let remainingPrincipal = principal;

    if (formula === 'CONSTANT_ANNUITY') {
      const annuity = Math.round(principal * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -months))));
      for (let i = 1; i <= months; i++) {
        const interest = Math.round(remainingPrincipal * monthlyRate);
        const principalPart = i === months ? remainingPrincipal : annuity - interest;
        const payment = principalPart + interest;
        remainingPrincipal -= principalPart;
        schedule.push({
          periodNumber: i,
          payment,
          principal: principalPart,
          interest,
          remainingPrincipal: Math.max(0, remainingPrincipal)
        });
      }
    } else if (formula === 'CONSTANT_PRINCIPAL') {
      const fixedPrincipal = Math.round(principal / months);
      for (let i = 1; i <= months; i++) {
        const interest = Math.round(remainingPrincipal * monthlyRate);
        const principalPart = i === months ? remainingPrincipal : fixedPrincipal;
        const payment = principalPart + interest;
        remainingPrincipal -= principalPart;
        schedule.push({
          periodNumber: i,
          payment,
          principal: principalPart,
          interest,
          remainingPrincipal: Math.max(0, remainingPrincipal)
        });
      }
    } else if (formula === 'IN_FINE') {
      const monthlyInterest = Math.round(principal * monthlyRate);
      for (let i = 1; i <= months; i++) {
        const isLast = i === months;
        const principalPart = isLast ? principal : 0;
        const payment = principalPart + monthlyInterest;
        remainingPrincipal = isLast ? 0 : principal;
        schedule.push({
          periodNumber: i,
          payment,
          principal: principalPart,
          interest: monthlyInterest,
          remainingPrincipal
        });
      }
    } else if (formula === 'FLAT') {
      const totalInterest = Math.round(principal * (annualRate / 100) * (months / 12));
      const monthlyInterest = Math.round(totalInterest / months);
      const monthlyPrincipal = Math.round(principal / months);
      for (let i = 1; i <= months; i++) {
        const principalPart = i === months ? remainingPrincipal : monthlyPrincipal;
        const payment = principalPart + monthlyInterest;
        remainingPrincipal -= principalPart;
        schedule.push({
          periodNumber: i,
          payment,
          principal: principalPart,
          interest: monthlyInterest,
          remainingPrincipal: Math.max(0, remainingPrincipal)
        });
      }
    }

    const totalPayment = schedule.reduce((sum, r) => sum + r.payment, 0);
    const totalInterestPaid = schedule.reduce((sum, r) => sum + r.interest, 0);

    return {
      principal,
      annualRate,
      months,
      formula,
      monthlyPayment: schedule[0]?.payment || 0,
      totalPayment,
      totalInterest: totalInterestPaid,
      schedule
    };
  }

  static calculate15DayInterest(balanceHistory, annualRate = 3.5) {
    // 24 fortnights (quinzaines) per year
    const quinzaineRate = (annualRate / 100) / 24;
    let totalInterest = 0;
    for (const q of balanceHistory) {
      totalInterest += q.minBalance * quinzaineRate;
    }
    return Math.round(totalInterest);
  }
}

// ============================================================================
// 3. BIOMETRIC ISO 19794-2 HAL & MATCHER
// ============================================================================

export class MockBiometricHAL {
  static generateTemplate(memberCode, quality = 95) {
    const buf = Buffer.alloc(512);
    buf.write('FMR\0', 0, 4, 'ascii'); // Magic header
    buf.writeUInt16BE(512, 4);          // Record length
    buf.writeUInt8(quality, 6);         // Quality score
    buf.write(memberCode, 8, 16, 'ascii');
    // Generate deterministic minutiae bytes
    const hash = crypto.createHash('sha256').update(memberCode).digest();
    hash.copy(buf, 24);
    return buf;
  }

  static match(templateA, templateB, threshold = 85) {
    if (!templateA || !templateB || templateA.length < 32 || templateB.length < 32) {
      return { matched: false, score: 0, error: 'Corrupted biometric template' };
    }
    const magicA = templateA.subarray(0, 4).toString('ascii');
    const magicB = templateB.subarray(0, 4).toString('ascii');
    if (magicA !== 'FMR\0' || magicB !== 'FMR\0') {
      return { matched: false, score: 0, error: 'Invalid ISO 19794-2 header' };
    }

    const codeA = templateA.subarray(8, 24).toString('ascii').replace(/\0/g, '').trim();
    const codeB = templateB.subarray(8, 24).toString('ascii').replace(/\0/g, '').trim();

    if (codeA === codeB && codeA.length > 0) {
      return { matched: true, score: 96, memberCode: codeA };
    }
    // Partial cross score
    let matchingBytes = 0;
    for (let i = 24; i < 56; i++) {
      if (templateA[i] === templateB[i]) matchingBytes++;
    }
    const score = Math.round((matchingBytes / 32) * 50);
    return { matched: score >= threshold, score, memberCode: null };
  }
}

// ============================================================================
// 4. ESC/POS THERMAL PRINTER DRIVER
// ============================================================================

export class MockEscPosPrinter {
  static format80mmReceipt({ receiptNumber, memberName, memberCode, type, amount, balance, cashier = 'Akouvi Mensah', date = '2026-08-20 10:30' }) {
    const lines = [];
    lines.push('\x1B\x40'); // INIT
    lines.push('\x1B\x61\x01'); // ALIGN CENTER
    lines.push('*** COOPEC BANOLIA ***\n');
    lines.push('Agence Centrale Lomé Grand Marché\n');
    lines.push('Agrément N° T/1/189/SFD/BCEAO/2026\n');
    lines.push('------------------------------------------------\n');
    lines.push('\x1B\x45\x01'); // BOLD ON
    lines.push(`REÇU DE ${type.toUpperCase()}: ${receiptNumber}\n`);
    lines.push('\x1B\x45\x00'); // BOLD OFF
    lines.push('\x1B\x61\x00'); // ALIGN LEFT
    lines.push(`Date/Heure: ${date}\n`);
    lines.push(`Adhérent:   ${memberName} (${memberCode})\n`);
    lines.push(`Caissier:   ${cashier}\n`);
    lines.push('------------------------------------------------\n');
    lines.push('\x1D\x21\x11'); // DOUBLE SIZE
    lines.push(`MONTANT: ${amount.toLocaleString('fr-FR')} XOF\n`);
    lines.push('\x1D\x21\x00'); // NORMAL SIZE
    lines.push(`Nouveau Solde Disponible: ${balance.toLocaleString('fr-FR')} XOF\n`);
    lines.push('------------------------------------------------\n');
    lines.push('\x1B\x61\x01'); // ALIGN CENTER
    lines.push(`QR:[v1:${receiptNumber}:${amount}:${memberCode}]\n`);
    lines.push('Merci de votre confiance!\n');
    lines.push('\x1D\x56\x42\x03\n'); // FEED & CUT

    const textPart = Buffer.from(lines.join(''), 'utf-8');
    const drawerKick = Buffer.from([0x1B, 0x70, 0x00, 0x19, 0xFA]);
    return Buffer.concat([textPart, drawerKick]);
  }

  static format58mmCollectorReceipt({ carnetNumber, memberName, amount, paidDays = '14/31', collector = 'COL01' }) {
    const lines = [];
    lines.push('\x1B\x40'); // INIT
    lines.push('\x1B\x61\x01'); // CENTER
    lines.push('* BANOLIA TONTINE *\n');
    lines.push(`Carnet: ${carnetNumber}\n`);
    lines.push(`Membre: ${memberName}\n`);
    lines.push(`Cotisation: ${amount.toLocaleString('fr-FR')} F\n`);
    lines.push(`Progression: ${paidDays}\n`);
    lines.push(`Collecteur: ${collector}\n`);
    lines.push('\x1D\x56\x42\x01'); // CUT
    return Buffer.from(lines.join(''), 'utf-8');
  }
}

// ============================================================================
// 5. MOBILE MONEY GATEWAY ADAPTER (TMoney, Flooz, Wave, MTN, Orange)
// ============================================================================

export class MockMobileMoneyGateway {
  constructor() {
    this.transactions = new Map();
  }

  async initiateDeposit({ provider, phone, amount, accountNumber }) {
    const txRef = `MOMO-${provider.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record = {
      txRef,
      provider,
      phone,
      amount,
      accountNumber,
      status: 'SUCCESS',
      timestamp: new Date().toISOString()
    };
    this.transactions.set(txRef, record);
    return { success: true, txRef, status: 'SUCCESS', message: 'USSD Push Confirmed' };
  }

  async initiateWithdrawal({ provider, phone, amount, accountNumber }) {
    const txRef = `MOMO-WD-${provider.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record = {
      txRef,
      provider,
      phone,
      amount,
      accountNumber,
      status: 'SUCCESS',
      timestamp: new Date().toISOString()
    };
    this.transactions.set(txRef, record);
    return { success: true, txRef, status: 'SUCCESS' };
  }

  verifyTransaction(txRef) {
    const tx = this.transactions.get(txRef);
    if (!tx) return { found: false, status: 'NOT_FOUND' };
    return { found: true, ...tx };
  }
}

// ============================================================================
// 6. MULTILINGUAL VOICE AI ENGINE (Gemini Simulation & Sub-2s Latency Budget)
// ============================================================================

export class MockVoiceAIEngine {
  static parseOrder(transcript, locale = 'fr') {
    const start = performance.now();
    const rawText = (transcript || '').toLowerCase();
    const text = rawText
      .replace(/[ɖɗ]/g, 'd')
      .replace(/[ɛ]/g, 'e')
      .replace(/[ɔ]/g, 'o')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '');

    let intent = 'UNKNOWN';
    let amount = 0;
    let memberCode = 'A0200225';
    let memberName = 'MILDZINA Tomrom';

    // Intent detection
    if (text.includes('versement') || text.includes('depot') || text.includes('ga dodo') || text.includes('so do')) {
      intent = 'CASH_DEPOSIT';
    } else if (text.includes('retrait') || text.includes('retirer') || text.includes('ga dede')) {
      intent = 'CASH_WITHDRAWAL';
    } else if (text.includes('tontine') || text.includes('cotisation') || text.includes('asusu')) {
      intent = 'TONTINE_COLLECTION';
    } else if (text.includes('remboursement') || text.includes('pret') || text.includes('credit') || text.includes('fe ququ')) {
      intent = 'LOAN_REPAYMENT';
    } else if (text.includes('solde') || text.includes('situation') || text.includes('par 30') || text.includes('ratio')) {
      intent = 'BALANCE_INQUIRY';
    }

    // Amount extraction
    if (text.includes('cinquante mille') || text.includes('50000') || text.includes('50 000') || text.includes('blaato')) {
      amount = 50000;
    } else if (text.includes('vingt mille') || text.includes('20000') || text.includes('20 000') || text.includes('blaeve')) {
      amount = 20000;
    } else if (text.includes('dix mille') || text.includes('10000') || text.includes('ewo')) {
      amount = 10000;
    } else if (text.includes('mille') || text.includes('1000') || text.includes('deka')) {
      amount = 1000;
    } else if (text.includes('cent mille') || text.includes('100000') || text.includes('sac') || text.includes('kotoku')) {
      amount = 100000;
    }

    // Member resolution
    if (text.includes('mensah') || text.includes('611') || text.includes('adanlete')) {
      memberCode = 'A0200226';
      memberName = 'ADANLETE Mensah';
    } else if (text.includes('afiwa') || text.includes('612') || text.includes('kodjo')) {
      memberCode = 'A0200227';
      memberName = 'KODJO Afiwa';
    } else if (text.includes('tomrom') || text.includes('610') || text.includes('mildzina')) {
      memberCode = 'A0200225';
      memberName = 'MILDZINA Tomrom';
    }

    const elapsed = Math.round(performance.now() - start);
    harness.recordVoiceLatency(elapsed);

    return {
      intent,
      confidence: 0.96,
      extracted_data: {
        member_code: memberCode,
        member_name: memberName,
        amount,
        currency: 'XOF'
      },
      latency_ms: elapsed,
      clarification_needed: false
    };
  }
}

// ============================================================================
// 7. OFFLINE SYNC ENGINE & IDEMPOTENCY
// ============================================================================

export class MockOfflineSyncEngine {
  constructor() {
    this.processedKeys = new Map();
    this.outboxQueue = [];
  }

  generateIdempotencyKey(params) {
    const raw = `${params.agencyCode}_${params.cashierId}_${params.timestamp}_${params.amount}_${params.type}`;
    const hash = crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16);
    return `idemp_${params.agencyCode}_${Date.now()}_${hash}`;
  }

  processBatchSync({ batchId, transactions }) {
    const results = [];
    for (const tx of transactions) {
      if (this.processedKeys.has(tx.idempotencyKey)) {
        harness.recordSyncReplay(true);
        results.push({
          idempotencyKey: tx.idempotencyKey,
          status: 'DUPLICATE',
          ledgerTxId: this.processedKeys.get(tx.idempotencyKey).ledgerTxId,
          error: null
        });
      } else {
        harness.recordSyncReplay(false);
        const ledgerTxId = `TX-SRV-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const record = { ledgerTxId, ...tx, committedAt: new Date().toISOString() };
        this.processedKeys.set(tx.idempotencyKey, record);
        results.push({
          idempotencyKey: tx.idempotencyKey,
          status: 'COMMITTED',
          ledgerTxId,
          error: null
        });
      }
    }

    return {
      batchId,
      status: 'SUCCESS',
      processedCount: transactions.length,
      results
    };
  }
}
