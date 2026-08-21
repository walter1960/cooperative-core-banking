/**
 * Tier 1 — F14: Unified Mobile Money Gateway (TMoney, Flooz, Wave, MTN MoMo, Orange Money)
 */

import { describe, test, beforeEach } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockMobileMoneyGateway, MockGeneralLedger } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 1 - F14: Mobile Money Gateways', () => {
  let gateway;
  let ledger;

  beforeEach(() => {
    gateway = new MockMobileMoneyGateway();
    ledger = new MockGeneralLedger();
  });

  test('T1_F14_01: TMoney Deposit Initiation and USSD Push Confirmation', async () => {
    const res = await gateway.initiateDeposit({
      provider: 'TMONEY',
      phone: '+22890123456',
      amount: 50000,
      accountNumber: '25121100A020022501'
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.status, 'SUCCESS');
    assert.ok(res.txRef.startsWith('MOMO-TMONEY-'));
  });

  test('T1_F14_02: Flooz (Moov Togo) Cash-In Verification and Status Polling', async () => {
    const init = await gateway.initiateDeposit({
      provider: 'FLOOZ',
      phone: '+22899123456',
      amount: 25000,
      accountNumber: '25121100A020022601'
    });

    const status = gateway.verifyTransaction(init.txRef);
    assert.strictEqual(status.found, true);
    assert.strictEqual(status.amount, 25000);
    assert.strictEqual(status.status, 'SUCCESS');
  });

  test('T1_F14_03: Wave QR Code Direct Account Credit and General Ledger Settlement', async () => {
    const init = await gateway.initiateDeposit({
      provider: 'WAVE',
      phone: '+22890000000',
      amount: 100000,
      accountNumber: '25121100A020022501'
    });

    // GL entry: Dr 578300 (Wallet Wave) 100,000 / Cr 251211 (DAV) 100,000
    const entry = ledger.postJournalEntry({
      date: '2026-08-20',
      description: `Versement Wave réf ${init.txRef}`,
      lines: [
        { accountNumber: '578300', debit: 100000, credit: 0, desc: 'Portefeuille Marchand Wave' },
        { accountNumber: '251211', debit: 0, credit: 100000, desc: 'Crédit compte membre' }
      ]
    });

    CustomAssert.assertLedgerBalanced(entry);
    const waveWallet = ledger.getAccount('578300');
    assert.strictEqual(waveWallet.currentDebit, 100000);
  });

  test('T1_F14_04: MTN MoMo Withdrawal Request Initiation', async () => {
    const res = await gateway.initiateWithdrawal({
      provider: 'MTN_MOMO',
      phone: '+22891111111',
      amount: 30000,
      accountNumber: '25121100A020022501'
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.status, 'SUCCESS');
  });

  test('T1_F14_05: Orange Money Gateway Webhook Idempotent Processing', async () => {
    const res = await gateway.initiateDeposit({
      provider: 'ORANGE_MONEY',
      phone: '+22892222222',
      amount: 40000,
      accountNumber: '25121100A020022701'
    });

    const status1 = gateway.verifyTransaction(res.txRef);
    const status2 = gateway.verifyTransaction(res.txRef);
    assert.strictEqual(status1.amount, status2.amount);
    assert.strictEqual(status1.status, status2.status);
  });
});
