import '../../../../core/network/api_client.dart';
import '../../../../core/storage/local_database.dart';
import '../../../../core/value_objects/date_range.dart';
import '../../../../core/value_objects/member_code.dart';
import '../../../../core/value_objects/money.dart';
import '../domain/entities/member_portal_entities.dart';
import '../domain/repositories/member_portal_usecases.dart';

class MemberModel extends Member {
  const MemberModel({
    required super.id,
    required super.code,
    required super.manualNumber,
    required super.fullName,
    required super.phone,
    required super.address,
    required super.city,
    required super.registrationDate,
    required super.sharesPurchased,
    required super.sharesAvailable,
    required super.shareUnitPrice,
    required super.status,
    super.avatarUrl,
  });

  factory MemberModel.fromJson(Map<String, dynamic> json) {
    return MemberModel(
      id: json['id'] as String,
      code: MemberCode(json['code'] as String),
      manualNumber: json['manual_number'] as String,
      fullName: json['full_name'] as String,
      phone: json['phone'] as String,
      address: json['address'] as String,
      city: json['city'] as String,
      registrationDate: DateTime.parse(json['registration_date'] as String),
      sharesPurchased: json['shares_purchased'] as int,
      sharesAvailable: json['shares_available'] as int,
      shareUnitPrice: Money(json['share_unit_price'] as int),
      status: MemberStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => MemberStatus.actif,
      ),
      avatarUrl: json['avatar_url'] as String?,
    );
  }
}

class AccountModel extends Account {
  const AccountModel({
    required super.id,
    required super.accountNumber,
    required super.memberCode,
    required super.productCode,
    required super.productName,
    required super.accountType,
    required super.balance,
    required super.status,
    required super.createdAt,
  });

  factory AccountModel.fromJson(Map<String, dynamic> json) {
    final real = Money(json['real_balance'] as int? ?? 0);
    final frozen = Money(json['frozen_balance'] as int? ?? 0);
    final balance = TripleBalance.compute(real: real, frozen: frozen);

    return AccountModel(
      id: json['id'] as String,
      accountNumber: json['account_number'] as String,
      memberCode: json['member_code'] as String,
      productCode: json['product_code'] as String,
      productName: json['product_name'] as String,
      accountType: AccountType.values.firstWhere(
        (e) => e.name == json['account_type'],
        orElse: () => AccountType.savingsOrdinary,
      ),
      balance: balance,
      status: AccountStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => AccountStatus.actif,
      ),
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

class TransactionModel extends Transaction {
  const TransactionModel({
    required super.id,
    required super.receiptNumber,
    required super.accountNumber,
    required super.memberCode,
    required super.type,
    required super.amount,
    required super.feeAmount,
    required super.paymentMethod,
    required super.description,
    required super.timestamp,
    required super.idempotencyKey,
    super.remoteReference,
    required super.isCredit,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: json['id'] as String,
      receiptNumber: json['receipt_number'] as String,
      accountNumber: json['account_number'] as String,
      memberCode: json['member_code'] as String,
      type: TransactionType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => TransactionType.deposit,
      ),
      amount: Money(json['amount'] as int),
      feeAmount: Money(json['fee_amount'] as int? ?? 0),
      paymentMethod: PaymentMethod.values.firstWhere(
        (e) => e.name == json['payment_method'],
        orElse: () => PaymentMethod.cash,
      ),
      description: json['description'] as String,
      timestamp: DateTime.parse(json['timestamp'] as String),
      idempotencyKey: json['idempotency_key'] as String,
      remoteReference: json['remote_reference'] as String?,
      isCredit: json['is_credit'] as bool? ?? true,
    );
  }
}

class MemberRepositoryImpl implements IMemberRepository {
  final ApiClient apiClient;
  final LocalDatabase localDatabase;

  MemberRepositoryImpl({required this.apiClient, required this.localDatabase});

  @override
  Future<Member> getMemberProfile(String memberCode) async {
    return MemberModel(
      id: 'mem-$memberCode',
      code: MemberCode(memberCode),
      manualNumber: '883',
      fullName: 'AMEGNINOU ABLAVI',
      phone: '+228 90 12 34 56',
      address: 'Grand Marché, Hall Tissus',
      city: 'Lomé',
      registrationDate: DateTime(2023, 1, 15),
      sharesPurchased: 10,
      sharesAvailable: 10,
      shareUnitPrice: const Money(10000), // 10 000 XOF per share
      status: MemberStatus.actif,
    );
  }

  @override
  Future<void> updateMemberProfile(Member member) async {
    // In-memory or remote update
  }
}

class AccountRepositoryImpl implements IAccountRepository {
  final ApiClient apiClient;
  final LocalDatabase localDatabase;

  AccountRepositoryImpl({required this.apiClient, required this.localDatabase});

