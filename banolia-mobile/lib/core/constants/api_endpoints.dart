/// Remote API Endpoints for BANOLIA Core Backend
class ApiEndpoints {
  ApiEndpoints._();

  static const String baseUrl = 'https://core.banolia.org/api/v1';

  // Auth
  static const String authLogin = '/auth/login';
  static const String authBiometric = '/auth/biometric';
  static const String authRefresh = '/auth/refresh';
  static const String authLogout = '/auth/logout';

  // Member Portal
  static const String memberProfile = '/members/me';
  static const String memberAccounts = '/members/me/accounts';
  static const String accountBalances = '/accounts/{id}/balances';
  static const String accountTransactions = '/accounts/{id}/transactions';
  static const String accountStatement = '/accounts/{id}/statement';

  // Loans
  static const String loanProducts = '/loans/products';
  static const String loanSimulate = '/loans/simulate';
  static const String loanPrequalification = '/loans/prequalify';
  static const String loanApply = '/loans/apply';
  static const String loanApplications = '/loans/applications';

  // Mobile Money
  static const String momoC2bCollect = '/momo/c2b-collect';
  static const String momoB2cDisburse = '/momo/b2c-disburse';
  static const String momoStatus = '/momo/status/{txRef}';

  // Field Collector & Sync
  static const String syncBatch = '/sync/batch';
  static const String shiftOpen = '/collector/shifts/open';
  static const String shiftClose = '/collector/shifts/close';
  static const String fieldMembers = '/collector/members';
  static const String fieldCards = '/collector/cards';
}
