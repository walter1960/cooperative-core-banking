import 'package:flutter/material.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/utils/currency_formatter.dart';

class CardsManagementScreen extends StatefulWidget {
  final CoopAppState? appState;

  const CardsManagementScreen({super.key, this.appState});

  @override
  State<CardsManagementScreen> createState() => _CardsManagementScreenState();
}

class _CardsManagementScreenState extends State<CardsManagementScreen> {
  bool _showCardDetails = false;
  int _cardCarouselIndex = 0;

  final List<Map<String, dynamic>> _cards = [
    {
      'type': 'CARTE DE MEMBRE SOCIÉTAIRE',
      'number': '2512 •••• •••• 1300',
      'fullNumber': '2512 1100 1300 4901',
      'expiry': '12/28',
      'holder': 'MILDZINA Tomrom Didier',
      'brand': 'COOPEC',
      'gradient': [
        const Color(0xFF94A3B8), // Gris argenté clair
        const Color(0xFF64748B), // Gris acier métallisé
        const Color(0xFF475569), // Gris ardoise soutenu
        const Color(0xFF334155), // Gris titane
      ],
    },
  ];

  void _showAdjustLimitsModal(CoopAppState state) {
    int tempWithdrawal = state.cardDailyWithdrawalLimit;
    int tempPayment = state.cardMonthlyPaymentLimit;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Container(
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
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 16),
              const Text('Ajuster les Plafonds de Carte', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF0F172A))),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Plafond Retrait GAB / Jour', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  Text(CurrencyFormatter.formatXOF(tempWithdrawal), style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF2563EB))),
                ],
              ),
              Slider(
                value: tempWithdrawal.toDouble(),
                min: 100000,
                max: 1500000,
                divisions: 14,
                activeColor: const Color(0xFF2563EB),
                onChanged: (v) => setModalState(() => tempWithdrawal = v.toInt()),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Plafond Paiement TPE / Mois', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  Text(CurrencyFormatter.formatXOF(tempPayment), style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF059669))),
                ],
              ),
              Slider(
                value: tempPayment.toDouble(),
                min: 500000,
                max: 5000000,
                divisions: 9,
                activeColor: const Color(0xFF059669),
                onChanged: (v) => setModalState(() => tempPayment = v.toInt()),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () {
                  state.updateCardSettings(dailyLimit: tempWithdrawal, monthlyLimit: tempPayment);
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Plafonds mis à jour avec succès !'), backgroundColor: Color(0xFF059669)),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F172A),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('Enregistrer les Nouveaux Plafonds', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = widget.appState ?? CoopAppState();
    final currentCard = _cards[_cardCarouselIndex];

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Carte Sociétaire',
          style: TextStyle(
            color: Color(0xFF0F172A),
            fontWeight: FontWeight.w900,
            fontSize: 22,
          ),
        ),
      ),
      body: ListenableBuilder(
        listenable: state,
        builder: (context, _) {
          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Photorealistic Bank Card
                Container(
                  height: 210,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    gradient: LinearGradient(
                      colors: currentCard['gradient'] as List<Color>,
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.3),
                        blurRadius: 18,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.all(22),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Card Top Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              'COOPEC FINANCES',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11),
                            ),
                          ),
                          Row(
                            children: [
                              if (state.isCardLocked)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFE11D48),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Text('VERROUILLÉE', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                                )
                              else
                                const Icon(Icons.contactless_rounded, color: Colors.white70, size: 22),
                            ],
                          ),
                        ],
                      ),

                      // EMV Chip & NFC
                      Row(
                        children: [
                          Container(
                            width: 38,
                            height: 28,
                            decoration: BoxDecoration(
                              color: const Color(0xFFE2B755),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: const Color(0xFFD4A034), width: 1.5),
                            ),
                            child: Stack(
                              children: [
                                Positioned(left: 12, top: 0, bottom: 0, child: Container(width: 1, color: Colors.black26)),
                                Positioned(left: 24, top: 0, bottom: 0, child: Container(width: 1, color: Colors.black26)),
                                Positioned(top: 13, left: 0, right: 0, child: Container(height: 1, color: Colors.black26)),
                              ],
                            ),
                          ),
                        ],
                      ),

                      // Card Number & Cardholder
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _showCardDetails ? currentCard['fullNumber'] as String : currentCard['number'] as String,
                            style: const TextStyle(
                              color: Colors.white,
                              fontFamily: 'monospace',
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 2,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('TITULAIRE', style: TextStyle(color: Colors.white54, fontSize: 9)),
                                  Text(
                                    state.memberName,
                                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('EXPIRE', style: TextStyle(color: Colors.white54, fontSize: 9)),
                                  Text(
                                    currentCard['expiry'] as String,
                                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                              if (_showCardDetails)
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('STATUT', style: TextStyle(color: Colors.white54, fontSize: 9)),
                                    const Text(
                                      'SOCIÉTAIRE ACTIF',
                                      style: TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                              Text(
                                currentCard['brand'] as String,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w900,
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // Carousel dots
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    _cards.length,
                    (i) => GestureDetector(
                      onTap: () => setState(() => _cardCarouselIndex = i),
                      child: Container(
                        width: _cardCarouselIndex == i ? 18 : 8,
                        height: 8,
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        decoration: BoxDecoration(
                          color: _cardCarouselIndex == i ? const Color(0xFF0F172A) : const Color(0xFFCBD5E1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // 2 Quick action buttons: Bloquer / Détails de la carte
                Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () {
                          state.updateCardSettings(isLocked: !state.isCardLocked);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(state.isCardLocked ? 'Carte temporairement bloquée' : 'Carte débloquée avec succès'),
                              backgroundColor: state.isCardLocked ? const Color(0xFFE11D48) : const Color(0xFF059669),
                            ),
                          );
                        },
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: state.isCardLocked ? const Color(0xFFFFE4E6) : const Color(0xFFF1F5F9),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  state.isCardLocked ? Icons.lock_open_rounded : Icons.lock_outline_rounded,
                                  color: state.isCardLocked ? const Color(0xFFE11D48) : const Color(0xFF0F172A),
                                  size: 24,
                                ),
                              ),
                              const SizedBox(height: 10),
                              Text(
                                state.isCardLocked ? 'Débloquer' : 'Bloquer',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF0F172A)),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: InkWell(
                        onTap: () => setState(() => _showCardDetails = !_showCardDetails),
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: const BoxDecoration(
                                  color: Color(0xFFEFF6FF),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  _showCardDetails ? Icons.visibility_off_outlined : Icons.remove_red_eye_outlined,
                                  color: const Color(0xFF2563EB),
                                  size: 24,
                                ),
                              ),
                              const SizedBox(height: 10),
                              Text(
                                _showCardDetails ? 'Masquer détails' : 'Détails de la carte',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF0F172A)),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Card Limits Card
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Plafonds Actuels', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          TextButton.icon(
                            onPressed: () => _showAdjustLimitsModal(state),
                            icon: const Icon(Icons.tune_rounded, size: 16),
                            label: const Text('Modifier', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Retrait GAB / Jour', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                          Text(CurrencyFormatter.formatXOF(state.cardDailyWithdrawalLimit), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Paiement TPE / Mois', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                          Text(CurrencyFormatter.formatXOF(state.cardMonthlyPaymentLimit), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          );
        },
      ),
    );
  }
}
