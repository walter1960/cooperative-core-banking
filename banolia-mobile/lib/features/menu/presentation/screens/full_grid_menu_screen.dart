import 'package:flutter/material.dart';

class FullGridMenuScreen extends StatelessWidget {
  final Function(String route) onSelectMenuItem;

  const FullGridMenuScreen({
    super.key,
    required this.onSelectMenuItem,
  });

  final List<Map<String, dynamic>> _menuItems = const [
    {'title': 'Accueil', 'icon': Icons.home_rounded, 'color': Color(0xFFE11D48)},
    {'title': 'Comptes', 'icon': Icons.folder_rounded, 'color': Color(0xFFE11D48)},
    {'title': 'Virements', 'icon': Icons.swap_horiz_rounded, 'color': Color(0xFFE11D48)},
    {'title': 'Cartes', 'icon': Icons.credit_card_rounded, 'color': Color(0xFFE11D48)},
    {'title': 'Chèques', 'icon': Icons.edit_note_rounded, 'color': Color(0xFFE11D48)},
    {'title': 'Wallet', 'icon': Icons.account_balance_wallet_rounded, 'color': Color(0xFFE11D48)},
    {'title': 'Paiement facture', 'icon': Icons.receipt_long_rounded, 'color': Color(0xFFE11D48)},
    {'title': 'Aide et Support', 'icon': Icons.support_agent_rounded, 'color': Color(0xFFE11D48)},
    {'title': 'Demandes et réclamations', 'icon': Icons.chat_bubble_outline_rounded, 'color': Color(0xFFE11D48)},
    {'title': 'Simulateur de crédit', 'icon': Icons.calculate_rounded, 'color': Color(0xFFE11D48)},
    {'title': 'Convertisseur', 'icon': Icons.currency_exchange_rounded, 'color': Color(0xFFE11D48)},
    {'title': 'Nous trouver', 'icon': Icons.location_on_rounded, 'color': Color(0xFFE11D48)},
    {'title': 'Actualités', 'icon': Icons.campaign_rounded, 'color': Color(0xFFE11D48)},
    {'title': 'Produits', 'icon': Icons.business_center_rounded, 'color': Color(0xFFE11D48)},
    {'title': 'Paramètres', 'icon': Icons.settings_rounded, 'color': Color(0xFFE11D48)},
    {'title': 'À propos', 'icon': Icons.description_rounded, 'color': Color(0xFFE11D48)},
    {'title': 'Mentions légales', 'icon': Icons.shield_rounded, 'color': Color(0xFFE11D48)},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Menu',
          style: TextStyle(
            color: Color(0xFF0F172A),
            fontWeight: FontWeight.w900,
            fontSize: 22,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _menuItems.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 2.8,
          ),
          itemBuilder: (ctx, i) {
            final item = _menuItems[i];
            return InkWell(
              onTap: () => onSelectMenuItem(item['title'] as String),
              borderRadius: BorderRadius.circular(18),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(7),
                      decoration: BoxDecoration(
                        color: (item['color'] as Color).withOpacity(0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        item['icon'] as IconData,
                        color: item['color'] as Color,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        item['title'] as String,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
