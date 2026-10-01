import 'package:flutter/material.dart';
import '../../../../core/services/pdf_statement_service.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/utils/currency_formatter.dart';
import '../../../../core/utils/date_formatter.dart';

class AccountStatementScreen extends StatefulWidget {
  final CoopAppState appState;

  const AccountStatementScreen({super.key, required this.appState});

  @override
  State<AccountStatementScreen> createState() => _AccountStatementScreenState();
}

class _AccountStatementScreenState extends State<AccountStatementScreen> {
  String _selectedPeriod = '30_days';
  String _selectedFilter = 'all'; // 'all', 'credit', 'debit'
  bool _isGeneratingPdf = false;

  Future<void> _handleDownloadPdf() async {
    setState(() => _isGeneratingPdf = true);
    try {
      await PdfStatementService.downloadStatementPdf(widget.appState);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Relevé officiel certifié généré avec succès !'),
            backgroundColor: Color(0xFF059669),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur lors de la génération du PDF : $e'),
            backgroundColor: const Color(0xFFE11D48),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isGeneratingPdf = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = widget.appState;

    final filteredTransactions = state.transactions.where((tx) {
      if (_selectedFilter == 'credit') return tx.isCredit;
      if (_selectedFilter == 'debit') return !tx.isCredit;
      return true;
    }).toList();

    int totalCredits = 0;
    int totalDebits = 0;
    for (var tx in state.transactions) {
      if (tx.isCredit) {
        totalCredits += tx.amountXof;
      } else {
        totalDebits += tx.amountXof;
      }
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Relevé de Compte',
          style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w900, fontSize: 20),
        ),
        actions: [
          IconButton(
            icon: _isGeneratingPdf
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF2563EB)),
                  )
                : const Icon(Icons.picture_as_pdf_rounded, color: Color(0xFF2563EB)),
            tooltip: 'Télécharger le relevé officiel (PDF)',
            onPressed: _isGeneratingPdf ? null : _handleDownloadPdf,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter & Period Selector Header
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Période :', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    DropdownButton<String>(
                      value: _selectedPeriod,
                      underline: const SizedBox(),
                      items: const [
                        DropdownMenuItem(value: '30_days', child: Text('30 derniers jours')),
                        DropdownMenuItem(value: '90_days', child: Text('3 derniers mois')),
                        DropdownMenuItem(value: 'this_year', child: Text('Année 2026')),
                      ],
                      onChanged: (v) => setState(() => _selectedPeriod = v!),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _buildFilterChip('Toutes les opérations', 'all'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Crédits (+)', 'credit'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Débits (-)', 'debit'),
                  ],
                ),
              ],
            ),
          ),

          // Total Summary Strip
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            color: const Color(0xFFF1F5F9),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Total Entrées', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                    Text(
                      '+ ${CurrencyFormatter.formatXOF(totalCredits)}',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF059669)),
                    ),
                  ],
                ),
                Container(width: 1, height: 28, color: const Color(0xFFCBD5E1)),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text('Total Sorties', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                    Text(
                      '- ${CurrencyFormatter.formatXOF(totalDebits)}',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFFE11D48)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Action Banner for Official PDF Download
          Container(
            margin: const EdgeInsets.fromLTRB(16, 12, 16, 6),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2563EB).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.picture_as_pdf_rounded, color: Color(0xFF2563EB), size: 24),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Relevé Officiel Certifié',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A)),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Format A4 UMOA-SFD avec Sceau',
                        style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: _isGeneratingPdf ? null : _handleDownloadPdf,
                  icon: _isGeneratingPdf
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.download_rounded, size: 16),
                  label: Text(_isGeneratingPdf ? 'Génération...' : 'Télécharger'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],
            ),
          ),

          // Transaction list
          Expanded(
            child: filteredTransactions.isEmpty
                ? const Center(
                    child: Text('Aucune transaction trouvée pour ces critères.', style: TextStyle(color: Color(0xFF64748B))),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredTransactions.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (ctx, i) {
                      final tx = filteredTransactions[i];
                      return Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: tx.isCredit
                                    ? const Color(0xFF059669).withValues(alpha: 0.1)
                                    : const Color(0xFFE11D48).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                tx.isCredit ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
                                color: tx.isCredit ? const Color(0xFF059669) : const Color(0xFFE11D48),
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    tx.title,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A)),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    tx.subtitle,
                                    style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    DateFormatter.formatDateTime(tx.date),
                                    style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '${tx.isCredit ? '+' : '-'} ${CurrencyFormatter.formatXOF(tx.amountXof)}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 13,
                                    color: tx.isCredit ? const Color(0xFF059669) : const Color(0xFFE11D48),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    tx.status,
                                    style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF475569)),
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
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _selectedFilter == value;
    return InkWell(
      onTap: () => setState(() => _selectedFilter = value),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.white : const Color(0xFF64748B),
          ),
        ),
      ),
    );
  }
}
