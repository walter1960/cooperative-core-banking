/**
 * Multilingual NLP Engine & Dialect Lexicon (French, Éwé, Mina)
 * Including TogoPhonex Phonetic Encoder, Compound Number Evaluator, and Entity Matcher
 */

import {
  AccountType,
  MemberMatch,
  MemberRecord,
  OperationIntent,
  SupportedLocale
} from './types';

// ============================================================================
// 1. DIACRITICS & TEXT NORMALIZATION
// ============================================================================

export function normalizeGbeText(input: string): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip all combining diacritics / tildes first
    .replace(/[ɖɗ]/g, 'd')
    .replace(/[ƒɸ]/g, 'f')
    .replace(/[ʋβ]/g, 'v')
    .replace(/[ŋ]/g, 'n')
    .replace(/[ɔ]/g, 'o')
    .replace(/[ɛ]/g, 'e')
    .replace(/['’`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// 2. TOGOPHONEX PHONETIC ENCODER
// ============================================================================

/**
 * TogoPhonex: Gbe/Togolese specialized phonetic key encoder.
 * Normalizes West African patronyms (MILDZINA, AGBODJAN, AMOUZOU) and day-names (Koffi, Kokou, Ablavi, Kodjo).
 */
export function encodeTogoPhonex(name: string): string {
  if (!name || name.trim().length === 0) return '';
  const tokens = name.trim().split(/\s+/);
  if (tokens.length > 1) {
    return tokens.map(t => encodeTogoPhonexSingle(t)).join('-');
  }
  return encodeTogoPhonexSingle(name);
}

function encodeTogoPhonexSingle(token: string): string {
  let s = normalizeGbeText(token);
  if (!s) return '';

  // Digraph transformations & Gbe sibilants (dz, dj, j, z -> J)
  s = s
    .replace(/kp/g, 'P')
    .replace(/gb/g, 'B')
    .replace(/dj|dz|tch|j|z/gi, 'J')
    .replace(/ny|gn/gi, 'N')
    .replace(/ts|ch/gi, 'S');

  // Vowel & Diphthong normalizations
  s = s
    .replace(/ou|oo|u/gi, 'U')
    .replace(/ei|ai|ay|é|è|ê|e/gi, 'E')
    .replace(/aw|au|o/gi, 'O')
    .replace(/a/gi, 'A')
    .replace(/i|y/gi, 'I');

  // Consonant Degemination & Homophone rules
  s = s
    .replace(/c(?=[EI])/gi, 'S')
    .replace(/c(?=[AOU])/gi, 'K')
    .replace(/c/gi, 'K')
    .replace(/qu|q/gi, 'K')
    .replace(/ph/gi, 'F')
    .replace(/w/gi, 'V');

  // Remove silent 'h' (unless leading)
  const firstH = s.startsWith('h') ? 'H' : '';
  s = s.replace(/h/gi, '');
  if (firstH && !s.startsWith('H')) s = 'H' + s;

  // Degeminate identical letters
  s = s.replace(/([a-zA-Z])\1+/g, '$1');

  // Extract initial and consonant skeletal key
  const initial = s.charAt(0).toUpperCase();
  const consonants = s.replace(/[AEIOU]/gi, '').toUpperCase();
  const rawKey = (initial + consonants).replace(/([A-Z])\1+/g, '$1');

  return rawKey.slice(0, 6).padEnd(2, '0');
}

// ============================================================================
// 3. WEIGHTED LEVENSHTEIN DISTANCE & FUZZY MATCHING
// ============================================================================

export function weightedLevenshteinDistance(s1: string, s2: string): number {
  const a = normalizeGbeText(s1);
  const b = normalizeGbeText(s2);
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const charA = a[i - 1];
      const charB = b[j - 1];

      let substCost = 1.0;
      if (charA === charB) {
        substCost = 0.0;
      } else if (
        (charA === 'k' && charB === 'c') || (charA === 'c' && charB === 'k') ||
        (charA === 'f' && charB === 'v') || (charA === 'v' && charB === 'f') ||
        (charA === 'j' && charB === 'z') || (charA === 'z' && charB === 'j') ||
        (charA === 'd' && charB === 't') || (charA === 't' && charB === 'd') ||
        (charA === 'm' && charB === 'n') || (charA === 'n' && charB === 'm')
      ) {
        substCost = 0.20;
      } else if (
        (charA === 'e' && charB === 'i') || (charA === 'i' && charB === 'e') ||
        (charA === 'o' && charB === 'u') || (charA === 'u' && charB === 'o') ||
        (charA === 'a' && charB === 'e') || (charA === 'e' && charB === 'a')
      ) {
        substCost = 0.35;
      }

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1.0, // deletion
        matrix[i][j - 1] + 1.0, // insertion
        matrix[i - 1][j - 1] + substCost // substitution
      );
    }
  }

  return matrix[a.length][b.length];
}

