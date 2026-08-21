import 'package:flutter/foundation.dart';
import '../../../../core/value_objects/money.dart';
import '../../domain/entities/field_collector_entities.dart';
import '../../domain/repositories/field_collector_usecases.dart';

class FieldCollectorNotifier extends ChangeNotifier {
  final OpenShiftUseCase openShiftUseCase;
  final CloseShiftUseCase closeShiftUseCase;
  final ReconcileCollectorShiftUseCase reconcileCollectorShiftUseCase;
  final SortMembersByDistanceUseCase sortMembersByDistanceUseCase;
  final SearchFieldMembersUseCase searchFieldMembersUseCase;
  final IFieldCollectorRepository repository;

  CollectorShift? _activeShift;
  List<FieldMember> _members = [];
  List<FieldMember> _filteredMembers = [];
  BilletageReconciliation? _lastReconciliation;
  bool _isLoading = false;
  String? _errorMessage;

  FieldCollectorNotifier({
    required this.openShiftUseCase,
    required this.closeShiftUseCase,
    required this.reconcileCollectorShiftUseCase,
    required this.sortMembersByDistanceUseCase,
    required this.searchFieldMembersUseCase,
    required this.repository,
  });

  CollectorShift? get activeShift => _activeShift;
  List<FieldMember> get members => _filteredMembers;
  BilletageReconciliation? get lastReconciliation => _lastReconciliation;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> loadShiftAndRoster() async {
    _isLoading = true;
    notifyListeners();

    try {
      _activeShift = await repository.getActiveShift();
      _members = await repository.getFieldMembers();
      _filteredMembers = _members;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<CollectorShift?> openShift({
    required String collectorId,
    required String collectorName,
    required String deviceId,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _activeShift = await openShiftUseCase(
        collectorId: collectorId,
        collectorName: collectorName,
        deviceId: deviceId,
      );
      return _activeShift;
    } catch (e) {
      _errorMessage = e.toString();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  BilletageReconciliation reconcileBilletage(List<BilletageItem> items) {
    final journalTotal = _activeShift?.totalCollectedAmount ?? Money.zero;
    _lastReconciliation = reconcileCollectorShiftUseCase(items: items, journalTotal: journalTotal);
    notifyListeners();
    return _lastReconciliation!;
  }

  Future<CollectorShift?> closeShift({String? discrepancyReason}) async {
    if (_activeShift == null || _lastReconciliation == null) return null;

    _isLoading = true;
    notifyListeners();

    try {
      _activeShift = await closeShiftUseCase(
        shiftId: _activeShift!.id,
        reconciliation: _lastReconciliation!,
        discrepancyReason: discrepancyReason,
      );
      return _activeShift;
    } catch (e) {
      _errorMessage = e.toString();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void search(String query) {
    _filteredMembers = searchFieldMembersUseCase(members: _members, query: query);
    notifyListeners();
  }

  void sortByDistance(double lat, double lon) {
    _filteredMembers = sortMembersByDistanceUseCase(
      members: _filteredMembers,
      currentLatitude: lat,
      currentLongitude: lon,
    );
    notifyListeners();
  }
}
