import 'package:intl/intl.dart';

/// Standard Date Formatting utilities
class DateFormatter {
  DateFormatter._();

  static final DateFormat _dateTimeFormat = DateFormat('dd/MM/yyyy HH:mm:ss');
  static final DateFormat _dateFormat = DateFormat('dd/MM/yyyy');
  static final DateFormat _isoFormat = DateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
  static final DateFormat _shortDateFormat = DateFormat('dd MMM yyyy', 'fr_FR');

  static String formatDateTime(DateTime date) => _dateTimeFormat.format(date);
  static String formatDate(DateTime date) => _dateFormat.format(date);
  static String formatShortDate(DateTime date) => _shortDateFormat.format(date);
  static String formatIso(DateTime date) => _isoFormat.format(date.toUtc());

  static DateTime parseIso(String isoString) => DateTime.parse(isoString);
}
