import 'package:uuid/uuid.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/utils/hash_chain_utils.dart';
import '../../../../core/value_objects/money.dart';
import '../entities/tontine_entities.dart';
import '../services/tontine_stamp_engine.dart';

abstract class ITontineRepository {
  Future<FieldTontineCard?> getCardById(String cardId);
  Future<void> saveCard(FieldTontineCard card);
  Future<List<FieldJournalEntry>> getJournalForShift(String shiftId);
  Future<void> appendJournalEntry(FieldJournalEntry entry);
  Future<List<FieldJournalEntry>> getPendingSyncEntries();
  Future<void> markEntriesSynced(List<String> entryIds);
  Future<SyncBatchResponse> submitSyncBatch(FieldSyncBatch batch);
}

class AllocateStampsUseCase {
  StampAllocationResult call({
    required Money dailyMise,
    required int currentBitmask,
    required Money creditBuffer,
    required Money paymentAmount,
    int totalDays = 31,
  }) {
    return TontineStampEngine.allocate(
      dailyMise: dailyMise,
      currentBitmask: currentBitmask,
      creditBuffer: creditBuffer,
      paymentAmount: paymentAmount,
      totalDays: totalDays,
    );
  }
}

class RecordOfflineCotisationUseCase {
  final ITontineRepository repository;
  final String deviceSecretKey;

  RecordOfflineCotisationUseCase({
    required this.repository,
    this.deviceSecretKey = 'banolia_pos_terminal_hw_sec_key_2026',
  });

  Future<FieldJournalEntry> call({
    required String shiftId,
    required String rootHash,
    required String lastEntryHash, // empty string or shift root hash if sequence == 1
    required int currentSequenceNumber,
    required String cardId,
    required String memberCode,
    required String memberName,
    required String stallNumber,
    required Money paymentAmount,
    double? latitude,
    double? longitude,
    DateTime? timestamp,
  }) async {
    final card = await repository.getCardById(cardId);
    if (card == null) {
      throw const CacheException('Carte tontine introuvable en stockage local');
    }

    final now = timestamp ?? DateTime.now().toUtc();
    final timeIso = now.toIso8601String();
    final newSeqNo = currentSequenceNumber + 1;
    final idempotencyKey = 'idemp_col_${now.millisecondsSinceEpoch}_${const Uuid().v4().substring(0, 8)}';
    final receiptNumber = 'TON-${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}-${newSeqNo.toString().padLeft(4, '0')}';

    // 1. Allocate Stamps
    final allocation = TontineStampEngine.allocate(
      dailyMise: card.dailyMise,
      currentBitmask: card.stampsBitmask,
      creditBuffer: card.creditBuffer,
      paymentAmount: paymentAmount,
      totalDays: card.totalDays,
    );

    final updatedCard = card.copyWith(
      paidDaysCount: allocation.newPaidCount,
      stampsBitmask: allocation.updatedBitmask,
      cumulativeAmount: card.cumulativeAmount + paymentAmount,
      creditBuffer: allocation.newCreditBuffer,
      status: allocation.isCycleCompleted ? TontineCardStatus.completed : card.status,
      updatedAt: now,
    );

    // 2. Compute Cryptographic Hash Chain
    final prevHash = (newSeqNo == 1 || lastEntryHash.isEmpty) ? rootHash : lastEntryHash;

    final payloadCanonical = HashChainUtils.computePayloadCanonical(
      idempotencyKey: idempotencyKey,
      sequenceNumber: newSeqNo,
      memberCode: memberCode,
      cardId: cardId,
      amount: paymentAmount.amountXof,
      stampsCount: allocation.allocatedDays.length,
      timestampUtc: timeIso,
    );

    final payloadHash = HashChainUtils.computePayloadHash(payloadCanonical);
    final entryHash = HashChainUtils.computeEntryHash(
      prevHash: prevHash,
      payloadHash: payloadHash,
      sequenceNumber: newSeqNo,
    );

    final signatureHmac = HashChainUtils.computeHmacSignature(
      secretKey: deviceSecretKey,
      entryHash: entryHash,
    );

    final entry = FieldJournalEntry(
      id: const Uuid().v4(),
      shiftId: shiftId,
      sequenceNumber: newSeqNo,
      receiptNumber: receiptNumber,
      idempotencyKey: idempotencyKey,
      cardId: cardId,
      memberCode: memberCode,
      memberName: memberName,
      stallNumber: stallNumber,
      amount: paymentAmount,
      stampsAllocatedCount: allocation.allocatedDays.length,
      stampsIndices: allocation.allocatedDays,
      cumulativeAfter: updatedCard.cumulativeAmount,
      daysRemainingAfter: updatedCard.daysRemaining,
      prevHash: prevHash,
      payloadHash: payloadHash,
      entryHash: entryHash,
      signatureHmac: signatureHmac,
      latitude: latitude,
      longitude: longitude,
      timestampUtc: now,
      syncStatus: JournalSyncStatus.pendingSync,
    );

    await repository.saveCard(updatedCard);
    await repository.appendJournalEntry(entry);

    return entry;
  }
}

