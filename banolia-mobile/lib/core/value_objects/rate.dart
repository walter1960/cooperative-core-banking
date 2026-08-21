import '../constants/bceao_constants.dart';

/// Percentage Rate Value Object
class Rate implements Comparable<Rate> {
  final double percent; // e.g. 12.0 for 12.0%

  const Rate(this.percent);

  static const Rate zero = Rate(0.0);

  double get decimalFraction => percent / 100.0;

  bool isAboveUsuryCeiling({double ceiling = BceaoConstants.usuryRateCeilingPercent}) =>
      percent > ceiling;

  @override
  int compareTo(Rate other) => percent.compareTo(other.percent);

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Rate && runtimeType == other.runtimeType && percent == other.percent;

  @override
  int get hashCode => percent.hashCode;

  @override
  String toString() => '${percent.toStringAsFixed(2)}%';
}
