import 'package:flutter_test/flutter_test.dart';
import 'package:banolia_mobile/core/value_objects/date_range.dart';
import 'package:banolia_mobile/core/value_objects/money.dart';
import 'package:banolia_mobile/features/member_portal/domain/entities/member_portal_entities.dart';
import 'package:banolia_mobile/features/member_portal/domain/repositories/member_portal_usecases.dart';
import 'package:banolia_mobile/features/member_portal/data/member_portal_data.dart';
import 'package:banolia_mobile/features/member_portal/presentation/notifiers/member_portal_notifiers.dart';
import 'package:banolia_mobile/core/network/api_client.dart';
import 'package:banolia_mobile/core/network/network_info.dart';
import 'package:banolia_mobile/core/storage/local_database.dart';
import 'package:http/http.dart' as http;

void main() {
  group('Member Portal Domain & Triple Balance Invariants', () {
    test('TripleBalance computes Available Balance = Real - Frozen', () {
      final balance = TripleBalance.compute(
        real: const Money(250000),
        frozen: const Money(50000),
      );

      expect(balance.realBalance, equals(const Money(250000)));
      expect(balance.frozenBalance, equals(const Money(50000)));
      expect(balance.availableBalance, equals(const Money(200000)));
    });

    test('Available balance is clamped to 0 if frozen exceeds real balance', () {
      final balance = TripleBalance.compute(
        real: const Money(30000),
        frozen: const Money(50000),
      );

      expect(balance.availableBalance, equals(Money.zero));
    });

    test('Statement generator accurately calculates opening, credits, debits, and closing balance', () async {
      final localDb = LocalDatabase();
      final apiClient = ApiClient(httpClient: http.Client(), networkInfo: AlwaysOnlineNetworkInfo());
      final accountRepo = AccountRepositoryImpl(apiClient: apiClient, localDatabase: localDb);
      final txRepo = TransactionRepositoryImpl(apiClient: apiClient, localDatabase: localDb);

      final generateStatementUseCase = GenerateAccountStatementUseCase(
        accountRepository: accountRepo,
        transactionRepository: txRepo,
      );

      final period = DateRange(
        startDate: DateTime.now().subtract(const Duration(days: 30)),
        endDate: DateTime.now(),
      );

      final statement = await generateStatementUseCase(
        accountId: 'acc-251100-01',
        period: period,
      );

      expect(statement.account.productCode, equals('251100'));
      expect(statement.transactions.isNotEmpty, isTrue);
      expect(statement.totalCredits.amountXof, greaterThan(0));
      expect(statement.closingBalance, equals(statement.openingBalance + statement.totalCredits - statement.totalDebits));
    });

    test('MemberPortalNotifier loads dashboard and computes aggregated savings', () async {
      final localDb = LocalDatabase();
      final apiClient = ApiClient(httpClient: http.Client(), networkInfo: AlwaysOnlineNetworkInfo());
      final memberRepo = MemberRepositoryImpl(apiClient: apiClient, localDatabase: localDb);
      final accountRepo = AccountRepositoryImpl(apiClient: apiClient, localDatabase: localDb);
      final txRepo = TransactionRepositoryImpl(apiClient: apiClient, localDatabase: localDb);

      final notifier = MemberPortalNotifier(
        getMemberProfileUseCase: GetMemberProfileUseCase(memberRepo),
        getMemberAccountsUseCase: GetMemberAccountsUseCase(accountRepo),
        getTransactionHistoryUseCase: GetTransactionHistoryUseCase(txRepo),
        generateAccountStatementUseCase: GenerateAccountStatementUseCase(
          accountRepository: accountRepo,
          transactionRepository: txRepo,
        ),
      );

      await notifier.loadDashboard('A0200389');

      expect(notifier.member, isNotNull);
      expect(notifier.member!.code.value, equals('A0200389'));
      expect(notifier.accounts.length, equals(4));
      expect(notifier.aggregatedSavingsBalance.realBalance.amountXof, greaterThan(0));
    });
  });
}
