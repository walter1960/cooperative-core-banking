import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Structure d'une fiche de retrait numérique officielle
class WithdrawalSlip {
  final String id;
  final String slipNumber; // Ex: RET-2026-09-0012
  final String memberCode;
  final String memberName;
  final int amountXof;
  final String amountInWords;
  final String accountType; // 'COURANT', 'EPARGNE'
  final String agency;
  final DateTime createdAt;
  final DateTime expiresAt;
  final String qrPayload;
  final String status; // 'EMIS', 'EN_ATTENTE_GUICHET', 'PAYE', 'ANNULE'
  final String? cashierNote;

  const WithdrawalSlip({
    required this.id,
    required this.slipNumber,
    required this.memberCode,
    required this.memberName,
    required this.amountXof,
    required this.amountInWords,
    required this.accountType,
    required this.agency,
    required this.createdAt,
    required this.expiresAt,
    required this.qrPayload,
    this.status = 'EN_ATTENTE_GUICHET',
    this.cashierNote,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'slipNumber': slipNumber,
    'memberCode': memberCode,
    'memberName': memberName,
    'amountXof': amountXof,
    'amountInWords': amountInWords,
    'accountType': accountType,
    'agency': agency,
    'createdAt': createdAt.toIso8601String(),
    'expiresAt': expiresAt.toIso8601String(),
    'qrPayload': qrPayload,
    'status': status,
    'cashierNote': cashierNote,
  };

  factory WithdrawalSlip.fromJson(Map<String, dynamic> json) => WithdrawalSlip(
    id: json['id'] as String,
    slipNumber: json['slipNumber'] as String,
    memberCode: json['memberCode'] as String,
    memberName: json['memberName'] as String,
    amountXof: json['amountXof'] as int,
    amountInWords: json['amountInWords'] as String,
    accountType: json['accountType'] as String,
    agency: json['agency'] as String,
    createdAt: DateTime.parse(json['createdAt'] as String),
    expiresAt: DateTime.parse(json['expiresAt'] as String),
    qrPayload: json['qrPayload'] as String,
    status: json['status'] as String? ?? 'EN_ATTENTE_GUICHET',
    cashierNote: json['cashierNote'] as String?,
  );
}

/// Échéance d'un prêt dans le tableau d'amortissement
class LoanInstallment {
  final int number;
  final DateTime dueDate;
  final int principalXof;
  final int interestXof;
  final int totalDueXof;
  final int remainingPrincipalXof;
  final bool isPaid;
  final DateTime? paidDate;

  const LoanInstallment({
    required this.number,
    required this.dueDate,
    required this.principalXof,
    required this.interestXof,
    required this.totalDueXof,
    required this.remainingPrincipalXof,
    this.isPaid = false,
    this.paidDate,
  });

  Map<String, dynamic> toJson() => {
    'number': number,
    'dueDate': dueDate.toIso8601String(),
    'principalXof': principalXof,
    'interestXof': interestXof,
    'totalDueXof': totalDueXof,
    'remainingPrincipalXof': remainingPrincipalXof,
    'isPaid': isPaid,
    'paidDate': paidDate?.toIso8601String(),
  };

  factory LoanInstallment.fromJson(Map<String, dynamic> json) => LoanInstallment(
    number: json['number'] as int,
    dueDate: DateTime.parse(json['dueDate'] as String),
    principalXof: json['principalXof'] as int,
    interestXof: json['interestXof'] as int,
    totalDueXof: json['totalDueXof'] as int,
    remainingPrincipalXof: json['remainingPrincipalXof'] as int,
    isPaid: json['isPaid'] as bool? ?? false,
    paidDate: json['paidDate'] != null ? DateTime.parse(json['paidDate'] as String) : null,
  );
}

/// Prêt actif / historique de crédit du membre
class ActiveLoan {
  final String id;
  final String loanNumber; // Ex: CR-2026-04
  final String productName;
  final int initialAmountXof;
  final int remainingPrincipalXof;
  final int paidAmountXof;
  final double interestRate;
  final int monthlyInstallmentXof;
  final DateTime disbursementDate;
  final DateTime nextDueDate;
  final String status; // 'EN_COURS', 'SOLDE', 'EN_RETARD'
  final List<LoanInstallment> installments;
  final int durationMonths;
  final String termCategory; // 'COURT_TERME', 'MOYEN_TERME', 'LONG_TERME'

