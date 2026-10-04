import React, { useState, useMemo } from 'react';
import { 
  ToggleLeft, ToggleRight, CheckCircle2, XCircle, AlertTriangle, 
  Calendar, Users, GraduationCap, Layers, Filter, Search, 
  Sliders, Settings, Clock, ArrowRight, ShieldCheck, Check, 
  RefreshCw, Plus, Edit2, Info, Eye, ExternalLink, Save,
  AlertCircle, Lock, Unlock, Sparkles, Building2, Phone, Mail
} from 'lucide-react';
import { Program, Kategori, Peserta, UserRole, SettingApp, PengaturanPendaftaran, StatusPendaftaranProgram } from '../types';
import { 
  saveProgram, 
  saveKategori, 
  saveSettings,
  toggleProgramRegistration,
  toggleCategoryProgramsRegistration,
  bulkUpdateProgramsRegistration,
  checkProgramRegistrationStatus
} from '../services/storageService';
import { UnpadLogo } from './UnpadLogo';

interface PengaturanPendaftaranViewProps {
  programList: Program[];
  kategoriList: Kategori[];
  pesertaList: Peserta[];
  settings: SettingApp;
  userRole: UserRole;
  onRefreshData: () => void;
  onNavigateToPublicRegistration?: () => void;
  onNavigateToProgram?: () => void;
}

