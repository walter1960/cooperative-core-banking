import { CashierParserService } from '../../src/ai/cashier-parser';
import { processFinancialQuery } from '../../src/ai/financial-analyzer';

describe('AI Subsystem Latency Benchmark Suite (< 2000ms P99 Hard Limit)', () => {
  const cashierService = new CashierParserService();

  it('benchmarks 100 voice order requests and confirms P99 < 2000ms', async () => {
    const iterations = 100;
    const latencies: number[] = [];

    const testPhrases = [
      'Fais un versement de cinquante mille francs pour MILDZINA Tomrom sur son épargne',
      'Nye di be maɖo akpe blaeve ɖe Tomrom ƒe akɔnta me',
      'Sɔ akpe blaetɔ̃ do Ablavi ƒe akɔnti me',
      'Retrait de dix mille francs pour l\'adhérent 611',
      'Pose deux sacs pour Tomrom',
      'Do efe ququ akpe blaeve vɔ atɔ̃ na Tomrom',
      'Consulte le solde de l\'adhérent 610',
      'Cotisation tontine de deux mille pour Da Ablavi',
      'Versement de saint quand mille pour Tomrom',
      'Kotoku evee kple akpe blaeve na Tomrom'
    ];

    for (let i = 0; i < iterations; i++) {
      const phrase = testPhrases[i % testPhrases.length];
      const start = Date.now();
      const res = await cashierService.parseCashierOrder({ transcript: phrase });
      const duration = Date.now() - start;
      latencies.push(duration);
      expect(res.success).toBe(true);
    }

    latencies.sort((a, b) => a - b);
    const min = latencies[0];
    const max = latencies[latencies.length - 1];
    const avg = latencies.reduce((sum, v) => sum + v, 0) / latencies.length;
    const p50 = latencies[Math.floor(iterations * 0.50)];
    const p90 = latencies[Math.floor(iterations * 0.90)];
    const p95 = latencies[Math.floor(iterations * 0.95)];
    const p99 = latencies[Math.floor(iterations * 0.99)];

    console.log('\n================== VOICE PARSER BENCHMARK RESULTS ==================');
    console.log(`Iterations : ${iterations}`);
    console.log(`Min Latency: ${min} ms`);
    console.log(`Max Latency: ${max} ms`);
    console.log(`Avg Latency: ${avg.toFixed(2)} ms`);
    console.log(`P50 Latency: ${p50} ms`);
    console.log(`P90 Latency: ${p90} ms`);
    console.log(`P95 Latency: ${p95} ms`);
    console.log(`P99 Latency: ${p99} ms (Target: < 2000 ms)`);
    console.log('====================================================================\n');

    expect(p99).toBeLessThan(2000);
    expect(max).toBeLessThan(2000);
  });

  it('benchmarks 50 financial ratio query evaluations and confirms P99 < 2000ms', () => {
    const iterations = 50;
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      const res = processFinancialQuery({
        query: 'Fais-moi le point sur les risques et la liquidité'
      });
      const duration = Date.now() - start;
      latencies.push(duration);
      expect(res.success).toBe(true);
    }

    latencies.sort((a, b) => a - b);
    const p99 = latencies[Math.floor(iterations * 0.99)];
    expect(p99).toBeLessThan(2000);
  });
});
