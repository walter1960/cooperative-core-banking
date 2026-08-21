import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'core/constants/app_colors.dart';
import 'core/network/api_client.dart';
import 'core/network/network_info.dart';
import 'core/storage/local_database.dart';
import 'core/storage/secure_storage.dart';

import 'features/auth/data/auth_data.dart';
import 'features/auth/domain/repositories/auth_usecases.dart';
import 'features/auth/presentation/notifiers/auth_notifier.dart';

import 'features/member_portal/data/member_portal_data.dart';
import 'features/member_portal/domain/repositories/member_portal_usecases.dart';
import 'features/member_portal/presentation/notifiers/member_portal_notifiers.dart';
import 'features/member_portal/presentation/screens/member_portal_screens.dart';

import 'features/loans/data/loan_data.dart';
import 'features/loans/domain/repositories/loan_usecases.dart';
import 'features/loans/presentation/notifiers/loan_notifiers.dart';
import 'features/loans/presentation/screens/loan_screens.dart';

import 'features/mobile_money/data/sandbox_simulation_engine.dart';
import 'features/mobile_money/domain/entities/mobile_money_entities.dart';
import 'features/mobile_money/domain/repositories/mobile_money_usecases.dart';
import 'features/mobile_money/presentation/notifiers/mobile_money_notifier.dart';
import 'features/mobile_money/presentation/screens/mobile_money_screens.dart';

import 'features/field_collector/data/field_collector_repository_impl.dart';
import 'features/field_collector/domain/repositories/field_collector_usecases.dart';
import 'features/field_collector/presentation/notifiers/field_collector_notifier.dart';
import 'features/field_collector/presentation/screens/field_collector_screens.dart';

import 'features/tontine/data/tontine_repository_impl.dart';
import 'features/tontine/domain/repositories/tontine_usecases.dart';
import 'features/tontine/presentation/notifiers/tontine_notifier.dart';

import 'features/receipt/virtual_thermal_printer_mock.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const BanoliaApp());
}

class BanoliaApp extends StatefulWidget {
  const BanoliaApp({super.key});

  @override
  State<BanoliaApp> createState() => _BanoliaAppState();
}

class _BanoliaAppState extends State<BanoliaApp> {
  late final SecureStorageWrapper secureStorage;
  late final LocalDatabase localDatabase;
  late final NetworkInfo networkInfo;
  late final ApiClient apiClient;
  late final VirtualThermalPrinterMock printerMock;

  // Auth
  late final AuthRepositoryImpl authRepository;
  late final AuthNotifier authNotifier;

  // Member Portal
  late final MemberRepositoryImpl memberRepository;
  late final AccountRepositoryImpl accountRepository;
  late final TransactionRepositoryImpl transactionRepository;
  late final MemberPortalNotifier memberPortalNotifier;

  // Loans
  late final LoanRepositoryImpl loanRepository;
  late final LoanNotifier loanNotifier;

  // Mobile Money
  late final SandboxSimulationEngine momoSandboxEngine;
  late final MobileMoneyNotifier momoNotifier;

  // Field Collector & Tontine
  late final FieldCollectorRepositoryImpl fieldCollectorRepository;
  late final FieldCollectorNotifier fieldCollectorNotifier;
  late final TontineRepositoryImpl tontineRepository;
  late final TontineNotifier tontineNotifier;

