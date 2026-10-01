import 'package:flutter/material.dart';
import '../../../../core/database/coop_database_service.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/utils/currency_formatter.dart';
import '../../../../core/utils/date_formatter.dart';
import 'online_loan_application_screen.dart';

class LoanTrackingScreen extends StatefulWidget {
  final CoopAppState appState;

  const LoanTrackingScreen({super.key, required this.appState});

  @override
  State<LoanTrackingScreen> createState() => _LoanTrackingScreenState();
}

class _LoanTrackingScreenState extends State<LoanTrackingScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _showAmortizationModal(ActiveLoan loan) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.8,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.all(20),
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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Échéancier & Tableau d\'Amortissement', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    Text('${loan.loanNumber} • Taux ${loan.interestRate}% l\'an', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                  ],
                ),
                IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(Icons.close)),
              ],
            ),
            const SizedBox(height: 14),
            const Divider(height: 1),
            const SizedBox(height: 10),

            Expanded(
              child: ListView.separated(
                itemCount: loan.installments.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (ctx, i) {
                  final inst = loan.installments[i];
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    child: Row(
                      children: [
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: inst.isPaid ? const Color(0xFFD1FAE5) : const Color(0xFFFEF3C7),
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              '${inst.number}',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: inst.isPaid ? const Color(0xFF047857) : const Color(0xFFB45309),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Échéance du ${DateFormatter.formatDate(inst.dueDate)}',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                              Text(
                                'Capital : ${CurrencyFormatter.formatXOF(inst.principalXof)} • Intérêts : ${CurrencyFormatter.formatXOF(inst.interestXof)}',
                                style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                              ),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              CurrencyFormatter.formatXOF(inst.totalDueXof),
                              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF0F172A)),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: inst.isPaid ? const Color(0xFFD1FAE5) : const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                inst.isPaid ? 'RÉGLÉ' : 'À ÉCHOIR',
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  color: inst.isPaid ? const Color(0xFF047857) : const Color(0xFF2563EB),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
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
          'États des Prêts & Dettes',
          style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w900, fontSize: 18),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFF0F172A),
          indicatorColor: const Color(0xFF0F172A),
          tabs: const [
            Tab(text: 'Prêts en Cours & Dette'),
            Tab(text: 'Suivi de Demandes'),
          ],
        ),
      ),
      body: ListenableBuilder(
        listenable: state,
        builder: (context, _) {
          return TabBarView(
            controller: _tabController,
            children: [
              // TAB 1: Prêts en cours & Dette totale
              SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Dette Totale Card
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF7F1D1D), Color(0xFF991B1B), Color(0xFFB91C1C)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(22),
                        boxShadow: [
                          BoxShadow(color: Colors.red.shade900.withValues(alpha: 0.25), blurRadius: 12, offset: const Offset(0, 6)),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.shield_outlined, color: Colors.white70, size: 18),
                                  SizedBox(width: 6),
                                  Text('ENCOURS TOTAL DE LA DETTE', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(8)),
                                child: const Text('BCEAO REGULATED', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Text(
                            CurrencyFormatter.formatXOF(state.totalDebtBalance),
                            style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900, fontFamily: 'monospace'),
                          ),
                          const SizedBox(height: 12),
                          const Divider(color: Colors.white24),
                          const SizedBox(height: 6),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Prochaine Mensualité', style: TextStyle(color: Colors.white60, fontSize: 10)),
                                  Text(
                                    CurrencyFormatter.formatXOF(state.nextInstallmentAmount),
                                    style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  const Text('Date Limite', style: TextStyle(color: Colors.white60, fontSize: 10)),
                                  Text(
                                    state.nextInstallmentDate != null ? DateFormatter.formatDate(state.nextInstallmentDate!) : 'Aucune',
                                    style: const TextStyle(color: Color(0xFFFDE047), fontSize: 13, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'VOS DOSSIERS DE CRÉDIT ACTIFS',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF64748B), letterSpacing: 0.8),
                        ),
                        TextButton.icon(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => OnlineLoanApplicationScreen(appState: state)),
                            );
                          },
                          icon: const Icon(Icons.add_circle_outline, size: 16),
                          label: const Text('Nouvelle demande', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Active Loans List
                    state.activeLoans.isEmpty
                        ? Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18)),
                            child: const Center(child: Text('Aucun crédit en cours.', style: TextStyle(color: Color(0xFF64748B)))),
                          )
                        : ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: state.activeLoans.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (ctx, i) {
                              final loan = state.activeLoans[i];
                              final progress = loan.paidAmountXof / (loan.initialAmountXof > 0 ? loan.initialAmountXof : 1);

                              return Container(
                                padding: const EdgeInsets.all(18),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(color: const Color(0xFFE2E8F0)),
                                  boxShadow: [
                                    BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 6),
                                  ],
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(loan.productName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F172A))),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(color: const Color(0xFFD1FAE5), borderRadius: BorderRadius.circular(6)),
                                          child: Text(loan.status, style: const TextStyle(color: Color(0xFF047857), fontWeight: FontWeight.bold, fontSize: 10)),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text('N° Contrat : ${loan.loanNumber} • Décaissé le ${DateFormatter.formatDate(loan.disbursementDate)}', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                                    const SizedBox(height: 14),

                                    // Progression remboursement
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text('Remboursé : ${CurrencyFormatter.formatXOF(loan.paidAmountXof)}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF059669))),
                                        Text('Restant : ${CurrencyFormatter.formatXOF(loan.remainingPrincipalXof)}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFE11D48))),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    LinearProgressIndicator(
                                      value: progress.clamp(0.0, 1.0),
                                      backgroundColor: const Color(0xFFF1F5F9),
                                      color: const Color(0xFF059669),
                                      minHeight: 8,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    const SizedBox(height: 14),

                                    Row(
                                      children: [
                                        Expanded(
                                          child: OutlinedButton.icon(
                                            onPressed: () => _showAmortizationModal(loan),
                                            icon: const Icon(Icons.table_chart_outlined, size: 16),
                                            label: const Text('Tableau d\'Amortissement', style: TextStyle(fontSize: 12)),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                  ],
                ),
              ),

              // TAB 2: Suivi des Demandes en ligne
              state.loanApplications.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.history_edu_rounded, size: 60, color: Color(0xFF94A3B8)),
                          const SizedBox(height: 12),
                          const Text('Aucune demande de prêt enregistrée.', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => OnlineLoanApplicationScreen(appState: state)),
                              );
                            },
                            icon: const Icon(Icons.add),
                            label: const Text('Déposer une demande en ligne'),
                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F172A), foregroundColor: Colors.white),
                          ),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: state.loanApplications.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 14),
                      itemBuilder: (ctx, i) {
                        final app = state.loanApplications[i];

                        return Container(
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 6)],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.folder_shared_outlined, color: Color(0xFF2563EB)),
                                      const SizedBox(width: 8),
                                      Text(app.applicationNumber, style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'monospace', fontSize: 13)),
                                    ],
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(6)),
                                    child: Text(app.currentStep, style: const TextStyle(color: Color(0xFF2563EB), fontWeight: FontWeight.bold, fontSize: 10)),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Text(app.productName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                              const SizedBox(height: 4),
                              Text(app.purpose, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                              const SizedBox(height: 10),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('Montant demandé', style: TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                                      Text(CurrencyFormatter.formatXOF(app.requestedAmountXof), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF0F172A))),
                                    ],
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('Durée & Mensualité', style: TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                                      Text('${app.durationMonths} mois • ${CurrencyFormatter.formatXOF(app.estimatedMonthlyPaymentXof)}/m', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                    ],
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              const Divider(height: 1),
                              const SizedBox(height: 10),

                              // Timeline des étapes
                              const Text('PROGRESSION DU DOSSIER :', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
                              const SizedBox(height: 8),
                              ...app.statusTimeline.map(
                                (step) => Padding(
                                  padding: const EdgeInsets.only(bottom: 6),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.check_circle_rounded, size: 16, color: Color(0xFF059669)),
                                      const SizedBox(width: 8),
                                      Expanded(child: Text(step, style: const TextStyle(fontSize: 11, color: Color(0xFF334155)))),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ],
          );
        },
      ),
    );
  }
}
