import React, { useState, useMemo } from 'react';
import { 
  History, Search, Filter, Download, 
  Calendar, User, Shield, Terminal,
  FileSpreadsheet, FileText, CheckCircle2,
  SlidersHorizontal, X, ArrowUpDown, Layers,
  Activity, AlertCircle, Info, ChevronLeft, ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { LogAktivitas, UserItem } from '../types';

interface LogAktivitasViewProps {
  logs: LogAktivitas[];
  currentUser?: UserItem;
}

interface ColumnOption {
  id: keyof LogAktivitas;
  label: string;
  defaultSelected: boolean;
}

const AVAILABLE_COLUMNS: ColumnOption[] = [
  { id: 'id', label: 'ID Log', defaultSelected: true },
  { id: 'timestamp', label: 'Waktu & Tanggal', defaultSelected: true },
  { id: 'user', label: 'User Pelaksana', defaultSelected: true },
  { id: 'modul', label: 'Modul Sistem', defaultSelected: true },
  { id: 'aktivitas', label: 'Aktivitas / Aksi', defaultSelected: true },
  { id: 'idData', label: 'ID Data Terkait', defaultSelected: true },
  { id: 'keterangan', label: 'Keterangan Perubahan', defaultSelected: true },
  { id: 'ipUserAgent', label: 'IP / User Agent', defaultSelected: true },
];

export const LogAktivitasView: React.FC<LogAktivitasViewProps> = ({ logs, currentUser }) => {
  const [searchKw, setSearchKw] = useState('');
  const [selectedModul, setSelectedModul] = useState('ALL');
  const [selectedAksi, setSelectedAksi] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

  // Modal Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [exportScope, setExportScope] = useState<'filtered' | 'all'>('filtered');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    AVAILABLE_COLUMNS.filter(c => c.defaultSelected).map(c => c.id)
  );
  const [includeSummarySheet, setIncludeSummarySheet] = useState(true);
  const [exportNotification, setExportNotification] = useState<string | null>(null);

  // Dynamic modules list extracted from logs + defaults
  const uniqueModuls = useMemo(() => {
    const defaultMods = ['PESERTA', 'KATEGORI', 'PROGRAM', 'EDUVENTURE', 'PIC', 'USER', 'AUTH', 'SETTING', 'SETUP'];
    const fromLogs = logs.map(l => l.modul).filter(Boolean);
    const set = new Set([...defaultMods, ...fromLogs]);
    return Array.from(set).sort();
  }, [logs]);

  // Filtered logs calculation
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      // Modul filter
      if (selectedModul !== 'ALL' && l.modul !== selectedModul) return false;

      // Aksi filter
      if (selectedAksi !== 'ALL') {
        const akt = l.aktivitas.toUpperCase();
        if (selectedAksi === 'CREATE' && !akt.includes('TAMBAH') && !akt.includes('CREATE') && !akt.includes('BUAT')) return false;
        if (selectedAksi === 'UPDATE' && !akt.includes('UBAH') && !akt.includes('UPDATE') && !akt.includes('EDIT')) return false;
        if (selectedAksi === 'DELETE' && !akt.includes('HAPUS') && !akt.includes('DELETE')) return false;
        if (selectedAksi === 'AUTH' && !akt.includes('LOGIN') && !akt.includes('LOGOUT') && !akt.includes('SESI')) return false;
        if (selectedAksi === 'EXPORT_IMPORT' && !akt.includes('EXPORT') && !akt.includes('IMPORT') && !akt.includes('SYNC')) return false;
      }

      // Date range filter
      if (startDate || endDate) {
        const logDateStr = l.timestamp.substring(0, 10); // Expect YYYY-MM-DD
        if (startDate && logDateStr < startDate) return false;
        if (endDate && logDateStr > endDate) return false;
      }

      // Search keyword
      if (searchKw.trim()) {
        const kw = searchKw.toLowerCase();
        return (
          l.aktivitas.toLowerCase().includes(kw) ||
          l.user.toLowerCase().includes(kw) ||
          l.idData.toLowerCase().includes(kw) ||
          l.keterangan.toLowerCase().includes(kw) ||
          (l.ipUserAgent && l.ipUserAgent.toLowerCase().includes(kw)) ||
          l.id.toLowerCase().includes(kw) ||
          l.modul.toLowerCase().includes(kw)
        );
      }
      return true;
    });
  }, [logs, selectedModul, selectedAksi, startDate, endDate, searchKw]);

  // Reset pagination when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchKw, selectedModul, selectedAksi, startDate, endDate]);

  // Metrics for overview
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const todayLogsCount = logs.filter(l => l.timestamp && l.timestamp.startsWith(todayStr)).length;
    
    // Top active module
    const modCount: Record<string, number> = {};
    logs.forEach(l => {
      modCount[l.modul] = (modCount[l.modul] || 0) + 1;
    });
    let topModul = '-';
    let maxModCount = 0;
    Object.entries(modCount).forEach(([mod, count]) => {
      if (count > maxModCount) {
        maxModCount = count;
        topModul = mod;
      }
    });

    return {
      total: logs.length,
      filtered: filteredLogs.length,
      today: todayLogsCount,
      topModul: topModul !== '-' ? `${topModul} (${maxModCount})` : 'Belum Ada'
    };
  }, [logs, filteredLogs]);

  // Paginated records
  const paginatedLogs = useMemo(() => {
    if (itemsPerPage === -1) return filteredLogs;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredLogs.length / itemsPerPage);

  const isFiltered = selectedModul !== 'ALL' || selectedAksi !== 'ALL' || !!startDate || !!endDate || !!searchKw.trim();

  const handleResetFilters = () => {
    setSelectedModul('ALL');
    setSelectedAksi('ALL');
    setStartDate('');
    setEndDate('');
    setSearchKw('');
  };

  const toggleColumnSelection = (colId: string) => {
    if (selectedColumns.includes(colId)) {
      if (selectedColumns.length === 1) return; // minimal 1 kolom
      setSelectedColumns(selectedColumns.filter(c => c !== colId));
    } else {
      setSelectedColumns([...selectedColumns, colId]);
    }
  };

  const selectAllColumns = () => {
    setSelectedColumns(AVAILABLE_COLUMNS.map(c => c.id));
  };

  // Core Export Function
  const executeExport = (format: 'xlsx' | 'csv', scope: 'filtered' | 'all') => {
    const dataToExport = scope === 'filtered' ? filteredLogs : logs;

    if (dataToExport.length === 0) {
      alert('Tidak ada data log yang dapat diekspor.');
      return;
    }

    const activeCols = AVAILABLE_COLUMNS.filter(c => selectedColumns.includes(c.id));
    if (activeCols.length === 0) {
      alert('Pilih minimal satu kolom untuk diekspor.');
      return;
    }

    const now = new Date();
    const dateFormatted = now.toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const dateReadable = now.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    const auditorName = currentUser?.nama || currentUser?.email || 'Administrator SIMPENDIK';

    const fileName = `Audit_Log_SIMPENDIK_UNPAD_${dateFormatted}.${format}`;

    // Transform rows
    const rows = dataToExport.map(item => {
      const rowObj: Record<string, string> = {};
      activeCols.forEach(col => {
        rowObj[col.label] = (item[col.id] as string) || '';
      });
      return rowObj;
    });

    if (format === 'xlsx') {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Main Log Data
      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Auto calculate column widths
      worksheet['!cols'] = activeCols.map(col => {
        const maxLen = Math.max(
          col.label.length,
          ...rows.map(r => String(r[col.label] || '').length)
        );
        return { wch: Math.min(Math.max(maxLen + 3, 12), 55) };
      });

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit_Log_Aktivitas');

      // Sheet 2: Summary Sheet (if enabled)
      if (includeSummarySheet) {
        // Module breakdown
        const modBreakdown: Record<string, number> = {};
        dataToExport.forEach(d => {
          modBreakdown[d.modul] = (modBreakdown[d.modul] || 0) + 1;
        });

        // User breakdown
        const userBreakdown: Record<string, number> = {};
        dataToExport.forEach(d => {
          userBreakdown[d.user] = (userBreakdown[d.user] || 0) + 1;
        });

        const summaryRows = [
          { Parameter: 'Nama Aplikasi', Nilai: 'SIMPENDIK NON GELAR UNPAD' },
          { Parameter: 'Institusi', Nilai: 'Universitas Padjadjaran' },
          { Parameter: 'Tujuan Berkas', Nilai: 'Audit Trail Log Aktivitas Sistem' },
          { Parameter: 'Waktu Ekspor', Nilai: dateReadable },
          { Parameter: 'User Auditor', Nilai: auditorName },
          { Parameter: 'Cakupan Ekspor', Nilai: scope === 'filtered' ? `Hasil Filter (${dataToExport.length} rekaman)` : `Seluruh Log (${dataToExport.length} rekaman)` },
          { Parameter: 'Filter Modul', Nilai: selectedModul === 'ALL' ? 'Semua Modul' : selectedModul },
          { Parameter: 'Filter Periode', Nilai: (startDate || endDate) ? `${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}` : 'Seluruh Riwayat' },
          { Parameter: 'Kata Kunci Pencarian', Nilai: searchKw.trim() || '-' },
          { Parameter: 'Total Baris Diekspor', Nilai: String(dataToExport.length) },
          { Parameter: '', Nilai: '' },
          { Parameter: '--- DISTRIBUSI PER MODUL ---', Nilai: '' },
          ...Object.entries(modBreakdown).map(([mod, cnt]) => ({ Parameter: `Modul ${mod}`, Nilai: `${cnt} aksi` })),
          { Parameter: '', Nilai: '' },
          { Parameter: '--- DISTRIBUSI PER USER ---', Nilai: '' },
          ...Object.entries(userBreakdown).map(([usr, cnt]) => ({ Parameter: usr, Nilai: `${cnt} aksi` })),
        ];

        const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
        summarySheet['!cols'] = [{ wch: 32 }, { wch: 45 }];
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan_Audit');
      }

      XLSX.writeFile(workbook, fileName);
    } else {
      // CSV format with UTF-8 BOM
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    setExportNotification(`Berhasil mengekspor ${dataToExport.length} catatan log aktivitas ke format ${format.toUpperCase()} (${fileName})`);
    setTimeout(() => {
      setExportNotification(null);
    }, 6000);

    setIsExportModalOpen(false);
  };

  // Quick 1-click export handler
  const handleQuickExport = (format: 'xlsx' | 'csv') => {
    executeExport(format, 'filtered');
  };

  // Color helper for badges
  const getModulColor = (modul: string) => {
    switch (modul.toUpperCase()) {
      case 'PESERTA': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PROGRAM': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'KATEGORI': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'EDUVENTURE': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'PIC': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'USER':
      case 'AUTH': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'SETTING':
      case 'SETUP': return 'bg-slate-100 text-slate-700 border-slate-300';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getAksiColor = (aktivitas: string) => {
    const akt = aktivitas.toUpperCase();
    if (akt.includes('HAPUS') || akt.includes('DELETE')) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (akt.includes('TAMBAH') || akt.includes('CREATE') || akt.includes('BUAT')) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (akt.includes('UBAH') || akt.includes('UPDATE') || akt.includes('EDIT')) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (akt.includes('LOGIN') || akt.includes('AUTH') || akt.includes('LOGOUT')) return 'text-purple-700 bg-purple-50 border-purple-200';
    if (akt.includes('EXPORT') || akt.includes('IMPORT') || akt.includes('SYNC')) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-[#002B66] bg-slate-50 border-slate-200';
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {exportNotification && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#002B66] text-white rounded-xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-3 duration-300 border border-amber-400/30">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="flex-1 pr-2">{exportNotification}</div>
          <button 
            onClick={() => setExportNotification(null)}
            className="p-1 text-slate-300 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Quick Export Actions */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#002B66]/5 text-[#002B66]">
              <History className="w-5 h-5 text-[#002B66]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#002B66] tracking-tight">Audit Trail Log Aktivitas Sistem</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Rekam jejak forensik setiap aksi penambahan, perubahan, dan penghapusan data pada SIMPENDIK UNPAD
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Quick Excel Export */}
          <button
            id="btn-quick-export-excel"
            onClick={() => handleQuickExport('xlsx')}
            title="Download data log yang sedang difilter ke format Excel (.xlsx)"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>Export Excel (.xlsx)</span>
          </button>

          {/* Quick CSV Export */}
          <button
            id="btn-quick-export-csv"
            onClick={() => handleQuickExport('csv')}
            title="Download data log yang sedang difilter ke format teks CSV (.csv)"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 active:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <FileText className="w-4 h-4 text-slate-300" />
            <span>Export CSV</span>
          </button>

          {/* Advanced Export Options Modal Trigger */}
          <button
            id="btn-open-export-modal"
            onClick={() => setIsExportModalOpen(true)}
            title="Buka dialog konfigurasi ekspor audit (pilih kolom, scope data, ringkasan)"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
            <span>Opsi Audit Ekspor...</span>
          </button>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Log Sistem</span>
            <Layers className="w-4 h-4 text-[#002B66]" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Seluruh riwayat transaksi</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hasil Filter</span>
            <Filter className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-blue-600 mt-1">{stats.filtered}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {isFiltered ? 'Sesuai kriteria aktif' : 'Menampilkan seluruhnya'}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Aktivitas Hari Ini</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1">{stats.today}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Transaksi tanggal berjalan</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Modul Teraktif</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-sm font-black text-purple-900 mt-1.5 truncate" title={stats.topModul}>
            {stats.topModul}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Frekuensi operasi terbanyak</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari aktivitas, user, ID data, keterangan, atau IP..."
              value={searchKw}
              onChange={(e) => setSearchKw(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#002B66]/20 focus:border-[#002B66]"
            />
            {searchKw && (
              <button 
                onClick={() => setSearchKw('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Module Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Modul:</span>
            <select
              value={selectedModul}
              onChange={(e) => setSelectedModul(e.target.value)}
              className="w-full md:w-44 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#002B66]/20"
            >
              <option value="ALL">Semua Modul</option>
              {uniqueModuls.map(m => (
                <option key={m} value={m}>Modul {m}</option>
              ))}
            </select>
          </div>

          {/* Action Type Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Aksi:</span>
            <select
              value={selectedAksi}
              onChange={(e) => setSelectedAksi(e.target.value)}
              className="w-full md:w-44 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#002B66]/20"
            >
              <option value="ALL">Semua Aksi</option>
              <option value="CREATE">TAMBAH / CREATE</option>
              <option value="UPDATE">UBAH / UPDATE</option>
              <option value="DELETE">HAPUS / DELETE</option>
              <option value="AUTH">LOGIN / SESI</option>
              <option value="EXPORT_IMPORT">EKSPOR / IMPOR / SYNC</option>
            </select>
          </div>
        </div>

        {/* Date Range & Reset Row */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-600">Rentang Tanggal Audit:</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
              title="Tanggal awal filter audit"
            />
            <span className="text-slate-400">s/d</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
              title="Tanggal akhir filter audit"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-[11px] text-rose-600 hover:underline font-semibold"
              >
                Hapus Tanggal
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Reset Semua Filter</span>
              </button>
            )}
            <span className="text-slate-400">|</span>
            <div className="flex items-center gap-1.5 text-slate-500">
              <span>Tampilkan:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-xs font-medium focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={-1}>Semua</option>
              </select>
              <span>baris</span>
            </div>
          </div>
        </div>
      </div>

      {/* Log Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#002B66] text-white font-bold">
              <tr>
                <th className="p-3 w-16">ID</th>
                <th className="p-3 w-40">Waktu & Tanggal</th>
                <th className="p-3">User Pelaksana</th>
                <th className="p-3">Modul</th>
                <th className="p-3">Aktivitas / Aksi</th>
                <th className="p-3">ID Data Terkait</th>
                <th className="p-3 min-w-[260px]">Keterangan Perubahan</th>
                <th className="p-3">IP / Host</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-slate-600">Tidak ada catatan log aktivitas yang cocok.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian, rentang tanggal, atau filter modul.</p>
                    {isFiltered && (
                      <button
                        onClick={handleResetFilters}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Bersihkan Filter</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-400">{l.id}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {l.timestamp}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="font-semibold text-slate-800">{l.user}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${getModulColor(l.modul)}`}>
                        {l.modul}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${getAksiColor(l.aktivitas)}`}>
                        {l.aktivitas}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {l.idData ? (
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {l.idData}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600 text-[11px] leading-relaxed max-w-md">
                      {l.keterangan}
                    </td>
                    <td className="p-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                      {l.ipUserAgent ? (
                        <span title={l.ipUserAgent}>
                          {l.ipUserAgent.length > 25 ? `${l.ipUserAgent.substring(0, 25)}...` : l.ipUserAgent}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Status Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Menampilkan <span className="font-bold text-slate-700">{paginatedLogs.length}</span> dari <span className="font-bold text-slate-700">{filteredLogs.length}</span> log aktivitas
            {isFiltered && <span className="text-slate-400"> (difilter dari total {logs.length})</span>}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
                title="Halaman sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 text-xs font-semibold text-slate-700">
                Hal {currentPage} dari {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
                title="Halaman selanjutnya"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Export Modal Dialog */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#002B66] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10">
                  <Download className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-snug">Ekspor Audit Trail Log Aktivitas</h3>
                  <p className="text-[11px] text-slate-200">
                    Konfigurasi berkas spreadsheet audit untuk arsip dan evaluasi kepatuhan
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Format Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">1. Pilih Format Berkas</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportFormat('xlsx')}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      exportFormat === 'xlsx'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <FileSpreadsheet className={`w-5 h-5 shrink-0 mt-0.5 ${exportFormat === 'xlsx' ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-slate-900">Microsoft Excel (.xlsx)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Rekomendasi audit. Format tabel terstruktur dengan lembar ringkasan audit.</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat('csv')}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      exportFormat === 'csv'
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className={`w-5 h-5 shrink-0 mt-0.5 ${exportFormat === 'csv' ? 'text-blue-700' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-slate-900">CSV Standard (.csv)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Format teks universal (UTF-8 BOM), cocok untuk parser log eksternal & database.</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Data Scope Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">2. Cakupan Data Log</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input 
                      type="radio" 
                      name="scope"
                      checked={exportScope === 'filtered'} 
                      onChange={() => setExportScope('filtered')}
                      className="text-[#002B66] focus:ring-[#002B66]"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-slate-800">
                        Data Sesuai Filter Aktif ({filteredLogs.length} catatan)
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isFiltered ? 'Hanya menyertakan catatan log yang memenuhi kriteria pencarian & filter saat ini.' : 'Sama dengan seluruh log saat ini karena tidak ada filter aktif.'}
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input 
                      type="radio" 
                      name="scope"
                      checked={exportScope === 'all'} 
                      onChange={() => setExportScope('all')}
                      className="text-[#002B66] focus:ring-[#002B66]"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-slate-800">
                        Seluruh Catatan Log Historis ({logs.length} catatan)
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Mengekspor seluruh riwayat audit transaksi sistem tanpa terpengaruh filter tampilan.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Column Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">3. Kolom yang Disertakan ({selectedColumns.length}/{AVAILABLE_COLUMNS.length})</label>
                  <button
                    type="button"
                    onClick={selectAllColumns}
                    className="text-[11px] text-[#002B66] hover:underline font-semibold"
                  >
                    Pilih Semua Kolom
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {AVAILABLE_COLUMNS.map(col => (
                    <label key={col.id} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-slate-100">
                      <input 
                        type="checkbox"
                        checked={selectedColumns.includes(col.id)}
                        onChange={() => toggleColumnSelection(col.id)}
                        className="rounded text-[#002B66] focus:ring-[#002B66]"
                      />
                      <span className="font-medium text-slate-700 text-[11px]">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Excel Specific Option */}
              {exportFormat === 'xlsx' && (
                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={includeSummarySheet}
                      onChange={(e) => setIncludeSummarySheet(e.target.checked)}
                      className="mt-0.5 rounded text-[#002B66] focus:ring-[#002B66]"
                    />
                    <div>
                      <div className="font-bold text-amber-900 text-xs">Sertakan Lembar Ringkasan Audit (Sheet 2)</div>
                      <div className="text-[10px] text-amber-800 mt-0.5">
                        Menambahkan sheet "Ringkasan_Audit" yang berisi nama auditor, waktu unduh, statistik transaksi per modul, dan ringkasan aktivitas user.
                      </div>
                    </div>
                  </label>
                </div>
              )}

              {/* Preview Summary */}
              <div className="bg-slate-100 p-3 rounded-xl text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ringkasan Ekspor:</span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px]">
                  <div>Jumlah Baris: <span className="font-semibold text-slate-900">{exportScope === 'filtered' ? filteredLogs.length : logs.length}</span></div>
                  <div>Format: <span className="font-semibold text-slate-900">.{exportFormat}</span></div>
                  <div>Jumlah Kolom: <span className="font-semibold text-slate-900">{selectedColumns.length} Kolom</span></div>
                  <div>Auditor: <span className="font-semibold text-slate-900 truncate">{currentUser?.nama || currentUser?.email || 'Administrator'}</span></div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => executeExport(exportFormat, exportScope)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#002B66] hover:bg-[#002B66]/90 active:bg-[#002B66] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Download className="w-4 h-4 text-amber-300" />
                <span>Unduh Berkas Audit ({(exportScope === 'filtered' ? filteredLogs.length : logs.length)} Log)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
