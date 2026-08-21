import 'package:flutter_test/flutter_test.dart';
import 'package:banolia_mobile/core/errors/exceptions.dart';
import 'package:banolia_mobile/core/storage/local_database.dart';
import 'package:banolia_mobile/core/value_objects/money.dart';
import 'package:banolia_mobile/features/tontine/domain/entities/tontine_entities.dart';
import 'package:banolia_mobile/features/tontine/domain/services/tontine_stamp_engine.dart';
import 'package:banolia_mobile/features/tontine/domain/repositories/tontine_usecases.dart';
import 'package:banolia_mobile/features/tontine/data/tontine_repository_impl.dart';

void main() {
  group('31-Day Tontine Stamp Allocation Engine', () {
    const dailyMise = Money(1000); // 1 000 F.CFA per day

    test('1. Standard 1-Day: Allocates next unpaid day', () {
      // Days 1..13 already paid (0x1FFF = 13 bits set)
      final res = TontineStampEngine.allocate(
        dailyMise: dailyMise,
        currentBitmask: 0x00001FFF,
        creditBuffer: Money.zero,
        paymentAmount: const Money(1000),
      );

      expect(res.allocatedDays, equals([14]));
      expect(res.newPaidCount, equals(14));
      expect(res.newCreditBuffer, equals(Money.zero));
      expect(res.isCycleCompleted, isFalse);
    });

    test('2. Advance Multi-Day: 3 000 F allocates next 3 days', () {
      final res = TontineStampEngine.allocate(
        dailyMise: dailyMise,
        currentBitmask: 0x00001FFF, // 13 days paid
        creditBuffer: Money.zero,
        paymentAmount: const Money(3000),
      );

      expect(res.allocatedDays, equals([14, 15, 16]));
      expect(res.newPaidCount, equals(16));
      expect(res.newCreditBuffer, equals(Money.zero));
    });

    test('3. Partial Coin Deposit: 500 F stores in credit buffer without allocating stamp', () {
      final res = TontineStampEngine.allocate(
        dailyMise: dailyMise,
        currentBitmask: 0x00001FFF,
        creditBuffer: Money.zero,
        paymentAmount: const Money(500),
      );

      expect(res.allocatedDays, isEmpty);
      expect(res.newPaidCount, equals(13));
      expect(res.newCreditBuffer, equals(const Money(500)));
    });

    test('4. Buffer Completion: 500 F + 500 F existing buffer allocates 1 full stamp', () {
      final res = TontineStampEngine.allocate(
        dailyMise: dailyMise,
        currentBitmask: 0x00001FFF,
        creditBuffer: const Money(500),
        paymentAmount: const Money(500),
      );

      expect(res.allocatedDays, equals([14]));
      expect(res.newPaidCount, equals(14));
      expect(res.newCreditBuffer, equals(Money.zero));
    });

    test('5. Final Day Closure: Reaches day 31 and marks cycle completed', () {
      // Days 1..29 paid (29 bits set)
      final bitmask29 = (1 << 29) - 1;

      final res = TontineStampEngine.allocate(
        dailyMise: dailyMise,
        currentBitmask: bitmask29,
        creditBuffer: Money.zero,
        paymentAmount: const Money(2000), // Pays day 30 and day 31 (commission)
      );

      expect(res.allocatedDays, equals([30, 31]));
      expect(res.newPaidCount, equals(31));
      expect(res.isCycleCompleted, isTrue);
    });
  });

  group('Cryptographic Tamper-Evident Hash Chaining', () {
    late LocalDatabase localDb;
    late ITontineRepository tontineRepo;
    late RecordOfflineCotisationUseCase recordUseCase;
    late VerifyHashChainIntegrityUseCase verifyUseCase;
    const shiftId = 'SHIFT-20260820-001';
    const rootHash = 'a7f8b92d6e3c1a4f5b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a';

    setUp(() async {
      localDb = LocalDatabase();
      tontineRepo = TontineRepositoryImpl(localDatabase: localDb);
      recordUseCase = RecordOfflineCotisationUseCase(repository: tontineRepo);
      verifyUseCase = VerifyHashChainIntegrityUseCase(tontineRepo);

      // Create test card
      final card = FieldTontineCard(
        id: 'CARD-2026-0883',
        memberCode: 'A0200389',
        accountNumber: '258000A020038901',
        cycleMonth: 8,
        cycleYear: 2026,
        dailyMise: const Money(1000),
        totalDays: 31,
        paidDaysCount: 0,
        stampsBitmask: 0,
        cumulativeAmount: Money.zero,
        commissionAmount: Money.zero,
        creditBuffer: Money.zero,
        status: TontineCardStatus.active,
        updatedAt: DateTime.now(),
      );
      await tontineRepo.saveCard(card);
    });

    test('Records 3 consecutive offline cotisations and verifies valid hash chain', () async {
      // Entry 1
      final e1 = await recordUseCase(
        shiftId: shiftId,
        rootHash: rootHash,
        lastEntryHash: '',
        currentSequenceNumber: 0,
        cardId: 'CARD-2026-0883',
        memberCode: 'A0200389',
        memberName: 'AMEGNINOU ABLAVI',
        stallNumber: 'Étal 42B',
        paymentAmount: const Money(2000),
      );
      expect(e1.sequenceNumber, equals(1));
      expect(e1.prevHash, equals(rootHash));

      // Entry 2
      final e2 = await recordUseCase(
        shiftId: shiftId,
        rootHash: rootHash,
        lastEntryHash: e1.entryHash,
        currentSequenceNumber: 1,
        cardId: 'CARD-2026-0883',
        memberCode: 'A0200389',
        memberName: 'AMEGNINOU ABLAVI',
        stallNumber: 'Étal 42B',
        paymentAmount: const Money(1000),
      );
      expect(e2.sequenceNumber, equals(2));
      expect(e2.prevHash, equals(e1.entryHash));

      // Entry 3
      final e3 = await recordUseCase(
        shiftId: shiftId,
        rootHash: rootHash,
        lastEntryHash: e2.entryHash,
        currentSequenceNumber: 2,
        cardId: 'CARD-2026-0883',
        memberCode: 'A0200389',
        memberName: 'AMEGNINOU ABLAVI',
        stallNumber: 'Étal 42B',
        paymentAmount: const Money(3000),
      );
      expect(e3.sequenceNumber, equals(3));
      expect(e3.prevHash, equals(e2.entryHash));

      // Verify intact chain
      final isValid = await verifyUseCase(shiftId: shiftId, rootHash: rootHash);
      expect(isValid, isTrue);
    });

    test('Tamper Detection: Modifying an amount in local journal breaks hash chain', () async {
      // Record 2 entries
      final e1 = await recordUseCase(
        shiftId: shiftId,
        rootHash: rootHash,
        lastEntryHash: '',
        currentSequenceNumber: 0,
        cardId: 'CARD-2026-0883',
        memberCode: 'A0200389',
        memberName: 'AMEGNINOU ABLAVI',
        stallNumber: 'Étal 42B',
        paymentAmount: const Money(5000),
      );

      await recordUseCase(
        shiftId: shiftId,
        rootHash: rootHash,
        lastEntryHash: e1.entryHash,
        currentSequenceNumber: 1,
        cardId: 'CARD-2026-0883',
        memberCode: 'A0200389',
        memberName: 'AMEGNINOU ABLAVI',
        stallNumber: 'Étal 42B',
        paymentAmount: const Money(2000),
      );

      // Fraudulent attempt: Modify amount of Entry 1 from 5000 to 1000 in DB
      localDb.rawJournal[0]['amount'] = 1000;

      // Verification must detect tampering and throw InvalidHashChainException
      expect(
        () => verifyUseCase(shiftId: shiftId, rootHash: rootHash),
        throwsA(isA<InvalidHashChainException>()),
      );
    });

    test('Tamper Detection: Deleting an entry creates a sequence gap and fails', () async {
      // Record 3 entries
      final e1 = await recordUseCase(
        shiftId: shiftId,
        rootHash: rootHash,
        lastEntryHash: '',
        currentSequenceNumber: 0,
        cardId: 'CARD-2026-0883',
        memberCode: 'A0200389',
        memberName: 'AMEGNINOU ABLAVI',
        stallNumber: 'Étal 42B',
        paymentAmount: const Money(1000),
      );

      final e2 = await recordUseCase(
        shiftId: shiftId,
        rootHash: rootHash,
        lastEntryHash: e1.entryHash,
        currentSequenceNumber: 1,
        cardId: 'CARD-2026-0883',
        memberCode: 'A0200389',
        memberName: 'AMEGNINOU ABLAVI',
        stallNumber: 'Étal 42B',
        paymentAmount: const Money(1000),
      );

      await recordUseCase(
        shiftId: shiftId,
        rootHash: rootHash,
        lastEntryHash: e2.entryHash,
        currentSequenceNumber: 2,
        cardId: 'CARD-2026-0883',
        memberCode: 'A0200389',
        memberName: 'AMEGNINOU ABLAVI',
        stallNumber: 'Étal 42B',
        paymentAmount: const Money(1000),
      );

      // Delete entry 2
      localDb.rawJournal.removeAt(1);

      expect(
        () => verifyUseCase(shiftId: shiftId, rootHash: rootHash),
        throwsA(isA<InvalidHashChainException>()),
      );
    });

    test('Sync Engine: Batch sync uploads pending journal entries and marks them committed', () async {
      // Record 2 entries
      final e1 = await recordUseCase(
        shiftId: shiftId,
        rootHash: rootHash,
        lastEntryHash: '',
        currentSequenceNumber: 0,
        cardId: 'CARD-2026-0883',
        memberCode: 'A0200389',
        memberName: 'AMEGNINOU ABLAVI',
        stallNumber: 'Étal 42B',
        paymentAmount: const Money(2000),
      );

      final e2 = await recordUseCase(
        shiftId: shiftId,
        rootHash: rootHash,
        lastEntryHash: e1.entryHash,
        currentSequenceNumber: 1,
        cardId: 'CARD-2026-0883',
        memberCode: 'A0200389',
        memberName: 'AMEGNINOU ABLAVI',
        stallNumber: 'Étal 42B',
        paymentAmount: const Money(1000),
      );

      final syncUseCase = SyncTontineBatchUseCase(
        repository: tontineRepo,
        verifyHashChainIntegrityUseCase: verifyUseCase,
      );

      final syncResponse = await syncUseCase(
        shiftId: shiftId,
        collectorId: 'COL-04',
        deviceId: 'DEV-POS-04',
        rootHash: rootHash,
        tipHash: e2.entryHash,
      );

      expect(syncResponse.success, isTrue);
      expect(syncResponse.processedCount, equals(2));
      expect(syncResponse.results.length, equals(2));
      expect(syncResponse.results.every((r) => r.status == 'COMMITTED'), isTrue);

      // Verify entries are no longer pending
      final pendingAfter = await tontineRepo.getPendingSyncEntries();
      expect(pendingAfter, isEmpty);
    });
  });
}

