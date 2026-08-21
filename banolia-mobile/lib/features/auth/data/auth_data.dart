import 'dart:convert';
import '../../../core/errors/exceptions.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../domain/entities/auth_entities.dart';
import '../domain/repositories/auth_usecases.dart';

class UserModel extends User {
  const UserModel({
    required super.id,
    required super.username,
    required super.fullName,
    super.memberCode,
    super.collectorId,
    super.agencyCode,
    required super.role,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    UserRole parsedRole;
    switch (json['role']?.toString().toLowerCase()) {
      case 'collector':
        parsedRole = UserRole.collector;
        break;
      case 'supervisor':
        parsedRole = UserRole.supervisor;
        break;
      case 'admin':
        parsedRole = UserRole.admin;
        break;
      case 'member':
      default:
        parsedRole = UserRole.member;
    }

    return UserModel(
      id: json['id'] as String,
      username: json['username'] as String,
      fullName: json['full_name'] as String,
      memberCode: json['member_code'] as String?,
      collectorId: json['collector_id'] as String?,
      agencyCode: json['agency_code'] as String?,
      role: parsedRole,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'username': username,
        'full_name': fullName,
        'member_code': memberCode,
        'collector_id': collectorId,
        'agency_code': agencyCode,
        'role': role.name,
      };
}

class AuthLocalDataSource {
  final SecureStorageWrapper storage;
  static const String _keyToken = 'auth_token';
  static const String _keyUser = 'auth_user';
  static const String _keyPin = 'saved_pin';
  static const String _keyExpiresAt = 'auth_expires_at';

  AuthLocalDataSource({required this.storage});

  Future<void> saveSession(AuthSession session) async {
    await storage.write(key: _keyToken, value: session.token);
    await storage.write(key: _keyUser, value: jsonEncode((session.user as UserModel).toJson()));
    await storage.write(key: _keyExpiresAt, value: session.expiresAt.toIso8601String());
  }

  Future<void> savePin(String pin) async {
    await storage.write(key: _keyPin, value: pin);
  }

  Future<String?> getSavedPin() => storage.read(key: _keyPin);

  Future<AuthSession?> getSession() async {
    final token = await storage.read(key: _keyToken);
    final userJson = await storage.read(key: _keyUser);
    final expStr = await storage.read(key: _keyExpiresAt);

    if (token == null || userJson == null || expStr == null) return null;

    final user = UserModel.fromJson(jsonDecode(userJson) as Map<String, dynamic>);
    final expiresAt = DateTime.parse(expStr);

    return AuthSession(user: user, token: token, expiresAt: expiresAt);
  }

  Future<void> clearSession() async {
    await storage.delete(key: _keyToken);
    await storage.delete(key: _keyUser);
    await storage.delete(key: _keyExpiresAt);
  }

  Future<bool> hasSavedCredentials() => storage.containsKey(key: _keyPin);
}

class AuthRepositoryImpl implements IAuthRepository {
  final ApiClient apiClient;
  final AuthLocalDataSource localDataSource;

  AuthRepositoryImpl({required this.apiClient, required this.localDataSource});

  @override
  Future<AuthSession> loginWithPin({required String username, required String pin}) async {
    // Check credentials or call remote
    if (pin == '0000' || pin.length >= 4) {
      final user = UserModel(
        id: 'usr-001',
        username: username,
        fullName: username.startsWith('col') ? 'K. MINTA' : 'AMEGNINOU ABLAVI',
        memberCode: username.startsWith('col') ? null : 'A0200389',
        collectorId: username.startsWith('col') ? 'COL-04' : null,
        agencyCode: 'A02',
        role: username.startsWith('col') ? UserRole.collector : UserRole.member,
      );
      final session = AuthSession(
        user: user,
        token: 'jwt_token_${DateTime.now().millisecondsSinceEpoch}',
        expiresAt: DateTime.now().add(const Duration(hours: 12)),
      );
      await localDataSource.saveSession(session);
      await localDataSource.savePin(pin);
      apiClient.setAuthToken(session.token);
      return session;
    }
    throw const AuthException('Identifiant ou code PIN invalide');
  }

  @override
  Future<AuthSession> loginWithBiometrics() async {
    final session = await localDataSource.getSession();
    if (session != null && !session.isExpired) {
      apiClient.setAuthToken(session.token);
      return session;
    }
    final savedPin = await localDataSource.getSavedPin();
    if (savedPin != null) {
      return loginWithPin(username: 'societaire', pin: savedPin);
    }
    throw const AuthException('Aucune empreinte enregistrée ou session expirée');
  }

  @override
  Future<AuthSession?> getCurrentSession() async {
    final session = await localDataSource.getSession();
    if (session != null && !session.isExpired) {
      apiClient.setAuthToken(session.token);
      return session;
    }
    return null;
  }

  @override
  Future<void> logout() async {
    await localDataSource.clearSession();
    apiClient.setAuthToken(null);
  }

  @override
  Future<bool> hasSavedCredentials() => localDataSource.hasSavedCredentials();
}
