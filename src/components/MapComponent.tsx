import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  TiangListrik, 
  PoleCondition, 
  WeatherData 
} from '../types';
import { 
  Filter, 
  Search, 
  Layers, 
  Crosshair, 
  AlertCircle, 
  Wind, 
  Zap, 
  Eye, 
  PlusCircle,
  QrCode
} from 'lucide-react';

interface MapComponentProps {
  poles: TiangListrik[];
  selectedPoleId: string | null;
  onSelectPole: (pole: TiangListrik) => void;
  onReportDamage: (pole: TiangListrik) => void;
  onScanQr: (pole?: TiangListrik) => void;
  weather: WeatherData;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  poles,
  selectedPoleId,
  onSelectPole,
  onReportDamage,
  onScanQr,
  weather,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const polylineLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const weatherOverlayRef = useRef<L.LayerGroup | null>(null);
  const baseMapTileLayerRef = useRef<L.TileLayer | null>(null);

  // Basemap style: default to standard Leaflet (OpenStreetMap)
  const [basemapType, setBasemapType] = useState<'osm' | 'topo' | 'satellite'>('osm');

  // Filters
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [filterFeeder, setFilterFeeder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showWeatherOverlay, setShowWeatherOverlay] = useState<boolean>(true);
  const [showFeederLines, setShowFeederLines] = useState<boolean>(true);

  // Unique feeders
  const feederOptions = Array.from(new Set(poles.map((p) => p.penyulang)));

