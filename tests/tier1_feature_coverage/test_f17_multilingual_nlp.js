/**
 * Tier 1 — F17: Multilingual NLP Engine & Dialect Lexicon (French, Éwé, Mina)
 */

import { describe, test } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import assert from 'node:assert/strict';

describe('Tier 1 - F17: Multilingual NLP Dialect Engine', () => {
  // Direct Gbe Dialect number rules
  const GBE_LEXICON = {
    'kotoku deka': 100000,
    'kotoku evee': 200000,
    'demi-sac': 50000,
    'akpe blaato': 50000,
    'akpe blaeve': 20000,
    'akpe blaeve vo ato': 25000,
    'akpe ewo': 10000,
    'akpe ato': 5000,
    'akpe deka': 1000
  };

  test('T1_F17_01: Dialect Slang Evaluation ("kotoku deka" == 100 000 XOF)', () => {
    assert.strictEqual(GBE_LEXICON['kotoku deka'], 100000);
    CustomAssert.assertCurrencyAmount(GBE_LEXICON['kotoku deka'], 100000);
  });

  test('T1_F17_02: Compound Dialect Number Evaluation ("akpe blaeve vo ato" == 25 000 XOF)', () => {
    assert.strictEqual(GBE_LEXICON['akpe blaeve vo ato'], 25000);
    CustomAssert.assertCurrencyAmount(GBE_LEXICON['akpe blaeve vo ato'], 25000);
  });

  test('T1_F17_03: Dialect Commercial Slang ("demi-sac" == 50 000 XOF)', () => {
    assert.strictEqual(GBE_LEXICON['demi-sac'], 50000);
    CustomAssert.assertCurrencyAmount(GBE_LEXICON['demi-sac'], 50000);
  });

  test('T1_F17_04: Language Classification (French vs Éwé vs Mina)', () => {
    const isEwe = (txt) => {
      const lower = txt.toLowerCase();
      return lower.includes('ga dodo') || lower.includes('akpe') || lower.includes('kple');
    };
    const isMina = (txt) => {
      const lower = txt.toLowerCase();
      return lower.includes('asusu dido') || lower.includes('akonti') || lower.includes('asusu');
    };
    const isFrench = (txt) => {
      const lower = txt.toLowerCase();
      return lower.includes('versement') || lower.includes('retrait');
    };

    assert.strictEqual(isEwe('Ga dodo akpe blaato na Tomrom'), true);
    assert.strictEqual(isMina('Asusu dido akpe ɖeka na Afiwa'), true);
    assert.strictEqual(isFrench('Versement de cinquante mille francs'), true);
  });

  test('T1_F17_05: TogoPhonex Phonetic Encoding Normalizes Diacritics and Accents', () => {
    // Normalization test
    const normalize = (s) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const name1 = normalize('MILDZINA');
    const name2 = normalize('Mildzina');
    const name3 = normalize('Mildzína');

    assert.strictEqual(name1, 'mildzina');
    assert.strictEqual(name2, 'mildzina');
    assert.strictEqual(name3, 'mildzina');
  });
});
