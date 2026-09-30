import { PushNotificationItem } from '../types';
import { soundSynthesizer } from './audioService';

type NotificationListener = (notifications: PushNotificationItem[]) => void;

class NotificationService {
  private notifications: PushNotificationItem[] = [];
  private listeners: Set<NotificationListener> = new Set();
  private isSoundEnabled = true;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem('voltgrid_notifications');
      if (data) {
        this.notifications = JSON.parse(data);
      } else {
        // Initial welcome / system notifications
        this.notifications = [
          {
            id: 'notif-01',
            judul: 'Sistem Dispatch Aktif',
            pesan: 'Monitoring real-time tiang listrik dan cuaca sinkron aktif.',
            waktu: '18:00 WIB',
            tipe: 'info',
            dibaca: false,
          },
          {
            id: 'notif-02',
            judul: 'Tiket Darurat: Tiang Miring',
            pesan: 'TL-BDG-078 miring 8.9° di Antapani. Tim TRC-02 ditugaskan ke lokasi.',
            waktu: '17:22 WIB',
            tipe: 'critical',
            tiketId: 'tkt-001',
            kodeAset: 'TL-BDG-078',
            dibaca: false,
          }
        ];
      }
    } catch {
      // LocalStorage error fallback
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('voltgrid_notifications', JSON.stringify(this.notifications));
    } catch {
      // Ignore
    }
  }

  public subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    listener([...this.notifications]);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const list = [...this.notifications];
    this.listeners.forEach((fn) => fn(list));
    this.saveToStorage();
  }

  public setSoundEnabled(enabled: boolean) {
    this.isSoundEnabled = enabled;
  }

  public getSoundEnabled(): boolean {
    return this.isSoundEnabled;
  }

  public async requestBrowserPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  public sendPushNotification(options: {
    judul: string;
    pesan: string;
    tipe?: 'info' | 'warning' | 'critical' | 'success';
    tiketId?: string;
    kodeAset?: string;
  }) {
    const { judul, pesan, tipe = 'info', tiketId, kodeAset } = options;

    const newNotif: PushNotificationItem = {
      id: `notif-${Date.now()}`,
      judul,
      pesan,
      waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      tipe,
      tiketId,
      kodeAset,
      dibaca: false,
    };

    this.notifications.unshift(newNotif);
    // Keep max 50
    if (this.notifications.length > 50) {
      this.notifications.pop();
    }
    this.notifyListeners();

    // Play synthesized sound
    if (this.isSoundEnabled) {
      if (tipe === 'critical') {
        soundSynthesizer.playEmergencyAlert();
      } else if (tipe === 'success') {
        soundSynthesizer.playSuccessChime();
      } else {
        soundSynthesizer.playNotificationChime();
      }
    }

    // Attempt native browser notification if granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`[VoltGrid] ${judul}`, {
          body: pesan,
          icon: '/favicon.ico',
        });
      } catch {
        // Ignore iframe restriction errors
      }
    }
  }

  public markAsRead(id: string) {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, dibaca: true } : n));
    this.notifyListeners();
  }

  public markAllAsRead() {
    this.notifications = this.notifications.map((n) => ({ ...n, dibaca: true }));
    this.notifyListeners();
  }

  public clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }
}

export const notificationService = new NotificationService();
