/// Member Code Value Object (e.g. A0200225)
class MemberCode {
  final String value;

  const MemberCode(this.value);

  bool get isValid => value.trim().isNotEmpty;

  String get agencyPrefix => value.length >= 3 ? value.substring(0, 3) : '';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MemberCode && runtimeType == other.runtimeType && value == other.value;

  @override
  int get hashCode => value.hashCode;

  @override
  String toString() => value;
}
