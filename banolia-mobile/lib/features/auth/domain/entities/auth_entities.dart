enum UserRole { member, collector, supervisor, admin }

class User {
  final String id;
  final String username;
  final String fullName;
  final String? memberCode;
  final String? collectorId;
  final String? agencyCode;
  final UserRole role;

  const User({
    required this.id,
    required this.username,
    required this.fullName,
    this.memberCode,
    this.collectorId,
    this.agencyCode,
    required this.role,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is User &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          username == other.username &&
          role == other.role;

  @override
  int get hashCode => Object.hash(id, username, role);
}

class AuthSession {
  final User user;
  final String token;
  final String? refreshToken;
  final DateTime expiresAt;

  const AuthSession({
    required this.user,
    required this.token,
    this.refreshToken,
    required this.expiresAt,
  });

  bool get isExpired => DateTime.now().isAfter(expiresAt);
}
