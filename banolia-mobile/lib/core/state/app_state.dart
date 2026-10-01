import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../database/coop_database_service.dart';
import '../security/biometric_auth_service.dart';
import '../utils/french_number_words.dart';

enum TransactionType { credit, debit }

class TransactionRecord {
  final String id;
  final String title;
  final String category;
  final String subtitle;
  final DateTime date;
  final int amountXof;
  final TransactionType type;
  final String reference;
  final String status;
  final String? accountId;

  const TransactionRecord({
    required this.id,
    required this.title,
    required this.category,
    required this.subtitle,
    required this.date,
    required this.amountXof,
    required this.type,
    required this.reference,
    this.status = 'Effectué',
    this.accountId,
  });

  bool get isCredit => type == TransactionType.credit;
}

class SupportTicketRecord {
  final String id;
  final String subject;
  final String category;
  final String message;
  final DateTime createdAt;
  final String status; // 'OUVERT', 'EN_COURS', 'RESOLU'
  final String? response;

  const SupportTicketRecord({
    required this.id,
    required this.subject,
    required this.category,
    required this.message,
    required this.createdAt,
    this.status = 'OUVERT',
    this.response,
  });
}

class ChequeOrderRecord {
  final String id;
  final int numberOfLeaves;
  final String agency;
  final DateTime orderDate;
  final String status; // 'EN_IMPRESSION', 'DISPONIBLE_AGENCE', 'LIVRE'

  const ChequeOrderRecord({
    required this.id,
    required this.numberOfLeaves,
    required this.agency,
    required this.orderDate,
    this.status = 'EN_IMPRESSION',
  });
}

class CoopAppState extends ChangeNotifier {
  static final CoopAppState _instance = CoopAppState._internal();
  factory CoopAppState() => _instance;
  CoopAppState._internal() {
    _initInitialData();
  }

  final CoopDatabaseService _dbService = CoopDatabaseService();

  // --- Membre Connecté (Alimenté depuis SQLite) ---
  String memberName = 'AMOUZOU Koffi Mensah';
  String memberCode = '130002';
  String memberPhone = '+228 91 23 45 67';
  String memberEmail = 'contact@cooperative.tg';
  String memberAgency = 'Siège Principal Lomé';
  String memberIban = 'TG05 TG02 0001 0130 0020 1489 01';
  DateTime memberJoinedDate = DateTime(2026, 9, 4);

  // --- Soldes des Comptes (XOF) ---
  int currentAccountBalance = 0;
  int currentAccountFrozen = 0;
  int get currentAccountAvailable => currentAccountBalance - currentAccountFrozen;

  int savingsAccountBalance = 200000;
  double savingsInterestRate = 3.5;

  // --- Blocage Volontaire d'Épargne ---
  bool isSavingsBlocked = true;
  double blockedSavingsPercentage = 40.0;
  DateTime? savingsBlockedUntil = DateTime.now().add(const Duration(days: 180));

  // Montant d'épargne actuellement bloqué/verrouillé
  int get blockedSavingsAmount {
    if (!isSavingsBlocked) return 0;
    if (savingsBlockedUntil != null && DateTime.now().isAfter(savingsBlockedUntil!)) {
      return 0; // Période de blocage échue
    }
    return ((savingsAccountBalance * blockedSavingsPercentage) / 100).round();
  }

  // Épargne liquide disponible après déduction de la part bloquée
  int get availableLiquidSavings => (savingsAccountBalance - blockedSavingsAmount).clamp(0, savingsAccountBalance);

  // Capacité d'emprunt maximale (dépendante de l'épargne totale, des parts sociales et de l'endettement existant)
  // Règle microfinance : Ratio d'effet de levier (ex: max 3x l'épargne totale + parts) - dette restante
  int get maxBorrowingCapacity {
    final baseGuarantee = savingsAccountBalance + shareCapitalBalance;
    final grossCapacity = baseGuarantee * 3;
    final netCapacity = grossCapacity - totalDebtBalance;
    return netCapacity > 0 ? netCapacity : 0;
  }

  int shareCapitalBalance = 30000; // 3 parts de 10 000 XOF

  int get totalAggregatedSavings =>
      currentAccountBalance + savingsAccountBalance + shareCapitalBalance;

  // --- Dette Globale & Encours de Crédit ---
  int get totalDebtBalance {
    int debt = 0;
    for (final loan in _activeLoans) {
      if (loan.status != 'SOLDE') {
        debt += loan.remainingPrincipalXof;
      }
    }
    return debt;
  }

  int get nextInstallmentAmount {
    for (final loan in _activeLoans) {
      if (loan.status == 'EN_COURS') {
        return loan.monthlyInstallmentXof;
      }
    }
    return 0;
  }

