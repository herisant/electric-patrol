import React, { useState } from 'react';
import { 
  TiangListrik, 
  LaporanKerusakan 
} from '../types';
import { PDFReportGenerator } from '../services/pdfReportGenerator';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  Calendar, 
  TrendingDown, 
  Clock, 
  ShieldCheck, 
  BarChart3,
  Award
} from 'lucide-react';

interface ReportsViewProps {
  poles: TiangListrik[];
  tickets: LaporanKerusakan[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ poles, tickets }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('September 2026');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  const handleDownloadPdf = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const filename = PDFReportGenerator.generateMonthlyReport(poles, tickets, selectedMonth);
        setIsGenerating(false);
        setDownloadSuccessMessage(`Laporan PDF '${filename}' berhasil diunduh ke perangkat Anda.`);
        setTimeout(() => setDownloadSuccessMessage(null), 5000);
      } catch (err) {
        setIsGenerating(false);
        alert('Gagal membuat file PDF. Silakan coba lagi.');
      }
    }, 600);
  };

  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter((t) => t.status === 'selesai').length;
  const normalPoles = poles.filter((p) => p.kondisi === 'normal').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-white">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Laporan Analitik Keandalan & Audit Distribusi Bulanan
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Kalkulasi otomatis SAIDI, SAIFI, MTTR, riwayat audit QR code lapangan, dan kompilasi eksekutif siap cetak/unduh PDF.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="September 2026">September 2026</option>
            <option value="Agustus 2026">Agustus 2026</option>
            <option value="Juli 2026">Juli 2026</option>
          </select>

          <button
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? 'Membuat Dokumen PDF...' : 'Unduh Laporan PDF Resmi'}</span>
          </button>
        </div>
      </div>

      {downloadSuccessMessage && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{downloadSuccessMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Indeks SAIDI (Durasi Padam)</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">2.4 Min</div>
          <span className="text-[11px] text-slate-400">Target PLN: &lt; 5.0 Min/Pelanggan</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Indeks SAIFI (Frekuensi Padam)</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">0.18 Kali</div>
          <span className="text-[11px] text-slate-400">Target: &lt; 0.40 Kali/Bulan</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Rata-rata Waktu Perbaikan (MTTR)</span>
          <div className="text-2xl font-bold font-mono text-amber-400">1j 45m</div>
          <span className="text-[11px] text-slate-400">Turun 28% berkat QR & Dispatch</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Audit Lapangan QR Sesuai Jadwal</span>
          <div className="text-2xl font-bold font-mono text-white">94.2%</div>
          <span className="text-[11px] text-slate-400">Kepatuhan Tim Inspeksi</span>
        </div>
      </div>

      {/* Report Preview Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">
              Pratinjau Lembar Ringkasan Eksekutif ({selectedMonth})
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Dokumen No: RPT-DIST-{selectedMonth.slice(0, 3).toUpperCase()}-2026
          </span>
        </div>

        {/* Section 1: Grid Health */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            1. Distribusi Kondisi Fisik Tiang Listrik & Transformator
          </h3>
          <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Tiang Normal / Prima</span>
                <span className="font-mono text-emerald-400">{normalPoles} dari {poles.length} Unit ({Math.round((normalPoles / poles.length) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${(normalPoles / poles.length) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Tiang Waspada (ROW Ranting & Suhu Sedang)</span>
                <span className="font-mono text-amber-400">
                  {poles.filter((p) => p.kondisi === 'waspada').length} Unit
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: `${(poles.filter((p) => p.kondisi === 'waspada').length / poles.length) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Tiang Kritis (Kemiringan Fondasi / Overload)</span>
                <span className="font-mono text-rose-400">
                  {poles.filter((p) => p.kondisi === 'kritis').length} Unit
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full" style={{ width: `${(poles.filter((p) => p.kondisi === 'kritis').length / poles.length) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Ticket Summary Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            2. Rekapitulasi Gangguan & Penanganan Tiket Bulan Ini
          </h3>
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-850 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">No Tiket</th>
                  <th className="py-2.5 px-3">Kode Aset</th>
                  <th className="py-2.5 px-3">Jenis Gangguan</th>
                  <th className="py-2.5 px-3">Urgensi</th>
                  <th className="py-2.5 px-3">Waktu Lapor</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Tim Pelaksana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tickets.slice(0, 5).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-850/40">
                    <td className="py-2.5 px-3 font-mono text-amber-400 font-bold">{t.noTiket}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{t.kodeAset}</td>
                    <td className="py-2.5 px-3 text-slate-300">{t.jenisKerusakan.replace(/_/g, ' ')}</td>
                    <td className="py-2.5 px-3 uppercase text-[10px] font-bold">{t.tingkatKeparahan}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{t.waktuLapor}</td>
                    <td className="py-2.5 px-3">
                      <span className="capitalize">{t.status.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{t.timTeknisi || 'Dalam Antrean'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Official Approval Preview */}
        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 text-xs flex flex-col sm:flex-row justify-between gap-4">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px]">Diverifikasi oleh:</span>
            <p className="font-bold text-white">Bambang Sudarmono, S.T.</p>
            <p className="text-slate-400 text-[11px]">Supervisor Pemeliharaan Distribusi (NIP: 198403152010121004)</p>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-slate-400 text-[11px]">Disetujui oleh:</span>
            <p className="font-bold text-white">Ir. Hendra Gunawan, M.Eng.</p>
            <p className="text-slate-400 text-[11px]">Manajer Bagian Jaringan & K3L (NIP: 197806212003121001)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