export function similarityScore(s1: string, s2: string): number {
  const a = normalizeGbeText(s1);
  const b = normalizeGbeText(s2);
  if (a === b) return 1.0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = weightedLevenshteinDistance(a, b);
  return Math.max(0.0, 1.0 - dist / maxLen);
}

export function tokenJaccardSimilarity(s1: string, s2: string): number {
  const set1 = new Set(normalizeGbeText(s1).split(/\s+/).filter(Boolean));
  const set2 = new Set(normalizeGbeText(s2).split(/\s+/).filter(Boolean));
  if (set1.size === 0 && set2.size === 0) return 1.0;
  if (set1.size === 0 || set2.size === 0) return 0.0;

  let intersection = 0;
  for (const token of set1) {
    if (set2.has(token)) intersection++;
  }
  const union = new Set([...set1, ...set2]).size;
  return intersection / union;
}

// ============================================================================
// 4. MEMBER RESOLUTION WITH TOGOPHONEX & FUZZY SEARCH
// ============================================================================

export function resolveMemberFromText(
  text: string,
  members: MemberRecord[]
): { member: MemberRecord | null; confidence: number; candidates: MemberMatch[] } {
  if (!text || members.length === 0) {
    return { member: null, confidence: 0, candidates: [] };
  }

  const normalizedQuery = normalizeGbeText(text);

  // 1. Direct Manual Number / ID exact match
  for (const m of members) {
    if (m.manualNumber && (
      new RegExp(`\\b${m.manualNumber}\\b`).test(normalizedQuery) ||
      normalizedQuery.includes(`adherent ${m.manualNumber}`) ||
      normalizedQuery.includes(`membre ${m.manualNumber}`) ||
      normalizedQuery.includes(`numero ${m.manualNumber}`)
    )) {
      return {
        member: m,
        confidence: 1.0,
        candidates: [{ code: m.code, fullName: m.fullName, manualNumber: m.manualNumber, score: 1.0 }]
      };
    }
    if (m.code && normalizedQuery.includes(m.code.toLowerCase())) {
      return {
        member: m,
        confidence: 1.0,
        candidates: [{ code: m.code, fullName: m.fullName, manualNumber: m.manualNumber, score: 1.0 }]
      };
    }
  }

  // 2. Exact name token match
  for (const m of members) {
    const memberNorm = normalizeGbeText(m.fullName);
    const parts = memberNorm.split(/\s+/);
    for (const part of parts) {
      if (part.length >= 3 && new RegExp(`\\b${part}\\b`).test(normalizedQuery)) {
        return {
          member: m,
          confidence: 0.95,
          candidates: [{ code: m.code, fullName: m.fullName, manualNumber: m.manualNumber, score: 0.95 }]
        };
      }
    }
  }

  // 3. Phonetic TogoPhonex & Weighted Levenshtein Evaluation
  const stopWords = new Set([
    'fais', 'un', 'versement', 'de', 'retrait', 'remboursement', 'pret', 'credit',
    'pour', 'sur', 'son', 'epargne', 'compte', 'adherent', 'membre', 'tontine',
    'cotisation', 'francs', 'xof', 'mille', 'cent', 'cinquante', 'vingt', 'dix',
    'deux', 'trois', 'quatre', 'cinq', 'pose', 'tire', 'da', 'na', 'me', 'fe',
    'akonta', 'akonti', 'nye', 'di', 'be', 'mado', 'made', 'so', 'do'
  ]);

  const queryTokens = normalizedQuery.split(/\s+/).filter(t => t.length >= 3 && !stopWords.has(t) && !/^\d+$/.test(t));
  const scoredCandidates: MemberMatch[] = [];

  for (const m of members) {
    const memberTokens = normalizeGbeText(m.fullName).split(/\s+/);
    let bestScore = 0;

    for (const qTok of queryTokens) {
      const qPhone = encodeTogoPhonex(qTok);
      for (const mTok of memberTokens) {
        const mPhone = encodeTogoPhonex(mTok);
        let phoneBonus = 0;
        if (qPhone && mPhone && qPhone === mPhone) {
          phoneBonus = 0.40;
        }

        const levScore = similarityScore(qTok, mTok);
        const combined = Math.min(1.0, levScore * 0.6 + phoneBonus);
        if (combined > bestScore) {
          bestScore = combined;
        }
      }
    }

    const fullLev = similarityScore(normalizedQuery, m.fullName);
    const finalScore = Math.max(bestScore, fullLev);

    if (finalScore >= 0.45) {
      scoredCandidates.push({
        code: m.code,
        fullName: m.fullName,
        manualNumber: m.manualNumber,
        score: Math.round(finalScore * 100) / 100
      });
    }
  }

  scoredCandidates.sort((a, b) => b.score - a.score);

  if (scoredCandidates.length > 0 && scoredCandidates[0].score >= 0.50) {
    const topCandidate = members.find(m => m.code === scoredCandidates[0].code) || null;
    return {
      member: topCandidate,
      confidence: scoredCandidates[0].score,
      candidates: scoredCandidates
    };
  }

  return { member: null, confidence: 0, candidates: scoredCandidates };
}

