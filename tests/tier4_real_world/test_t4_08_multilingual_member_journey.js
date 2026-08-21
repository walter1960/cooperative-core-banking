/**
 * Tier 4 — 08: Trilingual Member Omni-Channel Journey (Éwé Voice -> Mina Tontine -> French Statement)
 */

import { describe, test } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockVoiceAIEngine, MockEscPosPrinter } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 4 - 08: Multilingual Member Omni-Channel Journey', () => {
  test('T4_08: End-to-End Trilingual Member Interaction across Channels', () => {
    // 1. Member arrives at counter and speaks Éwé: "Ga dodo akpe blaato na Tomrom" (Deposit 50k)
    const eweVoice = MockVoiceAIEngine.parseOrder('Ga dodo akpe blaato na Tomrom', 'ee');
    assert.strictEqual(eweVoice.intent, 'CASH_DEPOSIT');
    assert.strictEqual(eweVoice.extracted_data.amount, 50000);
    CustomAssert.assertLatencyBudget(eweVoice.latency_ms, 2000);

    // 2. Member goes to market collector and pays Mina Tontine: "Asusu dido akpe deka na Afiwa" (1,000 F)
    const minaVoice = MockVoiceAIEngine.parseOrder('Asusu dido akpe deka na Afiwa', 'gej');
    assert.strictEqual(minaVoice.intent, 'TONTINE_COLLECTION');
    assert.strictEqual(minaVoice.extracted_data.amount, 1000);
    CustomAssert.assertLatencyBudget(minaVoice.latency_ms, 2000);

    // 3. Member requests official French printed thermal statement at counter
    const statementReceipt = MockEscPosPrinter.format80mmReceipt({
      receiptNumber: 'REC-STATEMENT-01',
      memberName: 'MILDZINA Tomrom',
      memberCode: 'A0200225',
      type: 'RELEVE_COMPTE',
      amount: 50000,
      balance: 330424
    });

    CustomAssert.assertEscPosReceipt(statementReceipt, [
      'COOPEC BANOLIA',
      'MILDZINA Tomrom',
      'A0200225',
      '330 424'
    ]);
  });
});
