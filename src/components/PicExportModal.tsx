import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Download, FileSpreadsheet, CheckSquare, Square, 
  Filter, CheckCircle2, X, Building2, UserCheck, Users, 
  Briefcase, Check
} from 'lucide-react';
import { PicProgram, Peserta } from '../types';

interface PicExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  picList: PicProgram[];
  pesertaList?: Peserta[];
}

interface ColumnOption {
  id: string;
  label: string;
  defaultChecked: boolean;
}

const AVAILABLE_PIC_COLUMNS: ColumnOption[] = [
  { id: 'idPic', label: 'ID PIC', defaultChecked: true },
  { id: 'namaLengkap', label: 'Nama Lengkap (Tanpa Gelar)', defaultChecked: false },
  { id: 'namaLengkapGelar', label: 'Nama Lengkap Beserta Gelar', defaultChecked: true },
  { id: 'gelarDepan', label: 'Gelar Depan', defaultChecked: true },
  { id: 'gelarBelakang', label: 'Gelar Belakang', defaultChecked: true },
  { id: 'nip', label: 'NIP / NUPTK', defaultChecked: true },
  { id: 'email', label: 'Email', defaultChecked: true },
  { id: 'nomorHp', label: 'Nomor HP / WhatsApp', defaultChecked: true },
  { id: 'jabatan', label: 'Jabatan / Peran', defaultChecked: true },
  { id: 'unitFakultas', label: 'Unit Kerja / Fakultas Unpad', defaultChecked: true },
  { id: 'namaProgramUtama', label: 'Program Utama', defaultChecked: true },
  { id: 'statusAktif', label: 'Status Aktif', defaultChecked: true },
  { id: 'jumlahPeserta', label: 'Jumlah Peserta Binaan', defaultChecked: true },
  { id: 'keterangan', label: 'Keterangan', defaultChecked: true },
];