// ============================================================================
// 5. WEST AFRICAN NUMBER GRAMMAR & COMPOUND EVALUATOR
// ============================================================================

const GBE_DIGIT_MAP: Record<string, number> = {
  'deka': 1, 'doka': 1, 'un': 1, 'une': 1,
  'eve': 2, 'evee': 2, 'deux': 2,
  'eto': 3, 'trois': 3,
  'ene': 4, 'quatre': 4,
  'ato': 5, 'cinq': 5,
  'ade': 6, 'six': 6,
  'adre': 7, 'sept': 7,
  'enyi': 8, 'huit': 8,
  'asieke': 9, 'enyidie': 9, 'nyieke': 9, 'neuf': 9,
  'ewo': 10, 'dix': 10
};

const GBE_TEENS_MAP: Record<string, number> = {
  'wuideka': 11, 'wuidoka': 11, 'onze': 11,
  'wuieve': 12, 'douze': 12,
  'wuieto': 13, 'treize': 13,
  'wuiene': 14, 'quatorze': 14,
  'wuiato': 15, 'quinze': 15,
  'wuiade': 16, 'seize': 16,
  'wuiadre': 17, 'dix-sept': 17, 'dix sept': 17,
  'wuienyi': 18, 'dix-huit': 18, 'dix huit': 18,
  'wuiasieke': 19, 'wui-enyidie': 19, 'dix-neuf': 19, 'dix neuf': 19
};

