import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Wifi, WifiOff, X, Layers, ShieldCheck } from 'lucide-react';
import { db } from '../../db/database';
import { DbOfflineSyncQueue } from '../../types/database';
import { SyncEngine } from '../../services/sync/SyncEngine';
import { NetworkMonitor } from '../../services/sync/NetworkMonitor';

interface SyncDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncDetailModal: React.FC<SyncDetailModalProps> = ({ isOpen, onClose }) => {
  const [queueItems, setQueueItems] = useState<DbOfflineSyncQueue[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(NetworkMonitor.getInstance().isOnline());
  const [syncResultMsg, setSyncResultMsg] = useState('');

  const loadQueue = async () => {
    const items = await db.syncQueue.orderBy('createdAt').reverse().limit(50).toArray();
    setQueueItems(items);
  };

  useEffect(() => {
    if (isOpen) {
      loadQueue();
      const unsubscribe = NetworkMonitor.getInstance().subscribe(online => setIsOnline(online));
      return () => unsubscribe();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleForceSync = async () => {
    setIsSyncing(true);
    setSyncResultMsg('');
    try {
      const res = await SyncEngine.replayBatch();
      await loadQueue();
      setSyncResultMsg(`${res.succeededCount} opération(s) synchronisée(s) avec succès.`);
    } catch (err: any) {
      setSyncResultMsg(`Erreur : ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleNetworkSimulation = () => {
    const newStatus = !isOnline;
    NetworkMonitor.getInstance().setForcedStatus(newStatus);
    setIsOnline(newStatus);
  };

  const pendingCount = queueItems.filter(q => q.status === 'PENDING' || q.status === 'FAILED_RETRY').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-sky-600" />
            <h2 className="text-base font-bold text-slate-900">
              Moteur de Synchronisation Bidirectionnelle & File Outbox
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Network Toggle Banner */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <div className="font-bold text-slate-900">
                Statut Réseau : {isOnline ? 'Connecté (En Ligne)' : 'Déconnecté (Hors-Ligne Autonome)'}
              </div>
              <div className="text-slate-500">
                {pendingCount} opération(s) locale(s) en attente de synchronisation vers le Core Banking.
              </div>
            </div>
          </div>

          <button
            onClick={toggleNetworkSimulation}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              isOnline
                ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {isOnline ? 'Passer en Hors-Ligne' : 'Rétablir Connexion'}
          </button>
        </div>

        {syncResultMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{syncResultMsg}</span>
          </div>
        )}

        {/* Outbox Items List */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            File d'attente Outbox (Clés d'Idempotence SHA-256)
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            {queueItems.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                Aucune opération dans la file d'attente.
              </div>
            ) : (
              queueItems.map(item => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'ACKNOWLEDGED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : item.status === 'IN_FLIGHT'
                          ? 'bg-sky-100 text-sky-800 border border-sky-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {item.status}
                      </span>
                      <span className="font-mono text-slate-800 font-bold">{item.entityType}</span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 truncate max-w-md">
                      Clé : {item.idempotencyKey}
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-500">
                    <div>{new Date(item.createdAt).toLocaleTimeString('fr-FR')}</div>
                    {item.retryCount > 0 && (
                      <div className="text-rose-600 font-semibold text-[10px]">{item.retryCount} tentative(s)</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Anti-doublon garanti par hash SHA-256.</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              Fermer
            </button>
            <button
              onClick={handleForceSync}
              disabled={isSyncing}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronisation...' : 'Rejouer le Lot Maintenant'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