  const ActiveLoan({
    required this.id,
    required this.loanNumber,
    required this.productName,
    required this.initialAmountXof,
    required this.remainingPrincipalXof,
    required this.paidAmountXof,
    required this.interestRate,
    required this.monthlyInstallmentXof,
    required this.disbursementDate,
    required this.nextDueDate,
    this.status = 'EN_COURS',
    this.installments = const [],
    this.durationMonths = 12,
    this.termCategory = 'COURT_TERME',
  });

  bool get isLongTerm => termCategory == 'LONG_TERME' || durationMonths > 36;

  Map<String, dynamic> toJson() => {
    'id': id,
    'loanNumber': loanNumber,
    'productName': productName,
    'initialAmountXof': initialAmountXof,
    'remainingPrincipalXof': remainingPrincipalXof,
    'paidAmountXof': paidAmountXof,
    'interestRate': interestRate,
    'monthlyInstallmentXof': monthlyInstallmentXof,
    'disbursementDate': disbursementDate.toIso8601String(),
    'nextDueDate': nextDueDate.toIso8601String(),
    'status': status,
    'installments': installments.map((e) => e.toJson()).toList(),
    'durationMonths': durationMonths,
    'termCategory': termCategory,
  };

  factory ActiveLoan.fromJson(Map<String, dynamic> json) => ActiveLoan(
    id: json['id'] as String,
    loanNumber: json['loanNumber'] as String,
    productName: json['productName'] as String,
    initialAmountXof: json['initialAmountXof'] as int,
    remainingPrincipalXof: json['remainingPrincipalXof'] as int,
    paidAmountXof: json['paidAmountXof'] as int,
    interestRate: (json['interestRate'] as num).toDouble(),
    monthlyInstallmentXof: json['monthlyInstallmentXof'] as int,
    disbursementDate: DateTime.parse(json['disbursementDate'] as String),
    nextDueDate: DateTime.parse(json['nextDueDate'] as String),
    status: json['status'] as String? ?? 'EN_COURS',
    installments: (json['installments'] as List<dynamic>?)
            ?.map((e) => LoanInstallment.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [],
    durationMonths: json['durationMonths'] as int? ?? 12,
    termCategory: json['termCategory'] as String? ?? 'COURT_TERME',
  );
}

/// Dossier de demande de prêt en ligne avec workflow multi-étapes
class OnlineLoanApplication {
  final String id;
  final String applicationNumber; // Ex: DEM-CR-9821
  final String productName;
  final int requestedAmountXof;
  final int durationMonths;
  final double interestRate;
  final int estimatedMonthlyPaymentXof;
  final String purpose;
  final int monthlyIncomeXof;
  final String collateralType; // 'PRELEVEMENT_PAIE_ASECNA', 'NANTISSEMENT_EPARGNE', 'CAUTION_SOLIDAIRE', 'GAGE'
  final String guarantorName;
  final DateTime submissionDate;
  final String currentStep; // 'SOUMISE', 'INSTRUCTION_DOSSIER', 'COMITE_CREDIT', 'ACCORDE', 'DECAISSE', 'REJETE'
  final List<String> statusTimeline;
  final String termCategory; // 'COURT_TERME', 'MOYEN_TERME', 'LONG_TERME'
  final String calculationMethod; // 'LINEAIRE', 'DEGRESSIF'
  final String? attachmentName;
  final String? writtenStatement;

