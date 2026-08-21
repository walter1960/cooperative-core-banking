const {
  normalizeGbeText,
  encodeTogoPhonex,
  weightedLevenshteinDistance,
  similarityScore,
  resolveMemberFromText,
  extractAmountFromText,
  extractIntentFromText,
  extractAccountTypeFromText,
  detectLanguage,
  generateLocalizedFeedback
} = require('/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/banolia-server/dist/ai/multilingual-nlp');

const {
  createDefaultSnapshot,
  calculateLiquidityRatio,
  calculatePAR30,
  calculatePAR90,
  calculateOSS,
  calculateCAR,
  parseFinancialQueryIntent,
  processFinancialQuery
} = require('/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/banolia-server/dist/ai/financial-analyzer');

const { CashierParserService, SEED_MEMBERS } = require('/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/banolia-server/dist/ai/cashier-parser');
const request = require('/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/banolia-server/node_modules/supertest');
const { app } = require('/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/banolia-server/dist/app');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureDetails = [];

function assert(condition, testName, detail) {
  totalTests++;
  if (condition) {
    passedTests++;
  } else {
    failedTests++;
    failureDetails.push(`FAIL: ${testName} - ${detail || 'Condition false'}`);
    console.error(`❌ FAIL: ${testName} - ${detail || ''}`);
  }
}

