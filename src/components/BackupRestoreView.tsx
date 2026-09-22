import React, { useState, useEffect, useRef } from 'react';
import { 
  DatabaseBackup, Download, Upload, History, CheckCircle2, 
  AlertTriangle, RefreshCw, Copy, Check, FileJson, ArrowRight, 
  Trash2, ShieldCheck, Database, HardDrive, Info, Layers, 
  Users, GraduationCap, UserCheck, Compass, SlidersHorizontal, 
  RotateCcw, ShieldAlert, Sparkles, FileText, ChevronDown, ChevronUp
} from 'lucide-react';
import { 
  UserItem, GroupAkun, SimpendikBackupPayload, 
  BackupSnapshotItem, RestoreMode
} from '../types';
import { ActiveTab } from './Sidebar';
import { 
  generateSystemBackup, validateBackupFile, restoreSystemBackup,
  getSnapshots, createSafetySnapshot, restoreSnapshot, deleteSnapshot, 
  clearAllSnapshots, getSystemStorageStats, getPeserta, getKategori, 
  getProgram, getPic, getEduventure, getUsers, getGroups, getAppMenus, getLogs
} from '../services/storageService';

interface BackupRestoreViewProps {
  currentUser: UserItem;
  groups: GroupAkun[];
  onDataRestored: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
  onNavigateTab?: (tab: ActiveTab) => void;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({
  currentUser,
  groups,
  onDataRestored,
  showToast,
  onNavigateTab
}) => {
  // Tabs: 'backup' | 'restore' | 'snapshots'
  const [activeSubTab, setActiveSubTab] = useState<'backup' | 'restore' | 'snapshots'>('backup');

  // Stats storage
  const [storageStats, setStorageStats] = useState(getSystemStorageStats());

  // ----------------------------------------
  // TAB 1: BACKUP STATES
  // ----------------------------------------
  const [backupMode, setBackupMode] = useState<'full' | 'modular'>('full');
  const [backupDescription, setBackupDescription] = useState<string>('');
  const [includedModules, setIncludedModules] = useState<Record<string, boolean>>({
    peserta: true,
    kategori: true,
    program: true,
    pic: true,
    eduventure: true,
    tempatEduventure: true,
    users: true,
    groups: true,
    menus: true,
    logs: true,
    settings: true,
    theme: true
  });
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  // ----------------------------------------
  // TAB 2: RESTORE STATES
  // ----------------------------------------
  const [restoreInputMethod, setRestoreInputMethod] = useState<'file' | 'paste'>('file');
  const [pastedJson, setPastedJson] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [rawRestoreContent, setRawRestoreContent] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error?: string;
    payload?: SimpendikBackupPayload;
  } | null>(null);
  const [restoreMode, setRestoreMode] = useState<RestoreMode>('replace');
  const [keepActiveSession, setKeepActiveSession] = useState<boolean>(true);
  const [restoreSelectedModules, setRestoreSelectedModules] = useState<Record<string, boolean>>({
    peserta: true,
    kategori: true,
    program: true,
    pic: true,
    eduventure: true,
    tempatEduventure: true,
    users: true,
    groups: true,
    menus: true,
    logs: true,
    settings: true,
    theme: true
  });
  const [isRestoring, setIsRestoring] = useState(false);
  const [showConfirmRestoreModal, setShowConfirmRestoreModal] = useState(false);
  const [confirmKeywordInput, setConfirmKeywordInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----------------------------------------
  // TAB 3: SNAPSHOTS STATES
  // ----------------------------------------
  const [snapshots, setSnapshots] = useState<BackupSnapshotItem[]>([]);
  const [quickSnapshotLabel, setQuickSnapshotLabel] = useState('');
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [selectedSnapshotForRollback, setSelectedSnapshotForRollback] = useState<BackupSnapshotItem | null>(null);
  const [showClearAllSnapshotsModal, setShowClearAllSnapshotsModal] = useState(false);

  // Load snapshots & stats
  const refreshLocalState = () => {
    setSnapshots(getSnapshots());
    setStorageStats(getSystemStorageStats());
  };

  useEffect(() => {
    refreshLocalState();
  }, []);

  // Handle module toggle in backup
  const handleToggleBackupModule = (mod: string) => {
    setIncludedModules(prev => ({
      ...prev,
      [mod]: !prev[mod]
    }));
  };

  const handleSelectAllBackupModules = (select: boolean) => {
    const updated: Record<string, boolean> = {};
    Object.keys(includedModules).forEach(k => {
      updated[k] = select;
    });
    setIncludedModules(updated);
  };

  // Generate current backup preview
  const currentBackupPayload = React.useMemo(() => {
    return generateSystemBackup(
      currentUser,
      backupMode === 'full' ? undefined : includedModules,
      backupDescription
    );
  }, [currentUser, backupMode, includedModules, backupDescription]);

  // Handle Download Backup JSON file
  const handleDownloadBackupFile = () => {
    try {
      const payload = generateSystemBackup(
        currentUser,
        backupMode === 'full' ? undefined : includedModules,
        backupDescription
      );
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const dateStr = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
      link.href = url;
      link.download = `simpendik-unpad-backup-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Berkas cadangan berhasil diunduh (${payload.summary.totalPeserta} peserta).`, 'success');
      refreshLocalState();
    } catch (err) {
      console.error(err);
      showToast('Gagal membuat berkas cadangan data.', 'error');
    }
  };

