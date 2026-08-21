/**
 * Tier 2 — F10: Biometric Corrupted Templates & False Acceptance Thresholds
 */

import { describe, test } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockBiometricHAL } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 2 - F10: Biometric Boundaries & Template Corruption', () => {
  test('T2_F10_01: Zero-Length Biometric Buffer Rejection', () => {
    const res = MockBiometricHAL.match(Buffer.alloc(0), Buffer.alloc(0));
    assert.strictEqual(res.matched, false);
    assert.strictEqual(res.score, 0);
  });

  test('T2_F10_02: Truncated ISO 19794-2 Template Header Rejection (Missing Magic FMR\\0)', () => {
    const corrupted = Buffer.from('XXXX_INVALID_MAGIC_HEADER_TOO_SHORT');
    const valid = MockBiometricHAL.generateTemplate('A0200225');

    const res = MockBiometricHAL.match(corrupted, valid);
    assert.strictEqual(res.matched, false);
    assert.ok(res.error.includes('header') || res.error.includes('template'));
  });

  test('T2_F10_03: Marginal Match Score Boundary (Score 84/100 Rejection vs Threshold 85)', () => {
    // Score 84 < 85 Threshold
    CustomAssert.assertIso19794Match(84, 85, false);
  });

  test('T2_F10_04: Exact Threshold Boundary Match (Score 85/100 Acceptance)', () => {
    // Score 85 == 85 Threshold
    CustomAssert.assertIso19794Match(85, 85, true);
  });

  test('T2_F10_05: Handling Null or Undefined Biometric Input Parameters', () => {
    const res = MockBiometricHAL.match(null, undefined);
    assert.strictEqual(res.matched, false);
    assert.strictEqual(res.score, 0);
  });
});
