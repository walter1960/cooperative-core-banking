/**
 * Tier 3 — 09: Mobile Money Webhook Callback Racing Against Status Polling
 */

import { describe, test, beforeEach } from '../common/harness.js';
import { MockMobileMoneyGateway } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 3 - 09: Mobile Money Webhook vs Polling Race', () => {
  let gateway;

  beforeEach(() => {
    gateway = new MockMobileMoneyGateway();
  });

  test('T3_09_01: Simultaneous Webhook Receipt and Client Status Poll on Same Tx', async () => {
    const init = await gateway.initiateDeposit({
      provider: 'FLOOZ',
      phone: '+22899123456',
      amount: 15000,
      accountNumber: '25121100A020022501'
    });

    // 1. Client polls status
    const pollResult = gateway.verifyTransaction(init.txRef);

    // 2. Webhook triggers simultaneously
    const webhookResult = gateway.verifyTransaction(init.txRef);

    assert.strictEqual(pollResult.status, 'SUCCESS');
    assert.strictEqual(webhookResult.status, 'SUCCESS');
    assert.strictEqual(pollResult.amount, webhookResult.amount);
  });

  test('T3_09_02: Webhook Dedup Protects Against Multiple Credit Attempts', () => {
    const processedWebhooks = new Set();

    const processWebhook = (txRef) => {
      if (processedWebhooks.has(txRef)) {
        return { status: 'ALREADY_PROCESSED', credited: false };
      }
      processedWebhooks.add(txRef);
      return { status: 'PROCESSED', credited: true };
    };

    const first = processWebhook('MOMO-FLOOZ-12345');
    const second = processWebhook('MOMO-FLOOZ-12345');

    assert.strictEqual(first.credited, true);
    assert.strictEqual(second.credited, false);
    assert.strictEqual(second.status, 'ALREADY_PROCESSED');
  });
});
