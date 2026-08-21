import '../../../../core/value_objects/money.dart';

enum MobileMoneyProvider {
  tmoney('TMoney (Togocom)', 'TG', 'XOF', '+228'),
  flooz('Moov Flooz', 'TG_BJ_CI', 'XOF', '+228/+229/+225'),
  wave('Wave Mobile Money', 'CI_SN', 'XOF', '+225/+221'),
  mtnMomo('MTN Mobile Money', 'BJ_CI', 'XOF', '+229/+225'),
  orangeMoney('Orange Money', 'CI_SN_ML_BF', 'XOF', '+225/+221');

  final String displayName;
  final String region;
  final String currency;
  final String countryPrefixes;
  const MobileMoneyProvider(this.displayName, this.region, this.currency, this.countryPrefixes);
}

enum PaymentDirection {
  c2bDeposit, // Cash-in to Microfinance account
  b2cWithdrawal, // Cash-out / Payout to mobile wallet
}

enum PaymentStatus {
  initiated,
  pendingUserApproval,
  processing,
  successful,
  failed,
  timeout,
  cancelledByUser,
}

enum SimulationOverrideMode {
  automaticTestVectors,
  forceSuccess,
  forceInsufficientBalance,
  forceUserCancelled,
  forceTimeout,
  forceNetworkError,
  forceInvalidPin,
  forceLimitExceeded,
}

class PaymentTransaction {
  final String id;
  final String transactionRef;
  final String idempotencyKey;
  final MobileMoneyProvider provider;
  final PaymentDirection direction;
  final Money amount;
  final Money fee;
  final String customerMsisdn;
  final String memberCode;
  final String accountNumber;
  final PaymentStatus status;
  final String? operatorTxId;
  final String? failureReason;
  final DateTime createdAt;
  final DateTime? completedAt;

  const PaymentTransaction({
    required this.id,
    required this.transactionRef,
    required this.idempotencyKey,
    required this.provider,
    required this.direction,
    required this.amount,
    required this.fee,
    required this.customerMsisdn,
    required this.memberCode,
    required this.accountNumber,
    required this.status,
    this.operatorTxId,
    this.failureReason,
    required this.createdAt,
    this.completedAt,
  });

  PaymentTransaction copyWith({
    PaymentStatus? status,
    String? operatorTxId,
    String? failureReason,
    DateTime? completedAt,
  }) {
    return PaymentTransaction(
      id: id,
      transactionRef: transactionRef,
      idempotencyKey: idempotencyKey,
      provider: provider,
      direction: direction,
      amount: amount,
      fee: fee,
      customerMsisdn: customerMsisdn,
      memberCode: memberCode,
      accountNumber: accountNumber,
      status: status ?? this.status,
      operatorTxId: operatorTxId ?? this.operatorTxId,
      failureReason: failureReason ?? this.failureReason,
      createdAt: createdAt,
      completedAt: completedAt ?? this.completedAt,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PaymentTransaction &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          transactionRef == other.transactionRef;

  @override
  int get hashCode => Object.hash(id, transactionRef);
}

class DepositRequest {
  final String idempotencyKey;
  final String memberCode;
  final String accountNumber;
  final String customerMsisdn;
  final Money amount;
  final String? customDescription;

  const DepositRequest({
    required this.idempotencyKey,
    required this.memberCode,
    required this.accountNumber,
    required this.customerMsisdn,
    required this.amount,
    this.customDescription,
  });
}

class WithdrawalRequest {
  final String idempotencyKey;
  final String memberCode;
  final String accountNumber;
  final String recipientMsisdn;
  final Money amount;
  final String pinAuthToken;

  const WithdrawalRequest({
    required this.idempotencyKey,
    required this.memberCode,
    required this.accountNumber,
    required this.recipientMsisdn,
    required this.amount,
    required this.pinAuthToken,
  });
}

class PaymentInitiationResult {
  final bool success;
  final String transactionRef;
  final PaymentStatus initialStatus;
  final String? operatorGatewayRef;
  final String? actionPromptMessage;
  final String? deepLinkUrl;
  final String? errorMessage;

  const PaymentInitiationResult({
    required this.success,
    required this.transactionRef,
    required this.initialStatus,
    this.operatorGatewayRef,
    this.actionPromptMessage,
    this.deepLinkUrl,
    this.errorMessage,
  });
}

class PaymentStatusResult {
  final String transactionRef;
  final PaymentStatus status;
  final String? operatorTxId;
  final Money? settledAmount;
  final Money? operatorFee;
  final String? failureCode;
  final String? failureMessage;

  const PaymentStatusResult({
    required this.transactionRef,
    required this.status,
    this.operatorTxId,
    this.settledAmount,
    this.operatorFee,
    this.failureCode,
    this.failureMessage,
  });
}

class WebhookParseResult {
  final bool isValidSignature;
  final String transactionRef;
  final PaymentStatus status;
  final String? operatorTxId;
  final Money amount;
  final String rawEvent;

  const WebhookParseResult({
    required this.isValidSignature,
    required this.transactionRef,
    required this.status,
    this.operatorTxId,
    required this.amount,
    required this.rawEvent,
  });
}