  const OnlineLoanApplication({
    required this.id,
    required this.applicationNumber,
    required this.productName,
    required this.requestedAmountXof,
    required this.durationMonths,
    required this.interestRate,
    required this.estimatedMonthlyPaymentXof,
    required this.purpose,
    required this.monthlyIncomeXof,
    required this.collateralType,
    required this.guarantorName,
    required this.submissionDate,
    this.currentStep = 'SOUMISE',
    this.statusTimeline = const [],
    this.termCategory = 'COURT_TERME',
    this.calculationMethod = 'LINEAIRE',
    this.attachmentName,
    this.writtenStatement,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'applicationNumber': applicationNumber,
    'productName': productName,
    'requestedAmountXof': requestedAmountXof,
    'durationMonths': durationMonths,
    'interestRate': interestRate,
    'estimatedMonthlyPaymentXof': estimatedMonthlyPaymentXof,
    'purpose': purpose,
    'monthlyIncomeXof': monthlyIncomeXof,
    'collateralType': collateralType,
    'guarantorName': guarantorName,
    'submissionDate': submissionDate.toIso8601String(),
    'currentStep': currentStep,
    'statusTimeline': statusTimeline,
    'termCategory': termCategory,
    'calculationMethod': calculationMethod,
    'attachmentName': attachmentName,
    'writtenStatement': writtenStatement,
  };

  factory OnlineLoanApplication.fromJson(Map<String, dynamic> json) => OnlineLoanApplication(
    id: json['id'] as String,
    applicationNumber: json['applicationNumber'] as String,
    productName: json['productName'] as String,
    requestedAmountXof: json['requestedAmountXof'] as int,
    durationMonths: json['durationMonths'] as int,
    interestRate: (json['interestRate'] as num).toDouble(),
    estimatedMonthlyPaymentXof: json['estimatedMonthlyPaymentXof'] as int,
    purpose: json['purpose'] as String,
    monthlyIncomeXof: json['monthlyIncomeXof'] as int,
    collateralType: json['collateralType'] as String,
    guarantorName: json['guarantorName'] as String,
    submissionDate: DateTime.parse(json['submissionDate'] as String),
    currentStep: json['currentStep'] as String? ?? 'SOUMISE',
    statusTimeline: (json['statusTimeline'] as List<dynamic>?)?.cast<String>() ?? [],
    termCategory: json['termCategory'] as String? ?? 'COURT_TERME',
    calculationMethod: json['calculationMethod'] as String? ?? 'LINEAIRE',
    attachmentName: json['attachmentName'] as String?,
    writtenStatement: json['writtenStatement'] as String?,
  );
}

/// Ordre de virement permanent / fin de mois automatique
class StandingOrder {
  final String id;
  final String title;
  final int amountXof;
  final int dayOfMonth; // Ex: 28, 30
  final String sourceAccount; // 'COURANT'
  final String destinationAccount; // 'EPARGNE', 'TONTINE', 'PRET'
  final String purpose;
  final bool isActive;
  final DateTime? lastExecutedDate;

  const StandingOrder({
    required this.id,
    required this.title,
    required this.amountXof,
    required this.dayOfMonth,
    required this.sourceAccount,
    required this.destinationAccount,
    required this.purpose,
    this.isActive = true,
    this.lastExecutedDate,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'amountXof': amountXof,
    'dayOfMonth': dayOfMonth,
    'sourceAccount': sourceAccount,
    'destinationAccount': destinationAccount,
    'purpose': purpose,
    'isActive': isActive,
    'lastExecutedDate': lastExecutedDate?.toIso8601String(),
  };

  factory StandingOrder.fromJson(Map<String, dynamic> json) => StandingOrder(
    id: json['id'] as String,
    title: json['title'] as String,
    amountXof: json['amountXof'] as int,
    dayOfMonth: json['dayOfMonth'] as int,
    sourceAccount: json['sourceAccount'] as String,
    destinationAccount: json['destinationAccount'] as String,
    purpose: json['purpose'] as String,
    isActive: json['isActive'] as bool? ?? true,
    lastExecutedDate: json['lastExecutedDate'] != null ? DateTime.parse(json['lastExecutedDate'] as String) : null,
  );
}

/// Enregistrement de notification d'opération
class AppNotification {
  final String id;
  final String title;
  final String message;
  final DateTime timestamp;
  final String type; // 'DEBIT', 'CREDIT', 'PRET', 'FIN_DE_MOIS', 'RETRAIT', 'SECURITE'
  final bool isRead;
  final String? actionRoute;

  const AppNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.timestamp,
    required this.type,
    this.isRead = false,
    this.actionRoute,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'message': message,
    'timestamp': timestamp.toIso8601String(),
    'type': type,
    'isRead': isRead,
    'actionRoute': actionRoute,
  };

  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
    id: json['id'] as String,
    title: json['title'] as String,
    message: json['message'] as String,
    timestamp: DateTime.parse(json['timestamp'] as String),
    type: json['type'] as String,
    isRead: json['isRead'] as bool? ?? false,
    actionRoute: json['actionRoute'] as String?,
  );
}

/// Journal des e-mails envoyés ("Mail en cas où")
class EmailLog {
  final String id;
  final String recipientEmail;
  final String subject;
  final String bodySummary;
  final DateTime sentAt;
  final String status; // 'ENVOYE', 'DELIVRE'
  final String? attachmentReference;

