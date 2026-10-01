import 'package:flutter/material.dart';
import 'core/security/biometric_auth_service.dart';
import 'core/state/app_state.dart';
import 'features/auth/presentation/screens/welcome_splash_screen.dart';
import 'features/member_portal/presentation/screens/member_dashboard_screen.dart';
import 'features/member_portal/presentation/screens/account_statement_screen.dart';
import 'features/member_portal/presentation/screens/rib_certificate_screen.dart';
import 'features/menu/presentation/screens/full_grid_menu_screen.dart';
import 'features/notifications/presentation/screens/notification_center_screen.dart';
import 'features/settings/presentation/screens/settings_screen.dart';
import 'features/cheques/presentation/screens/cheque_management_screen.dart';
import 'features/support/presentation/screens/support_ticket_screen.dart';
import 'features/agencies/presentation/screens/agencies_map_screen.dart';
import 'features/withdrawals/presentation/screens/withdrawal_slip_screen.dart';
import 'features/loans/presentation/screens/loan_tracking_screen.dart';
import 'features/loans/presentation/screens/online_loan_application_screen.dart';

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
  int _currentNavIndex = 0; // Default to 'Accueil' tab

  final CoopAppState _appState = CoopAppState();

  Future<({bool success, String? errorMessage, String? memberName})> _handleVerifyLogin(String identifier, String password) async {
    final res = await _appState.verifyAndAuthenticateMember(identifier);
    if (res.success) {
      setState(() => _isAuthenticated = true);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Bienvenue ${res.memberName ?? _appState.memberName} ! Compte certifié COOPECTAT.'),
            backgroundColor: const Color(0xFF059669),
          ),
        );
      }
    }
    return res;
  }

  void _handleBiometricLogin() async {
    final bioService = BiometricAuthService();
    final canAuth = await bioService.isBiometricsAvailable();
    if (!canAuth) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Le capteur d\'empreinte n\'est pas disponible ou configuré sur votre appareil.'),
            backgroundColor: Color(0xFFD97706),
          ),
        );
      }
      return;
    }

    final authenticated = await bioService.authenticateWithBiometrics(
      reason: 'Veuillez poser votre doigt sur le capteur pour déverrouiller votre compte COOPECTAT',
    );

    if (!authenticated) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Authentification par empreinte annulée ou non reconnue.'),
            backgroundColor: Color(0xFFE11D48),
          ),
        );
      }
      return;
    }

    // Empreinte matérielle validée avec succès par Android
    final res = await _handleVerifyLogin(_appState.memberCode, '');
    if (!res.success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res.errorMessage ?? 'Échec de la validation biométrique.'),
          backgroundColor: const Color(0xFFE11D48),
        ),
      );
    }
  }

  void _handleLogout() {
    setState(() {
      _isAuthenticated = false;
      _currentNavIndex = 0;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Session fermée avec succès.'),
        backgroundColor: Color(0xFF0F172A),
      ),
    );
  }

  void _navigateToHistory() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => AccountStatementScreen(appState: _appState)),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!_isAuthenticated) {
      return WelcomeSplashScreen(
        onVerifyLogin: _handleVerifyLogin,
        onBiometricLogin: _handleBiometricLogin,
      );
    }

    final screens = [
      // 0: Accueil
      MemberDashboardScreen(
        appState: _appState,
        onNavigateToHistory: _navigateToHistory,
      ),
      // 1: Épargnes & Relevé
      AccountStatementScreen(appState: _appState),
      // 2: Menu Complet des Services
      FullGridMenuScreen(
        onSelectMenuItem: (itemTitle) {
          switch (itemTitle) {
            case 'Accueil':
              setState(() => _currentNavIndex = 0);
              break;
            case 'Comptes':
            case 'Épargnes':
            case 'Comptes d\'Épargne':
            case 'Épargnes & Relevé':
            case 'Relevé Officiel PDF':
              setState(() => _currentNavIndex = 1);
              break;
            case 'Déconnexion':
              _handleLogout();
              break;
            case 'Fiche de retrait':
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => WithdrawalSlipScreen(appState: _appState)),
              );
              break;
            case 'États & Suivi prêts':
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => LoanTrackingScreen(appState: _appState)),
              );
              break;
            case 'Demande de prêt':
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => OnlineLoanApplicationScreen(appState: _appState)),
              );
              break;
            case 'Chèques':
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => ChequeManagementScreen(appState: _appState)),
              );
              break;
            case 'Wallet':
            case 'RIB / Attestation':
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => RibCertificateScreen(appState: _appState)),
              );
              break;
            case 'Demandes et réclamations':
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => SupportTicketScreen(appState: _appState)),
              );
              break;
            case 'Aide et Support':
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => NotificationCenterScreen(appState: _appState)),
              );
              break;
            case 'Nous trouver':
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const AgenciesMapScreen()),
              );
              break;
            case 'Paramètres':
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => SettingsScreen(
                    appState: _appState,
                    onLogout: _handleLogout,
                  ),
                ),
              );
              break;
            case 'Actualités':
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  title: const Text('Actualités COOPEC', style: TextStyle(fontWeight: FontWeight.bold)),
                  content: const Text(
                    '• Assemblée Générale Ordinaire le 15 Octobre 2026.\n• Campagne de souscription aux parts sociales.\n• Taux de rémunération de l\'épargne maintenu à 3.5% l\'an.',
                  ),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Fermer')),
                  ],
                ),
              );
              break;
            case 'Produits':
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => AccountStatementScreen(appState: _appState)),
              );
              break;
            case 'Convertisseur':
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  title: const Text('Convertisseur Devises BCEAO', style: TextStyle(fontWeight: FontWeight.bold)),
                  content: const Text('1 EUR = 655.957 XOF (Parité fixe)\n1 USD ≈ 605.50 XOF\n1 GBP ≈ 770.20 XOF'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK')),
                  ],
                ),
              );
              break;
            case 'À propos':
            case 'Mentions légales':
              showAboutDialog(
                context: context,
                applicationName: 'MyCOOPEC Mobile',
                applicationVersion: '1.0.0+1 (Production BCEAO)',
                applicationLegalese: '© 2026 COOPEC Microfinance Suite. Agrément SFD UMOA.',
              );
              break;
            default:
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Ouverture du service : $itemTitle')),
              );
          }
        },
      ),
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
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home),
              label: 'Accueil',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.account_balance_wallet_outlined),
              activeIcon: Icon(Icons.account_balance_wallet),
              label: 'Épargnes',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.grid_view_outlined),
              activeIcon: Icon(Icons.grid_view_rounded),
              label: 'Menu',
            ),
          ],
        ),
      ),
    );
  }
}
