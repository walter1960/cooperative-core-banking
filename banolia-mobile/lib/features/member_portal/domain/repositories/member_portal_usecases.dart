import '../../../../core/value_objects/date_range.dart';
import '../entities/member_portal_entities.dart';

abstract class IMemberRepository {
  Future<Member> getMemberProfile(String memberCode);
  Future<void> updateMemberProfile(Member member);
}

abstract class IAccountRepository {
  Future<List<Account>> getMemberAccounts(String memberCode);
  Future<TripleBalance> getAccountBalances(String accountId);
}

abstract class ITransactionRepository {
  Future<List<Transaction>> getTransactionHistory({
    required String accountId,
    DateRange? dateRange,
    TransactionType? type,
    int limit = 50,
  });
  Future<StatementDocument> generateStatement({
    required String accountId,
    required DateRange period,
  });
}

class GetMemberProfileUseCase {
  final IMemberRepository repository;
  GetMemberProfileUseCase(this.repository);

  Future<Member> call(String memberCode) => repository.getMemberProfile(memberCode);
}

class GetAccountBalancesUseCase {
  final IAccountRepository repository;
  GetAccountBalancesUseCase(this.repository);

  Future<TripleBalance> call(String accountId) => repository.getAccountBalances(accountId);
}

class GetMemberAccountsUseCase {
  final IAccountRepository repository;
  GetMemberAccountsUseCase(this.repository);

  Future<List<Account>> call(String memberCode) => repository.getMemberAccounts(memberCode);
}

class GetTransactionHistoryUseCase {
  final ITransactionRepository repository;
  GetTransactionHistoryUseCase(this.repository);

  Future<List<Transaction>> call({
    required String accountId,
    DateRange? dateRange,
    TransactionType? type,
    int limit = 50,
  }) {
    return repository.getTransactionHistory(
      accountId: accountId,
      dateRange: dateRange,
      type: type,
      limit: limit,
    );
  }
}

class GenerateAccountStatementUseCase {
  final IAccountRepository accountRepository;
  final ITransactionRepository transactionRepository;

  GenerateAccountStatementUseCase({
    required this.accountRepository,
    required this.transactionRepository,
  });

  Future<StatementDocument> call({
    required String accountId,
    required DateRange period,
  }) async {
    return transactionRepository.generateStatement(accountId: accountId, period: period);
  }
}
