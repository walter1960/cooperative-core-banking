import 'package:flutter/material.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/utils/currency_formatter.dart';
import '../../../../core/utils/date_formatter.dart';
import '../../../notifications/presentation/screens/notification_center_screen.dart';
import '../../../loans/presentation/screens/loan_tracking_screen.dart';
import '../../../loans/presentation/screens/online_loan_application_screen.dart';
import '../../../withdrawals/presentation/screens/withdrawal_slip_screen.dart';
import 'account_statement_screen.dart';

class MemberDashboardScreen extends StatefulWidget {
  final CoopAppState? appState;
  final VoidCallback onNavigateToHistory;

  const MemberDashboardScreen({
    super.key,
    this.appState,
    required this.onNavigateToHistory,
  });

  @override
  State<MemberDashboardScreen> createState() => _MemberDashboardScreenState();
}

class _MemberDashboardScreenState extends State<MemberDashboardScreen> {
  int _selectedTab = 0; // 0: Carte Sociétaire & Épargne, 1: Parts Sociales & Réserves
  bool _isBalanceVisible = true;
  bool _isFavorite = true;
  int _cardIndex = 0;

  void _showSavingsLockModal(CoopAppState state) {
    double selectedPercent = state.isSavingsBlocked ? state.blockedSavingsPercentage : 50.0;
    int selectedMonths = 6;
    bool isBlocked = state.isSavingsBlocked;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final blockedAmount = ((state.savingsAccountBalance * selectedPercent) / 100).round();
          final liquidAmount = state.savingsAccountBalance - blockedAmount;

          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 44,
                      height: 5,
                      decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Row(
                    children: [
                      Icon(Icons.lock_clock_rounded, color: Color(0xFF2563EB), size: 24),
                      SizedBox(width: 8),
                      Text('Blocage Volontaire d\'Épargne', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF0F172A))),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Vous pouvez décider de garder tout ou partie de votre argent bloqué pendant une durée choisie afin de vous constituer une réserve protégée non retirable.',
                    style: TextStyle(fontSize: 12, color: Color(0xFF64748B), height: 1.4),
                  ),
                  const SizedBox(height: 16),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Activer le verrouillage', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    subtitle: Text(isBlocked ? 'Une partie de votre épargne est protégée' : 'Votre épargne reste disponible selon les règles de prêt'),
                    value: isBlocked,
                    activeThumbColor: const Color(0xFF2563EB),
                    onChanged: (val) => setModalState(() => isBlocked = val),
                  ),
                  if (isBlocked) ...[
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Pourcentage à bloquer :', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                        Text('${selectedPercent.toStringAsFixed(0)} % (${CurrencyFormatter.formatXOF(blockedAmount)})', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF2563EB))),
                      ],
                    ),
                    Slider(
                      value: selectedPercent,
                      min: 10,
                      max: 100,
                      divisions: 9,
                      label: '${selectedPercent.toStringAsFixed(0)}%',
                      activeColor: const Color(0xFF2563EB),
                      onChanged: (val) => setModalState(() => selectedPercent = val),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('10%', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                        const Text('50% (Moitié)', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                        const Text('100% (Tout)', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8), fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 14),
                    const Text('Durée de blocage :', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [3, 6, 12, 24].map((m) {
                        final isSel = selectedMonths == m;
                        return ChoiceChip(
                          label: Text('$m mois'),
                          selected: isSel,
                          selectedColor: const Color(0xFF2563EB),
                          labelStyle: TextStyle(color: isSel ? Colors.white : const Color(0xFF0F172A), fontWeight: FontWeight.bold, fontSize: 12),
                          onSelected: (_) => setModalState(() => selectedMonths = m),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFE2E8F0))),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Montant protégé (bloqué) :', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                              Text(CurrencyFormatter.formatXOF(blockedAmount), style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFDC2626), fontSize: 12)),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Reste liquide disponible :', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                              Text(CurrencyFormatter.formatXOF(liquidAmount), style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF059669), fontSize: 12)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: () {
                      final until = isBlocked ? DateTime.now().add(Duration(days: selectedMonths * 30)) : null;
                      state.configureSavingsLocking(
                        isBlocked: isBlocked,
                        percentage: selectedPercent,
                        untilDate: until,
                      );
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(isBlocked
                              ? 'Verrouillage de ${selectedPercent.toStringAsFixed(0)}% (${CurrencyFormatter.formatXOF(blockedAmount)}) enregistré pour $selectedMonths mois.'
                              : 'Blocage levé. Votre épargne est totalement liquide.'),
                          backgroundColor: const Color(0xFF059669),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Text('Enregistrer mes préférences', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = widget.appState ?? CoopAppState();

    return ListenableBuilder(
      listenable: state,
      builder: (context, _) {
        final accounts = [
          {
            'title': 'COMPTE ÉPARGNE DISPONIBLE',
            'number': '25121100${state.memberCode}01',
            'balance': state.availableLiquidSavings,
            'frozen': 0,
            'currency': 'XOF',
            'type': 'SOCIETAIRE',
            'color': const Color(0xFF475569), // Gris Titane Élégant
          },
          {
            'title': 'ÉPARGNE GARDÉE / PROTÉGÉE',
            'number': 'EPG-BLQ-${state.memberCode}',
            'balance': state.blockedSavingsAmount,
            'frozen': state.blockedSavingsAmount,
            'currency': 'XOF',
            'type': 'EPARGNE_BLOQUEE',
            'color': const Color(0xFF1E293B), // Gris Anthracite Platine
          },
          {
            'title': 'COMPTE COURANT / VUE',
            'number': '251100${state.memberCode}01',
            'balance': state.currentAccountBalance,
            'frozen': state.currentAccountFrozen,
            'currency': 'XOF',
            'type': 'COURANT',
            'color': const Color(0xFF334155), // Gris Ardoise Métallisé
          },
          {
            'title': 'PARTS SOCIALES SOUSCRITES',
            'number': 'PS-${state.memberCode}',
            'balance': state.shareCapitalBalance,
            'frozen': 0,
            'currency': 'XOF',
            'type': 'PARTS',
            'color': const Color(0xFF64748B), // Gris Acier
          },
        ];

        final currentAccount = accounts[_cardIndex.clamp(0, accounts.length - 1)];

        return Scaffold(
          backgroundColor: const Color(0xFFF1F5F9),
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0,
            title: const Text(
              'Comptes',
              style: TextStyle(
                color: Color(0xFF0F172A),
                fontWeight: FontWeight.w900,
                fontSize: 22,
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined, color: Color(0xFF0F172A)),
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const NotificationCenterScreen()),
                  );
                },
              ),
            ],
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Pill Tabs (Comptes à vue / Épargne & Tontines)
                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(30),
                  ),
                  padding: const EdgeInsets.all(4),
                  child: Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() {
                            _selectedTab = 0;
                            _cardIndex = 0;
                          }),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: _selectedTab == 0 ? Colors.white : Colors.transparent,
                              borderRadius: BorderRadius.circular(26),
                              boxShadow: _selectedTab == 0
                                  ? [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.05),
                                        blurRadius: 4,
                                        offset: const Offset(0, 2),
                                      ),
                                    ]
                                  : [],
                            ),
                            child: Center(
                              child: Text(
                                'Comptes d\'Épargne',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: _selectedTab == 0 ? const Color(0xFF0F172A) : const Color(0xFF64748B),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() {
                            _selectedTab = 1;
                            _cardIndex = 1;
                          }),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: _selectedTab == 1 ? Colors.white : Colors.transparent,
                              borderRadius: BorderRadius.circular(26),
                              boxShadow: _selectedTab == 1
                                  ? [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.05),
                                        blurRadius: 4,
                                        offset: const Offset(0, 2),
                                      ),
                                    ]
                                  : [],
                            ),
                            child: Center(
                              child: Text(
                                'Parts Sociales & Dépôts',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: _selectedTab == 1 ? const Color(0xFF0F172A) : const Color(0xFF64748B),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Photorealistic Account Card (Gris Titane & Argenté pour le Sociétaire)
                Container(
                  height: 195,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.2), width: 1.5),
                    gradient: LinearGradient(
                      colors: currentAccount['type'] == 'SOCIETAIRE'
                          ? [
                              const Color(0xFF94A3B8), // Gris argenté clair
                              const Color(0xFF64748B), // Gris acier métallisé
                              const Color(0xFF475569), // Gris ardoise titane
                            ]
                          : [
                              currentAccount['color'] as Color,
                              (currentAccount['color'] as Color).withValues(alpha: 0.85),
                              const Color(0xFF475569),
                            ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.18),
                        blurRadius: 16,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.all(22),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Top Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: const Icon(Icons.account_balance_wallet_rounded, color: Colors.white, size: 24),
                              ),
                              const SizedBox(width: 12),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    currentAccount['title'] as String,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w800,
                                      fontSize: 11,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                  Text(
                                    currentAccount['number'] as String,
                                    style: const TextStyle(
                                      color: Colors.white70,
                                      fontFamily: 'monospace',
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          IconButton(
                            icon: Icon(
                              _isFavorite ? Icons.star_rounded : Icons.star_outline_rounded,
                              color: Colors.amber,
                              size: 26,
                            ),
                            onPressed: () => setState(() => _isFavorite = !_isFavorite),
                          ),
                        ],
                      ),

                      // Bottom Balance Area
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Solde Disponible',
                                style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w500),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _isBalanceVisible
                                  ? CurrencyFormatter.formatXOF(currentAccount['balance'] as int)
                                  : '•••••••• XOF',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                  fontFamily: 'monospace',
                                ),
                              ),
                            ],
                          ),
                          IconButton(
                            icon: Icon(
                              _isBalanceVisible ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                              color: Colors.white70,
                            ),
                            onPressed: () => setState(() => _isBalanceVisible = !_isBalanceVisible),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),

                // Carousel Navigation
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextButton.icon(
                      onPressed: _cardIndex > 0 ? () => setState(() => _cardIndex--) : null,
                      icon: const Icon(Icons.chevron_left, size: 18),
                      label: const Text('Précédent', style: TextStyle(fontSize: 12)),
                    ),
                    Row(
                      children: List.generate(
                        accounts.length,
                        (index) => Container(
                          width: _cardIndex == index ? 16 : 7,
                          height: 7,
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          decoration: BoxDecoration(
                            color: _cardIndex == index ? const Color(0xFF0F172A) : const Color(0xFFCBD5E1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ),
                    ),
                    TextButton.icon(
                      onPressed: _cardIndex < accounts.length - 1 ? () => setState(() => _cardIndex++) : null,
                      icon: const Icon(Icons.chevron_right, size: 18),
                      label: const Text('Suivant', style: TextStyle(fontSize: 12)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // KPI Cards: Solde Disponible & Dette Totale
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.account_balance_wallet_outlined, size: 16, color: Color(0xFF059669)),
                                SizedBox(width: 4),
                                Text('Solde Dispo', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              CurrencyFormatter.formatXOF(state.currentAccountAvailable),
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: InkWell(
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => LoanTrackingScreen(appState: state)),
                          );
                        },
                        borderRadius: BorderRadius.circular(18),
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF2F2),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: const Color(0xFFFECACA)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Icon(Icons.shield_outlined, size: 16, color: Color(0xFFDC2626)),
                                      SizedBox(width: 4),
                                      Text('Dette Totale', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF991B1B))),
                                    ],
                                  ),
                                  Icon(Icons.chevron_right, size: 14, color: Color(0xFF991B1B)),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                CurrencyFormatter.formatXOF(state.totalDebtBalance),
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFFDC2626)),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Institutional Action Banner: Demande de Prêt & Demande de Retrait
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.12),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.verified_user_rounded, color: Color(0xFF38BDF8), size: 18),
                              SizedBox(width: 6),
                              Text(
                                'SERVICES EN LIGNE COOPÉRATIVE',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 0.8),
                              ),
                            ],
                          ),
                          Text('PORTAIL SOCIÉTAIRE', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(builder: (_) => OnlineLoanApplicationScreen(appState: state)),
                                );
                              },
                              icon: const Icon(Icons.monetization_on_outlined, size: 16),
                              label: const Text('Demande de Prêt', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF2563EB),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(builder: (_) => WithdrawalSlipScreen(appState: state)),
                                );
                              },
                              icon: const Icon(Icons.receipt_long_outlined, size: 16),
                              label: const Text('Demande Retrait', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF059669),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // Quick Action Buttons (Focalisés uniquement sur les services de la Coopérative)
                Row(
                  children: [
                    Expanded(
                      child: _buildQuickActionButton(
                        icon: Icons.monetization_on_rounded,
                        color: const Color(0xFF2563EB),
                        title: 'Demande\nde Prêt',
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => OnlineLoanApplicationScreen(appState: state)),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildQuickActionButton(
                        icon: Icons.receipt_long_rounded,
                        color: const Color(0xFF0F172A),
                        title: 'Fiche Retrait\n(Bordereau R)',
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => WithdrawalSlipScreen(appState: state)),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildQuickActionButton(
                        icon: Icons.lock_clock_rounded,
                        color: const Color(0xFF059669),
                        title: 'Garder / Bloquer\nmon Épargne',
                        onTap: () => _showSavingsLockModal(state),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildQuickActionButton(
                        icon: Icons.account_balance_wallet_rounded,
                        color: const Color(0xFF475569),
                        title: 'Mon Relevé\nd\'Épargne',
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => AccountStatementScreen(appState: state)),
                          );
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),

                // Financial Utilization Box : Capacité d'Emprunt & Retrait Réel
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'CAPACITÉS & ÉPARGNE EN TEMPS RÉEL',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF64748B),
                                  letterSpacing: 0.8,
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Situation calculée selon vos avoirs',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: state.isSavingsBlocked ? const Color(0xFFFEF3C7) : const Color(0xFFECFDF5),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  state.isSavingsBlocked ? Icons.lock_rounded : Icons.lock_open_rounded,
                                  size: 13,
                                  color: state.isSavingsBlocked ? const Color(0xFFD97706) : const Color(0xFF059669),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  state.isSavingsBlocked
                                      ? '${state.blockedSavingsPercentage.toStringAsFixed(0)}% Bloqué'
                                      : 'Épargne Libre',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: state.isSavingsBlocked ? const Color(0xFFD97706) : const Color(0xFF059669),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Bloc Récapitulatif : Retirable Immédiatement vs Prêtable Max
                      Row(
                        children: [
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF0FDF4),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: const Color(0xFFBBF7D0)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Row(
                                    children: [
                                      Icon(Icons.check_circle_outline_rounded, size: 14, color: Color(0xFF16A34A)),
                                      SizedBox(width: 4),
                                      Text('Retirable Max', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF15803D))),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    CurrencyFormatter.formatXOF(state.maxPossibleWithdrawal),
                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF166534), fontFamily: 'monospace'),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    state.isSavingsBlocked
                                        ? 'Déduction faite des ${CurrencyFormatter.formatXOF(state.blockedSavingsAmount)} protégés'
                                        : 'Disponible sans pénalité',
                                    style: const TextStyle(fontSize: 9, color: Color(0xFF15803D)),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: const Color(0xFFBFDBFE)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Row(
                                    children: [
                                      Icon(Icons.trending_up_rounded, size: 14, color: Color(0xFF2563EB)),
                                      SizedBox(width: 4),
                                      Text('Prêt Eligible Max', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF1D4ED8))),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    CurrencyFormatter.formatXOF(state.maxBorrowingCapacity),
                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF1E40AF), fontFamily: 'monospace'),
                                  ),
                                  const SizedBox(height: 2),
                                  const Text(
                                    'Jusqu\'à 3x vos avoirs nets',
                                    style: TextStyle(fontSize: 9, color: Color(0xFF1D4ED8)),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 14),
                      const Divider(color: Color(0xFFF1F5F9)),

                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildGaugeMetric('Épargne Totale', CurrencyFormatter.formatXOF(state.savingsAccountBalance), const Color(0xFF0F172A)),
                          _buildGaugeMetric('Part Bloquée', CurrencyFormatter.formatXOF(state.blockedSavingsAmount), const Color(0xFFDC2626)),
                          _buildGaugeMetric('Disponible', CurrencyFormatter.formatXOF(state.availableLiquidSavings), const Color(0xFF059669)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // Recent Transactions Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'DERNIÈRES OPÉRATIONS',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF64748B), letterSpacing: 0.8),
                    ),
                    TextButton(
                      onPressed: widget.onNavigateToHistory,
                      child: const Text('Voir tout', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Transactions List
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: state.transactions.take(4).length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (ctx, i) {
                    final tx = state.transactions[i];
                    return Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: tx.isCredit
                                  ? const Color(0xFF059669).withValues(alpha: 0.1)
                                  : const Color(0xFFE11D48).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(
                              tx.isCredit ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
                              color: tx.isCredit ? const Color(0xFF059669) : const Color(0xFFE11D48),
                              size: 18,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(tx.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF0F172A))),
                                const SizedBox(height: 2),
                                Text(tx.subtitle, style: const TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '${tx.isCredit ? '+' : '-'} ${CurrencyFormatter.formatXOF(tx.amountXof)}',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                  color: tx.isCredit ? const Color(0xFF059669) : const Color(0xFFE11D48),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(DateFormatter.formatDate(tx.date), style: const TextStyle(fontSize: 9, color: Color(0xFF94A3B8))),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildQuickActionButton({
    required IconData icon,
    required Color color,
    required String title,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 2)),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 10),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: Color(0xFF0F172A),
                height: 1.2,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGaugeMetric(String label, String value, Color color) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 10, color: Color(0xFF64748B), fontWeight: FontWeight.w500)),
        const SizedBox(height: 2),
        Text(value, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color)),
      ],
    );
  }
}

class SpeedometerGaugePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height);
    final radius = size.width / 2 - 12;

    final bgPaint = Paint()
      ..color = const Color(0xFFE2E8F0)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 14
      ..strokeCap = StrokeCap.round;

    final activePaint = Paint()
      ..color = const Color(0xFF2563EB)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 14
      ..strokeCap = StrokeCap.round;

    // Background track (180 degrees arc)
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      3.14159,
      3.14159,
      false,
      bgPaint,
    );

    // Active safe arc (0 to 75%)
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      3.14159,
      3.14159 * 0.75,
      false,
      activePaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
