/// Account Number Value Object conforming to SYSCOA-SFD classification
class AccountNumber {
  final String value;

  const AccountNumber(this.value);

  /// Extract 6-digit product code (e.g. 251100)
  String get productCode => value.length >= 6 ? value.substring(0, 6) : '';

  bool get isValid => value.length >= 6;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AccountNumber && runtimeType == other.runtimeType && value == other.value;

  @override
  int get hashCode => value.hashCode;

  @override
  String toString() => value;
}
