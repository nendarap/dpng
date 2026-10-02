import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Clock, ShieldAlert, RefreshCw, LogOut, CheckCircle2, 
  AlertTriangle, Lock, ShieldCheck, ChevronDown, User, Calendar
} from 'lucide-react';
import { LoginSession, SessionConfig } from '../types';
import { 
  getActiveSession, 
  validateSession, 
  extendSession, 
  touchSessionActivity, 
  endSession,
  getSessionConfig
} from '../services/storageService';

interface SessionManagerProps {
  onSessionExpired: () => void;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  onSessionExpired,
  onShowToast,
}) => {
  const [session, setSession] = useState<LoginSession | null>(() => getActiveSession());
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [isExtending, setIsExtending] = useState<boolean>(false);

  const configRef = useRef<SessionConfig>(getSessionConfig());

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    if (secs <= 0) return '00:00';
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    if (hours > 0) {
      return `${hours}j ${minutes.toString().padStart(2, '0')}m`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Activity listeners to keep session alive during active work
  const handleUserActivity = useCallback(() => {
    touchSessionActivity();
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(ev => window.addEventListener(ev, handleUserActivity, { passive: true }));

    // Listen for session extended/ended events
    const handleSessionExtended = (e: Event) => {
      const customEvent = e as CustomEvent<{ session: LoginSession }>;
      if (customEvent.detail?.session) {
        setSession(customEvent.detail.session);
        setShowWarningModal(false);
      }
    };

    const handleSessionEnded = () => {
      setSession(null);
      setShowWarningModal(false);
      onSessionExpired();
    };

    window.addEventListener('simpendik_session_extended', handleSessionExtended);
    window.addEventListener('simpendik_session_ended', handleSessionEnded);

    return () => {
      events.forEach(ev => window.removeEventListener(ev, handleUserActivity));
      window.removeEventListener('simpendik_session_extended', handleSessionExtended);
      window.removeEventListener('simpendik_session_ended', handleSessionEnded);
    };
  }, [handleUserActivity, onSessionExpired]);

  // Main countdown timer (runs every second)
  useEffect(() => {
    const interval = setInterval(() => {
      const validation = validateSession();
      if (!validation.isValid) {
        setRemainingSeconds(0);
        setShowWarningModal(false);
        onSessionExpired();
        return;
      }

      setRemainingSeconds(validation.remainingSeconds);
      if (validation.session) {
        setSession(validation.session);
      }

      const warningThreshold = (configRef.current.showWarningBeforeMinutes || 2) * 60;
      if (validation.remainingSeconds <= warningThreshold && validation.remainingSeconds > 0) {
        setShowWarningModal(true);
      } else {
        setShowWarningModal(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onSessionExpired]);

  // Handle Extend Session
  const handleExtend = (minutes = 30) => {
    setIsExtending(true);
    setTimeout(() => {
      const updated = extendSession(minutes);
      setIsExtending(false);
      if (updated) {
        setSession(updated);
        setShowWarningModal(false);
        onShowToast(`Sesi login berhasil diperpanjang +${minutes} menit.`, 'success');
      }
    }, 300);
  };

  const handleLogoutNow = () => {
    endSession('Pengguna memilih keluar saat sesi akan berakhir.');
    onSessionExpired();
  };

  return (
    <>
      {/* Pre-Timeout Warning Modal */}
      {showWarningModal && session && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-300 relative overflow-hidden">
            {/* Top Amber Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-[#FDB913]" />

            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                <ShieldAlert className="w-6 h-6 animate-pulse text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Sesi Login Akan Berakhir
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Untuk keamanan data SIMPENDIK, sesi Anda akan ditutup otomatis.
                </p>
              </div>
            </div>

            {/* Countdown Box */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-center my-4">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                Sisa Waktu Sesi Aktif
              </span>
              <div className="font-mono text-3xl font-black text-amber-700 tracking-wider">
                {formatTime(remainingSeconds)}
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5">
                Pengguna: <strong>{session.nama}</strong> ({session.role})
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => handleExtend(30)}
                disabled={isExtending}
                className="w-full sm:flex-1 py-2.5 px-4 bg-[#002B66] hover:bg-[#001f4d] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {isExtending ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#FDB913]" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-[#FDB913]" />
                )}
                <span>Perpanjang Sesi (+30 Menit)</span>
              </button>

              <button
                type="button"
                onClick={handleLogoutNow}
                className="w-full sm:w-auto py-2.5 px-4 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold rounded-xl text-xs transition-colors border border-slate-200 cursor-pointer"
              >
                Keluar Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Navbar Session Status Widget (Countdown badge + Popover)
export const SessionStatusWidget: React.FC<{
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  onLogout: () => void;
}> = ({ onShowToast, onLogout }) => {
  const [session, setSession] = useState<LoginSession | null>(() => getActiveSession());
  const [remainingSecs, setRemainingSecs] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const active = getActiveSession();
      setSession(active);
      if (active) {
        const diff = Math.max(0, Math.floor((new Date(active.expiresAt).getTime() - Date.now()) / 1000));
        setRemainingSecs(diff);
      } else {
        setRemainingSecs(0);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!session) return null;

  const formatRemaining = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const remM = m % 60;
      return `${h}j ${remM}m`;
    }
    return `${m}m ${sec.toString().padStart(2, '0')}s`;
  };

  const isLow = remainingSecs < 300; // less than 5 mins
  const isCritical = remainingSecs < 120; // less than 2 mins

  const handleQuickExtend = (mins: number) => {
    const updated = extendSession(mins);
    if (updated) {
      setSession(updated);
      setIsOpen(false);
      onShowToast(`Sesi berhasil diperpanjang +${mins} menit!`, 'success');
    }
  };

  const loginTimeStr = new Date(session.loginAt).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const expiresTimeStr = new Date(session.expiresAt).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
          isCritical 
            ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
            : isLow
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
        }`}
        title="Klik untuk melihat status sesi & opsi perpanjangan"
      >
        <span className={`w-2 h-2 rounded-full ${
          isCritical ? 'bg-rose-500 animate-ping' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
        }`} />
        <Clock className="w-3.5 h-3.5 text-slate-500" />
        <span className="font-mono text-[11px]">{formatRemaining(remainingSecs)}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 text-xs animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#002B66] text-[#FDB913] flex items-center justify-center font-bold">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Status Sesi Login</h4>
                <p className="text-[10px] text-slate-400 font-mono">ID: {session.sessionId}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Aktif
            </span>
          </div>

          <div className="space-y-2 mb-3.5 text-slate-600 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Pengguna:</span>
              <strong className="text-slate-800">{session.nama}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Waktu Masuk:</span>
              <span className="font-mono">{loginTimeStr} WIB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Berakhir Pada:</span>
              <span className="font-mono font-bold text-amber-700">{expiresTimeStr} WIB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Sisa Waktu:</span>
              <span className="font-mono font-bold text-[#002B66]">{formatRemaining(remainingSecs)}</span>
            </div>
            {session.rememberMe && (
              <div className="flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 p-1.5 rounded-lg border border-blue-100">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Mode "Ingat Saya" aktif di peramban ini.</span>
              </div>
            )}
          </div>

          {/* Quick Extend Buttons */}
          <div className="border-t border-slate-100 pt-3">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Perpanjang Sesi
            </span>
            <div className="grid grid-cols-3 gap-1.5 mb-2.5">
              <button
                type="button"
                onClick={() => handleQuickExtend(15)}
                className="py-1 px-2 bg-slate-100 hover:bg-[#002B66] hover:text-white rounded-lg font-bold text-[10px] transition-colors cursor-pointer text-center"
              >
                +15 Menit
              </button>
              <button
                type="button"
                onClick={() => handleQuickExtend(30)}
                className="py-1 px-2 bg-slate-100 hover:bg-[#002B66] hover:text-white rounded-lg font-bold text-[10px] transition-colors cursor-pointer text-center"
              >
                +30 Menit
              </button>
              <button
                type="button"
                onClick={() => handleQuickExtend(60)}
                className="py-1 px-2 bg-slate-100 hover:bg-[#002B66] hover:text-white rounded-lg font-bold text-[10px] transition-colors cursor-pointer text-center"
              >
                +1 Jam
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar dari Sesi</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
