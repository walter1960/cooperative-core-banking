import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Layers } from 'lucide-react';
import { NetworkMonitor } from '../../services/sync/NetworkMonitor';
import { useLiveOfflineQueueCount } from '../../hooks/useLiveStorage';
import { SyncEngine } from '../../services/sync/SyncEngine';

interface SyncStatusWidgetProps {
  onOpenDetailModal?: () => void;
}

export const SyncStatusWidget: React.FC<SyncStatusWidgetProps> = ({ onOpenDetailModal }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const pendingCount = useLiveOfflineQueueCount() || 0;

  useEffect(() => {
    const monitor = NetworkMonitor.getInstance();
    const unsubscribe = monitor.subscribe((online) => {
      setIsOnline(online);
      if (online && pendingCount > 0) {
        handleTriggerSync();
      }
    });

    return () => unsubscribe();
  }, [pendingCount]);

  const handleTriggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await SyncEngine.replayBatch();
    } catch (err) {
      console.error('Manual sync trigger error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Network Status Pill */}
      <button
        onClick={onOpenDetailModal}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
          isOnline
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
            : 'bg-rose-950/60 border-rose-500/40 text-rose-400 animate-pulse'
        }`}
      >
        {isOnline ? (
          <Wifi className="w-3.5 h-3.5" />
        ) : (
          <WifiOff className="w-3.5 h-3.5" />
        )}
        <span>{isOnline ? 'En ligne' : 'Hors-ligne'}</span>
      </button>

      {/* Outbox Pending Counter */}
      {pendingCount > 0 && (
        <button
          onClick={handleTriggerSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/50 transition-all"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{pendingCount} en attente</span>
          <RefreshCw className={`w-3 h-3 ml-0.5 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
};
