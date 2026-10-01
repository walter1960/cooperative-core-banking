import 'package:flutter/material.dart';

class AgenciesMapScreen extends StatelessWidget {
  const AgenciesMapScreen({super.key});

  final List<Map<String, dynamic>> _agencies = const [
    {
      'name': 'Siège Social & Agence Principale Assivito',
      'address': 'Rue du Grand Marché, Lomé',
      'city': 'Lomé - Maritime',
      'phone': '+228 22 21 00 12',
      'hours': '07h30 - 17h00 (Lun - Ven) • 08h00 - 12h30 (Sam)',
      'services': ['Guichet Caisse', 'GAB 24/7', 'Service Crédit', 'Collecte Tontine'],
      'isMain': true,
    },
    {
      'name': 'Agence Déckon',
      'address': 'Boulevard du 13 Janvier, Face Total Déckon',
      'city': 'Lomé - Maritime',
      'phone': '+228 22 22 45 67',
      'hours': '07h30 - 17h00 (Lun - Ven)',
      'services': ['Guichet Caisse', 'GAB 24/7', 'Épargne & Crédit'],
      'isMain': false,
    },
    {
      'name': 'Agence Hedzranawoé',
      'address': 'Grand Contournement, Près du Marché Hedzranawoé',
      'city': 'Lomé - Maritime',
      'phone': '+228 22 26 89 01',
      'hours': '07h30 - 17h00 (Lun - Ven) • 08h00 - 13h00 (Sam)',
      'services': ['Guichet Caisse', 'Tontine Marché', 'GAB 24/7'],
      'isMain': false,
    },
    {
      'name': 'Agence Régionale Kara',
      'address': 'Avenue de la Kara, Face Marché Central',
      'city': 'Kara - Région de la Kara',
      'phone': '+228 26 60 11 22',
      'hours': '07h30 - 16h30 (Lun - Ven)',
      'services': ['Guichet Caisse', 'Crédit Agricole', 'GAB 24/7'],
      'isMain': false,
    },
    {
      'name': 'Agence Régionale Sokodé',
      'address': 'Route Nationale N°1, Centre-Ville',
      'city': 'Sokodé - Région Centrale',
      'phone': '+228 25 50 33 44',
      'hours': '07h30 - 16h30 (Lun - Ven)',
      'services': ['Guichet Caisse', 'Service Épargne & Crédit'],
      'isMain': false,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Agences & Distributeurs GAB',
          style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w900, fontSize: 18),
        ),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _agencies.length,
        itemBuilder: (ctx, i) {
          final a = _agencies[i];
          final isMain = a['isMain'] as bool;

          return Container(
            margin: const EdgeInsets.only(bottom: 14),
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: isMain ? const Color(0xFF059669) : const Color(0xFFE2E8F0), width: isMain ? 2 : 1),
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 8),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: isMain ? const Color(0xFF059669).withValues(alpha: 0.1) : const Color(0xFF0F172A).withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            isMain ? Icons.star_rounded : Icons.location_on_rounded,
                            color: isMain ? const Color(0xFF059669) : const Color(0xFF0F172A),
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          a['city'] as String,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: isMain ? const Color(0xFF059669) : const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                    if (isMain)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: const Color(0xFFD1FAE5), borderRadius: BorderRadius.circular(6)),
                        child: const Text('SIÈGE', style: TextStyle(color: Color(0xFF047857), fontWeight: FontWeight.bold, fontSize: 10)),
                      ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  a['name'] as String,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF0F172A)),
                ),
                const SizedBox(height: 4),
                Text(a['address'] as String, style: const TextStyle(fontSize: 12, color: Color(0xFF475569))),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.access_time_rounded, size: 14, color: Color(0xFF64748B)),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(a['hours'] as String, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.phone_outlined, size: 14, color: Color(0xFF2563EB)),
                    const SizedBox(width: 4),
                    Text(a['phone'] as String, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF2563EB))),
                  ],
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: (a['services'] as List<String>).map((s) {
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(s, style: const TextStyle(fontSize: 10, color: Color(0xFF475569), fontWeight: FontWeight.w600)),
                    );
                  }).toList(),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