const GBE_TENS_MAP: Record<string, number> = {
  'blaeve': 20, 'vingt': 20,
  'blaeto': 30, 'trente': 30,
  'blaene': 40, 'quarante': 40,
  'blaato': 50, 'cinquante': 50,
  'blaade': 60, 'soixante': 60,
  'blaadre': 70, 'soixante-dix': 70, 'soixante dix': 70,
  'blaenyi': 80, 'quatre-vingts': 80, 'quatre-vingt': 80, 'quatre vingt': 80,
  'bla-asieke': 90, 'blanyieke': 90, 'quatre-vingt-dix': 90, 'quatre vingt dix': 90
};

function parseBasicNumberPhrase(phrase: string): number {
  const p = normalizeGbeText(phrase);
  if (!p) return 0;

  const directNum = parseInt(p.replace(/\s+/g, ''), 10);
  if (!isNaN(directNum)) return directNum;

  if (GBE_TEENS_MAP[p] !== undefined) return GBE_TEENS_MAP[p];
  if (GBE_TENS_MAP[p] !== undefined) return GBE_TENS_MAP[p];
  if (GBE_DIGIT_MAP[p] !== undefined) return GBE_DIGIT_MAP[p];

  const voParts = p.split(/\s+vo\s+|\s+et\s+/);
  if (voParts.length === 2) {
    const tens = GBE_TENS_MAP[voParts[0].trim()];
    const units = GBE_DIGIT_MAP[voParts[1].trim()];
    if (tens !== undefined && units !== undefined) {
      return tens + units;
    }
  }

  return 0;
}

