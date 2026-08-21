import '../../../../core/constants/bceao_constants.dart';
import '../../../../core/value_objects/money.dart';

enum ShiftStatus {
  open,
  settling,
  closedBalanced,
  closedDiscrepancy,
  synced,
}

class CollectorShift {
  final String id;
  final String shiftCode;
  final String collectorId;
  final String collectorName;
  final String agencyCode;
  final String deviceId;
  final DateTime openedAt;
  final DateTime? closedAt;
  final ShiftStatus status;
  final String openingSalt;
  final String rootHash;
  final String tipHash;
  final int transactionCount;
  final Money totalCollectedAmount;
  final Money? physicalCashDeclared;
  final Money? discrepancyAmount;
  final String? discrepancyReason;

  const CollectorShift({
    required this.id,
    required this.shiftCode,
    required this.collectorId,
    required this.collectorName,
    this.agencyCode = 'A02',
    required this.deviceId,
    required this.openedAt,
    this.closedAt,
    required this.status,
    required this.openingSalt,
    required this.rootHash,
    required this.tipHash,
    this.transactionCount = 0,
    this.totalCollectedAmount = Money.zero,
    this.physicalCashDeclared,
    this.discrepancyAmount,
    this.discrepancyReason,
  });

  CollectorShift copyWith({
    DateTime? closedAt,
    ShiftStatus? status,
    String? tipHash,
    int? transactionCount,
    Money? totalCollectedAmount,
    Money? physicalCashDeclared,
    Money? discrepancyAmount,
    String? discrepancyReason,
  }) {
    return CollectorShift(
      id: id,
      shiftCode: shiftCode,
      collectorId: collectorId,
      collectorName: collectorName,
      agencyCode: agencyCode,
      deviceId: deviceId,
      openedAt: openedAt,
      closedAt: closedAt ?? this.closedAt,
      status: status ?? this.status,
      openingSalt: openingSalt,
      rootHash: rootHash,
      tipHash: tipHash ?? this.tipHash,
      transactionCount: transactionCount ?? this.transactionCount,
      totalCollectedAmount: totalCollectedAmount ?? this.totalCollectedAmount,
      physicalCashDeclared: physicalCashDeclared ?? this.physicalCashDeclared,
      discrepancyAmount: discrepancyAmount ?? this.discrepancyAmount,
      discrepancyReason: discrepancyReason ?? this.discrepancyReason,
    );
  }
}

class FieldMember {
  final String memberCode;
  final String manualNumber;
  final String fullName;
  final String phone;
  final String marketName;
  final String marketSector;
  final String stallNumber;
  final double? latitude;
  final double? longitude;
  final int routeOrder;
  final String status;

  const FieldMember({
    required this.memberCode,
    required this.manualNumber,
    required this.fullName,
    required this.phone,
    required this.marketName,
    required this.marketSector,
    required this.stallNumber,
    this.latitude,
    this.longitude,
    this.routeOrder = 0,
    this.status = 'ACTIF',
  });
}

class BilletageItem {
  final int denomination;
  final int count;

  const BilletageItem({required this.denomination, required this.count})
      : assert(count >= 0, 'Le nombre de coupures ne peut pas être négatif');

  Money get subtotal => Money(denomination * count);
}

class BilletageReconciliation {
  final List<BilletageItem> items;
  final Money totalPhysicalCash;
  final Money journalTotal;
  final Money variance; // Physical - Journal
  final bool isBalanced;
  final bool isShortage; // Variance < 0 (SFD 471200)
  final bool isSurplus; // Variance > 0 (SFD 472200)
  final String accountingAccountCode;

  const BilletageReconciliation({
    required this.items,
    required this.totalPhysicalCash,
    required this.journalTotal,
    required this.variance,
    required this.isBalanced,
    required this.isShortage,
    required this.isSurplus,
    required this.accountingAccountCode,
  });

  factory BilletageReconciliation.compute({
    required List<BilletageItem> items,
    required Money journalTotal,
  }) {
    int totalPhysical = 0;
    for (final item in items) {
      totalPhysical += item.subtotal.amountXof;
    }
    final physicalMoney = Money(totalPhysical);
    final variance = physicalMoney - journalTotal;
    final isBalanced = variance.isZero;
    final isShortage = variance.isNegative;
    final isSurplus = variance.isPositive;

    String account;
    if (isBalanced) {
      account = BceaoConstants.accountCollectorCash; // 571200
    } else if (isShortage) {
      account = BceaoConstants.accountCashShortageDiscrepancy; // 471200
    } else {
      account = BceaoConstants.accountCashSurplusDiscrepancy; // 472200
    }

    return BilletageReconciliation(
      items: items,
      totalPhysicalCash: physicalMoney,
      journalTotal: journalTotal,
      variance: variance,
      isBalanced: isBalanced,
      isShortage: isShortage,
      isSurplus: isSurplus,
      accountingAccountCode: account,
    );
  }
}
