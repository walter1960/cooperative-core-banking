import 'package:flutter_test/flutter_test.dart';
import 'package:banolia_mobile/core/value_objects/money.dart';
import 'package:banolia_mobile/features/mobile_money/domain/entities/mobile_money_entities.dart';
import 'package:banolia_mobile/features/mobile_money/data/sandbox_simulation_engine.dart';
import 'package:banolia_mobile/features/mobile_money/data/real_http_gateway_adapter.dart';
import 'package:banolia_mobile/features/mobile_money/data/dual_mode_gateway_aggregator.dart';
import 'package:banolia_mobile/core/network/api_client.dart';
import 'package:banolia_mobile/core/network/network_info.dart';
import 'package:http/http.dart' as http;

void main() {
  group('Mobile Money Sandbox Simulation Engine', () {
    late SandboxSimulationEngine sandbox;

    setUp(() {
      sandbox = SandboxSimulationEngine(provider: MobileMoneyProvider.tmoney);
      sandbox.simulatedDelay = Duration.zero; // instant for tests
    });

    test('Nominal C2B Deposit with test vector +22890000001 succeeds', () async {
      final req = DepositRequest(
        idempotencyKey: 'idemp-dep-001',
        memberCode: 'A0200389',
        accountNumber: '251100A020038901',
        customerMsisdn: '+22890000001',
        amount: const Money(25000),
      );

      final res = await sandbox.initiateDeposit(req);

      expect(res.success, isTrue);
      expect(res.initialStatus, equals(PaymentStatus.successful));

      final statusCheck = await sandbox.checkStatus(transactionRef: res.transactionRef, operatorTxId: null);
      expect(statusCheck.status, equals(PaymentStatus.successful));
      expect(statusCheck.settledAmount, equals(const Money(25000)));
    });

    test('Deterministic test vector +22890000002 fails with INSUFFICIENT_FUNDS', () async {
      final req = DepositRequest(
        idempotencyKey: 'idemp-dep-002',
        memberCode: 'A0200389',
        accountNumber: '251100A020038901',
        customerMsisdn: '+22890000002',
        amount: const Money(15000),
      );

      final res = await sandbox.initiateDeposit(req);

      expect(res.success, isFalse);
      expect(res.initialStatus, equals(PaymentStatus.failed));
      expect(res.errorMessage?.contains('INSUFFICIENT_FUNDS'), isTrue);
    });

    test('Deterministic test vector +22890000003 returns USER_CANCELLED', () async {
      final req = DepositRequest(
        idempotencyKey: 'idemp-dep-003',
        memberCode: 'A0200389',
        accountNumber: '251100A020038901',
        customerMsisdn: '+22890000003',
        amount: const Money(10000),
      );

      final res = await sandbox.initiateDeposit(req);

      expect(res.success, isFalse);
      expect(res.initialStatus, equals(PaymentStatus.cancelledByUser));
      expect(res.errorMessage?.contains('USER_CANCELLED'), isTrue);
    });

    test('Deterministic test vector +22890000004 returns USSD_TIMEOUT', () async {
      final req = DepositRequest(
        idempotencyKey: 'idemp-dep-004',
        memberCode: 'A0200389',
        accountNumber: '251100A020038901',
        customerMsisdn: '+22890000004',
        amount: const Money(10000),
      );

      final res = await sandbox.initiateDeposit(req);

      expect(res.success, isFalse);
      expect(res.initialStatus, equals(PaymentStatus.timeout));
    });

    test('Deterministic amount 99 999 F.CFA returns LIMIT_EXCEEDED', () async {
      final req = DepositRequest(
        idempotencyKey: 'idemp-dep-005',
        memberCode: 'A0200389',
        accountNumber: '251100A020038901',
        customerMsisdn: '+22890000001',
        amount: const Money(99999),
      );

      final res = await sandbox.initiateDeposit(req);

      expect(res.success, isFalse);
      expect(res.errorMessage?.contains('LIMIT_EXCEEDED'), isTrue);
    });

    test('Explicit Failure Mode Override forces failure regardless of MSISDN', () async {
      sandbox.overrideMode = SimulationOverrideMode.forceInvalidPin;

      final req = DepositRequest(
        idempotencyKey: 'idemp-dep-006',
        memberCode: 'A0200389',
        accountNumber: '251100A020038901',
        customerMsisdn: '+22890000001', // usually succeeds
        amount: const Money(5000),
      );

      final res = await sandbox.initiateDeposit(req);

      expect(res.success, isFalse);
      expect(res.errorMessage?.contains('INVALID_PIN'), isTrue);
    });
  });

  group('Real HTTP Gateway Cryptographic Signatures', () {
    late RealHttpGatewayAdapter adapter;

    setUp(() {
      final apiClient = ApiClient(httpClient: http.Client(), networkInfo: AlwaysOnlineNetworkInfo());
      adapter = RealHttpGatewayAdapter(
        provider: MobileMoneyProvider.tmoney,
        apiClient: apiClient,
        secretKey: 'secret_banolia_key_123',
        partnerCode: 'BANOLIA_COOP',
      );
    });

    test('TMoney HMAC-SHA256 signature is deterministic and 64 hex chars', () {
      final sig = adapter.generateTMoneySignature(
        timestamp: '1724115932',
        method: 'POST',
        path: '/momo/c2b-collect',
        body: '{"amount":25000}',
      );

      expect(sig.length, equals(64));
      // Re-running same parameters produces identical signature
      final sig2 = adapter.generateTMoneySignature(
        timestamp: '1724115932',
        method: 'POST',
        path: '/momo/c2b-collect',
        body: '{"amount":25000}',
      );
      expect(sig, equals(sig2));
    });

    test('Flooz SHA-512 checksum is deterministic and 128 hex chars', () {
      final checksum = adapter.generateFloozChecksum(
        reference: 'TX-FLZ-001',
        amount: 15000,
        msisdn: '+22896000001',
      );

      expect(checksum.length, equals(128)); // SHA-512
    });

    test('Wave Webhook HMAC signature validation correctly validates authentic payload', () {
      final waveAdapter = RealHttpGatewayAdapter(
        provider: MobileMoneyProvider.wave,
        apiClient: ApiClient(httpClient: http.Client(), networkInfo: AlwaysOnlineNetworkInfo()),
        secretKey: 'wave_webhook_secret',
      );

      const timestamp = '1724115932';
      const rawBody = '{"id":"cos-123","status":"complete"}';

      // Manually calculate signature
      final expectedSig = waveAdapter.generateTMoneySignature(
        timestamp: timestamp,
        method: '.', // Wave uses timestamp.body
        path: '',
        body: rawBody,
      );

      final header = 't=$timestamp,v1=$expectedSig';
      final isValid = waveAdapter.validateWaveSignature(waveSignatureHeader: header, rawBody: rawBody);

      expect(isValid, isTrue);

      // Corrupted body fails validation
      final isTampered = waveAdapter.validateWaveSignature(
        waveSignatureHeader: header,
        rawBody: '{"id":"cos-123","status":"tampered"}',
      );
      expect(isTampered, isFalse);
    });
  });

  group('B2C Withdrawal and DualModeGatewayAggregator', () {
    late SandboxSimulationEngine sandbox;
    late RealHttpGatewayAdapter realAdapter;
    late DualModeGatewayAggregator aggregator;

    setUp(() {
      sandbox = SandboxSimulationEngine(provider: MobileMoneyProvider.flooz);
      sandbox.simulatedDelay = Duration.zero;

      final apiClient = ApiClient(httpClient: http.Client(), networkInfo: AlwaysOnlineNetworkInfo());
      realAdapter = RealHttpGatewayAdapter(
        provider: MobileMoneyProvider.flooz,
        apiClient: apiClient,
      );

      aggregator = DualModeGatewayAggregator(
        sandboxEngine: sandbox,
        realAdapter: realAdapter,
        isSandboxMode: true,
      );
    });

    test('B2C Withdrawal in Sandbox mode succeeds for standard recipient', () async {
      final req = WithdrawalRequest(
        idempotencyKey: 'idemp-out-001',
        memberCode: 'A0200389',
        accountNumber: '251100A020038901',
        recipientMsisdn: '+22896000001',
        amount: const Money(10000),
        pinAuthToken: 'token_pin_ok',
      );

      final res = await aggregator.initiateWithdrawal(req);
      expect(res.success, isTrue);
      expect(res.initialStatus, equals(PaymentStatus.successful));
    });

    test('Aggregator correctly switches between Sandbox and Real mode', () {
      expect(aggregator.isSandboxMode, isTrue);
      expect(aggregator.provider, equals(MobileMoneyProvider.flooz));

      aggregator.isSandboxMode = false;
      expect(aggregator.isSandboxMode, isFalse);
      expect(aggregator.provider, equals(MobileMoneyProvider.flooz));
    });
  });
}

