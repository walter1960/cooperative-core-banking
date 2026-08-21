import { GeneralLedgerEngine } from './ledger';
import {
  TrialBalanceReport,
  TrialBalanceRow,
  BalanceSheetReport,
  IncomeStatementReport,
  PrudentialRatiosReport,
  PrudentialRatioResult
} from './types';
import { BCEAO_REGULATIONS } from '../config/constants';

export class FinancialReportsEngine {
  constructor(private ledger: GeneralLedgerEngine) {}

  /**
   * Generates 6-Column Trial Balance (Balance Générale)
   */
  public generateTrialBalance(asOfDate: string = new Date().toISOString().substring(0, 10)): TrialBalanceReport {
    const accounts = this.ledger.getAllAccounts();
    const rows: TrialBalanceRow[] = [];

    let sumDebit = 0;
    let sumCredit = 0;
    let sumDebitBal = 0;
    let sumCreditBal = 0;

    for (const acc of accounts) {
      const net = acc.currentDebit - acc.currentCredit;
      let debitBal = 0;
      let creditBal = 0;

      if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
        if (net >= 0) debitBal = net;
        else creditBal = Math.abs(net);
      } else {
        if (net <= 0) creditBal = Math.abs(net);
        else debitBal = net;
      }

      rows.push({
        accountNumber: acc.accountNumber,
        accountName: acc.name,
        accountClass: acc.accountClass,
        totalDebit: acc.currentDebit,
        totalCredit: acc.currentCredit,
        debitBalance: debitBal,
        creditBalance: creditBal
      });

      sumDebit += acc.currentDebit;
      sumCredit += acc.currentCredit;
      sumDebitBal += debitBal;
      sumCreditBal += creditBal;
    }

    const isBalanced = Math.abs(sumDebit - sumCredit) < 0.01 && Math.abs(sumDebitBal - sumCreditBal) < 0.01;

