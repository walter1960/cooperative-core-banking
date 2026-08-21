import '../entities/auth_entities.dart';

abstract class IAuthRepository {
  Future<AuthSession> loginWithPin({required String username, required String pin});
  Future<AuthSession> loginWithBiometrics();
  Future<AuthSession?> getCurrentSession();
  Future<void> logout();
  Future<bool> hasSavedCredentials();
}

class LoginWithPinUseCase {
  final IAuthRepository repository;
  LoginWithPinUseCase(this.repository);

  Future<AuthSession> call({required String username, required String pin}) {
    if (username.trim().isEmpty) {
      throw ArgumentError('Identifiant requis');
    }
    if (pin.trim().length < 4) {
      throw ArgumentError('Le code PIN doit comporter au moins 4 chiffres');
    }
    return repository.loginWithPin(username: username, pin: pin);
  }
}

class BiometricAuthUseCase {
  final IAuthRepository repository;
  BiometricAuthUseCase(this.repository);

  Future<AuthSession> call() {
    return repository.loginWithBiometrics();
  }
}

class LogoutUseCase {
  final IAuthRepository repository;
  LogoutUseCase(this.repository);

  Future<void> call() {
    return repository.logout();
  }
}
