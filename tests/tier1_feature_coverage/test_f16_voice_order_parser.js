/**
 * Tier 1 — F16: Voice Cashier Order Parser (Gemini API / Latency Budget < 2.0s)
 */

import { describe, test } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockVoiceAIEngine } from '../common/mocks.js';
import { FIXTURES } from '../common/fixtures.js';
import assert from 'node:assert/strict';

describe('Tier 1 - F16: Voice Cashier Order Parser', () => {
  test('T1_F16_01: French Deposit Order Structured Intent Extraction under 2s Budget', () => {
    const transcript = FIXTURES.VOICE_TRANSCRIPTS.FRENCH_DEPOSIT; // "Versement de cinquante mille francs pour Tomrom"
    const res = MockVoiceAIEngine.parseOrder(transcript, 'fr');

    assert.strictEqual(res.intent, 'CASH_DEPOSIT');
    assert.strictEqual(res.extracted_data.amount, 50000);
    assert.strictEqual(res.extracted_data.member_code, 'A0200225');
    assert.strictEqual(res.extracted_data.currency, 'XOF');
    CustomAssert.assertLatencyBudget(res.latency_ms, 2000);
  });

  test('T1_F16_02: French Withdrawal Order Structured Intent Extraction', () => {
    const transcript = FIXTURES.VOICE_TRANSCRIPTS.FRENCH_WITHDRAWAL; // "Retrait de vingt mille francs pour le sociétaire 610"
    const res = MockVoiceAIEngine.parseOrder(transcript, 'fr');

    assert.strictEqual(res.intent, 'CASH_WITHDRAWAL');
    assert.strictEqual(res.extracted_data.amount, 20000);
    assert.strictEqual(res.extracted_data.member_code, 'A0200225');
    CustomAssert.assertLatencyBudget(res.latency_ms, 2000);
  });

  test('T1_F16_03: Éwé Language Deposit Order Intent and Amount Parsing', () => {
    const transcript = FIXTURES.VOICE_TRANSCRIPTS.EWE_DEPOSIT; // "Ga dodo akpe blaato na Tomrom" (50,000 F)
    const res = MockVoiceAIEngine.parseOrder(transcript, 'ee');

    assert.strictEqual(res.intent, 'CASH_DEPOSIT');
    assert.strictEqual(res.extracted_data.amount, 50000);
    CustomAssert.assertLatencyBudget(res.latency_ms, 2000);
  });

  test('T1_F16_04: Mina Language Tontine Order Intent Extraction', () => {
    const transcript = FIXTURES.VOICE_TRANSCRIPTS.MINA_TONTINE; // "Asusu dido akpe ɖeka na Afiwa" (1,000 F)
    const res = MockVoiceAIEngine.parseOrder(transcript, 'gej');

    assert.strictEqual(res.intent, 'TONTINE_COLLECTION');
    assert.strictEqual(res.extracted_data.amount, 1000);
    assert.strictEqual(res.extracted_data.member_code, 'A0200227');
    CustomAssert.assertLatencyBudget(res.latency_ms, 2000);
  });

  test('T1_F16_05: Code-Switching (French + Éwé Dialect) Order Parsing', () => {
    const transcript = FIXTURES.VOICE_TRANSCRIPTS.MIXED_ORDER; // "Versement de akpe blaeve pour Tomrom" (20,000 F)
    const res = MockVoiceAIEngine.parseOrder(transcript, 'mixed');

    assert.strictEqual(res.intent, 'CASH_DEPOSIT');
    assert.strictEqual(res.extracted_data.amount, 20000);
    assert.strictEqual(res.extracted_data.member_code, 'A0200225');
    CustomAssert.assertLatencyBudget(res.latency_ms, 2000);
  });
});
