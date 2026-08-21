import '../../../../core/value_objects/money.dart';

enum TontineCardStatus { active, completed, settledSavings, blocked }
enum JournalSyncStatus { pendingSync, inFlight, committedServer, errorFatal }

class FieldTontineCard {
  final String id;
  final String memberCode;
  final String accountNumber;
  final int cycleMonth;
  final int cycleYear;
  final Money dailyMise; // e.g. 1 000 F.CFA
  final int totalDays; // 31
  final int paidDaysCount;
  final int stampsBitmask; // 32-bit integer (bits 0..30 representing days 1..31)
  final Money cumulativeAmount;
  final int commissionDayIndex; // Day 31 allocated to coop fee
  final Money commissionAmount;
  final Money creditBuffer; // Partial coin deposits (< daily_mise)
  final TontineCardStatus status;
  final DateTime updatedAt;

  const FieldTontineCard({
    required this.id,
    required this.memberCode,
    required this.accountNumber,
    required this.cycleMonth,
    required this.cycleYear,
    required this.dailyMise,
    this.totalDays = 31,
    required this.paidDaysCount,
    required this.stampsBitmask,
    required this.cumulativeAmount,
    this.commissionDayIndex = 31,
    required this.commissionAmount,
    required this.creditBuffer,
    required this.status,
    required this.updatedAt,
  });

  bool isDayPaid(int dayIndex) {
    if (dayIndex < 1 || dayIndex > totalDays) return false;
    return (stampsBitmask & (1 << (dayIndex - 1))) != 0;
  }

  int get daysRemaining => totalDays - paidDaysCount;

  Money get remainingAmountToPay => dailyMise * daysRemaining - creditBuffer;

