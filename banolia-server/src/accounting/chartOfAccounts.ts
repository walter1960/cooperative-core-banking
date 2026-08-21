import { GLAccount } from './types';

export const BCEAO_CHART_OF_ACCOUNTS: GLAccount[] = [
  // ==========================================
  // CLASSE 1 : RESSOURCES PERMANENTES
  // ==========================================
  { accountNumber: '101100', name: 'Parts Sociales Souscrites Libérées (Individuels)', accountClass: 1, type: 'EQUITY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '101200', name: 'Parts Sociales Souscrites Libérées (Personnes Morales)', accountClass: 1, type: 'EQUITY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '101300', name: 'Parts Sociales Non Libérées', accountClass: 1, type: 'EQUITY', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '102000', name: 'Fonds de Dotation et Subventions', accountClass: 1, type: 'EQUITY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '111000', name: 'Réserve Légale (15% BCEAO)', accountClass: 1, type: 'EQUITY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '112000', name: 'Réserves Statutaires et Libres', accountClass: 1, type: 'EQUITY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '118000', name: 'Report à Nouveau', accountClass: 1, type: 'EQUITY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '121000', name: 'Résultat Net de l\'Exercice', accountClass: 1, type: 'EQUITY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '131000', name: 'Provisions pour Risques et Charges', accountClass: 1, type: 'LIABILITY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '161000', name: 'Emprunts et Dettes Financières > 1 an', accountClass: 1, type: 'LIABILITY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },

  // ==========================================
  // CLASSE 2 : OPÉRATIONS AVEC LES MEMBRES
  // ==========================================
  { accountNumber: '201100', name: 'Crédits Ordinaires à Court Terme (< 12 mois)', accountClass: 2, type: 'ASSET', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '201200', name: 'Crédits de Campagne Agricole', accountClass: 2, type: 'ASSET', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '201300', name: 'Crédits et Avances sur Tontine', accountClass: 2, type: 'ASSET', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '202100', name: 'Crédits à Moyen Terme (12-36 mois)', accountClass: 2, type: 'ASSET', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '203100', name: 'Crédits à Long Terme (> 36 mois)', accountClass: 2, type: 'ASSET', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '204121', name: 'Crédits aux Dirigeants et Personnel', accountClass: 2, type: 'ASSET', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '208000', name: 'Créances Rattachées (Intérêts Courus)', accountClass: 2, type: 'ASSET', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '291100', name: 'Créances Douteuses (PAR30 : 31-90 jours)', accountClass: 2, type: 'ASSET', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '291200', name: 'Créances Très Douteuses (PAR90 : 91-180 jours)', accountClass: 2, type: 'ASSET', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '291300', name: 'Créances Compromises (> 180 jours)', accountClass: 2, type: 'ASSET', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '299100', name: 'Provisions sur Créances Douteuses (25%)', accountClass: 2, type: 'CONTRA_ASSET', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '299200', name: 'Provisions sur Créances Très Douteuses (50%)', accountClass: 2, type: 'CONTRA_ASSET', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '299300', name: 'Provisions sur Créances Compromises (100%)', accountClass: 2, type: 'CONTRA_ASSET', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '251100', name: 'Dépôts à Vue des Particuliers', accountClass: 2, type: 'LIABILITY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '251211', name: 'Dépôts d\'Épargne Ordinaire à Vue', accountClass: 2, type: 'LIABILITY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '252000', name: 'Comptes d\'Épargne sur Livret', accountClass: 2, type: 'LIABILITY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '253000', name: 'Dépôts à Terme des Membres (DAT)', accountClass: 2, type: 'LIABILITY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '253800', name: 'Intérêts Courus sur DAT', accountClass: 2, type: 'LIABILITY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '254000', name: 'Dépôts de Garantie et Nantissements', accountClass: 2, type: 'LIABILITY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '258000', name: 'Comptes d\'Attente Épargne Tontine', accountClass: 2, type: 'LIABILITY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },

  // ==========================================
  // CLASSE 3 : INSTITUTIONS FINANCIÈRES
  // ==========================================
  { accountNumber: '311000', name: 'Banques Locales (Comptes Courants)', accountClass: 3, type: 'ASSET', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '312000', name: 'Trésor Public & Chèques Postaux', accountClass: 3, type: 'ASSET', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '318000', name: 'Intérêts Courus sur Avoirs Bancaires', accountClass: 3, type: 'ASSET', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '321000', name: 'Refinancement Banques & Caisses Centrales', accountClass: 3, type: 'LIABILITY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },

  // ==========================================
  // CLASSE 4 : COMPTES DE TIERS
  // ==========================================
  { accountNumber: '401000', name: 'Fournisseurs d\'Exploitation', accountClass: 4, type: 'LIABILITY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '421000', name: 'Personnel - Rémunérations Dues', accountClass: 4, type: 'LIABILITY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '431000', name: 'Organismes Sociaux (CNSS)', accountClass: 4, type: 'LIABILITY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '441000', name: 'État - Impôts et Taxes', accountClass: 4, type: 'LIABILITY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '471100', name: 'Comptes d\'Attente Mobile Money', accountClass: 4, type: 'LIABILITY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '471200', name: 'Écart de Caisse Négatif (Manquant Guichet)', accountClass: 4, type: 'ASSET', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '472200', name: 'Écart de Caisse Positif (Excédent Guichet)', accountClass: 4, type: 'LIABILITY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },

  // ==========================================
  // CLASSE 5 : TRÉSORERIE & CAISSES
  // ==========================================
  { accountNumber: '571100', name: 'Caisse Principale Siège (Coffre-Fort)', accountClass: 5, type: 'ASSET', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '571200', name: 'Caisses Guichets Agences', accountClass: 5, type: 'ASSET', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '571300', name: 'Caisses Auxiliaires Collecteurs Terrain', accountClass: 5, type: 'ASSET', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '578100', name: 'Portefeuille Marchand TMoney', accountClass: 5, type: 'ASSET', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '578200', name: 'Portefeuille Marchand Flooz / Moov', accountClass: 5, type: 'ASSET', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '578300', name: 'Portefeuille Marchand Wave', accountClass: 5, type: 'ASSET', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '578400', name: 'Portefeuille Marchand Orange Money', accountClass: 5, type: 'ASSET', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '578500', name: 'Portefeuille Marchand MTN MoMo', accountClass: 5, type: 'ASSET', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '581000', name: 'Virements Internes & Fonds en Transit', accountClass: 5, type: 'ASSET', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },

  // ==========================================
  // CLASSE 6 : CHARGES
  // ==========================================
  { accountNumber: '601000', name: 'Intérêts sur Dépôts à Terme (DAT)', accountClass: 6, type: 'EXPENSE', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '602000', name: 'Intérêts sur Épargne Rémunérée', accountClass: 6, type: 'EXPENSE', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '603000', name: 'Intérêts sur Emprunts & Refinancement', accountClass: 6, type: 'EXPENSE', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '611000', name: 'Frais Bancaires & Commissions Mobile Money', accountClass: 6, type: 'EXPENSE', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '621000', name: 'Achats Fournitures & Reçus Thermiques', accountClass: 6, type: 'EXPENSE', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '631000', name: 'Services Extérieurs (Loyers, Énergie, Télécoms)', accountClass: 6, type: 'EXPENSE', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '641000', name: 'Charges de Personnel (Salaires & Primes)', accountClass: 6, type: 'EXPENSE', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '651000', name: 'Dotations aux Amortissements', accountClass: 6, type: 'EXPENSE', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '661000', name: 'Dotations aux Provisions pour Créances Douteuses', accountClass: 6, type: 'EXPENSE', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '681000', name: 'Charges Exceptionnelles & Pertes sur Créances', accountClass: 6, type: 'EXPENSE', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },

  // ==========================================
  // CLASSE 7 : PRODUITS
  // ==========================================
  { accountNumber: '701100', name: 'Intérêts sur Crédits à Court Terme', accountClass: 7, type: 'INCOME', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '701200', name: 'Intérêts sur Crédits à Moyen et Long Terme', accountClass: 7, type: 'INCOME', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '702000', name: 'Commissions & Frais de Dossier Crédit', accountClass: 7, type: 'INCOME', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '703000', name: 'Pénalités et Intérêts de Retard', accountClass: 7, type: 'INCOME', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '704000', name: 'Commissions de Gestion Tontines (1 mise)', accountClass: 7, type: 'INCOME', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '705000', name: 'Frais de Tenue de Compte & Retraits', accountClass: 7, type: 'INCOME', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '706000', name: 'Droits d\'Adhésion & Frais de Carnets', accountClass: 7, type: 'INCOME', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '711000', name: 'Intérêts sur Placements & Avoirs Bancaires', accountClass: 7, type: 'INCOME', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '761000', name: 'Reprises de Provisions pour Créances', accountClass: 7, type: 'INCOME', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '781000', name: 'Produits Exceptionnels', accountClass: 7, type: 'INCOME', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },

  // ==========================================
  // CLASSE 8 : SOLDES INTERMÉDIAIRES
  // ==========================================
  { accountNumber: '801000', name: 'Solde Brut d\'Intermédiation Financière', accountClass: 8, type: 'SUMMARY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '811000', name: 'Résultat d\'Exploitation', accountClass: 8, type: 'SUMMARY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '821000', name: 'Résultat Net de l\'Exercice', accountClass: 8, type: 'SUMMARY', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },

  // ==========================================
  // CLASSE 9 : ENGAGEMENTS HORS-BILAN
  // ==========================================
  { accountNumber: '901000', name: 'Engagements de Financement Non Décaissés', accountClass: 9, type: 'OFF_BALANCE', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '911000', name: 'Garanties et Cautions Reçues des Membres', accountClass: 9, type: 'OFF_BALANCE', normalBalance: 'CREDIT', isLeaf: true, currentDebit: 0, currentCredit: 0 },
  { accountNumber: '991000', name: 'Créances Amorties Sorties du Bilan', accountClass: 9, type: 'OFF_BALANCE', normalBalance: 'DEBIT', isLeaf: true, currentDebit: 0, currentCredit: 0 }
];
