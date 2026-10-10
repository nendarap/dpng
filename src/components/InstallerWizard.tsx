import React, { useState, useEffect } from 'react';
import { 
  Database, CheckCircle2, AlertTriangle, RefreshCw, Server, ShieldCheck, 
  KeyRound, User, Lock, Download, ExternalLink, ArrowRight, ArrowLeft, 
  Terminal, Sparkles, Check, Copy, HelpCircle, HardDrive, Cpu, FileText,
  Eye, EyeOff, Layers, Globe, Radio, X
} from 'lucide-react';
import { UnpadLogo } from './UnpadLogo';
import { 
  installerApiService, 
  DatabaseConfig, 
  AdminSetupConfig, 
  SystemRequirementsResult, 
  TestConnectionResult, 
  InstallResult, 
  InstallLogItem 
} from '../services/installerApiService';

interface InstallerWizardProps {
  onClose?: () => void;
  onInstallationComplete?: (result: InstallResult) => void;
  initialStep?: number;
  isModal?: boolean;
}

export const InstallerWizard: React.FC<InstallerWizardProps> = ({
  onClose,
  onInstallationComplete,
  initialStep = 1,
  isModal = false,
}) => {
  // Step state (1 to 6)
  const [currentStep, setCurrentStep] = useState<number>(initialStep);

  // Requirements state
  const [reqResult, setReqResult] = useState<SystemRequirementsResult | null>(null);
  const [reqLoading, setReqLoading] = useState(false);

  // Database Form state
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'simpendik_unpad_db',
    tablePrefix: 'sim_',
    createDatabase: true,
  });

  // Admin Form state
  const [adminConfig, setAdminConfig] = useState<AdminSetupConfig>({
    appName: 'SIMPENDIK NON GELAR UNPAD',
    institutionName: 'Universitas Padjadjaran',
    adminName: 'Dr. Nendar Herdiana, M.Kom',
    adminUsername: 'admin',
    adminEmail: 'nendar@unpad.ac.id',
    adminPassword: 'admin123',
    seedSampleData: true,
  });
  const [confirmPassword, setConfirmPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);

  // Connection testing state
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);

  // Installation execution state
  const [installing, setInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installLogs, setInstallLogs] = useState<InstallLogItem[]>([]);
  const [installResult, setInstallResult] = useState<InstallResult | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);

  // Clipboard copied state
  const [copiedEnv, setCopiedEnv] = useState(false);

  // Load requirements on mount or step 2
  useEffect(() => {
    if (currentStep === 2 && !reqResult) {
      loadRequirements();
    }
  }, [currentStep]);

  const loadRequirements = async () => {
    setReqLoading(true);
    try {
      const res = await installerApiService.checkRequirements();
      setReqResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setReqLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await installerApiService.testConnection(dbConfig);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Gagal menghubungi server.',
      });
    } finally {
      setTestLoading(false);
    }
  };

  const applyPreset = (preset: 'xampp' | 'laragon' | 'docker') => {
    if (preset === 'xampp') {
      setDbConfig({
        ...dbConfig,
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'simpendik_unpad_db',
        tablePrefix: 'sim_',
        createDatabase: true,
      });
    } else if (preset === 'laragon') {
      setDbConfig({
        ...dbConfig,
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'simpendik_unpad_db',
        tablePrefix: 'sim_',
        createDatabase: true,
      });
    } else if (preset === 'docker') {
      setDbConfig({
        ...dbConfig,
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: 'password',
        database: 'simpendik_unpad_db',
        tablePrefix: 'sim_',
        createDatabase: true,
      });
    }
    setTestResult(null);
  };

  const handleRunInstallation = async () => {
    if (adminConfig.adminPassword !== confirmPassword) {
      alert('Konfirmasi password tidak cocok dengan password yang dimasukkan!');
      return;
    }

    setInstalling(true);
    setCurrentStep(5);
    setInstallProgress(10);
    setInstallError(null);
    setInstallLogs([
      {
        timestamp: new Date().toLocaleTimeString('id-ID'),
        level: 'info',
        message: 'Menginisialisasi konfigurasi installer MySQL...',
      },
    ]);

    // Simulated progress steps for smooth UX
    const t1 = setTimeout(() => {
      setInstallProgress(35);
      setInstallLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString('id-ID'),
          level: 'info',
          message: `Menghubungkan ke MySQL Server ${dbConfig.host}:${dbConfig.port}...`,
        },
        {
          timestamp: new Date().toLocaleTimeString('id-ID'),
          level: 'info',
          message: `Memeriksa / membuat database '${dbConfig.database}'...`,
        },
      ]);
    }, 400);

    const t2 = setTimeout(() => {
      setInstallProgress(65);
      setInstallLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString('id-ID'),
          level: 'info',
          message: `Mengeksekusi skrip DDL 14 tabel basis data (${dbConfig.tablePrefix}*)...`,
        },
      ]);
    }, 900);

    try {
      const res = await installerApiService.install({
        database: dbConfig,
        admin: adminConfig,
      });

      clearTimeout(t1);
      clearTimeout(t2);

      if (res.success) {
        setInstallProgress(100);
        setInstallLogs(res.logs || []);
        setInstallResult(res);
        setTimeout(() => {
          setInstalling(false);
          setCurrentStep(6);
          if (onInstallationComplete) {
            onInstallationComplete(res);
          }
        }, 800);
      } else {
        setInstalling(false);
        setInstallError(res.message);
        setInstallLogs(res.logs || []);
      }
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      setInstalling(false);
      setInstallError(err.message || 'Gagal mengeksekusi instalasi.');
    }
  };

  const copyEnvSample = () => {
    const envText = `# Konfigurasi Database MySQL SIMPENDIK UNPAD
DB_HOST="${dbConfig.host}"
DB_PORT="${dbConfig.port}"
DB_NAME="${dbConfig.database}"
DB_USER="${dbConfig.user}"
DB_PASSWORD="${dbConfig.password}"
DB_PREFIX="${dbConfig.tablePrefix}"
`;
    navigator.clipboard.writeText(envText);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  const stepsList = [
    { num: 1, title: 'Selamat Datang' },
    { num: 2, title: 'Persyaratan Sistem' },
    { num: 3, title: 'Database MySQL' },
    { num: 4, title: 'Akun Admin' },
    { num: 5, title: 'Instalasi' },
    { num: 6, title: 'Selesai' },
  ];

  return (
    <div className={`w-full ${isModal ? 'max-w-4xl mx-auto my-4' : 'min-h-screen bg-slate-100 flex flex-col justify-between'}`}>
      <div className={`bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden ${isModal ? '' : 'm-4 md:m-8'}`}>
        
        {/* Top Header with Unpad Branding */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 text-white px-6 py-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-xl shadow-md">
                <UnpadLogo className="w-9 h-9" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight">Sistem Installer MySQL</h1>
                  <span className="bg-amber-400/20 text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-400/30">
                    SIMPENDIK UNPAD
                  </span>
                </div>
                <p className="text-xs text-blue-200 mt-0.5">
                  Wisaya Pemasangan & Migrasi Database MySQL Terpandu
                </p>
              </div>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition"
                title="Tutup Wisaya Installer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Stepper Wizard Progress Bar */}
          <div className="mt-6 pt-4 border-t border-blue-800/60">
            <div className="grid grid-cols-6 gap-2">
              {stepsList.map((step) => {
                const isActive = currentStep === step.num;
                const isDone = currentStep > step.num;
                return (
                  <div key={step.num} className="flex flex-col items-center text-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                        isDone
                          ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                          : isActive
                          ? 'bg-amber-400 text-slate-900 ring-4 ring-amber-400/30 font-extrabold shadow-md'
                          : 'bg-blue-950/60 text-blue-300 border border-blue-700/60'
                      }`}
                    >
                      {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : step.num}
                    </div>
                    <span
                      className={`text-[11px] mt-1.5 font-medium truncate max-w-full hidden sm:block ${
                        isActive ? 'text-amber-300 font-bold' : isDone ? 'text-blue-100' : 'text-blue-300/70'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Wizard Main Content Area */}
        <div className="p-6 md:p-8">
          
          {/* STEP 1: WELCOME & OVERVIEW */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <div className="inline-flex p-3 bg-blue-50 text-blue-700 rounded-2xl mb-2 ring-8 ring-blue-50/50">
                  <Database className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Selamat Datang di Wisaya Instalasi SIMPENDIK
                </h2>
                <p className="text-sm text-slate-600">
                  Sistem ini akan memandu Anda menghubungkan aplikasi dengan server database <strong>MySQL / MariaDB</strong>,
                  membuat skema tabel otomatis, dan mendaftarkan akun Super Administrator.
                </p>
              </div>

              {/* Feature Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                    <Server className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm">Otomasi Skema Basis Data</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Membuat 14 tabel lengkap dengan relasi, indeks, dan collation <code>utf8mb4_unicode_ci</code> secara instan.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm">Validasi & Pre-Flight Check</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Memeriksa izin tulis server, versi runtime Node.js, ketersediaan driver MySQL2, dan konektivitas port.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm">Dukungan phpMyAdmin (.SQL)</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Bisa diinstal otomatis lewat web, atau unduh skrip <code>.sql</code> bersih untuk impor mandiri lewat phpMyAdmin.
                  </p>
                </div>
              </div>

              {/* Quick instructions box */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Catatan Sebelum Memulai:</strong>
                  <p className="mt-1 text-amber-800">
                    Pastikan service MySQL Anda sudah aktif (RUNNING). Jika Anda menggunakan XAMPP atau Laragon di komputer lokal,
                    buka Control Panel dan klik <strong>Start MySQL</strong>. Port standar MySQL adalah <code>3306</code>.
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <a
                  href="/api/installer/export-sql"
                  download="simpendik_unpad_mysql.sql"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-700 py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                >
                  <Download className="w-4 h-4" />
                  Unduh Skrip SQL Saja (Manual)
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(2);
                    loadRequirements();
                  }}
                  className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  Mulai Pemeriksaan Sistem
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SYSTEM REQUIREMENTS */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Pemeriksaan Persyaratan Sistem</h2>
                  <p className="text-xs text-slate-500">
                    Memastikan server siap menjalankan SIMPENDIK dengan MySQL secara optimal.
                  </p>
                </div>
                <button
                  onClick={loadRequirements}
                  disabled={reqLoading}
                  className="inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 font-semibold px-3 py-1.5 rounded-lg border border-blue-200 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${reqLoading ? 'animate-spin' : ''}`} />
                  Cek Ulang
                </button>
              </div>

              {reqLoading ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                  Sedang memindai parameter sistem server...
                </div>
              ) : reqResult ? (
                <div className="space-y-4">
                  {/* System Overview Bar */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 block">Sistem Operasi</span>
                      <strong className="text-slate-700 font-medium">{reqResult.platform} ({reqResult.arch})</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Versi Node.js</span>
                      <strong className="text-slate-700 font-medium">{reqResult.nodeVersion}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Penggunaan Memori</span>
                      <strong className="text-slate-700 font-medium">{reqResult.memoryUsageMb} MB Heap</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Status Kesiapan</span>
                      <span className={`inline-flex items-center gap-1 font-bold ${reqResult.canProceed ? 'text-emerald-700' : 'text-red-700'}`}>
                        {reqResult.canProceed ? 'Siap Lanjut' : 'Perlu Penyesuaian'}
                      </span>
                    </div>
                  </div>

                  {/* Checklist Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {reqResult.checks.map((item) => (
                      <div key={item.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${item.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {item.passed ? <Check className="w-4 h-4 stroke-[2.5]" /> : <AlertTriangle className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 block">{item.title}</span>
                            <span className="text-slate-400 text-[11px]">Syarat: {item.required}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`font-semibold ${item.passed ? 'text-emerald-700' : 'text-red-600'}`}>
                            {item.current}
                          </span>
                          {item.recommendation && (
                            <span className="text-[11px] text-amber-700 block">{item.recommendation}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {reqResult.canProceed ? (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-3 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Semua persyaratan sistem terpenuhi. Server siap dikonfigurasi ke MySQL.</span>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 text-red-900 rounded-xl p-3 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>Terdapat persyaratan kritis yang belum terpenuhi. Silakan sesuaikan konfigurasi sebelum melanjutkan.</span>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  disabled={reqResult ? !reqResult.canProceed : false}
                  className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  Konfigurasi Database MySQL
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DATABASE CONFIGURATION */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Konfigurasi Database MySQL</h2>
                <p className="text-xs text-slate-500">
                  Masukkan rincian koneksi MySQL. Anda dapat menggunakan preset XAMPP atau Laragon untuk pengisian cepat.
                </p>
              </div>

              {/* Quick Presets Bar */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-700 block mb-2">Preset Konfigurasi Cepat:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('xampp')}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 font-medium transition cursor-pointer"
                  >
                    XAMPP (localhost / root / tanpa password)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('laragon')}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 font-medium transition cursor-pointer"
                  >
                    Laragon (localhost / root / tanpa password)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('docker')}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 font-medium transition cursor-pointer"
                  >
                    Docker Container (127.0.0.1:3306)
                  </button>
                </div>
              </div>

              {/* Database Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Database Host <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={dbConfig.host}
                    onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
                    placeholder="localhost atau 127.0.0.1"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">IP atau hostname server MySQL</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Port MySQL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={dbConfig.port}
                    onChange={(e) => setDbConfig({ ...dbConfig, port: Number(e.target.value) || 3306 })}
                    placeholder="3306"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Standar port: 3306</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Database <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={dbConfig.database}
                    onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
                    placeholder="simpendik_unpad_db"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Nama basis data yang akan dibuat</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prefix Tabel
                  </label>
                  <input
                    type="text"
                    value={dbConfig.tablePrefix}
                    onChange={(e) => setDbConfig({ ...dbConfig, tablePrefix: e.target.value })}
                    placeholder="sim_"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Contoh: sim_ (menghasilkan sim_peserta, sim_program)</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username MySQL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={dbConfig.user}
                    onChange={(e) => setDbConfig({ ...dbConfig, user: e.target.value })}
                    placeholder="root"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password MySQL
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={dbConfig.password}
                      onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })}
                      placeholder="Kosongkan jika tanpa password (XAMPP default)"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Create DB checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="createDbCheck"
                  checked={dbConfig.createDatabase}
                  onChange={(e) => setDbConfig({ ...dbConfig, createDatabase: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="createDbCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Buat database otomatis jika belum ada di server (<code>CREATE DATABASE IF NOT EXISTS</code>)
                </label>
              </div>

              {/* Test Connection Button & Result Box */}
              <div className="pt-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testLoading}
                    className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow transition disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testLoading ? 'animate-spin' : ''}`} />
                    {testLoading ? 'Menguji Koneksi...' : 'Uji Koneksi MySQL (Test Connection)'}
                  </button>

                  {testResult && (
                    <span className="text-xs text-slate-500">
                      {testResult.pingMs ? `Ping: ${testResult.pingMs} ms` : ''}
                    </span>
                  )}
                </div>

                {testResult && (
                  <div
                    className={`mt-3 p-3.5 rounded-xl border text-xs leading-relaxed ${
                      testResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border-red-200 text-red-900'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <strong>{testResult.success ? 'Koneksi Berhasil!' : 'Koneksi Gagal!'}</strong>
                        <p className="mt-0.5">{testResult.message}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  Lanjut ke Akun Admin
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: ADMIN & APP CONFIGURATION */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Konfigurasi Administrator & Aplikasi</h2>
                <p className="text-xs text-slate-500">
                  Daftarkan akun Super Administrator dan sesuaikan identitas nama aplikasi.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Aplikasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={adminConfig.appName}
                    onChange={(e) => setAdminConfig({ ...adminConfig, appName: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Institusi / Unit Kerja <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={adminConfig.institutionName}
                    onChange={(e) => setAdminConfig({ ...adminConfig, institutionName: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap Administrator <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={adminConfig.adminName}
                    onChange={(e) => setAdminConfig({ ...adminConfig, adminName: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username Admin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={adminConfig.adminUsername}
                    onChange={(e) => setAdminConfig({ ...adminConfig, adminUsername: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Administrator <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={adminConfig.adminEmail}
                    onChange={(e) => setAdminConfig({ ...adminConfig, adminEmail: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password Admin <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={adminConfig.adminPassword}
                      onChange={(e) => setAdminConfig({ ...adminConfig, adminPassword: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Konfirmasi Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {confirmPassword && adminConfig.adminPassword !== confirmPassword && (
                      <span className="text-[11px] text-red-600 mt-1 block">Password tidak sama!</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Seed Sample Data Option */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="seedDataCheck"
                    checked={adminConfig.seedSampleData}
                    onChange={(e) => setAdminConfig({ ...adminConfig, seedSampleData: e.target.checked })}
                    className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="seedDataCheck" className="text-xs font-bold text-slate-900 cursor-pointer block">
                      Sertakan Data Master & Sampel Awal (Direkomendasikan)
                    </label>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Mengisi tabel dengan data default: 7 Kategori Program Pelatihan, 6 Program Unggulan,
                      PIC Narahubung, Tempat Eduventure, dan Pengaturan Tampilan Login Unpad.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali
                </button>

                <button
                  type="button"
                  onClick={handleRunInstallation}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Pasang Sekarang (Install)
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: INSTALLATION IN PROGRESS */}
          {currentStep === 5 && (
            <div className="space-y-6 py-4">
              <div className="text-center max-w-lg mx-auto space-y-2">
                <div className="inline-flex p-3 bg-blue-50 text-blue-700 rounded-2xl animate-pulse">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Sedang Melakukan Instalasi...</h2>
                <p className="text-xs text-slate-500">
                  Mohon jangan menutup jendela browser ini. Sedang membangun skema tabel MySQL dan menginisialisasi sistem.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="max-w-xl mx-auto space-y-2">
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${installProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Progres Migrasi</span>
                  <span className="font-bold">{installProgress}%</span>
                </div>
              </div>

              {/* Live Terminal Log Viewer */}
              <div className="max-w-2xl mx-auto bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs shadow-inner border border-slate-800">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-[11px]">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Installer Execution Output</span>
                  </div>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-2">
                  {installLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-slate-500 select-none">[{log.timestamp}]</span>
                      <span
                        className={
                          log.level === 'success'
                            ? 'text-emerald-400 font-semibold'
                            : log.level === 'warn'
                            ? 'text-amber-400'
                            : log.level === 'error'
                            ? 'text-red-400 font-bold'
                            : 'text-slate-300'
                        }
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {installError && (
                <div className="max-w-xl mx-auto p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Terjadi Kegagalan Instalasi:</strong>
                    <p className="mt-1">{installError}</p>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg font-semibold transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Kembali ke Konfigurasi Database
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: INSTALLATION COMPLETE */}
          {currentStep === 6 && (
            <div className="space-y-6 py-2">
              <div className="text-center max-w-lg mx-auto space-y-2">
                <div className="inline-flex p-4 bg-emerald-100 text-emerald-700 rounded-3xl mb-1 ring-8 ring-emerald-50">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Instalasi Berhasil Diselesaikan!</h2>
                <p className="text-sm text-slate-600">
                  Aplikasi <strong>{adminConfig.appName}</strong> telah berhasil terpasang dan terhubung ke basis data MySQL.
                </p>
              </div>

              {/* Summary Information Card */}
              <div className="max-w-2xl mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Ringkasan Konfigurasi Basis Data
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">Database Name</span>
                    <strong className="text-slate-800 font-mono font-bold">{dbConfig.database}</strong>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">Host / Port</span>
                    <strong className="text-slate-800 font-mono font-bold">{dbConfig.host}:{dbConfig.port}</strong>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">Prefix Tabel</span>
                    <strong className="text-slate-800 font-mono font-bold">{dbConfig.tablePrefix}</strong>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">Tabel Terbentuk</span>
                    <strong className="text-emerald-700 font-bold">14 Tabel Sistem</strong>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">Username Admin</span>
                    <strong className="text-slate-800 font-mono font-bold">{adminConfig.adminUsername}</strong>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">Status Kunci</span>
                    <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                      <Lock className="w-3 h-3" /> config/installed.json
                    </span>
                  </div>
                </div>
              </div>

              {/* Download & Copy Helper Buttons */}
              <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-3">
                <a
                  href={`/api/installer/export-sql?db=${dbConfig.database}&prefix=${dbConfig.tablePrefix}`}
                  download={`simpendik_unpad_mysql_${Date.now()}.sql`}
                  className="inline-flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  <Download className="w-4 h-4 text-blue-600" />
                  Unduh Berkas SQL Schema (.sql)
                </a>

                <button
                  type="button"
                  onClick={copyEnvSample}
                  className="inline-flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
                >
                  {copiedEnv ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copiedEnv ? 'Tersalin ke Clipboard!' : 'Salin Variabel .env'}
                </button>
              </div>

              {/* Final Action Button */}
              <div className="max-w-md mx-auto pt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    if (onClose) {
                      onClose();
                    } else {
                      window.location.href = '/';
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white py-3 px-6 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition cursor-pointer"
                >
                  Masuk ke Aplikasi SIMPENDIK
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      {!isModal && (
        <footer className="text-center py-4 text-xs text-slate-500">
          SIMPENDIK NON GELAR UNPAD &copy; {new Date().getFullYear()} Universitas Padjadjaran. All rights reserved.
        </footer>
      )}
    </div>
  );
};
