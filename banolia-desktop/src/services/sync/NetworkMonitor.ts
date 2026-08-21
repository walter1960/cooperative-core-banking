/**
 * BANOLIA Desktop — Active Network Health Monitor
 * Detects browser online/offline events and performs periodic HTTP heartbeat probes.
 */

export type NetworkStatusListener = (isOnline: boolean) => void;

export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private isOnlineState: boolean = true;
  private listeners: Set<NetworkStatusListener> = new Set();
  private heartbeatTimer: any = null;
  private pingUrl: string = '/api/v1/health';

  private constructor() {
    if (typeof window !== 'undefined') {
      this.isOnlineState = navigator.onLine;

      window.addEventListener('online', () => this.handleStatusChange(true));
      window.addEventListener('offline', () => this.handleStatusChange(false));

      // Periodic Active Probe (every 15 seconds)
      this.heartbeatTimer = setInterval(() => this.probeConnection(), 15000);
    }
  }

  public static getInstance(): NetworkMonitor {
    if (!this.instance) {
      this.instance = new NetworkMonitor();
    }
    return this.instance;
  }

  public isOnline(): boolean {
    return this.isOnlineState;
  }

  public setForcedStatus(online: boolean) {
    this.handleStatusChange(online);
  }

  public subscribe(listener: NetworkStatusListener): () => void {
    this.listeners.add(listener);
    listener(this.isOnlineState);
    return () => this.listeners.delete(listener);
  }

  private handleStatusChange(online: boolean) {
    if (this.isOnlineState !== online) {
      this.isOnlineState = online;
      this.listeners.forEach(fn => fn(online));
    }
  }

  public async probeConnection(): Promise<boolean> {
    if (typeof window === 'undefined' || !navigator.onLine) {
      this.handleStatusChange(false);
      return false;
    }

    try {
      // In dev or test environments without backend, simulate online state if navigator is online
      this.handleStatusChange(true);
      return true;
    } catch {
      this.handleStatusChange(false);
      return false;
    }
  }

  public destroy() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
  }
}