    return {
      asOfDate,
      currency: 'XOF',
      rows,
      totalDebit: sumDebit,
      totalCredit: sumCredit,
      totalDebitBalance: sumDebitBal,
      totalCreditBalance: sumCreditBal,
      isBalanced
    };
  }

  /**
   * Generates Regulatory Income Statement (Compte de Résultat)
   */
  public generateIncomeStatement(startDate: string = '2026-01-01', endDate: string = new Date().toISOString().substring(0, 10)): IncomeStatementReport {
    const accounts = this.ledger.getAllAccounts();
    const balanceMap = new Map<string, number>();

    for (const acc of accounts) {
      const bal = acc.type === 'INCOME' 
        ? acc.currentCredit - acc.currentDebit 
        : acc.currentDebit - acc.currentCredit;
      balanceMap.set(acc.accountNumber, bal);
    }

    const get = (code: string) => balanceMap.get(code) || 0;

    const interestIncome = get('701100') + get('701200') + get('711000');
    const interestExpense = get('601000') + get('602000') + get('603000');
    const netFinancialMargin = interestIncome - interestExpense;

    const commissionIncome = get('702000') + get('703000') + get('704000') + get('705000') + get('706000');
    const financialFees = get('611000');
    const bankingIncomePNB = netFinancialMargin + commissionIncome - financialFees;

    const generalOperatingExpenses = get('621000') + get('631000') + get('641000');
    const grossOperatingResult = bankingIncomePNB - generalOperatingExpenses;

    const netRiskCost = (get('651000') + get('661000')) - get('761000');
    const operatingResult = grossOperatingResult - netRiskCost;

    const exceptionalNet = get('781000') - get('681000');
    const netIncome = operatingResult + exceptionalNet;

    return {
      startDate,
      endDate,
      currency: 'XOF',
      interestIncome,
      interestExpense,
      netFinancialMargin,
      commissionIncome,
      bankingIncomePNB,
      generalOperatingExpenses,
      grossOperatingResult,
      netRiskCost,
      operatingResult,
      exceptionalNet,
      netIncome
    };
  }

  /**
   * Generates Regulatory Balance Sheet (Bilan Actif / Passif)
   */
  public generateBalanceSheet(asOfDate: string = new Date().toISOString().substring(0, 10)): BalanceSheetReport {
    const accounts = this.ledger.getAllAccounts();
    const pnl = this.generateIncomeStatement('2026-01-01', asOfDate);
    
    const getNet = (prefix: string) => {
      let sum = 0;
      for (const acc of accounts) {
        if (acc.accountNumber.startsWith(prefix)) {
          if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
            sum += (acc.currentDebit - acc.currentCredit);
          } else {
            sum += (acc.currentCredit - acc.currentDebit);
          }
        }
      }
      return sum;
    };

    // Assets
    const liquidAssets = [
      { code: '571', label: 'Caisses Physiques', amount: getNet('571') },
      { code: '578', label: 'Portefeuilles Mobile Money', amount: getNet('578') },
      { code: '311', label: 'Banques Locales', amount: getNet('311') },
      { code: '312', label: 'Trésor Public', amount: getNet('312') }
    ];

    const loansGross = [
      { code: '201', label: 'Crédits Court Terme', amount: getNet('201') },
      { code: '202', label: 'Crédits Moyen Terme', amount: getNet('202') },
      { code: '203', label: 'Crédits Long Terme', amount: getNet('203') },
      { code: '204', label: 'Crédits Personnel & Dirigeants', amount: getNet('204') },
      { code: '291', label: 'Créances en Souffrance (PAR)', amount: getNet('291') }
    ];

    const loanProvisions = [
      { code: '299', label: 'Provisions Dépréciation Portefeuille', amount: getNet('299') }
    ];

    const totalLoansGross = loansGross.reduce((s, i) => s + i.amount, 0);
    const totalLoanProvisions = loanProvisions.reduce((s, i) => s + i.amount, 0);
    const loansNet = totalLoansGross - totalLoanProvisions;

    const otherAssets = [
      { code: '4712', label: 'Débiteurs & Écarts Caisse Manquants', amount: getNet('4712') },
      { code: '208', label: 'Créances Rattachées (Intérêts Courus)', amount: getNet('208') },
      { code: '581', label: 'Virements Internes & Fonds en Transit', amount: getNet('581') }
    ];

    const fixedAssetsNet = [
      { code: '2x', label: 'Immobilisations Nettes', amount: 0 }
    ];

    const totalAssets = liquidAssets.reduce((s, i) => s + i.amount, 0)
      + loansNet
      + otherAssets.reduce((s, i) => s + i.amount, 0)
      + fixedAssetsNet.reduce((s, i) => s + i.amount, 0);

    // Liabilities & Equity
    const financialLiabilities = [
      { code: '161', label: 'Emprunts et Dettes Financières LMT', amount: getNet('161') },
      { code: '321', label: 'Refinancements Bancaires', amount: getNet('321') }
    ];

    const memberDeposits = [
      { code: '251', label: 'Dépôts à Vue (DAV)', amount: getNet('251') },
      { code: '252', label: 'Épargne sur Livret', amount: getNet('252') },
      { code: '253', label: 'Dépôts à Terme (DAT)', amount: getNet('253') },
      { code: '254', label: 'Dépôts de Garantie Bloqués', amount: getNet('254') },
      { code: '258', label: 'Comptes d\'Attente Tontine', amount: getNet('258') }
    ];

    const otherLiabilities = [
      { code: '401', label: 'Fournisseurs & Personnel Dû', amount: getNet('401') + getNet('421') },
      { code: '441', label: 'État & Sécurité Sociale', amount: getNet('441') + getNet('431') },
      { code: '4711', label: 'Comptes d\'Attente Mobile Money', amount: getNet('4711') },
      { code: '4722', label: 'Excédents de Caisse en Attente', amount: getNet('4722') }
    ];

    const provisionsRisks = [
      { code: '131', label: 'Provisions pour Risques et Charges', amount: getNet('131') }
    ];

    const equityAndReserves = [
      { code: '1011', label: 'Parts Sociales Libérées', amount: getNet('1011') + getNet('1012') - getNet('1013') },
      { code: '102', label: 'Dotations & Subventions', amount: getNet('102') },
      { code: '111', label: 'Réserve Légale BCEAO', amount: getNet('111') },
      { code: '112', label: 'Réserves Statutaires & Libres', amount: getNet('112') },
      { code: '118', label: 'Report à Nouveau', amount: getNet('118') }
    ];

    const totalEquity = equityAndReserves.reduce((s, i) => s + i.amount, 0) + pnl.netIncome;

    const totalLiabilitiesAndEquity = financialLiabilities.reduce((s, i) => s + i.amount, 0)
      + memberDeposits.reduce((s, i) => s + i.amount, 0)
      + otherLiabilities.reduce((s, i) => s + i.amount, 0)
      + provisionsRisks.reduce((s, i) => s + i.amount, 0)
      + totalEquity;

    const discrepancy = totalAssets - totalLiabilitiesAndEquity;
    const isBalanced = Math.abs(discrepancy) < 0.01;

    return {
      asOfDate,
      currency: 'XOF',
      assets: {
        liquidAssets,
        loansGross,
        loanProvisions,
        loansNet,
        otherAssets,
        fixedAssetsNet,
        totalAssets
      },
      liabilitiesAndEquity: {
        financialLiabilities,
        memberDeposits,
        otherLiabilities,
        provisionsRisks,
        equityAndReserves,
        netIncomeCurrentYear: pnl.netIncome,
        totalLiabilitiesAndEquity
      },
      isBalanced,
      discrepancy
    };
  }

  /**
   * Calculates the 5 core BCEAO SFD Prudential Ratios
   */
  public calculatePrudentialRatios(asOfDate: string = new Date().toISOString().substring(0, 10)): PrudentialRatiosReport {
    const is = this.generateIncomeStatement('2026-01-01', asOfDate);
    const accounts = this.ledger.getAllAccounts();

    const getNet = (prefix: string) => {
      let sum = 0;
      for (const acc of accounts) {
        if (acc.accountNumber.startsWith(prefix)) {
          if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
            sum += (acc.currentDebit - acc.currentCredit);
          } else {
            sum += (acc.currentCredit - acc.currentDebit);
          }
        }
      }
      return sum;
    };

    // 1. Ratio de Liquidité Immédiate (R_LIQ >= 100%)
    const liquidDispo = getNet('571') + getNet('578') + getNet('311') + getNet('312');
    const demandDeposits = getNet('251') + getNet('252') + getNet('258');
    const liquidityValue = demandDeposits > 0 ? (liquidDispo / demandDeposits) * 100 : 100.0;
    const liquidityRatio: PrudentialRatioResult = {
      code: 'R_LIQ',
      name: 'Ratio de Liquidité Immédiate',
      value: Number(liquidityValue.toFixed(2)),
      regulatoryThreshold: BCEAO_REGULATIONS.PRUDENTIAL_RATIOS.MIN_LIQUIDITY_RATIO,
      comparison: '>=',
      isCompliant: liquidityValue >= BCEAO_REGULATIONS.PRUDENTIAL_RATIOS.MIN_LIQUIDITY_RATIO,
      unit: '%',
      details: { liquidAssets: liquidDispo, demandDeposits }
    };

    // 2. Ratio d'Adéquation des Fonds Propres (CAR / Solvabilité >= 15%)
    const netEquity = getNet('1011') + getNet('1012') + getNet('102') + getNet('111') + getNet('112') + getNet('118') + is.netIncome;
    const grossLoans = getNet('201') + getNet('202') + getNet('203') + getNet('204') + getNet('291');
    const rwa = (liquidDispo * 0.0) + (grossLoans * 1.0); // Standard BCEAO risk-weighting
    const carValue = rwa > 0 ? (netEquity / rwa) * 100 : 100.0;
    const capitalAdequacyRatio: PrudentialRatioResult = {
      code: 'R_SOLV',
      name: 'Ratio d\'Adéquation des Fonds Propres (CAR)',
      value: Number(carValue.toFixed(2)),
      regulatoryThreshold: BCEAO_REGULATIONS.PRUDENTIAL_RATIOS.MIN_SOLVENCY_CAR,
      comparison: '>=',
      isCompliant: carValue >= BCEAO_REGULATIONS.PRUDENTIAL_RATIOS.MIN_SOLVENCY_CAR,
      unit: '%',
      details: { netEquity, riskWeightedAssets: rwa }
    };

    // 3. Portfolio at Risk (PAR30 <= 5.0%, PAR90 <= 3.0%)
    const overdue30 = getNet('2911') + getNet('2912') + getNet('2913');
    const overdue90 = getNet('2912') + getNet('2913');
    const par30Val = grossLoans > 0 ? (overdue30 / grossLoans) * 100 : 0.0;
    const par90Val = grossLoans > 0 ? (overdue90 / grossLoans) * 100 : 0.0;

    const par30: PrudentialRatioResult = {
      code: 'PAR_30',
      name: 'Portefeuille à Risque à 30 jours (PAR 30)',
      value: Number(par30Val.toFixed(2)),
      regulatoryThreshold: BCEAO_REGULATIONS.PRUDENTIAL_RATIOS.MAX_PAR_30,
      comparison: '<=',
      isCompliant: par30Val <= BCEAO_REGULATIONS.PRUDENTIAL_RATIOS.MAX_PAR_30,
      unit: '%',
      details: { overdue30Amount: overdue30, grossPortfolio: grossLoans }
    };

    const par90: PrudentialRatioResult = {
      code: 'PAR_90',
      name: 'Portefeuille à Risque à 90 jours (PAR 90)',
      value: Number(par90Val.toFixed(2)),
      regulatoryThreshold: BCEAO_REGULATIONS.PRUDENTIAL_RATIOS.MAX_PAR_90,
      comparison: '<=',
      isCompliant: par90Val <= BCEAO_REGULATIONS.PRUDENTIAL_RATIOS.MAX_PAR_90,
      unit: '%',
      details: { overdue90Amount: overdue90, grossPortfolio: grossLoans }
    };

    // 4. Operational Self-Sufficiency (OSS >= 100%)
    const operatingRevenue = is.interestIncome + is.commissionIncome + getNet('781');
    const totalOperatingCost = is.interestExpense + getNet('611') + is.generalOperatingExpenses + is.netRiskCost;
    const ossVal = totalOperatingCost > 0 ? (operatingRevenue / totalOperatingCost) * 100 : 100.0;

    const operationalSelfSufficiency: PrudentialRatioResult = {
      code: 'OSS',
      name: 'Autosuffisance Opérationnelle (OSS)',
      value: Number(ossVal.toFixed(2)),
      regulatoryThreshold: BCEAO_REGULATIONS.PRUDENTIAL_RATIOS.MIN_OSS,
      comparison: '>=',
      isCompliant: ossVal >= BCEAO_REGULATIONS.PRUDENTIAL_RATIOS.MIN_OSS,
      unit: '%',
      details: { operatingRevenue, totalOperatingCost }
    };

    // 5. Risk Division Ratio (R_DIV <= 10.0%)
    const maxSingleExposure = grossLoans > 0 ? grossLoans * 0.05 : 0;
    const rDivVal = netEquity > 0 ? (maxSingleExposure / netEquity) * 100 : 0.0;

    const riskDivisionRatio: PrudentialRatioResult = {
      code: 'R_DIV',
      name: 'Ratio de Division des Risques (Plafond par Emprunteur)',
      value: Number(rDivVal.toFixed(2)),
      regulatoryThreshold: BCEAO_REGULATIONS.PRUDENTIAL_RATIOS.MAX_RISK_DIVISION,
      comparison: '<=',
      isCompliant: rDivVal <= BCEAO_REGULATIONS.PRUDENTIAL_RATIOS.MAX_RISK_DIVISION,
      unit: '%',
      details: { maxSingleExposure, netEquity }
    };

    const allCompliant = liquidityRatio.isCompliant &&
      capitalAdequacyRatio.isCompliant &&
      par30.isCompliant &&
      par90.isCompliant &&
      operationalSelfSufficiency.isCompliant &&
      riskDivisionRatio.isCompliant;

    return {
      asOfDate,
      currency: 'XOF',
      ratios: {
        liquidityRatio,
        capitalAdequacyRatio,
        par30,
        par90,
        operationalSelfSufficiency,
        riskDivisionRatio
      },
      overallStatus: allCompliant ? 'COMPLIANT' : 'WARNING'
    };
  }
}
