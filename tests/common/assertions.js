/**
 * BANOLIA Custom Regulatory & Financial Matchers
 * Provides exact arithmetic, double-entry equilibrium, and regulatory ratio assertions.
 */

import assert from 'node:assert/strict';
import { harness } from './harness.js';

export const CustomAssert = {
  /**
   * Asserts exact integer XOF currency amount
   */
  assertCurrencyAmount(actual, expected, msg = '') {
    assert.strictEqual(
      typeof actual,
      'number',
      `Amount must be a number, got ${typeof actual}. ${msg}`
    );
    assert.strictEqual(
      Math.round(actual),
      actual,
      `Amount in XOF must be integer precision (no centimes): ${actual}. ${msg}`
    );
    assert.strictEqual(
      actual,
      expected,
      `Expected ${expected} XOF, got ${actual} XOF. ${msg}`
    );
  },

  /**
   * Asserts exact Double-Entry General Ledger Balance (Sum(Debits) === Sum(Credits))
   */
  assertLedgerBalanced(journalEntriesOrLines, msg = '') {
    let totalDebit = 0;
    let totalCredit = 0;

    const items = Array.isArray(journalEntriesOrLines) ? journalEntriesOrLines : [journalEntriesOrLines];

    for (const item of items) {
      if (item.lines && Array.isArray(item.lines)) {
        for (const line of item.lines) {
          totalDebit += Number(line.debit || 0);
          totalCredit += Number(line.credit || 0);
        }
      } else if (item.debit !== undefined || item.credit !== undefined) {
        totalDebit += Number(item.debit || 0);
        totalCredit += Number(item.credit || 0);
      } else if (item.totalDebit !== undefined && item.totalCredit !== undefined) {
        totalDebit += Number(item.totalDebit);
        totalCredit += Number(item.totalCredit);
      }
    }

    // Record in global harness invariant tracker
    harness.recordLedgerEntry(totalDebit, totalCredit);

    const diff = Math.abs(totalDebit - totalCredit);
    assert.ok(
      diff < 0.0001,
      `Ledger out of balance! Total Debits: ${totalDebit} XOF != Total Credits: ${totalCredit} XOF (Diff: ${diff} XOF). ${msg}`
    );
  },

  /**
   * Asserts Loan Amortization Schedule Mathematical Integrity
   */
  assertAmortizationSchedule(schedule, principal, rate, duration, formula = 'CONSTANT_ANNUITY') {
    assert.ok(Array.isArray(schedule), 'Schedule must be an array');
    assert.strictEqual(schedule.length, duration, `Schedule must have exactly ${duration} installments`);

    let totalPrincipalRecovered = 0;
    let totalInterest = 0;

    for (let i = 0; i < schedule.length; i++) {
      const row = schedule[i];
      assert.strictEqual(row.periodNumber, i + 1, `Period number mismatch at index ${i}`);
      assert.ok(row.payment >= 0, `Payment cannot be negative in period ${i + 1}`);
      assert.ok(row.principal >= 0, `Principal cannot be negative in period ${i + 1}`);
      assert.ok(row.interest >= 0, `Interest cannot be negative in period ${i + 1}`);

      // Row equilibrium: Payment == Principal + Interest
      const paymentDiff = Math.abs(row.payment - (row.principal + row.interest));
      assert.ok(
        paymentDiff <= 1.0, // Allow 1 XOF rounding difference
        `Payment (${row.payment}) does not equal Principal (${row.principal}) + Interest (${row.interest}) at period ${i + 1}`
      );

      totalPrincipalRecovered += row.principal;
      totalInterest += row.interest;
    }

    // Total principal recovered must equal initial principal (with max 1 XOF rounding)
    const principalDiff = Math.abs(totalPrincipalRecovered - principal);
    assert.ok(
      principalDiff <= 2.0,
      `Total principal amortized (${totalPrincipalRecovered}) != original loan amount (${principal})`
    );

    // Final balance must be 0
    const finalRow = schedule[schedule.length - 1];
    assert.ok(
      Math.abs(finalRow.remainingPrincipal) <= 1.0,
      `Final remaining principal must be 0 XOF, got ${finalRow.remainingPrincipal}`
    );
  },

  /**
   * Asserts BCEAO Prudential Ratio Conformity
   */
  assertBceaoRatio(ratioCode, actualValue, threshold, condition = 'gte', msg = '') {
    assert.strictEqual(typeof actualValue, 'number', `Ratio ${ratioCode} value must be numeric`);
    if (condition === 'gte') {
      assert.ok(
        actualValue >= threshold,
        `BCEAO Ratio ${ratioCode} breached: ${actualValue}% < required minimum ${threshold}%. ${msg}`
      );
    } else if (condition === 'lte') {
      assert.ok(
        actualValue <= threshold,
        `BCEAO Ratio ${ratioCode} breached: ${actualValue}% > allowed maximum ${threshold}%. ${msg}`
      );
    }
  },

  /**
   * Asserts Latency Budget (< 2000ms for Voice AI)
   */
  assertLatencyBudget(latencyMs, maxBudgetMs = 2000, context = 'Voice AI') {
    harness.recordVoiceLatency(latencyMs);
    assert.ok(
      latencyMs <= maxBudgetMs,
      `${context} latency exceeded budget: ${latencyMs}ms > ${maxBudgetMs}ms`
    );
  },

  /**
   * Asserts Usury Rate Cap (< 27.0% per annum)
   */
  assertUsuryRateCap(annualRate, isAllowed) {
    harness.recordUsuryRate(annualRate, isAllowed);
    if (annualRate > 27.0) {
      assert.strictEqual(
        isAllowed,
        false,
        `Usury ceiling breach: Rate ${annualRate}% > 27.0% cannot be approved by system`
      );
    }
  },

  /**
   * Asserts ESC/POS Receipt Content and Commands
   */
  assertEscPosReceipt(rawBytes, expectedSubstrings = []) {
    assert.ok(rawBytes, 'Receipt bytes must not be null/empty');
    let text = '';
    if (rawBytes instanceof Uint8Array || Buffer.isBuffer(rawBytes)) {
      text = Buffer.from(rawBytes).toString('utf-8');
      assert.ok(
        rawBytes.length >= 4,
        'ESC/POS byte stream too short'
      );
    } else {
      text = String(rawBytes);
    }

    // Normalize all whitespace variants (narrow no-break space \u202F, no-break space \u00A0, etc.)
    const normalizedText = text.replace(/[\u202F\u00A0\r\n\t]/g, ' ');

    for (const sub of expectedSubstrings) {
      const normalizedSub = sub.replace(/[\u202F\u00A0\r\n\t]/g, ' ');
      assert.ok(
        normalizedText.includes(normalizedSub),
        `ESC/POS receipt missing expected string: "${sub}". Receipt content:\n${text}`
      );
    }
  },

  /**
   * Asserts Biometric ISO 19794-2 Template Match
   */
  assertIso19794Match(score, threshold = 85, expectedMatch = true) {
    assert.strictEqual(typeof score, 'number', 'Score must be a number');
    const matched = score >= threshold;
    assert.strictEqual(
      matched,
      expectedMatch,
      `Biometric match expectation failed: score ${score}, threshold ${threshold}, expected ${expectedMatch}`
    );
  }
};

export default CustomAssert;
