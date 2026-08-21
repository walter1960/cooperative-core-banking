import 'package:uuid/uuid.dart';
import '../../../../core/utils/geo_location_utils.dart';
import '../../../../core/utils/hash_chain_utils.dart';
import '../../../../core/value_objects/money.dart';
import '../entities/field_collector_entities.dart';

abstract class IFieldCollectorRepository {
  Future<CollectorShift?> getActiveShift();
  Future<void> saveShift(CollectorShift shift);
  Future<List<FieldMember>> getFieldMembers();
  Future<void> saveFieldMembers(List<FieldMember> members);
}

class OpenShiftUseCase {
  final IFieldCollectorRepository repository;

  OpenShiftUseCase(this.repository);

  Future<CollectorShift> call({
    required String collectorId,
    required String collectorName,
    required String deviceId,
    String agencyCode = 'A02',
  }) async {
    final existing = await repository.getActiveShift();
    if (existing != null) {
      return existing;
    }

    final now = DateTime.now().toUtc();
    final shiftId = const Uuid().v4();
    final shiftCode = 'COLSHIFT-${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}-${const Uuid().v4().substring(0, 4).toUpperCase()}';
    final openingSalt = const Uuid().v4().replaceAll('-', '');
    final rootHash = HashChainUtils.computeRootHash(
      shiftId: shiftId,
      collectorId: collectorId,
      openingSalt: openingSalt,
    );

    final shift = CollectorShift(
      id: shiftId,
      shiftCode: shiftCode,
      collectorId: collectorId,
      collectorName: collectorName,
      agencyCode: agencyCode,
      deviceId: deviceId,
      openedAt: now,
      status: ShiftStatus.open,
      openingSalt: openingSalt,
      rootHash: rootHash,
      tipHash: rootHash,
      transactionCount: 0,
      totalCollectedAmount: Money.zero,
    );

    await repository.saveShift(shift);
    return shift;
  }
}

class ReconcileCollectorShiftUseCase {
  final IFieldCollectorRepository repository;

  ReconcileCollectorShiftUseCase(this.repository);

  BilletageReconciliation call({
    required List<BilletageItem> items,
    required Money journalTotal,
  }) {
    return BilletageReconciliation.compute(items: items, journalTotal: journalTotal);
  }
}

class CloseShiftUseCase {
  final IFieldCollectorRepository repository;

  CloseShiftUseCase(this.repository);

  Future<CollectorShift> call({
    required String shiftId,
    required BilletageReconciliation reconciliation,
    String? discrepancyReason,
  }) async {
    final shift = await repository.getActiveShift();
    if (shift == null || shift.id != shiftId) {
      throw ArgumentError('Session de collecte introuvable ou inactive');
    }

    final newStatus = reconciliation.isBalanced
        ? ShiftStatus.closedBalanced
        : ShiftStatus.closedDiscrepancy;

    final closedShift = shift.copyWith(
      closedAt: DateTime.now().toUtc(),
      status: newStatus,
      physicalCashDeclared: reconciliation.totalPhysicalCash,
      discrepancyAmount: reconciliation.variance,
      discrepancyReason: discrepancyReason,
    );

    await repository.saveShift(closedShift);
    return closedShift;
  }
}

class SortMembersByDistanceUseCase {
  List<FieldMember> call({
    required List<FieldMember> members,
    required double currentLatitude,
    required double currentLongitude,
  }) {
    final list = List<FieldMember>.from(members);
    list.sort((a, b) {
      if (a.latitude == null || a.longitude == null) return 1;
      if (b.latitude == null || b.longitude == null) return -1;
      final distA = GeoLocationUtils.distanceMeters(
        currentLatitude,
        currentLongitude,
        a.latitude!,
        a.longitude!,
      );
      final distB = GeoLocationUtils.distanceMeters(
        currentLatitude,
        currentLongitude,
        b.latitude!,
        b.longitude!,
      );
      return distA.compareTo(distB);
    });
    return list;
  }
}

class SearchFieldMembersUseCase {
  List<FieldMember> call({
    required List<FieldMember> members,
    required String query,
  }) {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return members;

    return members.where((m) {
      final codeMatch = m.memberCode.toLowerCase().contains(q);
      final manualMatch = m.manualNumber.toLowerCase().contains(q);
      final nameMatch = m.fullName.toLowerCase().contains(q);
      final phoneMatch = m.phone.replaceAll(' ', '').contains(q.replaceAll(' ', ''));
      final stallMatch = m.stallNumber.toLowerCase().contains(q) || m.marketSector.toLowerCase().contains(q);
      return codeMatch || manualMatch || nameMatch || phoneMatch || stallMatch;
    }).toList();
  }
}
