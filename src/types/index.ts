export type PoleCondition = 'normal' | 'waspada' | 'kritis' | 'dalam_perbaikan';
export type PoleMaterial = 'Beton Pratekan' | 'Baja Tubular' | 'Kayu Ulin';
export type PoleHeight = '9m' | '11m' | '12m' | '14m';
export type PoleType = 'JTM 20kV' | 'JTR 380V/220V' | 'Gardu Tiang Trafo (GTT)' | 'Tiang Penegang/Corner';

export interface RepairAuditLog {
  id: string;
  tanggal: string;
  noPerintahKerja: string;
  teknisi: string;
  tindakan: string;
  pergantianKomponen: string[];
  catatanAudit: string;
  fotoUrl?: string;
  statusAkhir: 'Selesai Baik' | 'Perlu Pantauan' | 'Rekomendasi Rekonfigurasi';
}

export interface TiangListrik {
  id: string;
  kodeAset: string;
  nomorSeri: string;
  jenis: PoleType;
  material: PoleMaterial;
  tinggi: PoleHeight;
  tahunPasang: number;
  wilayah: string;
  rayon: string;
  penyulang: string;
  garduInduk: string;
  koordinat: {
    lat: number;
    lng: number;
  };
  alamat: string;
  kondisi: PoleCondition;
  teganganOperasional: string;
  bebanArusAmpere: number;
  kapasitasMaksAmpere: number;
  suhuOperasionalCelsius: number;
  kemiringanDerajat: number; // 0 = tegak sempurna, >5 waspada, >10 kritis
  jarakVegetasiMeter: number; // <1.5m bahaya
  indeksKorosiPersen: number; // 0-100%
  skorRisikoPrediktif: number; // 0-100
  rekomendasiTindakan: string;
  qrCodeData: string;
  terakhirInspeksi: string;
  jadwalInspeksiBerikutnya: string;
  riwayatPerbaikan: RepairAuditLog[];
}

export type DamageSeverity = 'rendah' | 'sedang' | 'tinggi' | 'darurat';
export type DamageCategory = 
  | 'tiang_miring' 
  | 'isolator_pecah' 
  | 'trafo_bocor_meledak' 
  | 'kabel_putus_andongan' 
  | 'terhalang_pohon' 
  | 'korsleting_percikan' 
  | 'korosi_pondasi_amblas';

export type DamageTicketStatus = 
  | 'menunggu' 
  | 'ditugaskan' 
  | 'menuju_lokasi' 
  | 'dalam_perbaikan' 
  | 'uji_coba' 
  | 'selesai';

export interface LaporanKerusakan {
  id: string;
  noTiket: string;
  tiangId: string;
  kodeAset: string;
  jenisKerusakan: DamageCategory;
  tingkatKeparahan: DamageSeverity;
  deskripsi: string;
  fotoUrl: string;
  pelapor: {
    nama: string;
    telepon: string;
    tipe: 'teknisi' | 'petugas_patroli' | 'masyarakat';
  };
  koordinat: {
    lat: number;
    lng: number;
  };
  alamat: string;
  status: DamageTicketStatus;
  timTeknisi: string | null;
  estimasiPengerjaanJam: number;
  waktuLapor: string;
  waktuDitugaskan?: string;
  waktuMulaiPerbaikan?: string;
  waktuSelesai?: string;
  catatanPerbaikan?: string;
  materialDigunakan?: string[];
  disinkronkan: boolean; // for offline queue sync
}

export interface WeatherData {
  wilayah: string;
  suhu: number;
  kondisi: string;
  kecepatanAnginKmH: number;
  curahHujanMmH: number;
  indeksPetir: 'Rendah' | 'Sedang' | 'Tinggi' | 'Ekstrem';
  kelembaban: number;
  peringatanDini?: string;
  terakhirUpdate: string;
}

export interface PushNotificationItem {
  id: string;
  judul: string;
  pesan: string;
  waktu: string;
  tipe: 'info' | 'warning' | 'critical' | 'success';
  tiketId?: string;
  kodeAset?: string;
  dibaca: boolean;
}

export interface UserAccount {
  id: string;
  nama: string;
  email: string;
  role: 'super_admin' | 'supervisor_distribusi' | 'teknisi_lapangan';
  unitKerja: string;
  telepon: string;
  is2FAEnabled: boolean;
  is2FAVerified: boolean;
}
