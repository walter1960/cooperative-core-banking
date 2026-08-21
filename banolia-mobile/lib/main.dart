import 'package:flutter/material.dart';
import 'core/constants/app_colors.dart';
import 'features/auth/presentation/screens/welcome_splash_screen.dart';
import 'features/member_portal/presentation/screens/member_dashboard_screen.dart';
import 'features/notifications/presentation/screens/notification_center_screen.dart';
import 'features/loans/presentation/screens/loan_screens.dart';
import 'features/loans/presentation/notifiers/loan_notifiers.dart';
import 'features/loans/domain/repositories/loan_usecases.dart';
import 'features/loans/data/loan_data.dart';
import 'features/mobile_money/presentation/screens/mobile_money_screens.dart';
import 'features/mobile_money/presentation/notifiers/mobile_money_notifier.dart';
import 'features/mobile_money/domain/repositories/mobile_money_usecases.dart';
import 'features/mobile_money/data/sandbox_simulation_engine.dart';
import 'features/mobile_money/domain/entities/mobile_money_entities.dart';
import 'core/storage/local_database.dart';
import 'core/network/api_client.dart';
import 'core/network/network_info.dart';
import 'package:http/http.dart' as http;

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyCoopMobileApp());
}

class MyCoopMobileApp extends StatelessWidget {
  const MyCoopMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MyCOOPEC Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        fontFamily: 'Roboto',
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0F172A),
          primary: const Color(0xFF0F172A),
          secondary: const Color(0xFFE11D48),
        ),
      ),
      home: const MobileAppRootFlow(),
    );
  }
}

class MobileAppRootFlow extends StatefulWidget {
  const MobileAppRootFlow({super.key});

  @override
  State<MobileAppRootFlow> createState() => _MobileAppRootFlowState();
}

class _MobileAppRootFlowState extends State<MobileAppRootFlow> {
  bool _isAuthenticated = false;
  int _currentNavIndex = 1; // Default to 'Comptes' tab

  late final LocalDatabase _localDb;
  late final LoanNotifier _loanNotifier;
  late final MobileMoneyNotifier _momoNotifier;

  @override
  void initState() {
    super.initState();
    _localDb = LocalDatabase();
    final apiClient = ApiClient(httpClient: http.Client(), networkInfo: AlwaysOnlineNetworkInfo());
    final loanRepo = LoanRepositoryImpl(apiClient: apiClient, localDatabase: _localDb);

    _loanNotifier = LoanNotifier(
      simulateMicroLoanUseCase: SimulateMicroLoanUseCase(),
      checkLoanPrequalificationUseCase: CheckLoanPrequalificationUseCase(loanRepo),
      submitLoanApplicationUseCase: SubmitLoanApplicationUseCase(loanRepo),
      loanRepository: loanRepo,
    );

    final momoEngine = SandboxSimulationEngine(provider: MobileMoneyProvider.tmoney);
    _momoNotifier = MobileMoneyNotifier(
      initiateDepositUseCase: InitiateMobileMoneyDepositUseCase(momoEngine),
      initiateWithdrawalUseCase: InitiateMobileMoneyWithdrawalUseCase(momoEngine),
      pollStatusUseCase: PollTransactionStatusUseCase(momoEngine),
    );
  }

  void _handleLoginSuccess() {
    setState(() => _isAuthenticated = true);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Authentification réussie ! Bienvenue sur MyCOOPEC Mobile.'),
        backgroundColor: Color(0xFF059669),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!_isAuthenticated) {
      return WelcomeSplashScreen(
        onBiometricLogin: _handleLoginSuccess,
        onStandardLogin: (user, pass) => _handleLoginSuccess(),
        onDemoMode: _handleLoginSuccess,
      );
    }

    final screens = [
      // 0: Accueil
      Scaffold(
        appBar: AppBar(title: const Text('Accueil')),
        body: const Center(child: Text('Vue Accueil Globale')),
      ),
      // 1: Comptes (Photo 4)
      MemberDashboardScreen(
        onNavigateToLoanSimulator: () => setState(() => _currentNavIndex = 2),
        onNavigateToMobileMoney: () => setState(() => _currentNavIndex = 3),
        onNavigateToHistory: () {},
      ),
      // 2: Cartes & Prêts
      LoanSimulatorScreen(notifier: _loanNotifier),
      // 3: Virements & Mobile Money
      MobileMoneyScreen(notifier: _momoNotifier),
      // 4: Menu / Messages
      const NotificationCenterScreen(),
    ];

    return Scaffold(
      body: screens[_currentNavIndex],
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Colors.grey.shade200)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentNavIndex,
          onTap: (index) => setState(() => _currentNavIndex = index),
          type: BottomNavigationBarType.fixed,
          selectedItemColor: const Color(0xFF0F172A),
          unselectedItemColor: const Color(0xFF94A3B8),
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 10),
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Accueil'),
            BottomNavigationBarItem(icon: Icon(Icons.folder_open_outlined), activeIcon: Icon(Icons.folder), label: 'Comptes'),
            BottomNavigationBarItem(icon: Icon(Icons.credit_card_outlined), activeIcon: Icon(Icons.credit_card), label: 'Cartes & Prêts'),
            BottomNavigationBarItem(icon: Icon(Icons.swap_horiz_rounded), label: 'Virements'),
            BottomNavigationBarItem(icon: Icon(Icons.grid_view_rounded), label: 'Menu & Alertes'),
          ],
        ),
      ),
    );
  }
}
