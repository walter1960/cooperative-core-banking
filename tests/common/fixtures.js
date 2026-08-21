/**
 * BANOLIA Test Fixtures & Synthetic Domain Entities
 * BCEAO/UMOA SYSCOA-SFD accounts, members, accounts, loan products, and transcripts.
 */

export const FIXTURES = {
  AGENCY: {
    code: 'A02',
    name: 'Agence Centrale Lomé Grand Marché',
    address: 'Rue du Commerce, Lomé, Togo',
    phone: '+228 22 21 00 00',
    agrementNo: 'T/1/189/SFD/BCEAO/2026',
    institutionName: 'COOPEC BANOLIA',
    institutionSub: 'Coopérative d\'Épargne et de Crédit'
  },

  CASHIERS: [
    { id: 'usr-01', code: 'CSH01', name: 'Akouvi Mensah', role: 'TELLER' },
    { id: 'usr-02', code: 'CSH02', name: 'Koffi Amouzou', role: 'TELLER' },
    { id: 'usr-sup', code: 'SUP01', name: 'Dr. Komla Agbodjan', role: 'SUPERVISOR' }
  ],

  MEMBERS: [
    {
      code: 'A0200225',
      manualNumber: '610',
      fullName: 'MILDZINA Tomrom',
      birthDate: '1984-05-12',
      registrationDate: '2025-01-15',
      address: 'Assivito, Grand Marché',
      city: 'Lomé',
      phone: '+22890123456',
      spouseName: 'MILDZINA Afi',
      sharesPurchased: 4,
      sharesSold: 0,
      sharesAvailable: 4,
      shareUnitPrice: 5000,
      status: 'ACTIF',
      fingerprintEnrolled: true,
      idType: 'CNI',
      idNumber: 'TG-1984-0512-0042'
    },
    {
      code: 'A0200226',
      manualNumber: '611',
      fullName: 'ADANLETE Mensah',
      birthDate: '1979-11-20',
      registrationDate: '2025-02-10',
      address: 'Bè-Kpota, Marché de Bè',
      city: 'Lomé',
      phone: '+22891234567',
      spouseName: 'ADANLETE Akou',
      sharesPurchased: 2,
      sharesSold: 0,
      sharesAvailable: 2,
      shareUnitPrice: 5000,
      status: 'ACTIF',
      fingerprintEnrolled: true,
      idType: 'PASSPORT',
      idNumber: 'P-TG-2022-8871'
    },
    {
      code: 'A0200227',
      manualNumber: '612',
      fullName: 'KODJO Afiwa',
      birthDate: '1992-08-04',
      registrationDate: '2025-03-01',
      address: 'Hedzranawoe',
      city: 'Lomé',
      phone: '+22892345678',
      sharesPurchased: 1,
      sharesSold: 0,
      sharesAvailable: 1,
      shareUnitPrice: 5000,
      status: 'ACTIF',
      fingerprintEnrolled: false,
      idType: 'VOTER_CARD',
      idNumber: 'CEI-TG-2023-991'
    },
    {
      code: 'A0200228',
      manualNumber: '613',
      fullName: 'LAWSON Boevi',
      birthDate: '1988-02-18',
      registrationDate: '2025-04-12',
      address: 'Aného',
      city: 'Aného',
      phone: '+22893456789',
      sharesPurchased: 10,
      sharesSold: 0,
      sharesAvailable: 10,
      shareUnitPrice: 5000,
      status: 'ACTIF',
      fingerprintEnrolled: true,
      idType: 'CNI',
      idNumber: 'TG-1988-0218-1123'
    }
  ],

  ACCOUNTS: [
    // Member A0200225 (Tomrom)
    {
      accountNumber: '25121100A020022501',
      memberCode: 'A0200225',
      productName: 'Épargne Ordinaire (DAV)',
      type: 'SAVINGS',
      glAccount: '251211',
      realBalance: 280424,
      frozenBalance: 50000,
      availableBalance: 230424,
      currency: 'XOF',
      status: 'ACTIF'
    },
    {
      accountNumber: '25300000A020022501',
      memberCode: 'A0200225',
      productName: 'Dépôt à Terme 12 Mois (DAT)',
      type: 'DAT',
      glAccount: '253000',
      realBalance: 500000,
      frozenBalance: 500000,
      availableBalance: 0,
      currency: 'XOF',
      status: 'ACTIF'
    },
    // Member A0200226 (Mensah)
    {
      accountNumber: '25121100A020022601',
      memberCode: 'A0200226',
      productName: 'Épargne Ordinaire (DAV)',
      type: 'SAVINGS',
      glAccount: '251211',
      realBalance: 150000,
      frozenBalance: 0,
      availableBalance: 150000,
      currency: 'XOF',
      status: 'ACTIF'
    },
    // Member A0200227 (Afiwa)
    {
      accountNumber: '25121100A020022701',
      memberCode: 'A0200227',
      productName: 'Épargne Ordinaire (DAV)',
      type: 'SAVINGS',
      glAccount: '251211',
      realBalance: 45000,
      frozenBalance: 0,
      availableBalance: 45000,
      currency: 'XOF',
      status: 'ACTIF'
    }
  ],

  STANDARD_SYSCOA_ACCOUNTS: [
    // Class 1
    { accountNumber: '101100', name: 'Parts Sociales Souscrites Libérées', class: 1, type: 'EQUITY', normalBalance: 'CREDIT' },
    { accountNumber: '111000', name: 'Réserve Légale (15% BCEAO)', class: 1, type: 'EQUITY', normalBalance: 'CREDIT' },
    { accountNumber: '112000', name: 'Réserves Statutaires', class: 1, type: 'EQUITY', normalBalance: 'CREDIT' },
    { accountNumber: '121000', name: 'Résultat Net de l\'Exercice', class: 1, type: 'EQUITY', normalBalance: 'CREDIT' },
    { accountNumber: '161000', name: 'Emprunts et Dettes Financières > 1 an', class: 1, type: 'LIABILITY', normalBalance: 'CREDIT' },
    // Class 2
    { accountNumber: '201100', name: 'Crédits Ordinaires Court Terme', class: 2, type: 'ASSET', normalBalance: 'DEBIT' },
    { accountNumber: '202100', name: 'Crédits Moyen Terme', class: 2, type: 'ASSET', normalBalance: 'DEBIT' },
    { accountNumber: '291100', name: 'Créances Douteuses (PAR30)', class: 2, type: 'ASSET', normalBalance: 'DEBIT' },
    { accountNumber: '291200', name: 'Créances Très Douteuses (PAR90)', class: 2, type: 'ASSET', normalBalance: 'DEBIT' },
    { accountNumber: '291300', name: 'Créances Compromises (>180j)', class: 2, type: 'ASSET', normalBalance: 'DEBIT' },
    { accountNumber: '299100', name: 'Provisions PAR30 (25%)', class: 2, type: 'CONTRA_ASSET', normalBalance: 'CREDIT' },
    { accountNumber: '299200', name: 'Provisions PAR90 (50%)', class: 2, type: 'CONTRA_ASSET', normalBalance: 'CREDIT' },
    { accountNumber: '299300', name: 'Provisions Compromises (100%)', class: 2, type: 'CONTRA_ASSET', normalBalance: 'CREDIT' },
    { accountNumber: '251100', name: 'Dépôts à Vue des Particuliers', class: 2, type: 'LIABILITY', normalBalance: 'CREDIT' },
    { accountNumber: '251211', name: 'Dépôts d\'Épargne Ordinaire à Vue', class: 2, type: 'LIABILITY', normalBalance: 'CREDIT' },
    { accountNumber: '253000', name: 'Dépôts à Terme (DAT)', class: 2, type: 'LIABILITY', normalBalance: 'CREDIT' },
    { accountNumber: '254000', name: 'Dépôts de Garantie et Nantissements', class: 2, type: 'LIABILITY', normalBalance: 'CREDIT' },
    { accountNumber: '258000', name: 'Comptes d\'Attente Épargne Tontine', class: 2, type: 'LIABILITY', normalBalance: 'CREDIT' },
    // Class 3
    { accountNumber: '311000', name: 'Banques Locales (Comptes Courants)', class: 3, type: 'ASSET', normalBalance: 'DEBIT' },
    { accountNumber: '321000', name: 'Refinancement Banques', class: 3, type: 'LIABILITY', normalBalance: 'CREDIT' },
    // Class 4
    { accountNumber: '401000', name: 'Fournisseurs d\'Exploitation', class: 4, type: 'LIABILITY', normalBalance: 'CREDIT' },
    { accountNumber: '471200', name: 'Écart Négatif (Manquant Guichet)', class: 4, type: 'ASSET', normalBalance: 'DEBIT' },
    { accountNumber: '472200', name: 'Écart Positif (Excédent Guichet)', class: 4, type: 'LIABILITY', normalBalance: 'CREDIT' },
    // Class 5
    { accountNumber: '571100', name: 'Caisse Principale Siège (Coffre)', class: 5, type: 'ASSET', normalBalance: 'DEBIT' },
    { accountNumber: '571200', name: 'Caisses Guichets Agences', class: 5, type: 'ASSET', normalBalance: 'DEBIT' },
    { accountNumber: '571300', name: 'Caisses Auxiliaires Collecteurs Terrain', class: 5, type: 'ASSET', normalBalance: 'DEBIT' },
    { accountNumber: '578100', name: 'Wallet TMoney', class: 5, type: 'ASSET', normalBalance: 'DEBIT' },
    { accountNumber: '578200', name: 'Wallet Flooz Moov', class: 5, type: 'ASSET', normalBalance: 'DEBIT' },
    { accountNumber: '578300', name: 'Wallet Wave', class: 5, type: 'ASSET', normalBalance: 'DEBIT' },
    { accountNumber: '578400', name: 'Wallet Orange Money', class: 5, type: 'ASSET', normalBalance: 'DEBIT' },
    { accountNumber: '578500', name: 'Wallet MTN MoMo', class: 5, type: 'ASSET', normalBalance: 'DEBIT' },
    // Class 6
    { accountNumber: '601000', name: 'Charges Intérêts DAT', class: 6, type: 'EXPENSE', normalBalance: 'DEBIT' },
    { accountNumber: '602000', name: 'Intérêts sur Livret', class: 6, type: 'EXPENSE', normalBalance: 'DEBIT' },
    { accountNumber: '611000', name: 'Frais et Commissions MoMo / Banques', class: 6, type: 'EXPENSE', normalBalance: 'DEBIT' },
    { accountNumber: '641000', name: 'Charges de Personnel', class: 6, type: 'EXPENSE', normalBalance: 'DEBIT' },
    { accountNumber: '661000', name: 'Dotations aux Provisions Créances', class: 6, type: 'EXPENSE', normalBalance: 'DEBIT' },
    // Class 7
    { accountNumber: '701100', name: 'Intérêts sur Crédits Court Terme', class: 7, type: 'INCOME', normalBalance: 'CREDIT' },
    { accountNumber: '701200', name: 'Intérêts sur Crédits Moyen Terme', class: 7, type: 'INCOME', normalBalance: 'CREDIT' },
    { accountNumber: '702000', name: 'Commissions Dossier Crédit', class: 7, type: 'INCOME', normalBalance: 'CREDIT' },
    { accountNumber: '703000', name: 'Pénalités Retard Crédit', class: 7, type: 'INCOME', normalBalance: 'CREDIT' },
    { accountNumber: '704000', name: 'Commissions de Gestion Tontines', class: 7, type: 'INCOME', normalBalance: 'CREDIT' },
    { accountNumber: '705000', name: 'Frais de Tenue de Compte', class: 7, type: 'INCOME', normalBalance: 'CREDIT' },
    { accountNumber: '706000', name: 'Droits d\'Adhésion SFD', class: 7, type: 'INCOME', normalBalance: 'CREDIT' }
  ],

  BILLETAGE_SAMPLE: {
    b_10000: 20, // 200,000
    b_5000: 10,  // 50,000
    b_2000: 10,  // 20,000
    b_1000: 10,  // 10,000
    b_500: 10,   // 5,000
    p_500: 5,    // 2,500
    p_200: 0,
    p_100: 10,   // 1,000
    p_50: 0,
    p_25: 0,
    p_10: 0,
    p_5: 0,
    totalCalculated: 288500
  },

  VOICE_TRANSCRIPTS: {
    FRENCH_DEPOSIT: 'Versement de cinquante mille francs pour Tomrom',
    FRENCH_WITHDRAWAL: 'Retrait de vingt mille francs pour le sociétaire 610',
    EWE_DEPOSIT: 'Ga dodo akpe blaato na Tomrom',
    EWE_WITHDRAWAL: 'Ga ɖeɖe akpe blaeve le akɔnta me na Mensah',
    MINA_TONTINE: 'Asusu dido akpe ɖeka na Afiwa',
    MIXED_ORDER: 'Versement de akpe blaeve pour Tomrom',
    RATIO_QUERY: 'Donne-moi l\'état du PAR 30 et de la liquidité'
  }
};

export default FIXTURES;
