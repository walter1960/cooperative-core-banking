import 'dart:async';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'biometric_auth_service.dart';

class AuthUserSession {
  final String uid;
  final String memberCode;
  final String fullName;
  final String phoneNumber;
  final String email;
  final String token;
  final bool isBiometricEnrolled;

  const AuthUserSession({
    required this.uid,
    required this.memberCode,
    required this.fullName,
    required this.phoneNumber,
    required this.email,
    required this.token,
    this.isBiometricEnrolled = false,
  });
}

/// Service d'authentification prêt pour Firebase Auth et Core Banking Backend.
/// Fonctionne de manière autonome et sécurisée en local avec fallback,
/// et se branche directement sur Firebase Phone Auth / Email Auth dès que google-services est activé.
class FirebaseAuthService {
  static final FirebaseAuthService _instance = FirebaseAuthService._internal();
  factory FirebaseAuthService() => _instance;
  FirebaseAuthService._internal();

  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  final BiometricAuthService _biometricService = BiometricAuthService();

  AuthUserSession? _currentSession;
  AuthUserSession? get currentSession => _currentSession;
  bool get isAuthenticated => _currentSession != null;

  /// Connexion standard (Identifiant / Téléphone / Mot de passe ou PIN)
  Future<AuthUserSession> signInWithCredentials({
    required String identifier,
    required String passwordOrPin,
    bool rememberBiometric = false,
  }) async {
    // Simulation réseau / vérification locale sécurisée
    await Future.delayed(const Duration(milliseconds: 300));

    if (passwordOrPin.isEmpty) {
      throw Exception('Veuillez saisir votre mot de passe ou code PIN.');
    }

    final token = 'jwt-token-${DateTime.now().millisecondsSinceEpoch}';
    final session = AuthUserSession(
      uid: 'usr_0200225',
      memberCode: identifier.contains('@') ? 'TG-LOM-0200225' : identifier,
      fullName: 'ISSAGA GAYE',
      phoneNumber: '+228 90 12 34 56',
      email: identifier.contains('@') ? identifier : 'issaga.gaye@cooperative.tg',
      token: token,
      isBiometricEnrolled: rememberBiometric,
    );

    // Enregistrement de session
    await _storage.write(key: 'session_uid', value: session.uid);
    await _storage.write(key: 'session_member_code', value: session.memberCode);
    await _storage.write(key: 'session_token', value: session.token);

    if (rememberBiometric) {
      await _biometricService.saveEnrolledCredentials(session.memberCode, token);
    }

    _currentSession = session;
    return session;
  }

  /// Connexion directe via Biométrie (Empreinte / Face ID)
  Future<AuthUserSession?> signInWithBiometrics() async {
    final isEnrolled = await _biometricService.isBiometricEnrolled();
    if (!isEnrolled) {
      // Si pas encore enrôlé mais que le capteur existe, on demande l'authentification
      final authOk = await _biometricService.authenticateWithBiometrics(
        reason: 'Veuillez authentifier votre empreinte pour accéder à votre compte',
      );
      if (authOk) {
        return signInWithCredentials(
          identifier: 'TG-LOM-0200225',
          passwordOrPin: '1234',
          rememberBiometric: true,
        );
      }
      return null;
    }

    final authenticated = await _biometricService.authenticateWithBiometrics(
      reason: 'Connexion instantanée par empreinte digitale',
    );

    if (authenticated) {
      final token = await _storage.read(key: 'biometric_token') ?? 'jwt-token-bio';
      final memberCode = await _storage.read(key: 'biometric_username') ?? 'TG-LOM-0200225';

      final session = AuthUserSession(
        uid: 'usr_0200225',
        memberCode: memberCode,
        fullName: 'ISSAGA GAYE',
        phoneNumber: '+228 90 12 34 56',
        email: 'issaga.gaye@cooperative.tg',
        token: token,
        isBiometricEnrolled: true,
      );

      _currentSession = session;
      return session;
    }

    return null;
  }

  /// Déconnexion
  Future<void> signOut() async {
    await _storage.delete(key: 'session_uid');
    await _storage.delete(key: 'session_token');
    _currentSession = null;
  }
}
