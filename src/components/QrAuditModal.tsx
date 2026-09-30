import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  TiangListrik, 
  RepairAuditLog 
} from '../types';
import { 
  X, 
  QrCode, 
  Camera, 
  Search, 
  CheckCircle, 
  Calendar, 
  Wrench, 
  User, 
  FileCheck, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface QrAuditModalProps {
  poles: TiangListrik[];
  initialPole?: TiangListrik | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveAudit: (poleId: string, log: Omit<RepairAuditLog, 'id'>) => void;
}

export const QrAuditModal: React.FC<QrAuditModalProps> = ({
  poles,
  initialPole,
  isOpen,
  onClose,
  onSaveAudit,
}) => {
  const [selectedPole, setSelectedPole] = useState<TiangListrik | null>(
    initialPole || poles[0] || null
  );
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');
  const [isAuditFormOpen, setIsAuditFormOpen] = useState<boolean>(false);

  // Form states
  const [noPerintahKerja, setNoPerintahKerja] = useState<string>(
    `WO-BDG-2026-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [namaTeknisi, setNamaTeknisi] = useState<string>('Ahmad Fauzi & Tim Alfa');
  const [tindakan, setTindakan] = useState<string>('');
  const [komponen, setKomponen] = useState<string>('');
  const [catatanAudit, setCatatanAudit] = useState<string>('');
  const [statusAkhir, setStatusAkhir] = useState<'Selesai Baik' | 'Perlu Pantauan' | 'Rekomendasi Rekonfigurasi'>('Selesai Baik');
  const [isSuccessSave, setIsSuccessSave] = useState<boolean>(false);

  if (!isOpen) return null;

  // Handle simulated scan
  const handleSimulateScan = (pole: TiangListrik) => {
    setIsScanning(true);
    setTimeout(() => {
      setSelectedPole(pole);
      setIsScanning(false);
    }, 600);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = manualCode.trim().toLowerCase();
    const found = poles.find(
      (p) => p.qrCodeData.toLowerCase().includes(q) || p.kodeAset.toLowerCase().includes(q)
    );
    if (found) {
      setSelectedPole(found);
    } else {
      alert(`Kode QR '${manualCode}' tidak ditemukan.`);
    }
  };

  const handleSubmitAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPole) return;

    const componentsList = komponen
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    onSaveAudit(selectedPole.id, {
      tanggal: new Date().toISOString().slice(0, 10),
      noPerintahKerja,
      teknisi: namaTeknisi,
      tindakan: tindakan || 'Inspeksi berkala struktur tiang dan pengukuran tahanan isolasi JTM.',
      pergantianKomponen: componentsList.length > 0 ? componentsList : ['Pemeriksaan Tanpa Penggantian Part'],
      catatanAudit: catatanAudit || 'Hasil audit visual dan uji fungsional memenuhi standar SPLN D3.',
      statusAkhir,
    });

    setIsSuccessSave(true);
    setTimeout(() => {
      setIsSuccessSave(false);
      setIsAuditFormOpen(false);
      setTindakan('');
      setKomponen('');
      setCatatanAudit('');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-white max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Audit Lapangan & Pelacakan Riwayat QR Code
              </h2>
              <p className="text-xs text-slate-400">
                Pindai barcode fisik pada tiang untuk verifikasi data dan catat berita acara pemeliharaan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Scanner Simulation & Pole Picker */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Camera Scanner Simulation Frame */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden min-h-[220px]">
              {isScanning ? (
                <div className="space-y-3 text-center">
                  <div className="relative w-36 h-36 border-2 border-amber-400/80 rounded-xl overflow-hidden mx-auto flex items-center justify-center bg-amber-950/20">
                    <div className="absolute inset-x-0 h-0.5 bg-amber-400 animate-pulse top-1/2 -translate-y-1/2 shadow-lg shadow-amber-400/50" />
                    <Camera className="w-8 h-8 text-amber-400/60" />
                  </div>
                  <p className="text-xs text-amber-300 font-mono animate-pulse">
                    Memindai barcode tiang...
                  </p>
                </div>
              ) : (
                <div className="space-y-3 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
                    <QrCode className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-white">Kamera Scanner Lapangan</p>
                    <p className="text-[11px] text-slate-400 max-w-xs">
                      Arahkan lensa kamera perangkat ke pelat barcode QR tiang listrik di lokasi.
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Preset Scan Selectors */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 w-full flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Simulasi Scan Cepat:</span>
                <div className="flex gap-1.5">
                  {poles.slice(0, 3).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSimulateScan(p)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 text-[10px] font-mono border border-slate-700"
                    >
                      {p.kodeAset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Manual Lookup Input */}
            <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">
                  Pencarian Manual Kode Tag / Nomor Seri
                </span>
                <form onSubmit={handleManualSearch} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contoh: TL-BDG-014 atau PLN-TL..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs flex items-center gap-1"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Cari</span>
                  </button>
                </form>

                <div className="pt-2">
                  <span className="text-[11px] text-slate-400 block mb-1">
                    Atau pilih tiang dari daftar aset:
                  </span>
                  <select
                    value={selectedPole?.id || ''}
                    onChange={(e) => {
                      const found = poles.find((p) => p.id === e.target.value);
                      if (found) setSelectedPole(found);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {poles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.kodeAset} · {p.jenis} ({p.wilayah})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedPole && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-xs">
                  <div className="flex items-center justify-between font-semibold text-white mb-1">
                    <span>{selectedPole.kodeAset}</span>
                    <span className="font-mono text-amber-400">{selectedPole.teganganOperasional}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{selectedPole.alamat}</p>
                </div>
              )}
            </div>
          </div>

          {/* Selected Pole Audit Details */}
          {selectedPole && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Data Riwayat Audit Lapangan: {selectedPole.kodeAset}
                  </span>
                </div>
                <button
                  onClick={() => setIsAuditFormOpen(!isAuditFormOpen)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{isAuditFormOpen ? 'Tutup Form Audit' : '+ Catat Berita Acara Audit'}</span>
                </button>
              </div>

              {/* Form Input Audit */}
              {isAuditFormOpen && (
                <form
                  onSubmit={handleSubmitAudit}
                  className="p-4 rounded-xl bg-slate-850 border border-amber-500/40 space-y-3 animate-in fade-in"
                >
                  {isSuccessSave && (
                    <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Berita Acara Audit Lapangan Berhasil Disimpan & Sinkron!</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-300 mb-1">Nomor Perintah Kerja (WO)</label>
                      <input
                        type="text"
                        required
                        value={noPerintahKerja}
                        onChange={(e) => setNoPerintahKerja(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">Nama Teknisi / Tim Auditor</label>
                      <input
                        type="text"
                        required
                        value={namaTeknisi}
                        onChange={(e) => setNamaTeknisi(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="block text-slate-300 mb-1">Tindakan / Pekerjaan Lapangan</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Penggantian isolator tumpu 20kV, pengencangan baut travers, pemangkasan ranting..."
                      value={tindakan}
                      onChange={(e) => setTindakan(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-300 mb-1">Komponen yang Diganti (Pisahkan koma)</label>
                      <input
                        type="text"
                        placeholder="Contoh: Pin Post 20kV, Baut M16, Fuse Cut Out"
                        value={komponen}
                        onChange={(e) => setKomponen(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">Status Rekomendasi Akhir</label>
                      <select
                        value={statusAkhir}
                        onChange={(e) => setStatusAkhir(e.target.value as any)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      >
                        <option value="Selesai Baik">Selesai Baik (Aman Beroperasi)</option>
                        <option value="Perlu Pantauan">Perlu Pantauan (Observasi Berkala)</option>
                        <option value="Rekomendasi Rekonfigurasi">Rekomendasi Rekonfigurasi / Relokasi</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="block text-slate-300 mb-1">Catatan Audit & Pengukuran Lapangan</label>
                    <textarea
                      rows={2}
                      placeholder="Catatan hasil pengukuran megger (tahanan isolasi), grounding pentanahan, kondisi pondasi tanah..."
                      value={catatanAudit}
                      onChange={(e) => setCatatanAudit(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAuditFormOpen(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
                    >
                      Simpan & Tanda Tangani Audit
                    </button>
                  </div>
                </form>
              )}

              {/* Audit Timeline */}
              <div className="space-y-3">
                {selectedPole.riwayatPerbaikan.length === 0 ? (
                  <div className="p-6 text-center bg-slate-850 rounded-xl border border-slate-800 text-slate-400 text-xs">
                    Belum ada riwayat perbaikan atau audit lapangan tercatat untuk tiang ini.
                  </div>
                ) : (
                  selectedPole.riwayatPerbaikan.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 text-xs space-y-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">{item.noPerintahKerja}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-300 font-medium">{item.tindakan}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5" />
                          {item.tanggal}
                        </span>
                      </div>

                      <div className="text-slate-400 text-[11px]">
                        <strong>Material / Komponen:</strong> {item.pergantianKomponen.join(', ') || 'N/A'}
                      </div>

                      <div className="p-2 rounded bg-slate-900 text-slate-300 text-[11px] italic">
                        &ldquo;{item.catatanAudit}&rdquo;
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {item.teknisi}
                        </span>
                        <span className="text-emerald-400 font-semibold">{item.statusAkhir}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
