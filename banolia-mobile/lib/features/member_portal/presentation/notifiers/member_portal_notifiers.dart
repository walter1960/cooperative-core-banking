import 'package:flutter/foundation.dart';
import '../../../../core/value_objects/date_range.dart';
import '../../../../core/value_objects/money.dart';
import '../../domain/entities/member_portal_entities.dart';
import '../../domain/repositories/member_portal_usecases.dart';

class MemberPortalNotifier extends ChangeNotifier {
  final GetMemberProfileUseCase getMemberProfileUseCase;
  final GetMemberAccountsUseCase getMemberAccountsUseCase;
  final GetTransactionHistoryUseCase getTransactionHistoryUseCase;
  final GenerateAccountStatementUseCase generateAccountStatementUseCase;

  Member? _member;
  List<Account> _accounts = [];
  Account? _selectedAccount;
  List<Transaction> _transactions = [];
  StatementDocument? _statement;
  bool _isLoading = false;
  String? _errorMessage;

  MemberPortalNotifier({
    required this.getMemberProfileUseCase,
    required this.getMemberAccountsUseCase,
    required this.getTransactionHistoryUseCase,
    required this.generateAccountStatementUseCase,
  });

  Member? get member => _member;
  List<Account> get accounts => _accounts;
  Account? get selectedAccount => _selectedAccount;
  List<Transaction> get transactions => _transactions;
  StatementDocument? get statement => _statement;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Aggregate Triple Balance across ordinary savings accounts
  TripleBalance get aggregatedSavingsBalance {
    Money totalReal = Money.zero;
    Money totalFrozen = Money.zero;

    for (final acc in _accounts) {
      if (acc.accountType == AccountType.savingsOrdinary ||
          acc.accountType == AccountType.savingsLivret ||
          acc.accountType == AccountType.termDeposit) {
        totalReal = totalReal + acc.balance.realBalance;
        totalFrozen = totalFrozen + acc.balance.frozenBalance;
      }
    }
    return TripleBalance.compute(real: totalReal, frozen: totalFrozen);
  }

  Future<void> loadDashboard(String memberCode) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _member = await getMemberProfileUseCase(memberCode);
      _accounts = await getMemberAccountsUseCase(memberCode);
      if (_accounts.isNotEmpty) {
        _selectedAccount = _accounts.first;
        await loadTransactions(_selectedAccount!.id);
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void selectAccount(Account account) {
    _selectedAccount = account;
    loadTransactions(account.id);
  }

  Future<void> loadTransactions(String accountId, {DateRange? dateRange, TransactionType? type}) async {
    _isLoading = true;
    notifyListeners();

    try {
      _transactions = await getTransactionHistoryUseCase(
        accountId: accountId,
        dateRange: dateRange,
        type: type,
      );
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> generateStatement(String accountId, DateRange period) async {
    _isLoading = true;
    notifyListeners();

    try {
      _statement = await generateAccountStatementUseCase(accountId: accountId, period: period);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
