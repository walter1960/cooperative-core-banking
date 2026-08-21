import request from 'supertest';
import { app } from '../../src/app';
import { CashierParserService, SEED_MEMBERS } from '../../src/ai/cashier-parser';

describe('Voice Cashier Order Parser & AI REST Endpoints', () => {
  const cashierService = new CashierParserService();

  // ==========================================================================
  // 1. Direct Service Unit Tests (F16)
  // ==========================================================================
  describe('CashierParserService Core Operations', () => {
    it('parses nominal French deposit order in < 2000ms', async () => {
      const startTime = Date.now();
      const res = await cashierService.parseCashierOrder({
        transcript: 'Fais un versement de cinquante mille francs pour MILDZINA Tomrom sur son épargne',
        language: 'fr-FR'
      });
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000);
      expect(res.intent).toBe('CASH_DEPOSIT');
      expect(res.extracted_data.member_code).toBe('A0200225');
      expect(res.extracted_data.member_name).toBe('MILDZINA Tomrom');
      expect(res.extracted_data.amount).toBe(50000);
      expect(res.extracted_data.currency).toBe('XOF');
      expect(res.extracted_data.account_type).toBe('SAVINGS');
      expect(res.extracted_data.account_number).toBe('25121100A020022501');
      expect(res.spoken_feedback.text_to_speak).toContain('50\u202F000');
    });

    it('parses nominal French withdrawal by manual number in < 2000ms', async () => {
      const res = await cashierService.parseCashierOrder({
        transcript: 'Retrait de dix mille francs pour l\'adhérent 611',
        language: 'fr-FR'
      });
      expect(res.intent).toBe('CASH_WITHDRAWAL');
      expect(res.extracted_data.member_code).toBe('A0200226');
      expect(res.extracted_data.amount).toBe(10000);
    });

    it('parses nominal Éwé deposit order in < 2000ms', async () => {
      const res = await cashierService.parseCashierOrder({
        transcript: 'Nye di be maɖo akpe blaeve ɖe Tomrom ƒe akɔnta me',
        language: 'ee-TG'
      });
      expect(res.intent).toBe('CASH_DEPOSIT');
      expect(res.extracted_data.member_code).toBe('A0200225');
      expect(res.extracted_data.amount).toBe(20000);
      expect(res.language_detected).toBe('ee-TG');
    });

    it('parses nominal Mina deposit order in < 2000ms', async () => {
      const res = await cashierService.parseCashierOrder({
        transcript: 'Sɔ akpe blaetɔ̃ do Ablavi ƒe akɔnti me',
        language: 'gej-TG'
      });
      expect(res.intent).toBe('CASH_DEPOSIT');
      expect(res.extracted_data.member_code).toBe('A0200227');
      expect(res.extracted_data.amount).toBe(30000);
      expect(res.language_detected).toBe('gej-TG');
    });

    it('parses French regional slang (two bags = 200,000 XOF) in < 2000ms', async () => {
      const res = await cashierService.parseCashierOrder({
        transcript: 'Pose deux sacs pour Tomrom'
      });
      expect(res.intent).toBe('CASH_DEPOSIT');
      expect(res.extracted_data.member_code).toBe('A0200225');
      expect(res.extracted_data.amount).toBe(200000);
    });

    it('parses balance inquiry order', async () => {
      const res = await cashierService.parseCashierOrder({
        transcript: 'Consulte le solde de l\'adhérent 610'
      });
      expect(res.intent).toBe('BALANCE_INQUIRY');
      expect(res.extracted_data.member_code).toBe('A0200225');
    });
  });

  // ==========================================================================
  // 2. HTTP REST Endpoints Integration Tests (Supertest)
  // ==========================================================================
  describe('AI REST Endpoints', () => {
    it('POST /api/ai/parse-order returns 200 with structured JSON and latency header', async () => {
      const response = await request(app)
        .post('/api/ai/parse-order')
        .send({
          transcript: 'Fais un versement de cinquante mille francs pour MILDZINA Tomrom sur son épargne',
          dialect: 'fr-FR'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.intent).toBe('CASH_DEPOSIT');
      expect(response.body.extracted_data.amount).toBe(50000);
      expect(response.body.extracted_data.member_name).toBe('MILDZINA Tomrom');
      expect(response.body.latency_ms).toBeLessThan(2000);
      expect(response.headers['x-response-time-ms']).toBeDefined();
    });

    it('POST /api/v1/ai/voice-parse compatibility alias works', async () => {
      const response = await request(app)
        .post('/api/v1/ai/voice-parse')
        .send({
          transcript: 'Nye di be maɖo akpe blaeve ɖe Tomrom ƒe akɔnta me'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.intent).toBe('CASH_DEPOSIT');
      expect(response.body.extracted_data.amount).toBe(20000);
    });

    it('POST /api/ai/parse-order returns 400 when both transcript and audio are missing', async () => {
      const response = await request(app)
        .post('/api/ai/parse-order')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required field');
    });

    it('POST /api/ai/financial-query computes prudential metrics', async () => {
      const response = await request(app)
        .post('/api/ai/financial-query')
        .send({
          query: 'Quel est notre ratio de liquidité et notre PAR 30 ?',
          agency_code: 'A02'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metrics.R_LIQ).toBeDefined();
      expect(response.body.metrics.PAR_30).toBeDefined();
      expect(response.body.latency_ms).toBeLessThan(2000);
    });

    it('GET /api/ai/health returns 200 with service health info', async () => {
      const response = await request(app)
        .get('/api/ai/health')
        .expect(200);

      expect(response.body.status).toBe('HEALTHY');
      expect(response.body.service).toBe('banolia-ai-assistant');
      expect(response.body.engine).toBeDefined();
    });
  });
});