async function runAdversarialAudit() {
  console.log('================================================================');
  console.log('STARTING FORENSIC ADVERSARIAL STRESS AUDIT FOR MILESTONE 4');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // SECTION 1: Gbe Text Normalization & TogoPhonex Phonetic Encoder Stress Test
  // --------------------------------------------------------------------------
  console.log('>>> [1/7] Stress Testing Gbe Normalization & TogoPhonex...');
  
  assert(normalizeGbeText('') === '', 'Normalize empty string');
  assert(normalizeGbeText('   ') === '', 'Normalize whitespace only');
  // African D (U+0189 / U+0256) & Gbe glyphs
  assert(normalizeGbeText('Ɖe Ɖoɖo Ƒe Ʋi Ŋu Ɔsɔ Ɛkpe') === 'de dodo fe vi nu oso ekpe', 'Complex African Gbe unicode diacritics');
  
  const phonexKoffi = encodeTogoPhonex('Koffi');
  const phonexKofi = encodeTogoPhonex('Kofi');
  const phonexCoffie = encodeTogoPhonex('Coffie');
  assert(phonexKoffi === phonexKofi && phonexKofi === phonexCoffie, 'TogoPhonex Koffi/Kofi/Coffie equivalence', `Got: ${phonexKoffi}, ${phonexKofi}, ${phonexCoffie}`);

  const phonexKokou = encodeTogoPhonex('Kokou');
  const phonexCocou = encodeTogoPhonex('Cocou');
  assert(phonexKokou === phonexCocou, 'TogoPhonex Kokou/Cocou equivalence', `Got: ${phonexKokou}, ${phonexCocou}`);

  const phonexAgbodjan = encodeTogoPhonex('Agbodjan');
  const phonexAbodjan = encodeTogoPhonex('Abodjan');
  assert(phonexAgbodjan === phonexAbodjan, 'TogoPhonex Agbodjan/Abodjan equivalence', `Got: ${phonexAgbodjan}, ${phonexAbodjan}`);

  const phonexMildzina = encodeTogoPhonex('Mildzina');
  const phonexMilzina = encodeTogoPhonex('Milzina');
  assert(phonexMildzina === phonexMilzina, 'TogoPhonex Mildzina/Milzina equivalence', `Got: ${phonexMildzina}, ${phonexMilzina}`);

  const phonexEmpty = encodeTogoPhonex('');
  assert(phonexEmpty === '', 'TogoPhonex empty input');

  // --------------------------------------------------------------------------
  // SECTION 2: Weighted Levenshtein & Entity Resolution
  // --------------------------------------------------------------------------
  console.log('>>> [2/7] Stress Testing Weighted Levenshtein & Entity Resolution...');

  assert(weightedLevenshteinDistance('', '') === 0, 'Levenshtein distance between empty strings is 0');
  assert(weightedLevenshteinDistance('koffi', 'koffi') === 0, 'Levenshtein distance between identical strings is 0');
  
  const distKC = weightedLevenshteinDistance('k', 'c');
  const distKX = weightedLevenshteinDistance('k', 'x');
  assert(distKC < distKX, 'Levenshtein phonetic cost weighting k/c vs k/x', `distKC=${distKC}, distKX=${distKX}`);

  const customMembers = [
    {
      code: 'M_TEST_001',
      manualNumber: '999',
      fullName: 'KOUASSI Mensah Dossou',
      phone: '99001122',
      accounts: [{ accountNumber: 'ACC99901', productName: 'EPARGNE', type: 'SAVINGS', balance: 100000 }]
    },
    {
      code: 'M_TEST_002',
      manualNumber: '888',
      fullName: 'KPONGBE Akossiwa Jeanne',
      phone: '99003344',
      accounts: [{ accountNumber: 'ACC88801', productName: 'TONTINE', type: 'TONTINE', balance: 50000 }]
    }
  ];

  const match1 = resolveMemberFromText('Versement pour numero 999', customMembers);
  assert(match1.member && match1.member.code === 'M_TEST_001', 'Resolution by manual number in phrase');

  const match2 = resolveMemberFromText('Versement pour adherent 888', customMembers);
  assert(match2.member && match2.member.code === 'M_TEST_002', 'Resolution by manual number adherent prefix');

  const match3 = resolveMemberFromText('Versement pour Couassi Mensa', customMembers);
  assert(match3.member && match3.member.code === 'M_TEST_001', 'Resolution under heavy phonetic variation "Couassi Mensa"');

  const match4 = resolveMemberFromText('Cotisation pour Akosiwa Jeanne', customMembers);
  assert(match4.member && match4.member.code === 'M_TEST_002', 'Resolution under phonetic variation "Akosiwa Jeanne"');

  const matchNone = resolveMemberFromText('Versement pour un inconnu complet sans lien', customMembers);
  assert(matchNone.member === null, 'Resolution for completely unrelated query returns null');

  // --------------------------------------------------------------------------
  // SECTION 3: Complex West African Compound Currency Math
  // --------------------------------------------------------------------------
  console.log('>>> [3/7] Stress Testing Number Grammars & Compound Math...');

  assert(extractAmountFromText('Pose 3 sacs').amount === 300000, 'Slang: 3 sacs = 300,000');
  assert(extractAmountFromText('Retrait de 2 briques').amount === 2000000, 'Slang: 2 briques = 2,000,000');
  assert(extractAmountFromText('Donne 20 sous').amount === 100, 'Slang: 20 sous = 100');
  assert(extractAmountFromText('Versement demi-sac').amount === 50000, 'Slang: demi-sac = 50,000');

  const comp1 = extractAmountFromText('Kotoku ato kple akpe blaadre vo ade na Tomrom');
  assert(comp1.amount === 576000, 'Novel Compound: 5 sacs + 76 mille = 576,000', `Got ${comp1.amount}`);

  const comp2 = extractAmountFromText('Miliyon eve kple kotoku eto na Ablavi');
  assert(comp2.amount === 2300000, 'Novel Compound: 2 millions + 3 sacs = 2,300,000', `Got ${comp2.amount}`);

  const comp3 = extractAmountFromText('Nye di be maɖo akpe blaato vo asieke');
  assert(comp3.amount === 59000, 'Standard Gbe: 59 mille = 59,000', `Got ${comp3.amount}`);

  assert(extractAmountFromText('Versement de 750000 XOF').amount === 750000, 'Raw digits: 750000');
  assert(extractAmountFromText('Retrait de 1 500 000 francs').amount === 1500000, 'Spaced digits: 1 500 000');

  assert(extractAmountFromText('Versement de saint quand mille').amount === 50000, 'ASR homophone saint quand mille = 50,000');
  assert(extractAmountFromText('Retrait de son mille').amount === 100000, 'ASR homophone son mille = 100,000');

  // --------------------------------------------------------------------------
  // SECTION 4: Intent & Dialect Classification
  // --------------------------------------------------------------------------
  console.log('>>> [4/7] Stress Testing Intent, Language & Account Extraction...');

  assert(extractIntentFromText('Versement sur compte epargne') === 'CASH_DEPOSIT', 'French deposit intent');
  assert(extractIntentFromText('Je veux retirer de l argent') === 'CASH_WITHDRAWAL', 'French withdrawal intent');
  assert(extractIntentFromText('Remboursement traite credit') === 'LOAN_REPAYMENT', 'French loan repayment intent');
  assert(extractIntentFromText('Cotisation tontine quotidienne') === 'TONTINE_COLLECTION', 'French tontine intent');
  assert(extractIntentFromText('Quel est mon solde actuel ?') === 'BALANCE_INQUIRY', 'French balance query intent');
  assert(extractIntentFromText('Souscription parts sociales') === 'SHARE_SUBSCRIPTION', 'French shares intent');
  assert(extractIntentFromText('Bonjour il fait beau aujourd hui') === 'UNKNOWN', 'Unrelated text intent is UNKNOWN');

  assert(extractIntentFromText('Ga dodo de akonta me') === 'CASH_DEPOSIT', 'Éwé deposit intent');
  assert(extractIntentFromText('Ga dede le akonta me') === 'CASH_WITHDRAWAL', 'Éwé withdrawal intent');
  assert(extractIntentFromText('Fe ququ na societaire') === 'LOAN_REPAYMENT', 'Éwé loan repayment intent');
  assert(extractIntentFromText('Asusu dodo gbesiagbe') === 'TONTINE_COLLECTION', 'Éwé tontine intent');
  assert(extractIntentFromText('Ga nenie le nye akonta me') === 'BALANCE_INQUIRY', 'Éwé balance query intent');

  assert(extractAccountTypeFromText('sur mon asusu') === 'TONTINE', 'Account type: TONTINE');
  assert(extractAccountTypeFromText('sur mon credit') === 'LOAN', 'Account type: LOAN');
  assert(extractAccountTypeFromText('sur mon epargne') === 'SAVINGS', 'Account type: SAVINGS');
  assert(extractAccountTypeFromText('sur mon projet plan') === 'PROJECT_PLAN', 'Account type: PROJECT_PLAN');

  assert(detectLanguage('Bonjour monsieur le caissier') === 'fr-FR', 'Language detection: French');
  assert(detectLanguage('Nye di be maɖo akpe blaeve') === 'ee-TG', 'Language detection: Éwé');
  assert(detectLanguage('Sɔ akpe blaetɔ̃ do Ablavi akɔnti me') === 'gej-TG', 'Language detection: Mina');
  assert(detectLanguage('Fais un versement de akpe blaeve') === 'mixed', 'Language detection: Mixed code-switching');

  // --------------------------------------------------------------------------
  // SECTION 5: Deterministic Financial Ratio Calculations (Mathematical Edge Cases)
  // --------------------------------------------------------------------------
  console.log('>>> [5/7] Stress Testing BCEAO SFD Financial Ratio Engine...');

  const testSnap = createDefaultSnapshot({
    liquid_assets: 123456789,
    short_term_liabilities: 98765432,
    gross_loan_portfolio: 500000000,
    loans_overdue_30_days: 12500000,
    loans_overdue_90_days: 5000000,
    financial_operating_revenue: 100000000,
    financial_operating_expenses: 70000000,
    loan_loss_provisions_expense: 10000000,
    tier1_net_capital: 80000000,
    total_risk_weighted_assets: 400000000
  });

  const rLiq = calculateLiquidityRatio(testSnap);
  const expectedRLiq = Math.round((123456789 / 98765432) * 10000) / 100;
  assert(rLiq.value_pct === expectedRLiq, `R_LIQ math exactness: expected ${expectedRLiq}, got ${rLiq.value_pct}`);
  assert(rLiq.status === 'COMPLIANT', 'R_LIQ status is COMPLIANT');

  const par30 = calculatePAR30(testSnap);
  assert(par30.value_pct === 2.5, `PAR_30 math: expected 2.50%, got ${par30.value_pct}`);
  assert(par30.status === 'COMPLIANT', 'PAR_30 status is COMPLIANT');

  const par90 = calculatePAR90(testSnap);
  assert(par90.value_pct === 1.0, `PAR_90 math: expected 1.00%, got ${par90.value_pct}`);
  assert(par90.status === 'COMPLIANT', 'PAR_90 status is COMPLIANT');

  const oss = calculateOSS(testSnap);
  assert(oss.value_pct === 125.0, `OSS math: expected 125.00%, got ${oss.value_pct}`);
  assert(oss.status === 'COMPLIANT', 'OSS status is COMPLIANT');

  const car = calculateCAR(testSnap);
  assert(car.value_pct === 20.0, `CAR math: expected 20.00%, got ${car.value_pct}`);
  assert(car.status === 'COMPLIANT', 'CAR status is COMPLIANT');

  const zeroDivSnap = createDefaultSnapshot({
    liquid_assets: 0,
    short_term_liabilities: 0,
    gross_loan_portfolio: 0,
    loans_overdue_30_days: 0,
    loans_overdue_90_days: 0,
    financial_operating_revenue: 0,
    financial_operating_expenses: 0,
    loan_loss_provisions_expense: 0,
    tier1_net_capital: 0,
    total_risk_weighted_assets: 0
  });

  const rLiqZero = calculateLiquidityRatio(zeroDivSnap);
  assert(!isNaN(rLiqZero.value_pct) && isFinite(rLiqZero.value_pct), 'R_LIQ zero liabilities does not yield NaN/Inf');
  assert(rLiqZero.notes === 'ZERO_LIABILITIES', 'R_LIQ zero liabilities sets proper audit flag');

  const par30Zero = calculatePAR30(zeroDivSnap);
  assert(!isNaN(par30Zero.value_pct) && isFinite(par30Zero.value_pct), 'PAR_30 zero gross loans does not yield NaN/Inf');
  assert(par30Zero.notes === 'NO_ACTIVE_LOANS', 'PAR_30 zero loans sets proper audit flag');

  const carNeg = calculateCAR(createDefaultSnapshot({ tier1_net_capital: -10000000, total_risk_weighted_assets: 50000000 }));
  assert(carNeg.status === 'CRITICAL' && carNeg.value_pct === 0, 'CAR negative equity is flagged CRITICAL with value 0');

  // --------------------------------------------------------------------------
  // SECTION 6: High-Volume Performance & Latency Stress Test (500 Iterations)
  // --------------------------------------------------------------------------
  console.log('>>> [6/7] Stress Testing High-Volume Throughput (500 Iterations)...');

  const cashierService = new CashierParserService();
  const iterations = 500;
  const latencies = [];
  const startAll = Date.now();

  const stressPhrases = [
    'Fais un versement de cinquante mille francs pour MILDZINA Tomrom sur son épargne',
    'Retrait de dix sacs pour l\'adhérent 611',
    'Nye di be maɖo akpe blaeve ɖe Tomrom ƒe akɔnta me',
    'Sɔ akpe blaetɔ̃ do Ablavi ƒe akɔnti me',
    'Kotoku ato kple akpe blaadre vo ade na Tomrom',
    'Consulte le solde de l\'adhérent 610',
    'Médi be maqu fe akpe blaatɔ̃ na Kokou'
  ];

  for (let i = 0; i < iterations; i++) {
    const p = stressPhrases[i % stressPhrases.length];
    const s = Date.now();
    const res = await cashierService.parseCashierOrder({ transcript: p });
    const elapsed = Date.now() - s;
    latencies.push(elapsed);
    if (!res.success) {
      assert(false, `Iteration ${i} succeeded`, `Failed on phrase: ${p}`);
    }
  }

  const totalTime = Date.now() - startAll;
  latencies.sort((a, b) => a - b);
  const p99 = latencies[Math.floor(iterations * 0.99)];
  const max = latencies[latencies.length - 1];
  const avg = latencies.reduce((a, b) => a + b, 0) / iterations;

  console.log(`    Ran ${iterations} requests in ${totalTime}ms (Avg: ${avg.toFixed(2)}ms, P99: ${p99}ms, Max: ${max}ms)`);
  assert(p99 < 2000, `P99 Latency under 2000ms: got ${p99}ms`);
  assert(max < 2000, `Max Latency under 2000ms: got ${max}ms`);

  // --------------------------------------------------------------------------
  // SECTION 7: Express REST Endpoints Live Integration & Error Handling
  // --------------------------------------------------------------------------
  console.log('>>> [7/7] Stress Testing Live Express REST Routes...');

  const resValid = await request(app)
    .post('/api/ai/parse-order')
    .send({
      transcript: 'Fais un versement de cinquante mille francs pour MILDZINA Tomrom sur son épargne',
      language: 'fr-FR'
    });
  assert(resValid.status === 200, 'POST /api/ai/parse-order returned 200');
  assert(resValid.body.intent === 'CASH_DEPOSIT', 'Endpoint extracted intent correctly');
  assert(resValid.body.extracted_data.amount === 50000, 'Endpoint extracted amount 50000 correctly');
  assert(resValid.body.extracted_data.member_code === 'A0200225', 'Endpoint resolved member A0200225 correctly');

  const resBad = await request(app)
    .post('/api/ai/parse-order')
    .send({});
  assert(resBad.status === 400, 'POST /api/ai/parse-order with empty body returns 400 Bad Request');
  assert(resBad.body.success === false, 'Error response body contains success=false');

  const resFin = await request(app)
    .post('/api/ai/financial-query')
    .send({
      query: 'Fais-moi un rapport complet pour le conseil d administration sur la liquidité et la solvabilité',
      portfolio_context: testSnap
    });
  assert(resFin.status === 200, 'POST /api/ai/financial-query returned 200');
  assert(resFin.body.metrics.R_LIQ !== undefined, 'Response includes R_LIQ metric');
  assert(resFin.body.metrics.CAR !== undefined, 'Response includes CAR metric');
  assert(resFin.body.executive_summary !== undefined, 'Response includes executive summary');

  const resHealth = await request(app).get('/api/ai/health');
  assert(resHealth.status === 200, 'GET /api/ai/health returned 200');
  assert(resHealth.body.status === 'HEALTHY', 'Health check status is HEALTHY');

  // --------------------------------------------------------------------------
  // SUMMARY OF AUDIT
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`AUDIT RESULTS: ${passedTests}/${totalTests} Checks Passed (${failedTests} Failed)`);
  if (failedTests > 0) {
    console.log('FAILED CHECKS:');
    failureDetails.forEach(f => console.log('  ' + f));
  }
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAdversarialAudit().catch(err => {
  console.error('Fatal error during adversarial audit:', err);
  process.exit(1);
});
