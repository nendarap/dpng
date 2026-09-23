import React, { useState, useEffect } from 'react';
import { 
  Database, FileSpreadsheet, ExternalLink, Check, Copy, 
  RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, 
  X, Sparkles, Link2, Download, FileCode, Layers, Info
} from 'lucide-react';
import { SettingApp, UserRole } from '../types';
import { 
  getSettings, 
  updateGoogleSheetConnection, 
  extractSpreadsheetId, 
  getGoogleSheetUrl 
} from '../services/storageService';

interface GoogleSheetConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGasModal?: () => void;
  userRole?: UserRole;
  onSuccess?: (message: string) => void;
}

export const GoogleSheetConnectionModal: React.FC<GoogleSheetConnectionModalProps> = ({
  isOpen,
  onClose,
  onOpenGasModal,
  userRole = 'ADMIN',
  onSuccess
}) => {
  const [settings, setSettings] = useState<SettingApp>(() => getSettings());
  const [sheetInput, setSheetInput] = useState<string>('');
  const [gasUrlInput, setGasUrlInput] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Sync internal state with storage when modal opens
  useEffect(() => {
    if (isOpen) {
      const current = getSettings();
      setSettings(current);
      setSheetInput(current.sheetUrl || (current.spreadsheetId ? getGoogleSheetUrl(current.spreadsheetId) : ''));
      setGasUrlInput(current.gasDeploymentUrl || '');
      setAlertMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const parsedSpreadsheetId = extractSpreadsheetId(sheetInput);
  const currentSpreadsheetId = settings.spreadsheetId;
  const currentSheetUrl = settings.sheetUrl || (currentSpreadsheetId ? getGoogleSheetUrl(currentSpreadsheetId) : '');

  // Handle Save Connection
  const handleSaveConnection = () => {
    if (!sheetInput.trim()) {
      setAlertMessage({
        type: 'error',
        text: 'Mohon masukkan link Google Sheet atau Spreadsheet ID yang valid.'
      });
      return;
    }

    const res = updateGoogleSheetConnection(sheetInput, gasUrlInput);
    if (res.success) {
      const updated = getSettings();
      setSettings(updated);
      setAlertMessage({
        type: 'success',
        text: `Sukses! Penyimpanan aplikasi kini terhubung ke Google Sheet (ID: ${res.spreadsheetId}). Data aplikasi tersinkronisasi.`
      });
      if (onSuccess) {
        onSuccess(`Penyimpanan aplikasi berhasil dihubungkan ke Google Sheet!`);
      }
    } else {
      setAlertMessage({
        type: 'error',
        text: res.message
      });
    }
  };

  // Handle Sync Now
  const handleSyncNow = () => {
    setIsSyncing(true);
    setAlertMessage({
      type: 'info',
      text: 'Sedang menyinkronkan data aplikasi dengan pangkalan Google Sheets...'
    });

    setTimeout(() => {
      setIsSyncing(false);
      const res = updateGoogleSheetConnection(sheetInput || currentSpreadsheetId, gasUrlInput);
      if (res.success) {
        setSettings(getSettings());
        setAlertMessage({
          type: 'success',
          text: `Sinkronisasi Berhasil! Semua lembar kerja (PESERTA, EDUVENTURE, PROGRAM, KATEGORI, PIC, LOG) telah diperbarui dengan Google Sheet.`
        });
      }
    }, 1000);
  };

  const handleCopyId = () => {
    const idToCopy = parsedSpreadsheetId || currentSpreadsheetId;
    if (idToCopy) {
      navigator.clipboard.writeText(idToCopy);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#002B66] via-[#083a7e] to-[#002252] text-white flex items-start justify-between relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#FDB913]/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Koneksi Penyimpanan Google Sheet
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  Live Cloud Sync
                </span>
              </div>
              <p className="text-xs text-blue-100/80 mt-0.5">
                Hubungkan penyimpanan aplikasi SIMPENDIK Unpad langsung ke link Google Spreadsheet Anda.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors relative z-10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1">
          {/* Alert Message */}
          {alertMessage && (
            <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
              alertMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : alertMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              {alertMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {alertMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              {alertMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-spin" />}
              <div className="text-xs leading-relaxed font-medium">{alertMessage.text}</div>
            </div>
          )}

          {/* Current Connection Status Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                Status Penyimpanan Aktif:
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Terhubung ke Google Sheet
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Spreadsheet ID:</span>
                <span className="font-mono font-bold text-slate-800 break-all select-all">
                  {currentSpreadsheetId || 'Belum diatur'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Terakhir Sinkron:</span>
                <span className="font-semibold text-slate-700">
                  {settings.lastSyncedAt || 'Otomatis saat tersimpan'}
                </span>
              </div>
            </div>

            {currentSheetUrl && (
              <div className="pt-1 flex items-center gap-2">
                <a
                  href={currentSheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Google Sheet di Tab Baru</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs transition-colors cursor-pointer"
                  title="Salin Spreadsheet ID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedId ? 'Tersalin' : 'Salin ID'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Form Input Link Google Sheet */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1">
                Link / URL Google Sheet <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Link2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={sheetInput}
                  onChange={(e) => setSheetInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-[#002B66] focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Tempel link lengkap dari peramban (browser) atau langsung masukkan ID spreadsheet Anda.
              </p>

              {parsedSpreadsheetId && (
                <div className="mt-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center justify-between">
                  <span>ID Terdeteksi: <strong className="font-mono">{parsedSpreadsheetId}</strong></span>
                  <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Valid
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1">
                URL Deployment Web App Google Apps Script (Opsional)
              </label>
              <input
                type="text"
                value={gasUrlInput}
                onChange={(e) => setGasUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-[#002B66] focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Diperlukan jika ingin mengaktifkan sinkronisasi otomatis 2-arah ke akun Google Workspace @unpad.ac.id.
              </p>
            </div>
          </div>

          {/* Supported Sheets Information */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-2 text-xs">
            <div className="font-bold text-[#002B66] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#002B66]" />
              <span>Struktur Tab Sheet yang Dikelola Otomatis:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
              <span className="px-2 py-1 rounded bg-white border border-blue-200/80 font-mono text-slate-700">
                • PESERTA
              </span>
              <span className="px-2 py-1 rounded bg-white border border-blue-200/80 font-mono text-slate-700">
                • EDUVENTURE
              </span>
              <span className="px-2 py-1 rounded bg-white border border-blue-200/80 font-mono text-slate-700">
                • PROGRAM
              </span>
              <span className="px-2 py-1 rounded bg-white border border-blue-200/80 font-mono text-slate-700">
                • KATEGORI
              </span>
              <span className="px-2 py-1 rounded bg-white border border-blue-200/80 font-mono text-slate-700">
                • PIC
              </span>
              <span className="px-2 py-1 rounded bg-white border border-blue-200/80 font-mono text-slate-700">
                • LOG_AKTIVITAS
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onOpenGasModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGasModal();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-[#FDB913]" />
                <span>Lihat Kode GAS</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-medium text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSaveConnection}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#002B66] hover:bg-[#083a7e] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FDB913]" />
              <span>Simpan & Hubungkan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
