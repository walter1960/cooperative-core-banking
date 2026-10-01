import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Printer, 
  RefreshCw, 
  AlertTriangle, 
  DollarSign, 
  User, 
  Building2, 
  ShieldCheck, 
  ArrowDownRight, 
  Send, 
  Calendar, 
  ChevronRight,
  Sparkles,
  Paperclip,
  Check,
  Ban
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface MobileRequest {
  id: string;
  type: 'LOAN' | 'WITHDRAWAL' | 'ADHESION';
  requestNumber: string;
  memberCode: string;
  memberName: string;
  memberPhone: string;
  amount: number;
  durationMonths?: number;
  interestRate?: number;
  estimatedMonthlyPayment?: number;
  purpose: string;
  selectedAccount?: string;
  selectedAgency?: string;
  guarantorName?: string;
  attachmentName?: string;
  writtenStatement?: string;
  status: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE' | 'SERVI_GUICHET';
  submittedAt: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
}

const INITIAL_REQUESTS: MobileRequest[] = [];

export const MobileRequestsManager: React.FC = () => {
  const { theme } = useTheme();
  const [requests, setRequests] = useState<MobileRequest[]>(() => {
    const saved = localStorage.getItem('coop_mobile_requests');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* use initial */ }
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'LOAN' | 'WITHDRAWAL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EN_ATTENTE' | 'APPROUVE' | 'SERVI_GUICHET' | 'REJETE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<MobileRequest | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Synchronisation avec l'API banolia-server
  const fetchFromServer = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/mobile/requests');
      if (res.ok) {
        const data = await res.json();
        if (data.requests && Array.isArray(data.requests)) {
          setRequests(data.requests);
          localStorage.setItem('coop_mobile_requests', JSON.stringify(data.requests));
          setFeedbackMsg('Synchronisation réussie avec le serveur mobile');
          setTimeout(() => setFeedbackMsg(''), 3000);
        }
      }
    } catch (e) {
      // Offline fallback: keep local requests
      setFeedbackMsg('Mode local actif');
      setTimeout(() => setFeedbackMsg(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFromServer();
    const interval = setInterval(fetchFromServer, 10000); // Polling toutes les 10 secondes
    return () => clearInterval(interval);
  }, []);

  // Update status handler
  const handleUpdateStatus = async (id: string, newStatus: 'APPROUVE' | 'REJETE' | 'SERVI_GUICHET', actionNote: string) => {
    const currentManager = localStorage.getItem('coop_manager_name') || 'Gestionnaire de Compte';
    const updated = requests.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: newStatus,
          processedAt: new Date().toISOString(),
          processedBy: currentManager,
          notes: actionNote
        };
      }
      return r;
    });

    setRequests(updated);
    localStorage.setItem('coop_mobile_requests', JSON.stringify(updated));

    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest({
        ...selectedRequest,
        status: newStatus,
        processedAt: new Date().toISOString(),
        processedBy: currentManager,
        notes: actionNote
      });
    }

    // Inform backend
    try {
      await fetch(`http://localhost:3000/api/mobile/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, processedBy: currentManager, notes: actionNote })
      });
    } catch (e) {
      // offline fallback
    }

    setFeedbackMsg(`Demande ${newStatus === 'APPROUVE' ? 'approuvée' : newStatus === 'SERVI_GUICHET' ? 'payée au guichet' : 'rejetée'} avec succès.`);
    setTimeout(() => setFeedbackMsg(''), 3500);
  };

  // Filtered requests
  const filtered = requests.filter(r => {
    if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.memberName.toLowerCase().includes(q);
      const matchCode = r.memberCode.toLowerCase().includes(q);
      const matchNum = r.requestNumber.toLowerCase().includes(q);
      const matchPhone = r.memberPhone.includes(q);
      if (!matchName && !matchCode && !matchNum && !matchPhone) return false;
    }
    return true;
  });

  // KPIs
  const pendingCount = requests.filter(r => r.status === 'EN_ATTENTE').length;
  const loanVolumePending = requests
    .filter(r => r.type === 'LOAN' && r.status === 'EN_ATTENTE')
    .reduce((sum, r) => sum + r.amount, 0);
  const withdrawalPendingCount = requests.filter(r => r.type === 'WITHDRAWAL' && r.status === 'EN_ATTENTE').length;

  return (
    <div className="space-y-5">
      {/* Header & Quick Action Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md"
            style={{ backgroundColor: theme.primaryAccent }}
          >
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900">
                Espace Demandes Mobiles & Guichet Numérique
              </h1>
              <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                En direct (SQLite)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Réception, instruction et validation des demandes initiées par les sociétaires sur smartphone
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={fetchFromServer}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Demandes Reçues (Mobile)</span>
            <Smartphone className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {requests.length}
          </div>
          <div className="text-[11px] text-slate-500">
            Depuis l'application sociétaire
          </div>
        </div>

        <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm space-y-1 bg-amber-50/30">
          <div className="flex items-center justify-between text-xs text-amber-800 font-bold">
            <span>En Attente d'Instruction</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono">
            {pendingCount}
          </div>
          <div className="text-[11px] text-amber-700">
            Prêts et retraits à traiter
          </div>
        </div>

        <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-sm space-y-1 bg-blue-50/30">
          <div className="flex items-center justify-between text-xs text-blue-800 font-bold">
            <span>Prêts Sollicités en Attente</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-950 font-mono">
            {loanVolumePending.toLocaleString('fr-FR')} F
          </div>
          <div className="text-[11px] text-blue-700">
            Encours demandé en ligne
          </div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm space-y-1 bg-emerald-50/30">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-bold">
            <span>Fiches de Retrait en Attente</span>
            <ArrowDownRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 font-mono">
            {withdrawalPendingCount}
          </div>
          <div className="text-[11px] text-emerald-700">
            Présence en agence obligatoire
          </div>
        </div>
      </div>

      {/* Main Container: Split List & Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (7 Cols): Filtered Request List */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom, matricule, dossier (DEM-..., RET-...)..."
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100">
              {/* Type Tabs */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    typeFilter === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tous ({requests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('LOAN')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    typeFilter === 'LOAN' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Prêts ({requests.filter(r => r.type === 'LOAN').length})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('WITHDRAWAL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    typeFilter === 'WITHDRAWAL' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Retraits ({requests.filter(r => r.type === 'WITHDRAWAL').length})
                </button>
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1">
                {(['ALL', 'EN_ATTENTE', 'APPROUVE', 'SERVI_GUICHET', 'REJETE'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                      statusFilter === st
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'ALL' ? 'Tous statuts' : st === 'EN_ATTENTE' ? 'En attente' : st === 'APPROUVE' ? 'Approuvé' : st === 'SERVI_GUICHET' ? 'Payé' : 'Rejeté'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Requests List */}
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 space-y-2">
                <Smartphone className="w-8 h-8 mx-auto opacity-40" />
                <div className="font-bold text-sm text-slate-700">Aucune demande trouvée</div>
                <div className="text-xs">Les demandes soumises depuis l'application mobile apparaîtront ici automatiquement.</div>
              </div>
            ) : (
              filtered.map((req) => {
                const isSelected = selectedRequest?.id === req.id;
                const isLoan = req.type === 'LOAN';

                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={`bg-white border rounded-2xl p-4 cursor-pointer transition-all duration-150 space-y-2.5 ${
                      isSelected 
                        ? 'ring-2 ring-blue-600 border-transparent shadow-md' 
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                          isLoan ? 'bg-blue-100 text-blue-900 border border-blue-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}>
                          {isLoan ? 'PRÊT EN LIGNE' : 'FICHE DE RETRAIT'}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-600">
                          {req.requestNumber}
                        </span>
                      </div>

                      {/* Status badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        req.status === 'EN_ATTENTE' 
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : req.status === 'APPROUVE'
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : req.status === 'SERVI_GUICHET'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : 'bg-rose-100 text-rose-900 border border-rose-200'
                      }`}>
                        {req.status === 'EN_ATTENTE' ? '⏳ EN ATTENTE' : req.status === 'APPROUVE' ? '✓ APPROUVÉ' : req.status === 'SERVI_GUICHET' ? '✓ PAYÉ EN CAISSE' : '✕ REJETÉ'}
                      </span>
                    </div>

                    {/* Member & Amount Row */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <span>{req.memberName}</span>
                          <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            Mat: {req.memberCode}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium truncate max-w-sm mt-0.5">
                          {req.purpose}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-black text-slate-900 font-mono">
                          {req.amount.toLocaleString('fr-FR')} F
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {isLoan ? `${req.durationMonths} mois @ ${req.interestRate}%` : (req.selectedAccount || 'Épargne')}
                        </div>
                      </div>
                    </div>

                    {/* Date and details footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Reçu le {new Date(req.submittedAt).toLocaleDateString('fr-FR')} à {new Date(req.submittedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {req.attachmentName && (
                        <span className="flex items-center gap-1 text-blue-600 font-semibold">
                          <Paperclip className="w-3 h-3" />
                          <span>Justificatif joint</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (5 Cols): Detailed Inspection & Action Workbench */}
        <div className="lg:col-span-5">
          {selectedRequest ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 sticky top-4">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${
                    selectedRequest.type === 'LOAN' ? 'bg-blue-600' : 'bg-emerald-600'
                  }`}>
                    {selectedRequest.type === 'LOAN' ? <DollarSign className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-500 block">Dossier Mobile</span>
                    <span className="text-sm font-black text-slate-900">{selectedRequest.requestNumber}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                  title="Imprimer la fiche"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer</span>
                </button>
              </div>

              {/* Member Profile Snapshot */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Identité du Sociétaire Demandeur
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-black text-slate-900">{selectedRequest.memberName}</div>
                    <div className="text-xs text-slate-600 font-mono">Matricule : {selectedRequest.memberCode}</div>
                  </div>
                  {selectedRequest.memberPhone && (
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">{selectedRequest.memberPhone}</div>
                      <div className="text-[10px] text-slate-500">Contact Mobile</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Specific Details based on Type */}
              {selectedRequest.type === 'LOAN' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-semibold">Montant Sollicité</span>
                      <span className="text-sm font-black text-blue-900 font-mono">{selectedRequest.amount.toLocaleString('fr-FR')} F</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-semibold">Durée / Remboursement</span>
                      <span className="text-sm font-black text-slate-900 font-mono">{selectedRequest.durationMonths} mois</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-semibold">Taux d'Intérêt</span>
                      <span className="text-sm font-black text-slate-900 font-mono">{selectedRequest.interestRate}% / an</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-semibold">Mensualité Prévue</span>
                      <span className="text-sm font-black text-emerald-700 font-mono">{(selectedRequest.estimatedMonthlyPayment || 0).toLocaleString('fr-FR')} F/m</span>
                    </div>
                  </div>

                  {/* Motif & Written Statement */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Motif & Justification</span>
                    <p className="text-slate-800 font-medium">{selectedRequest.purpose}</p>
                    {selectedRequest.writtenStatement && (
                      <div className="mt-2 pt-2 border-t border-slate-200 text-slate-600 italic">
                        « {selectedRequest.writtenStatement} »
                      </div>
                    )}
                  </div>

                  {selectedRequest.guarantorName && (
                    <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 font-semibold">Caution / Garant :</span>
                      <span className="font-bold text-slate-900">{selectedRequest.guarantorName}</span>
                    </div>
                  )}

                  {selectedRequest.attachmentName && (
                    <div className="flex items-center justify-between text-xs bg-blue-50 border border-blue-200 p-2.5 rounded-lg text-blue-900">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>{selectedRequest.attachmentName}</span>
                      </span>
                      <span className="text-[10px] uppercase font-bold bg-blue-200 px-2 py-0.5 rounded">Reçu</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-semibold">Montant Retrait</span>
                      <span className="text-base font-black text-emerald-900 font-mono">{selectedRequest.amount.toLocaleString('fr-FR')} F</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-semibold">Compte Débité</span>
                      <span className="text-xs font-black text-slate-900">{selectedRequest.selectedAccount || 'Livret Épargne'}</span>
                    </div>
                  </div>

                  {/* Legal Notice Box for Cash Withdrawal */}
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-700" />
                      <span>Obligation de Comparution Physique</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Conformément aux règles bancaires, le sociétaire doit être présent physiquement au guichet avec sa pièce d'identité officielle pour le paiement effectif des espèces.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Motif Déclaré</span>
                    <p className="text-slate-800 font-medium">{selectedRequest.purpose}</p>
                  </div>
                </div>
              )}

              {/* Current Processing Status */}
              {selectedRequest.processedBy && (
                <div className="text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-600 space-y-0.5">
                  <div>Traité par : <strong>{selectedRequest.processedBy}</strong></div>
                  {selectedRequest.processedAt && (
                    <div>Le : <strong>{new Date(selectedRequest.processedAt).toLocaleString('fr-FR')}</strong></div>
                  )}
                  {selectedRequest.notes && <div>Note : <em>{selectedRequest.notes}</em></div>}
                </div>
              )}

              {/* Action Buttons for Manager */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                {selectedRequest.status === 'EN_ATTENTE' ? (
                  selectedRequest.type === 'LOAN' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'APPROUVE', 'Accordé par le Gestionnaire / Comité de Crédit')}
                        className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approuver le Prêt</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'REJETE', 'Rejeté pour capacité d\'endettement insuffisante')}
                        className="flex items-center justify-center gap-1.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        <Ban className="w-4 h-4" />
                        <span>Rejeter</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'SERVI_GUICHET', 'Espèces servies au guichet après vérification de pièce d\'identité')}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        <Check className="w-4 h-4" />
                        <span>Servir & Payer au Guichet (Espèces)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'REJETE', 'Annulé ou motif irrecevable')}
                        className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800 rounded-xl text-xs font-bold transition-all"
                      >
                        <span>Annuler la Demande</span>
                      </button>
                    </div>
                  )
                ) : (
                  <div className="text-center py-2 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl">
                    Dossier déjà instruit et clôturé.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-400 space-y-2">
              <FileText className="w-8 h-8 mx-auto opacity-40" />
              <div className="font-bold text-sm text-slate-600">Sélectionnez une demande</div>
              <div className="text-xs">Cliquez sur une demande dans la liste pour l'instruire, l'approuver ou procéder au paiement au guichet.</div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};