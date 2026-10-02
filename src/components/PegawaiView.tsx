import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Briefcase, Plus, Search, Filter, Phone, Mail, 
  Building2, GraduationCap, Edit2, Trash2, CheckCircle2, 
  X, Download, Upload, FileSpreadsheet, CheckSquare, 
  ChevronLeft, ChevronRight, SlidersHorizontal, Eye, 
  Printer, User, Award, MapPin, Calendar, ChevronDown,
  BarChart3
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Pegawai, UserRole } from '../types';
import { PegawaiImportModal } from './PegawaiImportModal';
import { PegawaiPdfPreviewModal } from './PegawaiPdfPreviewModal';
import { PegawaiDashboardView } from './PegawaiDashboardView';
import { bulkImportPegawai } from '../services/storageService';

interface PegawaiViewProps {
  pegawaiList: Pegawai[];
  userRole: UserRole;
  onSavePegawai: (pegawai: Pegawai) => void;
  onDeletePegawai: (id: string) => void;
  onDeleteMultiplePegawai?: (ids: string[]) => void;
  onBulkImportPegawai?: (
    items: Array<Partial<Pegawai>>,
    mode: 'skip' | 'update' | 'force'
  ) => { success: boolean; message: string; count: number };
  onRefreshData?: () => void;
  initialViewMode?: 'dashboard' | 'table';
}

const DEFAULT_FORM_PEGAWAI: Partial<Pegawai> = {
  nip: '',
  nama: '',
  kartuPegawai: '',
  statusKepegawaian: 'PNS',
  unitKerja: 'Direktorat Pendidikan Non Gelar',
  bagian: '',
  bidangKerja: '',
  nidnNuptk: '',
  statusAktif: 'Aktif',
  keteranganStatusAktif: '',
  tanggalDitetapkanStatus: '',
  tempatLahir: '',
  tanggalLahir: '',
  jenisKelamin: 'Laki-laki',
  agama: 'Islam',
  golonganDarah: 'O',
  sukuBangsa: 'Sunda',
  kewarganegaraan: 'WNI',
  statusMarital: 'Kawin',
  alamat: '',
  kecamatan: '',
  kelurahan: '',
  rt: '',
  rw: '',
  kota: '',
  propinsi: 'Jawa Barat',
  kodePos: '',
  telepon: '',
  hp: '',
  email: '',
  lembagaPendidikan: '',
  jenjang: 'S1',
  jurusan: '',
  tempat: '',
  tahunLulus: new Date().getFullYear(),
  gelarDepan: '',
  gelarBelakang: '',
  pangkat: 'Penata Muda',
  golongan: 'III/a',
  jabatanStruktural: '',
  periode: '',
  unitKerjaJabatanStruktural: '',
  jabatanFungsional: ''
};

