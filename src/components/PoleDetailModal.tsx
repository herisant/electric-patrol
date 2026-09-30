import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  TiangListrik, 
  RepairAuditLog 
} from '../types';
import { 
  X, 
  AlertTriangle, 
  Compass, 
  Thermometer, 
  Zap, 
  Trees, 
  ShieldAlert, 
  Download, 
  Calendar, 
  CheckCircle2, 
  Wrench, 
  User, 
  Clock,
  Plus
} from 'lucide-react';

interface PoleDetailModalProps {
  pole: TiangListrik | null;
  onClose: () => void;
  onReportDamage: (pole: TiangListrik) => void;
  onAddAuditLog: (pole: TiangListrik) => void;
}

export const PoleDetailModal: React.FC<PoleDetailModalProps> = ({
  pole,
  onClose,
  onReportDamage,
  onAddAuditLog,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'spek' | 'telemetri' | 'audit' | 'qr'>('spek');

  if (!pole) return null;

  // Download QR Code SVG
  const handleDownloadQr = () => {
    const svgElement = document.getElementById(`qr-svg-${pole.id}`);
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 400, 400);
        ctx.drawImage(img, 20, 20, 360, 360);
      }
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_Aset_${pole.kodeAset}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const getStatusBadge = () => {
    switch (pole.kondisi) {
      case 'kritis':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-md text-xs font-semibold">KRITIS / BAHAYA</span>;
      case 'waspada':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-md text-xs font-semibold">PERLU PERHATIAN</span>;
      case 'dalam_perbaikan':
        return <span className="bg-violet-500/20 text-violet-300 border border-violet-500/40 px-2.5 py-1 rounded-md text-xs font-semibold">DALAM PERBAIKAN</span>;
      default:
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-md text-xs font-semibold">NORMAL / AMAN</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-white">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-start justify-between bg-slate-850">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight text-white">{pole.kodeAset}</h2>
              {getStatusBadge()}
            </div>
            <p className="text-xs text-slate-400 font-mono">
              SN: {pole.nomorSeri} · {pole.jenis} ({pole.material})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveSubTab('spek')}
            className={`py-3 px-2 border-b-2 transition-colors ${
              activeSubTab === 'spek'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Spesifikasi Aset
          </button>
          <button
            onClick={() => setActiveSubTab('telemetri')}
            className={`py-3 px-2 border-b-2 transition-colors ${
              activeSubTab === 'telemetri'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Telemetri & Analisis Risiko
          </button>
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`py-3 px-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'audit'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Riwayat Audit & WO</span>
            <span className="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full text-[10px]">
              {pole.riwayatPerbaikan.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('qr')}
            className={`py-3 px-2 border-b-2 transition-colors ${
              activeSubTab === 'qr'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            QR Code Lapangan
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeSubTab === 'spek' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block mb-1">Wilayah & Rayon</span>
                  <span className="text-white font-medium">{pole.wilayah} · {pole.rayon}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block mb-1">Penyulang & Gardu Induk</span>
                  <span className="text-white font-medium">{pole.penyulang} · {pole.garduInduk}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block mb-1">Tinggi & Tahun Pasang</span>
                  <span className="text-white font-medium">{pole.tinggi} · Tahun {pole.tahunPasang} (Usia: {2026 - pole.tahunPasang} tahun)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block mb-1">Tegangan Operasional</span>
                  <span className="text-amber-400 font-bold font-mono">{pole.teganganOperasional}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
                <span className="text-slate-400 block mb-1">Lokasi Geografis & Alamat</span>
                <p className="text-white mb-1.5">{pole.alamat}</p>
                <div className="font-mono text-slate-400 text-[11px]">
                  GPS: {pole.koordinat.lat.toFixed(6)}, {pole.koordinat.lng.toFixed(6)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Inspeksi Terakhir</span>
                  <span className="text-slate-200">{pole.terakhirInspeksi}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Jadwal Inspeksi Berikutnya</span>
                  <span className="text-slate-200">{pole.jadwalInspeksiBerikutnya}</span>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'telemetri' && (
            <div className="space-y-5">
              {/* Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Kemiringan */}
                <div className={`p-3.5 rounded-xl border ${
                  pole.kemiringanDerajat > 6 
                    ? 'bg-rose-950/40 border-rose-800 text-rose-300' 
                    : 'bg-slate-800/70 border-slate-700 text-slate-300'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-400">Kemiringan</span>
                    <Compass className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-lg font-bold font-mono text-white">
                    {pole.kemiringanDerajat}°
                  </div>
                  <span className="text-[10px]">
                    {pole.kemiringanDerajat > 6 ? 'Kritis (>5°)' : 'Toleransi Normal'}
                  </span>
                </div>

                {/* Beban Arus */}
                <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-400">Beban Arus</span>
                    <Zap className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="text-lg font-bold font-mono text-white">
                    {pole.bebanArusAmpere} A
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Maks {pole.kapasitasMaksAmpere}A ({Math.round((pole.bebanArusAmpere / pole.kapasitasMaksAmpere) * 100)}%)
                  </span>
                </div>

                {/* Suhu Operasional */}
                <div className={`p-3.5 rounded-xl border ${
                  pole.suhuOperasionalCelsius > 65 
                    ? 'bg-rose-950/40 border-rose-800 text-rose-300' 
                    : 'bg-slate-800/70 border-slate-700 text-slate-300'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-400">Suhu Termal</span>
                    <Thermometer className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-lg font-bold font-mono text-white">
                    {pole.suhuOperasionalCelsius}°C
                  </div>
                  <span className="text-[10px]">
                    {pole.suhuOperasionalCelsius > 65 ? 'Anomali Panas' : 'Dalam Batas'}
                  </span>
                </div>

                {/* Jarak Pohon / ROW */}
                <div className={`p-3.5 rounded-xl border ${
                  pole.jarakVegetasiMeter < 1.5 
                    ? 'bg-amber-950/40 border-amber-800 text-amber-300' 
                    : 'bg-slate-800/70 border-slate-700 text-slate-300'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-400">Jarak ROW Dahan</span>
                    <Trees className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-lg font-bold font-mono text-white">
                    {pole.jarakVegetasiMeter} m
                  </div>
                  <span className="text-[10px]">
                    {pole.jarakVegetasiMeter < 1.5 ? 'Perlu Rabas Segera' : 'Jarak Aman'}
                  </span>
                </div>
              </div>

              {/* Predictive Risk Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-850 to-slate-800 border border-slate-700">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Analisis Risiko Prediktif Kegagalan (AI)
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">
                      {pole.rekomendasiTindakan}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-black font-mono text-white">
                      {pole.skorRisikoPrediktif}%
                    </div>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                      pole.skorRisikoPrediktif > 70 
                        ? 'bg-rose-500/20 text-rose-300' 
                        : pole.skorRisikoPrediktif > 40 
                        ? 'bg-amber-500/20 text-amber-300' 
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {pole.skorRisikoPrediktif > 70 ? 'Risiko Kritis' : pole.skorRisikoPrediktif > 40 ? 'Risiko Sedang' : 'Risiko Rendah'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                  <span>Indeks Korosi Struktur: <strong className="text-white">{pole.indeksKorosiPersen}%</strong></span>
                  <span>Probabilitas Trip 30 Hari: <strong className="text-white">{Math.round(pole.skorRisikoPrediktif * 0.85)}%</strong></span>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Log Audit Perbaikan & Perintah Kerja (WO)
                </span>
                <button
                  onClick={() => onAddAuditLog(pole)}
                  className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Catat Audit Baru</span>
                </button>
              </div>

              {pole.riwayatPerbaikan.length === 0 ? (
                <div className="p-8 text-center bg-slate-800/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
                  Belum ada catatan riwayat perbaikan fisik pada tiang ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {pole.riwayatPerbaikan.map((audit) => (
                    <div
                      key={audit.id}
                      className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="font-semibold text-white">{audit.noPerintahKerja}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {audit.tanggal}
                        </span>
                      </div>
                      <p className="text-slate-200">
                        <strong>Tindakan:</strong> {audit.tindakan}
                      </p>
                      <div className="text-slate-400">
                        <strong>Komponen Diganti:</strong>{' '}
                        {audit.pergantianKomponen.join(', ') || 'Tidak ada pergantian material'}
                      </div>
                      <div className="p-2 rounded bg-slate-900/60 text-slate-300 text-[11px] italic">
                        &ldquo;{audit.catatanAudit}&rdquo;
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {audit.teknisi}
                        </span>
                        <span className="text-emerald-400 font-medium">{audit.statusAkhir}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'qr' && (
            <div className="p-6 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-amber-500">
                <QRCodeSVG
                  id={`qr-svg-${pole.id}`}
                  value={pole.qrCodeData}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="space-y-1">
                <div className="font-mono text-sm font-bold text-amber-400">{pole.qrCodeData}</div>
                <p className="text-xs text-slate-400 max-w-sm">
                  Pindai QR ini langsung di tiang fisik menggunakan kamera aplikasi untuk melihat riwayat audit dan mempercepat verifikasi lapangan.
                </p>
              </div>

              <button
                onClick={handleDownloadQr}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors shadow-lg"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Unduh Tag QR Code (PNG)</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-850 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => onReportDamage(pole)}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-rose-900/30 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Laporkan Kerusakan Tiang Ini</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddAuditLog(pole)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 transition-colors"
            >
              Catat Audit Lapangan
            </button>
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
