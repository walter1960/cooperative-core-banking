import 'package:flutter/foundation.dart';
import '../../../../core/value_objects/money.dart';
import '../../domain/entities/tontine_entities.dart';
import '../../domain/repositories/tontine_usecases.dart';

class TontineNotifier extends ChangeNotifier {
  final RecordOfflineCotisationUseCase recordOfflineCotisationUseCase;
  final VerifyHashChainIntegrityUseCase verifyHashChainIntegrityUseCase;
  final ITontineRepository repository;

  FieldTontineCard? _activeCard;
  List<FieldJournalEntry> _journalEntries = [];
  bool _isChainValid = true;
  bool _isLoading = false;
  String? _errorMessage;

  TontineNotifier({
    required this.recordOfflineCotisationUseCase,
    required this.verifyHashChainIntegrityUseCase,
    required this.repository,
  });

  FieldTontineCard? get activeCard => _activeCard;
  List<FieldJournalEntry> get journalEntries => _journalEntries;
  bool get isChainValid => _isChainValid;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> loadCard(String cardId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _activeCard = await repository.getCardById(cardId);
      if (_activeCard == null) {
        // Sample card fallback
        _activeCard = FieldTontineCard(
          id: cardId,
          memberCode: 'A0200389',
          accountNumber: '258000A020038901',
          cycleMonth: 8,
          cycleYear: 2026,
          dailyMise: const Money(1000),
          totalDays: 31,
          paidDaysCount: 13,
          stampsBitmask: 0x00001FFF, // Days 1..13 paid (13 bits set)
          cumulativeAmount: const Money(13000),
          commissionAmount: Money.zero,
          creditBuffer: Money.zero,
          status: TontineCardStatus.active,
          updatedAt: DateTime.now(),
        );
        await repository.saveCard(_activeCard!);
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<FieldJournalEntry?> recordCotisation({
    required String shiftId,
    required String rootHash,
    required String lastEntryHash,
    required int currentSequenceNumber,
    required String memberCode,
    required String memberName,
    required String stallNumber,
    required Money paymentAmount,
    double? latitude,
    double? longitude,
  }) async {
    if (_activeCard == null) return null;

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final entry = await recordOfflineCotisationUseCase(
        shiftId: shiftId,
        rootHash: rootHash,
        lastEntryHash: lastEntryHash,
        currentSequenceNumber: currentSequenceNumber,
        cardId: _activeCard!.id,
        memberCode: memberCode,
        memberName: memberName,
        stallNumber: stallNumber,
        paymentAmount: paymentAmount,
        latitude: latitude,
        longitude: longitude,
      );

      _activeCard = await repository.getCardById(_activeCard!.id);
      _journalEntries = await repository.getJournalForShift(shiftId);
      return entry;
    } catch (e) {
      _errorMessage = e.toString();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> verifyIntegrity(String shiftId, String rootHash) async {
    try {
      _isChainValid = await verifyHashChainIntegrityUseCase(
        shiftId: shiftId,
        rootHash: rootHash,
      );
      return _isChainValid;
    } catch (e) {
      _isChainValid = false;
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }
}