export function extractAmountFromText(text: string): {
  amount: number | null;
  spoken_words: string | null;
  confidence: number;
} {
  if (!text) return { amount: null, spoken_words: null, confidence: 0 };

  let normalized = normalizeGbeText(text);

  // 0. Homophone Normalization for noisy speech recognition
  normalized = normalized
    .replace(/\bsaint\s*quand\s*mille\b/g, 'cinquante mille')
    .replace(/\bsaint\s*quand\b/g, 'cinquante')
    .replace(/\bson\s*mille\b/g, 'cent mille')
    .replace(/\bsomme\s*mille\b/g, 'cent mille')
    .replace(/\bk\b(?=\s*francs?|\s*xof|\s*$)/g, '000');

  // 1. Check for standard French Slang (sacs, briques, bâtons, sous)
  if (/\b(demi[-\s]?sac|kotoku\s*afa)\b/.test(normalized)) {
    return { amount: 50000, spoken_words: 'demi-sac', confidence: 0.95 };
  }

  const sacMatch = normalized.match(/(\d+|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|deka|doka|eve|evee|eto|ene|ato)\s*(?:sacs?|kotoku)\b/);
  if (sacMatch && !normalized.includes('kple')) {
    const qtyStr = sacMatch[1];
    const qty = parseInt(qtyStr, 10) || GBE_DIGIT_MAP[qtyStr] || 1;
    return { amount: qty * 100000, spoken_words: sacMatch[0], confidence: 0.95 };
  }

  const briqueMatch = normalized.match(/(\d+|un|une|deux|trois|quatre|cinq)\s*(?:briques?|batons?)\b/);
  if (briqueMatch) {
    const qtyStr = briqueMatch[1];
    const qty = parseInt(qtyStr, 10) || GBE_DIGIT_MAP[qtyStr] || 1;
    return { amount: qty * 1000000, spoken_words: briqueMatch[0], confidence: 0.95 };
  }

  const sousMatch = normalized.match(/(\d+|un|une|deux|trois|cinq|dix|vingt|cinquante|cent)\s*(?:sous)\b/);
  if (sousMatch) {
    let qty = parseInt(sousMatch[1], 10);
    if (isNaN(qty)) {
      if (sousMatch[1] === 'cent') qty = 100;
      else if (sousMatch[1] === 'cinquante') qty = 50;
      else if (sousMatch[1] === 'vingt') qty = 20;
      else if (sousMatch[1] === 'dix') qty = 10;
      else if (sousMatch[1] === 'cinq') qty = 5;
      else if (sousMatch[1] === 'un' || sousMatch[1] === 'une') qty = 1;
      else qty = 1;
    }
    return { amount: qty * 5, spoken_words: sousMatch[0], confidence: 0.90 };
  }

  // 2. Check for Compound Gbe/French connector ('kple', 'kpe', 'kpo')
  if (normalized.includes('kple') || normalized.includes(' kpe ') || normalized.includes(' kpo ')) {
    const compoundParts = normalized.split(/\s+kple\s+|\s+kpe\s+|\s+kpo\s+/);
    let totalCompound = 0;
    let validCompound = false;

    for (const part of compoundParts) {
      const sub = extractAmountFromText(part);
      if (sub.amount !== null && sub.amount > 0) {
        totalCompound += sub.amount;
        validCompound = true;
      }
    }

    if (validCompound && totalCompound > 0) {
      return { amount: totalCompound, spoken_words: text, confidence: 0.95 };
    }
  }

  // 3. Denominations: Millions, Kotoku, Akpe Alafa, Akpe
  const milMatch = normalized.match(/(?:miliyon|million)\s*(deka|doka|un|une|eve|eto|ene|ato|\d+)?/);
  if (milMatch && !normalized.includes('kotoku')) {
    const multStr = milMatch[1] || 'deka';
    const mult = parseInt(multStr, 10) || GBE_DIGIT_MAP[multStr] || 1;
    return { amount: mult * 1000000, spoken_words: milMatch[0], confidence: 0.95 };
  }

  const kotokuMatch = normalized.match(/(?:kotoku|sac)\s*(deka|doka|un|une|eve|evee|deux|eto|trois|ene|quatre|ato|cinq|ade|six|adre|sept|enyi|huit|asieke|neuf|ewo|dix|\d+)?/);
  if (kotokuMatch) {
    const multStr = kotokuMatch[1] || 'deka';
    const mult = parseInt(multStr, 10) || GBE_DIGIT_MAP[multStr] || 1;
    return { amount: mult * 100000, spoken_words: kotokuMatch[0], confidence: 0.95 };
  }

  const akpeAlafaMatch = normalized.match(/akpe\s+(?:alafa|lafa)\s*(deka|doka|un|une|eve|evee|deux|eto|trois|ene|quatre|ato|cinq|\d+)?/);
  if (akpeAlafaMatch) {
    const multStr = akpeAlafaMatch[1] || 'deka';
    const mult = parseInt(multStr, 10) || GBE_DIGIT_MAP[multStr] || 1;
    return { amount: mult * 100000, spoken_words: akpeAlafaMatch[0], confidence: 0.95 };
  }

  const alafaMatch = normalized.match(/(?:alafa|lafa)\s*(deka|doka|un|une|eve|evee|deux|eto|trois|ene|quatre|ato|cinq|\d+)?/);
  if (alafaMatch) {
    const multStr = alafaMatch[1] || 'deka';
    const mult = parseInt(multStr, 10) || GBE_DIGIT_MAP[multStr] || 1;
    return { amount: mult * 100000, spoken_words: alafaMatch[0], confidence: 0.90 };
  }

  // "akpe [number phrase]" (e.g. "akpe blaeve vo ato", "akpe blaeve", "akpe blaeto", "akpe deka", "akpe ewo")
  const akpeMatch = normalized.match(/akpe\s+((?:blaeve|blaeto|blaene|blaato|blaade|blaadre|blaenyi|bla-asieke|blanyieke|wui[a-z]+|deka|doka|eve|evee|eto|ene|ato|ade|adre|enyi|asieke|ewo|\d+)(?:\s+vo\s+[a-z]+)?)/);
  if (akpeMatch) {
    const afterAkpe = akpeMatch[1].trim();
    const subVal = parseBasicNumberPhrase(afterAkpe);
    if (subVal > 0) {
      return { amount: subVal * 1000, spoken_words: `akpe ${afterAkpe}`, confidence: 0.95 };
    }
  }

  // 4. Standard French written numbers & digit combos
  const frThousandsMap: Record<string, number> = {
    'cinq cent': 500000, '500': 500000,
    'deux cent': 200000, '200': 200000,
    'cent': 100000, '100': 100000,
    'soixante-dix': 70000, 'soixante dix': 70000,
    'soixante': 60000,
    'cinquante': 50000, '50': 50000,
    'quarante': 40000, '40': 40000,
    'trente': 30000, '30': 30000,
    'vingt-cinq': 25000, 'vingt cinq': 25000, '25': 25000,
    'vingt': 20000, '20': 20000,
    'quinze': 15000, '15': 15000,
    'dix': 10000, '10': 10000,
    'cinq': 5000, '5': 5000,
    'deux': 2000, '2': 2000,
    'un': 1000, '1': 1000
  };

  for (const [key, val] of Object.entries(frThousandsMap)) {
    const pattern = new RegExp(`\\b${key}\\s+mille(?:\\s+francs?|\\s+xof)?\\b`, 'i');
    if (pattern.test(normalized)) {
      return { amount: val, spoken_words: `${key} mille`, confidence: 0.95 };
    }
  }

  // Raw digits
  const digitRegex = /\b(\d{1,3}(?:[\s,.]\d{3})+|\d{3,8})\b/g;
  let match: RegExpExecArray | null;
  let bestDigitAmount: number | null = null;

  while ((match = digitRegex.exec(normalized)) !== null) {
    const rawVal = parseInt(match[1].replace(/[\s,.]/g, ''), 10);
    if (rawVal >= 500 && rawVal !== 610 && rawVal !== 611 && rawVal !== 612 && rawVal !== 613) {
      bestDigitAmount = rawVal;
      break;
    }
  }

  if (bestDigitAmount !== null) {
    return { amount: bestDigitAmount, spoken_words: bestDigitAmount.toString(), confidence: 0.95 };
  }

  return { amount: null, spoken_words: null, confidence: 0 };
}