  DateTime? get nextInstallmentDate {
    for (final loan in _activeLoans) {
      if (loan.status == 'EN_COURS') {
        return loan.nextDueDate;
      }
    }
    return null;
  }

  // --- Paramètres de Cartes ---
  bool isCardLocked = false;
  bool isContactlessActive = true;
  bool isOnlinePaymentActive = true;
  int cardDailyWithdrawalLimit = 500000;
  int cardMonthlyPaymentLimit = 2500000;
  int currentMonthCardExpenses = 0;

  // --- Préférences Utilisateur & Sécurité ---
  bool isBiometricEnabled = false;
  bool isDarkMode = false;
  String currentLanguage = 'FR';
  bool pushNotificationsEnabled = true;
  bool smsAlertsEnabled = true;
  int dailyTransferLimit = 1500000;

  // --- Collections Métier en Base de Données ---
  final List<TransactionRecord> _transactions = [];
  List<TransactionRecord> get transactions => List.unmodifiable(_transactions);

  final List<ActiveLoan> _activeLoans = [];
  List<ActiveLoan> get activeLoans => List.unmodifiable(_activeLoans);

  final List<OnlineLoanApplication> _loanApplications = [];
  List<OnlineLoanApplication> get loanApplications => List.unmodifiable(_loanApplications);

  final List<WithdrawalSlip> _withdrawalSlips = [];
  List<WithdrawalSlip> get withdrawalSlips => List.unmodifiable(_withdrawalSlips);

  final List<StandingOrder> _standingOrders = [];
  List<StandingOrder> get standingOrders => List.unmodifiable(_standingOrders);

  final List<AppNotification> _notifications = [];
  List<AppNotification> get notifications => List.unmodifiable(_notifications);

  final List<EmailLog> _emailLogs = [];
  List<EmailLog> get emailLogs => List.unmodifiable(_emailLogs);

  final List<SupportTicketRecord> _tickets = [];
  List<SupportTicketRecord> get tickets => List.unmodifiable(_tickets);

  final List<ChequeOrderRecord> _chequeOrders = [];
  List<ChequeOrderRecord> get chequeOrders => List.unmodifiable(_chequeOrders);

