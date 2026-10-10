import React, { useState, useEffect } from 'react';
import { 
  Database, CheckCircle2, AlertTriangle, RefreshCw, Server, ShieldCheck, 
  Download, ArrowRight, HardDrive, Terminal, Table, Sparkles, Copy, Check,
  ExternalLink, Layers, Shield
} from 'lucide-react';
import { 
  installerApiService, 
  InstallerStatusResponse, 
  DatabaseStatsResponse 
} from '../services/installerApiService';
import { getPeserta, getProgram, getKategori, getPic, getPegawai, getEduventure } from '../services/storageService';

interface MysqlInstallerTabProps {
  onOpenInstallerModal: () => void;
}

export const MysqlInstallerTab: React.FC<MysqlInstallerTabProps> = ({
  onOpenInstallerModal,
}) => {
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState<InstallerStatusResponse | null>(null);
  const [dbStats, setDbStats] = useState<DatabaseStatsResponse | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [copiedEnv, setCopiedEnv] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statusRes, statsRes] = await Promise.all([
        installerApiService.getStatus(),
        installerApiService.getDbStats(),
      ]);
      setStatusData(statusRes);
      setDbStats(statsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToMySQL = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const peserta = getPeserta();
      const program = getProgram();
      const kategori = getKategori();
      const pic = getPic();
      const pegawai = getPegawai();
      const eduventure = getEduventure();

      const res = await installerApiService.syncLocalData({
        peserta,
        program,
        kategori,
        pic,
        pegawai,
        eduventure,
      });

      if (res.success) {
        setSyncMessage(`Berhasil menyinkronkan ${res.syncedCount} entitas ke tabel MySQL.`);
        loadData();
      } else {
        setSyncMessage(`Gagal: ${res.message}`);
      }
    } catch (err: any) {
      setSyncMessage(`Error sinkronisasi: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleResetInstaller = async () => {
    if (!window.confirm('Apakah Anda yakin ingin mereset kunci instalasi untuk menjalankan ulang wisaya installer?')) {
      return;
    }
    try {
      const res = await installerApiService.resetInstallation();
      if (res.success) {
        alert(res.message);
        loadData();
        onOpenInstallerModal();
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const copyEnvSample = () => {
    const host = statusData?.metadata?.dbHost || 'localhost';
    const port = statusData?.metadata?.dbPort || 3306;
    const dbName = statusData?.metadata?.dbName || 'simpendik_unpad_db';
    const user = statusData?.metadata?.dbUser || 'root';
    const prefix = statusData?.metadata?.dbPrefix || 'sim_';

    const envText = `# Konfigurasi Database MySQL SIMPENDIK UNPAD
DB_HOST="${host}"
DB_PORT="${port}"
DB_NAME="${dbName}"
DB_USER="${user}"
DB_PASSWORD=""
DB_PREFIX="${prefix}"
`;
    navigator.clipboard.writeText(envText);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  const isConnected = dbStats?.status === 'connected';
  const isInstalled = statusData?.isInstalled;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs">
            <Database className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base">Database Engine MySQL & Web Installer</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isConnected
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : isInstalled
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  : 'bg-slate-500/30 text-slate-300 border border-white/20'
              }`}>
                {isConnected ? 'Terhubung (MySQL Online)' : isInstalled ? 'Terpasang (Offline)' : 'Belum Terinstal'}
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              Kelola instalasi, skema tabel, sinkronisasi data, dan berkas SQL dump untuk SIMPENDIK.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white font-semibold px-3 py-2 rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={onOpenInstallerModal}
            className="inline-flex items-center gap-1.5 text-xs bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-4 py-2 rounded-xl shadow-md transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isInstalled ? 'Buka Wisaya Installer' : 'Pasang Database Sekarang'}
          </button>
        </div>
      </div>

      {/* Database Connection Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 text-xs block">Database Name</span>
          <strong className="text-sm font-mono text-slate-800 block mt-1">
            {statusData?.metadata?.dbName || dbStats?.database || 'simpendik_unpad_db'}
          </strong>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Prefix: <code>{statusData?.metadata?.dbPrefix || 'sim_'}</code>
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 text-xs block">Server Host & Port</span>
          <strong className="text-sm font-mono text-slate-800 block mt-1">
            {statusData?.metadata?.dbHost || 'localhost'}:{statusData?.metadata?.dbPort || 3306}
          </strong>
          <span className="text-[11px] text-slate-500 mt-1 block">
            User: <code>{statusData?.metadata?.dbUser || 'root'}</code>
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 text-xs block">Jumlah Tabel Terbentuk</span>
          <strong className="text-sm text-emerald-700 font-bold block mt-1">
            {dbStats?.tablesCount ? `${dbStats.tablesCount} Tabel Aktif` : isInstalled ? '14 Tabel Terpasang' : '0 Tabel'}
          </strong>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {dbStats?.totalRecords ? `${dbStats.totalRecords} Total Rekaman` : 'Skema Lengkap'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 text-xs block">Waktu Pemasangan</span>
          <strong className="text-xs text-slate-700 block mt-1">
            {statusData?.metadata?.installedAt
              ? new Date(statusData.metadata.installedAt).toLocaleString('id-ID')
              : 'Belum terpasang'}
          </strong>
          <span className="text-[11px] text-slate-500 mt-1 block truncate">
            Admin: {statusData?.metadata?.adminEmail || 'admin@unpad.ac.id'}
          </span>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncMessage && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Actions Grid */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Operasi & Manajemen Basis Data
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={handleSyncToMySQL}
            disabled={syncing}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <strong className="text-xs font-semibold text-slate-800 block">
                {syncing ? 'Menyinkronkan...' : 'Sinkronkan Data ke MySQL'}
              </strong>
              <span className="text-[11px] text-slate-500">
                Kirim data lokal (kategori, program, peserta) ke tabel MySQL.
              </span>
            </div>
          </button>

          <a
            href={installerApiService.getSqlDownloadUrl(
              statusData?.metadata?.dbName || 'simpendik_unpad_db',
              statusData?.metadata?.dbPrefix || 'sim_'
            )}
            download="simpendik_unpad_mysql.sql"
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-left transition cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-xs font-semibold text-slate-800 block">
                Unduh Berkas SQL Dump (.sql)
              </strong>
              <span className="text-[11px] text-slate-500">
                Skrip SQL lengkap untuk phpMyAdmin atau MySQL CLI.
              </span>
            </div>
          </a>

          <button
            type="button"
            onClick={copyEnvSample}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-left transition cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
              {copiedEnv ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </div>
            <div>
              <strong className="text-xs font-semibold text-slate-800 block">
                {copiedEnv ? 'Tersalin ke Clipboard!' : 'Salin Konfigurasi .env'}
              </strong>
              <span className="text-[11px] text-slate-500">
                Variabel environment untuk deployment server produksi.
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenInstallerModal}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 text-left transition cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-xs font-semibold text-slate-800 block">
                Wisaya Installer Ulang
              </strong>
              <span className="text-[11px] text-slate-500">
                Ubah parameter host, port, atau buat database baru.
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleResetInstaller}
            className="flex items-center gap-3 p-3 rounded-xl border border-red-200 hover:border-red-300 hover:bg-red-50/50 text-left transition cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-red-100 text-red-700 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-xs font-semibold text-red-700 block">
                Reset Kunci Instalasi
              </strong>
              <span className="text-[11px] text-slate-500">
                Hapus status lock di config/installed.json.
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Live Table Schema Breakdown if connected */}
      {dbStats?.tables && dbStats.tables.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Table className="w-4 h-4 text-blue-600" />
              Daftar Tabel di Database `{dbStats.database}`
            </h4>
            <span className="text-xs font-medium text-slate-500">
              Total {dbStats.tables.length} tabel
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {dbStats.tables.map((t) => (
              <div
                key={t.name}
                className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs font-mono"
              >
                <span className="text-slate-700 truncate" title={t.name}>
                  {t.name}
                </span>
                <span className="text-blue-700 font-bold bg-blue-100 px-1.5 py-0.5 rounded text-[11px]">
                  {t.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Setup Guide for Developers / DevOps */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
        <h4 className="font-bold text-slate-800 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-600" />
          Panduan Impor Manual via phpMyAdmin & CLI MySQL
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-600">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <strong className="text-slate-800 block">Metode 1: phpMyAdmin (XAMPP / CPanel)</strong>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-500">
              <li>Buka <code>http://localhost/phpmyadmin</code> di peramban Anda.</li>
              <li>Klik tab <strong>Import</strong> di bilah atas.</li>
              <li>Klik <strong>Choose File</strong> dan pilih berkas <code>simpendik_unpad_mysql.sql</code>.</li>
              <li>Klik tombol <strong>Go / Impor</strong> di bagian bawah.</li>
            </ol>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <strong className="text-slate-800 block">Metode 2: Terminal / Command Prompt (CLI)</strong>
            <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto">
              mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS simpendik_unpad_db;"<br />
              mysql -u root -p simpendik_unpad_db &lt; simpendik_unpad_mysql.sql
            </div>
            <span className="text-[11px] text-slate-400 block">
              Gantilah <code>root</code> dengan username MySQL Anda jika menggunakan password.
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
