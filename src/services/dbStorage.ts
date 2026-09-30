import { TiangListrik, LaporanKerusakan, RepairAuditLog } from '../types';
import { INITIAL_POLES, INITIAL_TICKETS } from '../data/mockData';
import { notificationService } from './notificationService';

const STORAGE_KEYS = {
  POLES: 'voltgrid_poles_v1',
  TICKETS: 'voltgrid_tickets_v1',
  OFFLINE_QUEUE: 'voltgrid_offline_queue_v1',
  SIMULATED_OFFLINE: 'voltgrid_simulated_offline',
};

class DBStorageService {
  private poles: TiangListrik[] = [];
  private tickets: LaporanKerusakan[] = [];
  private offlineQueue: Array<{
    type: 'create_ticket' | 'update_ticket' | 'add_audit';
    payload: unknown;
    timestamp: string;
  }> = [];
  private isSimulatedOffline = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedPoles = localStorage.getItem(STORAGE_KEYS.POLES);
      if (storedPoles) {
        this.poles = JSON.parse(storedPoles);
      } else {
        this.poles = INITIAL_POLES;
        this.savePoles();
      }

      const storedTickets = localStorage.getItem(STORAGE_KEYS.TICKETS);
      if (storedTickets) {
        this.tickets = JSON.parse(storedTickets);
      } else {
        this.tickets = INITIAL_TICKETS;
        this.saveTickets();
      }

      const storedQueue = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (storedQueue) {
        this.offlineQueue = JSON.parse(storedQueue);
      }