class VerifyHashChainIntegrityUseCase {
  final ITontineRepository repository;

  VerifyHashChainIntegrityUseCase(this.repository);

  Future<bool> call({
    required String shiftId,
    required String rootHash,
  }) async {
    final journal = await repository.getJournalForShift(shiftId);
    if (journal.isEmpty) return true;

    String expectedPrevHash = rootHash;

    for (int i = 0; i < journal.length; i++) {
      final entry = journal[i];
      final expectedSeq = i + 1;

      // 1. Sequence Continuity Check
      if (entry.sequenceNumber != expectedSeq) {
        throw InvalidHashChainException(
          message: 'Rupture de séquence détectée dans le journal (Attendu: $expectedSeq, Reçu: ${entry.sequenceNumber})',
          brokenSequenceNumber: entry.sequenceNumber,
          expectedHash: expectedPrevHash,
          actualHash: entry.prevHash,
        );
      }

      // 2. PrevHash Verification
      if (entry.prevHash != expectedPrevHash) {
        throw InvalidHashChainException(
          message: 'Chaînage altéré à la séquence ${entry.sequenceNumber} (PrevHash invalide)',
          brokenSequenceNumber: entry.sequenceNumber,
          expectedHash: expectedPrevHash,
          actualHash: entry.prevHash,
        );
      }

      // 3. Recompute Payload Hash
      final canonical = HashChainUtils.computePayloadCanonical(
        idempotencyKey: entry.idempotencyKey,
        sequenceNumber: entry.sequenceNumber,
        memberCode: entry.memberCode,
        cardId: entry.cardId,
        amount: entry.amount.amountXof,
        stampsCount: entry.stampsAllocatedCount,
        timestampUtc: entry.timestampUtc.toIso8601String(),
      );
      final computedPayloadHash = HashChainUtils.computePayloadHash(canonical);
      if (computedPayloadHash != entry.payloadHash) {
        throw InvalidHashChainException(
          message: 'Données de transaction altérées à la séquence ${entry.sequenceNumber} (PayloadHash altéré)',
          brokenSequenceNumber: entry.sequenceNumber,
          expectedHash: computedPayloadHash,
          actualHash: entry.payloadHash,
        );
      }

      // 4. Recompute Entry Hash
      final computedEntryHash = HashChainUtils.computeEntryHash(
        prevHash: entry.prevHash,
        payloadHash: entry.payloadHash,
        sequenceNumber: entry.sequenceNumber,
      );
      if (computedEntryHash != entry.entryHash) {
        throw InvalidHashChainException(
          message: 'Empreinte de bloc altérée à la séquence ${entry.sequenceNumber} (EntryHash corrompu)',
          brokenSequenceNumber: entry.sequenceNumber,
          expectedHash: computedEntryHash,
          actualHash: entry.entryHash,
        );
      }

      expectedPrevHash = entry.entryHash;
    }

    return true;
  }
}

class SyncTontineBatchUseCase {
  final ITontineRepository repository;
  final VerifyHashChainIntegrityUseCase verifyHashChainIntegrityUseCase;

  SyncTontineBatchUseCase({
    required this.repository,
    required this.verifyHashChainIntegrityUseCase,
  });

  Future<SyncBatchResponse> call({
    required String shiftId,
    required String collectorId,
    required String deviceId,
    required String rootHash,
    required String tipHash,
  }) async {
    // 1. Verify chain integrity before sync
    final isChainValid = await verifyHashChainIntegrityUseCase(
      shiftId: shiftId,
      rootHash: rootHash,
    );
    if (!isChainValid) {
      throw const InvalidHashChainException(
        message: 'Impossible de synchroniser: Le journal de collecte local a été altéré.',
      );
    }

    // 2. Fetch pending entries
    final allShiftEntries = await repository.getJournalForShift(shiftId);
    final pendingEntries = allShiftEntries
        .where((e) => e.syncStatus == JournalSyncStatus.pendingSync)
        .toList();

    if (pendingEntries.isEmpty) {
      return SyncBatchResponse(
        success: true,
        batchId: const Uuid().v4(),
        processedCount: 0,
        serverTimestamp: DateTime.now().toUtc(),
        results: [],
      );
    }

    int totalAmountXof = 0;
    for (final e in pendingEntries) {
      totalAmountXof += e.amount.amountXof;
    }

    final batch = FieldSyncBatch(
      batchId: const Uuid().v4(),
      shiftId: shiftId,
      collectorId: collectorId,
      deviceId: deviceId,
      startSeq: pendingEntries.first.sequenceNumber,
      endSeq: pendingEntries.last.sequenceNumber,
      transactionCount: pendingEntries.length,
      totalAmount: Money(totalAmountXof),
      rootHash: rootHash,
      tipHash: tipHash,
      transactions: pendingEntries,
      createdAt: DateTime.now().toUtc(),
    );

    return await repository.submitSyncBatch(batch);
  }
}

