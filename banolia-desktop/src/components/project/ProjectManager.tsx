import React, { useState } from 'react';
import { 
  Coins, 
  Plus, 
  ShieldCheck, 
  Clock, 
  Landmark, 
  FileText, 
  Search, 
  Filter, 
  X, 
  Printer 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ProjectRequest {
  id: string;
  projectCode: string;
  memberCode: string;
  memberName: string;
  employeeId: string;
  department: string;
  projectType: 'HABITAT' | 'VEHICULE' | 'EQUIPEMENT' | 'ACTIVITE_AGRICOLE' | 'URGENCE_SOCIALE';
  title: string;
  requestedAmount: number;
  contributionAmount: number; // Apport personnel
  durationMonths: number;
  submissionDate: string;
  status: 'APPROUVE' | 'EN_ATTENTE_COMITE' | 'DECAISSE' | 'REJETE';
}

const initialProjects: ProjectRequest[] = [];

export const ProjectManager: React.FC = () => {
  const { theme } = useTheme();
  const [projects, setProjects] = useState<ProjectRequest[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // Form state for new project submission
  const [newProject, setNewProject] = useState({
    memberName: 'TCHALLA Komlan Didier',
    employeeId: '130049',
    memberCode: '130049',
    department: 'Direction des Services Opérationnels',
    projectType: 'HABITAT' as ProjectRequest['projectType'],
    title: '',
    requestedAmount: 3000000,
    contributionAmount: 500000,
    durationMonths: 36
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title) return;

    const prj: ProjectRequest = {
      id: `PRJ-2026-00${projects.length + 1}`,
      projectCode: `PRJ-00${projects.length + 1}`,
      memberCode: newProject.memberCode,
      memberName: newProject.memberName,
      employeeId: newProject.employeeId,
      department: newProject.department,
      projectType: newProject.projectType,
      title: newProject.title,
      requestedAmount: Number(newProject.requestedAmount),
      contributionAmount: Number(newProject.contributionAmount),
      durationMonths: Number(newProject.durationMonths),
      submissionDate: new Date().toLocaleDateString('fr-FR'),
      status: 'EN_ATTENTE_COMITE'
    };

    setProjects([prj, ...projects]);
    setIsNewProjectModalOpen(false);
    setNewProject({
      memberName: 'TCHALLA Komlan Didier',
      employeeId: '130049',
      memberCode: '130049',
      department: 'Direction des Services Opérationnels',
      projectType: 'HABITAT',
      title: '',
      requestedAmount: 3000000,
      contributionAmount: 500000,
      durationMonths: 36
    });
  };

  const handleApproveProject = (id: string) => {
    setProjects(projects.map(p => p.id === id ? { ...p, status: 'APPROUVE' } : p));
  };

  const handleDisburseProject = (id: string) => {
    setProjects(projects.map(p => p.id === id ? { ...p, status: 'DECAISSE' } : p));
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'ALL' || p.status === filterType;
    return matchesSearch && matchesFilter;
  });

  const totalFunded = projects.filter(p => p.status === 'DECAISSE').reduce((sum, p) => sum + p.requestedAmount, 0);
  const totalPending = projects.filter(p => p.status === 'EN_ATTENTE_COMITE').reduce((sum, p) => sum + p.requestedAmount, 0);

  return (
    <div className="w-full px-6 lg:px-10 py-6 space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-800">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Gestion des Projets & Financements Sociétaires
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Accompagnement des adhérents : Habitat, Véhicules, Équipements et Projets d'Avenir
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Imprimer Liste des Projets</span>
            </button>

            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              style={{ backgroundColor: theme.primaryAccent, color: '#ffffff' }}
              className="flex items-center gap-1.5 hover:opacity-90 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Déposer un Nouveau Projet</span>
            </button>
          </div>
        </div>

        {/* KPIs Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Projets Décaissés</span>
            <div className="text-xl font-bold font-mono text-emerald-800 mt-1">
              {totalFunded.toLocaleString('fr-FR')} F.CFA
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Financement effectif accordé</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">En Attente Comité de Crédit</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {totalPending.toLocaleString('fr-FR')} F.CFA
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Dossiers soumis pour examen</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Nombre Total de Projets</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {projects.length} Dossiers
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Portefeuille adhérents</span>
          </div>
        </div>
      </div>

      {/* Projects List with Search and Filter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, matricule, objet..."
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-medium focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-bold text-slate-600">Statut :</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-slate-800"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="EN_ATTENTE_COMITE">En Attente Comité</option>
              <option value="APPROUVE">Approuvé</option>
              <option value="DECAISSE">Décaissé</option>
            </select>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
              <Coins className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Pas de projet en cours</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Aucun projet sociétaire n'est actuellement en cours de financement ou en attente d'instruction.
            </p>
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="mt-5 flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Déposer un Nouveau Projet</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((p) => (
              <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-3 shadow-sm hover:border-slate-400 transition-colors">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-mono font-bold text-slate-900 text-xs">{p.projectCode}</span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                      p.status === 'DECAISSE'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : p.status === 'APPROUVE'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-slate-100 text-slate-800 border-slate-300'
                    }`}>
                      {p.status === 'DECAISSE' ? 'DÉCAISSÉ' : p.status === 'APPROUVE' ? 'APPROUVÉ' : 'EN ATTENTE'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mt-2.5 leading-snug">{p.title}</h3>
                  <div className="text-xs text-slate-600 mt-1 font-medium">
                    <strong>{p.memberName}</strong> ({p.employeeId})
                  </div>
                  <div className="text-[11px] text-slate-500">{p.department}</div>

                  <div className="mt-3 bg-white p-3 rounded-lg border border-slate-200 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Montant Demandé :</span>
                      <span className="font-mono font-bold text-slate-900">{p.requestedAmount.toLocaleString('fr-FR')} F</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Apport Personnel :</span>
                      <span className="font-mono font-medium text-emerald-800">+{p.contributionAmount.toLocaleString('fr-FR')} F</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Durée de Remboursement :</span>
                      <span className="font-mono font-bold text-slate-800">{p.durationMonths} mois</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  {p.status === 'EN_ATTENTE_COMITE' && (
                    <button
                      onClick={() => handleApproveProject(p.id)}
                      className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Approuver Comité</span>
                    </button>
                  )}

                  {p.status === 'APPROUVE' && (
                    <button
                      onClick={() => handleDisburseProject(p.id)}
                      style={{ backgroundColor: theme.primaryAccent, color: '#ffffff' }}
                      className="flex items-center gap-1.5 hover:opacity-90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>Décaisser les Fonds</span>
                    </button>
                  )}

                  {p.status === 'DECAISSE' && (
                    <span className="text-xs text-emerald-800 font-bold flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-emerald-700" />
                      Fonds Positionnés sur Compte
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: New Project Submission */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Dépôt de Dossier Projet Sociétaire
                </h3>
              </div>
              <button 
                onClick={() => setIsNewProjectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Adhérent / Sociétaire</label>
                <input
                  type="text"
                  value={`${newProject.memberName} (${newProject.employeeId})`}
                  disabled
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Type de Projet</label>
                <select
                  value={newProject.projectType}
                  onChange={(e) => setNewProject({ ...newProject, projectType: e.target.value as ProjectRequest['projectType'] })}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:outline-none"
                >
                  <option value="HABITAT">Habitat & Construction Immobilière</option>
                  <option value="VEHICULE">Achat Véhicule Automobile / Moto</option>
                  <option value="EQUIPEMENT">Équipement Domestique & Solaire</option>
                  <option value="ACTIVITE_AGRICOLE">Projet Agricole & Élevage</option>
                  <option value="URGENCE_SOCIALE">Secours d'Urgence Sociale</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Intitulé du Projet</label>
                <input
                  type="text"
                  required
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  placeholder="Ex: Construction logement principal"
                  className="w-full bg-white border border-slate-300 focus:border-slate-800 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Montant Demandé (F.CFA)</label>
                  <input
                    type="number"
                    required
                    min="100000"
                    step="50000"
                    value={newProject.requestedAmount}
                    onChange={(e) => setNewProject({ ...newProject, requestedAmount: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 focus:border-slate-800 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Apport Personnel (F.CFA)</label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={newProject.contributionAmount}
                    onChange={(e) => setNewProject({ ...newProject, contributionAmount: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 focus:border-slate-800 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Durée du Financement (mois)</label>
                <select
                  value={newProject.durationMonths}
                  onChange={(e) => setNewProject({ ...newProject, durationMonths: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:outline-none"
                >
                  <option value={12}>12 mois (1 an)</option>
                  <option value={24}>24 mois (2 ans)</option>
                  <option value={36}>36 mois (3 ans)</option>
                  <option value={48}>48 mois (4 ans)</option>
                  <option value={60}>60 mois (5 ans)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: theme.primaryAccent, color: '#ffffff' }}
                  className="px-5 py-2 hover:opacity-90 text-white font-bold rounded-lg text-xs shadow-sm"
                >
                  Soumettre au Comité
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
