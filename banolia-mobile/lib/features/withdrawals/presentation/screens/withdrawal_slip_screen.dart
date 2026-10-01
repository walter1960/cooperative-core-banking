import 'package:flutter/material.dart';
import '../../../../core/database/coop_database_service.dart';
import '../../../../core/services/mobile_request_service.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/utils/currency_formatter.dart';
import '../../../../core/utils/date_formatter.dart';
import '../../../../core/utils/french_number_words.dart';

class WithdrawalSlipScreen extends StatefulWidget {
  final CoopAppState appState;

  const WithdrawalSlipScreen({super.key, required this.appState});

  @override
  State<WithdrawalSlipScreen> createState() => _WithdrawalSlipScreenState();
}

class _WithdrawalSlipScreenState extends State<WithdrawalSlipScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _amountCtrl = TextEditingController(text: '50000');
  final _reasonCtrl = TextEditingController(text: 'Demande de retrait partiel sur épargne pour convenance personnelle');
  String _selectedAccount = 'Livret Épargne';
  String _selectedAgency = 'Guichet Agence Principale';

  // Règles de retrait maximum : Court/Moyen terme vs Long terme
  String _engagementType = 'COURT_MOYEN'; // 'COURT_MOYEN' | 'LONG_TERME'

  final List<String> _agencies = const [
    'Guichet Agence Principale',
    'Guichet Caisse Centrale',
    'Guichet Digital / Agence',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _amountCtrl.dispose();
    _reasonCtrl.dispose();
    super.dispose();
  }

  // Calcul du plafond selon les règles de la Coopérative (déduction de l'épargne bloquée volontairement)
  int _computeMaxRetirable() {
    final liquid = widget.appState.availableLiquidSavings;
    if (_engagementType == 'LONG_TERME') {
      final longTermLoans = widget.appState.activeLoans.where((l) => l.isLongTerm && l.status == 'EN_COURS');
      final longTermDebt = longTermLoans.fold<int>(0, (sum, l) => sum + l.remainingPrincipalXof);
      const guaranteeSavings = 50000;
      final calc = liquid - guaranteeSavings - longTermDebt;
      return calc > 0 ? calc : 0;
    } else {
      // Court et Moyen terme : basé sur le disponible liquide
      const minReserve = 50000;
      final calc = liquid - minReserve;
      return calc > 0 ? calc : 0;
    }
  }

  void _handleCreateSlip() {
    final amount = int.tryParse(_amountCtrl.text.replaceAll(' ', '')) ?? 0;
    if (amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez saisir un montant valide.'), backgroundColor: Color(0xFFE11D48)),
      );
      return;
    }

    final maxRetirable = _computeMaxRetirable();

    if (amount > maxRetirable) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _engagementType == 'LONG_TERME'
                ? 'Plafond dépassé selon la règle Long Terme (Épargne - Garantie - Crédit : ${CurrencyFormatter.formatXOF(maxRetirable)} retirable max).'
                : 'Solde disponible insuffisant (${CurrencyFormatter.formatXOF(maxRetirable)} retirable max).',
          ),
          backgroundColor: const Color(0xFFE11D48),
        ),
      );
      return;
    }

    final slip = widget.appState.createWithdrawalSlip(
      amountXof: amount,
      accountType: _selectedAccount,
      agency: _selectedAgency,
      reason: _reasonCtrl.text,
    );

    if (slip != null) {
      // Transmission RÉELLE au serveur Core Banking Desktop
      MobileRequestService.submitWithdrawalRequest(
        requestNumber: slip.slipNumber,
        memberCode: widget.appState.memberCode,
        memberName: widget.appState.memberName,
        memberPhone: widget.appState.memberPhone,
        amount: amount,
        purpose: _reasonCtrl.text,
        selectedAccount: _selectedAccount,
        selectedAgency: _selectedAgency,
      );

      _tabController.animateTo(0);
      _showSlipDetailModal(slip);
    }
  }

  void _showSlipDetailModal(WithdrawalSlip slip) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.88,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.all(22),
        child: Column(
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

            // Header Bordereau Officiel
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: const Color(0xFF0F172A), borderRadius: BorderRadius.circular(12)),
                      child: const Icon(Icons.receipt_long_rounded, color: Colors.white, size: 22),
                    ),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('FICHE DE RETRAIT PARTIEL N° R', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF0F172A))),
                        Text(slip.slipNumber, style: const TextStyle(fontSize: 11, fontFamily: 'monospace', fontWeight: FontWeight.bold, color: Color(0xFF2563EB))),
                      ],
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: slip.status == 'EN_ATTENTE_GUICHET' ? const Color(0xFFFEF3C7) : const Color(0xFFD1FAE5),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    slip.status == 'EN_ATTENTE_GUICHET' ? 'VALIDE GUICHET' : slip.status,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: slip.status == 'EN_ATTENTE_GUICHET' ? const Color(0xFFB45309) : const Color(0xFF047857),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // BANDEAU D'OBLIGATION PHYSIQUE EN AGENCE
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFF87171)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.person_pin_circle_rounded, color: Color(0xFFDC2626), size: 20),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'OBLIGATION FORMELLE : Vous devez vous déplacer physiquement au guichet de l\'agence avec votre pièce d\'identité pour percevoir les espèces.',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF991B1B)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            const Divider(color: Color(0xFFE2E8F0)),

            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    // Visual Bank Voucher Slip Card
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFCBD5E1)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('COOPEC ÉPARGNE & CRÉDIT', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.5)),
                                  const Text('Agrément SFD - UMOA / BCEAO', style: TextStyle(fontSize: 9, color: Color(0xFF64748B))),
                                ],
                              ),
                              Text(DateFormatter.formatDate(slip.createdAt), style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                            ],
                          ),
                          const SizedBox(height: 12),

                          _buildVoucherRow('Nom et Prénoms', slip.memberName),
                          _buildVoucherRow('N° Matricule Sociétaire', slip.memberCode),
                          _buildVoucherRow('Compte à débiter', slip.accountType),
                          _buildVoucherRow('Guichet de paiement', slip.agency),
                          const Divider(height: 20),

                          // Amount box
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0F172A),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Column(
                              children: [
                                const Text('MONTANT VALISÉ POUR DÉCAISSEMENT', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
                                const SizedBox(height: 4),
                                Text(
                                  CurrencyFormatter.formatXOF(slip.amountXof),
                                  style: const TextStyle(color: Color(0xFF10B981), fontSize: 24, fontWeight: FontWeight.w900, fontFamily: 'monospace'),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  slip.amountInWords,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(color: Colors.white70, fontSize: 10, fontStyle: FontStyle.italic),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),

                          // QR Code Center
                          Center(
                            child: Column(
                              children: [
                                Container(
                                  width: 110,
                                  height: 110,
                                  decoration: BoxDecoration(
                                    border: Border.all(color: const Color(0xFF94A3B8), width: 2),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(Icons.qr_code_2_rounded, size: 90, color: Color(0xFF0F172A)),
                                ),
                                const SizedBox(height: 6),
                                const Text(
                                  'À scanner par le caissier pour validation immédiate',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 10, color: Color(0xFF64748B)),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Expiration notice
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFBFDBFE)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.info_outline_rounded, color: Color(0xFF2563EB), size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Valable jusqu\'au ${DateFormatter.formatDateTime(slip.expiresAt)}. Présentez votre pièce d\'identité.',
                              style: const TextStyle(fontSize: 11, color: Color(0xFF1E3A8A)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Actions
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Fiche de retrait PDF enregistrée avec succès !'),
                          backgroundColor: Color(0xFF059669),
                        ),
                      );
                    },
                    icon: const Icon(Icons.download_rounded),
                    label: const Text('Télécharger PDF'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => Navigator.pop(ctx),
                    icon: const Icon(Icons.close_rounded),
                    label: const Text('Fermer'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF0F172A),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVoucherRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
          Text(value, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = widget.appState;
    final maxRetirable = _computeMaxRetirable();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Fiche de Retrait Partiel N° R',
          style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w900, fontSize: 18),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFF0F172A),
          unselectedLabelColor: const Color(0xFF64748B),
          indicatorColor: const Color(0xFF0F172A),
          indicatorWeight: 3,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: const [
            Tab(icon: Icon(Icons.history_rounded, size: 20), text: 'Fiches Émises'),
            Tab(icon: Icon(Icons.add_card_rounded, size: 20), text: 'Nouvelle Demande'),
          ],
        ),
      ),
      body: ListenableBuilder(
        listenable: state,
        builder: (context, _) {
          return TabBarView(
            controller: _tabController,
            children: [
              
              // ---------------------------------------------------------
              // TAB 1: Historique des Fiches Émises
              // ---------------------------------------------------------
              state.withdrawalSlips.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.receipt_long_outlined, size: 60, color: Colors.grey.shade400),
                          const SizedBox(height: 12),
                          const Text('Aucune fiche de retrait générée', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF64748B))),
                          const SizedBox(height: 6),
                          const Text('Vos bordereaux de retrait apparaîtront ici.', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(18),
                      itemCount: state.withdrawalSlips.length,
                      itemBuilder: (context, i) {
                        final slip = state.withdrawalSlips[i];
                        final isWaiting = slip.status == 'EN_ATTENTE_GUICHET';

                        return Container(
                          margin: const EdgeInsets.only(bottom: 14),
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4)),
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
                                          color: isWaiting ? const Color(0xFFFEF3C7) : const Color(0xFFD1FAE5),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: Icon(
                                          Icons.receipt_rounded,
                                          color: isWaiting ? const Color(0xFFD97706) : const Color(0xFF059669),
                                          size: 20,
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(slip.slipNumber, style: const TextStyle(fontWeight: FontWeight.w900, fontFamily: 'monospace', fontSize: 13, color: Color(0xFF0F172A))),
                                          Text(DateFormatter.formatDateTime(slip.createdAt), style: const TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                                        ],
                                      ),
                                    ],
                                  ),
                                  Text(
                                    CurrencyFormatter.formatXOF(slip.amountXof),
                                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Color(0xFF0F172A), fontFamily: 'monospace'),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  const Icon(Icons.account_balance_rounded, size: 14, color: Color(0xFF64748B)),
                                  const SizedBox(width: 6),
                                  Expanded(child: Text(slip.agency, style: const TextStyle(fontSize: 11, color: Color(0xFF475569)), overflow: TextOverflow.ellipsis)),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  const Icon(Icons.person_pin_circle_outlined, size: 14, color: Color(0xFFDC2626)),
                                  const SizedBox(width: 6),
                                  const Expanded(child: Text('Retrait physique obligatoire au guichet', style: TextStyle(fontSize: 10, color: Color(0xFFDC2626), fontWeight: FontWeight.bold))),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  TextButton.icon(
                                    onPressed: () => _showSlipDetailModal(slip),
                                    icon: const Icon(Icons.visibility_rounded, size: 16),
                                    label: const Text('Voir le Bordereau / QR', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),

              // ---------------------------------------------------------
              // TAB 2: Formulaire d'Émission de Fiche de Retrait
              // ---------------------------------------------------------
              SingleChildScrollView(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    
                    // BANDEAU D'OBLIGATION PHYSIQUE EN AGENCE
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF2F2),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFFCA5A5), width: 1.5),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.warning_amber_rounded, color: Color(0xFFDC2626), size: 26),
                          SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'OBLIGATION DE DÉPLACEMENT EN AGENCE',
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF991B1B), letterSpacing: 0.5),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'La fiche de retrait numérique pré-enregistre votre opération. Vous devez impérativement vous déplacer physiquement au guichet de l\'agence pour l\'émargement et la délivrance des espèces.',
                                  style: TextStyle(fontSize: 10, color: Color(0xFF7F1D1D)),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    // RÈGLES DU RETRAIT MAXIMUM (Sélecteur Court/Moyen vs Long Terme)
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFCBD5E1)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Règles de Calcul du Retrait Maximum', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A))),
                          const SizedBox(height: 4),
                          const Text(
                            'Le plafond retirable dépend de votre type d\'engagement :',
                            style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                          ),
                          const SizedBox(height: 10),

                          Row(
                            children: [
                              Expanded(
                                child: InkWell(
                                  onTap: () => setState(() => _engagementType = 'COURT_MOYEN'),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                                    decoration: BoxDecoration(
                                      color: _engagementType == 'COURT_MOYEN' ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Column(
                                      children: [
                                        Text('Court & Moyen Terme', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: _engagementType == 'COURT_MOYEN' ? Colors.white : const Color(0xFF475569))),
                                        const SizedBox(height: 2),
                                        Text('Solde disponible direct', style: TextStyle(fontSize: 9, color: _engagementType == 'COURT_MOYEN' ? Colors.white70 : const Color(0xFF64748B))),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: InkWell(
                                  onTap: () => setState(() => _engagementType = 'LONG_TERME'),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                                    decoration: BoxDecoration(
                                      color: _engagementType == 'LONG_TERME' ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Column(
                                      children: [
                                        Text('Long Terme', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: _engagementType == 'LONG_TERME' ? Colors.white : const Color(0xFF475569))),
                                        const SizedBox(height: 2),
                                        Text('Formule Épargne-Garantie-Prêt', style: TextStyle(fontSize: 9, color: _engagementType == 'LONG_TERME' ? Colors.white70 : const Color(0xFF64748B))),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),

                          // Détail de la formule
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('Plafond retirable autorisé :', style: TextStyle(fontSize: 11, color: Color(0xFF475569), fontWeight: FontWeight.bold)),
                                    Text(
                                      CurrencyFormatter.formatXOF(maxRetirable),
                                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF059669), fontFamily: 'monospace'),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _engagementType == 'LONG_TERME'
                                      ? 'Formule : Épargne (${CurrencyFormatter.formatXOF(state.savingsAccountBalance)}) - Garantie (50 000 F) - Crédit Long Terme en cours'
                                      : 'Basé directement sur le solde disponible de votre compte.',
                                  style: const TextStyle(fontSize: 10, color: Color(0xFF64748B)),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Formulaire
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
                          const Text('Détails du Retrait', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          const SizedBox(height: 14),

                          const Text('Compte à débiter :', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                          const SizedBox(height: 6),
                          DropdownButtonFormField<String>(
                            value: _selectedAccount,
                            decoration: const InputDecoration(border: OutlineInputBorder()),
                            items: const [
                              DropdownMenuItem(value: 'Livret Épargne', child: Text('Livret Épargne (Retrait Partiel)')),
                              DropdownMenuItem(value: 'Compte Courant', child: Text('Compte Courant')),
                            ],
                            onChanged: (v) => setState(() => _selectedAccount = v!),
                          ),
                          const SizedBox(height: 14),

                          TextField(
                            controller: _amountCtrl,
                            keyboardType: TextInputType.number,
                            onChanged: (_) => setState(() {}),
                            decoration: const InputDecoration(
                              labelText: 'Montant du retrait (XOF)',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.payments_outlined),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Builder(builder: (context) {
                            final amt = int.tryParse(_amountCtrl.text.replaceAll(' ', '')) ?? 0;
                            return Text(
                              'Montant en lettres : ${FrenchNumberWords.convertToFrancsCfa(amt)}',
                              style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: Color(0xFFD97706), fontWeight: FontWeight.bold),
                            );
                          }),
                          const SizedBox(height: 14),

                          const Text('Agence physique de retrait :', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                          const SizedBox(height: 6),
                          DropdownButtonFormField<String>(
                            value: _selectedAgency,
                            decoration: const InputDecoration(border: OutlineInputBorder()),
                            items: _agencies.map((a) => DropdownMenuItem(value: a, child: Text(a, style: const TextStyle(fontSize: 12)))).toList(),
                            onChanged: (v) => setState(() => _selectedAgency = v!),
                          ),
                          const SizedBox(height: 14),

                          TextField(
                            controller: _reasonCtrl,
                            decoration: const InputDecoration(
                              labelText: 'Motif du retrait',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.edit_note_outlined),
                            ),
                          ),
                          const SizedBox(height: 20),

                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: _handleCreateSlip,
                              icon: const Icon(Icons.qr_code_rounded),
                              label: const Text('Générer la Fiche avec QR Code', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF0F172A),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
