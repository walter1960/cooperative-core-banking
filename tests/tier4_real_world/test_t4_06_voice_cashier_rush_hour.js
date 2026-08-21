/**
 * Tier 4 — 06: Voice Cashier Rush Hour (20 Consecutive Voice-Driven Operations under 2s Each)
 */

import { describe, test } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockVoiceAIEngine } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 4 - 06: Voice Cashier Rush Hour High-Throughput Stream', () => {
  test('T4_06: 20 Consecutive Voice Orders Parsed with Strict Sub-2s Latency Budget', () => {
    const orders = [
      'Versement de cinquante mille francs pour Tomrom',
      'Retrait de vingt mille francs pour Mensah',
      'Versement de dix mille francs pour Afiwa',
      'Ga dodo akpe blaato na Tomrom',
      'Retrait de dix mille francs pour le membre 610',
      'Versement de akpe blaeve pour Tomrom',
      'Asusu dido akpe deka na Afiwa',
      'Retrait de vingt mille francs pour Mensah',
      'Versement de cent mille francs pour Lawson',
      'Ga dede akpe blaeve na Mensah',
      'Versement de cinquante mille francs pour Tomrom',
      'Retrait de dix mille francs pour Afiwa',
      'Versement de vingt mille francs pour Mensah',
      'Asusu dido akpe deka na Afiwa',
      'Versement de dix mille francs pour Tomrom',
      'Retrait de cinquante mille francs pour Lawson',
      'Versement de akpe blaato na Tomrom',
      'Retrait de dix mille francs pour Mensah',
      'Versement de cent mille francs pour Tomrom',
      'Retrait de vingt mille francs pour Afiwa'
    ];

    let totalLatency = 0;
    for (let i = 0; i < orders.length; i++) {
      const res = MockVoiceAIEngine.parseOrder(orders[i], 'mixed');
      assert.ok(res.intent !== 'UNKNOWN', `Order ${i + 1} intent recognized`);
      assert.ok(res.latency_ms < 2000, `Order ${i + 1} latency ${res.latency_ms}ms exceeded budget`);
      CustomAssert.assertLatencyBudget(res.latency_ms, 2000);
      totalLatency += res.latency_ms;
    }

    const avgLatency = Math.round(totalLatency / orders.length);
    assert.ok(avgLatency < 2000);
  });
});
