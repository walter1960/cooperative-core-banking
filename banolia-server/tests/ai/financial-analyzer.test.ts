import {
  calculateCAR,
  calculateLiquidityRatio,
  calculateOSS,
  calculatePAR30,
  calculatePAR90,
  createDefaultSnapshot,
  parseFinancialQueryIntent,
  processFinancialQuery
} from '../../src/ai/financial-analyzer';

describe('Executive Financial Ratio & Risk Analyzer', () => {
  const nominalContext = createDefaultSnapshot({
    liquid_assets: 785000000,
    short_term_liabilities: 662900000,
    gross_loan_portfolio: 2000000000,
    loans_overdue_30_days: 87000000,
    loans_overdue_90_days: 28000000,
    financial_operating_revenue: 240000000,
    financial_operating_expenses: 185000000,
    loan_loss_provisions_expense: 15000000,
    tier1_net_capital: 350000000,
    total_risk_weighted_assets: 1800000000
  });

  // ==========================================================================
  // 1. Liquidity Ratio (R_LIQ >= 100%)
  // ==========================================================================
  describe('Liquidity Ratio (R_LIQ)', () => {
    it('computes nominal compliant liquidity ratio accurately', () => {
      const res = calculateLiquidityRatio(nominalContext);
      expect(res.metric_code).toBe('R_LIQ');
      expect(res.value_pct).toBe(118.42);
      expect(res.status).toBe('COMPLIANT');
      expect(res.delta_to_regulatory_min).toBe(18.42);
    });

    it('identifies critical illiquidity status when R_LIQ < 100%', () => {
      const illiquidCtx = createDefaultSnapshot({
        liquid_assets: 500000000,
        short_term_liabilities: 600000000
      });
      const res = calculateLiquidityRatio(illiquidCtx);
      expect(res.value_pct).toBe(83.33);
      expect(res.status).toBe('CRITICAL');
    });

    it('safely handles zero short-term liabilities (division by zero)', () => {
      const zeroLiabCtx = createDefaultSnapshot({
        short_term_liabilities: 0
      });
      const res = calculateLiquidityRatio(zeroLiabCtx);
      expect(res.value_pct).toBe(100.0);
      expect(res.status).toBe('COMPLIANT');
      expect(res.notes).toBe('ZERO_LIABILITIES');
    });
  });

  // ==========================================================================
  // 2. PAR 30 (Portfolio at Risk 30 Days <= 5%)
  // ==========================================================================
  describe('Portfolio at Risk 30 Days (PAR_30)', () => {
    it('computes PAR 30 and flags warning when in [4%, 5%]', () => {
      const res = calculatePAR30(nominalContext);
      expect(res.metric_code).toBe('PAR_30');
      expect(res.value_pct).toBe(4.35);
      expect(res.status).toBe('WARNING');
    });

    it('flags critical deterioration when PAR 30 > 5%', () => {
      const deterioratedCtx = createDefaultSnapshot({
        gross_loan_portfolio: 1000000000,
        loans_overdue_30_days: 75000000 // 7.5%
      });
      const res = calculatePAR30(deterioratedCtx);
      expect(res.value_pct).toBe(7.50);
      expect(res.status).toBe('CRITICAL');
    });

    it('safely handles zero gross loan portfolio (division by zero)', () => {
      const zeroLoansCtx = createDefaultSnapshot({
        gross_loan_portfolio: 0,
        loans_overdue_30_days: 0
      });
      const res = calculatePAR30(zeroLoansCtx);
      expect(res.value_pct).toBe(0.0);
      expect(res.status).toBe('COMPLIANT');
      expect(res.notes).toBe('NO_ACTIVE_LOANS');
    });
  });

  // ==========================================================================
  // 3. PAR 90 (Portfolio at Risk 90 Days <= 2-3%)
  // ==========================================================================
  describe('Portfolio at Risk 90 Days (PAR_90)', () => {
    it('computes compliant PAR 90 when < 1.5%', () => {
      const res = calculatePAR90(nominalContext);
      expect(res.metric_code).toBe('PAR_90');
      expect(res.value_pct).toBe(1.40);
      expect(res.status).toBe('COMPLIANT');
    });

    it('flags critical status when PAR 90 > 2.0%', () => {
      const badLoansCtx = createDefaultSnapshot({
        gross_loan_portfolio: 1000000000,
        loans_overdue_90_days: 35000000 // 3.5%
      });
      const res = calculatePAR90(badLoansCtx);
      expect(res.value_pct).toBe(3.50);
      expect(res.status).toBe('CRITICAL');
    });

    it('safely handles zero gross loans', () => {
      const zeroCtx = createDefaultSnapshot({ gross_loan_portfolio: 0 });
      const res = calculatePAR90(zeroCtx);
      expect(res.value_pct).toBe(0.0);
      expect(res.status).toBe('COMPLIANT');
    });
  });

  // ==========================================================================
  // 4. Operational Self-Sufficiency (OSS > 110%)
  // ==========================================================================
  describe('Operational Self-Sufficiency (OSS)', () => {
    it('computes compliant OSS above 110%', () => {
      const res = calculateOSS(nominalContext);
      // Revenue = 240M, Total Exp = 185M + 15M = 200M -> 240/200 = 120.00%
      expect(res.metric_code).toBe('OSS');
      expect(res.value_pct).toBe(120.00);
      expect(res.status).toBe('COMPLIANT');
    });

    it('flags critical deficit when OSS < 100%', () => {
      const deficitCtx = createDefaultSnapshot({
        financial_operating_revenue: 150000000,
        financial_operating_expenses: 180000000,
        loan_loss_provisions_expense: 20000000
      });
      const res = calculateOSS(deficitCtx);
      expect(res.value_pct).toBe(75.00);
      expect(res.status).toBe('CRITICAL');
    });

    it('safely handles zero total expenses', () => {
      const zeroExpCtx = createDefaultSnapshot({
        financial_operating_expenses: 0,
        loan_loss_provisions_expense: 0
      });
      const res = calculateOSS(zeroExpCtx);
      expect(res.value_pct).toBe(100.0);
      expect(res.status).toBe('COMPLIANT');
      expect(res.notes).toBe('ZERO_EXPENSES');
    });
  });

  // ==========================================================================
  // 5. Capital Adequacy Ratio (CAR >= 10-15%)
  // ==========================================================================
  describe('Capital Adequacy Ratio (CAR)', () => {
    it('computes compliant CAR above 15%', () => {
      const res = calculateCAR(nominalContext);
      // Net Capital = 350M, RWA = 1800M -> 350/1800 = 19.44%
      expect(res.metric_code).toBe('CAR');
      expect(res.value_pct).toBe(19.44);
      expect(res.status).toBe('COMPLIANT');
    });

    it('flags critical under-capitalization when CAR < 10%', () => {
      const underCapCtx = createDefaultSnapshot({
        tier1_net_capital: 120000000,
        total_risk_weighted_assets: 1500000000 // 8.0%
      });
      const res = calculateCAR(underCapCtx);
      expect(res.value_pct).toBe(8.00);
      expect(res.status).toBe('CRITICAL');
    });

    it('flags critical status on negative net equity', () => {
      const negCapCtx = createDefaultSnapshot({
        tier1_net_capital: -50000000,
        total_risk_weighted_assets: 1000000000
      });
      const res = calculateCAR(negCapCtx);
      expect(res.value_pct).toBe(0.0);
      expect(res.status).toBe('CRITICAL');
      expect(res.notes).toBe('NEGATIVE_OR_ZERO_EQUITY');
    });

    it('safely handles zero RWA', () => {
      const zeroRwaCtx = createDefaultSnapshot({
        total_risk_weighted_assets: 0
      });
      const res = calculateCAR(zeroRwaCtx);
      expect(res.value_pct).toBe(100.0);
      expect(res.status).toBe('COMPLIANT');
    });
  });

  // ==========================================================================
  // 6. Multilingual Natural Language Query Classifier & Executive Diagnostic
  // ==========================================================================
  describe('Multilingual Natural Language Query Processing', () => {
    it('interprets French liquidity query and returns structured response', () => {
      const res = processFinancialQuery({
        query: 'Quel est notre ratio de liquidité ce matin ?',
        portfolio_context: nominalContext
      });
      expect(res.success).toBe(true);
      expect(res.query_metadata.requested_metrics).toContain('R_LIQ');
      expect(res.metrics.R_LIQ?.value_pct).toBe(118.42);
      expect(res.executive_summary).toContain('Ratio de Liquidité');
    });

    it('interprets French PAR query', () => {
      const res = processFinancialQuery({
        query: 'Donne-moi le PAR 30 et les impayés de plus d\'un mois',
        portfolio_context: nominalContext
      });
      expect(res.query_metadata.requested_metrics).toContain('PAR_30');
      expect(res.metrics.PAR_30?.value_pct).toBe(4.35);
    });

    it('interprets Éwé financial queries', () => {
      const res = processFinancialQuery({
        query: 'Ga si le asie nénie wònye?',
        portfolio_context: nominalContext
      });
      expect(res.query_metadata.detected_language).toBe('ee-TG');
      expect(res.query_metadata.requested_metrics).toContain('R_LIQ');
    });

    it('interprets Mina financial queries', () => {
      const res = processFinancialQuery({
        query: 'Liquidité le téntin a?',
        portfolio_context: nominalContext
      });
      expect(res.query_metadata.detected_language).toBe('gej-TG');
      expect(res.query_metadata.requested_metrics).toContain('R_LIQ');
    });

    it('provides comprehensive multi-metric executive summary for boardroom queries', () => {
      const res = processFinancialQuery({
        query: 'Fais-moi le point sur les risques et la situation financière pour le Conseil d\'Administration',
        portfolio_context: nominalContext
      });
      expect(res.success).toBe(true);
      expect(res.metrics.R_LIQ).toBeDefined();
      expect(res.metrics.PAR_30).toBeDefined();
      expect(res.metrics.PAR_90).toBeDefined();
      expect(res.metrics.OSS).toBeDefined();
      expect(res.metrics.CAR).toBeDefined();
      expect(res.overall_health_status).toBe('WARNING'); // because PAR30 is WARNING
      expect(res.vulnerabilities.length).toBeGreaterThan(0);
      expect(res.recommended_actions.length).toBeGreaterThan(0);
    });
  });
});