      const storedSimOffline = localStorage.getItem(STORAGE_KEYS.SIMULATED_OFFLINE);
      if (storedSimOffline) {
        this.isSimulatedOffline = storedSimOffline === 'true';
      }
    } catch {
      this.poles = INITIAL_POLES;
      this.tickets = INITIAL_TICKETS;
    }
  }

  private savePoles() {
    try {
      localStorage.setItem(STORAGE_KEYS.POLES, JSON.stringify(this.poles));
    } catch {
      // Storage quota fallback
    }
  }

  private saveTickets() {
    try {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(this.tickets));
    } catch {
      // Storage quota fallback
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(this.offlineQueue));
    } catch {
      // Ignore
    }
  }

  // Network and offline state
  public isOffline(): boolean {
    if (this.isSimulatedOffline) return true;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
    return false;
  }

  public toggleSimulatedOffline(val?: boolean): boolean {
    this.isSimulatedOffline = val !== undefined ? val : !this.isSimulatedOffline;
    try {
      localStorage.setItem(STORAGE_KEYS.SIMULATED_OFFLINE, String(this.isSimulatedOffline));
    } catch {
      // Ignore
    }
    return this.isSimulatedOffline;
  }

  public getOfflineQueueCount(): number {
    return this.offlineQueue.length;
  }

  // Pole operations
  public getPoles(): TiangListrik[] {
    return [...this.poles];
  }

  public getPoleById(id: string): TiangListrik | undefined {
    return this.poles.find((p) => p.id === id || p.kodeAset.toLowerCase() === id.toLowerCase());
  }

  public getPoleByQr(qrData: string): TiangListrik | undefined {
    const clean = qrData.trim().toLowerCase();
    return this.poles.find((p) => p.qrCodeData.toLowerCase() === clean || p.kodeAset.toLowerCase() === clean);
  }

  public updatePole(updated: TiangListrik): TiangListrik {
    const idx = this.poles.findIndex((p) => p.id === updated.id);
    if (idx !== -1) {
      this.poles[idx] = updated;
      this.savePoles();
    }
    return updated;
  }

  public addAuditLog(poleId: string, log: Omit<RepairAuditLog, 'id'>): TiangListrik | undefined {
    const pole = this.poles.find((p) => p.id === poleId);
    if (!pole) return undefined;

    const newAudit: RepairAuditLog = {
      ...log,
      id: `audit-${Date.now()}`,
    };

    if (this.isOffline()) {
      this.offlineQueue.push({
        type: 'add_audit',
        payload: { poleId, audit: newAudit },
        timestamp: new Date().toISOString(),
      });
      this.saveQueue();
    }

    pole.riwayatPerbaikan.unshift(newAudit);
    pole.terakhirInspeksi = `${log.tanggal} 14:00`;
    if (log.statusAkhir === 'Selesai Baik') {
      pole.kondisi = 'normal';
      pole.skorRisikoPrediktif = Math.max(10, pole.skorRisikoPrediktif - 30);
    }
    this.savePoles();

    notificationService.sendPushNotification({
      judul: 'Audit Lapangan Dicatat',
      pesan: `Audit QR Berhasil untuk ${pole.kodeAset} oleh ${log.teknisi}`,
      tipe: 'success',
      kodeAset: pole.kodeAset,
    });

    return pole;
  }

  // Ticket operations
  public getTickets(): LaporanKerusakan[] {
    return [...this.tickets];
  }

  public getTicketById(id: string): LaporanKerusakan | undefined {
    return this.tickets.find((t) => t.id === id || t.noTiket === id);
  }

  public createTicket(data: Omit<LaporanKerusakan, 'id' | 'noTiket' | 'waktuLapor' | 'disinkronkan'>): LaporanKerusakan {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const noTiket = `TKT-${dateStr}-${randNum}`;

    const newTicket: LaporanKerusakan = {
      ...data,
      id: `tkt-${Date.now()}`,
      noTiket,
      waktuLapor: now.toLocaleDateString('id-ID') + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      disinkronkan: !this.isOffline(),
    };

    if (this.isOffline()) {
      this.offlineQueue.push({
        type: 'create_ticket',
        payload: newTicket,
        timestamp: now.toISOString(),
      });
      this.saveQueue();
    }

    // Update pole status if affected
    const pole = this.poles.find((p) => p.id === data.tiangId);
    if (pole) {
      if (data.tingkatKeparahan === 'darurat' || data.tingkatKeparahan === 'tinggi') {
        pole.kondisi = 'kritis';
        pole.skorRisikoPrediktif = Math.min(100, Math.max(85, pole.skorRisikoPrediktif + 25));
      } else {
        pole.kondisi = 'waspada';
      }
      this.savePoles();
    }

    this.tickets.unshift(newTicket);
    this.saveTickets();

    // Trigger push notification
    notificationService.sendPushNotification({
      judul: `Laporan Kerusakan Baru: ${data.kodeAset}`,
      pesan: `[${data.tingkatKeparahan.toUpperCase()}] ${data.deskripsi.slice(0, 80)}...`,
      tipe: data.tingkatKeparahan === 'darurat' ? 'critical' : 'warning',
      tiketId: newTicket.id,
      kodeAset: data.kodeAset,
    });

    return newTicket;
  }

  public updateTicketStatus(
    ticketId: string, 
    status: LaporanKerusakan['status'], 
    extra?: { timTeknisi?: string; catatanPerbaikan?: string; materialDigunakan?: string[] }
  ): LaporanKerusakan | undefined {
    const ticket = this.tickets.find((t) => t.id === ticketId);
    if (!ticket) return undefined;

    ticket.status = status;
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    if (status === 'ditugaskan') {
      ticket.waktuDitugaskan = `${new Date().toLocaleDateString('id-ID')} ${now}`;
      if (extra?.timTeknisi) ticket.timTeknisi = extra.timTeknisi;
    } else if (status === 'menuju_lokasi') {
      ticket.waktuMulaiPerbaikan = `${new Date().toLocaleDateString('id-ID')} ${now}`;
    } else if (status === 'selesai') {
      ticket.waktuSelesai = `${new Date().toLocaleDateString('id-ID')} ${now}`;
      if (extra?.catatanPerbaikan) ticket.catatanPerbaikan = extra.catatanPerbaikan;
      if (extra?.materialDigunakan) ticket.materialDigunakan = extra.materialDigunakan;

      // Also restore pole condition
      const pole = this.poles.find((p) => p.id === ticket.tiangId);
      if (pole) {
        pole.kondisi = 'normal';
        pole.skorRisikoPrediktif = Math.max(12, pole.skorRisikoPrediktif - 40);
        this.savePoles();
      }
    }

    if (this.isOffline()) {
      ticket.disinkronkan = false;
      this.offlineQueue.push({
        type: 'update_ticket',
        payload: { ticketId, status, extra },
        timestamp: new Date().toISOString(),
      });
      this.saveQueue();
    } else {
      ticket.disinkronkan = true;
    }

    this.saveTickets();

    notificationService.sendPushNotification({
      judul: `Status Tiket ${ticket.noTiket} Diperbarui`,
      pesan: `Status sekarang: ${status.replace('_', ' ').toUpperCase()}${ticket.timTeknisi ? ` (${ticket.timTeknisi})` : ''}`,
      tipe: status === 'selesai' ? 'success' : 'info',
      tiketId: ticket.id,
      kodeAset: ticket.kodeAset,
    });

    return ticket;
  }

  // Sync offline queue
  public async syncOfflineQueue(): Promise<{ syncedCount: number; message: string }> {
    const count = this.offlineQueue.length;
    if (count === 0) {
      return { syncedCount: 0, message: 'Tidak ada data antrean offline.' };
    }

    // Process all queue items
    this.tickets.forEach((t) => {
      t.disinkronkan = true;
    });
    this.saveTickets();

    this.offlineQueue = [];
    this.saveQueue();

    notificationService.sendPushNotification({
      judul: 'Sinkronisasi Offline Selesai',
      pesan: `${count} item laporan dan audit lapangan berhasil disinkronkan ke server pusat.`,
      tipe: 'success',
    });

    return {
      syncedCount: count,
      message: `Berhasil menyinkronkan ${count} data offline ke basis data utama.`,
    };
  }

  public resetToDefault() {
    this.poles = INITIAL_POLES;
    this.tickets = INITIAL_TICKETS;
    this.offlineQueue = [];
    this.isSimulatedOffline = false;
    this.savePoles();
    this.saveTickets();
    this.saveQueue();
    localStorage.removeItem(STORAGE_KEYS.SIMULATED_OFFLINE);
  }
}

export const dbStorage = new DBStorageService();