// ============================================================================
// 6. OPERATION INTENT & ACCOUNT CLASSIFICATION
// ============================================================================

export function extractIntentFromText(text: string): OperationIntent {
  if (!text) return 'UNKNOWN';
  const normalized = normalizeGbeText(text);

  // 1. Balance Inquiry
  if (
    /\b(solde|situation|combien|fiche|consulte|consulter)\b/.test(normalized) ||
    /\b(ga\s*nenie\s*le|nenie\s*le|ga\s*susoe|akonta\s*me\s*ga|ga\s*ci\s*le)\b/.test(normalized)
  ) {
    return 'BALANCE_INQUIRY';
  }

  // 2. Loan Repayment
  if (
    /\b(remboursement|rembourser|traite|mensualite|mensualité)\b/.test(normalized) &&
    !/\b(versement|retrait)\b/.test(normalized)
  ) {
    return 'LOAN_REPAYMENT';
  }
  if (/\b(fe\s*ququ|fe\s*dudu|fe\s*dede|efe\s*ququ|efe\s*dodo|maqu\s*fe|kredi\s*ququ)\b/.test(normalized)) {
    return 'LOAN_REPAYMENT';
  }

  // 3. Tontine Collection
  if (
    /\b(tontine|mise|cotisation|cotiser)\b/.test(normalized) ||
    /\b(asusu|gbesiagbe\s*asusu|gbedeka\s*asusu|asusu\s*dodo|asusu\s*dido)\b/.test(normalized)
  ) {
    return 'TONTINE_COLLECTION';
  }

  // 4. Cash Deposit
  if (
    /\b(versement|verse|verser|depot|dépôt|deposer|déposer|pose|poser|mettre|ajoute)\b/.test(normalized) ||
    /\b(ga\s*dodo|ga\s*dido|so\s*akpe|so\s*do|mado|tsɔ\s*ga\s*ɖo|tso\s*ga\s*do)\b/.test(normalized) ||
    /\bso\s+[a-z0-9\s]+\s+do\b/.test(normalized)
  ) {
    return 'CASH_DEPOSIT';
  }

  // 5. Cash Withdrawal
  if (
    /\b(retrait|retirer|tire|tirer|sortir|bouffer|prendre)\b/.test(normalized) ||
    /\b(ga\s*dede|ga\s*titi|ti\s*ga|made|ga\s*yiyi)\b/.test(normalized) ||
    /\bde\s+akpe\b/.test(normalized)
  ) {
    return 'CASH_WITHDRAWAL';
  }

  // 6. Share Subscription
  if (/\b(parts?\s*sociales?|habobo\s*ga|gomekpokpo\s*ga|hennu\s*ga)\b/.test(normalized)) {
    return 'SHARE_SUBSCRIPTION';
  }

  return 'UNKNOWN';
}