  void _initInitialData() {
    // 1. Transactions réelles synchronisées avec SQLite
    _transactions.addAll([
      TransactionRecord(
        id: 'TX-714586',
        title: 'Retrait au Guichet Caisse',
        category: 'Guichet Caisse',
        subtitle: 'Agence Principale Lomé',
        date: DateTime.now().subtract(const Duration(minutes: 45)),
        amountXof: 50000,
        type: TransactionType.debit,
        reference: 'RET-714586',
      ),
      TransactionRecord(
        id: 'TX-705631',
        title: 'Dépôt d\'Épargne Initial',
        category: 'Épargne',
        subtitle: 'Versement espèces au guichet',
        date: DateTime.now().subtract(const Duration(hours: 1)),
        amountXof: 250000,
        type: TransactionType.credit,
        reference: 'DEP-705631',
      ),
    ]);

    // 2. Synchronisation automatique en arrière-plan avec le serveur
    syncWithBackend();

    final now = DateTime.now();

    // 3. Demandes de prêt en ligne avec timeline
    _loanApplications.add(
      OnlineLoanApplication(
        id: 'DEM-CR-904',
        applicationNumber: 'DEM-2026-09-001',
        productName: 'Prêt Court Terme Trésorerie',
        requestedAmountXof: 1500000,
        durationMonths: 12,
        interestRate: 5.0,
        termCategory: 'COURT_TERME',
        calculationMethod: 'LINEAIRE',
        estimatedMonthlyPaymentXof: 131250,
        purpose: 'Avance sur salaire et équipement personnel',
        monthlyIncomeXof: 550000,
        collateralType: 'PRELEVEMENT_PAIE',
        guarantorName: 'Collègue Sociétaire (Matricule 130050)',
        attachmentName: 'demande_manuscrite_justificatif.pdf',
        writtenStatement: 'Demande officielle d\'avance sur salaire pour investissement familial.',
        submissionDate: DateTime.now().subtract(const Duration(days: 3)),
        currentStep: 'INSTRUCTION_DOSSIER',
        statusTimeline: [
          'Dossier soumis en ligne le ${now.day - 3}/${now.month}/${now.year}',
          'Pièces justificatives validées par l\'analyste de crédit',
          'En cours d\'instruction technique par le comité',
        ],
      ),
    );

    // 4. Fiches de retrait officielles
    _withdrawalSlips.add(
      WithdrawalSlip(
        id: 'SLIP-001',
        slipNumber: 'RET-2026-09-0012',
        memberCode: memberCode,
        memberName: memberName,
        amountXof: 100000,
        amountInWords: FrenchNumberWords.convertToFrancsCfa(100000),
        accountType: 'Compte Courant',
        agency: 'Guichet Agence Principale',
        createdAt: DateTime.now().subtract(const Duration(hours: 4)),
        expiresAt: DateTime.now().add(const Duration(hours: 20)),
        qrPayload: 'COOPEC-WITHDRAWAL|RET-2026-09-0012|130049|100000|SEC_TOKEN_8892',
        status: 'EN_ATTENTE_GUICHET',
        cashierNote: 'Présenter pièce d\'identité valide au guichet Caisse',
      ),
    );

    // 5. Ordres de virement automatiques de fin de mois
    _standingOrders.addAll([
      StandingOrder(
        id: 'SO-001',
        title: 'Épargne Mensuelle Automatique',
        amountXof: 75000,
        dayOfMonth: 28,
        sourceAccount: 'Compte Courant',
        destinationAccount: 'Livret Épargne Rémunéré (3.5%)',
        purpose: 'Constitution réserve de précaution',
        isActive: true,
      ),
      StandingOrder(
        id: 'SO-002',
        title: 'Remboursement Mensualité Prêt',
        amountXof: 135075,
        dayOfMonth: 30,
        sourceAccount: 'Compte Courant',
        destinationAccount: 'Crédit Commerce #CR-2026-04',
        purpose: 'Échéance prêt automatique fin de mois',
        isActive: true,
      ),
    ]);

    // 6. Notifications initiales
    _notifications.addAll([
      AppNotification(
        id: 'NOTIF-01',
        title: 'Échéance de prêt à venir',
        message: 'Votre mensualité de 135 075 F CFA arrive à échéance le 5 du mois prochain.',
        timestamp: DateTime.now().subtract(const Duration(hours: 2)),
        type: 'PRET',
      ),
      AppNotification(
        id: 'NOTIF-02',
        title: 'Bordereau de retrait généré',
        message: 'Fiche de retrait N° RET-2026-09-0012 de 100 000 F prête pour encaissement.',
        timestamp: DateTime.now().subtract(const Duration(hours: 4)),
        type: 'RETRAIT',
      ),
      AppNotification(
        id: 'NOTIF-03',
        title: 'Versement d\'Épargne Enregistré',
        message: 'Votre compte épargne a été crédité de 25 000 F CFA par votre gestionnaire.',
        timestamp: DateTime.now().subtract(const Duration(days: 1)),
        type: 'CREDIT',
      ),
    ]);

    // 7. Journaux d'e-mails envoyés
    _emailLogs.add(
      EmailLog(
        id: 'EML-001',
        recipientEmail: memberEmail,
        subject: 'Avis d\'opération : Génération de fiche de retrait N° RET-2026-09-0012',
        bodySummary: 'Confirmation de l\'émission d\'un bordereau de retrait de 100 000 F CFA sur votre compte.',
        sentAt: DateTime.now().subtract(const Duration(hours: 4)),
        attachmentReference: 'RET-2026-09-0012.pdf',
      ),
    );
  }

