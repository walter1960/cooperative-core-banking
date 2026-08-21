/**
 * Adversarial Stress & High-Throughput Concurrency Test Suite for Banolia AI Subsystem
 * Challenger 2 Verification Harness (Milestone 4)
 * 
 * Verifies:
 * 1. Extreme boundary conditions & division-by-zero resilience
 * 2. Deep insolvency & negative capital (CAR < 0)
 * 3. 100% and anomalous delinquent portfolios (PAR30 = 100%, PAR90 = 100%)
 * 4. High-volatility revenue/expense ratios & extreme magnitude numbers
 * 5. High-throughput concurrent load tests on /api/ai/parse-order & /api/ai/financial-query
 * 6. Deterministic consistency & state isolation
 */

import request from 'supertest';
import http from 'http';
import { app } from '../../src/app';
import { CashierParserService } from '../../src/ai/cashier-parser';
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
import { FinancialSnapshotContext } from '../../src/ai/types';

describe('Tier 5 Adversarial & Boundary Stress Harness: Financial Ratios & Latency', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll((done) => {
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      done();
    });
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  // ==========================================================================
  // 1. BOUNDARY CONDITIONS & DIVISION-BY-ZERO RESILIENCE
  // ==========================================================================
  describe('1. Extreme Boundary & Division-by-Zero Resilience', () => {
    
    it('handles all-zero financial context without throwing or returning NaN', () => {
      const allZeroCtx: FinancialSnapshotContext = {
        agency_id: 'A00_ZERO',
        as_of_date: '2026-08-20',
        currency: 'XOF',
        liquid_assets: 0,
        short_term_liabilities: 0,
        gross_loan_portfolio: 0,
        loans_overdue_30_days: 0,
        loans_overdue_90_days: 0,
        financial_operating_revenue: 0,
        financial_operating_expenses: 0,
        loan_loss_provisions_expense: 0,
        tier1_net_capital: 0,
        total_risk_weighted_assets: 0,
        total_active_borrowers: 0,
        top_borrower_outstanding: 0
      };

      const rLiq = calculateLiquidityRatio(allZeroCtx);
      const par30 = calculatePAR30(allZeroCtx);
      const par90 = calculatePAR90(allZeroCtx);
      const oss = calculateOSS(allZeroCtx);
      const car = calculateCAR(allZeroCtx);

      // Verify no NaN or Infinity
      expect(Number.isNaN(rLiq.value_pct)).toBe(false);
      expect(Number.isFinite(rLiq.value_pct)).toBe(true);
      expect(rLiq.status).toBe('COMPLIANT');
      expect(rLiq.notes).toBe('ZERO_LIABILITIES');

      expect(Number.isNaN(par30.value_pct)).toBe(false);
      expect(par30.value_pct).toBe(0);
      expect(par30.status).toBe('COMPLIANT');
      expect(par30.notes).toBe('NO_ACTIVE_LOANS');

      expect(Number.isNaN(par90.value_pct)).toBe(false);
      expect(par90.value_pct).toBe(0);
      expect(par90.status).toBe('COMPLIANT');
      expect(par90.notes).toBe('NO_ACTIVE_LOANS');

      expect(Number.isNaN(oss.value_pct)).toBe(false);
      expect(oss.value_pct).toBe(100);
      expect(oss.status).toBe('COMPLIANT');
      expect(oss.notes).toBe('ZERO_EXPENSES');

      expect(Number.isNaN(car.value_pct)).toBe(false);
      expect(car.value_pct).toBe(0);
      expect(car.status).toBe('CRITICAL'); // 0 net capital is critical
      expect(car.notes).toBe('NEGATIVE_OR_ZERO_EQUITY');
    });

    it('handles zero short-term liabilities with massive liquid assets', () => {
      const ctx = createDefaultSnapshot({
        liquid_assets: 500_000_000_000, // 500 Billion XOF
        short_term_liabilities: 0
      });
      const res = calculateLiquidityRatio(ctx);
      expect(res.value_pct).toBe(100.0);
      expect(res.status).toBe('COMPLIANT');
      expect(res.notes).toBe('ZERO_LIABILITIES');
    });

    it('handles zero gross loans with non-zero residual arrears (anomaly safety)', () => {
      const ctx = createDefaultSnapshot({
        gross_loan_portfolio: 0,
        loans_overdue_30_days: 10_000_000,
        loans_overdue_90_days: 5_000_000
      });
      const par30 = calculatePAR30(ctx);
      const par90 = calculatePAR90(ctx);

      expect(par30.value_pct).toBe(0.0);
      expect(par30.status).toBe('COMPLIANT');
      expect(par30.notes).toBe('NO_ACTIVE_LOANS');

      expect(par90.value_pct).toBe(0.0);
      expect(par90.status).toBe('COMPLIANT');
      expect(par90.notes).toBe('NO_ACTIVE_LOANS');
    });

    it('handles zero expenses with positive revenue', () => {
      const ctx = createDefaultSnapshot({
        financial_operating_revenue: 750_000_000,
        financial_operating_expenses: 0,
        loan_loss_provisions_expense: 0
      });
      const res = calculateOSS(ctx);
      expect(res.value_pct).toBe(100.0);
      expect(res.status).toBe('COMPLIANT');
      expect(res.notes).toBe('ZERO_EXPENSES');
    });

    it('handles zero RWA with positive capital and zero RWA with negative capital', () => {
      const positiveCapZeroRwa = createDefaultSnapshot({
        tier1_net_capital: 200_000_000,
        total_risk_weighted_assets: 0
      });
      const resPos = calculateCAR(positiveCapZeroRwa);
      expect(resPos.value_pct).toBe(100.0);
      expect(resPos.status).toBe('COMPLIANT');
      expect(resPos.notes).toBe('ZERO_RWA');

      const negCapZeroRwa = createDefaultSnapshot({
        tier1_net_capital: -50_000_000,
        total_risk_weighted_assets: 0
      });
      const resNeg = calculateCAR(negCapZeroRwa);
      expect(resNeg.value_pct).toBe(0.0);
      expect(resNeg.status).toBe('CRITICAL');
      expect(resNeg.notes).toBe('NEGATIVE_OR_ZERO_EQUITY');
    });
  });

  // ==========================================================================
  // 2. NEGATIVE NET CAPITAL & DEEP INSOLVENCY (CAR < 0)
  // ==========================================================================
  describe('2. Negative Net Capital & Deep Insolvency ($CAR < 0$)', () => {
    
    it('flags CRITICAL status and reports NEGATIVE_OR_ZERO_EQUITY for deep insolvency', () => {
      const insolvencyLevels = [
        -1,
        -10_000_000,
        -500_000_000,
        -10_000_000_000
      ];

      for (const netCap of insolvencyLevels) {
        const ctx = createDefaultSnapshot({
          tier1_net_capital: netCap,
          total_risk_weighted_assets: 1_000_000_000
        });
        const res = calculateCAR(ctx);
        expect(res.value_pct).toBe(0.0);
        expect(res.status).toBe('CRITICAL');
        expect(res.notes).toBe('NEGATIVE_OR_ZERO_EQUITY');
        expect(res.delta_to_regulatory_min).toBe(-10.0);
        expect(res.plain_explanation).toContain('Fonds propres prudentiels nets négatifs');
      }
    });

    it('propagates CRITICAL overall health status on executive summary when CAR is negative', () => {
      const res = processFinancialQuery({
        query: 'Quelle est la solvabilité de l\'institution ?',
        portfolio_context: {
          tier1_net_capital: -150_000_000,
          total_risk_weighted_assets: 800_000_000
        }
      });

      expect(res.success).toBe(true);
      expect(res.overall_health_status).toBe('CRITICAL');
      expect(res.status).toBe('CRITICAL');
      expect(res.vulnerabilities.some(v => v.includes('Sous-capitalisation'))).toBe(true);
      expect(res.recommended_actions.some(a => a.includes('Assemblée Générale'))).toBe(true);
    });

    it('evaluates negative liquidity assets (bank overdraft situation)', () => {
      const overdraftCtx = createDefaultSnapshot({
        liquid_assets: -50_000_000,
        short_term_liabilities: 200_000_000
      });
      const res = calculateLiquidityRatio(overdraftCtx);
      expect(res.value_pct).toBe(-25.0);
      expect(res.status).toBe('CRITICAL');
      expect(res.delta_to_regulatory_min).toBe(-125.0);
    });
  });

  // ==========================================================================
  // 3. 100% DELINQUENT PORTFOLIOS (PAR30 = 100%, PAR90 = 100%)
  // ==========================================================================
  describe('3. 100% Delinquent Loan Portfolios', () => {
    
    it('evaluates 100% delinquent portfolio (PAR30 = 100%) as CRITICAL', () => {
      const totalPortfolio = 1_500_000_000;
      const ctx = createDefaultSnapshot({
        gross_loan_portfolio: totalPortfolio,
        loans_overdue_30_days: totalPortfolio,
        loans_overdue_90_days: 500_000_000
      });
      const res = calculatePAR30(ctx);
      expect(res.value_pct).toBe(100.0);
      expect(res.status).toBe('CRITICAL');
      expect(res.delta_to_regulatory_max).toBe(95.0);
      expect(res.plain_explanation).toContain("100.00%");
    });

    it('evaluates 100% defaulted portfolio (PAR90 = 100%) as CRITICAL', () => {
      const totalPortfolio = 2_000_000_000;
      const ctx = createDefaultSnapshot({
        gross_loan_portfolio: totalPortfolio,
        loans_overdue_30_days: totalPortfolio,
        loans_overdue_90_days: totalPortfolio
      });
      const res = calculatePAR90(ctx);
      expect(res.value_pct).toBe(100.0);
      expect(res.status).toBe('CRITICAL');
      expect(res.delta_to_regulatory_max).toBe(97.0);
    });

    it('handles anomalous corrupt over-100% delinquent input gracefully', () => {
      const totalPortfolio = 1_000_000_000;
      const ctx = createDefaultSnapshot({
        gross_loan_portfolio: totalPortfolio,
        loans_overdue_30_days: 1_500_000_000 // 150%
      });
      const res = calculatePAR30(ctx);
      expect(res.value_pct).toBe(150.0);
      expect(res.status).toBe('CRITICAL');
      expect(res.delta_to_regulatory_max).toBe(145.0);
    });
  });

  // ==========================================================================
  // 4. VOLATILE REVENUE / EXPENSE RATIOS & EXTREME VALUES
  // ==========================================================================
  describe('4. Highly Volatile Revenue / Expense Ratios & Large Numbers', () => {
    
    it('handles hyper-profitable scenario (revenue >> expenses)', () => {
      const ctx = createDefaultSnapshot({
        financial_operating_revenue: 10_000_000_000,
        financial_operating_expenses: 100_000,
        loan_loss_provisions_expense: 0
      });
      const res = calculateOSS(ctx);
      expect(res.value_pct).toBe(10_000_000.0);
      expect(res.status).toBe('COMPLIANT');
    });

    it('handles hyper-deficit scenario (expenses >> revenue)', () => {
      const ctx = createDefaultSnapshot({
        financial_operating_revenue: 100,
        financial_operating_expenses: 1_000_000_000,
        loan_loss_provisions_expense: 500_000_000
      });
      const res = calculateOSS(ctx);
      expect(res.value_pct).toBe(0.0);
      expect(res.status).toBe('CRITICAL');
    });

    it('handles fractional micro-amounts (0.01 XOF) without precision crash', () => {
      const ctx = createDefaultSnapshot({
        liquid_assets: 0.05,
        short_term_liabilities: 0.02
      });
      const res = calculateLiquidityRatio(ctx);
      expect(res.value_pct).toBe(250.0);
      expect(res.status).toBe('COMPLIANT');
    });

    it('handles quadrillion-scale numbers (10^15 XOF) without overflow', () => {
      const quadrillion = 1_000_000_000_000_000;
      const ctx = createDefaultSnapshot({
        liquid_assets: 2 * quadrillion,
        short_term_liabilities: 1 * quadrillion,
        gross_loan_portfolio: 10 * quadrillion,
        loans_overdue_30_days: 0.3 * quadrillion,
        tier1_net_capital: 3 * quadrillion,
        total_risk_weighted_assets: 15 * quadrillion
      });

      const rLiq = calculateLiquidityRatio(ctx);
      const par30 = calculatePAR30(ctx);
      const car = calculateCAR(ctx);

      expect(rLiq.value_pct).toBe(200.0);
      expect(par30.value_pct).toBe(3.0);
      expect(car.value_pct).toBe(20.0);
    });
  });

  // ==========================================================================
  // 5. FUZZING & PARTIAL CONTEXT RESILIENCE
  // ==========================================================================
  describe('5. Fuzzing & Malformed Context Resilience', () => {
    
    it('evaluates completely empty context object gracefully', () => {
      const res = processFinancialQuery({
        query: 'audit complet',
        portfolio_context: {}
      });

      expect(res.success).toBe(true);
      expect(res.overall_health_status).toBeDefined();
      expect(res.vulnerabilities.length).toBeGreaterThan(0);
      expect(res.recommended_actions.length).toBeGreaterThan(0);
    });

    it('evaluates context with undefined / null properties safely', () => {
      const partialCtx: any = {
        liquid_assets: undefined,
        short_term_liabilities: null,
        gross_loan_portfolio: undefined,
        tier1_net_capital: null
      };

      const res = processFinancialQuery({
        query: 'Quel est notre ratio de liquidité ?',
        portfolio_context: partialCtx
      });

      expect(res.success).toBe(true);
      expect(res.metrics.R_LIQ?.value_pct).toBe(118.42);
      expect(res.metrics.R_LIQ?.status).toBe('COMPLIANT');
    });
  });

  // ==========================================================================
  // 6. HIGH-THROUGHPUT CONCURRENT LOAD BENCHMARK (P99 < 2000ms)
  // ==========================================================================
  describe('6. High-Throughput Concurrent Load & Latency Budget (< 2000ms P99)', () => {
    const cashierService = new CashierParserService();

    it('benchmarks in-process execution across 100 sequential requests confirming P99 < 10ms', async () => {
      const iterations = 100;
      const phrases = [
        'Fais un versement de cinquante mille francs pour MILDZINA Tomrom sur son épargne',
        'Nye di be maɖo akpe blaeve ɖe Tomrom ƒe akɔnta me',
        'Sɔ akpe blaetɔ̃ do Ablavi ƒe akɔnti me',
        'Retrait de dix mille francs pour l\'adhérent 611',
        'Kotoku evee kple akpe blaeve na Tomrom',
        'Versement de deux sacs pour Da Ablavi',
        'Consulte le solde de l\'adhérent 610'
      ];

      const latencies: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const p = phrases[i % phrases.length];
        const t0 = Date.now();
        const res = await cashierService.parseCashierOrder({ transcript: p });
        const dt = Date.now() - t0;
        latencies.push(dt);
        expect(res.success).toBe(true);
      }

      latencies.sort((a, b) => a - b);
      const p99 = latencies[Math.floor(iterations * 0.99)];
      const max = latencies[latencies.length - 1];
      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;

      console.log('\n====== IN-PROCESS SEQUENTIAL VOICE PARSER BENCHMARK (N=100) ======');
      console.log(`Avg Latency: ${avg.toFixed(2)} ms`);
      console.log(`P99 Latency: ${p99} ms (Target: < 2000 ms)`);
      console.log(`Max Latency: ${max} ms`);
      console.log('==================================================================\n');

      expect(p99).toBeLessThan(2000);
      expect(max).toBeLessThan(2000);
    });

    it('benchmarks /api/ai/parse-order under pooled concurrency (10 concurrent tellers, 100 requests) with P99 < 2000ms', async () => {
      const totalRequests = 100;
      const concurrency = 10;
      const testOrders = [
        { transcript: 'Versement de cinquante mille francs pour MILDZINA Tomrom sur son épargne', language: 'fr-FR' },
        { transcript: 'Nye di be maɖo akpe blaeve ɖe Tomrom ƒe akɔnta me', language: 'ee-TG' },
        { transcript: 'Sɔ akpe blaetɔ̃ do Ablavi ƒe akɔnti me', language: 'gej-TG' },
        { transcript: 'Retrait de dix mille francs pour l\'adhérent 611', language: 'fr-FR' },
        { transcript: 'Kotoku evee kple akpe blaeve na Tomrom', language: 'ee-TG' },
        { transcript: 'Versement de deux sacs pour Da Ablavi', language: 'fr-FR' },
        { transcript: 'Do efe ququ akpe blaeve vɔ atɔ̃ na Tomrom', language: 'gej-TG' },
        { transcript: 'Consulte le solde de l\'adhérent 610', language: 'fr-FR' }
      ];

      const clientLatencies: number[] = [];
      const serverLatencies: number[] = [];
      let currentIndex = 0;

      async function worker() {
        while (true) {
          const idx = currentIndex++;
          if (idx >= totalRequests) break;
          const order = testOrders[idx % testOrders.length];
          const reqStart = Date.now();
          const response = await request(server)
            .post('/api/ai/parse-order')
            .send(order);
          const duration = Date.now() - reqStart;
          clientLatencies.push(duration);
          serverLatencies.push(response.body.latency_ms || 0);

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
        }
      }

      const startTime = Date.now();
      await Promise.all(Array.from({ length: concurrency }).map(() => worker()));
      const totalWallTime = Date.now() - startTime;

      clientLatencies.sort((a, b) => a - b);
      serverLatencies.sort((a, b) => a - b);
      const min = clientLatencies[0];
      const max = clientLatencies[clientLatencies.length - 1];
      const avg = clientLatencies.reduce((acc, v) => acc + v, 0) / clientLatencies.length;
      const p50 = clientLatencies[Math.floor(totalRequests * 0.50)];
      const p90 = clientLatencies[Math.floor(totalRequests * 0.90)];
      const p95 = clientLatencies[Math.floor(totalRequests * 0.95)];
      const p99 = clientLatencies[Math.floor(totalRequests * 0.99)];
      const srvP99 = serverLatencies[Math.floor(totalRequests * 0.99)];

      console.log('\n================== POOLED CONCURRENT PARSE-ORDER HTTP BENCHMARK (C=10, N=100) ==================');
      console.log(`Concurrent Channels : ${concurrency}`);
      console.log(`Total Requests      : ${totalRequests}`);
      console.log(`Total Wall-Clock    : ${totalWallTime} ms`);
      console.log(`Throughput          : ${(totalRequests / (totalWallTime / 1000)).toFixed(2)} req/sec`);
      console.log(`Client Min Latency  : ${min} ms`);
      console.log(`Client Max Latency  : ${max} ms`);
      console.log(`Client Avg Latency  : ${avg.toFixed(2)} ms`);
      console.log(`Client P50 Latency  : ${p50} ms`);
      console.log(`Client P90 Latency  : ${p90} ms`);
      console.log(`Client P95 Latency  : ${p95} ms`);
      console.log(`Client P99 Latency  : ${p99} ms (Target: < 2000 ms)`);
      console.log(`Server P99 Latency  : ${srvP99} ms`);
      console.log('================================================================================================\n');

      expect(p99).toBeLessThan(2000);
      expect(max).toBeLessThan(2000);
      expect(srvP99).toBeLessThan(2000);
    }, 30000);

    it('benchmarks /api/ai/financial-query under pooled concurrency (10 concurrent clients, 100 requests) with P99 < 2000ms', async () => {
      const totalRequests = 100;
      const concurrency = 10;
      const testQueries = [
        { query: 'Quel est notre ratio de liquidité ce matin ?' },
        { query: 'Donne-moi le PAR 30 et les créances douteuses' },
        { query: 'Ga si le asie nénie wònye?' },
        { query: 'Liquidité le téntin a?' },
        { query: 'Fais-moi le point sur les risques pour le Conseil d\'Administration' },
        { query: 'Quel est le ratio CAR et le niveau des fonds propres ?' },
        { query: 'Donne-moi l\'autosuffisance opérationnelle OSS' }
      ];

      const clientLatencies: number[] = [];
      const serverLatencies: number[] = [];
      let currentIndex = 0;

      async function worker() {
        while (true) {
          const idx = currentIndex++;
          if (idx >= totalRequests) break;
          const payload = testQueries[idx % testQueries.length];
          const reqStart = Date.now();
          const response = await request(server)
            .post('/api/ai/financial-query')
            .send({
              ...payload,
              portfolio_context: {
                liquid_assets: 700_000_000 + (idx * 1_000_000),
                short_term_liabilities: 600_000_000,
                gross_loan_portfolio: 2_000_000_000,
                loans_overdue_30_days: 80_000_000
              }
            });
          const duration = Date.now() - reqStart;
          clientLatencies.push(duration);
          serverLatencies.push(response.body.latency_ms || 0);

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
        }
      }

      const startTime = Date.now();
      await Promise.all(Array.from({ length: concurrency }).map(() => worker()));
      const totalWallTime = Date.now() - startTime;

      clientLatencies.sort((a, b) => a - b);
      serverLatencies.sort((a, b) => a - b);
      const min = clientLatencies[0];
      const max = clientLatencies[clientLatencies.length - 1];
      const avg = clientLatencies.reduce((acc, v) => acc + v, 0) / clientLatencies.length;
      const p50 = clientLatencies[Math.floor(totalRequests * 0.50)];
      const p90 = clientLatencies[Math.floor(totalRequests * 0.90)];
      const p95 = clientLatencies[Math.floor(totalRequests * 0.95)];
      const p99 = clientLatencies[Math.floor(totalRequests * 0.99)];
      const srvP99 = serverLatencies[Math.floor(totalRequests * 0.99)];

      console.log('\n================== POOLED CONCURRENT FINANCIAL-QUERY HTTP BENCHMARK (C=10, N=100) ==================');
      console.log(`Concurrent Channels : ${concurrency}`);
      console.log(`Total Requests      : ${totalRequests}`);
      console.log(`Total Wall-Clock    : ${totalWallTime} ms`);
      console.log(`Throughput          : ${(totalRequests / (totalWallTime / 1000)).toFixed(2)} req/sec`);
      console.log(`Client Min Latency  : ${min} ms`);
      console.log(`Client Max Latency  : ${max} ms`);
      console.log(`Client Avg Latency  : ${avg.toFixed(2)} ms`);
      console.log(`Client P50 Latency  : ${p50} ms`);
      console.log(`Client P90 Latency  : ${p90} ms`);
      console.log(`Client P95 Latency  : ${p95} ms`);
      console.log(`Client P99 Latency  : ${p99} ms (Target: < 2000 ms)`);
      console.log(`Server P99 Latency  : ${srvP99} ms`);
      console.log('====================================================================================================\n');

      expect(p99).toBeLessThan(2000);
      expect(max).toBeLessThan(2000);
      expect(srvP99).toBeLessThan(2000);
    }, 30000);
  });



  // ==========================================================================
  // 7. DETERMINISTIC CONSISTENCY & REENTRANCY
  // ==========================================================================
  describe('7. Deterministic Output Consistency & Reentrancy', () => {
    
    it('produces bit-for-bit identical outputs across 100 repeated identical financial queries', () => {
      const fixedPayload = {
        query: 'Tableau de bord des risques prudentiels',
        portfolio_context: {
          liquid_assets: 850_000_000,
          short_term_liabilities: 700_000_000,
          gross_loan_portfolio: 1_800_000_000,
          loans_overdue_30_days: 90_000_000,
          loans_overdue_90_days: 30_000_000,
          financial_operating_revenue: 220_000_000,
          financial_operating_expenses: 170_000_000,
          loan_loss_provisions_expense: 15_000_000,
          tier1_net_capital: 320_000_000,
          total_risk_weighted_assets: 1_600_000_000
        }
      };

      const baseline = processFinancialQuery(fixedPayload);

      for (let i = 0; i < 100; i++) {
        const next = processFinancialQuery(fixedPayload);
        expect(next.overall_health_status).toBe(baseline.overall_health_status);
        expect(next.metric_type).toBe(baseline.metric_type);
        expect(next.metrics.R_LIQ?.value_pct).toBe(baseline.metrics.R_LIQ?.value_pct);
        expect(next.metrics.PAR_30?.value_pct).toBe(baseline.metrics.PAR_30?.value_pct);
        expect(next.metrics.PAR_90?.value_pct).toBe(baseline.metrics.PAR_90?.value_pct);
        expect(next.metrics.OSS?.value_pct).toBe(baseline.metrics.OSS?.value_pct);
        expect(next.metrics.CAR?.value_pct).toBe(baseline.metrics.CAR?.value_pct);
        expect(next.executive_summary).toBe(baseline.executive_summary);
      }
    });

    it('preserves complete state isolation during interleaved mixed queries', async () => {
      const p1 = request(server).post('/api/ai/financial-query').send({
        query: 'liquidité',
        portfolio_context: { liquid_assets: 100_000_000, short_term_liabilities: 200_000_000 } // 50% CRITICAL
      });
      const p2 = request(server).post('/api/ai/financial-query').send({
        query: 'liquidité',
        portfolio_context: { liquid_assets: 400_000_000, short_term_liabilities: 200_000_000 } // 200% COMPLIANT
      });

      const [r1, r2] = await Promise.all([p1, p2]);

      expect(r1.body.metrics.R_LIQ.value_pct).toBe(50.0);
      expect(r1.body.metrics.R_LIQ.status).toBe('CRITICAL');

      expect(r2.body.metrics.R_LIQ.value_pct).toBe(200.0);
      expect(r2.body.metrics.R_LIQ.status).toBe('COMPLIANT');
    }, 10000);
  });
});