  FieldTontineCard copyWith({
    int? paidDaysCount,
    int? stampsBitmask,
    Money? cumulativeAmount,
    Money? creditBuffer,
    TontineCardStatus? status,
    DateTime? updatedAt,
  }) {
    return FieldTontineCard(
      id: id,
      memberCode: memberCode,
      accountNumber: accountNumber,
      cycleMonth: cycleMonth,
      cycleYear: cycleYear,
      dailyMise: dailyMise,
      totalDays: totalDays,
      paidDaysCount: paidDaysCount ?? this.paidDaysCount,
      stampsBitmask: stampsBitmask ?? this.stampsBitmask,
      cumulativeAmount: cumulativeAmount ?? this.cumulativeAmount,
      commissionDayIndex: commissionDayIndex,
      commissionAmount: commissionAmount,
      creditBuffer: creditBuffer ?? this.creditBuffer,
      status: status ?? this.status,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

class StampAllocationResult {
  final List<int> allocatedDays; // e.g. [14, 15]
  final int updatedBitmask;
  final int newPaidCount;
  final Money newCreditBuffer;
  final Money effectiveAmountAllocated;
  final bool isCycleCompleted;

  const StampAllocationResult({
    required this.allocatedDays,
    required this.updatedBitmask,
    required this.newPaidCount,
    required this.newCreditBuffer,
    required this.effectiveAmountAllocated,
    required this.isCycleCompleted,
  });
}

class FieldJournalEntry {
  final String id;
  final String shiftId;
  final int sequenceNumber;
  final String receiptNumber;
  final String idempotencyKey;
  final String cardId;
  final String memberCode;
  final String memberName;
  final String stallNumber;
  final Money amount;
  final int stampsAllocatedCount;
  final List<int> stampsIndices;
  final Money cumulativeAfter;
  final int daysRemainingAfter;
  final String prevHash;
  final String payloadHash;
  final String entryHash;
  final String signatureHmac;
  final double? latitude;
  final double? longitude;
  final DateTime timestampUtc;
  final JournalSyncStatus syncStatus;
  final int syncAttempts;

  const FieldJournalEntry({
    required this.id,
    required this.shiftId,
    required this.sequenceNumber,
    required this.receiptNumber,
    required this.idempotencyKey,
    required this.cardId,
    required this.memberCode,
    required this.memberName,
    required this.stallNumber,
    required this.amount,
    required this.stampsAllocatedCount,
    required this.stampsIndices,
    required this.cumulativeAfter,
    required this.daysRemainingAfter,
    required this.prevHash,
    required this.payloadHash,
    required this.entryHash,
    required this.signatureHmac,
    this.latitude,
    this.longitude,
    required this.timestampUtc,
    this.syncStatus = JournalSyncStatus.pendingSync,
    this.syncAttempts = 0,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'shift_id': shiftId,
        'sequence_number': sequenceNumber,
        'receipt_number': receiptNumber,
        'idempotency_key': idempotencyKey,
        'card_id': cardId,
        'member_code': memberCode,
        'member_name': memberName,
        'stall_number': stallNumber,
        'amount': amount.amountXof,
        'stamps_allocated_count': stampsAllocatedCount,
        'stamps_indices': stampsIndices,
        'cumulative_after': cumulativeAfter.amountXof,
        'days_remaining_after': daysRemainingAfter,
        'prev_hash': prevHash,
        'payload_hash': payloadHash,
        'entry_hash': entryHash,
        'signature_hmac': signatureHmac,
        'latitude': latitude,
        'longitude': longitude,
        'timestamp_utc': timestampUtc.toIso8601String(),
        'sync_status': syncStatus.name,
        'sync_attempts': syncAttempts,
      };

  factory FieldJournalEntry.fromJson(Map<String, dynamic> json) {
    return FieldJournalEntry(
      id: json['id'] as String,
      shiftId: json['shift_id'] as String,
      sequenceNumber: json['sequence_number'] as int,
      receiptNumber: json['receipt_number'] as String,
      idempotencyKey: json['idempotency_key'] as String,
      cardId: json['card_id'] as String,
      memberCode: json['member_code'] as String,
      memberName: json['member_name'] as String,
      stallNumber: json['stall_number'] as String,
      amount: Money(json['amount'] as int),
      stampsAllocatedCount: json['stamps_allocated_count'] as int,
      stampsIndices: (json['stamps_indices'] as List).map((e) => e as int).toList(),
      cumulativeAfter: Money(json['cumulative_after'] as int),
      daysRemainingAfter: json['days_remaining_after'] as int,
      prevHash: json['prev_hash'] as String,
      payloadHash: json['payload_hash'] as String,
      entryHash: json['entry_hash'] as String,
      signatureHmac: json['signature_hmac'] as String,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      timestampUtc: DateTime.parse(json['timestamp_utc'] as String),
      syncStatus: JournalSyncStatus.values.firstWhere(
        (e) => e.name == json['sync_status'],
        orElse: () => JournalSyncStatus.pendingSync,
      ),
      syncAttempts: json['sync_attempts'] as int? ?? 0,
    );
  }
}

enum SyncBatchStatus { pending, uploading, acknowledged, failedRetry }

class FieldSyncBatch {
  final String batchId;
  final String shiftId;
  final String collectorId;
  final String deviceId;
  final int startSeq;
  final int endSeq;
  final int transactionCount;
  final Money totalAmount;
  final String rootHash;
  final String tipHash;
  final List<FieldJournalEntry> transactions;
  final SyncBatchStatus status;
  final DateTime createdAt;
  final DateTime? acknowledgedAt;

  const FieldSyncBatch({
    required this.batchId,
    required this.shiftId,
    required this.collectorId,
    required this.deviceId,
    required this.startSeq,
    required this.endSeq,
    required this.transactionCount,
    required this.totalAmount,
    required this.rootHash,
    required this.tipHash,
    required this.transactions,
    this.status = SyncBatchStatus.pending,
    required this.createdAt,
    this.acknowledgedAt,
  });

  Map<String, dynamic> toJson() => {
        'batch_id': batchId,
        'shift_id': shiftId,
        'collector_id': collectorId,
        'device_id': deviceId,
        'start_seq': startSeq,
        'end_seq': endSeq,
        'transaction_count': transactionCount,
        'total_amount': totalAmount.amountXof,
        'root_hash': rootHash,
        'tip_hash': tipHash,
        'transactions': transactions.map((t) => t.toJson()).toList(),
      };
}

class SyncBatchItemResult {
  final String idempotencyKey;
  final String status;
  final String? ledgerTxId;
  final String? errorMessage;

  const SyncBatchItemResult({
    required this.idempotencyKey,
    required this.status,
    this.ledgerTxId,
    this.errorMessage,
  });
}

class SyncBatchResponse {
  final bool success;
  final String batchId;
  final int processedCount;
  final DateTime serverTimestamp;
  final List<SyncBatchItemResult> results;
  final String? errorMessage;

  const SyncBatchResponse({
    required this.success,
    required this.batchId,
    required this.processedCount,
    required this.serverTimestamp,
    required this.results,
    this.errorMessage,
  });
}