export function extractAccountTypeFromText(text: string): AccountType {
  if (!text) return 'DEFAULT';
  const normalized = normalizeGbeText(text);

  if (/\b(tontine|asusu)\b/.test(normalized)) return 'TONTINE';
  if (/\b(pret|credit|traite|fe|efe)\b/.test(normalized)) return 'LOAN';
  if (/\b(parts?\s*sociales?|capital|habobo|hennu)\b/.test(normalized)) return 'SHARES';
  if (/\b(projet|project)\b/.test(normalized)) return 'PROJECT_PLAN';
  if (/\b(carriere|career)\b/.test(normalized)) return 'CAREER_PLAN';
  if (/\b(epargne|compte\s*vue|courant|akonta|akonti|dzodzoe)\b/.test(normalized)) return 'SAVINGS';

  return 'DEFAULT';
}

export function detectLanguage(text: string): 'fr-FR' | 'ee-TG' | 'gej-TG' | 'mixed' {
  if (!text) return 'fr-FR';
  const norm = normalizeGbeText(text);

  const eweMarkers = ['medi', 'nye', 'mado', 'made', 'akpe', 'blaeve', 'kotoku', 'kple', 'akonta', 'nenie', 'ququ', 'dudu'];
  const minaMarkers = ['akonti', 'dido', 'titi', 'so', 'gbedeka', 'ci', 'efe', 'blaeto', 'wuiato'];
  const frenchMarkers = ['versement', 'retrait', 'remboursement', 'compte', 'pour', 'mille', 'francs', 'cotisation', 'solde', 'fais', 'verse', 'pose', 'tire'];

  let eweCount = 0;
  let minaCount = 0;
  let frenchCount = 0;

  for (const w of eweMarkers) {
    if (new RegExp(`\\b${w}\\b`).test(norm)) eweCount++;
  }
  for (const w of minaMarkers) {
    if (new RegExp(`\\b${w}\\b`).test(norm)) minaCount++;
  }
  for (const w of frenchMarkers) {
    if (new RegExp(`\\b${w}\\b`).test(norm)) frenchCount++;
  }

  if (frenchCount > 0 && (eweCount > 0 || minaCount > 0)) {
    return 'mixed';
  }
  if (minaCount > 0 && (minaCount >= eweCount || norm.includes('akonti') || norm.includes('gbedeka') || norm.includes('so '))) {
    return 'gej-TG';
  }
  if (eweCount > 0) {
    return 'ee-TG';
  }
  return 'fr-FR';
}

// ============================================================================
// 7. LOCALIZED SPEECH FEEDBACK GENERATOR
// ============================================================================

