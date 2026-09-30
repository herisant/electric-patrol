import React, { useState } from 'react';
import { 
  Zap, 
  MapPin, 
  AlertTriangle, 
  FileText, 
  QrCode, 
  Activity, 
  Server, 
  ShieldCheck, 
  ShieldAlert, 
  Bell, 
  Wifi, 
  WifiOff, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon,
  CloudRain,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { WeatherData, UserAccount } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  weather: WeatherData;
  onRefreshWeather: () => void;
  isWeatherLoading: boolean;
  isOffline: boolean;
  onToggleOffline: () => void;
  offlineCount: number;
  onSyncOffline: () => void;
  currentUser: UserAccount;
  onSwitchUser: (userId: string) => void;
  onOpen2FA: () => void;
  onOpenNotifications: () => void;
  unreadNotifCount: number;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  weather,
  onRefreshWeather,
  isWeatherLoading,
  isOffline,
  onToggleOffline,
  offlineCount,
  onSyncOffline,
  currentUser,
  onSwitchUser,
  onOpen2FA,
  onOpenNotifications,
  unreadNotifCount,
  isSoundEnabled,
  onToggleSound,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWeatherTooltip, setShowWeatherTooltip] = useState(false);

  const navItems = [
    { id: 'map', label: 'Peta GIS Aset', icon: MapPin },
    { id: 'tickets', label: 'Manajemen Kerusakan', icon: AlertTriangle },
    { id: 'predictive', label: 'Analisis Prediktif AI', icon: Activity },
    { id: 'qr-audit', label: 'Audit & QR Scanner', icon: QrCode },
    { id: 'reports', label: 'Laporan Bulanan', icon: FileText },
    { id: 'yii2-docker', label: 'Arsitektur Yii2 & Docker', icon: Server },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
      {/* Top Warning Banner if Storm Alert or Offline */}
      {isOffline ? (
        <div className="bg-amber-600/90 text-amber-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0 text-amber-950" />
            <span>Mode Minim Sinyal (Offline Aktif) · Perubahan disimpan lokal & siap disinkronkan</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono bg-amber-700/30 px-2 py-0.5 rounded text-[11px]">
              {offlineCount} data pending
            </span>
            <button
              onClick={onToggleOffline}
              className="bg-slate-900 text-amber-300 hover:bg-slate-800 px-2.5 py-0.5 rounded text-xs transition-colors"
            >
              Kembali Online
            </button>
          </div>
        </div>
      ) : weather.peringatanDini ? (
        <div className="bg-rose-950/80 border-b border-rose-800/60 text-rose-200 px-4 py-1.5 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <CloudRain className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
            <span className="font-medium">{weather.peringatanDini}</span>
          </div>
          <span className="text-[11px] text-rose-300/80 shrink-0 ml-2 hidden sm:inline">
            Update: {weather.terakhirUpdate}
          </span>
        </div>
      ) : null}

      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
              <Zap className="w-6 h-6 fill-slate-950 stroke-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">VoltGrid</span>
                <span className="text-[10px] uppercase font-mono tracking-wider bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">
                  GIS 20kV
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Sistem Pemantauan Tiang Listrik & Aset Jaringan
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm shadow-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Widgets */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Live Weather Widget */}
            <div className="relative">
              <button
                onClick={() => setShowWeatherTooltip(!showWeatherTooltip)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 hover:border-slate-600 text-xs text-slate-300 transition-colors"
                title="Status Cuaca Terkini & Peringatan Dini"
              >
                <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-mono font-medium text-white">{weather.suhu}°C</span>
                <span className="hidden xl:inline text-slate-400 font-normal">· {weather.kondisi}</span>
              </button>

              {/* Weather Popover */}
              {showWeatherTooltip && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-850 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                    <span className="font-semibold text-white">Sinkronisasi Cuaca BMKG</span>
                    <button
                      onClick={() => {
                        onRefreshWeather();
                      }}
                      className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                      title="Perbarui Cuaca Sekarang"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isWeatherLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <div className="mt-2.5 space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Wilayah:</span>
                      <span className="text-white font-medium">{weather.wilayah}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Curah Hujan:</span>
                      <span className="font-mono text-white">{weather.curahHujanMmH} mm/jam</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Kecepatan Angin:</span>
                      <span className="font-mono text-white">{weather.kecepatanAnginKmH} km/jam</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Indeks Sambaran Petir:</span>
                      <span className={`font-semibold ${weather.indeksPetir === 'Tinggi' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {weather.indeksPetir}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Kelembaban Relatif:</span>
                      <span className="font-mono text-white">{weather.kelembaban}%</span>
                    </div>
                  </div>
                  {weather.peringatanDini && (
                    <div className="mt-2 p-2 rounded bg-rose-950/80 border border-rose-800 text-[11px] text-rose-200">
                      {weather.peringatanDini}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Offline Simulation Toggle */}
            <button
              onClick={onToggleOffline}
              className={`p-2 rounded-lg border text-xs transition-colors flex items-center gap-1 ${
                isOffline 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30' 
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title={isOffline ? 'Klik untuk beralih ke Online' : 'Simulasi Mode Lapangan Minim Sinyal (Offline)'}
            >
              {isOffline ? <WifiOff className="w-4 h-4 text-amber-400" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
              {offlineCount > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-1 rounded-full">
                  {offlineCount}
                </span>
              )}
            </button>

            {/* Sound Mute/Unmute */}
            <button
              onClick={onToggleSound}
              className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white transition-colors"
              title={isSoundEnabled ? 'Suara Notifikasi Aktif' : 'Suara Notifikasi Senyap'}
            >
              {isSoundEnabled ? <Volume2 className="w-4 h-4 text-slate-300" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition-colors"
              title="Notifikasi Push Real-Time"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white transition-colors"
              title={isDarkMode ? 'Beralih ke Tampilan Terang' : 'Beralih ke Mode Gelap'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-300" />}
            </button>

            {/* User Profile & 2FA Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 text-left transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-amber-400">
                  {currentUser.nama.charAt(0)}
                </div>
                <div className="hidden md:block">
                  <div className="text-xs font-medium text-white flex items-center gap-1 leading-none">
                    <span>{currentUser.nama.split(' ')[0]}</span>
                    {currentUser.is2FAEnabled ? (
                      <span title="2FA Aktif & Terverifikasi" className="inline-flex">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      </span>
                    ) : (
                      <span title="2FA Belum Aktif" className="inline-flex">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 capitalize">
                    {currentUser.role.replace('_', ' ')}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Switcher Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-850 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs">
                  <div className="px-2.5 py-2 border-b border-slate-700/80">
                    <p className="font-semibold text-white">{currentUser.nama}</p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                    <p className="text-[10px] text-amber-400 mt-0.5">{currentUser.unitKerja}</p>
                  </div>

                  <div className="py-2">
                    <p className="text-[10px] font-semibold text-slate-400 px-2.5 uppercase tracking-wider mb-1">
                      Ganti Peran Pengguna (Role)
                    </p>
                    <button
                      onClick={() => {
                        onSwitchUser('user-01');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between"
                    >
                      <span>Super Admin</span>
                      {currentUser.id === 'user-01' && <span className="text-amber-400 text-xs">✓</span>}
                    </button>
                    <button
                      onClick={() => {
                        onSwitchUser('user-02');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between"
                    >
                      <span>Supervisor Distribusi</span>
                      {currentUser.id === 'user-02' && <span className="text-amber-400 text-xs">✓</span>}
                    </button>
                    <button
                      onClick={() => {
                        onSwitchUser('user-03');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between"
                    >
                      <span>Teknisi Lapangan (TRC)</span>
                      {currentUser.id === 'user-03' && <span className="text-amber-400 text-xs">✓</span>}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-700/80">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpen2FA();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pengaturan Keamanan & 2FA</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800/80 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