export const PengaturanPendaftaranView: React.FC<PengaturanPendaftaranViewProps> = ({
  programList,
  kategoriList,
  pesertaList,
  settings,
  userRole,
  onRefreshData,
  onNavigateToPublicRegistration,
  onNavigateToProgram,
}) => {
  // Global config state
  const [globalConfig, setGlobalConfig] = useState<PengaturanPendaftaran>(() => {
    return settings.pengaturanPendaftaran || {
      statusPendaftaranGlobal: 'Buka',
      pesanPendaftaranDitutup: 'Pendaftaran program pelatihan pendidikan non-gelar Universitas Padjadjaran sedang ditutup sementara.',
      autoTutupJikaLewatDeadline: true,
      autoTutupJikaKuotaPenuh: true,
      kontakBantuanWa: '081224681357',
      kontakBantuanEmail: 'dpng@unpad.ac.id',
      pengumumanPendaftaran: 'Pendaftaran Program Pelatihan Pendidikan Non Gelar Unpad Tahun 2026 telah dibuka. Silakan pilih kategori dan program yang tersedia.',
      tampilkanSisaKuotaPublik: true,
      tampilkanPeriodePublik: true,
    };
  });

  // Active view tab
  const [activeTab, setActiveTab] = useState<'program' | 'kategori' | 'global_config'>('program');

  // Filters
  const [filterKategori, setFilterKategori] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selection for bulk actions
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([]);

  // Edit Program Registration Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProgramForEdit, setSelectedProgramForEdit] = useState<Program | null>(null);
  const [editStatusPendaftaran, setEditStatusPendaftaran] = useState<StatusPendaftaranProgram>('Buka');
  const [editTanggalBuka, setEditTanggalBuka] = useState('');
  const [editTanggalTutup, setEditTanggalTutup] = useState('');
  const [editKuota, setEditKuota] = useState<number>(30);
  const [editKeterangan, setEditKeterangan] = useState('');

  // Bulk Edit Modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkStatusTarget, setBulkStatusTarget] = useState<StatusPendaftaranProgram>('Buka');
  const [bulkTanggalBuka, setBulkTanggalBuka] = useState('');
  const [bulkTanggalTutup, setBulkTanggalTutup] = useState('');
  const [bulkKuota, setBulkKuota] = useState<string>('');

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper getters
  const getProgId = (p: Program) => p.idProgram || p.id || '';
  const getKatName = (idKat: string) => {
    return kategoriList.find(k => k.idKategori === idKat)?.namaKategori || 'Kategori Lain';
  };

  // Calculate enrolled participants per program
  const getProgramStats = useMemo(() => {
    return (prog: Program) => {
      const pId = getProgId(prog);
      const enrolled = pesertaList.filter(p => 
        p.namaProgram === prog.namaProgram || (p.idProgram && p.idProgram === pId)
      );
      const totalEnrolled = enrolled.length;
      const targetQuota = prog.kuotaPeserta || 30;
      const sisa = Math.max(0, targetQuota - totalEnrolled);
      const percent = Math.min(100, Math.round((totalEnrolled / targetQuota) * 100));

      const kat = kategoriList.find(k => k.idKategori === prog.idKategori);
      const statusInfo = checkProgramRegistrationStatus(prog, kat, settings, pesertaList);

      return {
        totalEnrolled,
        targetQuota,
        sisa,
        percent,
        effectiveStatus: statusInfo.status,
        effectiveIsOpen: statusInfo.isOpen,
        reason: statusInfo.reason,
      };
    };
  }, [pesertaList, kategoriList, settings]);

  // Overall Statistics
  const overallStats = useMemo(() => {
    let countBuka = 0;
    let countTutup = 0;
    let countSegera = 0;
    let countPenuh = 0;

    programList.forEach(p => {
      const kat = kategoriList.find(k => k.idKategori === p.idKategori);
      const stat = checkProgramRegistrationStatus(p, kat, settings, pesertaList);
      if (stat.status === 'Buka') countBuka++;
      else if (stat.status === 'Tutup') countTutup++;
      else if (stat.status === 'Segera Dibuka') countSegera++;
      else if (stat.status === 'Penuh') countPenuh++;
    });

    return {
      total: programList.length,
      buka: countBuka,
      tutup: countTutup,
      segera: countSegera,
      penuh: countPenuh,
    };
  }, [programList, kategoriList, settings, pesertaList]);

  // Filtered Programs
  const filteredPrograms = useMemo(() => {
    return programList.filter(prog => {
      // Category filter
      if (filterKategori !== 'ALL' && prog.idKategori !== filterKategori) return false;

      // Status filter
      const stats = getProgramStats(prog);
      if (filterStatus !== 'ALL') {
        if (filterStatus === 'BUKA' && stats.effectiveStatus !== 'Buka') return false;
        if (filterStatus === 'TUTUP' && stats.effectiveStatus !== 'Tutup') return false;
        if (filterStatus === 'PENUH' && stats.effectiveStatus !== 'Penuh') return false;
        if (filterStatus === 'SEGERA' && stats.effectiveStatus !== 'Segera Dibuka') return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = prog.namaProgram.toLowerCase().includes(q);
        const matchKat = getKatName(prog.idKategori).toLowerCase().includes(q);
        const matchDesc = (prog.deskripsi || '').toLowerCase().includes(q);
        if (!matchName && !matchKat && !matchDesc) return false;
      }

      return true;
    });
  }, [programList, filterKategori, filterStatus, searchTerm, getProgramStats]);

  // Handle Global Master Toggle
  const handleToggleGlobalSwitch = () => {
    const nextStatus: 'Buka' | 'Tutup' = globalConfig.statusPendaftaranGlobal === 'Buka' ? 'Tutup' : 'Buka';
    const updated: PengaturanPendaftaran = {
      ...globalConfig,
      statusPendaftaranGlobal: nextStatus,
    };
    setGlobalConfig(updated);
    const newSettings: SettingApp = {
      ...settings,
      pengaturanPendaftaran: updated,
    };
    saveSettings(newSettings);
    onRefreshData();
    showToast(
      nextStatus === 'Buka' 
        ? 'Pendaftaran peserta Non Gelar secara global berhasil DIBUKA!' 
        : 'Pendaftaran peserta Non Gelar secara global DITUTUP sementara.',
      nextStatus === 'Buka' ? 'success' : 'info'
    );
  };

  // Handle Save Global Config Form
  const handleSaveGlobalConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const newSettings = {
      ...settings,
      pengaturanPendaftaran: globalConfig,
    };
    saveSettings(newSettings);
    onRefreshData();
    showToast('Pengaturan pendaftaran global & notifikasi berhasil disimpan!', 'success');
  };

  // Handle Quick 1-Click Toggle Program (Buka/Tutup)
  const handleQuickToggleProgram = (prog: Program) => {
    const current = prog.statusPendaftaran || 'Buka';
    const next: StatusPendaftaranProgram = current === 'Buka' ? 'Tutup' : 'Buka';
    toggleProgramRegistration(prog.idProgram, next);
    onRefreshData();
    showToast(`Status pendaftaran "${prog.namaProgram}" diubah menjadi ${next}.`, 'success');
  };

  // Open Edit Program Modal
  const handleOpenEditProgram = (prog: Program) => {
    setSelectedProgramForEdit(prog);
    setEditStatusPendaftaran(prog.statusPendaftaran || 'Buka');
    setEditTanggalBuka(prog.tanggalBukaPendaftaran || '');
    setEditTanggalTutup(prog.tanggalTutupPendaftaran || '');
    setEditKuota(prog.kuotaPeserta || 30);
    setEditKeterangan(prog.keteranganPendaftaran || '');
    setEditModalOpen(true);
  };

  // Submit Edit Program Modal
  const handleSaveProgramModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramForEdit) return;

    const updatedProg: Program = {
      ...selectedProgramForEdit,
      statusPendaftaran: editStatusPendaftaran,
      tanggalBukaPendaftaran: editTanggalBuka || undefined,
      tanggalTutupPendaftaran: editTanggalTutup || undefined,
      kuotaPeserta: Number(editKuota) || 30,
      keteranganPendaftaran: editKeterangan.trim() || undefined,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    saveProgram(updatedProg);
    onRefreshData();
    setEditModalOpen(false);
    showToast(`Pengaturan pendaftaran "${updatedProg.namaProgram}" berhasil diperbarui!`, 'success');
  };

  // Category Level Bulk Toggle
  const handleToggleCategory = (kat: Kategori, targetStatus: 'Buka' | 'Tutup') => {
    toggleCategoryProgramsRegistration(kat.idKategori, targetStatus);
    onRefreshData();
    showToast(
      `Seluruh program dalam kategori "${kat.namaKategori}" berhasil diatur menjadi ${targetStatus}!`,
      'success'
    );
  };

  // Select all or deselect all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProgramIds(filteredPrograms.map(p => p.idProgram));
    } else {
      setSelectedProgramIds([]);
    }
  };

  // Toggle single selection
  const handleToggleSelect = (pId: string) => {
    setSelectedProgramIds(prev => 
      prev.includes(pId) ? prev.filter(id => id !== pId) : [...prev, pId]
    );
  };

  // Submit Bulk Action Modal
  const handleApplyBulkAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProgramIds.length === 0) return;

    const updates: Partial<Program> = {
      statusPendaftaran: bulkStatusTarget,
    };
    if (bulkTanggalBuka) updates.tanggalBukaPendaftaran = bulkTanggalBuka;
    if (bulkTanggalTutup) updates.tanggalTutupPendaftaran = bulkTanggalTutup;
    if (bulkKuota && !isNaN(Number(bulkKuota))) updates.kuotaPeserta = Number(bulkKuota);

    bulkUpdateProgramsRegistration(selectedProgramIds, updates);
    onRefreshData();
    setBulkModalOpen(false);
    setSelectedProgramIds([]);
    showToast(`Berhasil memperbarui pengaturan untuk ${selectedProgramIds.length} program pelatihan!`, 'success');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold border ${
            toastMessage.type === 'success' 
              ? 'bg-[#002B66] text-white border-[#FDB913]' 
              : toastMessage.type === 'error'
                ? 'bg-rose-600 text-white border-rose-400'
                : 'bg-slate-800 text-white border-slate-600'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#FDB913] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <UnpadLogo variant="color" size="sm" />
          <div className="border-l border-slate-200 pl-3.5">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Pengaturan Pendaftaran Peserta
              </h1>
              <span className={`text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border shadow-2xs ${
                globalConfig.statusPendaftaranGlobal === 'Buka'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${globalConfig.statusPendaftaranGlobal === 'Buka' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span>Status Global: {globalConfig.statusPendaftaranGlobal.toUpperCase()}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
              Kontrol status buka-tutup pendaftaran program pelatihan, batas kuota peserta, periode pendaftaran, dan penyesuaian otomatis per kategori pelatihan.
            </p>
          </div>
        </div>

        {/* Global Master Switch & Preview Action */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {onNavigateToPublicRegistration && (
            <button
              type="button"
              id="btn-preview-public-registration"
              onClick={onNavigateToPublicRegistration}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#002B66] text-xs font-bold transition-all border border-blue-200 cursor-pointer shadow-xs"
              title="Pratinjau formulir pendaftaran yang dilihat oleh publik"
            >
              <Eye className="w-3.5 h-3.5 text-[#002B66]" />
              <span>Pratinjau Publik</span>
            </button>
          )}

          {userRole !== 'VIEWER' && (
            <button
              type="button"
              id="btn-toggle-global-registration"
              onClick={handleToggleGlobalSwitch}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer ${
                globalConfig.statusPendaftaranGlobal === 'Buka'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {globalConfig.statusPendaftaranGlobal === 'Buka' ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-rose-200" />
                  <span>Tutup Pendaftaran Global</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Buka Pendaftaran Global</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Global Status Warning Alert if Closed */}
      {globalConfig.statusPendaftaranGlobal === 'Tutup' && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-rose-900 flex items-center gap-2">
                <span>Pendaftaran Peserta Sedang Ditutup Secara Global</span>
                <span className="text-[10px] bg-rose-200 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                  Semua Program Terkunci
                </span>
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                Calon peserta yang membuka portal pendaftaran online tidak dapat mengirim formulir pendaftaran baru.
                Pesan publik: &ldquo;{globalConfig.pesanPendaftaranDitutup}&rdquo;
              </p>
            </div>
          </div>

          {userRole !== 'VIEWER' && (
            <button
              type="button"
              onClick={handleToggleGlobalSwitch}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              Aktifkan Sekarang
            </button>
          )}
        </div>
      )}

      {/* 4 Quick Stat Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Program</span>
            <GraduationCap className="w-4 h-4 text-[#002B66]" />
          </div>
          <div className="text-2xl font-black text-[#002B66]">{overallStats.total}</div>
          <span className="text-[10px] text-slate-400 font-medium">Dalam {kategoriList.length} kategori pelatihan</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-semibold">Pendaftaran Buka</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{overallStats.buka}</div>
          <span className="text-[10px] text-emerald-700 font-medium">Siap menerima pendaftar baru</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-xs font-semibold">Pendaftaran Ditutup</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">{overallStats.tutup}</div>
          <span className="text-[10px] text-rose-700 font-medium">Terkunci / Masa lewat</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-semibold">Kuota Penuh / Segera</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{overallStats.penuh + overallStats.segera}</div>
          <span className="text-[10px] text-amber-700 font-medium">{overallStats.penuh} penuh • {overallStats.segera} segera dibuka</span>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 flex items-center gap-1.5 shadow-xs">
        <button
          type="button"
          id="tab-btn-program"
          onClick={() => setActiveTab('program')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'program'
              ? 'bg-[#002B66] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Daftar Buka/Tutup Program ({overallStats.total})</span>
        </button>

        <button
          type="button"
          id="tab-btn-kategori"
          onClick={() => setActiveTab('kategori')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'kategori'
              ? 'bg-[#002B66] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Aksi per Kategori Pelatihan ({kategoriList.length})</span>
        </button>

        <button
          type="button"
          id="tab-btn-global-config"
          onClick={() => setActiveTab('global_config')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'global_config'
              ? 'bg-[#002B66] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Aturan Otomasi & Notifikasi</span>
        </button>
      </div>

      {/* TAB 1: PROGRAM-LEVEL BUKA/TUTUP MANAGEMENT */}
      {activeTab === 'program' && (
        <div className="space-y-4">
          {/* Filters and Search Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama program pelatihan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#002B66] focus:ring-1 focus:ring-[#002B66] outline-none"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              {/* Category Filter */}
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="flex-1 md:flex-initial bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg px-3 py-2 outline-none cursor-pointer focus:bg-white focus:border-[#002B66]"
              >
                <option value="ALL">Semua Kategori ({kategoriList.length})</option>
                {kategoriList.map(k => (
                  <option key={k.idKategori} value={k.idKategori}>
                    {k.namaKategori}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 md:flex-initial bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg px-3 py-2 outline-none cursor-pointer focus:bg-white focus:border-[#002B66]"
              >
                <option value="ALL">Semua Status Pendaftaran</option>
                <option value="BUKA">Status Buka</option>
                <option value="TUTUP">Status Ditutup</option>
                <option value="PENUH">Kuota Penuh</option>
                <option value="SEGERA">Segera Dibuka</option>
              </select>

              {/* Reset filter */}
              {(filterKategori !== 'ALL' || filterStatus !== 'ALL' || searchTerm.trim()) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterKategori('ALL');
                    setFilterStatus('ALL');
                    setSearchTerm('');
                  }}
                  className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold cursor-pointer"
                  title="Reset Filter"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Bulk Action Bar if items selected */}
          {selectedProgramIds.length > 0 && userRole !== 'VIEWER' && (
            <div className="bg-[#002B66] text-white p-3 rounded-xl flex items-center justify-between gap-3 shadow-md animate-in fade-in">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-5 h-5 rounded-full bg-[#FDB913] text-[#002B66] font-black flex items-center justify-center text-[10px]">
                  {selectedProgramIds.length}
                </span>
                <span className="font-semibold">program dipilih untuk aksi massal:</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    bulkUpdateProgramsRegistration(selectedProgramIds, { statusPendaftaran: 'Buka' });
                    onRefreshData();
                    setSelectedProgramIds([]);
                    showToast(`${selectedProgramIds.length} program berhasil dibuka!`, 'success');
                  }}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Buka Semua Terpilih
                </button>

                <button
                  type="button"
                  onClick={() => {
                    bulkUpdateProgramsRegistration(selectedProgramIds, { statusPendaftaran: 'Tutup' });
                    onRefreshData();
                    setSelectedProgramIds([]);
                    showToast(`${selectedProgramIds.length} program berhasil ditutup!`, 'info');
                  }}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Tutup Semua Terpilih
                </button>

                <button
                  type="button"
                  onClick={() => setBulkModalOpen(true)}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Atur Jadwal & Kuota Massal...
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProgramIds([])}
                  className="text-white/70 hover:text-white text-xs underline ml-2 cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* Program Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#002B66] text-white">
                  <tr>
                    {userRole !== 'VIEWER' && (
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={filteredPrograms.length > 0 && selectedProgramIds.length === filteredPrograms.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded text-[#002B66] cursor-pointer"
                        />
                      </th>
                    )}
                    <th className="p-3 font-semibold">Nama Program Pelatihan</th>
                    <th className="p-3 font-semibold">Kategori Pelatihan</th>
                    <th className="p-3 font-semibold text-center">Status Pendaftaran</th>
                    <th className="p-3 font-semibold text-center">Batas Kuota</th>
                    <th className="p-3 font-semibold">Periode Pendaftaran</th>
                    <th className="p-3 font-semibold text-center w-40">Aksi Buka/Tutup</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPrograms.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">Tidak ada program yang sesuai dengan filter.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Silakan sesuaikan pilihan kategori atau kata kunci pencarian.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPrograms.map((prog) => {
                      const pId = getProgId(prog);
                      const stats = getProgramStats(prog);
                      const isSelected = selectedProgramIds.includes(prog.idProgram);

                      return (
                        <tr key={pId} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                          {userRole !== 'VIEWER' && (
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(prog.idProgram)}
                                className="rounded text-[#002B66] cursor-pointer"
                              />
                            </td>
                          )}

                          {/* Nama Program */}
                          <td className="p-3">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">
                              {prog.namaProgram}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                              <span>PIC: {prog.namaPic || 'Belum diatur'}</span>
                              <span>•</span>
                              <span>Biaya: {prog.biaya ? `Rp ${prog.biaya.toLocaleString('id-ID')}` : 'Gratis / Kemitraan'}</span>
                            </div>
                            {prog.keteranganPendaftaran && (
                              <div className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded mt-1 inline-block">
                                Catatan: {prog.keteranganPendaftaran}
                              </div>
                            )}
                          </td>

                          {/* Kategori */}
                          <td className="p-3">
                            <span className="font-semibold text-slate-700 block">
                              {getKatName(prog.idKategori)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {prog.idKategori}
                            </span>
                          </td>

                          {/* Status Pendaftaran Badge */}
                          <td className="p-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border ${
                                stats.effectiveStatus === 'Buka'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : stats.effectiveStatus === 'Tutup'
                                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                                    : stats.effectiveStatus === 'Penuh'
                                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                                      : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                              }`}>
                                {stats.effectiveStatus === 'Buka' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                                {stats.effectiveStatus === 'Tutup' && <XCircle className="w-3 h-3 text-rose-600" />}
                                {stats.effectiveStatus === 'Penuh' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                                {stats.effectiveStatus === 'Segera Dibuka' && <Clock className="w-3 h-3 text-indigo-600" />}
                                <span>{stats.effectiveStatus.toUpperCase()}</span>
                              </span>

                              {/* Warning reason if forced closed */}
                              {stats.effectiveStatus !== (prog.statusPendaftaran || 'Buka') && (
                                <span className="text-[10px] text-amber-700 font-semibold" title={stats.reason}>
                                  (Otomatis: {stats.effectiveStatus})
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Kuota Peserta & Progress Bar */}
                          <td className="p-3 text-center min-w-[140px]">
                            <div className="font-bold text-slate-800 text-xs">
                              {stats.totalEnrolled} / {stats.targetQuota} Peserta
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5 border border-slate-200">
                              <div
                                className={`h-full transition-all ${
                                  stats.percent >= 100
                                    ? 'bg-rose-500'
                                    : stats.percent >= 80
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                }`}
                                style={{ width: `${stats.percent}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              {stats.sisa > 0 ? `Sisa ${stats.sisa} kursi` : 'Kuota Habis'}
                            </span>
                          </td>

                          {/* Periode Pendaftaran */}
                          <td className="p-3 min-w-[150px]">
                            {prog.tanggalBukaPendaftaran || prog.tanggalTutupPendaftaran ? (
                              <div className="space-y-0.5">
                                <div className="text-slate-700 font-medium text-[11px] flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span>{prog.tanggalBukaPendaftaran || 'Tanpa Awal'} s/d</span>
                                </div>
                                <div className="text-slate-900 font-bold text-xs pl-4">
                                  {prog.tanggalTutupPendaftaran || 'Tanpa Batas'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                Belum diatur jadwal
                              </span>
                            )}
                          </td>

                          {/* Quick Toggle & Action Buttons */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {/* Quick 1-click Switch */}
                              {userRole !== 'VIEWER' && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickToggleProgram(prog)}
                                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                    prog.statusPendaftaran === 'Buka' || !prog.statusPendaftaran
                                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                                  }`}
                                  title={prog.statusPendaftaran === 'Buka' || !prog.statusPendaftaran ? 'Klik untuk Menutup program ini' : 'Klik untuk Membuka program ini'}
                                >
                                  {prog.statusPendaftaran === 'Buka' || !prog.statusPendaftaran ? (
                                    <ToggleRight className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <ToggleLeft className="w-4 h-4 text-rose-600" />
                                  )}
                                </button>
                              )}

                              {/* Edit Modal Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditProgram(prog)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-200"
                                title="Atur tanggal buka/tutup, kuota, dan status khusus"
                              >
                                {userRole !== 'VIEWER' ? 'Atur Kuota/Jadwal' : 'Lihat Detail'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORY-LEVEL BULK MANAGEMENT */}
      {activeTab === 'kategori' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
            <Info className="w-4 h-4 text-[#002B66] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Aksi Pengaturan Pendaftaran Berdasarkan Kategori:</span>
              <p className="text-blue-800 mt-0.5">
                Anda dapat membuka atau menutup pendaftaran untuk <strong>seluruh program pelatihan</strong> di bawah suatu kategori secara serentak hanya dengan satu kali klik.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kategoriList.map((kat) => {
              const categoryPrograms = programList.filter(p => p.idKategori === kat.idKategori);
              const openCount = categoryPrograms.filter(p => p.statusPendaftaran === 'Buka' || !p.statusPendaftaran).length;
              const closedCount = categoryPrograms.length - openCount;
              const isCategoryClosed = kat.statusPendaftaranKategori === 'Tutup';

              return (
                <div 
                  key={kat.idKategori} 
                  className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                    isCategoryClosed ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200 hover:border-[#002B66]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 block">
                          {kat.idKategori} • Urutan {kat.urutan || '-'}
                        </span>
                        <h3 className="font-black text-slate-900 text-sm">
                          {kat.namaKategori}
                        </h3>
                      </div>
                      
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        isCategoryClosed
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        {isCategoryClosed ? 'KATEGORI DITUTUP' : 'KATEGORI BUKA'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                      {kat.deskripsi || 'Tidak ada deskripsi kategori.'}
                    </p>

                    {/* Program Stats in this Category */}
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 mb-4 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Total Program:</span>
                        <span className="font-bold text-slate-900">{categoryPrograms.length} Program</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Status Buka:</span>
                        </span>
                        <span className="font-bold text-emerald-700">{openCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-rose-700 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Status Ditutup:</span>
                        </span>
                        <span className="font-bold text-rose-700">{closedCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for this category */}
                  {userRole !== 'VIEWER' && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleToggleCategory(kat, 'Buka')}
                        className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold text-center transition-colors cursor-pointer shadow-2xs"
                        title="Buka seluruh program dalam kategori ini"
                      >
                        Buka Semua
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleCategory(kat, 'Tutup')}
                        className="py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold text-center transition-colors cursor-pointer shadow-2xs"
                        title="Tutup seluruh program dalam kategori ini"
                      >
                        Tutup Semua
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: GLOBAL CONFIG & AUTOMATION RULES */}
      {activeTab === 'global_config' && (
        <form onSubmit={handleSaveGlobalConfig} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-black text-slate-900">Aturan Otomasi & Kebijakan Pendaftaran</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Konfigurasi penutupan otomatis berdasarkan kuota dan deadline serta notifikasi kepada calon peserta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            {/* Left: Otomasi Buka/Tutup */}
            <div className="space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Fitur Otomasi Deadline & Kuota
              </h3>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={globalConfig.autoTutupJikaLewatDeadline}
                    onChange={(e) => setGlobalConfig({ ...globalConfig, autoTutupJikaLewatDeadline: e.target.checked })}
                    className="rounded border-slate-300 text-[#002B66] focus:ring-[#002B66] w-4 h-4 mt-0.5 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">
                      Auto-Tutup Jika Batas Waktu Terlewati
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Sistem akan secara otomatis mengubah status program menjadi &ldquo;Ditutup&rdquo; jika tanggal hari ini telah melewati Tanggal Tutup Pendaftaran.
                    </p>
                  </div>
                </label>

                <div className="border-t border-slate-200/80 pt-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={globalConfig.autoTutupJikaKuotaPenuh}
                      onChange={(e) => setGlobalConfig({ ...globalConfig, autoTutupJikaKuotaPenuh: e.target.checked })}
                      className="rounded border-slate-300 text-[#002B66] focus:ring-[#002B66] w-4 h-4 mt-0.5 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">
                        Auto-Tutup Jika Kuota Peserta Terpenuhi
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Sistem akan menandai program sebagai &ldquo;Kuota Penuh&rdquo; jika jumlah peserta terdaftar telah mencapai atau melebihi target kuota.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Tampilkan Kuota & Periode di Publik */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-1">
                  Transparansi Tampilan Publik
                </h3>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={globalConfig.tampilkanSisaKuotaPublik}
                    onChange={(e) => setGlobalConfig({ ...globalConfig, tampilkanSisaKuotaPublik: e.target.checked })}
                    className="rounded border-slate-300 text-[#002B66] focus:ring-[#002B66] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Tampilkan sisa kuota kursi peserta pada portal pendaftaran publik
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={globalConfig.tampilkanPeriodePublik}
                    onChange={(e) => setGlobalConfig({ ...globalConfig, tampilkanPeriodePublik: e.target.checked })}
                    className="rounded border-slate-300 text-[#002B66] focus:ring-[#002B66] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Tampilkan tanggal periode buka/tutup pada kartu informasi program
                  </span>
                </label>
              </div>
            </div>

            {/* Right: Pesan & Pengumuman */}
            <div className="space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Kontak Bantuan & Pesan Penutupan
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pesan Banner Saat Pendaftaran Ditutup
                </label>
                <textarea
                  rows={3}
                  value={globalConfig.pesanPendaftaranDitutup || ''}
                  onChange={(e) => setGlobalConfig({ ...globalConfig, pesanPendaftaranDitutup: e.target.value })}
                  placeholder="Pesan yang tampil bagi pengunjung publik jika pendaftaran ditutup..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#002B66] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pengumuman Pendaftaran Publik
                </label>
                <textarea
                  rows={3}
                  value={globalConfig.pengumumanPendaftaran || ''}
                  onChange={(e) => setGlobalConfig({ ...globalConfig, pengumumanPendaftaran: e.target.value })}
                  placeholder="Pengumuman penting untuk pendaftar..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#002B66] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp Bantuan
                  </label>
                  <input
                    type="text"
                    value={globalConfig.kontakBantuanWa || ''}
                    onChange={(e) => setGlobalConfig({ ...globalConfig, kontakBantuanWa: e.target.value })}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:border-[#002B66] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Resmi Layanan
                  </label>
                  <input
                    type="email"
                    value={globalConfig.kontakBantuanEmail || ''}
                    onChange={(e) => setGlobalConfig({ ...globalConfig, kontakBantuanEmail: e.target.value })}
                    placeholder="dpng@unpad.ac.id"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:border-[#002B66] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {userRole !== 'VIEWER' && (
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-[#002B66] hover:bg-[#001D45] text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4 text-[#FDB913]" />
                <span>Simpan Aturan Otomasi & Kebijakan</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* MODAL 1: EDIT SINGLE PROGRAM REGISTRATION SCHEDULE & QUOTA */}
      {editModalOpen && selectedProgramForEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#002B66] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                  Pengaturan Pendaftaran Program
                </span>
                <h3 className="text-base font-black text-white">
                  {selectedProgramForEdit.namaProgram}
                </h3>
                <span className="text-xs text-blue-100">
                  Kategori: {getKatName(selectedProgramForEdit.idKategori)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProgramModal} className="p-5 space-y-4 text-xs">
              {/* Status Radio Choices */}
              <div>
                <label className="block font-bold text-slate-800 mb-2">
                  Status Buka / Tutup Pendaftaran:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Buka', 'Tutup', 'Segera Dibuka', 'Penuh'] as StatusPendaftaranProgram[]).map((st) => (
                    <label
                      key={st}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        editStatusPendaftaran === st
                          ? 'border-[#002B66] bg-blue-50/70 font-bold text-[#002B66]'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="modalStatusRadio"
                        value={st}
                        checked={editStatusPendaftaran === st}
                        onChange={() => setEditStatusPendaftaran(st)}
                        className="text-[#002B66] focus:ring-[#002B66]"
                      />
                      <span>{st}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Kuota Target */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Target Kuota Peserta (Orang)
                </label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={editKuota}
                  onChange={(e) => setEditKuota(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#002B66] outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Saat ini terdaftar: {getProgramStats(selectedProgramForEdit).totalEnrolled} peserta.
                </span>
              </div>

              {/* Tanggal Periode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Tanggal Buka Pendaftaran
                  </label>
                  <input
                    type="date"
                    value={editTanggalBuka}
                    onChange={(e) => setEditTanggalBuka(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#002B66] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Tanggal Tutup Pendaftaran
                  </label>
                  <input
                    type="date"
                    value={editTanggalTutup}
                    onChange={(e) => setEditTanggalTutup(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#002B66] outline-none"
                  />
                </div>
              </div>

              {/* Keterangan / Catatan Khusus */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Keterangan Pendaftaran (Tampil di Formulir Publik)
                </label>
                <textarea
                  rows={2}
                  value={editKeterangan}
                  onChange={(e) => setEditKeterangan(e.target.value)}
                  placeholder="Contoh: Batch 2 khusus praktisi rumah sakit atau umum..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#002B66] outline-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#002B66] hover:bg-[#001D45] text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK UPDATE SCHEDULE & QUOTA */}
      {bulkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 sm:p-5 bg-[#002B66] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">
                  Atur {selectedProgramIds.length} Program Sekaligus
                </h3>
                <span className="text-xs text-blue-100">
                  Terapkan status, tanggal, atau kuota massal
                </span>
              </div>
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyBulkAction} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Pilih Status Pendaftaran Massal:
                </label>
                <select
                  value={bulkStatusTarget}
                  onChange={(e) => setBulkStatusTarget(e.target.value as StatusPendaftaranProgram)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                >
                  <option value="Buka">Buka Pendaftaran</option>
                  <option value="Tutup">Tutup Pendaftaran</option>
                  <option value="Segera Dibuka">Segera Dibuka</option>
                  <option value="Penuh">Kuota Penuh</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Tanggal Buka (Opsional)
                  </label>
                  <input
                    type="date"
                    value={bulkTanggalBuka}
                    onChange={(e) => setBulkTanggalBuka(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Tanggal Tutup (Opsional)
                  </label>
                  <input
                    type="date"
                    value={bulkTanggalTutup}
                    onChange={(e) => setBulkTanggalTutup(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Target Kuota Peserta (Kosongkan jika tidak diubah)
                </label>
                <input
                  type="number"
                  placeholder="Misal: 30"
                  value={bulkKuota}
                  onChange={(e) => setBulkKuota(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#002B66] hover:bg-[#001D45] text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Terapkan ke {selectedProgramIds.length} Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