  @override
  void initState() {
    super.initState();

    // 1. Core Infrastructure
    secureStorage = InMemorySecureStorageWrapper();
    localDatabase = LocalDatabase();
    networkInfo = AlwaysOnlineNetworkInfo();
    apiClient = ApiClient(httpClient: http.Client(), networkInfo: networkInfo);
    printerMock = VirtualThermalPrinterMock();

    // 2. Auth
    final authLocalDataSource = AuthLocalDataSource(storage: secureStorage);
    authRepository = AuthRepositoryImpl(apiClient: apiClient, localDataSource: authLocalDataSource);
    authNotifier = AuthNotifier(
      loginWithPinUseCase: LoginWithPinUseCase(authRepository),
      biometricAuthUseCase: BiometricAuthUseCase(authRepository),
      logoutUseCase: LogoutUseCase(authRepository),
    );

    // 3. Member Portal
    memberRepository = MemberRepositoryImpl(apiClient: apiClient, localDatabase: localDatabase);
    accountRepository = AccountRepositoryImpl(apiClient: apiClient, localDatabase: localDatabase);
    transactionRepository = TransactionRepositoryImpl(apiClient: apiClient, localDatabase: localDatabase);
    memberPortalNotifier = MemberPortalNotifier(
      getMemberProfileUseCase: GetMemberProfileUseCase(memberRepository),
      getMemberAccountsUseCase: GetMemberAccountsUseCase(accountRepository),
      getTransactionHistoryUseCase: GetTransactionHistoryUseCase(transactionRepository),
      generateAccountStatementUseCase: GenerateAccountStatementUseCase(
        accountRepository: accountRepository,
        transactionRepository: transactionRepository,
      ),
    );

    // 4. Loans
    loanRepository = LoanRepositoryImpl(apiClient: apiClient, localDatabase: localDatabase);
    loanNotifier = LoanNotifier(
      simulateMicroLoanUseCase: SimulateMicroLoanUseCase(),
      checkLoanPrequalificationUseCase: CheckLoanPrequalificationUseCase(loanRepository),
      submitLoanApplicationUseCase: SubmitLoanApplicationUseCase(loanRepository),
      loanRepository: loanRepository,
    );

    // 5. Mobile Money
    momoSandboxEngine = SandboxSimulationEngine(provider: MobileMoneyProvider.tmoney);
    momoNotifier = MobileMoneyNotifier(
      initiateDepositUseCase: InitiateMobileMoneyDepositUseCase(momoSandboxEngine),
      initiateWithdrawalUseCase: InitiateMobileMoneyWithdrawalUseCase(momoSandboxEngine),
      pollStatusUseCase: PollTransactionStatusUseCase(momoSandboxEngine),
    );

    // 6. Field Collector & Tontine
    fieldCollectorRepository = FieldCollectorRepositoryImpl(localDatabase: localDatabase);
    fieldCollectorNotifier = FieldCollectorNotifier(
      openShiftUseCase: OpenShiftUseCase(fieldCollectorRepository),
      closeShiftUseCase: CloseShiftUseCase(fieldCollectorRepository),
      reconcileCollectorShiftUseCase: ReconcileCollectorShiftUseCase(fieldCollectorRepository),
      sortMembersByDistanceUseCase: SortMembersByDistanceUseCase(),
      searchFieldMembersUseCase: SearchFieldMembersUseCase(),
      repository: fieldCollectorRepository,
    );

    tontineRepository = TontineRepositoryImpl(localDatabase: localDatabase);
    tontineNotifier = TontineNotifier(
      recordOfflineCotisationUseCase: RecordOfflineCotisationUseCase(repository: tontineRepository),
      verifyHashChainIntegrityUseCase: VerifyHashChainIntegrityUseCase(tontineRepository),
      repository: tontineRepository,
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BANOLIA Microfinance',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primaryGreen,
          primary: AppColors.primaryGreen,
          secondary: AppColors.accentGold,
        ),
      ),
      home: AppRootNavigation(
        memberPortalNotifier: memberPortalNotifier,
        loanNotifier: loanNotifier,
        momoNotifier: momoNotifier,
        collectorNotifier: fieldCollectorNotifier,
        tontineNotifier: tontineNotifier,
        printerMock: printerMock,
      ),
    );
  }
}

class AppRootNavigation extends StatefulWidget {
  final MemberPortalNotifier memberPortalNotifier;
  final LoanNotifier loanNotifier;
  final MobileMoneyNotifier momoNotifier;
  final FieldCollectorNotifier collectorNotifier;
  final TontineNotifier tontineNotifier;
  final VirtualThermalPrinterMock printerMock;

  const AppRootNavigation({
    super.key,
    required this.memberPortalNotifier,
    required this.loanNotifier,
    required this.momoNotifier,
    required this.collectorNotifier,
    required this.tontineNotifier,
    required this.printerMock,
  });

  @override
  State<AppRootNavigation> createState() => _AppRootNavigationState();
}

class _AppRootNavigationState extends State<AppRootNavigation> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final screens = [
      // 1. Member Dashboard
      MemberDashboardScreen(
        notifier: widget.memberPortalNotifier,
        onNavigateToLoanSimulator: () => setState(() => _currentIndex = 1),
        onNavigateToMobileMoney: () => setState(() => _currentIndex = 2),
        onNavigateToHistory: () {
          Navigator.of(context).push(MaterialPageRoute(
            builder: (_) => TransactionHistoryScreen(notifier: widget.memberPortalNotifier),
          ));
        },
      ),
      // 2. Micro-Loan Simulator
      LoanSimulatorScreen(notifier: widget.loanNotifier),
      // 3. Mobile Money
      MobileMoneyScreen(notifier: widget.momoNotifier),
      // 4. Field Collector (Tontine Terrain)
      FieldCollectorHomeScreen(
        collectorNotifier: widget.collectorNotifier,
        tontineNotifier: widget.tontineNotifier,
        printerMock: widget.printerMock,
      ),
    ];

    return Scaffold(
      body: screens[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.account_balance), label: 'Sociétaire'),
          NavigationDestination(icon: Icon(Icons.calculate), label: 'Micro-Crédit'),
          NavigationDestination(icon: Icon(Icons.phone_android), label: 'Mobile Money'),
          NavigationDestination(icon: Icon(Icons.storefront), label: 'Démarcheur'),
        ],
      ),
    );
  }
}
