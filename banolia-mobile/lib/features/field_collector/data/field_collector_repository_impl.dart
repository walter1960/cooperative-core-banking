import '../../../../core/storage/local_database.dart';
import '../../../../core/value_objects/money.dart';
import '../domain/entities/field_collector_entities.dart';
import '../domain/repositories/field_collector_usecases.dart';

class FieldCollectorRepositoryImpl implements IFieldCollectorRepository {
  final LocalDatabase localDatabase;

  FieldCollectorRepositoryImpl({required this.localDatabase});

  @override
  Future<CollectorShift?> getActiveShift() async {
    final map = await localDatabase.getActiveShift();
    if (map == null) return null;
    return CollectorShift(
      id: map['id'] as String,
      shiftCode: map['shift_code'] as String,
      collectorId: map['collector_id'] as String,
      collectorName: map['collector_name'] as String,
      agencyCode: map['agency_code'] as String? ?? 'A02',
      deviceId: map['device_id'] as String,
      openedAt: DateTime.parse(map['opened_at'] as String),
      closedAt: map['closed_at'] != null ? DateTime.parse(map['closed_at'] as String) : null,
      status: ShiftStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => ShiftStatus.open,
      ),
      openingSalt: map['opening_salt'] as String,
      rootHash: map['root_hash'] as String,
      tipHash: map['tip_hash'] as String,
      transactionCount: map['transaction_count'] as int? ?? 0,
      totalCollectedAmount: Money(map['total_collected_amount'] as int? ?? 0),
      physicalCashDeclared: map['physical_cash_declared'] != null
          ? Money(map['physical_cash_declared'] as int)
          : null,
      discrepancyAmount: map['discrepancy_amount'] != null
          ? Money(map['discrepancy_amount'] as int)
          : null,
      discrepancyReason: map['discrepancy_reason'] as String?,
    );
  }

  @override
  Future<void> saveShift(CollectorShift shift) async {
    await localDatabase.saveShift({
      'id': shift.id,
      'shift_code': shift.shiftCode,
      'collector_id': shift.collectorId,
      'collector_name': shift.collectorName,
      'agency_code': shift.agencyCode,
      'device_id': shift.deviceId,
      'opened_at': shift.openedAt.toIso8601String(),
      'closed_at': shift.closedAt?.toIso8601String(),
      'status': shift.status.name,
      'opening_salt': shift.openingSalt,
      'root_hash': shift.rootHash,
      'tip_hash': shift.tipHash,
      'transaction_count': shift.transactionCount,
      'total_collected_amount': shift.totalCollectedAmount.amountXof,
      'physical_cash_declared': shift.physicalCashDeclared?.amountXof,
      'discrepancy_amount': shift.discrepancyAmount?.amountXof,
      'discrepancy_reason': shift.discrepancyReason,
    });
  }

  @override
  Future<List<FieldMember>> getFieldMembers() async {
    final list = await localDatabase.getAllMembers();
    if (list.isEmpty) {
      // Default sample field members in market
      return const [
        FieldMember(
          memberCode: 'A0200389',
          manualNumber: '883',
          fullName: 'AMEGNINOU ABLAVI',
          phone: '+228 90 12 34 56',
          marketName: 'Grand Marché de Lomé',
          marketSector: 'Hall Tissus - 1er Étage',
          stallNumber: 'Étal N° 42B',
          latitude: 6.12871,
          longitude: 1.21583,
          routeOrder: 1,
        ),
        FieldMember(
          memberCode: 'A0200105',
          manualNumber: '412',
          fullName: 'KODJO MESSAN',
          phone: '+228 91 22 33 44',
          marketName: 'Grand Marché de Lomé',
          marketSector: 'Secteur Épices & Céréales',
          stallNumber: 'Étal N° 18',
          latitude: 6.12885,
          longitude: 1.21590,
          routeOrder: 2,
        ),
        FieldMember(
          memberCode: 'A0200560',
          manualNumber: '955',
          fullName: 'ADOM AFIAVI',
          phone: '+228 96 55 66 77',
          marketName: 'Grand Marché de Lomé',
          marketSector: 'Hall Cosmétiques',
          stallNumber: 'Boutique N° 07',
          latitude: 6.12899,
          longitude: 1.21601,
          routeOrder: 3,
        ),
      ];
    }

    return list.map((m) => FieldMember(
      memberCode: m['member_code'] as String,
      manualNumber: m['manual_number'] as String,
      fullName: m['full_name'] as String,
      phone: m['phone'] as String,
      marketName: m['market_name'] as String,
      marketSector: m['market_sector'] as String,
      stallNumber: m['stall_number'] as String,
      latitude: (m['latitude'] as num?)?.toDouble(),
      longitude: (m['longitude'] as num?)?.toDouble(),
      routeOrder: m['route_order'] as int? ?? 0,
      status: m['status'] as String? ?? 'ACTIF',
    )).toList();
  }

  @override
  Future<void> saveFieldMembers(List<FieldMember> members) async {
    await localDatabase.saveMembers(members.map((m) => {
      'member_code': m.memberCode,
      'manual_number': m.manualNumber,
      'full_name': m.fullName,
      'phone': m.phone,
      'market_name': m.marketName,
      'market_sector': m.marketSector,
      'stall_number': m.stallNumber,
      'latitude': m.latitude,
      'longitude': m.longitude,
      'route_order': m.routeOrder,
      'status': m.status,
      'last_synced_at': DateTime.now().toIso8601String(),
    }).toList());
  }
}