  // Filtered poles
  const filteredPoles = poles.filter((pole) => {
    if (filterCondition !== 'all' && pole.kondisi !== filterCondition) return false;
    if (filterFeeder !== 'all' && pole.penyulang !== filterFeeder) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchKode = pole.kodeAset.toLowerCase().includes(q);
      const matchAlamat = pole.alamat.toLowerCase().includes(q);
      const matchPenyulang = pole.penyulang.toLowerCase().includes(q);
      if (!matchKode && !matchAlamat && !matchPenyulang) return false;
    }
    return true;
  });

  // Get color for status
  const getMarkerColor = (kondisi: PoleCondition): string => {
    switch (kondisi) {
      case 'kritis':
        return '#ef4444'; // Red-500
      case 'waspada':
        return '#f59e0b'; // Amber-500
      case 'dalam_perbaikan':
        return '#8b5cf6'; // Violet-500
      case 'normal':
      default:
        return '#10b981'; // Emerald-500
    }
  };

  // Create custom SVG marker icon
  const createPoleIcon = (pole: TiangListrik, isSelected: boolean) => {
    const color = getMarkerColor(pole.kondisi);
    const size = isSelected ? 38 : 30;
    const isPondasiMiring = pole.kemiringanDerajat > 5;
    const isTrafo = pole.jenis === 'Gardu Tiang Trafo (GTT)';

    const svgHtml = `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
        ${pole.kondisi === 'kritis' ? `<div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(239, 68, 68, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
        <div style="
          width: ${size}px; 
          height: ${size}px; 
          border-radius: 50%; 
          background: ${color}; 
          border: 3px solid ${isSelected ? '#ffffff' : '#0f172a'}; 
          box-shadow: 0 4px 10px rgba(0,0,0,0.5); 
          display: flex; 
          align-items: center; 
          justify-content: center;
          color: #ffffff;
          font-weight: bold;
          font-size: ${size > 32 ? '11px' : '9px'};
        ">
          ${isTrafo ? '⚡' : (isPondasiMiring ? '⚠' : 'TL')}
        </div>
      </div>
    `;

    return L.divIcon({
      html: svgHtml,
      className: 'voltgrid-pole-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Centered at Bandung
    const initialCenter: [number, number] = [-6.917464, 107.619123];
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: false,
    });

    // Default Leaflet Standard Basemap (OpenStreetMap)
    const initialTile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    baseMapTileLayerRef.current = initialTile;

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Polyline layer group for feeder wires
    polylineLayerGroupRef.current = L.layerGroup().addTo(map);
    weatherOverlayRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Basemap Switcher (Standard Leaflet OSM, Topography, Satellite)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseMapTileLayerRef.current) {
      baseMapTileLayerRef.current.remove();
    }

    let url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    let attr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    let maxZoom = 19;

    if (basemapType === 'topo') {
      url = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      attr = 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: OpenTopoMap';
      maxZoom = 17;
    } else if (basemapType === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attr = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USGS, GIS User Community';
      maxZoom = 19;
    }

    const newLayer = L.tileLayer(url, {
      attribution: attr,
      maxZoom,
    }).addTo(map);

    baseMapTileLayerRef.current = newLayer;
  }, [basemapType]);

  // Update Feeder Interconnection Lines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const polyGroup = polylineLayerGroupRef.current;
    if (!map || !polyGroup) return;

    polyGroup.clearLayers();

    if (!showFeederLines) return;

    // Group poles by penyulang
    const byFeeder: { [key: string]: TiangListrik[] } = {};
    poles.forEach((p) => {
      if (!byFeeder[p.penyulang]) byFeeder[p.penyulang] = [];
      byFeeder[p.penyulang].push(p);
    });

    // Draw lines between poles within each feeder
    Object.entries(byFeeder).forEach(([feederName, feederPoles]) => {
      if (feederPoles.length < 2) return;
      const sorted = [...feederPoles].sort((a, b) => a.koordinat.lng - b.koordinat.lng);
      const latlngs = sorted.map((p) => [p.koordinat.lat, p.koordinat.lng] as [number, number]);

      const polyline = L.polyline(latlngs, {
        color: feederName.includes('Cipadung') ? '#38bdf8' : (feederName.includes('Braga') ? '#fbbf24' : '#a855f7'),
        weight: 3.5,
        opacity: 0.75,
        dashArray: '6, 6',
      });

      polyline.bindTooltip(`Kabel Distribusi 20kV: ${feederName}`, { sticky: true });
      polyline.addTo(polyGroup);
    });
  }, [poles, showFeederLines]);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    filteredPoles.forEach((pole) => {
      const isSelected = selectedPoleId === pole.id;
      const icon = createPoleIcon(pole, isSelected);

      const marker = L.marker([pole.koordinat.lat, pole.koordinat.lng], { icon }).addTo(map);

      // Custom styled popup
      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 text-slate-900';
      popupContent.innerHTML = `
        <div style="font-family: system-ui, sans-serif; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
            <strong style="font-size: 13px; color: #0f172a;">${pole.kodeAset}</strong>
            <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; text-transform: uppercase; background: ${pole.kondisi === 'kritis' ? '#fee2e2' : pole.kondisi === 'waspada' ? '#fef3c7' : '#dcfce7'}; color: ${pole.kondisi === 'kritis' ? '#991b1b' : pole.kondisi === 'waspada' ? '#92400e' : '#166534'};">
              ${pole.kondisi.replace('_', ' ')}
            </span>
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
            <strong>Jenis:</strong> ${pole.jenis} (${pole.material})<br/>
            <strong>Penyulang:</strong> ${pole.penyulang}<br/>
            <strong>Kemiringan:</strong> ${pole.kemiringanDerajat}° · <strong>Beban:</strong> ${pole.bebanArusAmpere}A<br/>
            <strong>Risiko Prediktif:</strong> <span style="font-weight: bold; color: ${pole.skorRisikoPrediktif > 70 ? '#dc2626' : '#16a34a'}">${pole.skorRisikoPrediktif}%</span>
          </div>
          <div style="font-size: 10px; color: #64748b; margin-bottom: 8px;">
            ${pole.alamat}
          </div>
          <div style="display: flex; gap: 4px;">
            <button id="btn-detail-${pole.id}" style="flex: 1; background: #0f172a; color: #fff; font-size: 11px; padding: 4px 6px; border-radius: 4px; border: none; cursor: pointer; font-weight: 500;">
              Spesifikasi & Audit
            </button>
            <button id="btn-report-${pole.id}" style="background: #f59e0b; color: #0f172a; font-size: 11px; padding: 4px 6px; border-radius: 4px; border: none; cursor: pointer; font-weight: 600;">
              Lapor Rusak
            </button>
          </div>
        </div>
      `;

      // Attach DOM handlers after popup open
      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const detailBtn = document.getElementById(`btn-detail-${pole.id}`);
        const reportBtn = document.getElementById(`btn-report-${pole.id}`);
        if (detailBtn) {
          detailBtn.onclick = () => onSelectPole(pole);
        }
        if (reportBtn) {
          reportBtn.onclick = () => onReportDamage(pole);
        }
      });

      marker.on('click', () => {
        onSelectPole(pole);
      });

      markersRef.current[pole.id] = marker;
    });
  }, [filteredPoles, selectedPoleId]);

  // Center on selected pole if changed
  useEffect(() => {
    if (!selectedPoleId || !mapInstanceRef.current) return;
    const pole = poles.find((p) => p.id === selectedPoleId);
    if (pole) {
      mapInstanceRef.current.setView([pole.koordinat.lat, pole.koordinat.lng], 16, {
        animate: true,
      });
      const marker = markersRef.current[selectedPoleId];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedPoleId]);

  // Geolocation trigger
  const handleLocateMe = () => {
    if (!mapInstanceRef.current) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          mapInstanceRef.current?.setView([latitude, longitude], 15);
          L.circleMarker([latitude, longitude], {
            radius: 8,
            fillColor: '#3b82f6',
            color: '#ffffff',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.9,
          })
            .bindTooltip('Posisi Teknisi Lapangan Saat Ini')
            .addTo(mapInstanceRef.current!);
        },
        () => {
          alert('Izin akses lokasi GPS belum diaktifkan.');
        }
      );
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-8rem)] flex flex-col bg-slate-950">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-[30] pointer-events-none flex flex-col md:flex-row gap-2 justify-between items-start md:items-center">
        {/* Search & Filter Bar */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-800 shadow-xl max-w-2xl">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode aset / jalan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 text-xs text-white pl-8 pr-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-500 w-44 md:w-56"
            />
          </div>

          {/* Condition Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <select
              value={filterCondition}
              onChange={(e) => setFilterCondition(e.target.value)}
              className="bg-slate-800 text-xs text-white px-2 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Semua Status ({poles.length})</option>
              <option value="kritis">Kritis / Bahaya ({poles.filter((p) => p.kondisi === 'kritis').length})</option>
              <option value="waspada">Waspada ({poles.filter((p) => p.kondisi === 'waspada').length})</option>
              <option value="normal">Normal ({poles.filter((p) => p.kondisi === 'normal').length})</option>
              <option value="dalam_perbaikan">Dalam Perbaikan ({poles.filter((p) => p.kondisi === 'dalam_perbaikan').length})</option>
            </select>
          </div>

          {/* Feeder Filter */}
          <select
            value={filterFeeder}
            onChange={(e) => setFilterFeeder(e.target.value)}
            className="bg-slate-800 text-xs text-white px-2 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-500 hidden sm:block"
          >
            <option value="all">Semua Penyulang (Feeders)</option>
            {feederOptions.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* GIS Layer Toggles & Action Buttons */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
          {/* Basemap Style Switcher */}
          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setBasemapType('osm')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                basemapType === 'osm'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Peta Standar Leaflet (OpenStreetMap)"
            >
              Leaflet OSM
            </button>
            <button
              onClick={() => setBasemapType('topo')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                basemapType === 'topo'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Peta Topografi / Kontur Medan"
            >
              Topografi
            </button>
            <button
              onClick={() => setBasemapType('satellite')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                basemapType === 'satellite'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Citra Satelit Udara"
            >
              Satelit
            </button>
          </div>

          {/* Feeder Wires Toggle */}
          <button
            onClick={() => setShowFeederLines(!showFeederLines)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showFeederLines ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white bg-slate-800'
            }`}
            title="Tampilkan / Sembunyikan Jalur Kabel Saluran Distribusi 20kV"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Jalur JTM</span>
          </button>

          {/* GPS Center */}
          <button
            onClick={handleLocateMe}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Pusatkan ke Posisi GPS Saya"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {/* Fast QR Scan Button */}
          <button
            onClick={() => onScanQr()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Scan QR Tiang</span>
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Bottom GIS Legend & Weather Snapshot */}
      <div className="absolute bottom-4 left-4 z-[30] pointer-events-auto bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 shadow-xl max-w-sm hidden sm:block">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Legenda Status Jaringan
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {filteredPoles.length} Tiang Terpetakan
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
            <span className="text-slate-300">Normal (Stabil)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
            <span className="text-slate-300">Waspada (ROW/Suhu)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm animate-pulse" />
            <span className="text-slate-300 font-medium text-rose-300">Kritis / Tiang Miring</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-violet-500 shadow-sm" />
            <span className="text-slate-300">Dalam Perbaikan</span>
          </div>
        </div>
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Wind className="w-3 h-3 text-sky-400" />
            Angin: {weather.kecepatanAnginKmH} km/j
          </span>
          <span>Hujan: {weather.curahHujanMmH} mm/j</span>
        </div>
      </div>
    </div>
  );
};