export const PegawaiView: React.FC<PegawaiViewProps> = ({
  pegawaiList,
  userRole,
  onSavePegawai,
  onDeletePegawai,
  onDeleteMultiplePegawai,
  onBulkImportPegawai,
  onRefreshData,
  initialViewMode = 'dashboard'
}) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'table'>(initialViewMode);

  useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode);
    }
  }, [initialViewMode]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [kepegawaianFilter, setKepegawaianFilter] = useState('ALL');
  const [unitFilter, setUnitFilter] = useState('ALL');

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [masterSelectMenuOpen, setMasterSelectMenuOpen] = useState(false);
  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<keyof Pegawai>('nama');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals
  const [detailModalPegawai, setDetailModalPegawai] = useState<Pegawai | null>(null);
  const [pdfPreviewPegawai, setPdfPreviewPegawai] = useState<Pegawai | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPegawai, setEditingPegawai] = useState<Partial<Pegawai> | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'kepegawaian' | 'pribadi' | 'kontak' | 'pendidikan' | 'jabatan'>('kepegawaian');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<Pegawai | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Filtered & Sorted
  const filteredData = useMemo(() => {
    return pegawaiList.filter(p => {
      if (statusFilter !== 'ALL' && p.statusAktif !== statusFilter) return false;
      if (kepegawaianFilter !== 'ALL' && p.statusKepegawaian !== kepegawaianFilter) return false;
      if (unitFilter !== 'ALL' && p.unitKerja !== unitFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          (p.nama && p.nama.toLowerCase().includes(q)) ||
          (p.nip && p.nip.toLowerCase().includes(q)) ||
          (p.kartuPegawai && p.kartuPegawai.toLowerCase().includes(q)) ||
          (p.unitKerja && p.unitKerja.toLowerCase().includes(q)) ||
          (p.email && p.email.toLowerCase().includes(q)) ||
          (p.hp && p.hp.toLowerCase().includes(q)) ||
          (p.jabatanStruktural && p.jabatanStruktural.toLowerCase().includes(q)) ||
          (p.jabatanFungsional && p.jabatanFungsional.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    }).sort((a, b) => {
      const valA = a[sortField] || '';
      const valB = b[sortField] || '';
      const cmp = String(valA).localeCompare(String(valB));
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [pegawaiList, searchTerm, statusFilter, kepegawaianFilter, unitFilter, sortField, sortOrder]);

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Selection Lookups
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const isAllPageSelected = paginatedData.length > 0 && paginatedData.every(p => selectedIdSet.has(p.id));
  const isSomePageSelected = paginatedData.some(p => selectedIdSet.has(p.id));

  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = isSomePageSelected && !isAllPageSelected;
    }
  }, [isSomePageSelected, isAllPageSelected]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleToggleMasterCheckbox = () => {
    if (isAllPageSelected) {
      const pageIds = new Set(paginatedData.map(p => p.id));
      setSelectedIds(prev => prev.filter(id => !pageIds.has(id)));
    } else {
      const next = new Set(selectedIds);
      paginatedData.forEach(p => next.add(p.id));
      setSelectedIds(Array.from(next));
    }
  };

  const selectedPegawaiList = useMemo(() => {
    return pegawaiList.filter(p => selectedIdSet.has(p.id));
  }, [pegawaiList, selectedIdSet]);

  // Export to Excel All / Selected
  const handleExportExcel = (targetList: Pegawai[] = filteredData) => {
    if (targetList.length === 0) return;
    const rows = targetList.map((p, idx) => ({
      'No': idx + 1,
      'NIP': p.nip || '',
      'Nama': p.nama || '',
      'Kartu Pegawai': p.kartuPegawai || '',
      'Status Kepegawaian': p.statusKepegawaian || '',
      'Unit Kerja': p.unitKerja || '',
      'Bagian': p.bagian || '',
      'Bidang Kerja': p.bidangKerja || '',
      'NIDN/NUPTK': p.nidnNuptk || '',
      'Status Aktif': p.statusAktif || '',
      'Keterangan Status Aktif': p.keteranganStatusAktif || '',
      'Tanggal Ditetapkan Status': p.tanggalDitetapkanStatus || '',
      'Tempat Lahir': p.tempatLahir || '',
      'Tanggal Lahir': p.tanggalLahir || '',
      'Jenis Kelamin': p.jenisKelamin || '',
      'Agama': p.agama || '',
      'Golongan Darah': p.golonganDarah || '',
      'Suku Bangsa': p.sukuBangsa || '',
      'Kewarganegaraan': p.kewarganegaraan || '',
      'Status Marital': p.statusMarital || '',
      'Alamat': p.alamat || '',
      'Kecamatan': p.kecamatan || '',
      'Kelurahan': p.kelurahan || '',
      'RT': p.rt || '',
      'RW': p.rw || '',
      'Kota': p.kota || '',
      'Propinsi': p.propinsi || '',
      'Kode Pos': p.kodePos || '',
      'Telepon': p.telepon || '',
      'HP': p.hp || '',
      'Email': p.email || '',
      'Lembaga Pendidikan': p.lembagaPendidikan || '',
      'Jenjang': p.jenjang || '',
      'Jurusan': p.jurusan || '',
      'Tempat': p.tempat || '',
      'Tahun Lulus': p.tahunLulus || '',
      'Gelar Depan': p.gelarDepan || '',
      'Gelar Belakang': p.gelarBelakang || '',
      'Pangkat': p.pangkat || '',
      'Golongan': p.golongan || '',
      'Jabatan Struktural': p.jabatanStruktural || '',
      'Periode': p.periode || '',
      'Unit Kerja Jabatan Struktural': p.unitKerjaJabatanStruktural || '',
      'Jabatan Fungsional': p.jabatanFungsional || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Pegawai Unpad');
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Data_Pegawai_Unpad_${targetList.length}_data_${dateStr}.xlsx`);
    showNotification(`Export ${targetList.length} data pegawai berhasil diunduh!`);
  };

  // Unit Kerja options
  const unitKerjaOptions = useMemo(() => {
    const set = new Set(pegawaiList.map(p => p.unitKerja).filter(Boolean));
    return Array.from(set);
  }, [pegawaiList]);

  // Form Save
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPegawai?.nama || !editingPegawai?.nip) {
      alert('Nama dan NIP wajib diisi.');
      return;
    }
    onSavePegawai(editingPegawai as Pegawai);
    setIsFormModalOpen(false);
    setEditingPegawai(null);
    showNotification(`Data pegawai ${editingPegawai.nama} berhasil disimpan!`);
    if (onRefreshData) onRefreshData();
  };

  // Bulk Delete
  const handleConfirmBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (onDeleteMultiplePegawai) {
      onDeleteMultiplePegawai(selectedIds);
    } else {
      selectedIds.forEach(id => onDeletePegawai(id));
    }
    showNotification(`${selectedIds.length} data pegawai berhasil dihapus.`);
    setSelectedIds([]);
    setBulkDeleteConfirmOpen(false);
    if (onRefreshData) onRefreshData();
  };

  // Bulk Import handler
  const handleImportSuccess = (
    items: Array<Partial<Pegawai>>,
    mode: 'skip' | 'update' | 'force'
  ) => {
    let res;
    if (onBulkImportPegawai) {
      res = onBulkImportPegawai(items, mode);
    } else {
      res = bulkImportPegawai(items, mode);
    }
    showNotification(res.message);
    if (onRefreshData) onRefreshData();
    return res;
  };

  return (
    <div className="space-y-4 pb-20 relative">
      {/* View Switcher: Dashboard & Statistik vs Tabel Master Pegawai */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'dashboard'
                ? 'bg-[#002B66] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-[#FDB913]" />
            <span>Dashboard & Statistik</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              viewMode === 'dashboard' ? 'bg-[#FDB913] text-[#002B66]' : 'bg-slate-200 text-slate-700'
            }`}>
              Analitik
            </span>
          </button>

          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-[#002B66] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4 text-[#FDB913]" />
            <span>Tabel Master Pegawai</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              viewMode === 'table' ? 'bg-[#FDB913] text-[#002B66]' : 'bg-slate-200 text-slate-700'
            }`}>
              {pegawaiList.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {viewMode === 'table' ? (
            <button
              onClick={() => setViewMode('dashboard')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#002B66] border border-blue-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#FDB913]" />
              <span>Buka Dashboard</span>
            </button>
          ) : (
            <button
              onClick={() => setViewMode('table')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5 text-slate-500" />
              <span>Buka Tabel ({filteredData.length})</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === 'dashboard' ? (
        <PegawaiDashboardView
          pegawaiList={pegawaiList}
          userRole={userRole}
          onNavigateToTable={(filters) => {
            if (filters?.statusKepegawaian) setKepegawaianFilter(filters.statusKepegawaian);
            if (filters?.statusAktif) setStatusFilter(filters.statusAktif);
            if (filters?.unitKerja) setUnitFilter(filters.unitKerja);
            if (filters?.searchQuery) setSearchTerm(filters.searchQuery);
            setCurrentPage(1);
            setViewMode('table');
          }}
          onAddNewPegawai={() => {
            setEditingPegawai({ ...DEFAULT_FORM_PEGAWAI });
            setActiveFormTab('kepegawaian');
            setIsFormModalOpen(true);
          }}
        />
      ) : (
        <>
          {/* Header & KPI */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#002B66] text-[#FDB913] flex items-center justify-center font-bold shadow-xs">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#002B66]">Master Data Pegawai</h1>
            <p className="text-xs text-slate-500">
              Database dosen, tenaga kependidikan, jabatan fungsional & struktural Universitas Padjadjaran ({pegawaiList.length} pegawai)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {userRole !== 'VIEWER' && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-300 shadow-xs cursor-pointer transition-colors"
              title="Import data pegawai dari Excel (.xlsx) atau CSV (.csv)"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-700" />
              <span>Import Data</span>
            </button>
          )}

          <button
            onClick={() => handleExportExcel(filteredData)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 cursor-pointer"
            title="Export Excel seluruh data hasil filter"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          {userRole !== 'VIEWER' && (
            <button
              onClick={() => {
                setEditingPegawai({ ...DEFAULT_FORM_PEGAWAI });
                setActiveFormTab('kepegawaian');
                setIsFormModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#FDB913]" />
              <span>Tambah Pegawai</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-800 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="p-1 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari NIP, Nama, Karpeg, Unit Kerja, Jabatan, Email, HP..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66] focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={kepegawaianFilter}
              onChange={(e) => { setKepegawaianFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700"
            >
              <option value="ALL">Semua Status Kepegawaian</option>
              <option value="PNS">PNS</option>
              <option value="PPPK">PPPK</option>
              <option value="Pegawai Tetap Non-PNS">Pegawai Tetap Non-PNS</option>
              <option value="Kontrak">Kontrak</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700"
            >
              <option value="ALL">Semua Status Aktif</option>
              <option value="Aktif">Aktif</option>
              <option value="Tugas Belajar">Tugas Belajar</option>
              <option value="Cuti">Cuti</option>
              <option value="Pensiun">Pensiun</option>
            </select>

            <select
              value={unitFilter}
              onChange={(e) => { setUnitFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 max-w-[200px] truncate"
            >
              <option value="ALL">Semua Unit Kerja</option>
              {unitKerjaOptions.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#002B66] text-white font-bold tracking-wide select-none">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    ref={masterCheckboxRef}
                    type="checkbox"
                    checked={paginatedData.length > 0 && isAllPageSelected}
                    onChange={handleToggleMasterCheckbox}
                    className="w-4 h-4 rounded text-[#002B66] cursor-pointer accent-[#FDB913]"
                    title="Pilih semua di halaman ini"
                  />
                </th>
                <th className="p-3 w-10 text-center">No</th>
                <th onClick={() => { setSortField('nip'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} className="p-3 cursor-pointer hover:bg-[#083a7e]">
                  NIP / Karpeg
                </th>
                <th onClick={() => { setSortField('nama'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} className="p-3 cursor-pointer hover:bg-[#083a7e]">
                  Nama Lengkap
                </th>
                <th className="p-3">Status Kepegawaian</th>
                <th className="p-3">Unit Kerja & Bagian</th>
                <th className="p-3">Jabatan & Golongan</th>
                <th className="p-3">Pendidikan</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-400">
                    Tidak ada data pegawai yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                paginatedData.map((p, idx) => {
                  const globalNo = (currentPage - 1) * pageSize + idx + 1;
                  const isSelected = selectedIdSet.has(p.id);
                  const fullTitle = [p.gelarDepan, p.nama, p.gelarBelakang].filter(Boolean).join(' ');

                  return (
                    <tr
                      key={p.id}
                      onClick={() => handleToggleSelect(p.id)}
                      className={`transition-colors cursor-pointer select-none ${
                        isSelected 
                          ? 'bg-blue-50/80 hover:bg-blue-100/70 border-l-4 border-l-[#002B66]' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(p.id)}
                          className="w-4 h-4 rounded text-[#002B66] cursor-pointer accent-[#002B66]"
                        />
                      </td>
                      <td className="p-3 text-center text-slate-400 font-medium">{globalNo}</td>
                      <td className="p-3 font-mono">
                        <div className="font-bold text-[#002B66]">{p.nip || '-'}</div>
                        <div className="text-[10px] text-slate-400">{p.kartuPegawai || p.id}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{fullTitle || p.nama}</div>
                        <div className="text-[10px] text-slate-500">{p.email || p.hp || '-'}</div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          p.statusKepegawaian === 'PNS' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          p.statusKepegawaian === 'PPPK' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {p.statusKepegawaian}
                        </span>
                        {p.nidnNuptk && p.nidnNuptk !== '-' && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">NIDN: {p.nidnNuptk}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-700 truncate max-w-[180px]" title={p.unitKerja}>
                          {p.unitKerja}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px]" title={p.bagian}>
                          {p.bagian || p.bidangKerja || '-'}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-800">{p.jabatanStruktural || p.jabatanFungsional || '-'}</div>
                        <div className="text-[10px] text-slate-500">
                          {p.pangkat} ({p.golongan})
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">
                        <span className="font-semibold text-slate-800">{p.jenjang || '-'}</span> {p.jurusan ? `• ${p.jurusan}` : ''}
                        <div className="text-[10px] text-slate-400">{p.lembagaPendidikan || ''}</div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          p.statusAktif === 'Aktif' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          p.statusAktif === 'Tugas Belajar' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                          {p.statusAktif}
                        </span>
                      </td>
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setPdfPreviewPegawai(p)}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer transition-colors"
                            title="Cetak & Save As PDF (Preview A4 Resmi)"
                          >
                            <Printer className="w-4 h-4 text-emerald-600" />
                          </button>
                          <button
                            onClick={() => setDetailModalPegawai(p)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                            title="Lihat Detail Profil Pegawai"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {userRole !== 'VIEWER' && (
                            <button
                              onClick={() => {
                                setEditingPegawai({ ...p });
                                setActiveFormTab('kepegawaian');
                                setIsFormModalOpen(true);
                              }}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                              title="Edit Data Pegawai"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {userRole === 'ADMIN' && (
                            <button
                              onClick={() => setDeleteConfirmTarget(p)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                              title="Hapus Pegawai"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Menampilkan {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} dari {totalItems} pegawai
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-[#002B66]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-4xl bg-[#002B66] text-white px-4 py-3 rounded-2xl shadow-2xl border border-blue-400/40 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FDB913] text-[#002B66] flex items-center justify-center font-bold text-xs">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm">{selectedIds.length} Pegawai Terpilih</span>
              <p className="text-[11px] text-slate-300">Aksi massal data terpilih</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.length === 1 && (
              <button
                onClick={() => {
                  const target = pegawaiList.find(p => p.id === selectedIds[0]);
                  if (target) setPdfPreviewPegawai(target);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#FDB913] hover:bg-[#e0a410] text-[#002B66] rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all"
                title="Cetak biodata pegawai terpilih sebagai PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak PDF</span>
              </button>
            )}

            <button
              onClick={() => handleExportExcel(selectedPegawaiList)}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel ({selectedIds.length})</span>
            </button>

            {userRole === 'ADMIN' && (
              <button
                onClick={() => setBulkDeleteConfirmOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            )}

            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Modal Detail Profil Pegawai */}
      {detailModalPegawai && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#002B66] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#FDB913] text-[#002B66] flex items-center justify-center font-bold text-lg">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {[detailModalPegawai.gelarDepan, detailModalPegawai.nama, detailModalPegawai.gelarBelakang].filter(Boolean).join(' ')}
                  </h3>
                  <p className="text-xs text-amber-300 font-mono">NIP: {detailModalPegawai.nip} • {detailModalPegawai.statusKepegawaian}</p>
                </div>
              </div>
              <button onClick={() => setDetailModalPegawai(null)} className="p-1 hover:bg-white/10 rounded">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Section 1: Kepegawaian & Jabatan */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm border-b pb-1.5 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#002B66]" /> Kepegawaian & Jabatan
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><span className="text-slate-400 block">Kartu Pegawai:</span> <strong className="text-slate-800">{detailModalPegawai.kartuPegawai || '-'}</strong></div>
                  <div><span className="text-slate-400 block">Status Kepegawaian:</span> <strong className="text-slate-800">{detailModalPegawai.statusKepegawaian}</strong></div>
                  <div><span className="text-slate-400 block">Unit Kerja:</span> <strong className="text-slate-800">{detailModalPegawai.unitKerja}</strong></div>
                  <div><span className="text-slate-400 block">Bagian:</span> <strong className="text-slate-800">{detailModalPegawai.bagian || '-'}</strong></div>
                  <div><span className="text-slate-400 block">Bidang Kerja:</span> <strong className="text-slate-800">{detailModalPegawai.bidangKerja || '-'}</strong></div>
                  <div><span className="text-slate-400 block">NIDN / NUPTK:</span> <strong className="text-slate-800">{detailModalPegawai.nidnNuptk || '-'}</strong></div>
                  <div><span className="text-slate-400 block">Status Aktif:</span> <strong className="text-emerald-700">{detailModalPegawai.statusAktif}</strong></div>
                  <div><span className="text-slate-400 block">Tanggal Ditetapkan Status:</span> <strong className="text-slate-800">{detailModalPegawai.tanggalDitetapkanStatus || '-'}</strong></div>
                  <div><span className="text-slate-400 block">Keterangan Status:</span> <strong className="text-slate-800">{detailModalPegawai.keteranganStatusAktif || '-'}</strong></div>
                  <div><span className="text-slate-400 block">Pangkat / Golongan:</span> <strong className="text-slate-800">{detailModalPegawai.pangkat} ({detailModalPegawai.golongan})</strong></div>
                  <div><span className="text-slate-400 block">Jabatan Fungsional:</span> <strong className="text-slate-800">{detailModalPegawai.jabatanFungsional || '-'}</strong></div>
                  <div><span className="text-slate-400 block">Jabatan Struktural:</span> <strong className="text-slate-800">{detailModalPegawai.jabatanStruktural || '-'}</strong></div>
                  <div><span className="text-slate-400 block">Periode Struktural:</span> <strong className="text-slate-800">{detailModalPegawai.periode || '-'}</strong></div>
                  <div><span className="text-slate-400 block">Unit Kerja Struktural:</span> <strong className="text-slate-800">{detailModalPegawai.unitKerjaJabatanStruktural || '-'}</strong></div>
                </div>
              </div>

              {/* Section 2: Data Pribadi & Domisili */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm border-b pb-1.5 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#002B66]" /> Biodata Pribadi
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><span className="text-slate-400 block">Tempat, Tanggal Lahir:</span> <strong className="text-slate-800">{detailModalPegawai.tempatLahir}, {detailModalPegawai.tanggalLahir}</strong></div>
                  <div><span className="text-slate-400 block">Jenis Kelamin:</span> <strong className="text-slate-800">{detailModalPegawai.jenisKelamin}</strong></div>
                  <div><span className="text-slate-400 block">Agama:</span> <strong className="text-slate-800">{detailModalPegawai.agama}</strong></div>
                  <div><span className="text-slate-400 block">Golongan Darah:</span> <strong className="text-slate-800">{detailModalPegawai.golonganDarah || '-'}</strong></div>
                  <div><span className="text-slate-400 block">Suku Bangsa:</span> <strong className="text-slate-800">{detailModalPegawai.sukuBangsa || '-'}</strong></div>
                  <div><span className="text-slate-400 block">Kewarganegaraan:</span> <strong className="text-slate-800">{detailModalPegawai.kewarganegaraan}</strong></div>
                  <div><span className="text-slate-400 block">Status Marital:</span> <strong className="text-slate-800">{detailModalPegawai.statusMarital}</strong></div>
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-slate-400 block">Alamat Lengkap:</span>
                    <strong className="text-slate-800">
                      {detailModalPegawai.alamat} RT {detailModalPegawai.rt}/RW {detailModalPegawai.rw}, Kel. {detailModalPegawai.kelurahan}, Kec. {detailModalPegawai.kecamatan}, {detailModalPegawai.kota}, {detailModalPegawai.propinsi} {detailModalPegawai.kodePos}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Section 3: Kontak & Komunikasi */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm border-b pb-1.5 mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#002B66]" /> Kontak & Komunikasi
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><span className="text-slate-400 block">Telepon:</span> <strong className="text-slate-800">{detailModalPegawai.telepon || '-'}</strong></div>
                  <div><span className="text-slate-400 block">HP / WhatsApp:</span> <strong className="text-slate-800">{detailModalPegawai.hp || '-'}</strong></div>
                  <div><span className="text-slate-400 block">Email Institusi:</span> <strong className="text-blue-700 font-mono">{detailModalPegawai.email || '-'}</strong></div>
                </div>
              </div>

              {/* Section 4: Riwayat Pendidikan */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm border-b pb-1.5 mb-3 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#002B66]" /> Riwayat Pendidikan
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><span className="text-slate-400 block">Jenjang & Jurusan:</span> <strong className="text-slate-800">{detailModalPegawai.jenjang} - {detailModalPegawai.jurusan}</strong></div>
                  <div><span className="text-slate-400 block">Lembaga Pendidikan:</span> <strong className="text-slate-800">{detailModalPegawai.lembagaPendidikan}</strong></div>
                  <div><span className="text-slate-400 block">Tempat:</span> <strong className="text-slate-800">{detailModalPegawai.tempat}</strong></div>
                  <div><span className="text-slate-400 block">Tahun Lulus:</span> <strong className="text-slate-800">{detailModalPegawai.tahunLulus}</strong></div>
                  <div><span className="text-slate-400 block">Gelar:</span> <strong className="text-slate-800">{detailModalPegawai.gelarDepan || '-'} / {detailModalPegawai.gelarBelakang || '-'}</strong></div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  setPdfPreviewPegawai(detailModalPegawai);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer transition-colors"
                title="Buka dokumen biodata A4 siap cetak & unduh PDF"
              >
                <Printer className="w-4 h-4 text-[#FDB913]" /> Cetak & Save As PDF
              </button>
              <button
                onClick={() => setDetailModalPegawai(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Tambah / Edit Modal */}
      {isFormModalOpen && editingPegawai && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#002B66] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingPegawai.id ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="p-1 hover:bg-white/10 rounded">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Form Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold overflow-x-auto">
              {[
                { id: 'kepegawaian', label: '1. Kepegawaian & Jabatan' },
                { id: 'pribadi', label: '2. Data Pribadi & Domisili' },
                { id: 'kontak', label: '3. Kontak' },
                { id: 'pendidikan', label: '4. Pendidikan' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFormTab(tab.id as any)}
                  className={`px-4 py-2.5 whitespace-nowrap cursor-pointer transition-colors ${
                    activeFormTab === tab.id 
                      ? 'border-b-2 border-[#002B66] text-[#002B66] bg-white font-bold' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveForm} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {activeFormTab === 'kepegawaian' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">NIP *</label>
                    <input
                      type="text"
                      required
                      value={editingPegawai.nip || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, nip: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="198106122005011002"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Lengkap (tanpa gelar) *</label>
                    <input
                      type="text"
                      required
                      value={editingPegawai.nama || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, nama: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Nendar Herdiana"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kartu Pegawai (Karpeg)</label>
                    <input
                      type="text"
                      value={editingPegawai.kartuPegawai || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, kartuPegawai: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="KP-19810612..."
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Status Kepegawaian</label>
                    <select
                      value={editingPegawai.statusKepegawaian || 'PNS'}
                      onChange={e => setEditingPegawai({ ...editingPegawai, statusKepegawaian: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    >
                      <option value="PNS">PNS</option>
                      <option value="PPPK">PPPK</option>
                      <option value="Pegawai Tetap Non-PNS">Pegawai Tetap Non-PNS</option>
                      <option value="Kontrak">Kontrak</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Unit Kerja</label>
                    <input
                      type="text"
                      value={editingPegawai.unitKerja || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, unitKerja: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Direktorat Pendidikan Non Gelar"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bagian</label>
                    <input
                      type="text"
                      value={editingPegawai.bagian || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, bagian: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Divisi Teknologi Informasi"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bidang Kerja</label>
                    <input
                      type="text"
                      value={editingPegawai.bidangKerja || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, bidangKerja: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Pengembangan Sistem IT"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">NIDN / NUPTK</label>
                    <input
                      type="text"
                      value={editingPegawai.nidnNuptk || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, nidnNuptk: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="0012068101"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Status Aktif</label>
                    <select
                      value={editingPegawai.statusAktif || 'Aktif'}
                      onChange={e => setEditingPegawai({ ...editingPegawai, statusAktif: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Tugas Belajar">Tugas Belajar</option>
                      <option value="Izin Belajar">Izin Belajar</option>
                      <option value="Cuti">Cuti</option>
                      <option value="Pensiun">Pensiun</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tanggal Ditetapkan Status</label>
                    <input
                      type="date"
                      value={editingPegawai.tanggalDitetapkanStatus || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, tanggalDitetapkanStatus: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pangkat</label>
                    <input
                      type="text"
                      value={editingPegawai.pangkat || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, pangkat: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Pembina Tingkat I"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Golongan</label>
                    <input
                      type="text"
                      value={editingPegawai.golongan || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, golongan: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="IV/b"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jabatan Fungsional</label>
                    <input
                      type="text"
                      value={editingPegawai.jabatanFungsional || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, jabatanFungsional: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Lektor Kepala"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jabatan Struktural</label>
                    <input
                      type="text"
                      value={editingPegawai.jabatanStruktural || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, jabatanStruktural: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Kepala Divisi IT"
                    />
                  </div>
                </div>
              )}

              {activeFormTab === 'pribadi' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tempat Lahir</label>
                    <input
                      type="text"
                      value={editingPegawai.tempatLahir || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, tempatLahir: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Bandung"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={editingPegawai.tanggalLahir || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, tanggalLahir: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                    <select
                      value={editingPegawai.jenisKelamin || 'Laki-laki'}
                      onChange={e => setEditingPegawai({ ...editingPegawai, jenisKelamin: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Agama</label>
                    <select
                      value={editingPegawai.agama || 'Islam'}
                      onChange={e => setEditingPegawai({ ...editingPegawai, agama: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    >
                      <option value="Islam">Islam</option>
                      <option value="Kristen Protestan">Kristen Protestan</option>
                      <option value="Katolik">Katolik</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Buddha">Buddha</option>
                      <option value="Khonghucu">Khonghucu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Golongan Darah</label>
                    <select
                      value={editingPegawai.golonganDarah || 'O'}
                      onChange={e => setEditingPegawai({ ...editingPegawai, golonganDarah: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Suku Bangsa</label>
                    <input
                      type="text"
                      value={editingPegawai.sukuBangsa || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, sukuBangsa: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Sunda"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kewarganegaraan</label>
                    <input
                      type="text"
                      value={editingPegawai.kewarganegaraan || 'WNI'}
                      onChange={e => setEditingPegawai({ ...editingPegawai, kewarganegaraan: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="WNI"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Status Marital</label>
                    <select
                      value={editingPegawai.statusMarital || 'Kawin'}
                      onChange={e => setEditingPegawai({ ...editingPegawai, statusMarital: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    >
                      <option value="Belum Kawin">Belum Kawin</option>
                      <option value="Kawin">Kawin</option>
                      <option value="Cerai Hidup">Cerai Hidup</option>
                      <option value="Cerai Mati">Cerai Mati</option>
                    </select>
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Alamat Domisili</label>
                    <textarea
                      rows={2}
                      value={editingPegawai.alamat || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, alamat: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Jl. Raya Bandung-Sumedang Km. 21"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">RT / RW</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editingPegawai.rt || ''}
                        onChange={e => setEditingPegawai({ ...editingPegawai, rt: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="RT (01)"
                      />
                      <input
                        type="text"
                        value={editingPegawai.rw || ''}
                        onChange={e => setEditingPegawai({ ...editingPegawai, rw: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="RW (05)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kelurahan / Desa</label>
                    <input
                      type="text"
                      value={editingPegawai.kelurahan || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, kelurahan: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Hegarmanah"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kecamatan</label>
                    <input
                      type="text"
                      value={editingPegawai.kecamatan || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, kecamatan: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Jatinangor"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kota / Kabupaten</label>
                    <input
                      type="text"
                      value={editingPegawai.kota || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, kota: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Kabupaten Sumedang"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Propinsi</label>
                    <input
                      type="text"
                      value={editingPegawai.propinsi || 'Jawa Barat'}
                      onChange={e => setEditingPegawai({ ...editingPegawai, propinsi: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Jawa Barat"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kode Pos</label>
                    <input
                      type="text"
                      value={editingPegawai.kodePos || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, kodePos: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="45363"
                    />
                  </div>
                </div>
              )}

              {activeFormTab === 'kontak' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">No. Telepon Rumah/Kantor</label>
                    <input
                      type="text"
                      value={editingPegawai.telepon || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, telepon: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="022-7796010"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">No. HP / WhatsApp</label>
                    <input
                      type="text"
                      value={editingPegawai.hp || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, hp: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="081320456789"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Email Institusi (@unpad.ac.id)</label>
                    <input
                      type="email"
                      value={editingPegawai.email || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="nama.pegawai@unpad.ac.id"
                    />
                  </div>
                </div>
              )}

              {activeFormTab === 'pendidikan' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jenjang Pendidikan Terakhir</label>
                    <select
                      value={editingPegawai.jenjang || 'S1'}
                      onChange={e => setEditingPegawai({ ...editingPegawai, jenjang: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    >
                      <option value="S3">S3 (Doktor)</option>
                      <option value="S2">S2 (Magister)</option>
                      <option value="S1">S1 (Sarjana)</option>
                      <option value="D4">D4 (Diploma IV)</option>
                      <option value="D3">D3 (Diploma III)</option>
                      <option value="SMA/SMK">SMA / SMK</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jurusan / Program Studi</label>
                    <input
                      type="text"
                      value={editingPegawai.jurusan || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, jurusan: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Ilmu Komputer"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Lembaga Pendidikan / Universitas</label>
                    <input
                      type="text"
                      value={editingPegawai.lembagaPendidikan || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, lembagaPendidikan: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Universitas Padjadjaran"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tempat / Kota Kampus</label>
                    <input
                      type="text"
                      value={editingPegawai.tempat || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, tempat: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Bandung"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tahun Lulus</label>
                    <input
                      type="number"
                      value={editingPegawai.tahunLulus || ''}
                      onChange={e => setEditingPegawai({ ...editingPegawai, tahunLulus: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="2018"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gelar Depan & Belakang</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editingPegawai.gelarDepan || ''}
                        onChange={e => setEditingPegawai({ ...editingPegawai, gelarDepan: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Dr. / Prof."
                      />
                      <input
                        type="text"
                        value={editingPegawai.gelarBelakang || ''}
                        onChange={e => setEditingPegawai({ ...editingPegawai, gelarBelakang: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="M.Kom."
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white font-semibold rounded-lg shadow-xs"
                >
                  Simpan Data Pegawai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Target Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-rose-700 mb-2">Hapus Data Pegawai?</h3>
            <p className="text-xs text-slate-600 mb-4">
              Apakah Anda yakin ingin menghapus data pegawai <strong>{deleteConfirmTarget.nama}</strong> (NIP: {deleteConfirmTarget.nip})?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirmTarget(null)} className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold">
                Batal
              </button>
              <button
                onClick={() => {
                  onDeletePegawai(deleteConfirmTarget.id);
                  setDeleteConfirmTarget(null);
                  showNotification(`Data pegawai ${deleteConfirmTarget.nama} berhasil dihapus.`);
                  if (onRefreshData) onRefreshData();
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {bulkDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-rose-700 mb-2">Hapus Massal Pegawai?</h3>
            <p className="text-xs text-slate-600 mb-4">
              Apakah Anda yakin ingin menghapus <strong>{selectedIds.length} pegawai terpilih</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setBulkDeleteConfirmOpen(false)} className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold">
                Batal
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Ya, Hapus {selectedIds.length} Data
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Pegawai Import Modal */}
      <PegawaiImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingPegawai={pegawaiList}
        onImportSuccess={handleImportSuccess}
      />

      {/* Pegawai PDF Preview Modal */}
      <PegawaiPdfPreviewModal
        pegawai={pdfPreviewPegawai}
        isOpen={Boolean(pdfPreviewPegawai)}
        onClose={() => setPdfPreviewPegawai(null)}
      />
    </div>
  );
};
