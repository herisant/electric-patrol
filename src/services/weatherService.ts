import { WeatherData } from '../types';
import { INITIAL_WEATHER } from '../data/mockData';

class WeatherService {
  private cachedData: WeatherData = INITIAL_WEATHER;

  public async fetchRealtimeWeather(lat = -6.9175, lng = 107.6191): Promise<WeatherData> {
    try {
      // Open-Meteo free public API without requiring any secret key
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m&timezone=Asia%2FJakarta`;
      
      const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!response.ok) {
        throw new Error(`Open-Meteo returned status ${response.status}`);
      }

      const json = await response.json();
      const current = json.current;

      const suhu = Math.round((current.temperature_2m ?? 26.5) * 10) / 10;
      const kelembaban = current.relative_humidity_2m ?? 80;
      const windSpeed = Math.round((current.wind_speed_10m ?? 15) * 10) / 10;
      const rain = Math.round((current.precipitation ?? 0) * 10) / 10;
      const gusts = current.wind_gusts_10m ?? windSpeed * 1.3;

      let kondisi = 'Cerah Berawan';
      const code = current.weather_code ?? 0;
      if (code >= 95) kondisi = 'Hujan Badai Disertai Petir';
      else if (code >= 80) kondisi = 'Hujan Deras / Showers';
      else if (code >= 61) kondisi = 'Hujan Sedang';
      else if (code >= 51) kondisi = 'Gerimis';
      else if (code >= 1 && code <= 3) kondisi = 'Berawan';

      // Determine lightning index
      let indeksPetir: 'Rendah' | 'Sedang' | 'Tinggi' | 'Ekstrem' = 'Rendah';
      if (code >= 95 || (rain > 10 && kelembaban > 85)) {
        indeksPetir = 'Tinggi';
      } else if (rain > 5) {
        indeksPetir = 'Sedang';
      }

      // Early warning generation
      let peringatanDini: string | undefined = undefined;
      if (windSpeed > 35 || gusts > 45) {
        peringatanDini = `PERINGATAN ANGIN KENCANG (${Math.round(gusts)} km/j): Potensi tiang bergoyang dan dahan patah pada jalur JTM.`;
      } else if (indeksPetir === 'Tinggi') {
        peringatanDini = `PERINGATAN PETIR & BADAI: Aktifkan proteksi arrester dan siaga gangguan feeder pada area perbukitan.`;
      } else if (rain > 15) {
        peringatanDini = `PERINGATAN HUJAN LEBAT: Waspada kelabilan tanah fondasi tiang di pinggir lereng & saluran air.`;
      }

      this.cachedData = {
        wilayah: 'Bandung Raya & Koridor Distribusi Jabar',
        suhu,
        kondisi,
        kecepatanAnginKmH: windSpeed,
        curahHujanMmH: rain,
        indeksPetir,
        kelembaban,
        peringatanDini,
        terakhirUpdate: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB',
      };

      return this.cachedData;
    } catch {
      // Fallback with realistic micro-variations for testing
      const base = { ...this.cachedData };
      base.terakhirUpdate = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB (Offline Cache)';
      return base;
    }
  }

  public getCachedWeather(): WeatherData {
    return this.cachedData;
  }
}

export const weatherService = new WeatherService();
