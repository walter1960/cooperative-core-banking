import 'dart:convert';
import '../../../../core/value_objects/money.dart';
import '../domain/entities/mobile_money_entities.dart';
import '../domain/repositories/mobile_money_usecases.dart';

/// High-Fidelity Deterministic Sandbox Simulation Engine for Mobile Money
class SandboxSimulationEngine implements MobileMoneyGateway {
  @override
  final MobileMoneyProvider provider;

  final Map<String, PaymentTransaction> _inMemoryTransactions = {};
  SimulationOverrideMode overrideMode = SimulationOverrideMode.automaticTestVectors;
  Duration simulatedDelay = const Duration(milliseconds: 10); // default fast for unit tests

  SandboxSimulationEngine({required this.provider});

  PaymentStatus _resolveOutcome(String msisdn, int amount) {
    if (overrideMode != SimulationOverrideMode.automaticTestVectors) {
      switch (overrideMode) {
        case SimulationOverrideMode.forceSuccess:
          return PaymentStatus.successful;
        case SimulationOverrideMode.forceInsufficientBalance:
        case SimulationOverrideMode.forceNetworkError:
        case SimulationOverrideMode.forceInvalidPin:
          return PaymentStatus.failed;
        case SimulationOverrideMode.forceUserCancelled:
          return PaymentStatus.cancelledByUser;
        case SimulationOverrideMode.forceTimeout:
          return PaymentStatus.timeout;
        case SimulationOverrideMode.forceLimitExceeded:
          return PaymentStatus.failed;
        default:
          return PaymentStatus.successful;
      }
    }

    // Amount-based triggers
    if (amount == 99999) return PaymentStatus.failed; // Limit exceeded
    if (amount == 50000) return PaymentStatus.failed; // Network error

    // MSISDN deterministic vectors
    final cleanPhone = msisdn.replaceAll(RegExp(r'[\s\-]'), '');
    if (cleanPhone.endsWith('0000001') || cleanPhone.endsWith('0000099')) {
      return PaymentStatus.successful;
    }
    if (cleanPhone.endsWith('0000002')) {
      return PaymentStatus.failed; // Insufficient balance
    }
    if (cleanPhone.endsWith('0000003')) {
      return PaymentStatus.cancelledByUser;
    }
    if (cleanPhone.endsWith('0000004')) {
      return PaymentStatus.timeout;
    }
    if (cleanPhone.endsWith('0000005')) {
      return PaymentStatus.failed; // Invalid PIN
    }

    return PaymentStatus.successful;
  }

  String _getReasonForStatus(PaymentStatus status, String msisdn, int amount) {
    if (amount == 99999 || overrideMode == SimulationOverrideMode.forceLimitExceeded) {
      return 'LIMIT_EXCEEDED: Plafond journalier Mobile Money atteint';
    }
    if (amount == 50000 || overrideMode == SimulationOverrideMode.forceNetworkError) {
      return 'NETWORK_FAILURE: Passerelle opérateur temporairement indisponible';
    }
    if (msisdn.endsWith('0000002') || overrideMode == SimulationOverrideMode.forceInsufficientBalance) {
      return 'INSUFFICIENT_FUNDS: Solde insuffisant sur le portefeuille Mobile Money';
    }
    if (msisdn.endsWith('0000005') || overrideMode == SimulationOverrideMode.forceInvalidPin) {
      return 'INVALID_PIN: Code secret PIN incorrect';
    }
    if (status == PaymentStatus.cancelledByUser) {
      return 'USER_CANCELLED: Opération annulée par l\'utilisateur';
    }
    if (status == PaymentStatus.timeout) {
      return 'USSD_TIMEOUT: Délai d\'attente de réponse USSD dépassé';
    }
    return 'FAILED: Échec de traitement par l\'opérateur';
  }

  @override
  Future<PaymentInitiationResult> initiateDeposit(DepositRequest request) async {
    final txRef = 'TX-SIM-${provider.name.toUpperCase()}-${DateTime.now().millisecondsSinceEpoch}';
    final outcome = _resolveOutcome(request.customerMsisdn, request.amount.amountXof);

    final transaction = PaymentTransaction(
      id: 'sim-uuid-${DateTime.now().microsecondsSinceEpoch}',
      transactionRef: txRef,
      idempotencyKey: request.idempotencyKey,
      provider: provider,
      direction: PaymentDirection.c2bDeposit,
      amount: request.amount,
      fee: Money.zero,
      customerMsisdn: request.customerMsisdn,
      memberCode: request.memberCode,
      accountNumber: request.accountNumber,
      status: PaymentStatus.pendingUserApproval,
      createdAt: DateTime.now(),
    );

    _inMemoryTransactions[txRef] = transaction;

    if (simulatedDelay > Duration.zero) {
      await Future.delayed(simulatedDelay);
    }

    if (outcome != PaymentStatus.successful) {
      final reason = _getReasonForStatus(outcome, request.customerMsisdn, request.amount.amountXof);
      _inMemoryTransactions[txRef] = transaction.copyWith(
        status: outcome,
        failureReason: reason,
        completedAt: DateTime.now(),
      );
      return PaymentInitiationResult(
        success: false,
        transactionRef: txRef,
        initialStatus: outcome,
        errorMessage: reason,
      );
    }

    final updatedTx = transaction.copyWith(
      status: PaymentStatus.successful,
      operatorTxId: 'OP-SIM-${DateTime.now().millisecondsSinceEpoch}',
      completedAt: DateTime.now(),
    );
    _inMemoryTransactions[txRef] = updatedTx;

    return PaymentInitiationResult(
      success: true,
      transactionRef: txRef,
      initialStatus: PaymentStatus.successful,
      operatorGatewayRef: 'GW-SIM-REF-99',
      actionPromptMessage: 'Paiement simulé validé avec succès sur le combiné.',
    );
  }

