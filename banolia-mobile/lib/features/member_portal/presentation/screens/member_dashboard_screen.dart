import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../notifications/presentation/screens/notification_center_screen.dart';

class MemberDashboardScreen extends StatefulWidget {
  final VoidCallback onNavigateToLoanSimulator;
  final VoidCallback onNavigateToMobileMoney;
  final VoidCallback onNavigateToHistory;

  const MemberDashboardScreen({
    super.key,
    required this.onNavigateToLoanSimulator,
    required this.onNavigateToMobileMoney,
    required this.onNavigateToHistory,
  });

  @override
  State<MemberDashboardScreen> createState() => _MemberDashboardScreenState();
}

class _MemberDashboardScreenState extends State<MemberDashboardScreen> {
  int _selectedTab = 0; // 0: Comptes titulaires, 1: Comptes DAT
  bool _isBalanceVisible = true;
  bool _isFavorite = true;
  int _cardIndex = 0;

  final List<Map<String, dynamic>> _accounts = [
    {
      'title': 'COMPTES CHEQUES / VUE',
      'number': '99988361998',
      'balance': 2000000,
      'currency': 'XOF',
      'type': 'CHEQUES',
      'color': const Color(0xFF2563EB),
    },
    {
      'title': 'LIVRET EPARGNE SOCIETAIRE',
      'number': '99988361999',
      'balance': 1450000,
      'currency': 'XOF',
      'type': 'EPARGNE',
      'color': const Color(0xFF059669),
    },
    {
      'title': 'PARTS SOCIALES SOUSCRITES',
      'number': 'PS-0200225',
      'balance': 50000,
      'currency': 'XOF',
      'type': 'PARTS',
      'color': const Color(0xFF7C3AED),
    },
  ];

  @override
  Widget build(BuildContext context) {
    final currentAccount = _accounts[_cardIndex];

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
          IconButton(
            icon: const Icon(Icons.person_outline_rounded, color: Color(0xFF0F172A)),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Pill Tabs (Photo 4: Comptes titulaires / Comptes DAT)
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
                      onTap: () => setState(() => _selectedTab = 0),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: _selectedTab == 0 ? Colors.white : Colors.transparent,
                          borderRadius: BorderRadius.circular(26),
                          boxShadow: _selectedTab == 0
                              ? [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 6)]
                              : null,
                        ),
                        child: Text(
                          'Comptes titulaires',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: _selectedTab == 0 ? FontWeight.bold : FontWeight.w600,
                            color: _selectedTab == 0 ? const Color(0xFF0F172A) : const Color(0xFF64748B),
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _selectedTab = 1),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: _selectedTab == 1 ? Colors.white : Colors.transparent,
                          borderRadius: BorderRadius.circular(26),
                          boxShadow: _selectedTab == 1
                              ? [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 6)]
                              : null,
                        ),
                        child: Text(
                          'Comptes DAT & Épargne',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: _selectedTab == 1 ? FontWeight.bold : FontWeight.w600,
                            color: _selectedTab == 1 ? const Color(0xFF0F172A) : const Color(0xFF64748B),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Visual Bank Account Card (Photo 4)
            Container(
              height: 180,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                gradient: LinearGradient(
                  colors: [
                    currentAccount['color'],
                    (currentAccount['color'] as Color).withOpacity(0.85),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: [
                  BoxShadow(
                    color: (currentAccount['color'] as Color).withOpacity(0.35),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(20),
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
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.account_balance_wallet_rounded, color: Colors.white, size: 20),
                          ),
                          const SizedBox(width: 10),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                currentAccount['title'],
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 12,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              Text(
                                currentAccount['number'],
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
                            'Solde Actuel',
                            style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w500),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _isBalanceVisible
                                ? '${(currentAccount['balance'] as int).toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]} ')} ${currentAccount['currency']}'
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

            // Carousel Indicators & Navigation (Photo 4: Précédent / Suivant)
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
                    _accounts.length,
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
                  onPressed: _cardIndex < _accounts.length - 1 ? () => setState(() => _cardIndex++) : null,
                  icon: const Icon(Icons.chevron_right, size: 18),
                  label: const Text('Suivant', style: TextStyle(fontSize: 12)),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // 3 Quick Action Buttons (Photo 4: Virement, Paiement des factures, Achat crédit téléphonique)
            Row(
              children: [
                Expanded(
                  child: _buildQuickActionButton(
                    icon: Icons.swap_horiz_rounded,
                    color: const Color(0xFFE11D48),
                    title: 'Virement',
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Ouverture du module de virement interne')),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildQuickActionButton(
                    icon: Icons.receipt_long_rounded,
                    color: const Color(0xFF2563EB),
                    title: 'Paiement\nfactures',
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Paiement CIE, SODECI, Factures & Tontines')),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildQuickActionButton(
                    icon: Icons.phone_android_rounded,
                    color: const Color(0xFF0F172A),
                    title: 'Achat crédit\ntéléphonique',
                    onTap: widget.onNavigateToMobileMoney,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),

            // Speedometer / Gauge Financial Utilization Box (Photo 4)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Capacité & Solde Global',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF64748B),
                        ),
                      ),
                      Text(
                        '2 000 000 XOF',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF0F172A),
                          fontFamily: 'monospace',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),

                  // Semi-circle gauge simulation
                  Center(
                    child: SizedBox(
                      width: 220,
                      height: 110,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          CustomPaint(
                            size: const Size(220, 110),
                            painter: SpeedometerGaugePainter(),
                          ),
                          Positioned(
                            bottom: 0,
                            child: Column(
                              children: [
                                const Text(
                                  '75% de disponibilité',
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF059669)),
                                ),
                                Text(
                                  'Plafond mensuel respecté',
                                  style: TextStyle(fontSize: 9, color: Colors.grey.shade500),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  const Divider(color: Color(0xFFF1F5F9)),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildGaugeMetric('Revenus mois', '+ 350 000 F', Colors.emerald),
                      _buildGaugeMetric('Dépenses mois', '- 120 000 F', Colors.rose),
                      _buildGaugeMetric('Épargne auto', '+ 25 000 F', Colors.blue),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
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
            BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 2)),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
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
                color: Color(0xFF1E293B),
                height: 1.2,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGaugeMetric(String label, String value, MaterialColor color) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 10, color: Color(0xFF64748B), fontWeight: FontWeight.w500)),
        const SizedBox(height: 2),
        Text(value, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color.shade700)),
      ],
    );
  }
}

// Custom Painter for the gauge speedo
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

    final warningPaint = Paint()
      ..color = const Color(0xFFE11D48)
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

    // Warning segment (75% to 100%)
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      3.14159 + (3.14159 * 0.75),
      3.14159 * 0.25,
      false,
      warningPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
