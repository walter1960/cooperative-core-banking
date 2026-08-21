/// Phone Number Value Object supporting West African E.164 formats
class PhoneNumber {
  final String rawNumber;

  const PhoneNumber(this.rawNumber);

  /// Cleaned E.164 normalized phone (e.g. +22890123456)
  String get normalized {
    var clean = rawNumber.replaceAll(RegExp(r'[\s\-\(\)]'), '');
    if (clean.startsWith('00')) {
      clean = '+${clean.substring(2)}';
    } else if (!clean.startsWith('+')) {
      if (clean.length == 8) {
        // Default to Togo (+228) if 8 digits
        clean = '+228$clean';
      } else if (clean.length == 10 && (clean.startsWith('01') || clean.startsWith('05') || clean.startsWith('07'))) {
        // CI (+225)
        clean = '+225$clean';
      }
    }
    return clean;
  }

  bool get isValid => normalized.length >= 10 && normalized.startsWith('+');

  String get countryPrefix {
    final norm = normalized;
    if (norm.startsWith('+228')) return '+228'; // Togo
    if (norm.startsWith('+229')) return '+229'; // Benin
    if (norm.startsWith('+225')) return '+225'; // CI
    if (norm.startsWith('+221')) return '+221'; // Senegal
    if (norm.startsWith('+226')) return '+226'; // Burkina
    if (norm.startsWith('+223')) return '+223'; // Mali
    return '';
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PhoneNumber && runtimeType == other.runtimeType && normalized == other.normalized;

  @override
  int get hashCode => normalized.hashCode;

  @override
  String toString() => normalized;
}
