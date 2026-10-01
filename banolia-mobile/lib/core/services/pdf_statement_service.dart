import 'dart:typed_data';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../state/app_state.dart';
import '../utils/currency_formatter.dart';

/// Service officiel de génération et téléchargement du Relevé de Compte en PDF
class PdfStatementService {
  PdfStatementService._();

  /// Générer et ouvrir la boîte de dialogue de téléchargement / partage / impression sur le téléphone
  static Future<void> downloadStatementPdf(CoopAppState state) async {
    final pdfBytes = await generateStatementBytes(state);
    final filename = 'Releve_Compte_${state.memberCode}_${DateFormat('yyyyMMdd').format(DateTime.now())}.pdf';

    await Printing.sharePdf(
      bytes: pdfBytes,
      filename: filename,
      subject: 'Relevé de Compte Officiel - ${state.memberName} (${state.memberCode})',
    );
  }

  /// Génération du document PDF en mémoire avec logo et en-tête réglementaire
  static Future<Uint8List> generateStatementBytes(CoopAppState state) async {
    final pdf = pw.Document();

    final now = DateTime.now();
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm');
    final shortDateFormat = DateFormat('dd/MM/yyyy');

    // Calculs financiers
    int totalCredits = 0;
    int totalDebits = 0;
    for (final tx in state.transactions) {
      if (tx.isCredit) {
        totalCredits += tx.amountXof;
      } else {
        totalDebits += tx.amountXof;
      }
    }

    final netBalance = state.savingsAccountBalance;
    final blockedAmt = state.blockedSavingsAmount;
    final liquidDispo = state.availableLiquidSavings;

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.symmetric(horizontal: 28, vertical: 24),
        build: (pw.Context context) {
          return [
            // 1. En-tête Institutionnel Prédéfini de la Coopérative
            pw.Container(
              padding: const pw.EdgeInsets.only(bottom: 12),
              decoration: const pw.BoxDecoration(
                border: pw.Border(bottom: pw.BorderSide(color: PdfColors.blueGrey800, width: 2)),
              ),
              child: pw.Row(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  // Logo et Identité Coopérative
                  pw.Row(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      // Blason / Sceau Officiel de la Coopérative
                      pw.Container(
                        width: 54,
                        height: 54,
                        decoration: pw.BoxDecoration(
                          color: PdfColor.fromInt(0xFF0F172A),
                          borderRadius: pw.BorderRadius.circular(10),
                        ),
                        child: pw.Center(
                          child: pw.Text(
                            'COOPEC',
                            style: pw.TextStyle(
                              color: PdfColors.white,
                              fontSize: 10,
                              fontWeight: pw.FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      pw.SizedBox(width: 12),
                      pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Text(
                            'COOPECTAT',
                            style: pw.TextStyle(
                              fontSize: 16,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColor.fromInt(0xFF0F172A),
                            ),
                          ),
                          pw.Text(
                            "Coopérative d'Épargne et de Crédits des Travailleurs",
                            style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey700),
                          ),
                          pw.Text(
                            'Institution de Microfinance - Agrément SFD N° T/1/G/2009/042',
                            style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, color: PdfColors.blue800),
                          ),
                          pw.Text(
                            'Réglementation BCEAO / Commission Bancaire de l\'UMOA',
                            style: const pw.TextStyle(fontSize: 7.5, color: PdfColors.grey600),
                          ),
                          pw.Text(
                            'Siège Social : BP 10151 Totsi, Lomé (Togo) | Tél : +228 22 26 21 01',
                            style: const pw.TextStyle(fontSize: 7.5, color: PdfColors.grey600),
                          ),
                        ],
                      ),
                    ],
                  ),

                  // Titre du Document & Date d'émission
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Container(
                        padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: pw.BoxDecoration(
                          color: PdfColor.fromInt(0xFF059669),
                          borderRadius: pw.BorderRadius.circular(6),
                        ),
                        child: pw.Text(
                          'DOCUMENT OFFICIEL CERTIFIÉ',
                          style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, color: PdfColors.white),
                        ),
                      ),
                      pw.SizedBox(height: 4),
                      pw.Text(
                        'RELEVÉ DE COMPTE',
                        style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold, color: PdfColor.fromInt(0xFF0F172A)),
                      ),
                      pw.Text(
                        'Édité le ${dateFormat.format(now)}',
                        style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey700),
                      ),
                      pw.Text(
                        'Agence : ${state.memberAgency}',
                        style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey700),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            pw.SizedBox(height: 14),

            // 2. Fiche d'Identification du Sociétaire
            pw.Container(
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(
                color: PdfColor.fromInt(0xFFF8FAFC),
                borderRadius: pw.BorderRadius.circular(8),
                border: pw.Border.all(color: PdfColors.grey300),
              ),
              child: pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text('IDENTIFICATION DU SOCIÉTAIRE', style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, color: PdfColors.grey700)),
                      pw.SizedBox(height: 2),
                      pw.Text(state.memberName.toUpperCase(), style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold, color: PdfColor.fromInt(0xFF0F172A))),
                      pw.Text('Matricule / Identifiant : ${state.memberCode}', style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey800)),
                      pw.Text('Téléphone : ${state.memberPhone}', style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey800)),
                    ],
                  ),
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Text('COORDONNÉES DU COMPTE', style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, color: PdfColors.grey700)),
                      pw.SizedBox(height: 2),
                      pw.Text('N° Compte Épargne : 25121100${state.memberCode}01', style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold, color: PdfColors.blue900)),
                      pw.Text('Produit : Livret Épargne Ordinaire (SYSCOA 251211)', style: const pw.TextStyle(fontSize: 8.5, color: PdfColors.grey800)),
                      pw.Text('Parts Sociales : ${state.shareCapitalBalance} F CFA', style: const pw.TextStyle(fontSize: 8.5, color: PdfColors.grey800)),
                    ],
                  ),
                ],
              ),
            ),
            pw.SizedBox(height: 14),

            // 3. Cadre Récapitulatif Financier (Soldes & Réserve Bloquée)
            pw.Container(
              padding: const pw.EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: pw.BoxDecoration(
                color: PdfColor.fromInt(0xFFF1F5F9),
                borderRadius: pw.BorderRadius.circular(8),
                border: pw.Border.all(color: PdfColors.blueGrey200),
              ),
              child: pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceAround,
                children: [
                  _buildKpiPdf('Total Versements (+)', '+${CurrencyFormatter.formatXOF(totalCredits)}', PdfColor.fromInt(0xFF059669)),
                  _buildKpiPdf('Total Retraits (-)', '-${CurrencyFormatter.formatXOF(totalDebits)}', PdfColor.fromInt(0xFFDC2626)),
                  _buildKpiPdf('Solde Net Total', CurrencyFormatter.formatXOF(netBalance), PdfColor.fromInt(0xFF0F172A)),
                  _buildKpiPdf('Part Bloquée (${state.blockedSavingsPercentage.toStringAsFixed(0)}%)', CurrencyFormatter.formatXOF(blockedAmt), PdfColor.fromInt(0xFFD97706)),
                  _buildKpiPdf('Disponible Liquide', CurrencyFormatter.formatXOF(liquidDispo), PdfColor.fromInt(0xFF2563EB)),
                ],
              ),
            ),
            pw.SizedBox(height: 16),

            // 4. Titre de la Section Écritures
            pw.Text(
              'HISTORIQUE DÉTAILLÉ DES ÉCRITURES COMPTABLES',
              style: pw.TextStyle(fontSize: 9.5, fontWeight: pw.FontWeight.bold, color: PdfColor.fromInt(0xFF0F172A)),
            ),
            pw.SizedBox(height: 6),

            // 5. Tableau des Opérations SYSCOA-SFD
            pw.Table(
              border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
              columnWidths: {
                0: const pw.FixedColumnWidth(65),
                1: const pw.FixedColumnWidth(80),
                2: const pw.FlexColumnWidth(2.5),
                3: const pw.FixedColumnWidth(85),
                4: const pw.FixedColumnWidth(85),
              },
              children: [
                // En-tête de table
                pw.TableRow(
                  decoration: const pw.BoxDecoration(color: PdfColor.fromInt(0xFFE2E8F0)),
                  children: [
                    _buildCellHeader('Date'),
                    _buildCellHeader('Référence'),
                    _buildCellHeader('Libellé de l\'opération'),
                    _buildCellHeader('Débit (F CFA)', alignRight: true),
                    _buildCellHeader('Crédit (F CFA)', alignRight: true),
                  ],
                ),
                // Lignes de transactions
                if (state.transactions.isEmpty)
                  pw.TableRow(
                    children: [
                      pw.Container(
                        padding: const pw.EdgeInsets.all(12),
                        child: pw.Text('Aucune écriture enregistrée sur la période.', style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey600)),
                      ),
                      pw.Container(), pw.Container(), pw.Container(), pw.Container(),
                    ],
                  )
                else
                  ...state.transactions.map((tx) {
                    return pw.TableRow(
                      decoration: pw.BoxDecoration(
                        color: tx.isCredit ? PdfColor.fromInt(0xFFFFFFFF) : PdfColor.fromInt(0xFFFAFAFA),
                      ),
                      children: [
                        _buildCellText(shortDateFormat.format(tx.date)),
                        _buildCellText(tx.reference, isMono: true),
                        _buildCellText('${tx.title}\n${tx.subtitle}', isSmall: true),
                        _buildCellText(tx.isCredit ? '-' : CurrencyFormatter.formatXOF(tx.amountXof), alignRight: true, color: tx.isCredit ? PdfColors.grey500 : PdfColor.fromInt(0xFFDC2626)),
                        _buildCellText(tx.isCredit ? CurrencyFormatter.formatXOF(tx.amountXof) : '-', alignRight: true, color: tx.isCredit ? PdfColor.fromInt(0xFF059669) : PdfColors.grey500),
                      ],
                    );
                  }),
              ],
            ),
            pw.SizedBox(height: 24),

            // 6. Cadre Tampon & Certifications
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              crossAxisAlignment: pw.CrossAxisAlignment.end,
              children: [
                // Mentions de conformité
                pw.Expanded(
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'Avis important :',
                        style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, color: PdfColors.grey800),
                      ),
                      pw.Text(
                        'Toute réclamation concernant le présent extrait doit être adressée par écrit à la Direction de la COOPEC dans un délai légal de 30 jours à compter de sa date d\'émission. Les soldes sont certifiés conformes au Grand Livre SYSCOA-SFD.',
                        style: const pw.TextStyle(fontSize: 7, color: PdfColors.grey600, height: 1.3),
                      ),
                      pw.SizedBox(height: 6),
                      pw.Text(
                        'Document horodaté et sécurisé électroniquement par le Core Banking Bancaire.',
                        style: const pw.TextStyle(fontSize: 7, color: PdfColors.grey600),
                      ),
                    ],
                  ),
                ),
                pw.SizedBox(width: 20),

                // Visa / Tampon officiel
                pw.Container(
                  width: 140,
                  height: 70,
                  padding: const pw.EdgeInsets.all(6),
                  decoration: pw.BoxDecoration(
                    border: pw.Border.all(color: PdfColors.blue800, width: 1.5),
                    borderRadius: pw.BorderRadius.circular(6),
                  ),
                  child: pw.Column(
                    mainAxisAlignment: pw.MainAxisAlignment.center,
                    children: [
                      pw.Text('COOPECTAT - SFD', style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, color: PdfColors.blue800)),
                      pw.Text('VISA ÉLECTRONIQUE', style: pw.TextStyle(fontSize: 7, fontWeight: pw.FontWeight.bold, color: PdfColors.green800)),
                      pw.Text('SERVICE DES OPÉRATIONS', style: const pw.TextStyle(fontSize: 6.5, color: PdfColors.blue800)),
                      pw.Text(shortDateFormat.format(now), style: const pw.TextStyle(fontSize: 7, color: PdfColors.grey700)),
                    ],
                  ),
                ),
              ],
            ),
          ];
        },
      ),
    );

    return pdf.save();
  }

  static pw.Widget _buildKpiPdf(String label, String value, PdfColor color) {
    return pw.Column(
      children: [
        pw.Text(label, style: const pw.TextStyle(fontSize: 7.5, color: PdfColors.grey700)),
        pw.SizedBox(height: 2),
        pw.Text(value, style: pw.TextStyle(fontSize: 9.5, fontWeight: pw.FontWeight.bold, color: color)),
      ],
    );
  }

  static pw.Widget _buildCellHeader(String text, {bool alignRight = false}) {
    return pw.Container(
      padding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 5),
      alignment: alignRight ? pw.Alignment.centerRight : pw.Alignment.centerLeft,
      child: pw.Text(
        text,
        style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, color: PdfColor.fromInt(0xFF1E293B)),
      ),
    );
  }

  static pw.Widget _buildCellText(String text, {bool alignRight = false, bool isMono = false, bool isSmall = false, PdfColor? color}) {
    return pw.Container(
      padding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 5),
      alignment: alignRight ? pw.Alignment.centerRight : pw.Alignment.centerLeft,
      child: pw.Text(
        text,
        style: pw.TextStyle(
          fontSize: isSmall ? 7.5 : 8.5,
          color: color ?? PdfColor.fromInt(0xFF1E293B),
        ),
      ),
    );
  }
}
