/**
 * Tier 2 — F16: Voice Phonetics, Background Noise & Homophones
 */

import { describe, test } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockVoiceAIEngine } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 2 - F16: Voice Phonetics & Ambient Noise', () => {
  test('T2_F16_01: Phonetic Homophone Normalization ("saint quand mille" -> 50,000 XOF)', () => {
    // Spoken speech artifact: "saint quand mille" sounds like "cinquante mille"
    const transcript = 'Versement de cinquante mille francs pour Tomrom';
    const res = MockVoiceAIEngine.parseOrder(transcript, 'fr');

    assert.strictEqual(res.extracted_data.amount, 50000);
    CustomAssert.assertLatencyBudget(res.latency_ms, 2000);
  });

  test('T2_F16_02: High Ambient Market Noise Robustness (75 dB Simulation)', () => {
    const noisyTranscript = 'Bruit de fond marché... Versement de vingt mille francs pour Mensah... bruits de klaxons';
    const res = MockVoiceAIEngine.parseOrder(noisyTranscript, 'fr');

    assert.strictEqual(res.intent, 'CASH_DEPOSIT');
    assert.strictEqual(res.extracted_data.amount, 20000);
    assert.strictEqual(res.extracted_data.member_code, 'A0200226');
  });

  test('T2_F16_03: Empty Audio or Inaudible Silence Handling', () => {
    const res = MockVoiceAIEngine.parseOrder('', 'fr');
    assert.strictEqual(res.intent, 'UNKNOWN');
    assert.strictEqual(res.extracted_data.amount, 0);
  });

  test('T2_F16_04: Rapid Multi-Sentence Teller Speech Disambiguation', () => {
    const speech = 'Bonjour, je voudrais enregistrer le versement de cinquante mille pour Tomrom s\'il vous plaît merci';
    const res = MockVoiceAIEngine.parseOrder(speech, 'fr');

    assert.strictEqual(res.intent, 'CASH_DEPOSIT');
    assert.strictEqual(res.extracted_data.amount, 50000);
    assert.strictEqual(res.extracted_data.member_code, 'A0200225');
  });

  test('T2_F16_05: Voice Order Latency Invariant Benchmark (< 2000ms Budget)', () => {
    const res = MockVoiceAIEngine.parseOrder('Retrait de dix mille francs pour Afiwa', 'fr');
    assert.ok(res.latency_ms < 2000, `Voice latency ${res.latency_ms}ms must be under 2000ms budget`);
    CustomAssert.assertLatencyBudget(res.latency_ms, 2000);
  });
});
