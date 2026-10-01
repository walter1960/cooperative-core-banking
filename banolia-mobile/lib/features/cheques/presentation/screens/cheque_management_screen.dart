import 'package:flutter/material.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/utils/date_formatter.dart';

class ChequeManagementScreen extends StatefulWidget {
  final CoopAppState appState;

  const ChequeManagementScreen({super.key, required this.appState});

  @override
  State<ChequeManagementScreen> createState() => _ChequeManagementScreenState();
}

class _ChequeManagementScreenState extends State<ChequeManagementScreen> {
  int _leavesCount = 25;
  String _selectedAgency = 'Agence Principale Lomé Assivito';

  final List<String> _agencies = const [
    'Agence Principale Lomé Assivito',
    'Agence Déckon - Boulevard du 13 Janvier',
    'Agence Hedzranawoé - Grand Contournement',
    'Agence Kara - Marché Central',
    'Agence Sokodé - Centre Ville',
  ];

  void _handleOrder() {
    widget.appState.orderChequeBook(
      numberOfLeaves: _leavesCount,
      agency: _selectedAgency,
    );

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.check_circle_rounded, color: Color(0xFF059669)),
            SizedBox(width: 8),
            Text('Commande Enregistrée !', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
          ],
        ),
        content: Text(
          'Votre chéquier de $_leavesCount feuillets est en cours de confection. Vous recevrez un SMS dès qu\'il sera disponible à l\'$_selectedAgency.',
          style: const TextStyle(fontSize: 13),
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F172A), foregroundColor: Colors.white),
            child: const Text('OK'),
          ),
        ],
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
          'Gestion des Chéquiers',
          style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w900, fontSize: 20),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Cheque order section
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
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE11D48).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.edit_note_rounded, color: Color(0xFFE11D48)),
                      ),
                      const SizedBox(width: 12),
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Commander un Chéquier', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          Text('Délai d\'émission : 48h à 72h ouvrées', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),

                  const Text('Format du carnet :', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: ChoiceChip(
                          label: const Center(child: Text('25 Feuillets (Standard)')),
                          selected: _leavesCount == 25,
                          selectedColor: const Color(0xFF0F172A),
                          labelStyle: TextStyle(
                            color: _leavesCount == 25 ? Colors.white : const Color(0xFF0F172A),
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                          onSelected: (_) => setState(() => _leavesCount = 25),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ChoiceChip(
                          label: const Center(child: Text('50 Feuillets (Entreprise)')),
                          selected: _leavesCount == 50,
                          selectedColor: const Color(0xFF0F172A),
                          labelStyle: TextStyle(
                            color: _leavesCount == 50 ? Colors.white : const Color(0xFF0F172A),
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                          onSelected: (_) => setState(() => _leavesCount = 50),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  const Text('Agence de retrait :', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
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
                        value: _selectedAgency,
                        items: _agencies.map((a) => DropdownMenuItem(value: a, child: Text(a, style: const TextStyle(fontSize: 12)))).toList(),
                        onChanged: (v) => setState(() => _selectedAgency = v!),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _handleOrder,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0F172A),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: const Text('Confirmer la Commande', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Cheque orders list
            const Text(
              'HISTORIQUE DE VOS COMMANDES',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF64748B), letterSpacing: 0.8),
            ),
            const SizedBox(height: 10),
            ListenableBuilder(
              listenable: state,
              builder: (context, _) {
                if (state.chequeOrders.isEmpty) {
                  return Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                    child: const Center(child: Text('Aucune commande de chéquier en cours.', style: TextStyle(color: Color(0xFF64748B)))),
                  );
                }

                return ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: state.chequeOrders.length,
                  itemBuilder: (ctx, i) {
                    final ord = state.chequeOrders[i];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.check_box_outline_blank_rounded, color: Color(0xFF2563EB)),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Chéquier ${ord.numberOfLeaves} feuillets', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                Text('Retrait : ${ord.agency}', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                                Text(DateFormatter.formatDate(ord.orderDate), style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(color: const Color(0xFFFEF3C7), borderRadius: BorderRadius.circular(8)),
                            child: Text(ord.status, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF92400E))),
                          ),
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