  @override
  Future<List<Account>> getMemberAccounts(String memberCode) async {
    // Standard suite of member accounts
    return [
      AccountModel(
        id: 'acc-251100-01',
        accountNumber: '251100${memberCode}01',
        memberCode: memberCode,
        productCode: '251100',
        productName: 'Épargne Libre / Dépôt à Vue',
        accountType: AccountType.savingsOrdinary,
        balance: TripleBalance.compute(real: const Money(250000), frozen: const Money(50000)),
        status: AccountStatus.actif,
        createdAt: DateTime(2023, 1, 15),
      ),
      AccountModel(
        id: 'acc-101100-01',
        accountNumber: '101100${memberCode}01',
        memberCode: memberCode,
        productCode: '101100',
        productName: 'Parts Sociales Souscrites',
        accountType: AccountType.shares,
        balance: TripleBalance.compute(real: const Money(100000), frozen: const Money(100000)),
        status: AccountStatus.actif,
        createdAt: DateTime(2023, 1, 15),
      ),
      AccountModel(
        id: 'acc-258000-01',
        accountNumber: '258000${memberCode}01',
        memberCode: memberCode,
        productCode: '258000',
        productName: 'Tontine Journalière (Cycle en cours)',
        accountType: AccountType.tontine,
        balance: TripleBalance.compute(real: const Money(15000), frozen: Money.zero),
        status: AccountStatus.actif,
        createdAt: DateTime(2026, 8, 1),
      ),
      AccountModel(
        id: 'acc-253000-01',
        accountNumber: '253000${memberCode}01',
        memberCode: memberCode,
        productCode: '253000',
        productName: 'Dépôt à Terme (DAT 12 Mois)',
        accountType: AccountType.termDeposit,
        balance: TripleBalance.compute(real: const Money(500000), frozen: const Money(500000)),
        status: AccountStatus.actif,
        createdAt: DateTime(2026, 1, 1),
      ),
    ];
  }

  @override
  Future<TripleBalance> getAccountBalances(String accountId) async {
    final accounts = await getMemberAccounts('130049');
    final match = accounts.firstWhere((a) => a.id == accountId, orElse: () => accounts.first);
    return match.balance;
  }
}

class TransactionRepositoryImpl implements ITransactionRepository {
  final ApiClient apiClient;
  final LocalDatabase localDatabase;

  TransactionRepositoryImpl({required this.apiClient, required this.localDatabase});

  @override
  Future<List<Transaction>> getTransactionHistory({
    required String accountId,
    DateRange? dateRange,
    TransactionType? type,
    int limit = 50,
  }) async {
    final now = DateTime.now();
    final sampleTx = [
      TransactionModel(
        id: 'tx-001',
        receiptNumber: 'REC-20260820-001',
        accountNumber: '25110013004901',
        memberCode: '130049',
        type: TransactionType.deposit,
        amount: const Money(50000),
        feeAmount: Money.zero,
        paymentMethod: PaymentMethod.cash,
        description: 'Prélèvement (Août 2026)',
        timestamp: now.subtract(const Duration(hours: 2)),
        idempotencyKey: 'idemp-tx-001',
        remoteReference: 'PAIE-ASECNA-2026-08',
        isCredit: true,
      ),
      TransactionModel(
        id: 'tx-002',
        receiptNumber: 'REC-20260819-014',
        accountNumber: '25110013004901',
        memberCode: '130049',
        type: TransactionType.tontineCotisation,
        amount: const Money(2000),
        feeAmount: Money.zero,
        paymentMethod: PaymentMethod.cash,
        description: 'Prélèvement Cotisation Tontine',
        timestamp: now.subtract(const Duration(days: 1)),
        idempotencyKey: 'idemp-tx-002',
        isCredit: true,
      ),
      TransactionModel(
        id: 'tx-003',
        receiptNumber: 'REC-20260815-089',
        accountNumber: '25110013004901',
        memberCode: '130049',
        type: TransactionType.withdrawal,
        amount: const Money(20000),
        feeAmount: const Money(200),
        paymentMethod: PaymentMethod.cash,
        description: 'Retrait Guichet Agence Siège',
        timestamp: now.subtract(const Duration(days: 5)),
        idempotencyKey: 'idemp-tx-003',
        isCredit: false,
      ),
    ];

    return sampleTx.where((tx) {
      if (dateRange != null && !dateRange.contains(tx.timestamp)) return false;
      if (type != null && tx.type != type) return false;
      return true;
    }).toList();
  }

  @override
  Future<StatementDocument> generateStatement({
    required String accountId,
    required DateRange period,
  }) async {
    final transactions = await getTransactionHistory(accountId: accountId, dateRange: period);
    final account = AccountModel(
      id: accountId,
      accountNumber: '25110013004901',
      memberCode: '130049',
      productCode: '251100',
      productName: 'Compte Épargne Ordinaire',
      accountType: AccountType.savingsOrdinary,
      balance: TripleBalance.compute(real: const Money(250000), frozen: const Money(50000)),
      status: AccountStatus.actif,
      createdAt: DateTime(2023, 1, 15),
    );

    Money credits = Money.zero;
    Money debits = Money.zero;
    for (final tx in transactions) {
      if (tx.isCredit) {
        credits = credits + tx.amount;
      } else {
        debits = debits + tx.amount + tx.feeAmount;
      }
    }

    final opening = const Money(200000);
    final closing = opening + credits - debits;

    return StatementDocument(
      account: account,
      period: period,
      openingBalance: opening,
      closingBalance: closing,
      totalCredits: credits,
      totalDebits: debits,
      transactions: transactions,
      generatedAt: DateTime.now(),
    );
  }
}