  /// Vérification stricte et authentification d'un sociétaire auprès du Core Banking (SQLite).
  /// Si le gestionnaire n'a pas créé/validé le compte, l'accès est strictement refusé.
  Future<({bool success, String? errorMessage, String? memberName})> verifyAndAuthenticateMember(String inputCodeOrPhone) async {
    final trimmed = inputCodeOrPhone.trim();
    if (trimmed.isEmpty) {
      return (
        success: false,
        errorMessage: 'Veuillez saisir votre matricule sociétaire ou votre numéro de téléphone.',
        memberName: null,
      );
    }

    final candidateHosts = [
      'http://127.0.0.1:3000',
      'http://192.168.1.116:3000',
      'http://10.0.2.2:3000',
    ];

    bool serverReached = false;

    for (final base in candidateHosts) {
      try {
        final searchUri = Uri.parse('$base/api/members?q=${Uri.encodeComponent(trimmed)}');
        final res = await http.get(searchUri).timeout(const Duration(seconds: 4));

        if (res.statusCode == 200) {
          serverReached = true;
          final data = jsonDecode(res.body);
          if (data['success'] == true) {
            final members = (data['members'] as List?) ?? [];
            if (members.isEmpty) {
              return (
                success: false,
                errorMessage: 'Compte sociétaire introuvable ou non encore validé par votre gestionnaire en agence.\n\nVeuillez vous rapprocher du guichet de votre agence COOPECTAT pour activer votre dossier.',
                memberName: null,
              );
            }

            final m = members[0];
            memberCode = m['code'] ?? trimmed;
            memberName = m['full_name'] ?? memberName;
            memberPhone = m['phone'] ?? memberPhone;
            if (m['email'] != null && (m['email'] as String).isNotEmpty) {
              memberEmail = m['email'];
            }

            // Charger les comptes réels et verrous d'épargne
            final detailUri = Uri.parse('$base/api/members/$memberCode');
            try {
              final dRes = await http.get(detailUri).timeout(const Duration(seconds: 4));
              if (dRes.statusCode == 200) {
                final dData = jsonDecode(dRes.body);
                if (dData['success'] == true) {
                  final accs = (dData['accounts'] as List?) ?? [];
                  final lock = dData['savingsLock'];

                  for (final acc in accs) {
                    if (acc['product_code'] == 'EPG_VOLONTAIRE') {
                      savingsAccountBalance = (acc['balance'] as num).toInt();
                    } else if (acc['product_code'] == 'PARTS_SOCIALES') {
                      shareCapitalBalance = (acc['balance'] as num).toInt();
                    }
                  }

                  if (lock != null && lock['status'] == 'ACTIVE') {
                    isSavingsBlocked = true;
                    blockedSavingsPercentage = (lock['percentage'] as num).toDouble();
                    if (lock['until_date'] != null) {
                      savingsBlockedUntil = DateTime.tryParse(lock['until_date']);
                    }
                  } else {
                    isSavingsBlocked = false;
                    blockedSavingsPercentage = 0.0;
                    savingsBlockedUntil = null;
                  }
                }
              }
            } catch (_) {}

            notifyListeners();
            return (
              success: true,
              errorMessage: null,
              memberName: memberName,
            );
          }
        }
      } catch (_) {
        continue;
      }
    }

    if (!serverReached) {
      return (
        success: false,
        errorMessage: 'Impossible de joindre le serveur du Core Banking COOPECTAT.\nAssurez-vous que le serveur est démarré et que vous êtes connecté au réseau.',
        memberName: null,
      );
    }

    return (
      success: false,
      errorMessage: 'Échec de l\'authentification sociétaire.',
      memberName: null,
    );
  }

