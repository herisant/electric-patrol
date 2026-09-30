import React, { useState } from 'react';
import { 
  TiangListrik, 
  DamageCategory, 
  DamageSeverity, 
  LaporanKerusakan 
} from '../types';
import { 
  X, 
  AlertTriangle, 
  Camera, 
  MapPin, 
  User, 
  Phone, 
  Send, 
  CheckCircle,
  WifiOff,
  Image as ImageIcon
} from 'lucide-react';

interface ReportDamageModalProps {
  poles: TiangListrik[];
  initialPole?: TiangListrik | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (reportData: Omit<LaporanKerusakan, 'id' | 'noTiket' | 'waktuLapor' | 'disinkronkan'>) => void;
  isOffline: boolean;
}

const PRESET_PHOTOS = [
  {
    name: 'Tiang Miring 9°',
    url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Trafo Overheat & Bocor',
    url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Pohon Menindih Kabel',
    url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Isolator Pecah',
    url: 'https://images.unsplash.com/photo-1509390144018-eeaf6501704a?auto=format&fit=crop&w=600&q=80',
  },
];

export const ReportDamageModal: React.FC<ReportDamageModalProps> = ({
  poles,
  initialPole,
  isOpen,
  onClose,
  onSubmitReport,
  isOffline,
}) => {
  const [selectedPoleId, setSelectedPoleId] = useState<string>(
    initialPole ? initialPole.id : (poles[0]?.id || '')
  );
  const [jenisKerusakan, setJenisKerusakan] = useState<DamageCategory>('tiang_miring');
  const [tingkatKeparahan, setTingkatKeparahan] = useState<DamageSeverity>('tinggi');
  const [deskripsi, setDeskripsi] = useState<string>('');
  const [fotoUrl, setFotoUrl] = useState<string>(PRESET_PHOTOS[0].url);
  const [namaPelapor, setNamaPelapor] = useState<string>('Ahmad Fauzi (Teknisi TRC)');
  const [teleponPelapor, setTeleponPelapor] = useState<string>('081298765432');
  const [tipePelapor, setTipePelapor] = useState<'teknisi' | 'petugas_patroli' | 'masyarakat'>('teknisi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdTicketNo, setCreatedTicketNo] = useState('');

  if (!isOpen) return null;

  const currentPole = poles.find((p) => p.id === selectedPoleId) || initialPole || poles[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPole) return;

    setIsSubmitting(true);

    const reportPayload: Omit<LaporanKerusakan, 'id' | 'noTiket' | 'waktuLapor' | 'disinkronkan'> = {
      tiangId: currentPole.id,
      kodeAset: currentPole.kodeAset,
      jenisKerusakan,
      tingkatKeparahan,
      deskripsi: deskripsi || `Terjadi indikasi ${jenisKerusakan.replace(/_/g, ' ')} pada ${currentPole.kodeAset}. Memerlukan penanganan segera di lapangan.`,
      fotoUrl,
      pelapor: {
        nama: namaPelapor,
        telepon: teleponPelapor,
        tipe: tipePelapor,
      },
      koordinat: {
        lat: currentPole.koordinat.lat,
        lng: currentPole.koordinat.lng,
      },
      alamat: currentPole.alamat,
      status: 'menunggu',
      timTeknisi: null,
      estimasiPengerjaanJam: tingkatKeparahan === 'darurat' ? 3.5 : 2,
    };

    setTimeout(() => {
      onSubmitReport(reportPayload);
      setIsSubmitting(false);
      setIsSuccess(true);
      setCreatedTicketNo(`TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`);
    }, 400);
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setDeskripsi('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Pelaporan Kerusakan Tiang Listrik Real-Time
              </h2>
              <p className="text-xs text-slate-400">
                Peringatan otomatis terdistribusi langsung ke tim teknisi siaga
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Offline notice inside modal */}
        {isOffline && (
          <div className="bg-amber-600/20 border-b border-amber-600/40 px-6 py-2 text-xs text-amber-300 flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Mode Minim Sinyal Aktif: Laporan akan disimpan di antrean lokal perangkat dan otomatis disinkronkan ke server saat kembali online.</span>
          </div>
        )}

        {/* Success View */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Laporan Kerusakan Berhasil Didaftarkan!</h3>
              <p className="text-xs text-slate-400">
                Nomor Tiket: <span className="font-mono text-amber-400 font-bold">{createdTicketNo}</span>
              </p>
              <p className="text-xs text-slate-300 max-w-md mx-auto pt-2">
                Notifikasi push telah dikirimkan ke Tim Siaga Rayon {currentPole?.rayon}. Status tiket dapat dipantau langsung pada menu Manajemen Kerusakan.
              </p>
            </div>
            <div className="pt-4">
              <button
                onClick={handleResetAndClose}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2 rounded-xl text-xs transition-colors"
              >
                Selesai & Lihat Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Pole Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Pilih Tiang Listrik / Kode Aset Terindikasi
              </label>
              <select
                value={selectedPoleId}
                onChange={(e) => setSelectedPoleId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {poles.map((pole) => (
                  <option key={pole.id} value={pole.id}>
                    {pole.kodeAset} · {pole.penyulang} · ({pole.alamat.slice(0, 45)}...)
                  </option>
                ))}
              </select>
              {currentPole && (
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{currentPole.alamat} (GPS: {currentPole.koordinat.lat.toFixed(5)}, {currentPole.koordinat.lng.toFixed(5)})</span>
                </div>
              )}
            </div>

            {/* Damage Category & Severity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kategori Gangguan / Kerusakan
                </label>
                <select
                  value={jenisKerusakan}
                  onChange={(e) => setJenisKerusakan(e.target.value as DamageCategory)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="tiang_miring">Tiang Miring / Roboh</option>
                  <option value="isolator_pecah">Isolator Pecah / Flashover</option>
                  <option value="trafo_bocor_meledak">Trafo Bocor / Meledak / Suhu Panas</option>
                  <option value="kabel_putus_andongan">Kabel Putus / Andongan Rendah</option>
                  <option value="terhalang_pohon">Tertimpa / Terhalang Ranting Pohon</option>
                  <option value="korsleting_percikan">Korsleting / Percikan Api Listrik</option>
                  <option value="korosi_pondasi_amblas">Korosi Parah / Pondasi Amblas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tingkat Keparahan / Urgensi
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['rendah', 'sedang', 'tinggi', 'darurat'] as DamageSeverity[]).map((sev) => {
                    const isSelected = tingkatKeparahan === sev;
                    return (
                      <button
                        type="button"
                        key={sev}
                        onClick={() => setTingkatKeparahan(sev)}
                        className={`py-2 px-1 text-[11px] font-bold rounded-lg uppercase tracking-wider transition-colors ${
                          isSelected
                            ? sev === 'darurat'
                              ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40'
                              : sev === 'tinggi'
                              ? 'bg-amber-600 text-white'
                              : 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {sev}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Description Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Deskripsi Kondisi Lapangan & Gejala
              </label>
              <textarea
                rows={3}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Contoh: Tiang condong ke arah jalan raya sekitar 8 derajat akibat tanah pondasi terkikis aliran air drainase..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Photo Selection / Upload Simulator */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Foto Bukti Kerusakan Fisik</span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5" /> Kamera Lapangan Aktif
                </span>
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                {PRESET_PHOTOS.map((preset) => (
                  <button
                    type="button"
                    key={preset.name}
                    onClick={() => setFotoUrl(preset.url)}
                    className={`relative rounded-lg overflow-hidden border-2 text-left transition-all ${
                      fotoUrl === preset.url ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-16 object-cover" />
                    <span className="block p-1 text-[10px] bg-slate-900/90 text-slate-200 truncate">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={fotoUrl}
                  onChange={(e) => setFotoUrl(e.target.value)}
                  placeholder="URL Foto atau tautan kamera..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Reporter Profile */}
            <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-300 block">Identitas Pelapor</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={namaPelapor}
                    onChange={(e) => setNamaPelapor(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Nomor Telepon / WA</label>
                  <input
                    type="text"
                    required
                    value={teleponPelapor}
                    onChange={(e) => setTeleponPelapor(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Kategori Pelapor</label>
                  <select
                    value={tipePelapor}
                    onChange={(e) => setTipePelapor(e.target.value as 'teknisi' | 'petugas_patroli' | 'masyarakat')}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                  >
                    <option value="teknisi">Teknisi Lapangan</option>
                    <option value="petugas_patroli">Petugas Patroli Jaringan</option>
                    <option value="masyarakat">Laporan Warga / Publik</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Mengirimkan Tiket...' : 'Kirim Laporan & Notifikasi Teknisi'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
