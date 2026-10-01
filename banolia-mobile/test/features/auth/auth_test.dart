import 'package:flutter_test/flutter_test.dart';
import 'package:banolia_mobile/core/network/api_client.dart';
import 'package:banolia_mobile/core/network/network_info.dart';
import 'package:banolia_mobile/core/storage/secure_storage.dart';
import 'package:banolia_mobile/features/auth/domain/entities/auth_entities.dart';
import 'package:banolia_mobile/features/auth/domain/repositories/auth_usecases.dart';
import 'package:banolia_mobile/features/auth/data/auth_data.dart';
import 'package:banolia_mobile/features/auth/presentation/notifiers/auth_notifier.dart';
import 'package:http/http.dart' as http;

void main() {
  group('Authentication & Session Management', () {
    late SecureStorageWrapper storage;
    late AuthLocalDataSource localDataSource;
    late ApiClient apiClient;
    late IAuthRepository authRepo;
    late LoginWithPinUseCase loginWithPinUseCase;
    late BiometricAuthUseCase biometricAuthUseCase;
    late LogoutUseCase logoutUseCase;

    setUp(() {
      storage = InMemorySecureStorageWrapper();
      localDataSource = AuthLocalDataSource(storage: storage);
      apiClient = ApiClient(httpClient: http.Client(), networkInfo: AlwaysOnlineNetworkInfo());
      authRepo = AuthRepositoryImpl(apiClient: apiClient, localDataSource: localDataSource);
      loginWithPinUseCase = LoginWithPinUseCase(authRepo);
      biometricAuthUseCase = BiometricAuthUseCase(authRepo);
      logoutUseCase = LogoutUseCase(authRepo);
    });

    test('LoginWithPin creates active session and stores token in secure storage', () async {
      final session = await loginWithPinUseCase(username: 'societaire_01', pin: '1234');

      expect(session.user.role, equals(UserRole.member));
      expect(session.user.fullName, equals('AMEGNINOU ABLAVI'));
      expect(session.token.isNotEmpty, isTrue);
      expect(session.isExpired, isFalse);

      final currentSession = await authRepo.getCurrentSession();
      expect(currentSession, isNotNull);
      expect(currentSession!.token, equals(session.token));
    });

    test('Collector login creates collector session with COL-04 ID', () async {
      final session = await loginWithPinUseCase(username: 'col_04', pin: '1234');

      expect(session.user.role, equals(UserRole.collector));
      expect(session.user.collectorId, equals('COL-04'));
      expect(session.user.fullName, equals('K. MINTA'));
    });

    test('Login validation throws on short PIN or empty username', () {
      expect(
        () => loginWithPinUseCase(username: '', pin: '1234'),
        throwsA(isA<ArgumentError>()),
      );
      expect(
        () => loginWithPinUseCase(username: 'test', pin: '12'),
        throwsA(isA<ArgumentError>()),
      );
    });

    test('Biometric authentication logs in using saved credentials', () async {
      // First login with PIN to save credentials
      await loginWithPinUseCase(username: 'societaire_01', pin: '1234');

      // Biometric login succeeds
      final bioSession = await biometricAuthUseCase();
      expect(bioSession.user.fullName, equals('AMEGNINOU ABLAVI'));
      expect(bioSession.isExpired, isFalse);
    });

    test('Logout clears session from secure storage', () async {
      await loginWithPinUseCase(username: 'societaire_01', pin: '1234');
      expect(await authRepo.getCurrentSession(), isNotNull);

      await logoutUseCase();
      expect(await authRepo.getCurrentSession(), isNull);
    });

    test('AuthNotifier manages reactive authentication state transitions', () async {
      final notifier = AuthNotifier(
        loginWithPinUseCase: loginWithPinUseCase,
        biometricAuthUseCase: biometricAuthUseCase,
        logoutUseCase: logoutUseCase,
      );

      expect(notifier.isAuthenticated, isFalse);

      await notifier.loginWithPin('societaire_01', '1234');
      expect(notifier.isAuthenticated, isTrue);
      expect(notifier.currentUser?.fullName, equals('AMEGNINOU ABLAVI'));

      await notifier.logout();
      expect(notifier.isAuthenticated, isFalse);
      expect(notifier.currentUser, isNull);
    });
  });
}
