import '../../../../core/value_objects/date_range.dart';
import '../../../../core/value_objects/member_code.dart';
import '../../../../core/value_objects/money.dart';

enum MemberStatus { actif, suspendu, radie, decede }

class Member {
  final String id;
  final MemberCode code;
  final String manualNumber;
  final String fullName;
  final String phone;
  final String address;
  final String city;
  final DateTime registrationDate;
  final int sharesPurchased;
  final int sharesAvailable;
  final Money shareUnitPrice;
  final MemberStatus status;
  final String? avatarUrl;

  const Member({
    required this.id,
    required this.code,
    required this.manualNumber,
    required this.fullName,
    required this.phone,
    required this.address,
    required this.city,
    required this.registrationDate,
    required this.sharesPurchased,
    required this.sharesAvailable,
    required this.shareUnitPrice,
    required this.status,
    this.avatarUrl,
  });

  Money get totalShareCapital => shareUnitPrice * sharesPurchased;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Member &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          code == other.code &&
          fullName == other.fullName;

  @override
  int get hashCode => Object.hash(id, code, fullName);
}

/// Triple Balance Model (Solde Réel, Solde Gelé, Solde Disponible)
class TripleBalance {
  final Money realBalance; // Total cumulative liquid balance
  final Money frozenBalance; // Pledged collateral / guarantee holds
  final Money availableBalance; // Available for withdrawal (Real - Frozen)

  const TripleBalance({
    required this.realBalance,
    required this.frozenBalance,
    required this.availableBalance,
  });

  factory TripleBalance.compute({
    required Money real,
    required Money frozen,
  }) {
    final available = real - frozen;
    return TripleBalance(
      realBalance: real,
      frozenBalance: frozen,
      availableBalance: available.isNegative ? Money.zero : available,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TripleBalance &&
          runtimeType == other.runtimeType &&
          realBalance == other.realBalance &&
          frozenBalance == other.frozenBalance &&
          availableBalance == other.availableBalance;

  @override
  int get hashCode => Object.hash(realBalance, frozenBalance, availableBalance);
}

enum AccountType {
  savingsOrdinary, // 251100 Epargne Ordinaire / DAV
  savingsLivret, // 252000 Livret Rémunéré
  termDeposit, // 253000 DAT
  collateralHold, // 254000 Nantissements & Dépôts de Garantie
  tontine, // 258000 Compte d'Attente Tontine
  shares, // 101100 Parts Sociales
  loan, // 201100 Crédits Décaissés
  projectPlan, // 253310 Plan Épargne Projet
}

enum AccountStatus { actif, bloque, solde, dormant }

class Account {
  final String id;
  final String accountNumber;
  final String memberCode;
  final String productCode;
  final String productName;
  final AccountType accountType;
  final TripleBalance balance;
  final AccountStatus status;
  final DateTime createdAt;

  const Account({
    required this.id,
    required this.accountNumber,
    required this.memberCode,
    required this.productCode,
    required this.productName,
    required this.accountType,
    required this.balance,
    required this.status,
    required this.createdAt,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Account &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          accountNumber == other.accountNumber;

  @override
  int get hashCode => Object.hash(id, accountNumber);
}

enum TransactionType {
  deposit,
  withdrawal,
  sharePurchase,
  loanDisbursement,
  loanRepayment,
  tontineCotisation,
  transfer,
  mobileMoneyCashIn,
  mobileMoneyCashOut,
  interestCredit,
  feeDebit,
}

enum PaymentMethod {
  cash,
  tmoney,
  flooz,
  wave,
  mtnMomo,
  orangeMoney,
  internalTransfer,
}

class Transaction {
  final String id;
  final String receiptNumber;
  final String accountNumber;
  final String memberCode;
  final TransactionType type;
  final Money amount;
  final Money feeAmount;
  final PaymentMethod paymentMethod;
  final String description;
  final DateTime timestamp;
  final String idempotencyKey;
  final String? remoteReference;
  final bool isCredit;

  const Transaction({
    required this.id,
    required this.receiptNumber,
    required this.accountNumber,
    required this.memberCode,
    required this.type,
    required this.amount,
    required this.feeAmount,
    required this.paymentMethod,
    required this.description,
    required this.timestamp,
    required this.idempotencyKey,
    this.remoteReference,
    required this.isCredit,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Transaction &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          receiptNumber == other.receiptNumber;

  @override
  int get hashCode => Object.hash(id, receiptNumber);
}

class StatementDocument {
  final Account account;
  final DateRange period;
  final Money openingBalance;
  final Money closingBalance;
  final Money totalCredits;
  final Money totalDebits;
  final List<Transaction> transactions;
  final DateTime generatedAt;

  const StatementDocument({
    required this.account,
    required this.period,
    required this.openingBalance,
    required this.closingBalance,
    required this.totalCredits,
    required this.totalDebits,
    required this.transactions,
    required this.generatedAt,
  });
}
