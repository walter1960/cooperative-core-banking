import 'package:flutter/material.dart';

class CardsManagementScreen extends StatefulWidget {
  const CardsManagementScreen({super.key});

  @override
  State<CardsManagementScreen> createState() => _CardsManagementScreenState();
}

class _CardsManagementScreenState extends State<CardsManagementScreen> {
  bool _isCardLocked = false;
  bool _showCardDetails = false;
  int _cardCarouselIndex = 0;

  final List<Map<String, dynamic>> _cards = [
    {
      'type': 'VISA INFINITE PRIVILÈGE',
      'number': '1234 •••• •••• 3456',
      'fullNumber': '4532 8812 9012 3456',
      'cvv': '842',
      'expiry': '06/27',
      'holder': 'ISSAGA GAYE',
      'gradient': [const Color(0xFF0F172A), const Color(0xFF1E293B), const Color(0xFF334155)],
    },
    {
      'type': 'MASTERCARD GOLD ÉPARGNE',
      'number': '5412 •••• •••• 9812',
      'fullNumber': '5412 7701 4452 9812',
      'cvv': '319',
      'expiry': '09/26',
      'holder': 'ISSAGA GAYE',
      'gradient': [const Color(0xFF78350F), const Color(0xFFB45309), const Color(0xFFD97706)],
    },
  ];

  @override
  Widget build(BuildContext context) {
    final currentCard = _cards[_cardCarouselIndex];

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Cartes',
          style: TextStyle(
            color: Color(0xFF0F172A),
            fontWeight: FontWeight.w900,
            fontSize: 22,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Photorealistic Bank Card (Photo 3)
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
                    color: Colors.black.withOpacity(0.3),
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
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              'COOPEC BANK',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11),
                            ),
                          ),
                        ],
                      ),
                      Text(
                        currentCard['type'] as String,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1,
                        ),
                      ),
                    ],
                  ),

                  // Chip & Contactless wave icon
                  Row(
                    children: [
                      Container(
                        width: 36,
                        height: 26,
                        decoration: BoxDecoration(
                          color: const Color(0xFFFBBF24),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFFD97706), width: 1.5),
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Icon(Icons.wifi, color: Colors.white70, size: 22),
                      if (_isCardLocked) ...[
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE11D48),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.lock, color: Colors.white, size: 12),
                              SizedBox(width: 4),
                              Text('VERROUILLÉE', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),

                  // Card Number & Details
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
                                currentCard['holder'] as String,
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
                          const Text(
                            'VISA',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
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

            // Carousel dots (Photo 3)
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

            // 2 Quick action buttons: Bloquer / Détails de la carte (Photo 3)
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () {
                      setState(() => _isCardLocked = !_isCardLocked);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(_isCardLocked ? 'Carte temporairement bloquée' : 'Carte débloquée avec succès'),
                          backgroundColor: _isCardLocked ? const Color(0xFFE11D48) : const Color(0xFF059669),
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
                              color: _isCardLocked ? const Color(0xFFFFE4E6) : const Color(0xFFF1F5F9),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              _isCardLocked ? Icons.lock_open_rounded : Icons.lock_outline_rounded,
                              color: _isCardLocked ? const Color(0xFFE11D48) : const Color(0xFF0F172A),
                              size: 24,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            _isCardLocked ? 'Débloquer' : 'Bloquer',
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
                            child: const Icon(Icons.remove_red_eye_outlined, color: Color(0xFF2563EB), size: 24),
                          ),
                          const SizedBox(height: 10),
                          const Text(
                            'Détails de la carte',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF0F172A)),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Banner: Demande d'une carte (Photo 3)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
              decoration: BoxDecoration(
                color: const Color(0xFF004085),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(color: const Color(0xFF004085).withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4)),
                ],
              ),
              child: Row(
                children: [
                  const Icon(Icons.credit_card_rounded, color: Colors.white, size: 32),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Demande d'une carte",
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        Text(
                          "Obtenez votre carte en quelques clics",
                          style: TextStyle(color: Colors.white70, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 38,
                    height: 38,
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.chevron_right, color: Color(0xFF004085)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Financial News / Foreign Exchange Promo Carousel (Photo 3)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 70,
                    height: 70,
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.currency_exchange_rounded, color: Colors.amber, size: 36),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          "L'opération de change est un service permettant d'obtenir des devises étrangères en agence.",
                          style: TextStyle(fontSize: 11, color: Color(0xFF334155), height: 1.3),
                        ),
                        const SizedBox(height: 6),
                        GestureDetector(
                          onTap: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Service de change disponible au siège')),
                            );
                          },
                          child: const Text(
                            "Voir plus",
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1E3A8A)),
                          ),
                        ),
                      ],
                    ),
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
}
