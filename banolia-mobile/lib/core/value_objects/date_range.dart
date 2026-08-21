/// Date Range Value Object for Statement and History Filtering
class DateRange {
  final DateTime startDate;
  final DateTime endDate;

  const DateRange({required this.startDate, required this.endDate});

  Duration get duration => endDate.difference(startDate);

  bool contains(DateTime date) =>
      (date.isAfter(startDate) || date.isAtSameMomentAs(startDate)) &&
      (date.isBefore(endDate) || date.isAtSameMomentAs(endDate));

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DateRange &&
          runtimeType == other.runtimeType &&
          startDate == other.startDate &&
          endDate == other.endDate;

  @override
  int get hashCode => Object.hash(startDate, endDate);
}
