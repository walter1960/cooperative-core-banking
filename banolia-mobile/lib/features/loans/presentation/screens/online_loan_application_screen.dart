import 'dart:math';
import 'package:flutter/material.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/utils/currency_formatter.dart';
import '../../../../core/utils/date_formatter.dart';
import '../../../../core/services/mobile_request_service.dart';

class OnlineLoanApplicationScreen extends StatefulWidget {
  final CoopAppState appState;

  const OnlineLoanApplicationScreen({super.key, required this.appState});

  @override
  State<OnlineLoanApplicationScreen> createState() => _OnlineLoanApplicationScreenState();
}

class _OnlineLoanApplicationScreenState extends State<OnlineLoanApplicationScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Formulaire & Paramètres Grille Officielle
  String _productName = 'Prêt Trésorerie & Équipement';
  int _amount = 2500000;
  int _durationMonths = 12; // 1 à 60 mois

  final _purposeCtrl = TextEditingController(text: 'Financement d\'équipement familial et projet personnel');
  final _incomeCtrl = TextEditingController(text: '550000');
  final _guarantorCtrl = TextEditingController(text: 'Collègue Sociétaire (Matricule 130050)');
  final _writtenStatementCtrl = TextEditingController(
    text: 'Je soussigné, sollicite l\'octroi de ce crédit remboursable par prélèvement direct sur salaire.',
  );
  String _attachedFileName = 'devis_facture_proforma.pdf';
  String _collateralType = 'PRELEVEMENT_PAIE';

  // Filtre de suivi des demandes (jusqu'à 18 mois)
  int _historyMonthsFilter = 18;

  // Calendrier d'échéances (Date Début & Date Fin)
  DateTime _startDate = DateTime(2026, 10, 1);
  late DateTime _endDate;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    final now = DateTime.now();
    _startDate = DateTime(now.year, now.month + 1, 1);
    _endDate = DateTime(_startDate.year + 1, _startDate.month, _startDate.day);
  }

  int _calculateMonthsBetween(DateTime start, DateTime end) {
    int months = (end.year - start.year) * 12 + (end.month - start.month);
    if (end.day >= start.day + 14) months += 1;
    if (months < 1) months = 1;
    if (months > 60) months = 60;
    return months;
  }

  void _handleStartDatePicked(DateTime newDate) {
    setState(() {
      _startDate = newDate;
      _durationMonths = _calculateMonthsBetween(_startDate, _endDate);
    });
  }

  void _handleEndDatePicked(DateTime newDate) {
    setState(() {
      _endDate = newDate;
      _durationMonths = _calculateMonthsBetween(_startDate, _endDate);
    });
  }

  void _handleQuickDuration(int months) {
    setState(() {
      _durationMonths = months;
      int endYear = _startDate.year + ((_startDate.month + months - 1) ~/ 12);
      int endMonth = ((_startDate.month + months - 1) % 12) + 1;
      _endDate = DateTime(endYear, endMonth, _startDate.day);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _purposeCtrl.dispose();
    _incomeCtrl.dispose();
    _guarantorCtrl.dispose();
    _writtenStatementCtrl.dispose();
    super.dispose();
  }

  // -------------------------------------------------------------
  // GRILLE OFFICIELLE DES PRÊTS (DURÉES ET TAUX D'INTÉRÊT)
  // Court terme : 0 à 12 mois -> 5% (Linéaire)
  // Moyen terme : 13 à 36 mois -> 10% (Linéaire)
  // Long terme : 37 à 60 mois -> 9% (Taux dégressif)
  // Plafond : jusqu'à 15 000 000 F CFA
  // -------------------------------------------------------------
  double get _currentRate {
    if (_durationMonths <= 12) return 5.0;
    if (_durationMonths <= 36) return 10.0;
    return 9.0;
  }

  String get _currentTermCategory {
    if (_durationMonths <= 12) return 'Court Terme (0 à 12 mois)';
    if (_durationMonths <= 36) return 'Moyen Terme (13 à 36 mois)';
    return 'Long Terme (37 à 60 mois)';
  }

  String get _calculationMethod {
    if (_durationMonths <= 36) return 'LINEAIRE';
    return 'DEGRESSIF';
  }

  String get _calculationMethodLabel {
    if (_durationMonths <= 12) return 'Taux Linéaire Constant 5%';
    if (_durationMonths <= 36) return 'Taux Linéaire Constant 10%';
    return 'Taux Dégressif 9% (sur Capital Restant Dû)';
  }

  int _calculateMonthlyPayment() {
    final rate = _currentRate;
    if (_durationMonths <= 36) {
      // Formule Linéaire (Court et Moyen Terme) :
      // Intérêt mensuel fixe = (Capital * Taux / 12)
      // Amortissement capital = (Capital / n)
      final monthlyInterest = (_amount * (rate / 100)) / 12;
      final monthlyPrincipal = _amount / _durationMonths;
      return (monthlyPrincipal + monthlyInterest).round();
    } else {
      // Formule Dégressive (Long Terme 37 à 60 mois) :
      // Annuité constante = Capital * i / (1 - (1+i)^-n)
      final i = (rate / 100) / 12;
      if (i == 0) return (_amount / _durationMonths).round();
      final payment = _amount * (i * pow(1 + i, _durationMonths)) / (pow(1 + i, _durationMonths) - 1);
      return payment.round();
    }
  }

  int _calculateTotalInterest() {
    final monthly = _calculateMonthlyPayment();
    return (monthly * _durationMonths) - _amount;
  }

  void _handleSubmit() {
    if (_purposeCtrl.text.isEmpty || _incomeCtrl.text.isEmpty || _guarantorCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez renseigner tous les champs obligatoires.'), backgroundColor: Color(0xFFE11D48)),
      );
      return;
    }

    final income = int.tryParse(_incomeCtrl.text.replaceAll(' ', '')) ?? 0;
    final monthlyPayment = _calculateMonthlyPayment();

    final app = widget.appState.submitOnlineLoanApplication(
      productName: _productName,
      requestedAmountXof: _amount,
      durationMonths: _durationMonths,
      interestRate: _currentRate,
      estimatedMonthlyPaymentXof: monthlyPayment.round(),
      purpose: _purposeCtrl.text,
      monthlyIncomeXof: income,
      collateralType: _collateralType,
      guarantorName: _guarantorCtrl.text,
      termCategory: _currentTermCategory,
      calculationMethod: _calculationMethod,
      attachmentName: _attachedFileName,
      writtenStatement: _writtenStatementCtrl.text,
    );

    // Envoi RÉEL par API HTTP vers le Core Banking Desktop
    MobileRequestService.submitLoanRequest(
      requestNumber: app.applicationNumber,
      memberCode: widget.appState.memberCode,
      memberName: widget.appState.memberName,
      memberPhone: widget.appState.memberPhone,
      amount: _amount,
      durationMonths: _durationMonths,
      interestRate: _currentRate,
      estimatedMonthlyPayment: monthlyPayment.round(),
      purpose: _purposeCtrl.text,
      guarantorName: _guarantorCtrl.text,
      attachmentName: _attachedFileName,
      writtenStatement: _writtenStatementCtrl.text,
    );

    _tabController.animateTo(1);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        title: const Row(
          children: [
            Icon(Icons.check_circle_rounded, color: Color(0xFF059669), size: 28),
            SizedBox(width: 10),
            Text('Demande Enregistrée !', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Votre dossier N° ${app.applicationNumber} est transmis au Comité de Crédit.', style: const TextStyle(fontSize: 13)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(12)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Montant : ${CurrencyFormatter.formatXOF(_amount)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  const SizedBox(height: 2),
                  Text('Durée : $_durationMonths mois (${_currentTermCategory})', style: const TextStyle(fontSize: 12)),
                  const SizedBox(height: 2),
                  Text('Méthode : $_calculationMethodLabel', style: const TextStyle(fontSize: 11, color: Color(0xFF2563EB), fontWeight: FontWeight.bold)),
                  const SizedBox(height: 2),
                  Text('Mensualité contractuelle : ${CurrencyFormatter.formatXOF(monthlyPayment)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text('Pièce jointe : $_attachedFileName', style: const TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                  const SizedBox(height: 4),
                  const Text('Accusé de réception et e-mail transmis automatiquement.', style: TextStyle(fontSize: 11, color: Color(0xFF059669), fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F172A), foregroundColor: Colors.white),
            child: const Text('Consulter le Suivi'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final monthlyPayment = _calculateMonthlyPayment();
    final totalInterest = _calculateTotalInterest();
    final income = int.tryParse(_incomeCtrl.text.replaceAll(' ', '')) ?? 1;
    final dsti = (monthlyPayment / (income > 0 ? income : 1)) * 100;

    // Filtrer l'historique des demandes jusqu'à 18 mois
    final cutoffDate = DateTime.now().subtract(Duration(days: _historyMonthsFilter * 30));
    final filteredApps = widget.appState.loanApplications.where((app) => app.submissionDate.isAfter(cutoffDate)).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Demande Officielle de Prêt',
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
            Tab(icon: Icon(Icons.assignment_outlined, size: 20), text: 'Nouvelle Demande'),
            Tab(icon: Icon(Icons.timeline_rounded, size: 20), text: 'Suivi des Demandes (18 mois)'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          
          // =========================================================
          // TAB 1: FORMULAIRE DE DEMANDE OFFICIELLE DE PRÊT
          // =========================================================
          SingleChildScrollView(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                
                // Identité Sociétaire & Prélèvement
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFCBD5E1)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: const Color(0xFF0F172A),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Center(
                          child: Text('MT', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(widget.appState.memberName, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF0F172A))),
                            Row(
                              children: [
                                Text('Matricule Sociétaire : ${widget.appState.memberCode}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF2563EB))),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFD1FAE5),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: const Text('Prélèvement', style: TextStyle(color: Color(0xFF065F46), fontSize: 9, fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // Grille Officielle Rappel Card
                Container(
                  padding: const EdgeInsets.all(14),
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
                          Icon(Icons.rule_folder_outlined, color: Color(0xFF1D4ED8), size: 18),
                          SizedBox(width: 8),
                          Text('Grille des Prêts & Taux d\'intérêt Officiels', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF1E3A8A))),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          _buildGridTag('Court Terme', '0-12 mois', '5%', _durationMonths <= 12),
                          const SizedBox(width: 6),
                          _buildGridTag('Moyen Terme', '13-36 mois', '10%', _durationMonths > 12 && _durationMonths <= 36),
                          const SizedBox(width: 6),
                          _buildGridTag('Long Terme', '37-60 mois', '9% dég.', _durationMonths > 36),
                        ],
                      ),
                      const SizedBox(height: 6),
                      const Text('Plafond de financement sociétaire : jusqu\'à 15 000 000 F CFA', style: TextStyle(fontSize: 10, color: Color(0xFF1E40AF), fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // Échéancier officiel Header Card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('BARÈME & ÉCHÉANCE LÉGALE', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: _calculationMethod == 'LINEAIRE' ? const Color(0xFF2563EB) : const Color(0xFF7C3AED),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              _calculationMethod == 'LINEAIRE' ? 'MODE LINÉAIRE' : 'MODE DÉGRESSIF (CRD)',
                              style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Mensualité contractuelle', style: TextStyle(color: Colors.white70, fontSize: 11)),
                              Text(
                                CurrencyFormatter.formatXOF(monthlyPayment),
                                style: const TextStyle(color: Color(0xFF10B981), fontSize: 22, fontWeight: FontWeight.w900, fontFamily: 'monospace'),
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              const Text('Taux annuel', style: TextStyle(color: Colors.white70, fontSize: 11)),
                              Text('$_currentRate %', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Intérêts totaux : ${CurrencyFormatter.formatXOF(totalInterest)}', style: const TextStyle(color: Colors.white70, fontSize: 11)),
                          Text('Remboursement total : ${CurrencyFormatter.formatXOF(_amount + totalInterest)}', style: const TextStyle(color: Colors.white70, fontSize: 11)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Divider(color: Colors.white24),
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Taux d\'endettement (DSTI) : ${dsti.toStringAsFixed(1)}%', style: const TextStyle(color: Colors.white70, fontSize: 11)),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: dsti <= 33 ? const Color(0xFF059669) : const Color(0xFFE11D48),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              dsti <= 33 ? 'CONFORME (<33%)' : 'ATTENTION (>33%)',
                              style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Paramètres de la demande
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('1. Montant & Durée (Plafond 15 000 000 F)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      const SizedBox(height: 14),
                      
                      // Montant Slider
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Montant sollicité :', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                          Text(CurrencyFormatter.formatXOF(_amount), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Color(0xFF0F172A))),
                        ],
                      ),
                      Slider(
                        value: _amount.toDouble(),
                        min: 100000,
                        max: 15000000,
                        divisions: 149,
                        activeColor: const Color(0xFF0F172A),
                        onChanged: (v) => setState(() => _amount = (v / 50000).round() * 50000),
                      ),

                      // Calendrier de Remboursement Card
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Row(
                                  children: [
                                    Icon(Icons.calendar_month_rounded, size: 18, color: Color(0xFF2563EB)),
                                    SizedBox(width: 6),
                                    Text('Calendrier d\'Échéance', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF0F172A))),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFDBEAFE),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    '$_durationMonths mois calculés',
                                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF1E40AF), fontFamily: 'monospace'),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),

                            // Deux sélecteurs de date (Début et Fin)
                            Row(
                              children: [
                                // Date de Début
                                Expanded(
                                  child: InkWell(
                                    onTap: () async {
                                      final picked = await showDatePicker(
                                        context: context,
                                        initialDate: _startDate,
                                        firstDate: DateTime.now().subtract(const Duration(days: 30)),
                                        lastDate: DateTime.now().add(const Duration(days: 365 * 10)),
                                      );
                                      if (picked != null) _handleStartDatePicked(picked);
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(color: const Color(0xFFCBD5E1)),
                                      ),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('Date de début (1er Prélèvement)', style: TextStyle(fontSize: 9, color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
                                          const SizedBox(height: 4),
                                          Row(
                                            children: [
                                              const Icon(Icons.event_available_rounded, size: 14, color: Color(0xFF0F172A)),
                                              const SizedBox(width: 6),
                                              Text(
                                                DateFormatter.formatDate(_startDate),
                                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF0F172A)),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),

                                // Date de Fin
                                Expanded(
                                  child: InkWell(
                                    onTap: () async {
                                      final picked = await showDatePicker(
                                        context: context,
                                        initialDate: _endDate,
                                        firstDate: _startDate.add(const Duration(days: 15)),
                                        lastDate: _startDate.add(const Duration(days: 365 * 6)),
                                      );
                                      if (picked != null) _handleEndDatePicked(picked);
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(color: const Color(0xFFCBD5E1)),
                                      ),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('Date de fin (Dernière Échéance)', style: TextStyle(fontSize: 9, color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
                                          const SizedBox(height: 4),
                                          Row(
                                            children: [
                                              const Icon(Icons.event_busy_rounded, size: 14, color: Color(0xFF2563EB)),
                                              const SizedBox(width: 6),
                                              Text(
                                                DateFormatter.formatDate(_endDate),
                                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF2563EB)),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),

                            // Paliers rapides
                            SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: Row(
                                children: [6, 12, 18, 24, 36, 48, 60].map((m) {
                                  final isSelected = _durationMonths == m;
                                  return Padding(
                                    padding: const EdgeInsets.only(right: 6),
                                    child: InkWell(
                                      onTap: () => _handleQuickDuration(m),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: isSelected ? const Color(0xFF0F172A) : Colors.white,
                                          borderRadius: BorderRadius.circular(8),
                                          border: Border.all(color: isSelected ? const Color(0xFF0F172A) : const Color(0xFFCBD5E1)),
                                        ),
                                        child: Text(
                                          '$m mois',
                                          style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            color: isSelected ? Colors.white : const Color(0xFF475569),
                                          ),
                                        ),
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                            ),
                            const SizedBox(height: 6),

                            // Slider de précision
                            Slider(
                              value: _durationMonths.toDouble().clamp(1.0, 60.0),
                              min: 1,
                              max: 60,
                              divisions: 59,
                              activeColor: const Color(0xFF2563EB),
                              onChanged: (v) => _handleQuickDuration(v.toInt()),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      const Text('2. Objet du Prêt & Revenus', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _purposeCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Objet précis du financement',
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _incomeCtrl,
                        keyboardType: TextInputType.number,
                        onChanged: (_) => setState(() {}),
                        decoration: const InputDecoration(
                          labelText: 'Revenu mensuel net moyen (XOF)',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.account_balance_wallet_outlined),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Section Pièce Jointe & Écrit Formel
                      const Text('3. Pièce Jointe & Écrit Formel du Sociétaire', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      const SizedBox(height: 6),
                      const Text(
                        'Rédigez votre demande ou joignez votre note explicative / justificatif de devis.',
                        style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                      ),
                      const SizedBox(height: 10),
                      TextField(
                        controller: _writtenStatementCtrl,
                        maxLines: 3,
                        decoration: const InputDecoration(
                          labelText: 'Écrit formel / Motivation de la demande',
                          border: OutlineInputBorder(),
                          alignLabelWithHint: true,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFCBD5E1)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.attach_file_rounded, color: Color(0xFF0F172A), size: 20),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Pièce jointe officielle (PDF / Image) :', style: TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                                  Text(_attachedFileName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF0F172A))),
                                ],
                              ),
                            ),
                            TextButton.icon(
                              onPressed: () {
                                setState(() {
                                  _attachedFileName = _attachedFileName.contains('signee')
                                      ? 'justificatif_devis_proforma.pdf'
                                      : 'demande_manuscrite_signee.pdf';
                                });
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Fichier joint mis à jour : $_attachedFileName')),
                                );
                              },
                              icon: const Icon(Icons.refresh_rounded, size: 14),
                              label: const Text('Changer', style: TextStyle(fontSize: 11)),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      const Text('4. Garanties & Caution', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      const SizedBox(height: 10),
                      DropdownButtonFormField<String>(
                        value: _collateralType,
                        decoration: const InputDecoration(labelText: 'Type de garantie', border: OutlineInputBorder()),
                        items: const [
                          DropdownMenuItem(value: 'PRELEVEMENT_PAIE', child: Text('Prélèvement sur salaire')),
                          DropdownMenuItem(value: 'NANTISSEMENT_EPARGNE', child: Text('Nantissement sur Livret Épargne')),
                          DropdownMenuItem(value: 'CAUTION_SOLIDAIRE', child: Text('Caution Solidaire Sociétaire')),
                          DropdownMenuItem(value: 'GAGE', child: Text('Gage sur matériel ou véhicule')),
                        ],
                        onChanged: (v) => setState(() => _collateralType = v!),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _guarantorCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Nom, contact et matricule du garant / caution',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.person_pin_outlined),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                ElevatedButton.icon(
                  onPressed: _handleSubmit,
                  icon: const Icon(Icons.send_rounded),
                  label: const Text('Soumettre ma Demande de Prêt', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F172A),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),

          // =========================================================
          // TAB 2: SUIVI DES DEMANDES (HISTORIQUE JUSQU'À 18 MOIS)
          // =========================================================
          SingleChildScrollView(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                
                // Filtre Temporel (jusqu'à 18 mois)
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.history_toggle_off_rounded, color: Color(0xFF0F172A), size: 20),
                          SizedBox(width: 8),
                          Text('Période de suivi :', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                        ],
                      ),
                      DropdownButton<int>(
                        value: _historyMonthsFilter,
                        underline: const SizedBox(),
                        items: const [
                          DropdownMenuItem(value: 3, child: Text('3 derniers mois', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold))),
                          DropdownMenuItem(value: 6, child: Text('6 derniers mois', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold))),
                          DropdownMenuItem(value: 12, child: Text('12 derniers mois', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold))),
                          DropdownMenuItem(value: 18, child: Text('18 mois (Historique complet)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF2563EB)))),
                        ],
                        onChanged: (v) => setState(() => _historyMonthsFilter = v!),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                if (filteredApps.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(30),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
                    child: const Column(
                      children: [
                        Icon(Icons.folder_open_rounded, size: 48, color: Color(0xFF94A3B8)),
                        SizedBox(height: 10),
                        Text('Aucune demande enregistrée sur cette période.', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                      ],
                    ),
                  )
                else
                  ...filteredApps.map((app) {
                    return Container(
                      margin: const EdgeInsets.only(bottom: 16),
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
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(app.applicationNumber, style: const TextStyle(fontWeight: FontWeight.w900, fontFamily: 'monospace', fontSize: 13, color: Color(0xFF2563EB))),
                                  Text(app.productName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F172A))),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: app.currentStep == 'ACCORDE'
                                      ? const Color(0xFFD1FAE5)
                                      : (app.currentStep == 'REJETE' ? const Color(0xFFFEE2E2) : const Color(0xFFFEF3C7)),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  app.currentStep,
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: app.currentStep == 'ACCORDE'
                                        ? const Color(0xFF065F46)
                                        : (app.currentStep == 'REJETE' ? const Color(0xFF991B1B) : const Color(0xFF92400E)),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Montant : ${CurrencyFormatter.formatXOF(app.requestedAmountXof)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              Text('Durée : ${app.durationMonths} mois (${app.termCategory})', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Taux : ${app.interestRate}% (${app.calculationMethod})', style: const TextStyle(fontSize: 11, color: Color(0xFF2563EB), fontWeight: FontWeight.bold)),
                              Text('Mensualité : ${CurrencyFormatter.formatXOF(app.estimatedMonthlyPaymentXof)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                            ],
                          ),
                          if (app.attachmentName != null) ...[
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                const Icon(Icons.attach_file, size: 14, color: Color(0xFF64748B)),
                                const SizedBox(width: 4),
                                Text('Pièce jointe : ${app.attachmentName}', style: const TextStyle(fontSize: 10, color: Color(0xFF64748B), fontStyle: FontStyle.italic)),
                              ],
                            ),
                          ],
                          const SizedBox(height: 12),
                          const Divider(color: Color(0xFFF1F5F9)),
                          const SizedBox(height: 6),
                          const Text('Timeline d\'instruction :', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF475569))),
                          const SizedBox(height: 6),
                          ...app.statusTimeline.map((step) => Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Row(
                              children: [
                                const Icon(Icons.check_circle_outline_rounded, size: 14, color: Color(0xFF059669)),
                                const SizedBox(width: 6),
                                Expanded(child: Text(step, style: const TextStyle(fontSize: 10, color: Color(0xFF334155)))),
                              ],
                            ),
                          )),
                        ],
                      ),
                    );
                  }),
              ],
            ),
          ),

        ],
      ),
    );
  }

  Widget _buildGridTag(String title, String duration, String rate, bool isCurrent) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
        decoration: BoxDecoration(
          color: isCurrent ? const Color(0xFF1D4ED8) : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: isCurrent ? const Color(0xFF1E40AF) : const Color(0xFFCBD5E1)),
        ),
        child: Column(
          children: [
            Text(title, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: isCurrent ? Colors.white : const Color(0xFF64748B))),
            const SizedBox(height: 2),
            Text(duration, style: TextStyle(fontSize: 9, color: isCurrent ? Colors.white70 : const Color(0xFF475569))),
            const SizedBox(height: 2),
            Text(rate, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: isCurrent ? Colors.white : const Color(0xFF0F172A))),
          ],
        ),
      ),
    );
  }
}
