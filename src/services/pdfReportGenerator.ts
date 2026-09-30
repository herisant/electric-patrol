import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TiangListrik, LaporanKerusakan } from '../types';

export class PDFReportGenerator {
  public static generateMonthlyReport(
    poles: TiangListrik[],
    tickets: LaporanKerusakan[],
    monthYear = 'September 2026'
  ) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Color definitions
    const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
    const accentColor: [number, number, number] = [217, 119, 6]; // Amber 600

    // Header Band
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 36, 'F');

    // Title & Logo
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('VOLTGRID - LAPORAN ANALITIK KEANDALAN ASET DISTRIBUSI', 14, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(203, 213, 225);
    doc.text(`Divisi Manajemen Jaringan Distribusi Tenaga Listrik · Periode: ${monthYear}`, 14, 24);
    doc.text(`Waktu Cetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')} WIB`, 14, 30);

    // KPI Summary Section
    let currentY = 46;
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('I. RINGKASAN EKSEKUTIF & INDIKATOR KINERJA UTAMA (KPI)', 14, currentY);

    currentY += 6;
    const totalPoles = poles.length;
    const criticalPoles = poles.filter((p) => p.kondisi === 'kritis').length;
    const warningPoles = poles.filter((p) => p.kondisi === 'waspada').length;
    const normalPoles = poles.filter((p) => p.kondisi === 'normal').length;
    const resolvedTickets = tickets.filter((t) => t.status === 'selesai').length;
    const openTickets = tickets.filter((t) => t.status !== 'selesai').length;

    // KPI Cards Matrix
    const kpis = [
      { label: 'Total Aset Tiang', value: `${totalPoles} Unit`, color: [30, 41, 59] },
      { label: 'Kondisi Normal', value: `${normalPoles} (${Math.round((normalPoles / totalPoles) * 100)}%)`, color: [22, 101, 52] },
      { label: 'Aset Kritis / Bahaya', value: `${criticalPoles} Unit`, color: [153, 27, 27] },
      { label: 'Total Laporan Gangguan', value: `${tickets.length} Kasus`, color: [30, 41, 59] },
      { label: 'Tiket Terselesaikan', value: `${resolvedTickets} (${Math.round((resolvedTickets / (tickets.length || 1)) * 100)}%)`, color: [22, 101, 52] },
      { label: 'Rata-rata Waktu Perbaikan (MTTR)', value: '1 Jam 45 Menit', color: [180, 83, 9] },
    ];

    const boxWidth = 58;
    const boxHeight = 16;
    let startX = 14;
    let rowY = currentY;

    kpis.forEach((kpi, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const x = startX + col * (boxWidth + 4);
      const y = rowY + row * (boxHeight + 4);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label, x + 4, y + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      doc.text(kpi.value, x + 4, y + 12);
    });

    currentY += 44;

    // Reliability Index (SAIDI / SAIFI)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text('Indeks Keandalan Jaringan:', 14, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('• SAIDI (System Average Interruption Duration Index): 2.4 Menit/Pelanggan (Di bawah batas target 5.0 Min)', 14, currentY + 5);
    doc.text('• SAIFI (System Average Interruption Frequency Index): 0.18 Kali/Pelanggan (Target: < 0.40 Kali)', 14, currentY + 10);
    doc.text('• Efisiensi Audit Lapangan QR Code: 94.2% Aset terverifikasi berkala dengan barcode aktif.', 14, currentY + 15);

    currentY += 24;

    // Table 1: Damage & Repair Dispatch
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text('II. DAFTAR TIKET GANGGUAN & DISPATCH PERBAIKAN BULAN INI', 14, currentY);

    const ticketRows = tickets.map((t) => [
      t.noTiket,
      t.kodeAset,
      t.jenisKerusakan.replace(/_/g, ' ').toUpperCase(),
      t.tingkatKeparahan.toUpperCase(),
      t.waktuLapor,
      t.status.replace(/_/g, ' ').toUpperCase(),
      t.timTeknisi || 'Belum Ditugaskan',
    ]);

    autoTable(doc, {
      startY: currentY + 4,
      head: [['No Tiket', 'Kode Aset', 'Jenis Gangguan', 'Tingkat', 'Waktu Lapor', 'Status', 'Tim Teknisi']],
      body: ticketRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    // Get current Y after first table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable.finalY + 12;

    // Check if new page needed
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    // Table 2: High Risk Assets from Predictive Engine
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text('III. DAFTAR ASET BERISIKO TINGGI (ANALISIS PREDIKTIF AI)', 14, currentY);

    const highRiskPoles = [...poles]
      .sort((a, b) => b.skorRisikoPrediktif - a.skorRisikoPrediktif)
      .slice(0, 5);

    const riskRows = highRiskPoles.map((p) => [
      p.kodeAset,
      p.jenis,
      p.penyulang,
      `${p.kemiringanDerajat}°`,
      `${p.suhuOperasionalCelsius}°C`,
      `${p.jarakVegetasiMeter}m`,
      `${p.skorRisikoPrediktif}%`,
      p.rekomendasiTindakan.slice(0, 55) + '...',
    ]);

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Kode Aset', 'Jenis', 'Penyulang', 'Kemiringan', 'Suhu', 'ROW Dahan', 'Skor Risiko', 'Rekomendasi Tindakan']],
      body: riskRows,
      theme: 'grid',
      headStyles: {
        fillColor: [180, 83, 9],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
      },
    });

    // Signatures
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable.finalY + 18;
    if (currentY > 250) {
      doc.addPage();
      currentY = 30;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Diverifikasi oleh:', 20, currentY);
    doc.text('Disetujui oleh:', 140, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Bambang Sudarmono, S.T.', 20, currentY + 20);
    doc.setFont('helvetica', 'normal');
    doc.text('Supervisor Pemeliharaan Distribusi', 20, currentY + 25);
    doc.text('NIP: 198403152010121004', 20, currentY + 29);

    doc.setFont('helvetica', 'bold');
    doc.text('Ir. Hendra Gunawan, M.Eng.', 140, currentY + 20);
    doc.setFont('helvetica', 'normal');
    doc.text('Manajer Bagian Jaringan & K3L', 140, currentY + 25);
    doc.text('NIP: 197806212003121001', 140, currentY + 29);

    // Save PDF
    const filename = `VoltGrid_Laporan_Analitik_${monthYear.replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);
    return filename;
  }
}
