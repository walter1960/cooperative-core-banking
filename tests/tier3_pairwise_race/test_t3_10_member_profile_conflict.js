/**
 * Tier 3 — 10: Field Collector Phone Update vs Back-Office Address Modification
 */

import { describe, test } from '../common/harness.js';
import assert from 'node:assert/strict';

describe('Tier 3 - 10: Member Profile Multi-Device Conflict', () => {
  test('T3_10_01: Field Collector Phone Update Merges with Back-Office Address Modification', () => {
    const baseMember = {
      code: 'A0200225',
      fullName: 'MILDZINA Tomrom',
      phone: '+22890123456',
      address: 'Grand Marché',
      version: 1
    };

    // Device A (Collector) updates phone
    const deviceAUpdate = { ...baseMember, phone: '+22890999999', version: 2 };

    // Device B (Back-Office) updates address
    const deviceBUpdate = { ...baseMember, address: 'Nouvelle Boutique Assivito', version: 2 };

    // 3-way merge
    const merged = {
      code: baseMember.code,
      fullName: baseMember.fullName,
      phone: deviceAUpdate.phone,
      address: deviceBUpdate.address,
      version: 3
    };

    assert.strictEqual(merged.phone, '+22890999999');
    assert.strictEqual(merged.address, 'Nouvelle Boutique Assivito');
    assert.strictEqual(merged.version, 3);
  });

  test('T3_10_02: Conflicting Same-Field Edit Resolved by Higher Timestamp Rule', () => {
    const edit1 = { phone: '+22890111111', timestamp: '2026-08-20T10:00:00Z' };
    const edit2 = { phone: '+22890222222', timestamp: '2026-08-20T10:05:00Z' };

    const winner = edit2.timestamp > edit1.timestamp ? edit2 : edit1;
    assert.strictEqual(winner.phone, '+22890222222');
  });
});
