import 'dart:convert';
import 'package:crypto/crypto.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/value_objects/money.dart';
import '../domain/entities/mobile_money_entities.dart';
import '../domain/repositories/mobile_money_usecases.dart';

/// Real HTTP Gateway Adapter for live Mobile Money providers
class RealHttpGatewayAdapter implements MobileMoneyGateway {
  @override
  final MobileMoneyProvider provider;
  final ApiClient apiClient;
  final String apiKey;
  final String secretKey;
  final String partnerCode;

  RealHttpGatewayAdapter({
    required this.provider,
    required this.apiClient,
    this.apiKey = 'live_api_key_banolia',
    this.secretKey = 'live_secret_key_banolia_sec_98a72b',
    this.partnerCode = 'BANOLIA_COOP',
  });

  /// Generate HMAC-SHA256 signature for TMoney API
  String generateTMoneySignature({
    required String timestamp,
    required String method,
    required String path,
    required String body,
  }) {
    final payload = '$timestamp$method$path$body';
    final keyBytes = utf8.encode(secretKey);
    final dataBytes = utf8.encode(payload);
    final hmac = Hmac(sha256, keyBytes);
    return hmac.convert(dataBytes).toString();
  }

  /// Generate Flooz SHA-512 Checksum
  String generateFloozChecksum({
    required String reference,
    required int amount,
    required String msisdn,
  }) {
    final payload = '$partnerCode$secretKey$reference$amount$msisdn';
    final bytes = utf8.encode(payload);
    final digest = sha512.convert(bytes);
    return digest.toString();
  }

  /// Validate Wave Webhook HMAC-SHA256 signature
  bool validateWaveSignature({
    required String waveSignatureHeader, // Format: t=1724115932,v1=a67f...
    required String rawBody,
  }) {
    try {
      final parts = waveSignatureHeader.split(',');
      String? timestamp;
      String? v1Signature;

      for (final part in parts) {
        final kv = part.split('=');
        if (kv.length == 2) {
          if (kv[0].trim() == 't') timestamp = kv[1].trim();
          if (kv[0].trim() == 'v1') v1Signature = kv[1].trim();
        }
      }

      if (timestamp == null || v1Signature == null) return false;

      final signedPayload = '$timestamp.$rawBody';
      final keyBytes = utf8.encode(secretKey);
      final dataBytes = utf8.encode(signedPayload);
      final hmac = Hmac(sha256, keyBytes);
      final expectedSignature = hmac.convert(dataBytes).toString();

      return expectedSignature.toLowerCase() == v1Signature.toLowerCase();
    } catch (_) {
      return false;
    }
  }

  @override
  Future<PaymentInitiationResult> initiateDeposit(DepositRequest request) async {
    final txRef = 'TX-${provider.name.toUpperCase()}-${DateTime.now().millisecondsSinceEpoch}';

    Map<String, String> headers = {};
    Map<String, dynamic> body = {};

    switch (provider) {
      case MobileMoneyProvider.tmoney:
        final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
        final bodyStr = jsonEncode({
          'transaction_ref': txRef,
          'customer_msisdn': request.customerMsisdn,
          'amount': request.amount.amountXof,
        });
        final sig = generateTMoneySignature(
          timestamp: timestamp,
          method: 'POST',
          path: '/momo/c2b-collect',
          body: bodyStr,
        );
        headers = {
          'X-API-Key': apiKey,
          'X-Timestamp': timestamp,
          'X-Signature': sig,
        };
        body = jsonDecode(bodyStr);
        break;

      case MobileMoneyProvider.flooz:
        final checksum = generateFloozChecksum(
          reference: txRef,
          amount: request.amount.amountXof,
          msisdn: request.customerMsisdn,
        );
        body = {
          'partner_code': partnerCode,
          'reference': txRef,
          'msisdn': request.customerMsisdn,
          'amount': request.amount.amountXof,
          'checksum': checksum,
        };
        break;

      case MobileMoneyProvider.wave:
        headers = {'Authorization': 'Bearer $secretKey'};
        body = {
          'amount': request.amount.amountXof.toString(),
          'currency': 'XOF',
          'client_reference': txRef,
          'restrict_pid': request.customerMsisdn,
        };
        break;

      case MobileMoneyProvider.mtnMomo:
      case MobileMoneyProvider.orangeMoney:
        headers = {'Authorization': 'Bearer $apiKey'};
        body = {
          'amount': request.amount.amountXof.toString(),
          'currency': 'XOF',
          'externalId': txRef,
          'partyId': request.customerMsisdn,
        };
        break;
    }

    try {
      final res = await apiClient.post('/momo/c2b-collect', body: body, headers: headers);
      return PaymentInitiationResult(
        success: true,
        transactionRef: txRef,
        initialStatus: PaymentStatus.pendingUserApproval,
        operatorGatewayRef: res is Map ? res['gateway_reference']?.toString() : null,
        actionPromptMessage: 'Veuillez composer votre code secret PIN sur l\'invite USSD',
      );
    } catch (e) {
      throw MobileMoneyGatewayException('Échec d\'initiation du paiement: $e');
    }
  }