  /// Synchroniser l'état local du sociétaire avec la base de données réelle (SQLite)
  Future<void> syncWithBackend() async {
    final candidateHosts = [
      'http://127.0.0.1:3000',
      'http://192.168.1.116:3000',
      'http://10.0.2.2:3000',
    ];

    for (final base in candidateHosts) {
      try {
        final res = await http.get(
          Uri.parse('$base/api/members/$memberCode'),
        ).timeout(const Duration(seconds: 3));

        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          if (data['success'] == true) {
            final m = data['member'];
            final accs = (data['accounts'] as List?) ?? [];
            final lock = data['savingsLock'];

            memberName = m['full_name'] ?? memberName;
            memberPhone = m['phone'] ?? memberPhone;
            memberEmail = m['email'] ?? memberEmail;

            for (final acc in accs) {
              if (acc['product_code'] == 'EPG_VOLONTAIRE') {
                savingsAccountBalance = (acc['balance'] as num).toInt();
              } else if (acc['product_code'] == 'PARTS_SOCIALES') {
                shareCapitalBalance = (acc['balance'] as num).toInt();
              }
            }

            if (lock != null && lock['status'] == 'ACTIVE') {
              isSavingsBlocked = true;
              blockedSavingsPercentage = (lock['percentage'] as num).toDouble();
              if (lock['until_date'] != null) {
                savingsBlockedUntil = DateTime.tryParse(lock['until_date']);
              }
            } else {
              isSavingsBlocked = false;
              blockedSavingsPercentage = 0.0;
              savingsBlockedUntil = null;
            }

            notifyListeners();
            break;
          }
        }
      } catch (_) {
        continue;
      }
    }
  }

  Future<void> _sendLockToBackend(bool isBlocked, double percentage, int durationMonths) async {
    final candidateHosts = [
      'http://127.0.0.1:3000',
      'http://192.168.1.116:3000',
      'http://10.0.2.2:3000',
    ];
    for (final base in candidateHosts) {
      try {
        final res = await http.post(
          Uri.parse('$base/api/accounts/lock'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'memberCode': memberCode,
            'isBlocked': isBlocked,
            'percentage': percentage,
            'durationMonths': durationMonths,
          }),
        ).timeout(const Duration(seconds: 4));
        if (res.statusCode >= 200 && res.statusCode < 300) break;
      } catch (_) {
        continue;
      }
    }
  }

  // --- ACTIONS & MUTATIONS EN TEMPS RÉEL ---

  /// Émettre une fiche officielle de retrait guichet
  WithdrawalSlip? createWithdrawalSlip({
    required int amountXof,
    required String accountType,
    required String agency,
    String? reason,
  }) {
    if (amountXof <= 0 || amountXof > currentAccountAvailable) {
      return null;
    }

    final slipNum = 'R-${DateTime.now().year}-${(100 + _withdrawalSlips.length + 1)}';
    final id = 'SLIP-${DateTime.now().millisecondsSinceEpoch}';
    final words = FrenchNumberWords.convertToFrancsCfa(amountXof);
    final qrPayload = 'COOPECTAT-RETRAIT|$slipNum|$memberCode|$amountXof|AUTH_${DateTime.now().millisecondsSinceEpoch}';

    final slip = WithdrawalSlip(
      id: id,
      slipNumber: slipNum,
      memberCode: memberCode,
      memberName: memberName,
      amountXof: amountXof,
      amountInWords: words,
      accountType: accountType,
      agency: agency,
      createdAt: DateTime.now(),
      expiresAt: DateTime.now().add(const Duration(hours: 48)),
      qrPayload: qrPayload,
      status: 'EN_ATTENTE_GUICHET',
      cashierNote: reason ?? 'Demande de retrait partiel sur épargne autorisée',
    );

    _withdrawalSlips.insert(0, slip);
    _dbService.saveWithdrawalSlips(_withdrawalSlips);

    // Notification et Email
    recordNotificationAndEmail(
      title: 'Fiche de Retrait Partiel N° $slipNum',
      message: 'Fiche de retrait N° $slipNum de $amountXof F émise avec succès. Valable pour décaissement au guichet.',
      type: 'RETRAIT',
      emailSubject: 'Fiche de Retrait Partiel $slipNum - COOPEC',
      emailBody: 'Bonjour $memberName (Matricule $memberCode), votre fiche de retrait partiel de $amountXof F CFA ($words) a été enregistrée avec succès. Elle est immédiatement disponible pour décaissement au guichet du $agency (Agrément SFD UMOA).',
      attachmentReference: '$slipNum.pdf',
    );

    notifyListeners();
    return slip;
  }

  /// Annuler une fiche de retrait non encore encaissée
  void cancelWithdrawalSlip(String slipId) {
    final idx = _withdrawalSlips.indexWhere((s) => s.id == slipId);
    if (idx != -1) {
      final old = _withdrawalSlips[idx];
      _withdrawalSlips[idx] = WithdrawalSlip(
        id: old.id,
        slipNumber: old.slipNumber,
        memberCode: old.memberCode,
        memberName: old.memberName,
        amountXof: old.amountXof,
        amountInWords: old.amountInWords,
        accountType: old.accountType,
        agency: old.agency,
        createdAt: old.createdAt,
        expiresAt: old.expiresAt,
        qrPayload: old.qrPayload,
        status: 'ANNULE',
        cashierNote: 'Annulé par le sociétaire',
      );
      _dbService.saveWithdrawalSlips(_withdrawalSlips);
      notifyListeners();
    }
  }

  /// Calcul et Règles du Retrait Maximum :
  /// - Tient compte de la part bloquée volontairement par le sociétaire.
  /// - Long terme : formule : Épargne Liquide - Épargne Garantie - Crédit Long Terme en cours.
  int get maxPossibleWithdrawal {
    final liquid = availableLiquidSavings;
    final longTermLoans = _activeLoans.where((l) => l.isLongTerm && l.status == 'EN_COURS');
    if (longTermLoans.isNotEmpty) {
      final totalLongTermDebt = longTermLoans.fold<int>(0, (sum, l) => sum + l.remainingPrincipalXof);
      const guaranteeSavings = 50000;
      final maxW = liquid - guaranteeSavings - totalLongTermDebt;
      return maxW > 0 ? maxW : 0;
    } else {
      // Pour le compte épargne
      const minReserve = 50000;
      final maxW = liquid - minReserve;
      return maxW > 0 ? maxW : 0;
    }
  }

  /// Configurer le blocage / verrouillage d'une part de son épargne
  void configureSavingsLocking({
    required bool isBlocked,
    required double percentage,
    DateTime? untilDate,
  }) {
    isSavingsBlocked = isBlocked;
    blockedSavingsPercentage = percentage.clamp(0.0, 100.0);
    savingsBlockedUntil = untilDate;

    // Envoi en arrière-plan au Core Banking SQLite
    _sendLockToBackend(isBlocked, percentage, 6);

    if (isBlocked) {
      final blockedAmt = blockedSavingsAmount;
      recordNotificationAndEmail(
        title: 'Verrouillage d\'épargne configuré',
        message: 'Vous avez choisi de bloquer ${percentage.toStringAsFixed(0)}% de votre épargne ($blockedAmt F CFA)${untilDate != null ? ' jusqu\'au ${untilDate.day}/${untilDate.month}/${untilDate.year}' : ''}. Ce montant ne sera pas retirable pendant cette période.',
        type: 'EPARGNE',
        emailSubject: 'Confirmation de verrouillage d\'épargne',
        emailBody: 'Bonjour $memberName, votre choix de bloquer ${percentage.toStringAsFixed(0)}% de votre solde d\'épargne ($blockedAmt F CFA) a bien été pris en compte.',
      );
    } else {
      recordNotificationAndEmail(
        title: 'Déblocage de votre épargne',
        message: 'Le blocage de votre épargne a été levé. Votre épargne est de nouveau disponible selon les conditions standard.',
        type: 'EPARGNE',
      );
    }
    notifyListeners();
  }

  /// Créditer le compte par le Gestionnaire (le membre ne voit que la notification/e-mail et le crédit sur son solde)
  void creditAccountFromManager({
    required int amountXof,
    required String targetAccount, // 'EPARGNE' ou 'COURANT'
    required String reason,
    String? reference,
  }) {
    if (amountXof <= 0) return;

    if (targetAccount == 'EPARGNE') {
      savingsAccountBalance += amountXof;
    } else {
      currentAccountBalance += amountXof;
    }

    final txRef = reference ?? 'CREDIT-GEST-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
    _transactions.insert(
      0,
      TransactionRecord(
        id: txRef,
        title: 'Crédit Compte - $reason',
        category: 'Virement / Crédit',
        subtitle: 'Opération traitée par votre Gestionnaire de Compte',
        date: DateTime.now(),
        amountXof: amountXof,
        type: TransactionType.credit,
        reference: txRef,
      ),
    );

    recordNotificationAndEmail(
      title: 'Compte crédité : +$amountXof F CFA',
      message: 'Votre $targetAccount a été crédité de $amountXof F CFA ($reason). Votre nouveau solde est à jour.',
      type: 'CREDIT',
      emailSubject: 'Avis de crédit sur votre compte COOPECTAT',
      emailBody: 'Bonjour $memberName, nous vous informons qu\'un crédit de $amountXof F CFA a été porté au crédit de votre compte ($reason). Réf : $txRef.',
      attachmentReference: '$txRef.pdf',
    );

    notifyListeners();
  }

  /// Déterminer si le membre a un engagement long terme actif
  bool get hasActiveLongTermLoan => _activeLoans.any((l) => l.isLongTerm && l.status == 'EN_COURS');

  /// Soumettre une demande de prêt en ligne
  OnlineLoanApplication submitOnlineLoanApplication({
    required String productName,
    required int requestedAmountXof,
    required int durationMonths,
    required double interestRate,
    required int estimatedMonthlyPaymentXof,
    required String purpose,
    required int monthlyIncomeXof,
    required String collateralType,
    required String guarantorName,
    String termCategory = 'COURT_TERME',
    String calculationMethod = 'LINEAIRE',
    String? attachmentName,
    String? writtenStatement,
  }) {
    final appNumber = 'DEM-${DateTime.now().year}-${(1000 + _loanApplications.length + 1)}';
    final id = 'DEM-CR-${DateTime.now().millisecondsSinceEpoch}';

    final app = OnlineLoanApplication(
      id: id,
      applicationNumber: appNumber,
      productName: productName,
      requestedAmountXof: requestedAmountXof,
      durationMonths: durationMonths,
      interestRate: interestRate,
      estimatedMonthlyPaymentXof: estimatedMonthlyPaymentXof,
      purpose: purpose,
      monthlyIncomeXof: monthlyIncomeXof,
      collateralType: collateralType,
      guarantorName: guarantorName,
      submissionDate: DateTime.now(),
      currentStep: 'SOUMISE',
      termCategory: termCategory,
      calculationMethod: calculationMethod,
      attachmentName: attachmentName,
      writtenStatement: writtenStatement,
      statusTimeline: [
        'Dossier soumis en ligne le ${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year}',
        'Vérification de la capacité d\'endettement (Mensualité : $estimatedMonthlyPaymentXof F)',
        'Instruction par l\'agent de crédit assigné',
      ],
    );

    _loanApplications.insert(0, app);
    _dbService.saveLoanApplications(_loanApplications);

    // Notification et Email
    recordNotificationAndEmail(
      title: 'Demande de Prêt N° $appNumber',
      message: 'Demande de prêt N° $appNumber de $requestedAmountXof F CFA soumise. Remboursement par prélèvement.',
      type: 'PRET',
      emailSubject: 'Accusé de réception - Demande de Prêt $appNumber',
      emailBody: 'Bonjour $memberName (Matricule $memberCode), votre demande de prêt ($productName de $requestedAmountXof F CFA sur $durationMonths mois) a bien été enregistrée pour instruction par le Comité de Crédit de la Coopérative.',
      attachmentReference: '$appNumber.pdf',
    );

    notifyListeners();
    return app;
  }

  /// Déclencher les virements automatiques de fin de mois
  void triggerEndOfMonthAutomations() {
    int totalExecuted = 0;
    for (int i = 0; i < _standingOrders.length; i++) {
      final order = _standingOrders[i];
      if (!order.isActive) continue;

      if (currentAccountAvailable >= order.amountXof) {
        currentAccountBalance -= order.amountXof;
        if (order.destinationAccount.contains('Épargne')) {
          savingsAccountBalance += order.amountXof;
        }

        totalExecuted += order.amountXof;

        final txId = 'AUTO-FDM-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
        _transactions.insert(
          0,
          TransactionRecord(
            id: txId,
            title: 'Virement Auto Fin de Mois - ${order.title}',
            category: 'Virement Automatique',
            subtitle: 'Vers ${order.destinationAccount}',
            date: DateTime.now(),
            amountXof: order.amountXof,
            type: TransactionType.debit,
            reference: txId,
          ),
        );

        _standingOrders[i] = StandingOrder(
          id: order.id,
          title: order.title,
          amountXof: order.amountXof,
          dayOfMonth: order.dayOfMonth,
          sourceAccount: order.sourceAccount,
          destinationAccount: order.destinationAccount,
          purpose: order.purpose,
          isActive: order.isActive,
          lastExecutedDate: DateTime.now(),
        );
      }
    }

    _dbService.saveStandingOrders(_standingOrders);

    // Notification et confirmation e-mail de fin de mois
    recordNotificationAndEmail(
      title: 'Ordres de fin de mois exécutés',
      message: 'Les virements automatiques de fin de mois ($totalExecuted F CFA) ont été exécutés avec succès.',
      type: 'FIN_DE_MOIS',
      emailSubject: 'Avis d\'exécution automatique de fin de mois - COOPEC',
      emailBody: 'Bonjour $memberName, vos ordres automatiques de fin de mois ont été exécutés pour un montant total de $totalExecuted F CFA.',
      attachmentReference: 'RELEVE_FIN_MOIS_${DateTime.now().month}_${DateTime.now().year}.pdf',
    );

    notifyListeners();
  }

  /// Créer un nouvel ordre de virement automatique
  void createStandingOrder({
    required String title,
    required int amountXof,
    required int dayOfMonth,
    required String destinationAccount,
    required String purpose,
  }) {
    final order = StandingOrder(
      id: 'SO-${DateTime.now().millisecondsSinceEpoch}',
      title: title,
      amountXof: amountXof,
      dayOfMonth: dayOfMonth,
      sourceAccount: 'Compte Courant',
      destinationAccount: destinationAccount,
      purpose: purpose,
      isActive: true,
    );
    _standingOrders.insert(0, order);
    _dbService.saveStandingOrders(_standingOrders);
    notifyListeners();
  }

  /// Activer / Suspendre un ordre permanent
  void toggleStandingOrder(String id, bool active) {
    final idx = _standingOrders.indexWhere((o) => o.id == id);
    if (idx != -1) {
      final old = _standingOrders[idx];
      _standingOrders[idx] = StandingOrder(
        id: old.id,
        title: old.title,
        amountXof: old.amountXof,
        dayOfMonth: old.dayOfMonth,
        sourceAccount: old.sourceAccount,
        destinationAccount: old.destinationAccount,
        purpose: old.purpose,
        isActive: active,
        lastExecutedDate: old.lastExecutedDate,
      );
      _dbService.saveStandingOrders(_standingOrders);
      notifyListeners();
    }
  }

  /// Enregistrer une notification et un log d'e-mail officiel
  void recordNotificationAndEmail({
    required String title,
    required String message,
    required String type,
    String? emailSubject,
    String? emailBody,
    String? attachmentReference,
  }) {
    final notif = AppNotification(
      id: 'NOTIF-${DateTime.now().millisecondsSinceEpoch}',
      title: title,
      message: message,
      timestamp: DateTime.now(),
      type: type,
    );
    _notifications.insert(0, notif);
    _dbService.saveNotifications(_notifications);

    if (emailSubject != null) {
      final email = EmailLog(
        id: 'EML-${DateTime.now().millisecondsSinceEpoch}',
        recipientEmail: memberEmail,
        subject: emailSubject,
        bodySummary: emailBody ?? message,
        sentAt: DateTime.now(),
        attachmentReference: attachmentReference,
      );
      _emailLogs.insert(0, email);
      _dbService.saveEmailLogs(_emailLogs);
    }

    notifyListeners();
  }

  /// Marquer une notification comme lue
  void markNotificationAsRead(String notifId) {
    final idx = _notifications.indexWhere((n) => n.id == notifId);
    if (idx != -1) {
      final old = _notifications[idx];
      _notifications[idx] = AppNotification(
        id: old.id,
        title: old.title,
        message: old.message,
        timestamp: old.timestamp,
        type: old.type,
        isRead: true,
        actionRoute: old.actionRoute,
      );
      _dbService.saveNotifications(_notifications);
      notifyListeners();
    }
  }

  // --- Transactions & Virements Standards ---

  bool executeTransfer({
    required String recipientName,
    required String recipientAccount,
    required int amountXof,
    required String reason,
  }) {
    if (amountXof <= 0 || amountXof > currentAccountAvailable) {
      return false;
    }

    currentAccountBalance -= amountXof;
    final txId = 'VIR-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';

    _transactions.insert(
      0,
      TransactionRecord(
        id: txId,
        title: 'Virement vers $recipientName',
        category: 'Virement',
        subtitle: 'Compte : $recipientAccount • $reason',
        date: DateTime.now(),
        amountXof: amountXof,
        type: TransactionType.debit,
        reference: txId,
      ),
    );

    recordNotificationAndEmail(
      title: 'Virement de fonds effectué',
      message: 'Débit de $amountXof F vers $recipientName ($recipientAccount).',
      type: 'DEBIT',
      emailSubject: 'Avis de débit virement - COOPEC Mobile',
      emailBody: 'Votre virement de $amountXof F CFA vers $recipientName a été traité avec succès.',
      attachmentReference: '$txId.pdf',
    );

    notifyListeners();
    return true;
  }

  void updateCardSettings({
    bool? isLocked,
    bool? isContactless,
    bool? isOnlinePayment,
    int? dailyLimit,
    int? monthlyLimit,
  }) {
    if (isLocked != null) isCardLocked = isLocked;
    if (isContactless != null) isContactlessActive = isContactless;
    if (isOnlinePayment != null) isOnlinePaymentActive = isOnlinePayment;
    if (dailyLimit != null) cardDailyWithdrawalLimit = dailyLimit;
    if (monthlyLimit != null) cardMonthlyPaymentLimit = monthlyLimit;
    notifyListeners();
  }

  void orderChequeBook({required int numberOfLeaves, required String agency}) {
    final orderId = 'CHQ-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
    _chequeOrders.insert(
      0,
      ChequeOrderRecord(
        id: orderId,
        numberOfLeaves: numberOfLeaves,
        agency: agency,
        orderDate: DateTime.now(),
      ),
    );
    notifyListeners();
  }

  void createSupportTicket({
    required String subject,
    required String category,
    required String message,
  }) {
    final ticketId = 'TCK-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
    _tickets.insert(
      0,
      SupportTicketRecord(
        id: ticketId,
        subject: subject,
        category: category,
        message: message,
        createdAt: DateTime.now(),
      ),
    );
    notifyListeners();
  }

  Future<bool> setBiometricsEnabled(bool enabled) async {
    final bioService = BiometricAuthService();
    if (enabled) {
      final success = await bioService.authenticateWithBiometrics(
        reason: 'Confirmez votre empreinte pour activer la connexion biométrique',
      );
      if (success) {
        await bioService.saveEnrolledCredentials(memberCode, 'jwt-session-token-coop-2026');
        isBiometricEnabled = true;
        notifyListeners();
        return true;
      }
      return false;
    } else {
      await bioService.disableBiometrics();
      isBiometricEnabled = false;
      notifyListeners();
      return true;
    }
  }

  void updatePreferences({
    bool? darkMode,
    String? language,
    bool? pushNotifications,
    bool? smsAlerts,
    int? transferLimit,
  }) {
    if (darkMode != null) isDarkMode = darkMode;
    if (language != null) currentLanguage = language;
    if (pushNotifications != null) pushNotificationsEnabled = pushNotifications;
    if (smsAlerts != null) smsAlertsEnabled = smsAlerts;
    if (transferLimit != null) dailyTransferLimit = transferLimit;
    notifyListeners();
  }

  void updateMemberProfile({String? phone, String? email}) {
    if (phone != null && phone.isNotEmpty) memberPhone = phone;
    if (email != null && email.isNotEmpty) memberEmail = email;
    notifyListeners();
  }
}
