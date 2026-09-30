import React from 'react';
import { PushNotificationItem } from '../types';
import { 
  X, 
  Bell, 
  CheckCheck, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Volume2, 
  VolumeX,
  ExternalLink
} from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: PushNotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  onSelectTicket?: (ticketId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  isSoundEnabled,
  onToggleSound,
  onSelectTicket,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.dibaca).length;

  const getIcon = (tipe: PushNotificationItem['tipe']) => {
    switch (tipe) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-sky-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Pusat Notifikasi Push Real-Time</h2>
              <span className="text-[11px] text-slate-400">
                {unreadCount} pesan belum dibaca
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggleSound}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              title={isSoundEnabled ? 'Suara Aktif' : 'Suara Senyap'}
            >
              {isSoundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 border-b border-slate-800 bg-slate-900 flex items-center justify-between text-xs">
          <button
            onClick={onMarkAllAsRead}
            disabled={unreadCount === 0}
            className="text-slate-400 hover:text-amber-400 disabled:opacity-40 flex items-center gap-1 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Tandai Semua Dibaca</span>
          </button>
          <button
            onClick={onClearAll}
            disabled={notifications.length === 0}
            className="text-slate-400 hover:text-rose-400 disabled:opacity-40 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Semua</span>
          </button>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800 p-2 space-y-1">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Belum ada notifikasi baru.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  onMarkAsRead(notif.id);
                  if (notif.tiketId && onSelectTicket) {
                    onSelectTicket(notif.tiketId);
                    onClose();
                  }
                }}
                className={`p-3 rounded-xl cursor-pointer transition-colors space-y-1.5 ${
                  notif.dibaca ? 'bg-slate-900/60 opacity-75 hover:bg-slate-850' : 'bg-slate-800/90 border border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getIcon(notif.tipe)}
                    <span className="font-semibold text-xs text-white leading-tight">
                      {notif.judul}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {notif.waktu}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pl-6">
                  {notif.pesan}
                </p>

                {notif.kodeAset && (
                  <div className="pl-6 flex items-center gap-2 pt-0.5">
                    <span className="text-[10px] font-mono bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded border border-slate-700">
                      {notif.kodeAset}
                    </span>
                    {notif.tiketId && (
                      <span className="text-[10px] text-sky-400 flex items-center gap-0.5">
                        <span>Buka Tiket</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-850 border-t border-slate-800 text-center text-[11px] text-slate-400">
          Notifikasi terhubung secara live ke sistem dispatch teknisi dan sensor cuaca
        </div>
      </div>
    </div>
  );
};
