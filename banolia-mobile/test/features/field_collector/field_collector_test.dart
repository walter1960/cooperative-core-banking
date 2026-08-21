import 'package:flutter_test/flutter_test.dart';
import 'package:banolia_mobile/core/constants/bceao_constants.dart';
import 'package:banolia_mobile/core/storage/local_database.dart';
import 'package:banolia_mobile/core/value_objects/money.dart';
import 'package:banolia_mobile/features/field_collector/domain/entities/field_collector_entities.dart';
import 'package:banolia_mobile/features/field_collector/domain/repositories/field_collector_usecases.dart';
import 'package:banolia_mobile/features/field_collector/data/field_collector_repository_impl.dart';

void main() {
  group('Field Collector Shift & Billetage Reconciliation', () {
    late LocalDatabase localDb;
    late IFieldCollectorRepository repository;
    late OpenShiftUseCase openShiftUseCase;
    late ReconcileCollectorShiftUseCase reconcileUseCase;
    late CloseShiftUseCase closeShiftUseCase;

    setUp(() {
      localDb = LocalDatabase();
      repository = FieldCollectorRepositoryImpl(localDatabase: localDb);
      openShiftUseCase = OpenShiftUseCase(repository);
      reconcileUseCase = ReconcileCollectorShiftUseCase(repository);
      closeShiftUseCase = CloseShiftUseCase(repository);
    });

    test('OpenShift creates active shift with cryptographic root hash and zero balance', () async {
      final shift = await openShiftUseCase(
        collectorId: 'COL-04',
        collectorName: 'K. MINTA',
        deviceId: 'DEV-POS-04',
      );

      expect(shift.status, equals(ShiftStatus.open));
      expect(shift.rootHash.length, equals(64));
      expect(shift.tipHash, equals(shift.rootHash));
      expect(shift.totalCollectedAmount, equals(Money.zero));
    });

    test('Billetage Reconciliation: Caisse Juste (Balanced cash)', () {
      // Journal Total = 65 000 XOF
      final journalTotal = const Money(65000);

      // Physical cash:
      // 5x 10 000 = 50 000
      // 2x 5 000  = 10 000
      // 2x 2 000  =  4 000
      // 1x 1 000  =  1 000 -> Total 65 000
      final items = [
        const BilletageItem(denomination: 10000, count: 5),
        const BilletageItem(denomination: 5000, count: 2),
        const BilletageItem(denomination: 2000, count: 2),
        const BilletageItem(denomination: 1000, count: 1),
      ];

      final recon = reconcileUseCase(items: items, journalTotal: journalTotal);

      expect(recon.isBalanced, isTrue);
      expect(recon.variance, equals(Money.zero));
      expect(recon.accountingAccountCode, equals(BceaoConstants.accountCollectorCash)); // 571200
    });

    test('Billetage Reconciliation: Manquant de Caisse (Shortage -> SFD 471200)', () {
      final journalTotal = const Money(50000);

      // Physical cash = 45 000 (Shortage of -5 000)
      final items = [
        const BilletageItem(denomination: 10000, count: 4),
        const BilletageItem(denomination: 5000, count: 1),
      ];

      final recon = reconcileUseCase(items: items, journalTotal: journalTotal);

      expect(recon.isShortage, isTrue);
      expect(recon.isBalanced, isFalse);
      expect(recon.variance, equals(const Money(-5000)));
      expect(recon.accountingAccountCode, equals(BceaoConstants.accountCashShortageDiscrepancy)); // 471200
    });

    test('Billetage Reconciliation: Excédent de Caisse (Surplus -> SFD 472200)', () {
      final journalTotal = const Money(50000);

      // Physical cash = 52 000 (Surplus of +2 000)
      final items = [
        const BilletageItem(denomination: 10000, count: 5),
        const BilletageItem(denomination: 2000, count: 1),
      ];

      final recon = reconcileUseCase(items: items, journalTotal: journalTotal);

      expect(recon.isSurplus, isTrue);
      expect(recon.isBalanced, isFalse);
      expect(recon.variance, equals(const Money(2000)));
      expect(recon.accountingAccountCode, equals(BceaoConstants.accountCashSurplusDiscrepancy)); // 472200
    });

    test('CloseShift transitions shift status and records physical cash and discrepancy', () async {
      final shift = await openShiftUseCase(
        collectorId: 'COL-04',
        collectorName: 'K. MINTA',
        deviceId: 'DEV-POS-04',
      );

      final recon = reconcileUseCase(
        items: [const BilletageItem(denomination: 10000, count: 5)],
        journalTotal: const Money(50000),
      );

      final closed = await closeShiftUseCase(
        shiftId: shift.id,
        reconciliation: recon,
      );

      expect(closed.status, equals(ShiftStatus.closedBalanced));
      expect(closed.closedAt, isNotNull);
      expect(closed.physicalCashDeclared, equals(const Money(50000)));
    });

    test('Search and Haversine distance sort works on member roster', () async {
      final members = await repository.getFieldMembers();
      expect(members.isNotEmpty, isTrue);

      final searchUseCase = SearchFieldMembersUseCase();
      final filtered = searchUseCase(members: members, query: 'ABLAVI');
      expect(filtered.length, equals(1));
      expect(filtered.first.fullName, contains('ABLAVI'));

      final sortUseCase = SortMembersByDistanceUseCase();
      final sorted = sortUseCase(
        members: members,
        currentLatitude: 6.12870,
        currentLongitude: 1.21580,
      );
      expect(sorted.length, equals(members.length));
    });
  });
}