  @override
  Future<PaymentInitiationResult> initiateWithdrawal(WithdrawalRequest request) async {
    final txRef = 'TX-OUT-${provider.name.toUpperCase()}-${DateTime.now().millisecondsSinceEpoch}';
    final body = {
      'transaction_ref': txRef,
      'recipient_msisdn': request.recipientMsisdn,
      'amount': request.amount.amountXof,
      'pin_auth_token': request.pinAuthToken,
    };

    try {
      final res = await apiClient.post('/momo/b2c-disburse', body: body);
      return PaymentInitiationResult(
        success: true,
        transactionRef: txRef,
        initialStatus: PaymentStatus.processing,
        operatorGatewayRef: res is Map ? res['gateway_reference']?.toString() : null,
        actionPromptMessage: 'Retrait en cours de traitement par l\'opérateur',
      );
    } catch (e) {
      throw MobileMoneyGatewayException('Échec d\'initiation du retrait: $e');
    }
  }

  @override
  Future<PaymentStatusResult> checkStatus({
    required String transactionRef,
    required String? operatorTxId,
  }) async {
    try {
      final res = await apiClient.get('/momo/status/$transactionRef');
      if (res is Map) {
        final statusStr = res['status']?.toString().toUpperCase() ?? 'SUCCESSFUL';
        PaymentStatus status;
        if (statusStr.contains('SUCCESS')) {
          status = PaymentStatus.successful;
        } else if (statusStr.contains('FAIL')) {
          status = PaymentStatus.failed;
        } else {
          status = PaymentStatus.processing;
        }

        return PaymentStatusResult(
          transactionRef: transactionRef,
          status: status,
          operatorTxId: res['operator_tx_id']?.toString(),
          settledAmount: Money(res['amount'] as int? ?? 0),
        );
      }
      return PaymentStatusResult(
        transactionRef: transactionRef,
        status: PaymentStatus.processing,
      );
    } catch (e) {
      throw MobileMoneyGatewayException('Impossible de vérifier le statut: $e');
    }
  }

  @override
  Future<WebhookParseResult> parseAndValidateWebhook({
    required Map<String, dynamic> rawPayload,
    required Map<String, String> headers,
  }) async {
    bool isValid = true;
    if (provider == MobileMoneyProvider.wave) {
      final sig = headers['Wave-Signature'] ?? headers['wave-signature'] ?? '';
      isValid = validateWaveSignature(waveSignatureHeader: sig, rawBody: jsonEncode(rawPayload));
    }

    final txRef = rawPayload['transaction_ref']?.toString() ?? 'TX-UNKNOWN';
    final amount = Money(rawPayload['amount'] as int? ?? 0);
    final statusStr = rawPayload['status']?.toString().toUpperCase() ?? '';

    PaymentStatus status = PaymentStatus.processing;
    if (statusStr == 'SUCCESSFUL' || statusStr == 'SUCCESS') {
      status = PaymentStatus.successful;
    } else if (statusStr == 'FAILED') {
      status = PaymentStatus.failed;
    }

    return WebhookParseResult(
      isValidSignature: isValid,
      transactionRef: txRef,
      status: status,
      operatorTxId: rawPayload['operator_tx_id']?.toString(),
      amount: amount,
      rawEvent: jsonEncode(rawPayload),
    );
  }
}
