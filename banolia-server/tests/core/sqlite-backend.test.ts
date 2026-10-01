import request from 'supertest';
import { createApp } from '../../src/app';
import { db } from '../../src/db/sqlite';
import { MemberRepository } from '../../src/db/repositories/member.repo';
import { AccountRepository } from '../../src/db/repositories/account.repo';
import { LoanRepository } from '../../src/db/repositories/loan.repo';
import { CaisseRepository } from '../../src/db/repositories/caisse.repo';

describe('Real Core Banking SQLite Backend & REST API', () => {
  const app = createApp();

  beforeAll(() => {
    // Nettoyer pour tests isolés
    db.prepare('DELETE FROM mobile_requests').run();
    db.prepare('DELETE FROM loan_schedules').run();
    db.prepare('DELETE FROM loans').run();
    db.prepare('DELETE FROM transactions').run();
    db.prepare('DELETE FROM accounts').run();
    db.prepare('DELETE FROM savings_locks').run();
    db.prepare('DELETE FROM members').run();
    db.prepare('DELETE FROM cash_shifts').run();
  });

  describe('Health check', () => {
    it('should return UP and identify persistent SQLite engine', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.database).toContain('SQLite');
    });
  });

  describe('Members Management (Sociétaires Réels)', () => {
    it('should register a new member with automated savings & share accounts', async () => {
      const res = await request(app)
        .post('/api/members')
        .send({
          code: '130001',
          fullName: 'KOKOU Yao Messan',
          phone: '+228 90 11 22 33',
          address: 'Quartier Tokoin Hôpital',
          city: 'Lomé',
          idType: 'CNI',
          idNumber: 'TG-CNI-987654',
          sharesPurchased: 2,
          sharesNonLiberated: 0,
          shareUnitPrice: 10000
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.member.code).toBe('130001');
      expect(res.body.member.full_name).toBe('KOKOU Yao Messan');
      expect(res.body.accounts.length).toBe(2);

      const savingsAcc = res.body.accounts.find((a: any) => a.product_code === 'EPG_VOLONTAIRE');
      const shareAcc = res.body.accounts.find((a: any) => a.product_code === 'PARTS_SOCIALES');

      expect(savingsAcc).toBeDefined();
      expect(savingsAcc.balance).toBe(0);
      expect(shareAcc).toBeDefined();
      expect(shareAcc.balance).toBe(20000); // 2 * 10000
    });

    it('should retrieve member details by code with accounts', async () => {
      const res = await request(app).get('/api/members/130001');
      expect(res.status).toBe(200);
      expect(res.body.member.code).toBe('130001');
      expect(res.body.accounts.length).toBe(2);
    });

    it('should search member by query name or phone', async () => {
      const res = await request(app).get('/api/members?q=KOKOU');
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.members[0].code).toBe('130001');
    });
  });

  describe('Accounts & Cash Transactions (ACID Operations)', () => {
    it('should deposit money into member savings account', async () => {
      const accounts = AccountRepository.getByMember('130001');
      const savings = accounts.find(a => a.product_code === 'EPG_VOLONTAIRE')!;

      const res = await request(app)
        .post(`/api/accounts/${savings.account_number}/deposit`)
        .send({
          amount: 500000,
          category: 'VERSEMENT_ESPECES',
          subtitle: 'Dépôt initial'
        });

      expect(res.status).toBe(200);
      expect(res.body.newBalance).toBe(500000);

      const updated = AccountRepository.getByNumber(savings.account_number)!;
      expect(updated.balance).toBe(500000);
    });

    it('should lock savings voluntarily (e.g. 50% for 6 months)', async () => {
      const res = await request(app)
        .post('/api/accounts/lock')
        .send({
          memberCode: '130001',
          isBlocked: true,
          percentage: 50,
          durationMonths: 6
        });

      expect(res.status).toBe(200);
      expect(res.body.blockedAmount).toBe(250000); // 50% de 500 000

      const accounts = AccountRepository.getByMember('130001');
      const savings = accounts.find(a => a.product_code === 'EPG_VOLONTAIRE')!;
      expect(savings.blocked_balance).toBe(250000);
    });

    it('should reject withdrawal exceeding liquid available balance', async () => {
      const accounts = AccountRepository.getByMember('130001');
      const savings = accounts.find(a => a.product_code === 'EPG_VOLONTAIRE')!;

      // Solde total: 500k, Bloqué: 250k, Liquide disponible: 250k
      // Tentative de retrait de 300k -> Doit échouer
      const res = await request(app)
        .post(`/api/accounts/${savings.account_number}/withdraw`)
        .send({
          amount: 300000
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Solde liquide disponible insuffisant');
    });

    it('should permit withdrawal within liquid available balance', async () => {
      const accounts = AccountRepository.getByMember('130001');
      const savings = accounts.find(a => a.product_code === 'EPG_VOLONTAIRE')!;

      const res = await request(app)
        .post(`/api/accounts/${savings.account_number}/withdraw`)
        .send({
          amount: 100000,
          category: 'RETRAIT_ESPECES'
        });

      expect(res.status).toBe(200);
      expect(res.body.newBalance).toBe(400000); // 500k - 100k
    });
  });

  describe('Loans & Amortization Schedules', () => {
    it('should create a loan dossier and generate monthly schedule installments in SQLite', async () => {
      const res = await request(app)
        .post('/api/loans')
        .send({
          memberCode: '130001',
          productName: 'Crédit Équipement Agricole',
          amount: 1200000,
          durationMonths: 12,
          interestRate: 12.0,
          calculationMethod: 'LINEAIRE',
          purpose: 'Achat moto-pompe et semences'
        });

      expect(res.status).toBe(201);
      expect(res.body.loan.amount).toBe(1200000);
      expect(res.body.loan.duration_months).toBe(12);
      expect(res.body.schedules.length).toBe(12);

      // Total principal in schedule must equal loan amount
      const totalPrincipalScheduled = res.body.schedules.reduce((acc: number, s: any) => acc + s.principal_due, 0);
      expect(totalPrincipalScheduled).toBe(1200000);
    });
  });

  describe('Mobile Requests Inbound & Persistence', () => {
    it('should persist mobile requests in SQLite', async () => {
      const res = await request(app)
        .post('/api/mobile/requests')
        .send({
          type: 'LOAN',
          memberCode: '130001',
          memberName: 'KOKOU Yao Messan',
          memberPhone: '+228 90 11 22 33',
          amount: 750000,
          durationMonths: 6,
          purpose: 'Financement stock'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.request.amount).toBe(750000);

      // Read from GET /api/mobile/requests
      const getRes = await request(app).get('/api/mobile/requests');
      expect(getRes.status).toBe(200);
      expect(getRes.body.total).toBe(1);
      expect(getRes.body.requests[0].amount).toBe(750000);
    });
  });

  describe('Dashboard Real Aggregates', () => {
    it('should calculate accurate metrics from real database records', async () => {
      const res = await request(app).get('/api/dashboard/stats');
      expect(res.status).toBe(200);
      expect(res.body.stats.totalMembers).toBe(1);
      expect(res.body.stats.financials.totalSavings).toBe(400000);
      expect(res.body.stats.financials.totalBlockedSavings).toBe(250000);
      expect(res.body.stats.financials.totalAvailableSavings).toBe(150000);
      expect(res.body.stats.financials.totalShareCapital).toBe(20000);
      expect(res.body.stats.financials.totalLoansAmount).toBe(1200000);
      expect(res.body.stats.mobileRequests.pendingCount).toBe(1);
    });
  });
});
