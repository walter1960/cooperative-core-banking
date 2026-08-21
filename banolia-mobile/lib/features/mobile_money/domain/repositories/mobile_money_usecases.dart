import '../entities/mobile_money_entities.dart';

abstract class MobileMoneyGateway {
  MobileMoneyProvider get provider;

  Future<PaymentInitiationResult> initiateDeposit(DepositRequest request);
  Future<PaymentInitiationResult> initiateWithdrawal(WithdrawalRequest request);
  Future<PaymentStatusResult> checkStatus({
    required String transactionRef,
    required String? operatorTxId,
  });
  Future<WebhookParseResult> parseAndValidateWebhook({
    required Map<String, dynamic> rawPayload,
    required Map<String, String> headers,
  });
}

class InitiateMobileMoneyDepositUseCase {
  final MobileMoneyGateway gateway;
  InitiateMobileMoneyDepositUseCase(this.gateway);

  Future<PaymentInitiationResult> call(DepositRequest request) {
    if (request.amount.amountXof <= 0) {
      throw ArgumentError('Le montant du dépôt doit être strictement positif');
    }
    return gateway.initiateDeposit(request);
  }
}

class InitiateMobileMoneyWithdrawalUseCase {
  final MobileMoneyGateway gateway;
  InitiateMobileMoneyWithdrawalUseCase(this.gateway);

  Future<PaymentInitiationResult> call(WithdrawalRequest request) {
    if (request.amount.amountXof <= 0) {
      throw ArgumentError('Le montant du retrait doit être strictement positif');
    }
    return gateway.initiateWithdrawal(request);
  }
}

class PollTransactionStatusUseCase {
  final MobileMoneyGateway gateway;
  PollTransactionStatusUseCase(this.gateway);

  Future<PaymentStatusResult> call({
    required String transactionRef,
    required String? operatorTxId,
  }) {
    return gateway.checkStatus(transactionRef: transactionRef, operatorTxId: operatorTxId);
  }
}

class ProcessGatewayWebhookUseCase {
  final MobileMoneyGateway gateway;
  ProcessGatewayWebhookUseCase(this.gateway);

  Future<WebhookParseResult> call({
    required Map<String, dynamic> rawPayload,
    required Map<String, String> headers,
  }) {
    return gateway.parseAndValidateWebhook(rawPayload: rawPayload, headers: headers);
  }
}
