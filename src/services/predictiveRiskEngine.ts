import { TiangListrik, WeatherData } from '../types';

export interface PredictiveRiskAssessment {
  poleId: string;
  kodeAset: string;
  overallRiskScore: number; // 0 - 100
  riskCategory: 'Rendah' | 'Sedang' | 'Tinggi' | 'Kritis';
  failureProbabilityNext30Days: number; // percentage
  componentRisks: {
    fondasiDanKemiringan: number; // 0-100
    bebanTermalDanArus: number; // 0-100
    bahayaVegetasi: number; // 0-100
    degradasiDanKorosi: number; // 0-100
    ancamanCuacaLokal: number; // 0-100
  };
  rekomendasiUtama: string;
  prioritasPerawatan: 'Rutin (3-6 Bulan)' | 'Jadwal Cepat (14 Hari)' | 'Prioritas Tinggi (3 Hari)' | 'Tindakan Segera (24 Jam)';
  estimasiDampakGangguan: {
    pelangganTerdampak: number;
    penyulangTerdampak: string;
    estimasiENS_kWh: number; // Energy Not Supplied
  };
}

export class PredictiveRiskEngine {
  /**
   * Calculate deterministic multi-parameter composite risk index (CHI - Composite Health Index)
   */
  public static assessPoleRisk(pole: TiangListrik, weather?: WeatherData): PredictiveRiskAssessment {
    // 1. Fondasi & Kemiringan (Tilt angle: 0° is 0, >8° is 100)
    const fondasiScore = Math.min(100, Math.round((pole.kemiringanDerajat / 8.5) * 100));

    // 2. Beban Termal & Arus
    const loadRatio = pole.bebanArusAmpere / (pole.kapasitasMaksAmpere || 250);
    const tempExcess = Math.max(0, pole.suhuOperasionalCelsius - 40); // >40°C starts penalty
    const thermalScore = Math.min(100, Math.round((loadRatio * 60) + (tempExcess * 1.5)));

    // 3. Bahaya Vegetasi (ROW Clearance: safe is >3m, dangerous is <1m)
    let vegetasiScore = 10;
    if (pole.jarakVegetasiMeter < 1.0) vegetasiScore = 95;
    else if (pole.jarakVegetasiMeter < 1.8) vegetasiScore = 75;
    else if (pole.jarakVegetasiMeter < 3.0) vegetasiScore = 40;

    // 4. Degradasi & Korosi (Age + Corrosion percentage)
    const currentYear = 2026;
    const usiaTahun = Math.max(0, currentYear - pole.tahunPasang);
    const ageFactor = Math.min(50, (usiaTahun / 25) * 50);
    const korosiScore = Math.min(100, Math.round(ageFactor + (pole.indeksKorosiPersen * 0.6)));

    // 5. Ancaman Cuaca
    let cuacaScore = 20;
    if (weather) {
      if (weather.indeksPetir === 'Tinggi') cuacaScore += 35;
      if (weather.kecepatanAnginKmH > 30) cuacaScore += 30;
      if (weather.curahHujanMmH > 10) cuacaScore += 15;
    }
    cuacaScore = Math.min(100, cuacaScore);

    // Weighted Overall Score
    const overallRiskScore = Math.round(
      fondasiScore * 0.28 +
      thermalScore * 0.24 +
      vegetasiScore * 0.18 +
      korosiScore * 0.16 +
      cuacaScore * 0.14
    );

    let riskCategory: 'Rendah' | 'Sedang' | 'Tinggi' | 'Kritis' = 'Rendah';
    let prioritasPerawatan: 'Rutin (3-6 Bulan)' | 'Jadwal Cepat (14 Hari)' | 'Prioritas Tinggi (3 Hari)' | 'Tindakan Segera (24 Jam)' = 'Rutin (3-6 Bulan)';
    let failureProbability = Math.round(overallRiskScore * 0.85);

    if (overallRiskScore >= 80) {
      riskCategory = 'Kritis';
      prioritasPerawatan = 'Tindakan Segera (24 Jam)';
      failureProbability = Math.min(96, Math.max(78, overallRiskScore));
    } else if (overallRiskScore >= 60) {
      riskCategory = 'Tinggi';
      prioritasPerawatan = 'Prioritas Tinggi (3 Hari)';
    } else if (overallRiskScore >= 35) {
      riskCategory = 'Sedang';
      prioritasPerawatan = 'Jadwal Cepat (14 Hari)';
    }

    // Recommendation logic
    let rekomendasi = 'Kondisi struktur dan kelistrikan terpantau stabil.';
    if (fondasiScore > 70) {
      rekomendasi = `Peringatan Fondasi: Tiang miring ${pole.kemiringanDerajat}°. Pasang guy-wire (treckskoor) atau suntik grouting beton segera.`;
    } else if (thermalScore > 75) {
      rekomendasi = `Overload Warning: Beban arus mencapai ${Math.round(loadRatio * 100)}% dengan suhu ${pole.suhuOperasionalCelsius}°C. Rencanakan manuver beban penyulang.`;
    } else if (vegetasiScore > 70) {
      rekomendasi = `Right-of-Way Alert: Jarak dahan pohon hanya ${pole.jarakVegetasiMeter}m. Lakukan rabas pohon (Row Clearing) untuk mencegah flashover.`;
    } else if (korosiScore > 70) {
      rekomendasi = `Degradasi Aset: Usia tiang ${usiaTahun} tahun dengan korosi ${pole.indeksKorosiPersen}%. Jadwalkan pengecatan pelindung dan uji ketukan tiang.`;
    }

    // Impact estimation
    const pelangganEstimasi = pole.jenis === 'Gardu Tiang Trafo (GTT)' ? 320 : (pole.jenis === 'JTM 20kV' ? 1850 : 65);
    const ensEstimasi = Math.round(pelangganEstimasi * (pole.bebanArusAmpere / 20) * 1.5);

    return {
      poleId: pole.id,
      kodeAset: pole.kodeAset,
      overallRiskScore,
      riskCategory,
      failureProbabilityNext30Days: failureProbability,
      componentRisks: {
        fondasiDanKemiringan: fondasiScore,
        bebanTermalDanArus: thermalScore,
        bahayaVegetasi: vegetasiScore,
        degradasiDanKorosi: korosiScore,
        ancamanCuacaLokal: cuacaScore,
      },
      rekomendasiUtama: rekomendasi,
      prioritasPerawatan,
      estimasiDampakGangguan: {
        pelangganTerdampak: pelangganEstimasi,
        penyulangTerdampak: pole.penyulang,
        estimasiENS_kWh: ensEstimasi,
      }
    };
  }
}
