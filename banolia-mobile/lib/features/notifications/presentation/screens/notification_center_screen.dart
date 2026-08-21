import 'package:flutter/material.dart';

class NotificationCenterScreen extends StatefulWidget {
  const NotificationCenterScreen({super.key});

  @override
  State<NotificationCenterScreen> createState() => _NotificationCenterScreenState();
}

class _NotificationCenterScreenState extends State<NotificationCenterScreen> {
  int _activeFilter = 0; // 0: Tous, 1: SMS Banking, 2: Emails & Relevés

  final List<Map<String, dynamic>> _notifications = [
    {
      'type': 'SMS',
      'title': 'Avis de Crédit - Virement Reçu',
      'content': 'COOPEC Info: Crédit de +50 000 F.CFA sur le compte A0200225. Ref: VIR-2026-8812. Nouveau solde: 2 000 000 F.CFA le 21/08/2026.',
      'date': 'Il y a 10 min',
      'icon': Icons.sms_rounded,
      'color': Color(0xFF059669),
    },
    {
      'type': 'EMAIL',
      'title': 'Relevé Mensuel de Compte (PDF)',
      'content': 'Votre relevé officiel arrêté au 20 Août 2026 est disponible au format PDF sécurisé certifié BCEAO.',
      'date': 'Hier à 18:30',
      'icon': Icons.mark_email_read_rounded,
      'color': Color(0xFF2563EB),
      'hasAttachment': true,
      'attachmentName': 'Releve_COOPEC_A0200225_Aout2026.pdf',
    },
    {
      'type': 'SMS',
      'title': 'Prélèvement Mensuel de Tontine',
      'content': 'COOPEC Alerte: Débit de -25 000 F.CFA au titre de votre épargne tontine mensuelle. Solde disponible: 1 950 000 F.CFA.',
      'date': '19 Août 2026',
      'icon': Icons.sms_rounded,
      'color': Color(0xFFE11D48),
    },
    {
      'type': 'EMAIL',
      'title': 'Échéance de Prêt - Rappel Automatique',
      'content': 'Chère / Cher Adhérent, la mensualité de votre prêt (45 000 F.CFA) sera prélevée le 28 Août 2026.',
      'date': '18 Août 2026',
      'icon': Icons.mail_outline_rounded,
      'color': Color(0xFF7C3AED),
      'hasAttachment': false,
    },
  ];

  @override
  Widget build(BuildContext context) {
    final filteredList = _activeFilter == 0
        ? _notifications
        : _activeFilter == 1
            ? _notifications.where((n) => n['type'] == 'SMS').toList()
            : _notifications.where((n) => n['type'] == 'EMAIL').toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF0F172A), size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Centre des Messages & Alertes',
          style: TextStyle(
            color: Color(0xFF0F172A),
            fontWeight: FontWeight.bold,
            fontSize: 17,
          ),
        ),
      ),
      body: Column(
        children: [
          // Filter Chips Bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                _buildFilterChip(0, 'Toutes les alertes'),
                const SizedBox(width: 8),
                _buildFilterChip(1, 'SMS Banking'),
                const SizedBox(width: 8),
                _buildFilterChip(2, 'Emails / Relevés'),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFE2E8F0)),

          // Notifications List
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: filteredList.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (ctx, i) {
                final item = filteredList[i];
                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 6),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: (item['color'] as Color).withOpacity(0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(item['icon'] as IconData, color: item['color'] as Color, size: 20),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item['title'],
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF0F172A),
                                  ),
                                ),
                                Text(
                                  item['date'],
                                  style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: (item['color'] as Color).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              item['type'],
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                color: item['color'] as Color,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        item['content'],
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF334155),
                          height: 1.4,
                        ),
                      ),
                      if (item['hasAttachment'] == true) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFCBD5E1)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.picture_as_pdf_rounded, color: Color(0xFFE11D48), size: 22),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  item['attachmentName'] ?? 'Releve.pdf',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF1E293B),
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const Icon(Icons.download_rounded, color: Color(0xFF2563EB), size: 20),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(int index, String label) {
    final isActive = _activeFilter == index;
    return GestureDetector(
      onTap: () => setState(() => _activeFilter = index),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: isActive ? Colors.white : const Color(0xFF64748B),
          ),
        ),
      ),
    );
  }
}