  // Handle Copy Backup to Clipboard
  const handleCopyBackupJson = async () => {
    try {
      const jsonStr = JSON.stringify(currentBackupPayload, null, 2);
      await navigator.clipboard.writeText(jsonStr);
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2500);
      showToast('JSON cadangan database berhasil disalin ke clipboard.', 'success');
    } catch {
      showToast('Gagal menyalin JSON ke clipboard.', 'error');
    }
  };

  // Handle Save Directly to Local Snapshot
  const handleSaveToQuickSnapshot = () => {
    try {
      const label = backupDescription.trim() || `Manual Backup ${new Date().toLocaleTimeString('id-ID')}`;
      createSafetySnapshot(label, currentUser, false);
      showToast(`Snapshot lokal "${label}" berhasil disimpan.`, 'success');
      setBackupDescription('');
      refreshLocalState();
    } catch {
      showToast('Gagal membuat snapshot lokal.', 'error');
    }
  };

  // ----------------------------------------
  // RESTORE HANDLERS
  // ----------------------------------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawRestoreContent(content);
      const result = validateBackupFile(content);
      setValidationResult(result);

      if (result.valid && result.payload) {
        showToast('Berkas cadangan valid dan siap diinspeksi.', 'success');
      } else {
        showToast(result.error || 'Berkas tidak valid.', 'error');
      }
    };
    reader.onerror = () => {
      showToast('Gagal membaca berkas.', 'error');
    };
    reader.readAsText(file);
  };

  const handleValidatePastedJson = () => {
    if (!pastedJson.trim()) {
      showToast('Masukkan kode JSON cadangan terlebih dahulu.', 'error');
      return;
    }
    setRawRestoreContent(pastedJson);
    const result = validateBackupFile(pastedJson);
    setValidationResult(result);

    if (result.valid && result.payload) {
      showToast('Kode JSON cadangan valid dan siap diinspeksi.', 'success');
    } else {
      showToast(result.error || 'Kode JSON tidak valid.', 'error');
    }
  };

  const handleExecuteRestore = () => {
    if (!validationResult?.valid || !validationResult.payload) {
      showToast('Tidak ada data cadangan yang valid untuk dipulihkan.', 'error');
      return;
    }

    if (confirmKeywordInput.trim().toUpperCase() !== 'PULIHKAN') {
      showToast('Ketik kata "PULIHKAN" untuk mengonfirmasi tindakan pemulihan.', 'error');
      return;
    }

    setIsRestoring(true);
    try {
      const selectedMods = Object.keys(restoreSelectedModules).filter(k => restoreSelectedModules[k]);

      const result = restoreSystemBackup(validationResult.payload, {
        mode: restoreMode,
        keepActiveSession: keepActiveSession,
        selectedModules: selectedMods,
        operatorUser: currentUser
      });

      if (result.success) {
        showToast(result.message, 'success');
        setShowConfirmRestoreModal(false);
        setConfirmKeywordInput('');
        // Trigger global state update
        onDataRestored();
        refreshLocalState();
      } else {
        showToast(result.message, 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kesalahan pemulihan database.';
      showToast(`Gagal memulihkan database: ${msg}`, 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  // ----------------------------------------
  // SNAPSHOT ROLLBACK HANDLERS
  // ----------------------------------------
  const handleExecuteSnapshotRollback = (snapshot: BackupSnapshotItem) => {
    try {
      const res = restoreSnapshot(snapshot.id, currentUser);
      if (res.success) {
        showToast(res.message, 'success');
        setSelectedSnapshotForRollback(null);
        onDataRestored();
        refreshLocalState();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal memulihkan ke snapshot.', 'error');
    }
  };

  const handleDeleteSnapshot = (id: string) => {
    deleteSnapshot(id);
    showToast('Snapshot lokal berhasil dihapus.', 'success');
    refreshLocalState();
  };

  const handleClearAllSnapshots = () => {
    clearAllSnapshots();
    setShowClearAllSnapshotsModal(false);
    showToast('Semua riwayat snapshot telah dibersihkan.', 'success');
    refreshLocalState();
  };

  // Module catalog definition
  const moduleCatalog = [
    { key: 'peserta', label: 'Peserta Pelatihan', icon: Users, count: storageStats.moduleStats.peserta?.count || 0 },
    { key: 'eduventure', label: 'Eduventure & Booking', icon: Compass, count: storageStats.moduleStats.eduventure?.count || 0 },
    { key: 'program', label: 'Master Program', icon: GraduationCap, count: storageStats.moduleStats.program?.count || 0 },
    { key: 'kategori', label: 'Kategori Non-Gelar', icon: Layers, count: storageStats.moduleStats.kategori?.count || 0 },
    { key: 'pic', label: 'PIC & Koordinator', icon: UserCheck, count: storageStats.moduleStats.pic?.count || 0 },
    { key: 'users', label: 'Akun & Pengguna', icon: ShieldCheck, count: storageStats.moduleStats.users?.count || 0 },
    { key: 'groups', label: 'Group & Hak Akses', icon: SlidersHorizontal, count: storageStats.moduleStats.groups?.count || 0 },
    { key: 'menus', label: 'Konfigurasi Menu', icon: FileText, count: storageStats.moduleStats.menus?.count || 0 },
    { key: 'logs', label: 'Log Audit Trail', icon: History, count: storageStats.moduleStats.logs?.count || 0 },
    { key: 'settings', label: 'Pengaturan Sistem', icon: Database, count: 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#002B66]/10 text-[#002B66] rounded-xl shrink-0">
            <DatabaseBackup className="w-7 h-7 text-[#002B66]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                Pencadangan & Pemulihan Data (Backup & Restore)
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                Pangkalan Data Aman
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Pusat proteksi dan manajemen salinan cadangan pangkalan data SIMPENDIK DPNG Universitas Padjadjaran.
              Mendukung ekspor arsip JSON terverifikasi, inspeksi perbandingan data, mode timpa/merge, dan rollback instan.
            </p>
          </div>
        </div>

        {/* Quick Health & Storage Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200/80 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Ukuran Database</span>
            <span className="text-sm font-extrabold text-[#002B66]">{storageStats.formattedSize}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              createSafetySnapshot('Snapshot Cepat Manual', currentUser, false);
              showToast('Snapshot darurat instan berhasil dibuat!', 'success');
              refreshLocalState();
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs transition-all shadow-xs"
            title="Simpan kondisi database saat ini ke memori snapshot lokal"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Snapshot Cepat</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-2xl shadow-xs">
        <button
          type="button"
          onClick={() => setActiveSubTab('backup')}
          className={`flex items-center gap-2 py-3.5 px-4 font-bold text-xs border-b-2 transition-all ${
            activeSubTab === 'backup'
              ? 'border-[#002B66] text-[#002B66]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Download className="w-4 h-4 text-[#002B66]" />
          <span>1. Pencadangan Data (Backup)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('restore')}
          className={`flex items-center gap-2 py-3.5 px-4 font-bold text-xs border-b-2 transition-all ${
            activeSubTab === 'restore'
              ? 'border-[#002B66] text-[#002B66]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Upload className="w-4 h-4 text-emerald-600" />
          <span>2. Pemulihan Data (Restore)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('snapshots')}
          className={`flex items-center gap-2 py-3.5 px-4 font-bold text-xs border-b-2 transition-all ${
            activeSubTab === 'snapshots'
              ? 'border-[#002B66] text-[#002B66]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4 text-amber-600" />
          <span>3. Riwayat Snapshot & Rollback</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-extrabold">
            {snapshots.length}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PENCADANGAN (BACKUP) */}
      {/* ========================================================= */}
      {activeSubTab === 'backup' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Backup Controls & Module Chooser */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Download className="w-4 h-4 text-[#002B66]" />
                    <span>Konfigurasi Ekspor Cadangan Data</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih cakupan data yang ingin disertakan ke dalam berkas arsip JSON terenkripsi.
                  </p>
                </div>

                {/* Scope selector */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setBackupMode('full')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      backupMode === 'full' 
                        ? 'bg-white text-[#002B66] shadow-xs font-bold' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Cadangan Lengkap (Full)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBackupMode('modular')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      backupMode === 'modular' 
                        ? 'bg-white text-[#002B66] shadow-xs font-bold' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pilihan Modul (Kustom)
                  </button>
                </div>
              </div>

              {/* Modular Checklist if modular mode is active */}
              {backupMode === 'modular' ? (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold">Pilih modul yang akan dicadangkan:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectAllBackupModules(true)}
                        className="text-[#002B66] hover:underline font-semibold"
                      >
                        Pilih Semua
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => handleSelectAllBackupModules(false)}
                        className="text-rose-600 hover:underline font-semibold"
                      >
                        Hapus Semua
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {moduleCatalog.map(m => {
                      const Icon = m.icon;
                      const isChecked = includedModules[m.key] !== false;
                      return (
                        <label
                          key={m.key}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            isChecked 
                              ? 'bg-blue-50/50 border-blue-200 text-slate-800' 
                              : 'bg-slate-50 border-slate-200 text-slate-400 opacity-70'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleBackupModule(m.key)}
                              className="w-4 h-4 rounded text-[#002B66] focus:ring-[#002B66]"
                            />
                            <Icon className={`w-4 h-4 ${isChecked ? 'text-[#002B66]' : 'text-slate-400'}`} />
                            <span className="font-semibold">{m.label}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-white rounded-md text-[10px] font-bold text-slate-600 border border-slate-200">
                            {m.count} record
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start gap-3 text-xs text-[#002B66]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Mode Cadangan Lengkap Terpilih</span>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Seluruh tabel (Peserta, Kategori, Program, PIC, Eduventure, Akun Pengguna, Matriks Hak Akses, Log Audit Trail, Pengaturan Sistem, & Tema) akan diekspor dalam satu berkas terpadu.
                    </p>
                  </div>
                </div>
              )}

              {/* Note / Description Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Keterangan Cadangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Backup sebelum rekapitulasi batch 2026 atau sebelum migrasi GAS"
                  value={backupDescription}
                  onChange={(e) => setBackupDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002B66]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadBackupFile}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#002B66] hover:bg-[#083a7e] text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#FDB913]" />
                  <span>Unduh File Cadangan (.JSON)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyBackupJson}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all cursor-pointer"
                >
                  {copiedBackup ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Tersalin ke Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Salin JSON</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSaveToQuickSnapshot}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Simpan ke Snapshot Lokal</span>
                </button>
              </div>
            </div>

            {/* Collapsible JSON Preview */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <button
                type="button"
                onClick={() => setShowJsonPreview(!showJsonPreview)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-[#002B66]" />
                  <span>Pratinjau Struktur Berkas Cadangan JSON (Skema Standar DPNG Unpad)</span>
                </div>
                {showJsonPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showJsonPreview && (
                <div className="p-4 bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-72 border-t border-slate-800">
                  <pre>{JSON.stringify({
                    version: currentBackupPayload.version,
                    app: currentBackupPayload.app,
                    createdAt: currentBackupPayload.createdAt,
                    createdBy: currentBackupPayload.createdBy,
                    checksum: currentBackupPayload.checksum,
                    summary: currentBackupPayload.summary,
                    data_preview: {
                      totalPeserta: currentBackupPayload.data.peserta?.length,
                      totalEduventure: currentBackupPayload.data.eduventure?.length,
                      sample_peserta: currentBackupPayload.data.peserta?.slice(0, 1),
                    }
                  }, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>

          {/* Right 1 Col: Summary & Security Standards */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#002B66] to-[#083a7e] text-white p-5 rounded-2xl shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FDB913]">Ringkasan Ekspor</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-white font-mono">v2.4.0</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-slate-300">Total Peserta:</span>
                  <span className="font-extrabold text-white">{currentBackupPayload.summary.totalPeserta} orang</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-slate-300">Eduventure & Kunjungan:</span>
                  <span className="font-extrabold text-white">{currentBackupPayload.summary.totalEduventure} data</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-slate-300">Program & Kategori:</span>
                  <span className="font-extrabold text-white">
                    {currentBackupPayload.summary.totalProgram} / {currentBackupPayload.summary.totalKategori}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-slate-300">Pengguna & Akun:</span>
                  <span className="font-extrabold text-white">{currentBackupPayload.summary.totalUsers} user</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-slate-300">Log Aktivitas:</span>
                  <span className="font-extrabold text-white">{currentBackupPayload.summary.totalLogs} log</span>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-slate-300 bg-white/10 p-3 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-white font-mono">
                  <span>Checksum CRC:</span>
                  <span className="text-[#FDB913] font-bold">{currentBackupPayload.checksum}</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-tight">
                  Tanda verifikasi otomatis untuk memastikan berkas tidak mengalami manipulasi data di luar sistem.
                </p>
              </div>
            </div>

            {/* Standard Security Notice */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Standar Keamanan Berkas Cadangan</span>
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Berkas cadangan JSON memuat salinan lengkap data peserta dan konfigurasi hak akses pengguna. 
                Simpan berkas pada media penyimpanan resmi yang aman dan berikan hak akses terbatas hanya kepada personel berwenang.
              </p>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Disarankan melakukan pencadangan berkala mingguan atau sebelum melakukan modifikasi massal data peserta.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PEMULIHAN (RESTORE) */}
      {/* ========================================================= */}
      {activeSubTab === 'restore' && (
        <div className="space-y-6">
          {/* Method Selector & Upload Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Pilih Berkas Cadangan untuk Dipulihkan</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unggah berkas JSON cadangan SIMPENDIK yang valid untuk diinspeksi sebelum proses penulisan ulang database.
                </p>
              </div>

              {/* Input method toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setRestoreInputMethod('file')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    restoreInputMethod === 'file' 
                      ? 'bg-white text-emerald-700 shadow-xs font-bold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Unggah File .JSON
                </button>
                <button
                  type="button"
                  onClick={() => setRestoreInputMethod('paste')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    restoreInputMethod === 'paste' 
                      ? 'bg-white text-emerald-700 shadow-xs font-bold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tempel Teks JSON
                </button>
              </div>
            </div>

            {/* File Dropzone */}
            {restoreInputMethod === 'file' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-[#002B66] bg-slate-50/80 hover:bg-blue-50/40 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 text-[#002B66] flex items-center justify-center">
                  <HardDrive className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {selectedFileName ? `Berkas Terpilih: ${selectedFileName}` : 'Klik untuk memilih atau seret berkas backup (.json) ke area ini'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Format yang didukung: Standar SIMPENDIK DPNG UNPAD JSON (*.json)
                  </p>
                </div>
                {selectedFileName && (
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold">
                    File Siap Diinspeksi
                  </span>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  rows={6}
                  placeholder="Tempelkan seluruh kode JSON cadangan sistem di sini..."
                  value={pastedJson}
                  onChange={(e) => setPastedJson(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <button
                  type="button"
                  onClick={handleValidatePastedJson}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  Verifikasi & Inspeksi Kode JSON
                </button>
              </div>
            )}
          </div>

          {/* Validation Result & Diff Review Card */}
          {validationResult && (
            <div className={`p-6 rounded-2xl border shadow-xs space-y-6 ${
              validationResult.valid ? 'bg-white border-emerald-200' : 'bg-rose-50 border-rose-200'
            }`}>
              {/* Header Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-full ${
                    validationResult.valid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {validationResult.valid ? <CheckCircle2 className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      {validationResult.valid ? 'Berkas Cadangan Valid & Terverifikasi' : 'Berkas Cadangan Tidak Sesuai'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {validationResult.valid 
                        ? 'Integritas data memenuhi skema resmi SIMPENDIK UNPAD. Silakan tinjau perbandingan data di bawah.' 
                        : validationResult.error}
                    </p>
                  </div>
                </div>

                {validationResult.valid && validationResult.payload && (
                  <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono text-slate-700 space-y-0.5">
                    <div>Dibuat: <span className="font-bold text-slate-900">{new Date(validationResult.payload.createdAt).toLocaleString('id-ID')}</span></div>
                    <div>Oleh: <span className="font-bold text-slate-900">{validationResult.payload.createdBy?.nama} ({validationResult.payload.createdBy?.role})</span></div>
                  </div>
                )}
              </div>

              {/* If Valid: Show Diff Table & Restore Settings */}
              {validationResult.valid && validationResult.payload && (
                <>
                  {/* Diff Review Table */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                      Tabel Perbandingan Data (Kondisi Saat Ini vs Berkas Cadangan)
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-4">Modul Entitas</th>
                            <th className="py-2.5 px-4 text-center">Di Sistem Saat Ini</th>
                            <th className="py-2.5 px-4 text-center">Dalam Berkas Cadangan</th>
                            <th className="py-2.5 px-4 text-right">Dampak Pemulihan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          <tr>
                            <td className="py-2.5 px-4 font-semibold flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-[#002B66]" />
                              <span>Peserta Pelatihan</span>
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono">{getPeserta().length} data</td>
                            <td className="py-2.5 px-4 text-center font-mono font-bold text-[#002B66]">
                              {validationResult.payload.summary.totalPeserta} data
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700">
                                {restoreMode === 'replace' ? 'Digantikan Total' : 'Digabung / Diperbarui'}
                              </span>
                            </td>
                          </tr>

                          <tr>
                            <td className="py-2.5 px-4 font-semibold flex items-center gap-2">
                              <Compass className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Eduventure & Kunjungan Unpad</span>
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono">{getEduventure().length} data</td>
                            <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-700">
                              {validationResult.payload.summary.totalEduventure} data
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                                {restoreMode === 'replace' ? 'Digantikan Total' : 'Digabung / Diperbarui'}
                              </span>
                            </td>
                          </tr>

                          <tr>
                            <td className="py-2.5 px-4 font-semibold flex items-center gap-2">
                              <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                              <span>Master Program & Kategori</span>
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono">
                              {getProgram().length} program / {getKategori().length} kategori
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono font-bold text-purple-700">
                              {validationResult.payload.summary.totalProgram} / {validationResult.payload.summary.totalKategori}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700">
                                {restoreMode === 'replace' ? 'Sinkron Penuh' : 'Sinkron Parsial'}
                              </span>
                            </td>
                          </tr>

                          <tr>
                            <td className="py-2.5 px-4 font-semibold flex items-center gap-2">
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                              <span>Akun Pengguna & Hak Akses</span>
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono">{getUsers().length} user</td>
                            <td className="py-2.5 px-4 text-center font-mono font-bold text-amber-700">
                              {validationResult.payload.summary.totalUsers} user
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800">
                                {keepActiveSession ? 'Sesi Aktif Dipertahankan' : 'Sesuai File Cadangan'}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mode Restore Chooser */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Pilih Strategi Pemulihan (Restore Mode)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Mode 1: Clean Replace */}
                      <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        restoreMode === 'replace'
                          ? 'border-[#002B66] bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}>
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="restoreMode"
                            checked={restoreMode === 'replace'}
                            onChange={() => setRestoreMode('replace')}
                            className="w-4 h-4 text-[#002B66] mt-0.5"
                          />
                          <div>
                            <span className="font-bold text-xs text-[#002B66] block">
                              Mode 1: Timpa Bersih (Clean Replace) - Rekomendasi Pemulihan
                            </span>
                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                              Mengganti total isi database dengan data dari berkas cadangan. Data saat ini yang tidak ada di berkas cadangan akan dibersihkan agar konsistensi 100% identik dengan waktu pencadangan.
                            </p>
                          </div>
                        </div>
                      </label>

                      {/* Mode 2: Smart Merge */}
                      <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        restoreMode === 'merge'
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}>
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="restoreMode"
                            checked={restoreMode === 'merge'}
                            onChange={() => setRestoreMode('merge')}
                            className="w-4 h-4 text-emerald-600 mt-0.5"
                          />
                          <div>
                            <span className="font-bold text-xs text-emerald-800 block">
                              Mode 2: Penggabungan Cerdas (Smart Merge)
                            </span>
                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                              Menyatukan data cadangan ke data saat ini. Record dengan ID yang sama akan diperbarui, sedangkan record unik baru yang sudah ada di sistem saat ini tidak akan dihapus.
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Safety Options */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={keepActiveSession}
                        onChange={(e) => setKeepActiveSession(e.target.checked)}
                        className="w-4 h-4 rounded text-[#002B66] focus:ring-[#002B66]"
                      />
                      <span>Pertahankan kredensial akun login saya saat ini ({currentUser.email}) agar tidak ter-logout</span>
                    </label>

                    <div className="flex items-start gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        Sistem keamanan SIMPENDIK akan secara otomatis membuat <strong>Safety Snapshot Darurat</strong> sebelum penulisan dilakukan, sehingga Anda dapat melakukan rollback kapan saja jika diperlukan.
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowConfirmRestoreModal(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Lanjutkan ke Tahap Pemulihan Data...</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: RIWAYAT SNAPSHOT LOKAL & ROLLBACK */}
      {/* ========================================================= */}
      {activeSubTab === 'snapshots' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-600" />
                  <span>Riwayat Snapshot Lokal & Rollback Cepat</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Snapshot tersimpan di memori browser untuk penyelamatan cepat tanpa perlu mengunduh/mengunggah file.
                </p>
              </div>

              {snapshots.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClearAllSnapshotsModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 font-semibold rounded-xl text-xs transition-colors self-start sm:self-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bersihkan Semua Snapshot</span>
                </button>
              )}
            </div>

            {/* Quick Create Snapshot Bar */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                placeholder="Beri label snapshot baru (contoh: Snapshot Sebelum Input Massal)"
                value={quickSnapshotLabel}
                onChange={(e) => setQuickSnapshotLabel(e.target.value)}
                className="flex-1 w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#002B66]"
              />
              <button
                type="button"
                onClick={() => {
                  if (!quickSnapshotLabel.trim()) {
                    showToast('Silakan isi label snapshot terlebih dahulu.', 'error');
                    return;
                  }
                  createSafetySnapshot(quickSnapshotLabel.trim(), currentUser, false);
                  setQuickSnapshotLabel('');
                  showToast('Snapshot baru berhasil dibuat!', 'success');
                  refreshLocalState();
                }}
                className="w-full sm:w-auto px-4 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white font-bold rounded-lg text-xs transition-colors shrink-0 shadow-xs cursor-pointer"
              >
                Buat Snapshot Sekarang
              </button>
            </div>
          </div>

          {/* Snapshot List */}
          {snapshots.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Belum Ada Snapshot Tersimpan</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Snapshot akan dibuat secara otomatis saat Anda melakukan restore, atau Anda dapat membuatnya secara manual kapan saja dengan tombol "Snapshot Cepat".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {snapshots.map((snap) => {
                const isAuto = snap.isAutoSafety;
                const date = new Date(snap.timestamp);
                const formattedDate = date.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={snap.id}
                    className={`bg-white rounded-2xl border p-4 shadow-xs space-y-3 flex flex-col justify-between transition-all hover:shadow-md ${
                      isAuto ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                          isAuto 
                            ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {isAuto ? '🛡️ Auto Safety' : '📌 Manual Snapshot'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {(snap.sizeBytes / 1024).toFixed(1)} KB
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 leading-snug">
                        {snap.label}
                      </h4>

                      <div className="text-[11px] text-slate-500 space-y-0.5">
                        <div>Waktu: <span className="text-slate-700 font-semibold">{formattedDate}</span></div>
                        <div>Oleh: <span className="text-slate-700 font-semibold">{snap.creatorName}</span></div>
                        <div>Total Data: <span className="text-slate-700 font-extrabold">{snap.recordCount} entitas</span></div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSnapshotForRollback(snap)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#002B66] hover:bg-[#083a7e] text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Rollback</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const jsonStr = JSON.stringify(snap.payload, null, 2);
                          const blob = new Blob([jsonStr], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `snapshot-${snap.id}.json`;
                          link.click();
                          URL.revokeObjectURL(url);
                          showToast('Snapshot berhasil diunduh sebagai file JSON.', 'success');
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Unduh sebagai file JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSnapshot(snap.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus snapshot ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* CONFIRMATION RESTORE MODAL */}
      {/* ========================================================= */}
      {showConfirmRestoreModal && validationResult?.payload && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 rounded-full bg-rose-100">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Konfirmasi Pemulihan Database</h3>
                <p className="text-xs text-slate-500">Tindakan penting yang akan menimpa data pangkalan data</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-2">
              <p className="font-semibold">
                Anda akan melakukan pemulihan dengan konfigurasi berikut:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800">
                <li>Mode: <strong>{restoreMode === 'replace' ? 'Timpa Bersih (Clean Replace)' : 'Penggabungan Cerdas (Smart Merge)'}</strong></li>
                <li>Peserta yang dimuat: <strong>{validationResult.payload.summary.totalPeserta} data</strong></li>
                <li>Eduventure yang dimuat: <strong>{validationResult.payload.summary.totalEduventure} data</strong></li>
                <li>Snapshot darurat otomatis akan disimpan sebelum proses dimulai.</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ketik kata <span className="text-rose-600 font-mono tracking-wider font-extrabold">PULIHKAN</span> untuk mengonfirmasi:
              </label>
              <input
                type="text"
                placeholder="PULIHKAN"
                value={confirmKeywordInput}
                onChange={(e) => setConfirmKeywordInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmRestoreModal(false);
                  setConfirmKeywordInput('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={confirmKeywordInput.trim().toUpperCase() !== 'PULIHKAN' || isRestoring}
                className="flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-md transition-all"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memulihkan Data...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ya, Pulihkan Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONFIRMATION ROLLBACK SNAPSHOT MODAL */}
      {/* ========================================================= */}
      {selectedSnapshotForRollback && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-3 rounded-full bg-amber-100">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Rollback ke Snapshot</h3>
                <p className="text-xs text-slate-500">Kembalikan pangkalan data ke titik snapshot ini</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <div>Label: <strong className="text-slate-900">{selectedSnapshotForRollback.label}</strong></div>
              <div>Waktu: <strong className="text-slate-900">{new Date(selectedSnapshotForRollback.timestamp).toLocaleString('id-ID')}</strong></div>
              <div>Pembuat: <strong className="text-slate-900">{selectedSnapshotForRollback.creatorName}</strong></div>
              <div>Total Entitas: <strong className="text-[#002B66]">{selectedSnapshotForRollback.recordCount} entitas</strong></div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin memulihkan seluruh pangkalan data kembali ke titik snapshot ini?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSnapshotForRollback(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleExecuteSnapshotRollback(selectedSnapshotForRollback)}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white font-bold rounded-xl text-xs shadow-md transition-all"
              >
                <Check className="w-3.5 h-3.5 text-[#FDB913]" />
                <span>Ya, Rollback ke Snapshot</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CLEAR ALL SNAPSHOTS MODAL */}
      {/* ========================================================= */}
      {showClearAllSnapshotsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 rounded-full bg-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Bersihkan Snapshot</h3>
                <p className="text-xs text-slate-500">Hapus seluruh riwayat snapshot lokal</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Seluruh ({snapshots.length}) snapshot cadangan lokal akan dihapus dari memori browser. Tindakan ini tidak dapat dibatalkan. Lanjutkan?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearAllSnapshotsModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleClearAllSnapshots}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
