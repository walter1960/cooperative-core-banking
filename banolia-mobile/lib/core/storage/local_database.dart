/// Structured Local In-Memory & File Store for Offline Operations
class LocalDatabase {
  final Map<String, Map<String, dynamic>> _shifts = {};
  final Map<String, Map<String, dynamic>> _members = {};
  final Map<String, Map<String, dynamic>> _cards = {};
  final List<Map<String, dynamic>> _journal = [];
  final Map<String, Map<String, dynamic>> _syncBatches = {};
  final Map<String, Map<String, dynamic>> _cachedAccounts = {};
  final List<Map<String, dynamic>> _cachedTransactions = [];

  // Shifts
  Future<void> saveShift(Map<String, dynamic> shiftData) async {
    _shifts[shiftData['id'] as String] = Map<String, dynamic>.from(shiftData);
  }

  Future<Map<String, dynamic>?> getShift(String id) async {
    final shift = _shifts[id];
    return shift != null ? Map<String, dynamic>.from(shift) : null;
  }

  Future<Map<String, dynamic>?> getActiveShift() async {
    for (final s in _shifts.values) {
      final status = s['status']?.toString().toUpperCase();
      if (status == 'OPEN' || status == 'SETTLING') {
        return Map<String, dynamic>.from(s);
      }
    }
    return null;
  }

  // Members
  Future<void> saveMembers(List<Map<String, dynamic>> memberList) async {
    for (final m in memberList) {
      _members[m['member_code'] as String] = Map<String, dynamic>.from(m);
    }
  }

  Future<Map<String, dynamic>?> getMember(String memberCode) async {
    final m = _members[memberCode];
    return m != null ? Map<String, dynamic>.from(m) : null;
  }

  Future<List<Map<String, dynamic>>> getAllMembers() async {
    return _members.values.map((e) => Map<String, dynamic>.from(e)).toList();
  }

  // Cards
  Future<void> saveCard(Map<String, dynamic> cardData) async {
    _cards[cardData['id'] as String] = Map<String, dynamic>.from(cardData);
  }

  Future<void> saveCards(List<Map<String, dynamic>> cardList) async {
    for (final c in cardList) {
      _cards[c['id'] as String] = Map<String, dynamic>.from(c);
    }
  }

  Future<Map<String, dynamic>?> getCard(String cardId) async {
    final c = _cards[cardId];
    return c != null ? Map<String, dynamic>.from(c) : null;
  }

  Future<List<Map<String, dynamic>>> getCardsForMember(String memberCode) async {
    return _cards.values
        .where((c) => c['member_code'] == memberCode)
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  // Journal
  Future<void> appendJournalEntry(Map<String, dynamic> entry) async {
    _journal.add(Map<String, dynamic>.from(entry));
  }

  Future<List<Map<String, dynamic>>> getJournalEntriesForShift(String shiftId) async {
    return _journal
        .where((j) => j['shift_id'] == shiftId)
        .map((e) => Map<String, dynamic>.from(e))
        .toList()
      ..sort((a, b) => (a['sequence_number'] as int).compareTo(b['sequence_number'] as int));
  }

  Future<List<Map<String, dynamic>>> getPendingSyncEntries() async {
    return _journal
        .where((j) => j['sync_status'] == 'PENDING_SYNC')
        .map((e) => Map<String, dynamic>.from(e))
        .toList()
      ..sort((a, b) => (a['sequence_number'] as int).compareTo(b['sequence_number'] as int));
  }

  Future<void> updateEntrySyncStatus(String entryId, String status) async {
    for (final j in _journal) {
      if (j['id'] == entryId) {
        j['sync_status'] = status;
        break;
      }
    }
  }

  // Direct raw access for tests to simulate tampering / integrity checks
  List<Map<String, dynamic>> get rawJournal => _journal;

  // Sync Batches
  Future<void> saveSyncBatch(Map<String, dynamic> batch) async {
    _syncBatches[batch['batch_id'] as String] = Map<String, dynamic>.from(batch);
  }

  Future<Map<String, dynamic>?> getSyncBatch(String batchId) async {
    final b = _syncBatches[batchId];
    return b != null ? Map<String, dynamic>.from(b) : null;
  }

  // Clear all for tests
  Future<void> clearAll() async {
    _shifts.clear();
    _members.clear();
    _cards.clear();
    _journal.clear();
    _syncBatches.clear();
    _cachedAccounts.clear();
    _cachedTransactions.clear();
  }
}
