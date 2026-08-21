/// BCEAO and SYSCOA-SFD Regulatory and Banking Constants
class BceaoConstants {
  BceaoConstants._();

  /// Currency code for UMOA zone
  static const String currencyCode = 'XOF';
  static const String currencySymbol = 'F.CFA';

  /// Maximum legal Usury Rate (Taux d'Usure) ceiling set by BCEAO for SFD / Microfinance
  static const double usuryRateCeilingPercent = 24.0;

  /// Default annual nominal rate for micro-credit simulations
  static const double defaultLoanRatePercent = 12.0;

  /// Tontine cycle standard duration in days
  static const int tontineCycleDays = 31;

  /// Institutional commission in days retained by the cooperative
  static const int tontineCommissionDays = 1;

  /// Member paid days returned at cycle maturation
  static const int tontineMemberReturnDays = 30;

  // --- SYSCOA-SFD Chart of Accounts (Plan Comptable SFD) ---
  /// 101100 - Capital / Parts Sociales Souscrites et Libérées
  static const String accountShares = '101100';

  /// 251100 - Dépôts à Vue (DAV) / Épargne Libre Ordinaire
  static const String accountSavingsOrdinary = '251100';

  /// 252000 - Dépôts sur Livret Rémunéré
  static const String accountSavingsLivret = '252000';

  /// 253000 - Dépôts à Terme (DAT)
  static const String accountTermDeposit = '253000';

  /// 254000 - Dépôts de Garantie & Nantissements de Prêt (Solde Gelé)
  static const String accountCollateralHold = '254000';

  /// 258000 - Compte d'Attente Tontine Journalière
  static const String accountTontineCycle = '258000';

  /// 253310 - Plan Épargne Projet / Scolarité
  static const String accountProjectPlan = '253310';

  /// 201100 - Crédits à Court Terme Décaissés
  static const String accountShortTermLoan = '201100';

  /// 202100 - Crédits à Moyen Terme Décaissés
  static const String accountMediumTermLoan = '202100';

  /// 571200 - Caisse Démarcheur / Collecteur Terrain
  static const String accountCollectorCash = '571200';

  /// 578100 - Compte de Règlement Mobile Money - TMoney (Togocom)
  static const String accountMoMoTMoney = '578100';

  /// 578200 - Compte de Règlement Mobile Money - Moov Flooz
  static const String accountMoMoFlooz = '578200';

  /// 578300 - Compte de Règlement Mobile Money - Wave
  static const String accountMoMoWave = '578300';

  /// 578400 - Compte de Règlement Mobile Money - Orange Money
  static const String accountMoMoOrange = '578400';

  /// 578500 - Compte de Règlement Mobile Money - MTN MoMo
  static const String accountMoMoMtn = '578500';

  /// 471200 - Débiteurs Divers - Manquants de Caisse Collecteurs
  static const String accountCashShortageDiscrepancy = '471200';

  /// 472200 - Créditeurs Divers - Excédents de Caisse en Instance
  static const String accountCashSurplusDiscrepancy = '472200';

  // --- Official BCEAO Physical Cash Denominations (12 Units) ---
  /// Banknotes (Billets): 10 000, 5 000, 2 000, 1 000, 500
  static const List<int> banknoteDenominations = [
    10000,
    5000,
    2000,
    1000,
    500,
  ];

  /// Coins (Pièces): 500, 250, 200, 100, 50, 25, 10, 5
  static const List<int> coinDenominations = [
    500,
    250,
    200,
    100,
    50,
    25,
    10,
    5,
  ];

  /// All 12 BCEAO physical currency denominations in descending order
  static const List<int> allDenominations = [
    10000,
    5000,
    2000,
    1000,
    500,
    250,
    200,
    100,
    50,
    25,
    10,
    5,
  ];
}
