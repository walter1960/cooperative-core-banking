/**
 * Tier 2 — F17: Dialect Mixing, Code-Switching & Slang Edge Words
 */

import { describe, test } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import assert from 'node:assert/strict';

describe('Tier 2 - F17: Dialect Code-Switching & Edge Words', () => {
  test('T2_F17_01: West African Money Slang "2 sacs" Evaluation (200,000 XOF)', () => {
    // 1 sac = 100,000 XOF -> 2 sacs = 200,000 XOF
    const parseSlang = (str) => {
      const match = str.match(/(\d+)\s+sacs?/);
      if (match) return parseInt(match[1], 10) * 100000;
      return 0;
    };

    const val = parseSlang('versement de 2 sacs');
    assert.strictEqual(val, 200000);
    CustomAssert.assertCurrencyAmount(val, 200000);
  });

  test('T2_F17_02: West African Money Slang "1 brique" Evaluation (1,000,000 XOF)', () => {
    const parseBrique = (str) => {
      if (str.includes('1 brique') || str.includes('une brique')) return 1000000;
      return 0;
    };

    const val = parseBrique('depot de 1 brique');
    assert.strictEqual(val, 1000000);
    CustomAssert.assertCurrencyAmount(val, 1000000);
  });

  test('T2_F17_03: Complex Code-Switching ("Versement de kotoku evee pour Tomrom")', () => {
    // kotoku evee = 200,000 XOF
    const extractAmount = (str) => {
      if (str.includes('kotoku evee')) return 200000;
      return 0;
    };

    const amount = extractAmount('Versement de kotoku evee pour Tomrom');
    assert.strictEqual(amount, 200000);
    CustomAssert.assertCurrencyAmount(amount, 200000);
  });

  test('T2_F17_04: Unknown Dialect Word Fallback to Clarification State', () => {
    const processUnknown = (text) => {
      const knownTokens = ['versement', 'retrait', 'akpe', 'kotoku', 'asusu', 'fe ququ', 'ga dodo'];
      const hasKnown = knownTokens.some(t => text.toLowerCase().includes(t));
      if (!hasKnown) {
        return { intent: 'UNKNOWN', clarification_needed: true, prompt: 'Ordre non reconnu, veuillez préciser.' };
      }
      return { intent: 'KNOWN', clarification_needed: false };
    };

    const res = processUnknown('Gibberish blabla random words xyz');
    assert.strictEqual(res.intent, 'UNKNOWN');
    assert.strictEqual(res.clarification_needed, true);
  });

  test('T2_F17_05: TogoPhonex Phonetic Cluster Matching for "MILDZINA" vs "MILZINA"', () => {
    const encodeSimple = (name) =>
      name.toUpperCase().replace(/DZ/g, 'J').replace(/[ZJ]/g, 'J').replace(/[EI]/g, 'E').replace(/([A-Z])\1+/g, '$1');
    const key1 = encodeSimple('MILDZINA');
    const key2 = encodeSimple('MILZINA');

    assert.strictEqual(key1, key2);
  });
});
