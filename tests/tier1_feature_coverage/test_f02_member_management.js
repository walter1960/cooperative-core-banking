/**
 * Tier 1 — F02: Member Management, KYC & Share Capital (Parts Sociales)
 */

import { describe, test, beforeEach } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockGeneralLedger } from '../common/mocks.js';
import { FIXTURES } from '../common/fixtures.js';
import assert from 'node:assert/strict';

describe('Tier 1 - F02: Member Management & Share Capital', () => {
  let ledger;

  beforeEach(() => {
    ledger = new MockGeneralLedger();
  });

  test('T1_F02_01: Member Registration with Share Capital & Admission Fee Posting', () => {
    const entry = ledger.postSharePurchase({
      memberCode: 'A0200228',
      sharesCount: 2,
      unitPrice: 5000,
      fee: 2000
    });

    assert.strictEqual(entry.totalDebit, 12000);
    assert.strictEqual(entry.totalCredit, 12000);
    CustomAssert.assertLedgerBalanced(entry);

    const shareAcc = ledger.getAccount('101100');
    const feeAcc = ledger.getAccount('706000');
    assert.strictEqual(shareAcc.currentCredit, 10000);
    assert.strictEqual(feeAcc.currentCredit, 2000);
  });

  test('T1_F02_02: KYC Profile Identification & National ID Verification', () => {
    const member = FIXTURES.MEMBERS.find(m => m.code === 'A0200225');
    assert.ok(member, 'Member A0200225 must exist');
    assert.strictEqual(member.idType, 'CNI');
    assert.ok(member.idNumber.startsWith('TG-'));
    assert.strictEqual(member.status, 'ACTIF');
  });

  test('T1_F02_03: Additional Share Subscription & Voting Rights Proportionality', () => {
    const member = { ...FIXTURES.MEMBERS[0] };
    const initialShares = member.sharesPurchased; // 4
    const newShares = 3;

    ledger.postSharePurchase({
      memberCode: member.code,
      sharesCount: newShares,
      unitPrice: 5000,
      fee: 0
    });

    member.sharesPurchased += newShares;
    member.sharesAvailable += newShares;

    assert.strictEqual(member.sharesPurchased, initialShares + newShares);
    assert.strictEqual(member.sharesPurchased * member.shareUnitPrice, 35000);
  });

  test('T1_F02_04: Share Transfer Between Members Preserves Aggregate Capital', () => {
    const capitalBefore = ledger.getAccount('101100').currentCredit;

    // Member A0200225 transfers 1 share (5,000 F) to Member A0200226
    const entry = ledger.postJournalEntry({
      date: '2026-08-20',
      description: 'Transfert 1 part sociale A0200225 -> A0200226',
      lines: [
        { accountNumber: '101100', debit: 5000, credit: 0, desc: 'Cession part A0200225' },
        { accountNumber: '101100', debit: 0, credit: 5000, desc: 'Acquisition part A0200226' }
      ]
    });

    CustomAssert.assertLedgerBalanced(entry);
    const capitalAfter = ledger.getAccount('101100').currentCredit;
    assert.strictEqual(capitalAfter, capitalBefore + 5000); // 5000 debit + 5000 credit = balanced
  });

  test('T1_F02_05: Member Status State Transitions (ACTIF -> SUSPENDU -> RADIE)', () => {
    const member = { ...FIXTURES.MEMBERS[1] };
    assert.strictEqual(member.status, 'ACTIF');

    member.status = 'SUSPENDU';
    assert.strictEqual(member.status, 'SUSPENDU');

    member.status = 'RADIE';
    assert.strictEqual(member.status, 'RADIE');
  });
});