export function generateLocalizedFeedback(
  intent: OperationIntent,
  amount: number | null,
  memberName: string | null,
  locale: SupportedLocale
): { locale: 'fr-FR' | 'ee-TG' | 'gej-TG'; text_to_speak: string } {
  const targetLocale: 'fr-FR' | 'ee-TG' | 'gej-TG' =
    locale === 'ee-TG' ? 'ee-TG' : locale === 'gej-TG' ? 'gej-TG' : 'fr-FR';

  const formattedAmount = amount !== null ? amount.toLocaleString('fr-FR') : '0';
  const name = memberName || 'le sociétaire';

  if (targetLocale === 'ee-TG') {
    switch (intent) {
      case 'CASH_DEPOSIT':
        return { locale: 'ee-TG', text_to_speak: `Ga dodo akpe ${formattedAmount} F.CFA ɖe ${name} ƒe akɔnta me le dzadzraɖo.` };
      case 'CASH_WITHDRAWAL':
        return { locale: 'ee-TG', text_to_speak: `Ga ɖeɖe akpe ${formattedAmount} F.CFA le ${name} ƒe akɔnta me le dzadzraɖo.` };
      case 'LOAN_REPAYMENT':
        return { locale: 'ee-TG', text_to_speak: `Fe ququ akpe ${formattedAmount} F.CFA na ${name} le dzadzraɖo.` };
      case 'TONTINE_COLLECTION':
        return { locale: 'ee-TG', text_to_speak: `Asusu dodo akpe ${formattedAmount} F.CFA na ${name} le dzadzraɖo.` };
      case 'BALANCE_INQUIRY':
        return { locale: 'ee-TG', text_to_speak: `Kpɔ ga si le ${name} ƒe akɔnta me.` };
      default:
        return { locale: 'ee-TG', text_to_speak: `Me se gɔme nyuie o. Gblɔe ake.` };
    }
  }

  if (targetLocale === 'gej-TG') {
    switch (intent) {
      case 'CASH_DEPOSIT':
        return { locale: 'gej-TG', text_to_speak: `Ga sɔ do ${formattedAmount} F.CFA na ${name} le akɔnti me.` };
      case 'CASH_WITHDRAWAL':
        return { locale: 'gej-TG', text_to_speak: `Ga ɖeɖe ${formattedAmount} F.CFA le ${name} ƒe akɔnti me.` };
      case 'LOAN_REPAYMENT':
        return { locale: 'gej-TG', text_to_speak: `Efe ququ ${formattedAmount} F.CFA na ${name}.` };
      case 'TONTINE_COLLECTION':
        return { locale: 'gej-TG', text_to_speak: `Asusu dido ${formattedAmount} F.CFA na ${name}.` };
      case 'BALANCE_INQUIRY':
        return { locale: 'gej-TG', text_to_speak: `Kpɔ solde le ${name} ƒe akɔnti me.` };
      default:
        return { locale: 'gej-TG', text_to_speak: `Nye mu se gɔme nyuie o. Gblɔe kpoo.` };
    }
  }

  // Default French
  switch (intent) {
    case 'CASH_DEPOSIT':
      return { locale: 'fr-FR', text_to_speak: `Versement de ${formattedAmount} francs CFA préparé pour ${name}.` };
    case 'CASH_WITHDRAWAL':
      return { locale: 'fr-FR', text_to_speak: `Retrait de ${formattedAmount} francs CFA préparé pour ${name}.` };
    case 'LOAN_REPAYMENT':
      return { locale: 'fr-FR', text_to_speak: `Remboursement de prêt de ${formattedAmount} francs CFA préparé pour ${name}.` };
    case 'TONTINE_COLLECTION':
      return { locale: 'fr-FR', text_to_speak: `Cotisation tontine de ${formattedAmount} francs CFA enregistrée pour ${name}.` };
    case 'BALANCE_INQUIRY':
      return { locale: 'fr-FR', text_to_speak: `Consultation de la situation des comptes de ${name}.` };
    default:
      return { locale: 'fr-FR', text_to_speak: `Je n'ai pas bien compris votre ordre de caisse. Veuillez répéter.` };
  }
}
