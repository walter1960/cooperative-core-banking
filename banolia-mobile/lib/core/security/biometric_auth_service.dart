import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class BiometricAuthService {
  static final BiometricAuthService _instance = BiometricAuthService._internal();
  factory BiometricAuthService() => _instance;
  BiometricAuthService._internal();

  final LocalAuthentication _localAuth = LocalAuthentication();
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  /// Vérifie si l'appareil supporte la biométrie (Empreinte digitale / Face ID)
  Future<bool> isBiometricsAvailable() async {
    try {
      final canAuthenticateWithBiometrics = await _localAuth.canCheckBiometrics;
      final isDeviceSupported = await _localAuth.isDeviceSupported();
      return canAuthenticateWithBiometrics || isDeviceSupported;
    } on PlatformException {
      return false;
    }
  }

  /// Récupère la liste des biométries disponibles sur l'appareil (Fingerprint, Face, Iris)
  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      return await _localAuth.getAvailableBiometrics();
    } on PlatformException {
      return [];
    }
  }

  /// Déclenche le prompt natif d'authentification de l'appareil (Android BiometricPrompt / Apple Face ID)
  Future<bool> authenticateWithBiometrics({
    String reason = 'Veuillez vous authentifier pour accéder à vos comptes',
  }) async {
    try {
      final isAvailable = await isBiometricsAvailable();
      if (!isAvailable) return false;

      return await _localAuth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false,
          useErrorDialogs: true,
        ),
      );
    } on PlatformException {
      return false;
    }
  }

  /// Enregistre les identifiants de session chiffrés de manière sécurisée (Keystore Android / Keychain iOS)
  Future<void> saveEnrolledCredentials(String username, String sessionToken) async {
    await _secureStorage.write(key: 'biometric_username', value: username);
    await _secureStorage.write(key: 'biometric_token', value: sessionToken);
    await _secureStorage.write(key: 'biometric_enabled', value: 'true');
  }

  /// Vérifie si l'adhérent a déjà activé la biométrie sur cet appareil
  Future<bool> isBiometricEnrolled() async {
    final enabled = await _secureStorage.read(key: 'biometric_enabled');
    return enabled == 'true';
  }

  /// Désactive la biométrie
  Future<void> disableBiometrics() async {
    await _secureStorage.delete(key: 'biometric_username');
    await _secureStorage.delete(key: 'biometric_token');
    await _secureStorage.write(key: 'biometric_enabled', value: 'false');
  }
}
