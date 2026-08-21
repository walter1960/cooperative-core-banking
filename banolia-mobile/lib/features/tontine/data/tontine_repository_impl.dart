import '../../../../core/network/api_client.dart';
import '../../../../core/storage/local_database.dart';
import '../../../../core/value_objects/money.dart';
import '../domain/entities/tontine_entities.dart';
import '../domain/repositories/tontine_usecases.dart';

class TontineRepositoryImpl implements ITontineRepository {
  final LocalDatabase localDatabase;
  final ApiClient? apiClient;

  TontineRepositoryImpl({required this.localDatabase, this.apiClient});

  @override
  Future<FieldTontineCard?> getCardById(String cardId) async {
    final map = await localDatabase.getCard(cardId);
    if (map == null) return null;
    return FieldTontineCard(
      id: map['id'] as String,
      memberCode: map['member_code'] as String,
      accountNumber: map['account_number'] as String,
      cycleMonth: map['cycle_month'] as int,
      cycleYear: map['cycle_year'] as int,
      dailyMise: Money(map['daily_mise'] as int),
      totalDays: map['total_days'] as int? ?? 31,
      paidDaysCount: map['paid_days_count'] as int,
      stampsBitmask: map['stamps_bitmask'] as int,
      cumulativeAmount: Money(map['cumulative_amount'] as int),
      commissionDayIndex: map['commission_day_index'] as int? ?? 31,
      commissionAmount: Money(map['commission_amount'] as int? ?? 0),
      creditBuffer: Money(map['credit_buffer'] as int? ?? 0),
      status: TontineCardStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => TontineCardStatus.active,
      ),
      updatedAt: DateTime.parse(map['updated_at'] as String),
    );
  }

  @override
  Future<void> saveCard(FieldTontineCard card) async {
    await localDatabase.saveCard({
      'id': card.id,
      'member_code': card.memberCode,
      'account_number': card.accountNumber,
      'cycle_month': card.cycleMonth,
      'cycle_year': card.cycleYear,
      'daily_mise': card.dailyMise.amountXof,
      'total_days': card.totalDays,
      'paid_days_count': card.paidDaysCount,
      'stamps_bitmask': card.stampsBitmask,
      'cumulative_amount': card.cumulativeAmount.amountXof,
      'commission_day_index': card.commissionDayIndex,
      'commission_amount': card.commissionAmount.amountXof,
      'credit_buffer': card.creditBuffer.amountXof,
      'status': card.status.name,
      'updated_at': card.updatedAt.toIso8601String(),
    });
  }

  @override
  Future<List<FieldJournalEntry>> getJournalForShift(String shiftId) async {
    final list = await localDatabase.getJournalEntriesForShift(shiftId);
    return list.map((m) => FieldJournalEntry.fromJson(m)).toList();
  }

  @override
  Future<void> appendJournalEntry(FieldJournalEntry entry) async {
    await localDatabase.appendJournalEntry(entry.toJson());
  }

  @override
  Future<List<FieldJournalEntry>> getPendingSyncEntries() async {
    final list = await localDatabase.getPendingSyncEntries();
    return list.map((m) => FieldJournalEntry.fromJson(m)).toList();
  }

  @override
  Future<void> markEntriesSynced(List<String> entryIds) async {
    for (final id in entryIds) {
      await localDatabase.updateEntrySyncStatus(id, JournalSyncStatus.committedServer.name);
    }
  }

  @override
  Future<SyncBatchResponse> submitSyncBatch(FieldSyncBatch batch) async {
    await localDatabase.saveSyncBatch(batch.toJson());

    if (apiClient != null) {
      try {
        final res = await apiClient!.post(
          '/sync/batch',
          body: batch.toJson(),
          headers: {
            'X-Shift-Id': batch.shiftId,
            'X-Collector-Id': batch.collectorId,
            'X-Device-Id': batch.deviceId,
          },
        );

        if (res is Map) {
          final resultsList = (res['results'] as List?)?.map((r) {
            return SyncBatchItemResult(
              idempotencyKey: r['idempotency_key']?.toString() ?? '',
              status: r['status']?.toString() ?? 'COMMITTED',
              ledgerTxId: r['ledger_tx_id']?.toString(),
            );
          }).toList() ?? [];

          final committedKeys = resultsList
              .where((r) => r.status == 'COMMITTED')
              .map((r) => r.idempotencyKey)
              .toSet();

          final entryIdsToMark = batch.transactions
              .where((t) => committedKeys.contains(t.idempotencyKey))
              .map((t) => t.id)
              .toList();

          await markEntriesSynced(entryIdsToMark);

          return SyncBatchResponse(
            success: res['status'] == 'SUCCESS',
            batchId: res['batch_id']?.toString() ?? batch.batchId,
            processedCount: res['processed_count'] as int? ?? resultsList.length,
            serverTimestamp: res['server_timestamp'] != null
                ? DateTime.parse(res['server_timestamp'].toString())
                : DateTime.now().toUtc(),
            results: resultsList,
          );
        }
      } catch (_) {}
    }

    // Local commit fallback for offline mode
    final itemResults = batch.transactions.map((t) {
      return SyncBatchItemResult(
        idempotencyKey: t.idempotencyKey,
        status: 'COMMITTED',
        ledgerTxId: 'LTX-LOCAL-${t.sequenceNumber}',
      );
    }).toList();

    final entryIds = batch.transactions.map((t) => t.id).toList();
    await markEntriesSynced(entryIds);

    return SyncBatchResponse(
      success: true,
      batchId: batch.batchId,
      processedCount: batch.transactions.length,
      serverTimestamp: DateTime.now().toUtc(),
      results: itemResults,
    );
  }
}