  @override
  Future<PaymentInitiationResult> initiateWithdrawal(WithdrawalRequest request) async {
    final txRef = 'TX-SIM-OUT-${provider.name.toUpperCase()}-${DateTime.now().millisecondsSinceEpoch}';
    final outcome = _resolveOutcome(request.recipientMsisdn, request.amount.amountXof);

    final transaction = PaymentTransaction(
      id: 'sim-uuid-out-${DateTime.now().microsecondsSinceEpoch}',
      transactionRef: txRef,
      idempotencyKey: request.idempotencyKey,
      provider: provider,
      direction: PaymentDirection.b2cWithdrawal,
      amount: request.amount,
      fee: Money.zero,
      customerMsisdn: request.recipientMsisdn,
      memberCode: request.memberCode,
      accountNumber: request.accountNumber,
      status: PaymentStatus.processing,
      createdAt: DateTime.now(),
    );

    _inMemoryTransactions[txRef] = transaction;

    if (simulatedDelay > Duration.zero) {
      await Future.delayed(simulatedDelay);
    }

    if (outcome != PaymentStatus.successful) {
      final reason = _getReasonForStatus(outcome, request.recipientMsisdn, request.amount.amountXof);
      _inMemoryTransactions[txRef] = transaction.copyWith(
        status: outcome,
        failureReason: reason,
        completedAt: DateTime.now(),
      );
      return PaymentInitiationResult(
        success: false,
        transactionRef: txRef,
        initialStatus: outcome,
        errorMessage: reason,
      );
    }

    final updatedTx = transaction.copyWith(
      status: PaymentStatus.successful,
      operatorTxId: 'OP-SIM-DISBURSE-${DateTime.now().millisecondsSinceEpoch}',
      completedAt: DateTime.now(),
    );
    _inMemoryTransactions[txRef] = updatedTx;

    return PaymentInitiationResult(
      success: true,
      transactionRef: txRef,
      initialStatus: PaymentStatus.successful,
      operatorGatewayRef: 'GW-SIM-PAYOUT-88',
      actionPromptMessage: 'Retrait simulé transféré vers le portefeuille.',
    );
  }

  @override
  Future<PaymentStatusResult> checkStatus({
    required String transactionRef,
    required String? operatorTxId,
  }) async {
    final tx = _inMemoryTransactions[transactionRef];
    if (tx == null) {
      return PaymentStatusResult(
        transactionRef: transactionRef,
        status: PaymentStatus.failed,
        failureCode: 'NOT_FOUND',
        failureMessage: 'Transaction non trouvée dans le simulateur',
      );
    }
    return PaymentStatusResult(
      transactionRef: tx.transactionRef,
      status: tx.status,
      operatorTxId: tx.operatorTxId,
      settledAmount: tx.amount,
      operatorFee: tx.fee,
      failureMessage: tx.failureReason,
    );
  }

  @override
  Future<WebhookParseResult> parseAndValidateWebhook({
    required Map<String, dynamic> rawPayload,
    required Map<String, String> headers,
  }) async {
    final txRef = rawPayload['transaction_ref'] as String? ?? 'TX-UNKNOWN';
    final statusStr = rawPayload['status'] as String? ?? 'SUCCESSFUL';
    final amount = Money(rawPayload['amount'] as int? ?? 0);
    final opTxId = rawPayload['operator_tx_id'] as String?;

    PaymentStatus parsedStatus;
    switch (statusStr.toUpperCase()) {
      case 'SUCCESSFUL':
      case 'SUCCESS':
        parsedStatus = PaymentStatus.successful;
        break;
      case 'FAILED':
        parsedStatus = PaymentStatus.failed;
        break;
      case 'CANCELLED':
        parsedStatus = PaymentStatus.cancelledByUser;
        break;
      default:
        parsedStatus = PaymentStatus.processing;
    }

    return WebhookParseResult(
      isValidSignature: true,
      transactionRef: txRef,
      status: parsedStatus,
      operatorTxId: opTxId,
      amount: amount,
      rawEvent: jsonEncode(rawPayload),
    );
  }
}
