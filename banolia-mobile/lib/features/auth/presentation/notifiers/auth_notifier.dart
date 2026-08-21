import 'package:flutter/foundation.dart';
import '../../domain/entities/auth_entities.dart';
import '../../domain/repositories/auth_usecases.dart';

enum AuthStatus { unauthenticated, authenticating, authenticated, error }

class AuthNotifier extends ChangeNotifier {
  final LoginWithPinUseCase loginWithPinUseCase;
  final BiometricAuthUseCase biometricAuthUseCase;
  final LogoutUseCase logoutUseCase;

  AuthStatus _status = AuthStatus.unauthenticated;
  User? _currentUser;
  String? _errorMessage;

  AuthNotifier({
    required this.loginWithPinUseCase,
    required this.biometricAuthUseCase,
    required this.logoutUseCase,
  });

  AuthStatus get status => _status;
  User? get currentUser => _currentUser;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _status == AuthStatus.authenticated;

  Future<void> loginWithPin(String username, String pin) async {
    _status = AuthStatus.authenticating;
    _errorMessage = null;
    notifyListeners();

    try {
      final session = await loginWithPinUseCase(username: username, pin: pin);
      _currentUser = session.user;
      _status = AuthStatus.authenticated;
    } catch (e) {
      _status = AuthStatus.error;
      _errorMessage = e.toString();
    }
    notifyListeners();
  }

  Future<void> loginWithBiometrics() async {
    _status = AuthStatus.authenticating;
    _errorMessage = null;
    notifyListeners();

    try {
      final session = await biometricAuthUseCase();
      _currentUser = session.user;
      _status = AuthStatus.authenticated;
    } catch (e) {
      _status = AuthStatus.error;
      _errorMessage = e.toString();
    }
    notifyListeners();
  }

  Future<void> logout() async {
    await logoutUseCase();
    _currentUser = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }
}
