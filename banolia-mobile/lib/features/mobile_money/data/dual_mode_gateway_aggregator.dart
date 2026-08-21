import '../domain/entities/mobile_money_entities.dart';
import '../domain/repositories/mobile_money_usecases.dart';
import 'real_http_gateway_adapter.dart';
import 'sandbox_simulation_engine.dart';

/// Aggregator allowing runtime switching between Sandbox and Real Gateways
class DualModeGatewayAggregator implements MobileMoneyGateway {
  final SandboxSimulationEngine sandboxEngine;
  final RealHttpGatewayAdapter realAdapter;
  bool isSandboxMode;

  DualModeGatewayAggregator({
    required this.sandboxEngine,
    required this.realAdapter,
    this.isSandboxMode = true,
  });

  MobileMoneyGateway get _activeGateway => isSandboxMode ? sandboxEngine : realAdapter;

  @override
  MobileMoneyProvider get provider => _activeGateway.provider;

  @override
  Future<PaymentInitiationResult> initiateDeposit(DepositRequest request) {
    return _activeGateway.initiateDeposit(request);
  }

  @override
  Future<PaymentInitiationResult> initiateWithdrawal(WithdrawalRequest request) {
    return _activeGateway.initiateWithdrawal(request);
  }

  @override
  Future<PaymentStatusResult> checkStatus({
    required String transactionRef,
    required String? operatorTxId,
  }) {
    return _activeGateway.checkStatus(transactionRef: transactionRef, operatorTxId: operatorTxId);
  }

  @override
  Future<WebhookParseResult> parseAndValidateWebhook({
    required Map<String, dynamic> rawPayload,
    required Map<String, String> headers,
  }) {
    return _activeGateway.parseAndValidateWebhook(rawPayload: rawPayload, headers: headers);
  }
}
