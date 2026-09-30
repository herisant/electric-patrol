import React, { useState } from 'react';
import { 
  LaporanKerusakan, 
  DamageTicketStatus, 
  DamageSeverity,
  TiangListrik
} from '../types';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Truck, 
  Wrench, 
  Send, 
  Filter, 
  Search, 
  MapPin, 
  Calendar, 
  Phone, 
  ExternalLink,
  ChevronDown,
  Layers
} from 'lucide-react';

interface DamageManagementViewProps {
  tickets: LaporanKerusakan[];
  poles: TiangListrik[];
  onUpdateStatus: (
    ticketId: string, 
    status: DamageTicketStatus, 
    extra?: { timTeknisi?: string; catatanPerbaikan?: string; materialDigunakan?: string[] }
  ) => void;
  onOpenReportModal: () => void;
  onLocatePoleOnMap: (poleId: string) => void;
}

const FIELD_TEAMS = [
  'Tim Reaksi Cepat Sektor Timur (TRC-02)',
  'Tim Pemeliharaan Jaringan (Harjar) Dago',
  'Tim PDKB Tegangan Menengah 20kV',
  'Tim Crane & Rekonstruksi Tiang',
  'Tim Siaga Gangguan Bandung Tengah',
];

export const DamageManagementView: React.FC<DamageManagementViewProps> = ({
  tickets,
  poles,
  onUpdateStatus,
  onOpenReportModal,
  onLocatePoleOnMap,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<LaporanKerusakan | null>(tickets[0] || null);

  // Dispatch modal / drawer state
  const [assignTeam, setAssignTeam] = useState<string>(FIELD_TEAMS[0]);
  const [repairNotes, setRepairNotes] = useState<string>('');
  const [usedMaterials, setUsedMaterials] = useState<string>('');

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && t.tingkatKeparahan !== filterSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNo = t.noTiket.toLowerCase().includes(q);
      const matchAset = t.kodeAset.toLowerCase().includes(q);
      const matchPelapor = t.pelapor.nama.toLowerCase().includes(q);
      const matchAlamat = t.alamat.toLowerCase().includes(q);
      if (!matchNo && !matchAset && !matchPelapor && !matchAlamat) return false;
    }
    return true;
  });

  const getSeverityBadge = (sev: DamageSeverity) => {
    switch (sev) {
      case 'darurat':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded text-[10px] font-bold uppercase animate-pulse">DARURAT</span>;
      case 'tinggi':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-bold uppercase">TINGGI</span>;
      case 'sedang':
        return <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded text-[10px] font-bold uppercase">SEDANG</span>;
      default:
        return <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[10px] font-medium uppercase">RENDAH</span>;
    }
  };

  const getStatusBadge = (status: DamageTicketStatus) => {
    switch (status) {
      case 'menunggu':
        return <span className="bg-rose-950 text-rose-300 px-2 py-0.5 rounded text-[10px] font-semibold border border-rose-800">Menunggu Triage</span>;
      case 'ditugaskan':
        return <span className="bg-amber-950 text-amber-300 px-2 py-0.5 rounded text-[10px] font-semibold border border-amber-800">Ditugaskan</span>;
      case 'menuju_lokasi':
        return <span className="bg-blue-950 text-blue-300 px-2 py-0.5 rounded text-[10px] font-semibold border border-blue-800">Menuju Lokasi</span>;
      case 'dalam_perbaikan':
        return <span className="bg-violet-950 text-violet-300 px-2 py-0.5 rounded text-[10px] font-semibold border border-violet-800">Dalam Perbaikan</span>;
      case 'uji_coba':
        return <span className="bg-teal-950 text-teal-300 px-2 py-0.5 rounded text-[10px] font-semibold border border-teal-800">Uji Beban</span>;
      case 'selesai':
        return <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-800">Selesai (Normal)</span>;
    }
  };

  const currentActiveTicket = selectedTicket || filteredTickets[0] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-white">
      {/* KPI Top Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Total Tiket Masuk</span>
          <div className="text-2xl font-bold font-mono text-white">{tickets.length}</div>
          <span className="text-[11px] text-slate-400">Periode Berjalan</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-rose-900/50">
          <span className="text-xs text-rose-400 block mb-1">Tiket Darurat & Kritis</span>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {tickets.filter((t) => t.tingkatKeparahan === 'darurat' || t.tingkatKeparahan === 'tinggi').length}
          </div>
          <span className="text-[11px] text-slate-400">Prioritas Dispatch</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-amber-900/50">
          <span className="text-xs text-amber-400 block mb-1">Dalam Penanganan Lapangan</span>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {tickets.filter((t) => t.status === 'ditugaskan' || t.status === 'menuju_lokasi' || t.status === 'dalam_perbaikan').length}
          </div>
          <span className="text-[11px] text-slate-400">Tim Sedang Bertugas</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-emerald-900/50">
          <span className="text-xs text-emerald-400 block mb-1">Perbaikan Selesai</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {tickets.filter((t) => t.status === 'selesai').length}
          </div>
          <span className="text-[11px] text-slate-400">Telah Pulih Normal</span>
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row min-h-[620px]">
        {/* Left Column: Ticket List */}
        <div className="w-full lg:w-5/12 border-r border-slate-800 flex flex-col">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-850">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Antrean Tiket Kerusakan</span>
              </h2>
              <button
                onClick={onOpenReportModal}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              >
                + Buat Laporan Baru
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari no tiket, kode tiang, pelapor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Filter pills */}
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
              >
                <option value="all">Semua Status ({tickets.length})</option>
                <option value="menunggu">Menunggu Triage</option>
                <option value="ditugaskan">Ditugaskan</option>
                <option value="menuju_lokasi">Menuju Lokasi</option>
                <option value="dalam_perbaikan">Dalam Perbaikan</option>
                <option value="selesai">Selesai</option>
              </select>

              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
              >
                <option value="all">Semua Urgensi</option>
                <option value="darurat">Darurat</option>
                <option value="tinggi">Tinggi</option>
                <option value="sedang">Sedang</option>
                <option value="rendah">Rendah</option>
              </select>
            </div>
          </div>

          {/* Ticket Items Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Tidak ada tiket kerusakan yang sesuai dengan filter pencarian.
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isSelected = currentActiveTicket?.id === ticket.id;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-4 cursor-pointer transition-colors space-y-2 ${
                      isSelected
                        ? 'bg-slate-800/90 border-l-4 border-amber-500'
                        : 'hover:bg-slate-850/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-400">
                          {ticket.noTiket}
                        </span>
                        <span className="text-white text-xs font-semibold">
                          {ticket.kodeAset}
                        </span>
                      </div>
                      {getSeverityBadge(ticket.tingkatKeparahan)}
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {ticket.deskripsi}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>{getStatusBadge(ticket.status)}</span>
                      <span className="font-mono">{ticket.waktuLapor}</span>
                    </div>

                    {ticket.timTeknisi && (
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-900/60 px-2 py-1 rounded">
                        <Truck className="w-3 h-3 text-sky-400" />
                        <span>{ticket.timTeknisi}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Ticket Dispatch & Action Management */}
        <div className="w-full lg:w-7/12 p-4 sm:p-6 flex flex-col justify-between bg-slate-900/60">
          {currentActiveTicket ? (
            <div className="space-y-6">
              {/* Ticket Top Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-white font-mono">
                      {currentActiveTicket.noTiket}
                    </h3>
                    {getStatusBadge(currentActiveTicket.status)}
                    {getSeverityBadge(currentActiveTicket.tingkatKeparahan)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span>Aset: <strong className="text-white">{currentActiveTicket.kodeAset}</strong></span>
                    <span>·</span>
                    <span>Waktu Masuk: {currentActiveTicket.waktuLapor}</span>
                  </div>
                </div>

                <button
                  onClick={() => onLocatePoleOnMap(currentActiveTicket.tiangId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors shrink-0"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lihat di Peta GIS</span>
                </button>
              </div>

              {/* Photos & Detailed Description */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                  <img
                    src={currentActiveTicket.fotoUrl}
                    alt="Kondisi Kerusakan"
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-2 text-[10px] text-slate-400 text-center bg-slate-900 border-t border-slate-800">
                    Foto Bukti Lapangan
                  </div>
                </div>

                <div className="md:col-span-2 space-y-3">
                  <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 text-xs space-y-1.5">
                    <span className="text-slate-400 block text-[11px]">Uraian Masalah & Gejala</span>
                    <p className="text-slate-200 leading-relaxed font-medium">
                      {currentActiveTicket.deskripsi}
                    </p>
                    <div className="pt-1 text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>{currentActiveTicket.alamat}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 text-xs">
                    <span className="text-slate-400 block text-[11px] mb-1">Identitas Pelapor</span>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>{currentActiveTicket.pelapor.nama} ({currentActiveTicket.pelapor.tipe})</span>
                      <a
                        href={`tel:${currentActiveTicket.pelapor.telepon}`}
                        className="text-amber-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        <Phone className="w-3 h-3" />
                        {currentActiveTicket.pelapor.telepon}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technician Dispatch Form & Lifecycle Buttons */}
              <div className="p-4 rounded-xl bg-slate-850 border border-slate-700 space-y-4">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Alur Dispatch & Pembaruan Status Lapangan (Push Real-Time)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Tugaskan Tim Teknisi Lapangan</label>
                    <select
                      value={assignTeam}
                      onChange={(e) => setAssignTeam(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      {FIELD_TEAMS.map((team) => (
                        <option key={team} value={team}>{team}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Material yang Digunakan (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: Guy Wire M16, Isolator Pin Post 24kV"
                      value={usedMaterials}
                      onChange={(e) => setUsedMaterials(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Catatan Pekerjaan / Hasil Uji Coba</label>
                  <input
                    type="text"
                    placeholder="Contoh: Penguatan treckskoor selesai, tegangan fase normal R-S-T 20.2kV..."
                    value={repairNotes}
                    onChange={(e) => setRepairNotes(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                {/* Status Advancement Buttons */}
                <div className="pt-2 border-t border-slate-700/60 flex flex-wrap gap-2">
                  <button
                    onClick={() => onUpdateStatus(currentActiveTicket.id, 'ditugaskan', { timTeknisi: assignTeam })}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Tugaskan Tim ({assignTeam.split(' ')[0]})</span>
                  </button>

                  <button
                    onClick={() => onUpdateStatus(currentActiveTicket.id, 'menuju_lokasi')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Tim Menuju Lokasi</span>
                  </button>

                  <button
                    onClick={() => onUpdateStatus(currentActiveTicket.id, 'dalam_perbaikan')}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Mulai Perbaikan Fisik</span>
                  </button>

                  <button
                    onClick={() => {
                      const mats = usedMaterials ? usedMaterials.split(',').map((s) => s.trim()) : [];
                      onUpdateStatus(currentActiveTicket.id, 'selesai', {
                        catatanPerbaikan: repairNotes || 'Perbaikan selesai dengan pengujian isolasi normal.',
                        materialDigunakan: mats,
                      });
                    }}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-900/30"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Selesaikan Tiket & Pulihkan Jaringan</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Pilih tiket di sebelah kiri untuk melihat detail dan melakukan dispatch teknisi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
