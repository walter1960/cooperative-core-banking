import 'package:flutter_test/flutter_test.dart';
import 'package:banolia_mobile/core/utils/newton_raphson_solver.dart';
import 'package:banolia_mobile/core/utils/geo_location_utils.dart';
import 'package:banolia_mobile/core/utils/hash_chain_utils.dart';

void main() {
  group('Newton-Raphson IRR and TEG Solver', () {
    test('Calculates periodic rate and annualized TEG correctly for flat zero-fee loan', () {
      // 1 000 000 disbursed, 12 monthly payments of 88 849 (approx 12% nominal rate)
      final installments = List.generate(12, (_) => 88849.0);
      final teg = NewtonRaphsonSolver.calculateAnnualTeg(
        netDisbursed: 1000000.0,
        installments: installments,
        periodsPerYear: 12,
      );

      // Expected annual TEG close to 12.0%
      expect(teg, greaterThan(11.5));
      expect(teg, lessThan(12.5));
    });

    test('TEG increases when upfront administrative and insurance fees reduce net disbursed', () {
      // 1 000 000 loan with 20 000 upfront fees (net disbursed = 980 000)
      final installments = List.generate(12, (_) => 88849.0);
      final tegWithFees = NewtonRaphsonSolver.calculateAnnualTeg(
        netDisbursed: 980000.0,
        installments: installments,
        periodsPerYear: 12,
      );

      expect(tegWithFees, greaterThan(15.0)); // Fee inclusion pushes effective TEG higher
    });
  });

  group('Haversine Distance Calculator', () {
    test('Calculates distance in meters between two market coordinates in Lomé', () {
      // Grand Marché Lomé Hall Tissus (6.12871, 1.21583) and Secteur Épices (6.12885, 1.21590)
      final dist = GeoLocationUtils.distanceMeters(6.12871, 1.21583, 6.12885, 1.21590);

      // Expected ~ 17 meters
      expect(dist, greaterThan(10.0));
      expect(dist, lessThan(30.0));
    });

    test('Distance to same point is zero', () {
      final dist = GeoLocationUtils.distanceMeters(6.12871, 1.21583, 6.12871, 1.21583);
      expect(dist, equals(0.0));
    });
  });

  group('Cryptographic Hash Chain Utils', () {
    test('Root hash is deterministically calculated', () {
      final root1 = HashChainUtils.computeRootHash(
        shiftId: 'SHIFT-001',
        collectorId: 'COL-04',
        openingSalt: 'salt12345',
      );
      final root2 = HashChainUtils.computeRootHash(
        shiftId: 'SHIFT-001',
        collectorId: 'COL-04',
        openingSalt: 'salt12345',
      );

      expect(root1, equals(root2));
      expect(root1.length, equals(64)); // SHA-256 hex string length
    });

    test('HMAC-SHA256 signature and truncated QR HMAC are computed correctly', () {
      const secret = 'device_sec_key_2026';
      const payload = 'BNL|v1|TON-001|A0200389|CARD-0883|2000|00000003|1724115932';

      final fullHmac = HashChainUtils.computeHmacSignature(secretKey: secret, entryHash: payload);
      final truncatedHmac = HashChainUtils.computeQrTruncatedHmac(secretKey: secret, payload: payload);

      expect(fullHmac.length, equals(64));
      expect(truncatedHmac.length, equals(12));
      expect(truncatedHmac, equals(fullHmac.substring(0, 12).toUpperCase()));
    });
  });
}
