import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Eye, Edit2, Trash2, Plus, Download, 
  ChevronLeft, ChevronRight, SlidersHorizontal, 
  FileText, CheckSquare, Square, AlertTriangle,
  Upload, CheckCircle2, X, ChevronDown, Check,
  RefreshCw, FileSpreadsheet, Layers, Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Peserta, UserRole, Kategori, Program } from '../types';
import { PesertaImportModal } from './PesertaImportModal';
import { deleteMultiplePeserta, updateMultiplePesertaStatus } from '../services/storageService';

interface PesertaListViewProps {
  pesertaList: Peserta[];
  userRole: UserRole;
  onViewDetail: (peserta: Peserta) => void;
  onEditPeserta: (peserta: Peserta) => void;
  onDeletePeserta: (id: string) => void;
  onDeleteMultiplePeserta?: (ids: string[]) => void;
  onUpdateMultipleStatus?: (ids: string[], status: string) => void;
  onNavigateTambah: () => void;
  onExport: () => void;
  onRefreshData?: () => void;
  kategoriList?: Kategori[];
  programList?: Program[];
}

export const PesertaListView: React.FC<PesertaListViewProps> = ({
  pesertaList,
  userRole,
  onViewDetail,
  onEditPeserta,
  onDeletePeserta,
  onDeleteMultiplePeserta,
  onUpdateMultipleStatus,
  onNavigateTambah,
  onExport,
  onRefreshData,
  kategoriList = [],
  programList = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [kategoriFilter, setKategoriFilter] = useState('ALL');
  const [tahunFilter, setTahunFilter] = useState('ALL');
  
  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importToast, setImportToast] = useState<{ show: boolean; message: string } | null>(null);

  // Selection State (Fitur Select Data & All Data)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [masterSelectMenuOpen, setMasterSelectMenuOpen] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkStatusModalOpen, setBulkStatusModalOpen] = useState(false);
  const [selectedTargetStatus, setSelectedTargetStatus] = useState<string>('Aktif');

  const masterCheckboxRef = useRef<HTMLInputElement>(null);
  const masterMenuRef = useRef<HTMLDivElement>(null);

  // Sorting
  const [sortField, setSortField] = useState<keyof Peserta>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Column Visibility
  const [showColumns, setShowColumns] = useState({
    nikNip: true,
    instansi: true,
    kategori: true,
    program: true,
    tahunBatch: true,
    status: true,
    kelulusan: true,
  });
  const [showColMenu, setShowColMenu] = useState(false);

  // Modal Delete Confirm Single
  const [deleteTarget, setDeleteTarget] = useState<Peserta | null>(null);

  // Close master select dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (masterMenuRef.current && !masterMenuRef.current.contains(e.target as Node)) {
        setMasterSelectMenuOpen(false);
      }
    };
    if (masterSelectMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [masterSelectMenuOpen]);

  // Filtered & Sorted Data
  const filteredData = useMemo(() => {
    return pesertaList.filter(p => {
      // Status Filter
      if (statusFilter !== 'ALL' && p.statusPeserta !== statusFilter) return false;
      // Kategori Filter
      if (kategoriFilter !== 'ALL' && p.kategoriProgram !== kategoriFilter) return false;
      // Tahun Filter
      if (tahunFilter !== 'ALL' && String(p.tahun) !== tahunFilter) return false;

      // Text Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match = 
          p.namaLengkap.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.nomorRegistrasi.toLowerCase().includes(q) ||
          p.nik.toLowerCase().includes(q) ||
          p.nip.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.instansi.toLowerCase().includes(q) ||
          p.namaProgram.toLowerCase().includes(q) ||
          (p.pic && p.pic.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    }).sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      
      let cmp = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        cmp = valA - valB;
      } else {
        cmp = String(valA).localeCompare(String(valB));
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [pesertaList, searchTerm, statusFilter, kategoriFilter, tahunFilter, sortField, sortOrder]);

  // Pagination calculation
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Fast Selection Lookups
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const isAllPageSelected = useMemo(() => {
    return paginatedData.length > 0 && paginatedData.every(p => selectedIdSet.has(p.id));
  }, [paginatedData, selectedIdSet]);

  const isSomePageSelected = useMemo(() => {
    return paginatedData.some(p => selectedIdSet.has(p.id));
  }, [paginatedData, selectedIdSet]);

  const isAllFilteredSelected = useMemo(() => {
    return filteredData.length > 0 && 
           filteredData.length === selectedIds.length && 
           filteredData.every(p => selectedIdSet.has(p.id));
  }, [filteredData, selectedIds.length, selectedIdSet]);

  const isAllDatabaseSelected = useMemo(() => {
    return pesertaList.length > 0 && 
           pesertaList.length === selectedIds.length && 
           pesertaList.every(p => selectedIdSet.has(p.id));
  }, [pesertaList, selectedIds.length, selectedIdSet]);

  // Selected Objects List for export & modal previews
  const selectedPesertaList = useMemo(() => {
    return pesertaList.filter(p => selectedIdSet.has(p.id));
  }, [pesertaList, selectedIdSet]);

  // Sync indeterminate state of master checkbox
  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = isSomePageSelected && !isAllPageSelected;
    }
  }, [isSomePageSelected, isAllPageSelected]);

  // Selection Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleToggleMasterCheckbox = () => {
    if (isAllPageSelected) {
      // Deselect current page
      const pageIds = new Set(paginatedData.map(p => p.id));
      setSelectedIds(prev => prev.filter(id => !pageIds.has(id)));
    } else {
      // Select current page
      const newIds = new Set(selectedIds);
      paginatedData.forEach(p => newIds.add(p.id));
      setSelectedIds(Array.from(newIds));
    }
  };

  const handleSelectCurrentPage = () => {
    const newIds = new Set(selectedIds);
    paginatedData.forEach(p => newIds.add(p.id));
    setSelectedIds(Array.from(newIds));
    setMasterSelectMenuOpen(false);
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(filteredData.map(p => p.id));
    setMasterSelectMenuOpen(false);
  };

  const handleSelectAllDatabase = () => {
    setSelectedIds(pesertaList.map(p => p.id));
    setMasterSelectMenuOpen(false);
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
    setMasterSelectMenuOpen(false);
  };

  // Direct Export Selected Data (Excel & CSV)
  const exportSelectedToExcel = (listToExport: Peserta[]) => {
    if (listToExport.length === 0) return;
    const rows = listToExport.map((p, idx) => ({
      'No': idx + 1,
      'ID Peserta': p.id,
      'Nomor Registrasi': p.nomorRegistrasi || '',
      'Nama Lengkap': [p.gelarDepan, p.namaLengkap, p.gelarBelakang].filter(Boolean).join(' '),
      'NIK': p.nik || '',
      'NIP': p.nip || '',
      'Email': p.email || '',
      'Nomor Kontak (WA)': p.nomorKontak || '',
      'Instansi': p.instansi || '',
      'Jabatan': p.jabatan || '',
      'Kategori Program': p.kategoriProgram || '',
      'Nama Program': p.namaProgram || '',
      'Tahun': p.tahun || '',
      'Angkatan / Batch': p.angkatanBatch || '',
      'Status Peserta': p.statusPeserta || '',
      'Status Kelulusan': p.statusKelulusan || '',
      'Nilai / Skor': p.nilaiSkor ?? '',
      'Nomor Sertifikat': p.nomorSertifikat || '',
      'Tanggal Mulai': p.tanggalMulai || '',
      'Tanggal Selesai': p.tanggalSelesai || '',
      'Sumber Dana': p.sumberDana || '',
      'Biaya Pelatihan (Rp)': p.biayaPelatihan || 0,
      'PIC Koordinator': p.pic || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Peserta Terpilih');

    const colWidths = Object.keys(rows[0] || {}).map(k => ({
      wch: Math.max(k.length + 3, 14)
    }));
    worksheet['!cols'] = colWidths;

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Peserta_Terpilih_Unpad_${listToExport.length}_data_${dateStr}.xlsx`);
    
    setImportToast({
      show: true,
      message: `File Excel untuk ${listToExport.length} data peserta terpilih berhasil diunduh!`
    });
    setTimeout(() => setImportToast(null), 4000);
  };

  const exportSelectedToCsv = (listToExport: Peserta[]) => {
    if (listToExport.length === 0) return;
    const headers = [
      'No', 'ID Peserta', 'Nomor Registrasi', 'Nama Lengkap', 'NIK', 'NIP',
      'Email', 'WhatsApp', 'Instansi', 'Jabatan', 'Kategori', 'Program',
      'Tahun', 'Batch', 'Status', 'Kelulusan', 'Nilai', 'No Sertifikat'
    ];
    const csvContent = [
      headers.join(','),
      ...listToExport.map((p, idx) => [
        idx + 1,
        `"${p.id}"`,
        `"${p.nomorRegistrasi || ''}"`,
        `"${[p.gelarDepan, p.namaLengkap, p.gelarBelakang].filter(Boolean).join(' ').replace(/"/g, '""')}"`,
        `"${p.nik || ''}"`,
        `"${p.nip || ''}"`,
        `"${p.email || ''}"`,
        `"${p.nomorKontak || ''}"`,
        `"${(p.instansi || '').replace(/"/g, '""')}"`,
        `"${(p.jabatan || '').replace(/"/g, '""')}"`,
        `"${(p.kategoriProgram || '').replace(/"/g, '""')}"`,
        `"${(p.namaProgram || '').replace(/"/g, '""')}"`,
        p.tahun || '',
        `"${p.angkatanBatch || ''}"`,
        `"${p.statusPeserta || ''}"`,
        `"${p.statusKelulusan || ''}"`,
        p.nilaiSkor ?? '',
        `"${p.nomorSertifikat || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Peserta_Terpilih_${listToExport.length}_data_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setImportToast({
      show: true,
      message: `File CSV untuk ${listToExport.length} data peserta terpilih berhasil diunduh!`
    });
    setTimeout(() => setImportToast(null), 4000);
  };

  // Bulk Operations Handlers
  const handleConfirmBulkDelete = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (onDeleteMultiplePeserta) {
      onDeleteMultiplePeserta(selectedIds);
    } else {
      const res = deleteMultiplePeserta(selectedIds);
      if (res.success && onRefreshData) {
        onRefreshData();
      }
    }
    setImportToast({
      show: true,
      message: `Berhasil menghapus ${count} data peserta dari database.`
    });
    setTimeout(() => setImportToast(null), 5000);
    setSelectedIds([]);
    setBulkDeleteModalOpen(false);
  };

  const handleConfirmBulkStatus = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (onUpdateMultipleStatus) {
      onUpdateMultipleStatus(selectedIds, selectedTargetStatus);
    } else {
      const res = updateMultiplePesertaStatus(selectedIds, selectedTargetStatus);
      if (res.success && onRefreshData) {
        onRefreshData();
      }
    }
    setImportToast({
      show: true,
      message: `Status ${count} peserta berhasil diubah menjadi "${selectedTargetStatus}".`
    });
    setTimeout(() => setImportToast(null), 5000);
    setSelectedIds([]);
    setBulkStatusModalOpen(false);
  };

  const handleSort = (field: keyof Peserta) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      onDeletePeserta(deleteTarget.id);
      // Remove from selection if deleted
      setSelectedIds(prev => prev.filter(id => id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4 pb-20 relative">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-[#002B66]">Data Peserta Pendidikan Non Gelar</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {pesertaList.length} peserta terdata di Google Spreadsheet
            {selectedIds.length > 0 && (
              <span className="ml-2 font-bold text-[#002B66] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {selectedIds.length} dipilih
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Quick Select All Data Button */}
          <div className="relative">
            <button
              type="button"
              id="btn-select-options-top"
              onClick={() => setMasterSelectMenuOpen(!masterSelectMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-[#002B66] rounded-lg text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
              title="Pilih data (Halaman / Semua Data)"
            >
              <CheckSquare className="w-3.5 h-3.5 text-[#002B66]" />
              <span>Select Data</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {userRole !== 'VIEWER' && (
            <button
              id="btn-import-peserta"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold transition-colors border border-emerald-300 shadow-2xs cursor-pointer"
              title="Import data peserta dari file Excel (.xlsx) atau CSV (.csv)"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Import Excel / CSV</span>
            </button>
          )}

          <button
            id="btn-export-peserta"
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          {userRole !== 'VIEWER' && (
            <button
              id="btn-tambah-peserta-table"
              onClick={onNavigateTambah}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#FDB913]" />
              <span>Tambah Peserta</span>
            </button>
          )}
        </div>
      </div>

      {/* Import / Bulk Action Toast Alert */}
      {importToast && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-800 animate-in fade-in duration-200 shadow-xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importToast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setImportToast(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Chips & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, ID, NIK, NIP, email, instansi, atau program..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66] focus:bg-white transition-all"
            />
          </div>

          {/* Quick Dropdown Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="Terdaftar">Terdaftar</option>
              <option value="Aktif">Aktif</option>
              <option value="Selesai">Selesai</option>
              <option value="Lulus">Lulus</option>
              <option value="Tidak Lulus">Tidak Lulus</option>
              <option value="Mengundurkan Diri">Mengundurkan Diri</option>
            </select>

            {/* Tahun Filter */}
            <select
              value={tahunFilter}
              onChange={(e) => { setTahunFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Tahun</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>

            {/* Column Visibility Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowColMenu(!showColMenu)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Kolom</span>
              </button>

              {showColMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 p-2 z-20 space-y-1 text-xs">
                  <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showColumns.nikNip} 
                      onChange={() => setShowColumns(prev => ({ ...prev, nikNip: !prev.nikNip }))} 
                    />
                    <span>NIK / NIP</span>
                  </label>
                  <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showColumns.instansi} 
                      onChange={() => setShowColumns(prev => ({ ...prev, instansi: !prev.instansi }))} 
                    />
                    <span>Instansi</span>
                  </label>
                  <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showColumns.kategori} 
                      onChange={() => setShowColumns(prev => ({ ...prev, kategori: !prev.kategori }))} 
                    />
                    <span>Kategori</span>
                  </label>
                  <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showColumns.program} 
                      onChange={() => setShowColumns(prev => ({ ...prev, program: !prev.program }))} 
                    />
                    <span>Program</span>
                  </label>
                  <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showColumns.tahunBatch} 
                      onChange={() => setShowColumns(prev => ({ ...prev, tahunBatch: !prev.tahunBatch }))} 
                    />
                    <span>Tahun / Batch</span>
                  </label>
                  <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showColumns.kelulusan} 
                      onChange={() => setShowColumns(prev => ({ ...prev, kelulusan: !prev.kelulusan }))} 
                    />
                    <span>Kelulusan</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {['ALL', 'Terdaftar', 'Aktif', 'Selesai', 'Lulus', 'Tidak Lulus'].map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                statusFilter === st 
                  ? 'bg-[#002B66] text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'Semua Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Select All Helper Banner */}
      {isAllPageSelected && filteredData.length > paginatedData.length && !isAllFilteredSelected && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-900 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Semua <strong>{paginatedData.length}</strong> peserta di halaman {currentPage} ini telah dipilih.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="font-bold underline text-[#002B66] hover:text-[#083a7e] cursor-pointer"
            >
              Pilih semua {filteredData.length} data peserta yang sesuai filter
            </button>
            <span className="text-amber-400">|</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Batal Pilih
            </button>
          </div>
        </div>
      )}

      {isAllFilteredSelected && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs text-[#002B66] shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckSquare className="w-4 h-4 text-[#002B66] shrink-0" />
            <span>Seluruh <strong>{filteredData.length}</strong> data peserta hasil filter telah dipilih.</span>
          </div>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="font-bold text-rose-600 hover:text-rose-800 cursor-pointer hover:underline"
          >
            Batalkan Pilihan Semua Data
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#002B66] text-white font-bold tracking-wide select-none">
              <tr>
                {/* Master Checkbox Header */}
                <th className="p-3 w-12 text-center relative">
                  <div className="flex items-center justify-center gap-0.5">
                    <input
                      ref={masterCheckboxRef}
                      type="checkbox"
                      id="checkbox-select-all-header"
                      checked={paginatedData.length > 0 && isAllPageSelected}
                      onChange={handleToggleMasterCheckbox}
                      className="w-4 h-4 rounded text-[#002B66] focus:ring-[#002B66] cursor-pointer accent-[#FDB913]"
                      title={isAllPageSelected ? "Batalkan pilihan halaman ini" : "Pilih semua di halaman ini"}
                    />
                    <div className="relative" ref={masterMenuRef}>
                      <button
                        type="button"
                        onClick={() => setMasterSelectMenuOpen(!masterSelectMenuOpen)}
                        className="p-1 text-slate-300 hover:text-white rounded hover:bg-[#083a7e] transition-colors cursor-pointer"
                        title="Opsi Pilihan Data (Halaman / Semua Data)"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {masterSelectMenuOpen && (
                        <div className="absolute left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-30 text-xs text-slate-700 font-normal space-y-1 text-left">
                          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Opsi Pilihan Data
                          </div>
                          <button
                            type="button"
                            onClick={handleSelectCurrentPage}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left cursor-pointer"
                          >
                            <span>Pilih Halaman Ini</span>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {paginatedData.length} data
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={handleSelectAllFiltered}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left font-semibold text-[#002B66] cursor-pointer"
                          >
                            <span>Pilih Semua Hasil Filter</span>
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                              {filteredData.length} data
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={handleSelectAllDatabase}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left text-slate-700 cursor-pointer"
                          >
                            <span>Pilih Seluruh Database</span>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {pesertaList.length} data
                            </span>
                          </button>
                          <div className="border-t border-slate-100 my-1"></div>
                          <button
                            type="button"
                            onClick={handleDeselectAll}
                            disabled={selectedIds.length === 0}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-left text-rose-600 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer font-medium"
                          >
                            <span>Batalkan Semua Pilihan</span>
                            <span className="text-[10px] font-bold">0</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </th>
                <th className="p-3 w-10 text-center">No</th>
                <th 
                  onClick={() => handleSort('id')} 
                  className="p-3 cursor-pointer hover:bg-[#083a7e]"
                >
                  ID Peserta
                </th>
                <th 
                  onClick={() => handleSort('namaLengkap')} 
                  className="p-3 cursor-pointer hover:bg-[#083a7e]"
                >
                  Nama Lengkap
                </th>
                {showColumns.nikNip && (
                  <th className="p-3">NIK / NIP</th>
                )}
                {showColumns.instansi && (
                  <th 
                    onClick={() => handleSort('instansi')} 
                    className="p-3 cursor-pointer hover:bg-[#083a7e]"
                  >
                    Instansi
                  </th>
                )}
                {showColumns.kategori && (
                  <th className="p-3">Kategori</th>
                )}
                {showColumns.program && (
                  <th className="p-3">Program</th>
                )}
                {showColumns.tahunBatch && (
                  <th 
                    onClick={() => handleSort('tahun')} 
                    className="p-3 cursor-pointer hover:bg-[#083a7e]"
                  >
                    Tahun / Batch
                  </th>
                )}
                {showColumns.status && (
                  <th 
                    onClick={() => handleSort('statusPeserta')} 
                    className="p-3 cursor-pointer hover:bg-[#083a7e]"
                  >
                    Status
                  </th>
                )}
                {showColumns.kelulusan && (
                  <th className="p-3">Kelulusan</th>
                )}
                <th className="p-3 text-center w-28">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-10 text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Tidak ada data peserta yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                paginatedData.map((p, idx) => {
                  const globalNo = (currentPage - 1) * pageSize + idx + 1;
                  const fullName = [p.gelarDepan, p.namaLengkap, p.gelarBelakang].filter(Boolean).join(' ');
                  const isSelected = selectedIdSet.has(p.id);

                  const badgeColors: Record<string, string> = {
                    Terdaftar: 'bg-slate-100 text-slate-700 border-slate-300',
                    Aktif: 'bg-blue-50 text-blue-700 border-blue-200',
                    Selesai: 'bg-amber-50 text-amber-700 border-amber-200',
                    Lulus: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    'Tidak Lulus': 'bg-rose-50 text-rose-700 border-rose-200',
                    'Mengundurkan Diri': 'bg-purple-50 text-purple-700 border-purple-200'
                  };

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
                      {/* Row Checkbox */}
                      <td 
                        className="p-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          id={`checkbox-peserta-${p.id}`}
                          checked={isSelected}
                          onChange={() => handleToggleSelect(p.id)}
                          className="w-4 h-4 rounded text-[#002B66] focus:ring-[#002B66] cursor-pointer accent-[#002B66]"
                        />
                      </td>

                      <td className="p-3 text-center text-slate-400 font-medium">{globalNo}</td>
                      <td className="p-3 font-mono font-bold text-[#002B66]">
                        {p.id}
                        <div className="text-[10px] text-slate-400 font-normal">{p.nomorRegistrasi}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{fullName}</div>
                        <div className="text-[11px] text-slate-500">{p.email}</div>
                      </td>
                      {showColumns.nikNip && (
                        <td className="p-3 text-slate-600 font-mono text-[11px]">
                          <div>NIK: {p.nik || '-'}</div>
                          {p.nip && <div className="text-slate-400">NIP: {p.nip}</div>}
                        </td>
                      )}
                      {showColumns.instansi && (
                        <td className="p-3 text-slate-700">
                          <div className="font-medium">{p.instansi || '-'}</div>
                          <div className="text-[11px] text-slate-400">{p.jabatan || ''}</div>
                        </td>
                      )}
                      {showColumns.kategori && (
                        <td className="p-3">
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                            {p.kategoriProgram}
                          </span>
                        </td>
                      )}
                      {showColumns.program && (
                        <td className="p-3 text-slate-700 font-medium max-w-[200px] truncate" title={p.namaProgram}>
                          {p.namaProgram}
                        </td>
                      )}
                      {showColumns.tahunBatch && (
                        <td className="p-3 text-slate-700">
                          <span className="font-bold">{p.tahun}</span>
                          <div className="text-[10px] text-slate-400">{p.angkatanBatch || '-'}</div>
                        </td>
                      )}
                      {showColumns.status && (
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColors[p.statusPeserta] || 'bg-slate-100 text-slate-700'}`}>
                            {p.statusPeserta}
                          </span>
                        </td>
                      )}
                      {showColumns.kelulusan && (
                        <td className="p-3">
                          <span className={`inline-block text-[11px] font-semibold ${
                            p.statusKelulusan === 'Lulus' ? 'text-emerald-600' : 'text-slate-600'
                          }`}>
                            {p.statusKelulusan}
                          </span>
                          {p.nomorSertifikat && (
                            <div className="text-[9px] text-slate-400 font-mono truncate max-w-[100px]" title={p.nomorSertifikat}>
                              {p.nomorSertifikat}
                            </div>
                          )}
                        </td>
                      )}
                      {/* Action buttons (click stopped from bubbling to select row) */}
                      <td 
                        className="p-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <button
                            id={`btn-view-${p.id}`}
                            onClick={() => onViewDetail(p)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                            title="Lihat Detail Profil & Cetak"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {userRole !== 'VIEWER' && (
                            <button
                              id={`btn-edit-${p.id}`}
                              onClick={() => onEditPeserta(p)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded cursor-pointer"
                              title="Edit Data Peserta"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {userRole === 'ADMIN' && (
                            <button
                              id={`btn-del-${p.id}`}
                              onClick={() => setDeleteTarget(p)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="Hapus Data (Admin)"
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

        {/* Pagination & Page Size Toolbar */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-3 flex-wrap">
            <span>
              Menampilkan {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} dari {totalItems} peserta
            </span>
            <div className="flex items-center gap-1.5">
              <span>Per halaman:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            {selectedIds.length > 0 && (
              <span className="font-bold text-[#002B66]">
                • {selectedIds.length} data sedang dipilih
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-[#002B66]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* FLOATING STICKY BULK ACTION BAR (Tampil saat 1 atau lebih data dipilih) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-4xl bg-[#002B66] text-white px-4 py-3 rounded-2xl shadow-2xl border border-blue-400/40 flex flex-col md:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-9 h-9 rounded-xl bg-[#FDB913] text-[#002B66] flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm text-white">
                  {selectedIds.length} Peserta Terpilih
                </span>
                {isAllFilteredSelected && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                    Semua Filter ({filteredData.length})
                  </span>
                )}
                {isAllDatabaseSelected && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                    Seluruh DB ({pesertaList.length})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                {!isAllFilteredSelected && filteredData.length > selectedIds.length ? (
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="text-[#FDB913] hover:underline font-bold cursor-pointer"
                  >
                    Pilih semua {filteredData.length} data hasil filter
                  </button>
                ) : (
                  <span>Aksi serentak untuk data yang dipilih</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
            {/* Quick Export Excel */}
            <button
              type="button"
              id="btn-bulk-export-excel"
              onClick={() => exportSelectedToExcel(selectedPesertaList)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Download file Excel (.xlsx) untuk data yang dipilih"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel ({selectedIds.length})</span>
            </button>

            {/* Quick Export CSV */}
            <button
              type="button"
              id="btn-bulk-export-csv"
              onClick={() => exportSelectedToCsv(selectedPesertaList)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Download file CSV untuk data yang dipilih"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            {/* Ubah Status Massal */}
            {userRole !== 'VIEWER' && (
              <button
                type="button"
                id="btn-bulk-update-status"
                onClick={() => setBulkStatusModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="Perbarui status seluruh peserta yang dipilih"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ubah Status</span>
              </button>
            )}

            {/* Hapus Data Terpilih (Admin) */}
            {userRole === 'ADMIN' && (
              <button
                type="button"
                id="btn-bulk-delete"
                onClick={() => setBulkDeleteModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="Hapus massal data yang dipilih"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus ({selectedIds.length})</span>
              </button>
            )}

            {/* Batalkan Pilihan */}
            <button
              type="button"
              id="btn-bulk-deselect"
              onClick={handleDeselectAll}
              className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-600"
              title="Batalkan seluruh pilihan"
            >
              <X className="w-3.5 h-3.5" />
              <span>Batal</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Massal */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 rounded-full bg-rose-100">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Konfirmasi Hapus Massal</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Apakah Anda yakin ingin menghapus <strong className="text-rose-600 font-bold">{selectedIds.length} data peserta</strong> terpilih dari database Google Sheets?
            </p>

            {/* Preview of items to be deleted */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 max-h-44 overflow-y-auto space-y-1.5 mb-4 text-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Daftar Peserta Terpilih ({selectedIds.length}):
              </div>
              {selectedPesertaList.slice(0, 8).map(p => (
                <div key={p.id} className="flex items-center justify-between text-slate-700 py-0.5 border-b border-slate-100 last:border-b-0">
                  <span className="font-medium truncate max-w-[240px]">{p.namaLengkap}</span>
                  <span className="font-mono text-[10px] text-slate-400">{p.id}</span>
                </div>
              ))}
              {selectedPesertaList.length > 8 && (
                <div className="text-[11px] text-slate-400 italic pt-1">
                  ...dan {selectedPesertaList.length - 8} peserta lainnya.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setBulkDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs shadow-xs cursor-pointer"
              >
                Ya, Hapus {selectedIds.length} Data Terpilih
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ubah Status Massal */}
      {bulkStatusModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-[#002B66] mb-3">
              <div className="p-2.5 rounded-full bg-blue-100">
                <RefreshCw className="w-6 h-6 text-[#002B66]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Ubah Status Massal</h3>
                <p className="text-xs text-slate-500">Perbarui status {selectedIds.length} peserta terpilih</p>
              </div>
            </div>

            <div className="space-y-3 mb-5 text-xs">
              <label className="block text-xs font-semibold text-slate-700">
                Pilih Status Baru untuk {selectedIds.length} Peserta:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Terdaftar', 'Aktif', 'Selesai', 'Lulus', 'Tidak Lulus', 'Mengundurkan Diri'].map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedTargetStatus(st)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                      selectedTargetStatus === st 
                        ? 'bg-[#002B66] text-white border-[#002B66] shadow-2xs' 
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{st}</span>
                    {selectedTargetStatus === st && <Check className="w-3.5 h-3.5 text-[#FDB913]" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setBulkStatusModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkStatus}
                className="px-4 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white font-semibold rounded-lg text-xs shadow-xs cursor-pointer"
              >
                Terapkan Status "{selectedTargetStatus}"
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Single) */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 rounded-full bg-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Konfirmasi Hapus Peserta</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus data peserta <strong className="text-slate-900">{deleteTarget.namaLengkap}</strong> ({deleteTarget.id}) dari database Google Sheets?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs shadow-xs cursor-pointer"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Data Peserta Excel & CSV */}
      <PesertaImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingPeserta={pesertaList}
        kategoriList={kategoriList}
        programList={programList}
        onImportSuccess={(res) => {
          if (onRefreshData) onRefreshData();
          setImportToast({
            show: true,
            message: `Import berhasil! ${res.count} data baru ditambahkan, ${res.updatedCount} data diperbarui${res.skippedCount > 0 ? `, ${res.skippedCount} data duplikat dilewati` : ''}.`
          });
          setTimeout(() => setImportToast(null), 6000);
        }}
      />
    </div>
  );
};