  const EmailLog({
    required this.id,
    required this.recipientEmail,
    required this.subject,
    required this.bodySummary,
    required this.sentAt,
    this.status = 'ENVOYE',
    this.attachmentReference,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'recipientEmail': recipientEmail,
    'subject': subject,
    'bodySummary': bodySummary,
    'sentAt': sentAt.toIso8601String(),
    'status': status,
    'attachmentReference': attachmentReference,
  };

  factory EmailLog.fromJson(Map<String, dynamic> json) => EmailLog(
    id: json['id'] as String,
    recipientEmail: json['recipientEmail'] as String,
    subject: json['subject'] as String,
    bodySummary: json['bodySummary'] as String,
    sentAt: DateTime.parse(json['sentAt'] as String),
    status: json['status'] as String? ?? 'ENVOYE',
    attachmentReference: json['attachmentReference'] as String?,
  );
}

/// Service d'accès aux données persistant compatible Firebase Firestore.
/// Sauvegarde en local sécurisé chiffré et prêt pour la synchronisation Cloud Firestore.
class CoopDatabaseService {
  static final CoopDatabaseService _instance = CoopDatabaseService._internal();
  factory CoopDatabaseService() => _instance;
  CoopDatabaseService._internal();

  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  // --- Sauvegarde & Chargement des Fiches de Retrait ---
  Future<void> saveWithdrawalSlips(List<WithdrawalSlip> slips) async {
    final raw = jsonEncode(slips.map((e) => e.toJson()).toList());
    await _storage.write(key: 'db_withdrawal_slips', value: raw);
  }

  Future<List<WithdrawalSlip>?> loadWithdrawalSlips() async {
    final raw = await _storage.read(key: 'db_withdrawal_slips');
    if (raw == null) return null;
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list.map((e) => WithdrawalSlip.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {
      return null;
    }
  }

  // --- Sauvegarde & Chargement des Prêts Actifs ---
  Future<void> saveActiveLoans(List<ActiveLoan> loans) async {
    final raw = jsonEncode(loans.map((e) => e.toJson()).toList());
    await _storage.write(key: 'db_active_loans', value: raw);
  }

  Future<List<ActiveLoan>?> loadActiveLoans() async {
    final raw = await _storage.read(key: 'db_active_loans');
    if (raw == null) return null;
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list.map((e) => ActiveLoan.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {
      return null;
    }
  }

  // --- Sauvegarde & Chargement des Demandes de Prêt ---
  Future<void> saveLoanApplications(List<OnlineLoanApplication> apps) async {
    final raw = jsonEncode(apps.map((e) => e.toJson()).toList());
    await _storage.write(key: 'db_loan_applications', value: raw);
  }

  Future<List<OnlineLoanApplication>?> loadLoanApplications() async {
    final raw = await _storage.read(key: 'db_loan_applications');
    if (raw == null) return null;
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list.map((e) => OnlineLoanApplication.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {
      return null;
    }
  }

  // --- Sauvegarde & Chargement des Ordres Permanents (Fin de mois) ---
  Future<void> saveStandingOrders(List<StandingOrder> orders) async {
    final raw = jsonEncode(orders.map((e) => e.toJson()).toList());
    await _storage.write(key: 'db_standing_orders', value: raw);
  }

  Future<List<StandingOrder>?> loadStandingOrders() async {
    final raw = await _storage.read(key: 'db_standing_orders');
    if (raw == null) return null;
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list.map((e) => StandingOrder.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {
      return null;
    }
  }

  // --- Sauvegarde & Chargement des Notifications ---
  Future<void> saveNotifications(List<AppNotification> notifs) async {
    final raw = jsonEncode(notifs.map((e) => e.toJson()).toList());
    await _storage.write(key: 'db_notifications', value: raw);
  }

  Future<List<AppNotification>?> loadNotifications() async {
    final raw = await _storage.read(key: 'db_notifications');
    if (raw == null) return null;
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list.map((e) => AppNotification.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {
      return null;
    }
  }

  // --- Sauvegarde & Chargement des Journaux d'Emails ---
  Future<void> saveEmailLogs(List<EmailLog> emails) async {
    final raw = jsonEncode(emails.map((e) => e.toJson()).toList());
    await _storage.write(key: 'db_email_logs', value: raw);
  }

  Future<List<EmailLog>?> loadEmailLogs() async {
    final raw = await _storage.read(key: 'db_email_logs');
    if (raw == null) return null;
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list.map((e) => EmailLog.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {
      return null;
    }
  }
}
