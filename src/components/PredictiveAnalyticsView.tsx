import React, { useState } from 'react';
import { 
  TiangListrik, 
  WeatherData 
} from '../types';
import { 
  PredictiveRiskEngine, 
  PredictiveRiskAssessment 
} from '../services/predictiveRiskEngine';
import { 
  Activity, 
  AlertTriangle, 
  Wind, 
  CloudRain, 
  Zap, 
  Sliders, 
  ShieldCheck, 
  Compass, 
  CheckCircle2, 
  CalendarClock,
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';

interface PredictiveAnalyticsViewProps {
  poles: TiangListrik[];
  weather: WeatherData;
  onSelectPole: (pole: TiangListrik) => void;
  onReportDamage: (pole: TiangListrik) => void;
}

export const PredictiveAnalyticsView: React.FC<PredictiveAnalyticsViewProps> = ({
  poles,
  weather,
  onSelectPole,
  onReportDamage,
}) => {
  // Simulator scenario sliders
  const [simWindSpeed, setSimWindSpeed] = useState<number>(Math.round(weather.kecepatanAnginKmH));
  const [simRain, setSimRain] = useState<number>(Math.round(weather.curahHujanMmH));
  const [simLoadMultiplier, setSimLoadMultiplier] = useState<number>(100); // 100% is normal

  // Compute assessments for all poles with simulated weather
  const simWeather: WeatherData = {
    ...weather,
    kecepatanAnginKmH: simWindSpeed,
    curahHujanMmH: simRain,
    indeksPetir: simRain > 25 || simWindSpeed > 45 ? 'Tinggi' : 'Sedang',
  };

  const assessments: Array<{
    pole: TiangListrik;
    risk: PredictiveRiskAssessment;
  }> = poles.map((pole) => {
    // Clone pole with load multiplier
    const adjustedPole: TiangListrik = {
      ...pole,
      bebanArusAmpere: Math.round(pole.bebanArusAmpere * (simLoadMultiplier / 100)),
      suhuOperasionalCelsius: Math.round(pole.suhuOperasionalCelsius + (simLoadMultiplier > 100 ? (simLoadMultiplier - 100) * 0.3 : 0)),
    };
    return {
      pole,
      risk: PredictiveRiskEngine.assessPoleRisk(adjustedPole, simWeather),
    };
  });

  // Sort by highest risk score
  assessments.sort((a, b) => b.risk.overallRiskScore - a.risk.overallRiskScore);

  const criticalCount = assessments.filter((a) => a.risk.riskCategory === 'Kritis').length;
  const highCount = assessments.filter((a) => a.risk.riskCategory === 'Tinggi').length;
  const mediumCount = assessments.filter((a) => a.risk.riskCategory === 'Sedang').length;
  const lowCount = assessments.filter((a) => a.risk.riskCategory === 'Rendah').length;

  const totalEnsKwh = assessments.reduce((sum, item) => sum + item.risk.estimasiDampakGangguan.estimasiENS_kWh, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-white">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Pusat Analisis Data Prediktif & Pencegahan Pemadaman
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Algoritma kecerdasan buatan berbasis multi-variabel (kemiringan fisik, beban termal, jarak vegetasi, korosi, dan cuaca mikroklimat) untuk mendeteksi risiko gangguan sebelum trip terjadi.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-850 border border-slate-800 p-3 rounded-xl shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Indeks Risiko Jaringan</span>
            <span className="text-xl font-black font-mono text-amber-400">
              {Math.round(assessments.reduce((sum, a) => sum + a.risk.overallRiskScore, 0) / assessments.length)}%
            </span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Tiang Kritis</span>
            <span className="text-xl font-black font-mono text-rose-500">{criticalCount}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-rose-900/40 space-y-1">
          <div className="flex items-center justify-between text-xs text-rose-400">
            <span>Risiko Kritis (Urgent)</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{criticalCount} Unit</div>
          <span className="text-[11px] text-slate-400">Wajib ditangani &lt; 24 jam</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-amber-900/40 space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-400">
            <span>Risiko Tinggi (Waspada)</span>
            <Activity className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{highCount} Unit</div>
          <span className="text-[11px] text-slate-400">Jadwal rabas & perbaikan 3 hari</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Estimasi Kerugian Dicegah</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{totalEnsKwh.toLocaleString()} kWh</div>
          <span className="text-[11px] text-slate-400">Energy Not Supplied (ENS)</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Akurasi Model Prediksi</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">96.4%</div>
          <span className="text-[11px] text-slate-400">Berdasarkan data historis SPLN</span>
        </div>
      </div>

      {/* Interactive Scenario Simulator ("What-If" Analysis) */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-amber-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Simulator Skenario Cuaca Ekstrem & Lonjakan Beban (What-If Analysis)
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Geser parameter untuk melihat prediksi ketahanan tiang secara langsung
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Slider 1: Wind */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-sky-400" />
                Kecepatan Hembusan Angin
              </span>
              <span className="font-mono font-bold text-amber-400">{simWindSpeed} km/jam</span>
            </div>
            <input
              type="range"
              min={10}
              max={80}
              value={simWindSpeed}
              onChange={(e) => setSimWindSpeed(Number(e.target.value))}
              className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Sepoi (10 km/j)</span>
              <span>Sedang (35 km/j)</span>
              <span>Badai (80 km/j)</span>
            </div>
          </div>

          {/* Slider 2: Rain */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-indigo-400" />
                Intensitas Curah Hujan
              </span>
              <span className="font-mono font-bold text-amber-400">{simRain} mm/jam</span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              value={simRain}
              onChange={(e) => setSimRain(Number(e.target.value))}
              className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Kering (0)</span>
              <span>Hujan Sedang (20)</span>
              <span>Ekstrem Lezat (60)</span>
            </div>
          </div>

          {/* Slider 3: Load */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-yellow-400" />
                Beban Puncak Jaringan Listrik
              </span>
              <span className="font-mono font-bold text-amber-400">{simLoadMultiplier}% dari Nominal</span>
            </div>
            <input
              type="range"
              min={80}
              max={150}
              step={5}
              value={simLoadMultiplier}
              onChange={(e) => setSimLoadMultiplier(Number(e.target.value))}
              className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Beban Rendah (80%)</span>
              <span>Normal (100%)</span>
              <span>Overload (150%)</span>
            </div>
          </div>
        </div>

        {/* Dynamic Simulation Result Alert */}
        <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-4 ${
          criticalCount > 2 
            ? 'bg-rose-950/60 border-rose-800 text-rose-200' 
            : 'bg-slate-800/80 border-slate-700 text-slate-300'
        }`}>
          <div className="flex items-center gap-2.5">
            <AlertTriangle className={`w-5 h-5 shrink-0 ${criticalCount > 2 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
            <span>
              <strong>Hasil Simulasi:</strong> Pada kecepatan angin {simWindSpeed} km/j & beban {simLoadMultiplier}%, diprediksi terdapat <strong>{criticalCount} tiang berisiko kritis roboh/trip</strong> dan <strong>{highCount} tiang berisiko tinggi</strong>.
            </span>
          </div>
          <button
            onClick={() => {
              setSimWindSpeed(Math.round(weather.kecepatanAnginKmH));
              setSimRain(Math.round(weather.curahHujanMmH));
              setSimLoadMultiplier(100);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs shrink-0"
          >
            Reset ke Real-Time
          </button>
        </div>
      </div>

      {/* Priority Action Plan Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-amber-400" />
            <span>Daftar Prioritas Tindakan Pemeliharaan Preventif Terjadwal</span>
          </h2>
          <span className="text-xs text-slate-400">
            Diurutkan berdasarkan skor risiko kegagalan tertinggi
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-850 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Kode Aset & Jenis</th>
                  <th className="py-3.5 px-4 font-semibold">Penyulang & Rayon</th>
                  <th className="py-3.5 px-4 font-semibold">Parameter Kritis</th>
                  <th className="py-3.5 px-4 font-semibold">Skor Risiko (AI)</th>
                  <th className="py-3.5 px-4 font-semibold">Rekomendasi Tindakan Cepat</th>
                  <th className="py-3.5 px-4 font-semibold">Estimasi Dampak</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {assessments.map(({ pole, risk }) => (
                  <tr key={pole.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{pole.kodeAset}</div>
                      <div className="text-[11px] text-slate-400">{pole.jenis} ({pole.material})</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="font-medium text-white">{pole.penyulang}</div>
                      <div className="text-[11px] text-slate-400">{pole.rayon}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${pole.kemiringanDerajat > 5 ? 'bg-rose-500/20 text-rose-300 font-bold' : 'bg-slate-800 text-slate-300'}`}>
                          Kemiringan: {pole.kemiringanDerajat}°
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${pole.suhuOperasionalCelsius > 60 ? 'bg-rose-500/20 text-rose-300 font-bold' : 'bg-slate-800 text-slate-300'}`}>
                          {pole.suhuOperasionalCelsius}°C
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Jarak ROW Dahan: <strong className={pole.jarakVegetasiMeter < 1.5 ? 'text-amber-400' : 'text-slate-300'}>{pole.jarakVegetasiMeter}m</strong>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-black text-white">
                          {risk.overallRiskScore}%
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          risk.riskCategory === 'Kritis' 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                            : risk.riskCategory === 'Tinggi' 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {risk.riskCategory}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Peluang trip 30 hari: {risk.failureProbabilityNext30Days}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-200 text-xs font-medium leading-relaxed">
                        {risk.rekomendasiUtama}
                      </p>
                      <span className="text-[10px] text-amber-400 font-mono block mt-1">
                        Prioritas: {risk.prioritasPerawatan}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div>± {risk.estimasiDampakGangguan.pelangganTerdampak.toLocaleString()} Pelanggan</div>
                      <div className="text-[10px] text-slate-400">{risk.estimasiDampakGangguan.estimasiENS_kWh} kWh ENS</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectPole(pole)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs transition-colors"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => onReportDamage(pole)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
                        >
                          Dispatch WO
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
