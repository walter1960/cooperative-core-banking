import 'package:flutter/material.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/utils/date_formatter.dart';

class SupportTicketScreen extends StatefulWidget {
  final CoopAppState appState;

  const SupportTicketScreen({super.key, required this.appState});

  @override
  State<SupportTicketScreen> createState() => _SupportTicketScreenState();
}

class _SupportTicketScreenState extends State<SupportTicketScreen> {
  String _category = 'Tontine & Épargne';
  final _subjectCtrl = TextEditingController();
  final _messageCtrl = TextEditingController();

  final List<String> _categories = const [
    'Tontine & Épargne',
    'Carte Sociétaire',
    'Opérations d\'Épargne & Guichet',
    'Crédit & Échéancier',
    'Informations Personnelles',
    'Autre Réclamation',
  ];

  @override
  void dispose() {
    _subjectCtrl.dispose();
    _messageCtrl.dispose();
    super.dispose();
  }

  void _handleSubmitTicket() {
    if (_subjectCtrl.text.isEmpty || _messageCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez remplir l\'objet et le message.'), backgroundColor: Color(0xFFE11D48)),
      );
      return;
    }

    widget.appState.createSupportTicket(
      subject: _subjectCtrl.text,
      category: _category,
      message: _messageCtrl.text,
    );

    _subjectCtrl.clear();
    _messageCtrl.clear();

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Votre ticket d\'assistance a été envoyé ! Traitement sous 24h.'),
        backgroundColor: Color(0xFF059669),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = widget.appState;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Demandes & Réclamations',
          style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w900, fontSize: 19),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Create ticket card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.support_agent_rounded, color: Color(0xFF2563EB), size: 24),
                      SizedBox(width: 10),
                      Text('Créer une nouvelle demande', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                  const SizedBox(height: 16),

                  const Text('Catégorie :', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      border: Border.all(color: const Color(0xFFCBD5E1)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        isExpanded: true,
                        value: _category,
                        items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(fontSize: 13)))).toList(),
                        onChanged: (v) => setState(() => _category = v!),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  TextField(
                    controller: _subjectCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Objet de la demande',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.title_outlined),
                    ),
                  ),
                  const SizedBox(height: 12),

                  TextField(
                    controller: _messageCtrl,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      labelText: 'Détails de votre réclamation / message',
                      alignLabelWithHint: true,
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _handleSubmitTicket,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0F172A),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: const Text('Envoyer la Réclamation', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Tickets History
            const Text(
              'HISTORIQUE DE VOS TICKETS',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF64748B), letterSpacing: 0.8),
            ),
            const SizedBox(height: 10),
            ListenableBuilder(
              listenable: state,
              builder: (context, _) {
                if (state.tickets.isEmpty) {
                  return Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                    child: const Center(child: Text('Aucun ticket actif.', style: TextStyle(color: Color(0xFF64748B)))),
                  );
                }

                return ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: state.tickets.length,
                  itemBuilder: (ctx, i) {
                    final t = state.tickets[i];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(6)),
                                child: Text(t.category, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF2563EB))),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: t.status == 'RESOLU' ? const Color(0xFFD1FAE5) : const Color(0xFFFEF3C7),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  t.status,
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: t.status == 'RESOLU' ? const Color(0xFF047857) : const Color(0xFFB45309),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(t.subject, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F172A))),
                          const SizedBox(height: 4),
                          Text(t.message, style: const TextStyle(fontSize: 12, color: Color(0xFF475569))),
                          if (t.response != null) ...[
                            const SizedBox(height: 10),
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(10)),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(Icons.reply_rounded, size: 16, color: Color(0xFF059669)),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      'Réponse COOPEC : ${t.response}',
                                      style: const TextStyle(fontSize: 11, color: Color(0xFF0F172A), fontStyle: FontStyle.italic),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                          const SizedBox(height: 6),
                          Text(DateFormatter.formatDateTime(t.createdAt), style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
                        ],
                      ),
                    );
                  },
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
