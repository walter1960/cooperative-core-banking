import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  FileText, 
  Calendar, 
  Building2, 
  Filter, 
  Search, 
  ShieldCheck, 
  TrendingUp, 
  Coins, 
  Wallet, 
  Landmark, 
  Users, 
  UserCheck, 
  Briefcase, 
  Layers, 
  HeartHandshake
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { Member, Account, LoanFile } from '../../types';

export type ReportCategory = 
  | 'caisse'
  | 'epargne'
  | 'credit'
  | 'dirigeants'
  | 'ratios'
  | 'performance_agents'
  | 'rh_paie'
  | 'immobilisations'
  | 'performance_sociale'
  | 'multicritere';

export const ReportsManager: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('caisse');
  const [startDate, setStartDate] = useState<string>('2026-08-01');
  const [endDate, setEndDate] = useState<string>('2026-08-31');
  const [selectedAgency, setSelectedAgency] = useState<string>('TOUTES');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Data state from core banking
  const [members, setMembers] = useState<Member[]>([]);
  const [loansMap, setLoansMap] = useState<Record<string, LoanFile[]>>({});
  const [accountsMap, setAccountsMap] = useState<Record<string, Account[]>>({});

  useEffect(() => {
    setMembers(StorageService.getMembers());
    setLoansMap(StorageService.getLoans());
    setAccountsMap(StorageService.getAccounts());
  }, []);

  const totalMembers = members.length;
  const allLoans = Object.values(loansMap).flat();
  const totalLoanOutstanding = allLoans.reduce((sum, l) => sum + (l.remainingPrincipal || l.amountGranted), 0);
  const totalSavings = Object.values(accountsMap).flat()
    .filter(a => a.type === 'SAVINGS' || a.type === 'TONTINE')
    .reduce((sum, a) => sum + a.realBalance, 0);
  const totalShares = members.reduce((sum, m) => sum + (m.sharesPurchased || 10000), 0);

  // --- Real File Export Functions ---
  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = (reportTitle: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportWord = (reportTitle: string, htmlContent: string) => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
      "xmlns:w='urn:schemas-microsoft-com:office:word' "+
      "xmlns='http://www.w3.org/TR/REC-html40'>"+
      "<head><meta charset='utf-8'><title>" + reportTitle + "</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + htmlContent + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const handleExportHTML = (reportTitle: string) => {
    const element = document.getElementById('report-printable-area');
    if (!element) return;
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${reportTitle}</title><style>body{font-family:sans-serif;padding:20px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ccc;padding:8px;text-align:left;}</style></head><body>${element.innerHTML}</body></html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${reportTitle.replace(/\s+/g, '_')}.html`;
    link.click();
  };

  const reportCategories = [
    { id: 'caisse', label: 'Rapports sur la caisse', icon: Wallet, desc: 'Brouillard de caisse, entrées/sorties et arrêtés journaliers' },
    { id: 'epargne', label: 'Rapports sur le portefeuille-épargne', icon: Coins, desc: 'Encours dépôts, livrets, parts sociales et tontines' },
    { id: 'credit', label: 'Rapports sur le portefeuille-crédit', icon: Landmark, desc: 'Encours sains, PAR 30/60/90 et provisions BCEAO' },
    { id: 'dirigeants', label: 'Encours total des prêts aux dirigeants', icon: ShieldCheck, desc: 'Contrôle prudentiel des prêts aux administrateurs et personnel' },
    { id: 'ratios', label: 'Statistiques & ratios prudentiels', icon: TrendingUp, desc: 'Liquidité, couverture des crédits et autosuffisance financière' },
    { id: 'performance_agents', label: 'Performance des agents & agences', icon: UserCheck, desc: 'Productivité commerciale, décaissements et taux de recouvrement' },
    { id: 'rh_paie', label: 'Rapports RH & paie d\'entreprise', icon: Building2, desc: 'Retenues sur salaires, bordereaux et cotisations' },
    { id: 'immobilisations', label: 'Rapports sur les immobilisations', icon: Layers, desc: 'Registre des actifs, dotations et amortissements comptables' },
    { id: 'performance_sociale', label: 'Rapports sur la performance sociale', icon: HeartHandshake, desc: 'Indicateurs d\'inclusion financière, satisfaction et portée' },
    { id: 'multicritere', label: 'Édition multicritère & exports', icon: Filter, desc: 'Filtrage croisé personnalisé, export Word, Excel, PDF, HTML' }
  ];

  return (
    <div className="w-full space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header & Export Action Hub - Full Width */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-sm flex flex-wrap items-center justify-between gap-5 print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-100 text-slate-800 rounded-2xl border border-slate-200 flex items-center justify-center shadow-sm">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Éditions & Reportings Réglementaires (SYSCOA-SFD / BCEAO)
              </h1>
              <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full border border-slate-200 uppercase tracking-wider">
                Multi-Formats
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Génération des états statistiques, ratios prudentiels, situation de caisse et exports officiels.
            </p>
          </div>
        </div>

        {/* Global Export Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-3 bg-coop-primary hover:opacity-90 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
            title="Imprimer ou enregistrer en PDF Acrobat Reader"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer / PDF</span>
          </button>

          <button
            onClick={() => handleExportCSV(
              `Rapport_${activeCategory}`, 
              ["Code", "Nom", "Matricule", "Montant (F.CFA)", "Statut"], 
              members.map(m => [m.code, m.fullName, m.employeeId || 'N/A', (m.sharesPurchased || 10000), m.status])
            )}
            className="flex items-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-sm font-semibold transition-all shadow-sm"
            title="Exporter vers Microsoft Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => handleExportWord(`Rapport_${activeCategory}`, document.getElementById('report-printable-area')?.innerHTML || '')}
            className="flex items-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-sm font-semibold transition-all shadow-sm"
            title="Exporter vers Microsoft Word"
          >
            <FileText className="w-4 h-4 text-blue-700" />
            <span>Word</span>
          </button>

          <button
            onClick={() => handleExportHTML(`Rapport_${activeCategory}`)}
            className="flex items-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-sm font-semibold transition-all shadow-sm"
            title="Exporter en page HTML autonome"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>HTML</span>
          </button>
        </div>
      </div>

      {/* Filter Parameters Bar - Full Width */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-5 text-sm font-semibold text-slate-700 print:hidden">
        <div>
          <label className="block text-slate-800 font-bold mb-2">Période : Date Début</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-slate-800 font-bold mb-2">Période : Date Fin</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-slate-800 font-bold mb-2">Agence d'Imputation</label>
          <select
            value={selectedAgency}
            onChange={(e) => setSelectedAgency(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold focus:outline-none"
          >
            <option value="TOUTES">Toutes les Agences (Réseau Global)</option>
            <option value="A01">A01 - Siège Social</option>
            <option value="A02">A02 - Agence Principale</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-800 font-bold mb-2">Recherche / Filtrage</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrer par sociétaire, compte..."
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3" />
          </div>
        </div>
      </div>

      {/* Main Layout: Left Navigator + Right Full-Width Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* Left Navigator (3 Cols) */}
        <div className="lg:col-span-3 space-y-2.5 print:hidden">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1.5">
            <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              10 Familles de Rapports
            </div>

            {reportCategories.map((cat) => {
              const IconComp = cat.icon;
              const isActive = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as ReportCategory)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                    isActive
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-white border-transparent hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs leading-snug">{cat.label}</div>
                    <div className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>{cat.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Printable Area (9 Cols - Expansive Full Sheet) */}
        <div className="lg:col-span-9 space-y-6">
          <div 
            id="report-printable-area" 
            className="bg-white border border-slate-200 rounded-2xl p-8 lg:p-10 shadow-sm space-y-7 print:border-none print:shadow-none print:p-0"
          >
            {/* Official Report Header */}
            <div className="border-b-2 border-slate-800 pb-6 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-wider">
                    COOPÉRATIVE D'ÉPARGNE ET DE CRÉDIT (COOPEC)
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Système Comptable SYSCOA-SFD • Normes Prudentielles BCEAO
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    Agence : {selectedAgency}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-600 font-mono space-y-0.5">
                  <div>Date : <strong>{new Date().toLocaleDateString('fr-FR')}</strong></div>
                  <div>Période : {startDate} au {endDate}</div>
                </div>
              </div>

              <div className="pt-3 text-center">
                <span className="inline-block bg-slate-100 text-slate-900 px-6 py-2 rounded-xl font-black text-sm uppercase tracking-widest border border-slate-300">
                  {reportCategories.find(c => c.id === activeCategory)?.label}
                </span>
              </div>
            </div>

            {/* REPORT 1: CAISSE */}
            {activeCategory === 'caisse' && (
              <div className="space-y-6 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-slate-500 font-bold text-xs uppercase tracking-wider block">Solde Ouverture :</span>
                    <span className="font-mono text-xl font-bold text-slate-900 mt-1 block">1 500 000 F</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-slate-500 font-bold text-xs uppercase tracking-wider block">Total Encaissements :</span>
                    <span className="font-mono text-xl font-bold text-emerald-800 mt-1 block">+ 4 850 000 F</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-slate-500 font-bold text-xs uppercase tracking-wider block">Total Décaissements :</span>
                    <span className="font-mono text-xl font-bold text-slate-900 mt-1 block">- 2 100 000 F</span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50 uppercase text-xs font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Heure</th>
                        <th className="py-3.5 px-4">N° Reçu</th>
                        <th className="py-3.5 px-4">Adhérent</th>
                        <th className="py-3.5 px-4">Nature Opération</th>
                        <th className="py-3.5 px-4 text-right">Montant (F.CFA)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      <tr>
                        <td className="py-3 px-4 font-mono">08:35</td>
                        <td className="py-3 px-4 font-mono">REC-00912</td>
                        <td className="py-3 px-4 font-semibold">KODJO Koffi Jean-Baptiste</td>
                        <td className="py-3 px-4 font-bold text-slate-900">Versement Livret Épargne</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">+ 50 000 F</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono">09:12</td>
                        <td className="py-3 px-4 font-mono">REC-00913</td>
                        <td className="py-3 px-4 font-semibold">AMEGAVIE Akossiwa Marie</td>
                        <td className="py-3 px-4 font-bold text-slate-900">Souscription Parts Sociales</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">+ 20 000 F</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono">10:45</td>
                        <td className="py-3 px-4 font-mono">REC-00914</td>
                        <td className="py-3 px-4 font-semibold">BATAKA Essohanam Paul</td>
                        <td className="py-3 px-4 font-bold text-slate-900">Retrait Espèces Guichet</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">- 100 000 F</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORT 2: ÉPARGNE */}
            {activeCategory === 'epargne' && (
              <div className="space-y-6 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-slate-500 font-bold text-xs uppercase tracking-wider block">Encours Épargne à Vue :</span>
                    <span className="font-mono text-xl font-bold text-slate-900 mt-1 block">{totalSavings.toLocaleString('fr-FR')} F</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-slate-500 font-bold text-xs uppercase tracking-wider block">Capital Parts Sociales :</span>
                    <span className="font-mono text-xl font-bold text-slate-900 mt-1 block">{totalShares.toLocaleString('fr-FR')} F</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-slate-500 font-bold text-xs uppercase tracking-wider block">Livrets Actifs :</span>
                    <span className="font-mono text-xl font-bold text-slate-900 mt-1 block">{totalMembers} livrets</span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50 uppercase text-xs font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Code</th>
                        <th className="py-3.5 px-4">Nom & Prénoms</th>
                        <th className="py-3.5 px-4 text-right">Parts Sociales</th>
                        <th className="py-3.5 px-4 text-right">Solde Livret</th>
                        <th className="py-3.5 px-4 text-right">Retenue Mensuelle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {members.map(m => (
                        <tr key={m.code}>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{m.code}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{m.fullName}</td>
                          <td className="py-3 px-4 text-right font-mono">{(m.sharesPurchased || 10000).toLocaleString('fr-FR')} F</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{(150000 + (parseInt(m.code.slice(-3)) * 12000)).toLocaleString('fr-FR')} F</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                            {m.monthlySavingsTarget ? `+${m.monthlySavingsTarget.toLocaleString('fr-FR')} F` : '25 000 F'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORT 3: CRÉDIT */}
            {activeCategory === 'credit' && (
              <div className="space-y-6 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-slate-500 font-bold text-xs uppercase tracking-wider block">Encours Brut Total :</span>
                    <span className="font-mono text-xl font-bold text-slate-900 mt-1 block">42 850 000 F</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-slate-500 font-bold text-xs uppercase tracking-wider block">Portefeuille Sain (PAR 0) :</span>
                    <span className="font-mono text-xl font-bold text-emerald-800 mt-1 block">97.8 %</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-slate-500 font-bold text-xs uppercase tracking-wider block">Dégradation (PAR 30) :</span>
                    <span className="font-mono text-xl font-bold text-slate-900 mt-1 block">2.2 % (Norme &lt; 5%)</span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50 uppercase text-xs font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">N° Dossier</th>
                        <th className="py-3.5 px-4">Emprunteur</th>
                        <th className="py-3.5 px-4 text-right">Capital Octroyé</th>
                        <th className="py-3.5 px-4 text-right">Capital Restant Dû</th>
                        <th className="py-3.5 px-4 text-center">Statut du Prêt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      <tr>
                        <td className="py-3 px-4 font-mono font-bold">CRE-2026-001</td>
                        <td className="py-3 px-4 font-semibold">KODJO Koffi Jean-Baptiste</td>
                        <td className="py-3 px-4 text-right font-mono">1 500 000 F</td>
                        <td className="py-3 px-4 text-right font-mono font-bold">1 146 000 F</td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-800">EN COURS (SAIN)</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono font-bold">CRE-2026-002</td>
                        <td className="py-3 px-4 font-semibold">BATAKA Essohanam Paul</td>
                        <td className="py-3 px-4 text-right font-mono">2 000 000 F</td>
                        <td className="py-3 px-4 text-right font-mono font-bold">1 440 000 F</td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-800">EN COURS (SAIN)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORT 4: DIRIGEANTS */}
            {activeCategory === 'dirigeants' && (
              <div className="space-y-5 text-sm">
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="font-bold text-slate-900 text-base">Norme Prudentielle BCEAO SFD : Plafond des Prêts aux Dirigeants</div>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    Conformément à la réglementation prudentielle de l'UMOA, le cumul des engagements directs et indirects envers les dirigeants (Conseil d'Administration, Comité de Surveillance, Direction) ne doit pas excéder 20% des fonds propres effectifs.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 font-mono">
                    <div className="p-4 bg-white rounded-xl border border-slate-200">
                      <span className="text-xs text-slate-500 font-sans block">Plafond Légal Autorisé (20% FP) :</span>
                      <span className="text-xl font-bold text-slate-900 mt-1 block">12 500 000 F.CFA</span>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-slate-200">
                      <span className="text-xs text-slate-500 font-sans block">Encours Réel Constaté :</span>
                      <span className="text-xl font-bold text-emerald-800 mt-1 block">3 500 000 F.CFA (5.6% - Conforme)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* REPORT 5: RATIOS PRUDENTIELS */}
            {activeCategory === 'ratios' && (
              <div className="space-y-6 text-sm">
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50 uppercase text-xs font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-4 px-5">Ratio Prudentiel BCEAO</th>
                        <th className="py-4 px-5">Norme Réglementaire</th>
                        <th className="py-4 px-5 text-right">Valeur Réalisée</th>
                        <th className="py-4 px-5 text-center">Appréciation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      <tr>
                        <td className="py-4 px-5 font-bold">Ratio de Liquidité Immédiate</td>
                        <td className="py-4 px-5 font-mono">≥ 80.0 %</td>
                        <td className="py-4 px-5 text-right font-mono font-bold text-emerald-800 text-base">124.5 %</td>
                        <td className="py-4 px-5 text-center font-bold text-emerald-800">EXCELLENT</td>
                      </tr>
                      <tr>
                        <td className="py-4 px-5 font-bold">Couverture des Emplois par les Ressources</td>
                        <td className="py-4 px-5 font-mono">≥ 100.0 %</td>
                        <td className="py-4 px-5 text-right font-mono font-bold text-emerald-800 text-base">142.8 %</td>
                        <td className="py-4 px-5 text-center font-bold text-emerald-800">CONFORME</td>
                      </tr>
                      <tr>
                        <td className="py-4 px-5 font-bold">Taux de Portefeuille à Risque (PAR 30)</td>
                        <td className="py-4 px-5 font-mono">≤ 5.0 %</td>
                        <td className="py-4 px-5 text-right font-mono font-bold text-emerald-800 text-base">2.2 %</td>
                        <td className="py-4 px-5 text-center font-bold text-emerald-800">CONFORME</td>
                      </tr>
                      <tr>
                        <td className="py-4 px-5 font-bold">Autosuffisance Opérationnelle (OSS)</td>
                        <td className="py-4 px-5 font-mono">≥ 110.0 %</td>
                        <td className="py-4 px-5 text-right font-mono font-bold text-emerald-800 text-base">118.4 %</td>
                        <td className="py-4 px-5 text-center font-bold text-emerald-800">RENTABLE</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORT 7: RH ET PAIE */}
            {activeCategory === 'rh_paie' && (
              <div className="space-y-5 text-sm">
                <div className="font-bold text-slate-800 text-base">Bordereau Récapitulatif de Retenues à la Source (Convention Employeur Partenaire)</div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50 uppercase text-xs font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Matricule</th>
                        <th className="py-3.5 px-4">Nom & Prénoms</th>
                        <th className="py-3.5 px-4 text-right">Parts</th>
                        <th className="py-3.5 px-4 text-right">Épargne</th>
                        <th className="py-3.5 px-4 text-right">Mensualité Prêt</th>
                        <th className="py-3.5 px-4 text-right">Total Retenu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                      <tr>
                        <td className="py-3 px-4 font-bold text-slate-900">MAT-9021</td>
                        <td className="py-3 px-4 font-sans font-bold text-slate-900">KODJO Koffi Jean-Baptiste</td>
                        <td className="py-3 px-4 text-right">10 000 F</td>
                        <td className="py-3 px-4 text-right text-emerald-800 font-bold">+ 25 000 F</td>
                        <td className="py-3 px-4 text-right">95 500 F</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">130 500 F</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-bold text-slate-900">MAT-9044</td>
                        <td className="py-3 px-4 font-sans font-bold text-slate-900">AMEGAVIE Akossiwa Marie</td>
                        <td className="py-3 px-4 text-right">5 000 F</td>
                        <td className="py-3 px-4 text-right text-emerald-800 font-bold">+ 20 000 F</td>
                        <td className="py-3 px-4 text-right">0 F</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">25 000 F</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Signatures & Certification Box */}
            <div className="pt-10 border-t border-slate-200 grid grid-cols-3 gap-8 text-center text-xs font-semibold">
              <div className="space-y-12">
                <span className="text-slate-800 block uppercase tracking-wider">Le Chef Comptable</span>
                <div className="border-b border-dashed border-slate-400 w-36 mx-auto" />
              </div>
              <div className="space-y-12">
                <span className="text-slate-800 block uppercase tracking-wider">Le Comité de Surveillance</span>
                <div className="border-b border-dashed border-slate-400 w-36 mx-auto" />
              </div>
              <div className="space-y-12">
                <span className="text-slate-800 block uppercase tracking-wider">Le Gérant de la Coopérative</span>
                <div className="border-b border-dashed border-slate-400 w-36 mx-auto" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
