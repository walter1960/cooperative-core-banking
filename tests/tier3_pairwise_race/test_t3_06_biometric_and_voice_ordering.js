/**
 * Tier 3 — 06: Voice Order Parsing with Simultaneous Biometric Confirmation
 */

import { describe, test } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockVoiceAIEngine, MockBiometricHAL } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 3 - 06: Voice Order with Simultaneous Biometric Confirmation', () => {
  test('T3_06_01: Voice-Driven Teller Withdrawal Completed via Fingerprint Match', () => {
    // 1. Teller speaks: "Retrait de cinquante mille francs pour Tomrom"
    const voiceRes = MockVoiceAIEngine.parseOrder('Retrait de cinquante mille francs pour Tomrom', 'fr');
    assert.strictEqual(voiceRes.intent, 'CASH_WITHDRAWAL');
    assert.strictEqual(voiceRes.extracted_data.amount, 50000);

    // 2. Member places finger on scanner
    const enrolled = MockBiometricHAL.generateTemplate('A0200225');
    const scanned = MockBiometricHAL.generateTemplate('A0200225');
    const bioRes = MockBiometricHAL.match(enrolled, scanned);

    assert.strictEqual(bioRes.matched, true);
    CustomAssert.assertIso19794Match(bioRes.score, 85, true);
  });

  test('T3_06_02: Voice Order Aborted on Biometric Identity Mismatch', () => {
    const voiceRes = MockVoiceAIEngine.parseOrder('Retrait de cinquante mille francs pour Tomrom', 'fr');
    const enrolledTomrom = MockBiometricHAL.generateTemplate('A0200225');
    const impostorScanned = MockBiometricHAL.generateTemplate('A0200999');

    const bioRes = MockBiometricHAL.match(enrolledTomrom, impostorScanned);
    assert.strictEqual(bioRes.matched, false);

    assert.throws(() => {
      if (!bioRes.matched) {
        throw new Error('Transaction cancelled: biometric authentication failed');
      }
    }, /biometric authentication failed/);
  });
});
