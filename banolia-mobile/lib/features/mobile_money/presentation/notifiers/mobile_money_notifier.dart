import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import '../../../../core/value_objects/money.dart';
import '../../domain/entities/mobile_money_entities.dart';
import '../../domain/repositories/mobile_money_usecases.dart';

class MobileMoneyNotifier extends ChangeNotifier {
  final InitiateMobileMoneyDepositUseCase initiateDepositUseCase;
  final InitiateMobileMoneyWithdrawalUseCase initiateWithdrawalUseCase;
  final PollTransactionStatusUseCase pollStatusUseCase;

  MobileMoneyProvider _selectedProvider = MobileMoneyProvider.tmoney;
  PaymentStatus? _currentStatus;
  PaymentInitiationResult? _lastInitiationResult;
  PaymentStatusResult? _lastStatusResult;
  bool _isLoading = false;
  String? _errorMessage;

  MobileMoneyNotifier({
    required this.initiateDepositUseCase,
    required this.initiateWithdrawalUseCase,
    required this.pollStatusUseCase,
  });

  MobileMoneyProvider get selectedProvider => _selectedProvider;
  PaymentStatus? get currentStatus => _currentStatus;
  PaymentInitiationResult? get lastInitiationResult => _lastInitiationResult;
  PaymentStatusResult? get lastStatusResult => _lastStatusResult;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  void selectProvider(MobileMoneyProvider provider) {
    _selectedProvider = provider;
    notifyListeners();
  }

  Future<PaymentInitiationResult?> initiateDeposit({
    required String memberCode,
    required String accountNumber,
    required String customerMsisdn,
    required Money amount,
    String? description,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final req = DepositRequest(
        idempotencyKey: 'idemp_dep_${DateTime.now().millisecondsSinceEpoch}_${const Uuid().v4().substring(0, 6)}',
        memberCode: memberCode,
        accountNumber: accountNumber,
        customerMsisdn: customerMsisdn,
        amount: amount,
        customDescription: description,
      );

      final result = await initiateDepositUseCase(req);
      _lastInitiationResult = result;
      _currentStatus = result.initialStatus;
      return result;
    } catch (e) {
      _errorMessage = e.toString();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<PaymentInitiationResult?> initiateWithdrawal({
    required String memberCode,
    required String accountNumber,
    required String recipientMsisdn,
    required Money amount,
    required String pinAuthToken,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final req = WithdrawalRequest(
        idempotencyKey: 'idemp_wth_${DateTime.now().millisecondsSinceEpoch}_${const Uuid().v4().substring(0, 6)}',
        memberCode: memberCode,
        accountNumber: accountNumber,
        recipientMsisdn: recipientMsisdn,
        amount: amount,
        pinAuthToken: pinAuthToken,
      );

      final result = await initiateWithdrawalUseCase(req);
      _lastInitiationResult = result;
      _currentStatus = result.initialStatus;
      return result;
    } catch (e) {
      _errorMessage = e.toString();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<PaymentStatusResult?> checkStatus(String txRef, [String? opTxId]) async {
    try {
      final res = await pollStatusUseCase(transactionRef: txRef, operatorTxId: opTxId);
      _lastStatusResult = res;
      _currentStatus = res.status;
      notifyListeners();
      return res;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return null;
    }
  }
}
