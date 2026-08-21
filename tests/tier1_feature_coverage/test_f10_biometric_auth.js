/**
 * Tier 1 — F10: Biometric Authentication (ISO/IEC 19794-2)
 */

import { describe, test } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockBiometricHAL } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 1 - F10: Biometric ISO 19794-2 Authentication', () => {
  test('T1_F10_01: ISO 19794-2 Template Header Structure Validation', () => {
    const template = MockBiometricHAL.generateTemplate('A0200225', 95);
    assert.strictEqual(template.length, 512);
    assert.strictEqual(template.subarray(0, 4).toString('ascii'), 'FMR\0');
  });

  test('T1_F10_02: Successful 1:1 Biometric Verification Score (Score >= 85)', () => {
    const enrolled = MockBiometricHAL.generateTemplate('A0200225', 95);
    const scanned = MockBiometricHAL.generateTemplate('A0200225', 95);

    const matchResult = MockBiometricHAL.match(enrolled, scanned, 85);
    assert.strictEqual(matchResult.matched, true);
    assert.ok(matchResult.score >= 85);
    CustomAssert.assertIso19794Match(matchResult.score, 85, true);
  });

  test('T1_F10_03: Biometric Mismatch Rejection for Non-Matching Fingers (Score < 85)', () => {
    const enrolledA = MockBiometricHAL.generateTemplate('A0200225', 95);
    const scannedB = MockBiometricHAL.generateTemplate('A0200226', 95);

    const matchResult = MockBiometricHAL.match(enrolledA, scannedB, 85);
    assert.strictEqual(matchResult.matched, false);
    assert.ok(matchResult.score < 85);
    CustomAssert.assertIso19794Match(matchResult.score, 85, false);
  });

  test('T1_F10_04: Rejection of Corrupted Biometric Template Payload', () => {
    const corrupted = Buffer.from('CORRUPTED_TEMPLATE_PAYLOAD');
    const valid = MockBiometricHAL.generateTemplate('A0200225');

    const matchResult = MockBiometricHAL.match(corrupted, valid, 85);
    assert.strictEqual(matchResult.matched, false);
    assert.strictEqual(matchResult.score, 0);
  });

  test('T1_F10_05: Biometric Verification Security Gate Blocks Unauthorized Withdrawal', () => {
    const enrolled = MockBiometricHAL.generateTemplate('A0200225');
    const impostor = MockBiometricHAL.generateTemplate('A0200999');

    const auth = MockBiometricHAL.match(enrolled, impostor, 85);
    assert.throws(() => {
      if (!auth.matched) {
        throw new Error('Biometric authorization failed: fingerprint mismatch');
      }
    }, /mismatch/);
  });
});
