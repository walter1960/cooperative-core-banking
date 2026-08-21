import '../../../../core/value_objects/money.dart';
import '../entities/tontine_entities.dart';

/// 31-Day Tontine Stamp Allocation Engine (BCEAO Microfinance Model)
class TontineStampEngine {
  TontineStampEngine._();

  /// Allocates stamps given a payment amount and current card state.
  static StampAllocationResult allocate({
    required Money dailyMise,
    required int currentBitmask,
    required Money creditBuffer,
    required Money paymentAmount,
    int totalDays = 31,
  }) {
    if (paymentAmount.amountXof <= 0) {
      throw ArgumentError('Le montant du versement doit être strictement positif');
    }
    if (dailyMise.amountXof <= 0) {
      throw ArgumentError('La mise journalière doit être strictement positive');
    }

    final totalAvailable = creditBuffer.amountXof + paymentAmount.amountXof;
    final stampsToAllocate = totalAvailable ~/ dailyMise.amountXof;
    final newCreditBuffer = Money(totalAvailable % dailyMise.amountXof);

    final allocatedDays = <int>[];
    int updatedBitmask = currentBitmask;

    // Find first unpaid days in sequence
    for (int day = 1; day <= totalDays; day++) {
      if (allocatedDays.length >= stampsToAllocate) break;
      final bit = 1 << (day - 1);
      if ((updatedBitmask & bit) == 0) {
        updatedBitmask |= bit;
        allocatedDays.add(day);
      }
    }

    final newPaidCount = countSetBits(updatedBitmask);
    final isCompleted = newPaidCount >= totalDays;

    return StampAllocationResult(
      allocatedDays: allocatedDays,
      updatedBitmask: updatedBitmask,
      newPaidCount: newPaidCount,
      newCreditBuffer: newCreditBuffer,
      effectiveAmountAllocated: dailyMise * stampsToAllocate,
      isCycleCompleted: isCompleted,
    );
  }

  /// Counts the number of active (paid) bits in a 32-bit integer
  static int countSetBits(int n) {
    int count = 0;
    int temp = n;
    while (temp > 0) {
      count += temp & 1;
      temp >>= 1;
    }
    return count;
  }
}
