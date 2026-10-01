import React, { useState, useEffect } from 'react';
import { Search, X, User, Phone, MapPin, ArrowRight } from 'lucide-react';
import { Member } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onSelectMember: (code: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  members,
  onSelectMember
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = members.filter(m => 
    m.code.toLowerCase().includes(query.toLowerCase()) ||
    m.manualNumber.includes(query) ||
    m.fullName.toLowerCase().includes(query.toLowerCase()) ||
    m.phone.includes(query)
  );

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 gap-3">
          <Search className="w-5 h-5 text-amber-600" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tapez un nom, matricule (ex: 130049) ou téléphone..."
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none font-medium"
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              Aucun résultat trouvé pour "{query}".
            </div>
          ) : (
            filtered.map((m) => (
              <button
                key={m.code}
                onClick={() => {
                  onSelectMember(m.code);
                  onClose();
                }}
                className="w-full text-left p-3 hover:bg-slate-50 rounded-xl flex items-center justify-between transition-colors group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
                      {m.fullName}
                    </span>
                    <span className="font-mono text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-200">
                      Matricule: {m.manualNumber || m.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 font-medium">
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {m.phone}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {m.city}</span>
                  </div>
                </div>

                <div className="text-slate-400 group-hover:text-amber-600 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
          <span>{filtered.length} sociétaire(s) trouvé(s)</span>
          <span>Appuyez sur <kbd className="bg-white border border-slate-300 px-1 rounded text-slate-700 font-mono">Échap</kbd> pour fermer</span>
        </div>
      </div>
    </div>
  );
};