export const PicExportModal: React.FC<PicExportModalProps> = ({
  isOpen,
  onClose,
  picList,
  pesertaList = [],
}) => {
  const [filterUnit, setFilterUnit] = useState<string>('ALL');
  const [filterJabatan, setFilterJabatan] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');

  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    AVAILABLE_PIC_COLUMNS.filter(c => c.defaultChecked).map(c => c.id)
  );

  // Available unique units and jabatans for filters
  const uniqueUnits = useMemo(() => {
    const set = new Set<string>();
    picList.forEach(p => {
      if (p.unitFakultas) set.add(p.unitFakultas);
    });
    return Array.from(set).sort();
  }, [picList]);

  const uniqueJabatans = useMemo(() => {
    const set = new Set<string>();
    picList.forEach(p => {
      if (p.jabatan) set.add(p.jabatan);
    });
    return Array.from(set).sort();
  }, [picList]);

  // Filtered PIC list
  const filteredData = useMemo(() => {
    return picList.filter(p => {
      if (filterUnit !== 'ALL' && p.unitFakultas !== filterUnit) return false;
      if (filterJabatan !== 'ALL' && p.jabatan !== filterJabatan) return false;
      if (filterStatus !== 'ALL') {
        const isActive = p.statusAktif === 'Ya' || p.statusAktif === true;
        if (filterStatus === 'Aktif' && !isActive) return false;
        if (filterStatus === 'Non-Aktif' && isActive) return false;
      }
      return true;
    });
  }, [picList, filterUnit, filterJabatan, filterStatus]);

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    if (selectedColumns.length === AVAILABLE_PIC_COLUMNS.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(AVAILABLE_PIC_COLUMNS.map(c => c.id));
    }
  };

  const toggleColumn = (id: string) => {
    if (selectedColumns.includes(id)) {
      setSelectedColumns(selectedColumns.filter(c => c !== id));
    } else {
      setSelectedColumns([...selectedColumns, id]);
    }
  };

  const handleExport = () => {
    if (selectedColumns.length === 0) {
      alert('Pilih minimal satu kolom untuk diexport.');
      return;
    }

    if (filteredData.length === 0) {
      alert('Tidak ada data PIC yang memenuhi kriteria filter.');
      return;
    }

    // Build participant lookup map
    const participantCountMap: Record<string, number> = {};
    pesertaList.forEach(peserta => {
      if (peserta.idPic) {
        participantCountMap[peserta.idPic] = (participantCountMap[peserta.idPic] || 0) + 1;
      }
    });

    const activeCols = AVAILABLE_PIC_COLUMNS.filter(c => selectedColumns.includes(c.id));

    // Construct formatted rows
    const rows = filteredData.map(p => {
      const fullTitleName = [p.gelarDepan, p.namaLengkap, p.gelarBelakang].filter(Boolean).join(' ');
      const pCount = participantCountMap[p.idPic] || 0;
      const statusText = (p.statusAktif === 'Ya' || p.statusAktif === true) ? 'Aktif' : 'Non-Aktif';

      const rowObj: Record<string, string | number> = {};
      activeCols.forEach(col => {
        switch (col.id) {
          case 'idPic':
            rowObj[col.label] = p.idPic || '';
            break;
          case 'namaLengkap':
            rowObj[col.label] = p.namaLengkap || '';
            break;
          case 'namaLengkapGelar':
            rowObj[col.label] = fullTitleName;
            break;
          case 'gelarDepan':
            rowObj[col.label] = p.gelarDepan || '';
            break;
          case 'gelarBelakang':
            rowObj[col.label] = p.gelarBelakang || '';
            break;
          case 'nip':
            rowObj[col.label] = p.nip || '';
            break;
          case 'email':
            rowObj[col.label] = p.email || '';
            break;
          case 'nomorHp':
            rowObj[col.label] = p.nomorHp || '';
            break;
          case 'jabatan':
            rowObj[col.label] = p.jabatan || '';
            break;
          case 'unitFakultas':
            rowObj[col.label] = p.unitFakultas || '';
            break;
          case 'namaProgramUtama':
            rowObj[col.label] = p.namaProgramUtama || '';
            break;
          case 'statusAktif':
            rowObj[col.label] = statusText;
            break;
          case 'jumlahPeserta':
            rowObj[col.label] = pCount;
            break;
          case 'keterangan':
            rowObj[col.label] = p.keterangan || '';
            break;
          default:
            rowObj[col.label] = (p as any)[col.id] || '';
        }
      });
      return rowObj;
    });

    const now = new Date();
    const dateStr = now.toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const fileName = `SIMPENDIK_UNPAD_Data_PIC_${dateStr}.${exportFormat}`;

    if (exportFormat === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      // Auto column widths
      const colWidths = activeCols.map(col => {
        const maxLen = Math.max(
          col.label.length,
          ...rows.map(r => String(r[col.label] || '').length)
        );
        return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
      });
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'PIC & Koordinator');
      XLSX.writeFile(workbook, fileName);
    } else {
      // CSV format
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

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-[#002B66] via-blue-900 to-[#002B66] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl text-[#FDB913]">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>Export Data PIC & Koordinator Program</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#FDB913] text-[#002B66] rounded-full">
                  Excel & CSV
                </span>
              </h3>
              <p className="text-xs text-blue-100">
                Unduh rekapan profil kontak, jabatan, dan penugasan PIC Non-Gelar Unpad
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Format & Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Format Selection */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-[#002B66]" />
                <span>Pilih Format Berkas</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExportFormat('xlsx')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    exportFormat === 'xlsx'
                      ? 'border-[#002B66] bg-blue-50 text-[#002B66] font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm font-extrabold">Microsoft Excel</span>
                  <span className="text-[10px] opacity-80">Format .xlsx resmi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('csv')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    exportFormat === 'csv'
                      ? 'border-[#002B66] bg-blue-50 text-[#002B66] font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm font-extrabold">CSV (Comma-Separated)</span>
                  <span className="text-[10px] opacity-80">Universal UTF-8</span>
                </button>
              </div>
            </div>

            {/* Filter Criteria */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-[#002B66]" />
                <span>Penyaringan Data</span>
              </label>

              <div>
                <label className="text-[11px] text-slate-500 font-semibold block mb-1">Unit Kerja / Fakultas:</label>
                <select
                  value={filterUnit}
                  onChange={(e) => setFilterUnit(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs font-medium"
                >
                  <option value="ALL">Semua Fakultas & Unit ({picList.length})</option>
                  {uniqueUnits.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold block mb-1">Jabatan / Peran:</label>
                  <select
                    value={filterJabatan}
                    onChange={(e) => setFilterJabatan(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs font-medium"
                  >
                    <option value="ALL">Semua Jabatan</option>
                    {uniqueJabatans.map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 font-semibold block mb-1">Status Keaktifan:</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs font-medium"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="Aktif">Khusus Aktif</option>
                    <option value="Non-Aktif">Khusus Non-Aktif</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Column Selection Card */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Pilih Kolom Data yang Diexport</h4>
                <p className="text-[11px] text-slate-500">
                  Centang kolom yang ingin dimasukkan ke dalam berkas Excel/CSV
                </p>
              </div>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-bold text-[#002B66] hover:underline cursor-pointer"
              >
                {selectedColumns.length === AVAILABLE_PIC_COLUMNS.length ? 'Hapus Semua Centang' : 'Pilih Semua Kolom'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {AVAILABLE_PIC_COLUMNS.map(col => {
                const isChecked = selectedColumns.includes(col.id);
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => toggleColumn(col.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isChecked
                        ? 'border-blue-400 bg-blue-50/60 text-[#002B66] font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-[#002B66] shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span className="truncate text-[11px]">{col.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Export Summary Banner */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">
                  {filteredData.length} Data PIC Terpilih
                </p>
                <p className="text-[11px] text-emerald-700">
                  {selectedColumns.length} kolom akan disimpan ke format berkas {exportFormat.toUpperCase()}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono bg-white text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-300 font-bold">
              {filteredData.length} / {picList.length} PIC
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 text-xs transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={filteredData.length === 0 || selectedColumns.length === 0}
            className="px-6 py-2 bg-[#002B66] hover:bg-[#002252] disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#FDB913]" />
            <span>Download Berkas ({exportFormat.toUpperCase()})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
