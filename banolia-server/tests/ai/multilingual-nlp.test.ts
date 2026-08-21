import {
  detectLanguage,
  encodeTogoPhonex,
  extractAccountTypeFromText,
  extractAmountFromText,
  extractIntentFromText,
  generateLocalizedFeedback,
  normalizeGbeText,
  resolveMemberFromText,
  similarityScore,
  weightedLevenshteinDistance
} from '../../src/ai/multilingual-nlp';
import { SEED_MEMBERS } from '../../src/ai/cashier-parser';

describe('Multilingual NLP Engine & Dialect Lexicon (Éwé, Mina, French)', () => {
  // ==========================================================================
  // 1. Text Normalization & Gbe Diacritics
  // ==========================================================================
  describe('Text Normalization & Diacritic Stripping', () => {
    it('normalizes Éwé and Mina diacritics to standardized ASCII forms', () => {
      expect(normalizeGbeText('Ga ɖeɖe')).toBe('ga dede');
      expect(normalizeGbeText('Ga ɖoɖo')).toBe('ga dodo');
      expect(normalizeGbeText('akɔnta me')).toBe('akonta me');
      expect(normalizeGbeText('blaeve vɔ atɔ̃')).toBe('blaeve vo ato');
      expect(normalizeGbeText('habɔbɔ')).toBe('habobo');
    });
  });

  // ==========================================================================
  // 2. TogoPhonex Phonetic Encoder
  // ==========================================================================
  describe('TogoPhonex Phonetic Encoder', () => {
    it('generates identical phonetic keys for Togolese homophones and day-name variants', () => {
      // Koffi / Kofi / Coffie -> K-F
      expect(encodeTogoPhonex('Koffi')).toBe(encodeTogoPhonex('Kofi'));
      expect(encodeTogoPhonex('Koffi')).toBe(encodeTogoPhonex('Coffie'));

      // Kokou / Koku / Cocou -> K-K
      expect(encodeTogoPhonex('Kokou')).toBe(encodeTogoPhonex('Koku'));
      expect(encodeTogoPhonex('Kokou')).toBe(encodeTogoPhonex('Cocou'));

      // Kodjo / Kojo / Codjo -> K-J
      expect(encodeTogoPhonex('Kodjo')).toBe(encodeTogoPhonex('Kojo'));
      expect(encodeTogoPhonex('Kodjo')).toBe(encodeTogoPhonex('Codjo'));

      // Amouzou / Amuzu -> A-M-S
      expect(encodeTogoPhonex('Amouzou')).toBe(encodeTogoPhonex('Amuzu'));

      // Agbodjan / Abodjan -> A-B-J-N
      expect(encodeTogoPhonex('Agbodjan')).toBe(encodeTogoPhonex('Abodjan'));

      // Mildzina / Milzina -> M-L-J-N
      expect(encodeTogoPhonex('Mildzina')).toBe(encodeTogoPhonex('Milzina'));
    });
  });

  // ==========================================================================
  // 3. Weighted Levenshtein Distance & Fuzzy Matcher
  // ==========================================================================
  describe('Weighted Levenshtein & Entity Resolution', () => {
    it('accurately resolves members under noisy ASR conditions', () => {
      // 1. "Mielzina Tonrom" -> MILDZINA Tomrom (A0200225)
      const res1 = resolveMemberFromText('Versement de 50000 pour Mielzina Tonrom', SEED_MEMBERS);
      expect(res1.member).not.toBeNull();
      expect(res1.member?.code).toBe('A0200225');

      // 2. "Cofi Mensa" -> AGBODJAN Koffi Mensah (A0200226)
      const res2 = resolveMemberFromText('Retrait de 20000 pour Cofi Mensa', SEED_MEMBERS);
      expect(res2.member).not.toBeNull();
      expect(res2.member?.code).toBe('A0200226');

      // 3. "Amouzu Ablawi" -> AMOUZOU Ablavi (A0200227)
      const res3 = resolveMemberFromText('Versement de 25000 pour Amouzu Ablawi', SEED_MEMBERS);
      expect(res3.member).not.toBeNull();
      expect(res3.member?.code).toBe('A0200227');

      // 4. "Abodjan Koku" -> AGBODJAN Koffi Mensah (A0200226)
      const res4 = resolveMemberFromText('Verse 50000 pour Abodjan Koku', SEED_MEMBERS);
      expect(res4.member).not.toBeNull();
      expect(res4.member?.code).toBe('A0200226');

      // 5. Direct Manual Number match "adhérent 610" -> A0200225
      const res5 = resolveMemberFromText('Situation de compte pour adherent 610', SEED_MEMBERS);
      expect(res5.member?.code).toBe('A0200225');
      expect(res5.confidence).toBe(1.0);
    });
  });

  // ==========================================================================
  // 4. West African Number Grammars & Compound Currency Math
  // ==========================================================================
  describe('West African Number Grammars & Slang Evaluation', () => {
    it('evaluates regional French monetary slang correctly', () => {
      // "2 sacs" -> 200,000 XOF
      expect(extractAmountFromText('Pose deux sacs pour Tomrom').amount).toBe(200000);
      // "10 sacs" -> 1,000,000 XOF
      expect(extractAmountFromText('Retrait de dix sacs pour l\'adhérent 611').amount).toBe(1000000);
      // "une brique" -> 1,000,000 XOF
      expect(extractAmountFromText('Versement d\'une brique pour MILDZINA').amount).toBe(1000000);
      // "un demi-sac" -> 50,000 XOF
      expect(extractAmountFromText('Versement d\'un demi-sac pour Ablavi').amount).toBe(50000);
      // "cent sous" -> 500 XOF
      expect(extractAmountFromText('Verse cent sous pour la cotisation').amount).toBe(500);
    });

    it('evaluates Éwé and Mina standard numbers and compound additives with kple / vɔ', () => {
      // "akpe blaeve" -> 20,000 XOF
      expect(extractAmountFromText('Nye di be maɖo akpe blaeve ɖe Tomrom ƒe akɔnta me').amount).toBe(20000);

      // "akpe blaeve vɔ atɔ̃" -> 25,000 XOF
      expect(extractAmountFromText('Do efe ququ akpe blaeve vɔ atɔ̃ na Tomrom').amount).toBe(25000);

      // "akpe blaetɔ̃" -> 30,000 XOF
      expect(extractAmountFromText('Sɔ akpe blaetɔ̃ do Ablavi ƒe akɔnti me').amount).toBe(30000);

      // "akpe wuiatɔ̃" -> 15,000 XOF
      expect(extractAmountFromText('Ɖe akpe wuiatɔ̃ le Koffi ƒe akɔnti me').amount).toBe(15000);

      // "akpe blaatɔ̃" -> 50,000 XOF
      expect(extractAmountFromText('Médi be maqu fe akpe blaatɔ̃ na Kokou').amount).toBe(50000);

      // "kotoku ɖeka" -> 100,000 XOF
      expect(extractAmountFromText('Kotoku ɖeka ɖe akɔnta me').amount).toBe(100000);

      // "kotoku evee kple akpe blaeve" -> (2 * 100,000) + (20 * 1,000) = 220,000 XOF
      expect(extractAmountFromText('Kotoku evee kple akpe blaeve na Tomrom').amount).toBe(220000);

      // "akpe alafa ɖeka kple akpe blaatɔ̃" -> 100,000 + 50,000 = 150,000 XOF
      expect(extractAmountFromText('Akpe alafa ɖeka kple akpe blaatɔ̃ na Ablavi').amount).toBe(150000);

      // "kotoku ewo kple akpe alafa atɔ̃ kple akpe blaatɔ̃" -> 1,000,000 + 500,000 + 50,000 = 1,550,000 XOF
      expect(extractAmountFromText('Kotoku ewo kple akpe alafa atɔ̃ kple akpe blaatɔ̃').amount).toBe(1550000);

      // "miliyɔn ɖeka kple lafa eve" -> 1,000,000 + 200,000 = 1,200,000 XOF
      expect(extractAmountFromText('Miliyɔn ɖeka kple lafa eve').amount).toBe(1200000);
    });

    it('handles speech recognition homophones for numbers', () => {
      // "saint quand mille" -> 50,000 XOF
      expect(extractAmountFromText('Versement de saint quand mille pour Tomrom').amount).toBe(50000);
      // "son mille" -> 100,000 XOF
      expect(extractAmountFromText('Retrait de son mille pour Kokou').amount).toBe(100000);
    });
  });

  // ==========================================================================
  // 5. Operation Intent & Account Extraction
  // ==========================================================================
  describe('Operation Intent & Account Type Classification', () => {
    it('classifies French intents and accounts', () => {
      expect(extractIntentFromText('Versement de 50 000 pour Tomrom sur son épargne')).toBe('CASH_DEPOSIT');
      expect(extractAccountTypeFromText('Versement de 50 000 pour Tomrom sur son épargne')).toBe('SAVINGS');

      expect(extractIntentFromText('Retrait de 10 000 pour Koffi')).toBe('CASH_WITHDRAWAL');
      expect(extractIntentFromText('Remboursement de prêt de 25 000 pour Tomrom')).toBe('LOAN_REPAYMENT');
      expect(extractIntentFromText('Cotisation tontine de 2 000 pour Ablavi')).toBe('TONTINE_COLLECTION');
      expect(extractIntentFromText('Consulte le solde de l\'adhérent 610')).toBe('BALANCE_INQUIRY');
    });

    it('classifies Éwé intents and accounts', () => {
      expect(extractIntentFromText('Nye di be maɖo akpe blaeve ɖe Tomrom ƒe akɔnta me')).toBe('CASH_DEPOSIT');
      expect(extractIntentFromText('Médi be maɖe akpe ewo le nye ga me')).toBe('CASH_WITHDRAWAL');
      expect(extractIntentFromText('Médi be maqu fe akpe blaatɔ̃ na Kokou')).toBe('LOAN_REPAYMENT');
      expect(extractIntentFromText('Tsɔ asusu akpe ɖeka ɖo na Ablavi')).toBe('TONTINE_COLLECTION');
      expect(extractIntentFromText('Ga nénie le nye akɔnta me kpoo?')).toBe('BALANCE_INQUIRY');
    });

    it('classifies Mina intents and accounts', () => {
      expect(extractIntentFromText('Sɔ akpe blaetɔ̃ do Ablavi ƒe akɔnti me')).toBe('CASH_DEPOSIT');
      expect(extractIntentFromText('Ɖe akpe wuiatɔ̃ le Koffi ƒe akɔnti me')).toBe('CASH_WITHDRAWAL');
      expect(extractIntentFromText('Do efe ququ akpe blaeve vɔ atɔ̃ na Tomrom')).toBe('LOAN_REPAYMENT');
      expect(extractIntentFromText('Sɔ asusu gbeɖeka tɔ akpe ɖeka do na Da Ayélé')).toBe('TONTINE_COLLECTION');
      expect(extractIntentFromText('Ga ci le nye akɔnti me?')).toBe('BALANCE_INQUIRY');
    });
  });

  // ==========================================================================
  // 6. Language & Code-Switching Detection
  // ==========================================================================
  describe('Language Detection & Code-Switching', () => {
    it('detects French, Éwé, Mina, and mixed code-switching', () => {
      expect(detectLanguage('Fais un versement de cinquante mille francs pour Tomrom')).toBe('fr-FR');
      expect(detectLanguage('Nye di be maɖo akpe blaeve ɖe Tomrom ƒe akɔnta me')).toBe('ee-TG');
      expect(detectLanguage('Sɔ akpe blaetɔ̃ do Ablavi ƒe akɔnti me')).toBe('gej-TG');
      expect(detectLanguage('Fais un versement de akpe blaeve pour Tomrom')).toBe('mixed');
      expect(detectLanguage('Verse kotoku evee sur l\'épargne de Kokou')).toBe('mixed');
    });
  });

  // ==========================================================================
  // 7. Localized Speech Feedback Generation
  // ==========================================================================
  describe('Localized Speech Feedback', () => {
    it('generates accurate spoken feedback for French, Éwé, and Mina', () => {
      const fbFr = generateLocalizedFeedback('CASH_DEPOSIT', 50000, 'MILDZINA Tomrom', 'fr-FR');
      expect(fbFr.locale).toBe('fr-FR');
      expect(fbFr.text_to_speak).toContain('50\u202F000');
      expect(fbFr.text_to_speak).toContain('MILDZINA Tomrom');

      const fbEe = generateLocalizedFeedback('CASH_DEPOSIT', 20000, 'Tomrom', 'ee-TG');
      expect(fbEe.locale).toBe('ee-TG');
      expect(fbEe.text_to_speak).toContain('Ga dodo');

      const fbGej = generateLocalizedFeedback('CASH_DEPOSIT', 30000, 'Ablavi', 'gej-TG');
      expect(fbGej.locale).toBe('gej-TG');
      expect(fbGej.text_to_speak).toContain('Ga sɔ do');
    });
  });
});
