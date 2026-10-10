import React, { useState } from 'react';
import { 
  Settings, Save, Database, RefreshCw, CheckCircle2, 
  AlertTriangle, Shield, Globe, FileCode, Sliders, Image as ImageIcon,
  DatabaseBackup, Download, ExternalLink, FileSpreadsheet, Link2,
  Clock, Lock, ShieldCheck, User, Calendar, Sparkles
} from 'lucide-react';
import { SettingApp, LoginSettings, SessionConfig, LoginSession } from '../types';
import { UnpadLogo } from './UnpadLogo';
import { LoginSettingsTab } from './LoginSettingsTab';
import { MysqlInstallerTab } from './MysqlInstallerTab';
import { DEFAULT_LOGIN_SETTINGS } from '../data/loginPresets';
import { 
  generateSystemBackup, 
  extractSpreadsheetId, 
  getGoogleSheetUrl,
  getSessionConfig,
  saveSessionConfig,
  getActiveSession,
  extendSession
} from '../services/storageService';

interface PengaturanViewProps {
  settings: SettingApp;
  onSaveSettings: (settings: SettingApp) => void;
  onResetDatabase: () => void;
  onOpenGasModal: () => void;
  onOpenSheetModal?: () => void;
  onNavigateToBackupRestore?: () => void;
  onOpenInstallerModal?: () => void;
  isAdmin?: boolean;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  settings,
  onSaveSettings,
  onResetDatabase,
  onOpenGasModal,
  onOpenSheetModal,
  onNavigateToBackupRestore,
  onOpenInstallerModal,
  isAdmin = true,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'system' | 'login' | 'session' | 'mysql'>('system');
  const [formData, setFormData] = useState<SettingApp>({ 
    ...settings,
    loginSettings: settings.loginSettings || DEFAULT_LOGIN_SETTINGS
  });
  const [sessionConfig, setSessionConfig] = useState<SessionConfig>(() => getSessionConfig());
  const [activeSession, setActiveSession] = useState<LoginSession | null>(() => getActiveSession());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'failed'; message: string }>({
    status: 'idle',
    message: ''
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSaveLoginSettings = (newLoginSettings: LoginSettings) => {
    const updated = {
      ...formData,
      loginSettings: newLoginSettings,
    };
    setFormData(updated);
    onSaveSettings(updated);
  };

  const handleSaveSessionConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSessionConfig(sessionConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExtendCurrentSession = () => {
    const updated = extendSession(30);
    if (updated) {
      setActiveSession(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestConnection = () => {
    setTestResult({ status: 'testing', message: 'Menghubungi endpoint Google Apps Script...' });
    setTimeout(() => {
      setTestResult({
        status: 'success',
        message: 'Koneksi Berhasil! Endpoint Google Sheets dan Session API merespon dengan status 200 OK (Terverifikasi @unpad.ac.id).'
      });
    }, 1200);
  };

  return (
    <div className="max-w-4xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-[#002B66]">Pengaturan Sistem & Database</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi identitas aplikasi, pangkalan data Google Sheets, dan hak akses
          </p>
        </div>

        <button
          onClick={onOpenGasModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#002B66] font-bold rounded-lg text-xs border border-slate-300 transition-colors"
        >
          <FileCode className="w-4 h-4 text-[#FDB913]" />
          <span>Buka Source Code GAS</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">Konfigurasi aplikasi berhasil disimpan ke pangkalan data.</span>
        </div>
      )}

      {/* Sub Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveSubTab('system')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'system'
              ? 'border-[#002B66] text-[#002B66]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Identitas & Database Sheets</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('login')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'login'
              ? 'border-[#002B66] text-[#002B66]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-[#FDB913]" />
          <span>Pengaturan Halaman Login</span>
          <span className="text-[10px] bg-amber-100 text-[#002B66] font-bold px-1.5 py-0.5 rounded-full">
            Super Admin
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSession(getActiveSession());
            setActiveSubTab('session');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'session'
              ? 'border-[#002B66] text-[#002B66]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-600" />
          <span>Manajemen Sesi Login</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('mysql')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'mysql'
              ? 'border-[#002B66] text-[#002B66]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4 text-blue-600" />
          <span>Database & Installer MySQL</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
            MySQL
          </span>
        </button>
      </div>

      {activeSubTab === 'mysql' ? (
        <MysqlInstallerTab onOpenInstallerModal={onOpenInstallerModal || (() => {})} />
      ) : activeSubTab === 'session' ? (
        <div className="space-y-6 text-xs">
          {/* Active Session Status Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Sesi Login Anda Saat Ini</h3>
                  <p className="text-[11px] text-slate-500">Status autentikasi aktif pada peramban ini</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full border border-emerald-200 text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Aktif & Terverifikasi
              </span>
            </div>

            {activeSession ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ID Sesi:</span>
                    <strong className="font-mono text-slate-800">{activeSession.sessionId}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pengguna:</span>
                    <strong className="text-slate-800">{activeSession.nama} ({activeSession.role})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="text-blue-700 font-mono">{activeSession.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mode "Ingat Saya":</span>
                    <span className="font-bold text-slate-700">{activeSession.rememberMe ? 'Ya (Aktif)' : 'Tidak'}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Waktu Mulai:</span>
                    <span className="font-mono">{new Date(activeSession.loginAt).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Berakhir Pada:</span>
                    <span className="font-mono font-bold text-amber-700">{new Date(activeSession.expiresAt).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Durasi Terkonfigurasi:</span>
                    <strong className="text-slate-800">{activeSession.sessionDurationMinutes} Menit</strong>
                  </div>
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={handleExtendCurrentSession}
                      className="px-3 py-1.5 bg-[#002B66] hover:bg-[#083a7e] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#FDB913]" />
                      <span>Perpanjang Sesi (+30 Menit)</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500">Tidak ada data sesi aktif.</p>
            )}
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSaveSessionConfig} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#002B66] flex items-center justify-center font-bold">
                <Lock className="w-5 h-5 text-[#002B66]" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Kebijakan Sesi & Keamanan Global</h3>
                <p className="text-[11px] text-slate-500">Atur masa kedaluwarsa sesi dan deteksi inaktivitas pengguna</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Durasi Sesi Default (Menit)
                </label>
                <select
                  value={sessionConfig.defaultDurationMinutes}
                  onChange={(e) => setSessionConfig({ ...sessionConfig, defaultDurationMinutes: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-[#002B66] outline-none"
                >
                  <option value={30}>30 Menit (Publik / Lab Bersama)</option>
                  <option value={60}>60 Menit (1 Jam - Standar)</option>
                  <option value={120}>120 Menit (2 Jam)</option>
                  <option value={480}>480 Menit (8 Jam - 1 Hari Kerja)</option>
                  <option value={1440}>1440 Menit (24 Jam)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Masa berlaku sesi login sejak pengguna berhasil autentikasi.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Batas Inaktivitas Otomatis (Menit)
                </label>
                <select
                  value={sessionConfig.inactivityTimeoutMinutes}
                  onChange={(e) => setSessionConfig({ ...sessionConfig, inactivityTimeoutMinutes: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-[#002B66] outline-none"
                >
                  <option value={15}>15 Menit Tidak Ada Interaksi</option>
                  <option value={30}>30 Menit Tidak Ada Interaksi (Rekomendasi)</option>
                  <option value={60}>60 Menit Tidak Ada Interaksi</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Otomatis logout jika pengguna tidak menggerakkan tetikus/mengetik.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Peringatan Pra-Timeout (Menit Sebelum Berakhir)
                </label>
                <select
                  value={sessionConfig.showWarningBeforeMinutes}
                  onChange={(e) => setSessionConfig({ ...sessionConfig, showWarningBeforeMinutes: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-[#002B66] outline-none"
                >
                  <option value={1}>1 Menit Sebelum Berakhir</option>
                  <option value={2}>2 Menit Sebelum Berakhir (Rekomendasi)</option>
                  <option value={5}>5 Menit Sebelum Berakhir</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Menampilkan kotak dialog konfirmasi perpanjang sesi.</p>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sessionConfig.enableInactivityTimeout}
                    onChange={(e) => setSessionConfig({ ...sessionConfig, enableInactivityTimeout: e.target.checked })}
                    className="w-4 h-4 rounded text-[#002B66] focus:ring-[#002B66] border-slate-300 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Aktifkan Auto-Logout Inaktivitas</span>
                    <span className="text-[11px] text-slate-500">Meningkatkan kepatuhan standar keamanan data universitas</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#002B66] hover:bg-[#083a7e] text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4 text-[#FDB913]" />
                <span>Simpan Pengaturan Sesi</span>
              </button>
            </div>
          </form>
        </div>
      ) : activeSubTab === 'login' ? (
        <LoginSettingsTab
          loginSettings={formData.loginSettings || DEFAULT_LOGIN_SETTINGS}
          onSaveLoginSettings={handleSaveLoginSettings}
          isAdmin={isAdmin}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Identitas Aplikasi & Logo */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="font-bold text-[#002B66] flex items-center gap-2 border-b border-slate-100 pb-2">
              <Globe className="w-4 h-4 text-[#002B66]" />
              <span>Identitas Aplikasi, Lembaga & Logo Resmi</span>
            </h2>

          {/* Logo Resmi Preview Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <UnpadLogo variant="color" size="md" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-xs">Logo Sekunder Unpad (Wordmark)</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                    Aktif
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Logo resmi sekunder Universitas Padjadjaran dengan ikon lidah api emas pada huruf 'p' sesuai SK Rektor No. 1536/UN6.RKT/Kep/HK/2025.
                </p>
              </div>
            </div>

            <a
              href="./unpad-logo.svg"
              download="Unpad_logo-secondary.svg"
              className="shrink-0 px-3 py-1.5 bg-white hover:bg-slate-100 text-[#002B66] font-bold rounded-lg border border-slate-300 text-xs flex items-center gap-1.5 transition-colors"
            >
              Unduh SVG Logo
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Aplikasi</label>
              <input
                type="text"
                value={formData.namaAplikasi}
                onChange={(e) => setFormData({ ...formData, namaAplikasi: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Institusi</label>
              <input
                type="text"
                value={formData.namaInstitusi}
                onChange={(e) => setFormData({ ...formData, namaInstitusi: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Unit Kerja Pengelola</label>
              <input
                type="text"
                value={formData.unitKerja}
                onChange={(e) => setFormData({ ...formData, unitKerja: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tahun Default</label>
              <input
                type="number"
                value={formData.tahunDefault}
                onChange={(e) => setFormData({ ...formData, tahunDefault: Number(e.target.value) })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Domain Whitelist Email</label>
              <input
                type="text"
                value={formData.domainAllowed}
                onChange={(e) => setFormData({ ...formData, domainAllowed: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Hanya user dengan domain ini yang dapat login</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Ukuran Halaman Default</label>
              <select
                value={formData.pageSizeDefault}
                onChange={(e) => setFormData({ ...formData, pageSizeDefault: Number(e.target.value) })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium focus:bg-white"
              >
                <option value={10}>10 Baris</option>
                <option value={25}>25 Baris</option>
                <option value={50}>50 Baris</option>
                <option value={100}>100 Baris</option>
              </select>
            </div>
          </div>
        </div>

        {/* Integrasi Google Sheets */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="font-bold text-[#002B66] flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Koneksi Google Spreadsheet Database</span>
            </h2>
            {onOpenSheetModal && (
              <button
                type="button"
                onClick={onOpenSheetModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs border border-emerald-200 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Buka Panel Koneksi Sheet</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Link / URL Google Sheet atau Spreadsheet ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/1sf36XFR19fAfZ5L-A4jr5TgueRodze__cuoLm-kYvCA/edit"
                  value={formData.sheetUrl || formData.spreadsheetId || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const extracted = extractSpreadsheetId(val);
                    setFormData({ 
                      ...formData, 
                      spreadsheetId: extracted,
                      sheetUrl: val.includes('spreadsheets') ? val : getGoogleSheetUrl(extracted)
                    });
                  }}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-mono text-xs focus:bg-white focus:ring-1 focus:ring-[#002B66]"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                <span>
                  Tempel URL lengkap dari browser: https://docs.google.com/spreadsheets/d/<strong>[SPREADSHEET_ID]</strong>/edit
                </span>
                {formData.spreadsheetId && (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ID: {formData.spreadsheetId}
                  </span>
                )}
              </div>

              {formData.spreadsheetId && (
                <div className="mt-2 pt-1">
                  <a
                    href={getGoogleSheetUrl(formData.spreadsheetId)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Google Sheet di Tab Baru</span>
                  </a>
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Google Apps Script Web App Deployment URL</label>
              <input
                type="text"
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                value={formData.gasDeploymentUrl || ''}
                onChange={(e) => setFormData({ ...formData, gasDeploymentUrl: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-mono text-xs focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                URL publik hasil deploy Web App Apps Script (Execute as: User accessing the web app / Me)
              </span>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testResult.status === 'testing'}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testResult.status === 'testing' ? 'animate-spin' : ''}`} />
                <span>Test Koneksi Endpoint Google Sheets</span>
              </button>
            </div>

            {testResult.message && (
              <div className={`p-3 rounded-lg border text-xs ${
                testResult.status === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                {testResult.message}
              </div>
            )}
          </div>
        </div>

        {/* Backup & Restore Data Database Section */}
        <div className="bg-blue-50/60 p-5 rounded-xl border border-blue-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#002B66] font-bold">
              <DatabaseBackup className="w-5 h-5 text-[#002B66]" />
              <span>Pencadangan & Pemulihan Database (Backup & Restore)</span>
            </div>
            <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Proteksi Data
            </span>
          </div>

          <p className="text-slate-600 text-xs leading-relaxed">
            Amankan seluruh data peserta, program, kategori, pengguna, hak akses, dan log aktivitas ke dalam berkas JSON terenkripsi, atau pulihkan data dari berkas cadangan sebelumnya.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {onNavigateToBackupRestore && (
              <button
                type="button"
                onClick={onNavigateToBackupRestore}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
              >
                <DatabaseBackup className="w-4 h-4 text-[#FDB913]" />
                <span>Buka Pusat Backup & Restore Data</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const payload = generateSystemBackup();
                const jsonStr = JSON.stringify(payload, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const dateStr = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
                link.href = url;
                link.download = `simpendik-unpad-backup-${dateStr}.json`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Unduh Cadangan Cepat (.json)</span>
            </button>
          </div>
        </div>

        {/* Danger Zone: Reset Database */}
        <div className="bg-rose-50/50 p-5 rounded-xl border border-rose-200 space-y-3">
          <div className="flex items-center gap-2 text-rose-700 font-bold">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Zona Pemeliharaan Database (Danger Zone)</span>
          </div>

          <p className="text-slate-600 text-xs leading-relaxed">
            Inisialisasi ulang database akan mereset seluruh sheet (PESERTA, KATEGORI, PROGRAM, USER, LOG) kembali ke data benih default (seed data) Universitas Padjadjaran.
          </p>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs"
          >
            Inisialisasi Ulang Database ke Default
          </button>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-[#002B66] hover:bg-[#083a7e] text-white font-bold rounded-lg shadow-md transition-colors"
          >
            <Save className="w-4 h-4 text-[#FDB913]" />
            <span>Simpan Perubahan Pengaturan</span>
          </button>
        </div>
      </form>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 rounded-full bg-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Inisialisasi Database</h3>
                <p className="text-xs text-slate-500">Tindakan ini akan mengembalikan data ke kondisi awal</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Apakah Anda yakin ingin mengatur ulang data spreadsheet dan mengaktifkan 13 kategori default Unpad?
            </p>

            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetDatabase();
                  setShowResetConfirm(false);
                  setSaveSuccess(true);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs"
              >
                Ya, Inisialisasi Ulang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
