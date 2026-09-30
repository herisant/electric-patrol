import React, { useState } from 'react';
import { UserAccount } from '../types';
import { authService } from '../services/authService';
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Copy, 
  Check, 
  RefreshCw, 
  Smartphone,
  Lock
} from 'lucide-react';

interface TwoFactorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onUserUpdated: (user: UserAccount) => void;
}

export const TwoFactorAuthModal: React.FC<TwoFactorAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
}) => {
  const [totpInput, setTotpInput] = useState<string>('');
  const [verifyMessage, setVerifyMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [copiedBackup, setCopiedBackup] = useState<boolean>(false);
  const [currentTotp, setCurrentTotp] = useState<string>(authService.getCurrentTOTP());

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = authService.verify2FACode(totpInput);
    if (ok) {
      setVerifyMessage({ text: 'Verifikasi 2FA Berhasil! Sesi autentikasi aman diaktifkan.', success: true });
      const updated = authService.toggle2FA(true);
      onUserUpdated(updated);
    } else {
      setVerifyMessage({ text: 'Kode 2FA tidak valid atau kedaluwarsa. Gunakan kode 6-digit yang tertera.', success: false });
    }
  };

  const handleToggle2FA = (enable: boolean) => {
    const updated = authService.toggle2FA(enable);
    onUserUpdated(updated);
    setVerifyMessage({
      text: enable ? '2FA Berhasil Diaktifkan.' : '2FA Telah Dinonaktifkan.',
      success: true,
    });
  };

  const handleCopyBackup = () => {
    const codes = authService.getBackupCodes().join('\n');
    navigator.clipboard.writeText(codes);
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Autentikasi Dua Faktor (2FA)
              </h2>
              <p className="text-xs text-slate-400">
                Perlindungan ganda untuk akun administrator dan teknisi lapangan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-5 text-xs">
          {/* Status card */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            currentUser.is2FAEnabled 
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200' 
              : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
          }`}>
            <div className="flex items-center gap-3">
              {currentUser.is2FAEnabled ? (
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0" />
              )}
              <div>
                <span className="font-bold text-sm block">
                  {currentUser.is2FAEnabled ? '2FA Aktif & Terlindungi' : '2FA Belum Diaktifkan'}
                </span>
                <span className="text-[11px] opacity-80">
                  {currentUser.is2FAEnabled 
                    ? 'Seluruh otorisasi dispatch dan perubahan master data dienkripsi.' 
                    : 'Disarankan mengaktifkan 2FA untuk menjaga integritas data jaringan.'}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleToggle2FA(!currentUser.is2FAEnabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                currentUser.is2FAEnabled 
                  ? 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700' 
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
            >
              {currentUser.is2FAEnabled ? 'Nonaktifkan' : 'Aktifkan 2FA'}
            </button>
          </div>

          {verifyMessage && (
            <div className={`p-3 rounded-lg text-xs ${
              verifyMessage.success ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}>
              {verifyMessage.text}
            </div>
          )}

          {/* Dynamic TOTP Simulator */}
          <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>Kode TOTP Saat Ini (Google Authenticator)</span>
              </span>
              <button
                type="button"
                onClick={() => setCurrentTotp(authService.refreshTOTP())}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                title="Refresh Kode Baru"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="flex items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-700">
              <span className="font-mono text-2xl font-black tracking-widest text-amber-400">
                {currentTotp.slice(0, 3)} {currentTotp.slice(3)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block text-center">
              Kode 6-digit berubah secara dinamis setiap 30 detik (RFC 6238 TOTP standard)
            </span>
          </div>

          {/* Form to test verify */}
          <form onSubmit={handleVerify} className="space-y-3">
            <label className="block text-slate-300 font-medium">
              Uji Coba Verifikasi Kode 2FA
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Masukkan 6-digit kode (misal: 123456 atau di atas)"
                value={totpInput}
                onChange={(e) => setTotpInput(e.target.value)}
                maxLength={8}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-center tracking-widest text-sm focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
              >
                Verifikasi
              </button>
            </div>
          </form>

          {/* Backup recovery codes */}
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Key className="w-3.5 h-3.5" />
                <span>Kode Cadangan Darurat (Offline Backup Codes)</span>
              </span>
              <button
                type="button"
                onClick={handleCopyBackup}
                className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
              >
                {copiedBackup ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedBackup ? 'Tersalin' : 'Salin Semua'}</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] text-slate-300 bg-slate-900 p-2 rounded-lg">
              {authService.getBackupCodes().map((code) => (
                <div key={code} className="text-center">{code}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
