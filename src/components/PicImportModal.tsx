import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, Upload, Download, CheckCircle2, 
  AlertTriangle, XCircle, ArrowRight, ShieldCheck, 
  X, RefreshCw, Check, Users, Search, UserCheck, 
  Building2, Briefcase, Info, Sparkles
} from 'lucide-react';
import { PicProgram, Program } from '../types';

interface ParsedPicRow {
  rowNumber: number;
  data: Omit<PicProgram, 'idPic' | 'createdAt' | 'updatedAt'> & { idPic?: string };
  status: 'valid' | 'duplicate' | 'invalid';
  errors: string[];
  duplicateReason?: string;
}

interface PicImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingPics: PicProgram[];
  programList?: Program[];
  onImportSuccess: (
    items: Array<Omit<PicProgram, 'idPic' | 'createdAt' | 'updatedAt'> & { idPic?: string }>,
    mode: 'skip' | 'update' | 'force'
  ) => { success: boolean; message: string; count: number };
}

export const PicImportModal: React.FC<PicImportModalProps> = ({
  isOpen,
  onClose,
  existingPics,
  programList = [],
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedPicRow[]>([]);
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'update' | 'force'>('skip');
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'valid' | 'duplicate' | 'invalid'>('ALL');
  const [searchPreview, setSearchPreview] = useState('');
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Download official Unpad PIC Template
  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    const headers = [
      'ID PIC (Opsional)',
      'Nama Lengkap (Wajib)',
      'Gelar Depan',
      'Gelar Belakang',
      'NIP / NUPTK',
      'Email (Wajib / Dianjurkan)',
      'Nomor HP / WA (Wajib / Dianjurkan)',
      'Jabatan / Peran (Wajib)',
      'Unit Kerja / Fakultas (Wajib)',
      'Program Utama',
      'Status Aktif (Ya / Tidak)',
      'Keterangan'
    ];

    const sampleRows = [
      [
        'PIC-001',
        'Asep Hidayat',
        'Dr.',
        'M.Si.',
        '197805122005011002',
        'asep.hidayat@unpad.ac.id',
        '081223344556',
        'Koordinator Program',
        'Direktorat Pendidikan Non Gelar',
        'Program Luhung Eksekutif',
        'Ya',
        'Koordinator Program Utama Kepemimpinan'
      ],
      [
        'PIC-002',
        'Siti Nurhaliza',
        'Prof. Dr.',
        'dr., Sp.A(K)',
        '197203151998032001',
        'siti.nurhaliza@unpad.ac.id',
        '081399887766',
        'Koordinator Sertifikasi LSP',
        'Fakultas Kedokteran (FK)',
        'Pelatihan Klinis Berkelanjutan',
        'Ya',
        'Penanggung jawab kurikulum sertifikasi medis'
      ],
      [
        '',
        'Budi Santoso',
        '',
        'S.Kom., M.T.',
        '198510202010121004',
        'budi.santoso@unpad.ac.id',
        '085711223344',
        'Penanggung Jawab Teknis & IT',
        'Fakultas Matematika dan Ilmu Pengetahuan Alam (FMIPA)',
        'Pelatihan Data Science & AI',
        'Ya',
        'PIC sistem informasi dan lab komputer'
      ]
    ];

    const fileName = `Template_Import_PIC_UNPAD.${format}`;

    if (format === 'xlsx') {
      const data = [headers, ...sampleRows];
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      worksheet['!cols'] = [
        { wch: 18 }, { wch: 25 }, { wch: 14 }, { wch: 16 },
        { wch: 22 }, { wch: 28 }, { wch: 20 }, { wch: 28 },
        { wch: 35 }, { wch: 30 }, { wch: 16 }, { wch: 35 }
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Template PIC');
      XLSX.writeFile(workbook, fileName);
    } else {
      const data = [headers, ...sampleRows];
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Process File Upload
  const processUploadedFile = (uploadedFile: File) => {
    setIsParsing(true);
    setFile(uploadedFile);
    setFileName(uploadedFile.name);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rawJson.length === 0) {
          alert('Berkas Excel/CSV kosong atau tidak memiliki data.');
          setIsParsing(false);
          return;
        }

        const rows: ParsedPicRow[] = [];

        rawJson.forEach((row, idx) => {
          const rowNum = idx + 2; // header is row 1
          const keys = Object.keys(row);

          // Flexible field resolver
          const getVal = (possibleHeaders: string[]) => {
            for (const header of possibleHeaders) {
              const matchedKey = keys.find(k => 
                k.trim().toLowerCase() === header.toLowerCase() ||
                k.trim().toLowerCase().includes(header.toLowerCase())
              );
              if (matchedKey && row[matchedKey] !== undefined && String(row[matchedKey]).trim() !== '') {
                return String(row[matchedKey]).trim();
              }
            }
            return '';
          };

          const idPic = getVal(['id pic', 'idpic', 'kode pic', 'id']);
          const namaLengkap = getVal(['nama lengkap', 'nama pic', 'nama', 'full name']);
          const gelarDepan = getVal(['gelar depan', 'gelar awal', 'title front']);
          const gelarBelakang = getVal(['gelar belakang', 'gelar akhir', 'title back']);
          const nip = getVal(['nip', 'nuptk', 'nik', 'no identitas']);
          const email = getVal(['email', 'surel', 'e-mail']);
          const nomorHp = getVal(['nomor hp', 'no hp', 'whatsapp', 'no wa', 'telepon', 'phone']);
          const jabatan = getVal(['jabatan', 'peran', 'posisi', 'role']) || 'Koordinator Program';
          const unitFakultas = getVal(['unit kerja', 'fakultas', 'unit/fakultas', 'departemen', 'unit']) || 'Direktorat Pendidikan Non Gelar';
          const namaProgramUtama = getVal(['program utama', 'nama program', 'program']);
          const rawStatus = getVal(['status aktif', 'status', 'aktif']).toLowerCase();
          const keterangan = getVal(['keterangan', 'catatan', 'notes']);

          // Status aktif parser
          const statusAktif: 'Ya' | 'Tidak' = (
            rawStatus.includes('tidak') || rawStatus === 'false' || rawStatus === '0' || rawStatus === 'nonaktif'
          ) ? 'Tidak' : 'Ya';

          // Validation
          const errors: string[] = [];
          if (!namaLengkap) {
            errors.push('Nama Lengkap wajib diisi');
          }
          if (!email && !nomorHp) {
            errors.push('Email atau No HP wajib diisi salah satu');
          }

          // Duplicate detection
          let isDuplicate = false;
          let duplicateReason = '';

          const dupById = idPic ? existingPics.find(p => p.idPic.toLowerCase() === idPic.toLowerCase()) : null;
          const dupByEmail = email ? existingPics.find(p => p.email && p.email.toLowerCase() === email.toLowerCase()) : null;
          const dupByName = namaLengkap ? existingPics.find(p => 
            p.namaLengkap.toLowerCase().trim() === namaLengkap.toLowerCase().trim() &&
            (p.unitFakultas || '').toLowerCase().trim() === unitFakultas.toLowerCase().trim()
          ) : null;

          if (dupById) {
            isDuplicate = true;
            duplicateReason = `ID PIC "${idPic}" sudah terdaftar (${dupById.namaLengkap})`;
          } else if (dupByEmail) {
            isDuplicate = true;
            duplicateReason = `Email "${email}" sudah digunakan oleh ${dupByEmail.namaLengkap}`;
          } else if (dupByName) {
            isDuplicate = true;
            duplicateReason = `Nama "${namaLengkap}" di unit "${unitFakultas}" sudah terdaftar`;
          }

          const status: 'valid' | 'duplicate' | 'invalid' = 
            errors.length > 0 ? 'invalid' : (isDuplicate ? 'duplicate' : 'valid');

          rows.push({
            rowNumber: rowNum,
            data: {
              ...(idPic ? { idPic } : {}),
              namaLengkap,
              gelarDepan,
              gelarBelakang,
              nip,
              email,
              nomorHp,
              jabatan,
              unitFakultas,
              namaProgramUtama,
              statusAktif,
              keterangan,
            },
            status,
            errors,
            duplicateReason,
          });
        });

        setParsedRows(rows);
      } catch (err: any) {
        console.error('Error parsing PIC spreadsheet:', err);
        alert(`Gagal membaca berkas: ${err.message || 'Format berkas tidak valid.'}`);
      } finally {
        setIsParsing(false);
      }
    };

    reader.readAsBinaryString(uploadedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processUploadedFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processUploadedFile(f);
  };

  // Preview filtering & search
  const filteredPreviewRows = parsedRows.filter(r => {
    if (previewFilter !== 'ALL' && r.status !== previewFilter) return false;
    if (searchPreview.trim()) {
      const q = searchPreview.toLowerCase();
      const n = (r.data.namaLengkap || '').toLowerCase();
      const em = (r.data.email || '').toLowerCase();
      const hp = (r.data.nomorHp || '').toLowerCase();
      const u = (r.data.unitFakultas || '').toLowerCase();
      return n.includes(q) || em.includes(q) || hp.includes(q) || u.includes(q);
    }
    return true;
  });

  const validCount = parsedRows.filter(r => r.status === 'valid').length;
  const duplicateCount = parsedRows.filter(r => r.status === 'duplicate').length;
  const invalidCount = parsedRows.filter(r => r.status === 'invalid').length;

  // Execute Import
  const handleExecuteImport = () => {
    // Determine which items to import based on duplicateHandling
    const itemsToProcess = parsedRows.filter(r => {
      if (r.status === 'invalid') return false;
      if (r.status === 'duplicate' && duplicateHandling === 'skip') return false;
      return true;
    }).map(r => r.data);

    if (itemsToProcess.length === 0) {
      alert('Tidak ada data valid yang dapat diimpor dengan mode penanganan duplikat saat ini.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = onImportSuccess(itemsToProcess, duplicateHandling);
      setImportResult({
        success: res.success,
        message: res.message || `Berhasil mengimpor ${res.count} data PIC/Koordinator!`
      });
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      alert(`Terjadi kesalahan saat menyimpan import: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-[#002B66] via-blue-900 to-[#002B66] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl text-[#FDB913]">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>Import Data PIC & Koordinator Program</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#FDB913] text-[#002B66] rounded-full">
                  Excel / CSV
                </span>
              </h3>
              <p className="text-xs text-blue-100">
                Unggah dan validasi berkas daftar PIC, nomor kontak, jabatan, dan penugasan unit
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
          {/* Step 1: Template Download Banner */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                  Gunakan Template Resmi DPNG Unpad
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Unduh template dengan kolom yang telah disesuaikan agar proses import berjalan otomatis dan akurat.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleDownloadTemplate('xlsx')}
                className="px-3 py-1.5 bg-[#002B66] hover:bg-[#002252] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#FDB913]" />
                <span>Template Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadTemplate('csv')}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Step 2: Upload Area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#002B66] bg-blue-50/80 scale-[0.99]'
                : file
                ? 'border-emerald-400 bg-emerald-50/30'
                : 'border-slate-300 hover:border-[#002B66] hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className={`p-3 rounded-full ${file ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-[#002B66]'}`}>
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  {file ? fileName : 'Pilih atau Seret Berkas Excel / CSV ke Sini'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Mendukung format .xlsx, .xls, dan .csv (Ukuran berkas maks. 10MB)
                </p>
              </div>
            </div>
          </div>

          {/* Import Result Notice */}
          {importResult && (
            <div className={`p-4 rounded-xl flex items-center gap-3 ${
              importResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="font-bold text-xs">{importResult.message}</p>
            </div>
          )}

          {/* Step 3: Analysis & Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Baris</span>
                  <span className="text-lg font-black text-slate-800">{parsedRows.length} Baris</span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase block">Valid & Siap</span>
                  <span className="text-lg font-black text-emerald-800">{validCount} Data</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-[10px] text-amber-700 font-bold uppercase block">Terdeteksi Duplikat</span>
                  <span className="text-lg font-black text-amber-800">{duplicateCount} Data</span>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <span className="text-[10px] text-rose-700 font-bold uppercase block">Format Error</span>
                  <span className="text-lg font-black text-rose-800">{invalidCount} Data</span>
                </div>
              </div>

              {/* Duplicate Strategy & Preview Filter Toolbar */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                {/* Duplicate handling */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Jika Data Duplikat:</span>
                  <select
                    value={duplicateHandling}
                    onChange={(e) => setDuplicateHandling(e.target.value as any)}
                    className="p-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-xs text-[#002B66]"
                  >
                    <option value="skip">Lewati (Pertahankan data lama)</option>
                    <option value="update">Perbarui (Timpa dengan data file)</option>
                    <option value="force">Tambah Baru (Buat ID baru)</option>
                  </select>
                </div>

                {/* Filter & Search preview */}
                <div className="flex items-center gap-2">
                  <div className="flex bg-white rounded-lg border border-slate-200 p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('ALL')}
                      className={`px-2 py-1 rounded text-[11px] font-bold ${
                        previewFilter === 'ALL' ? 'bg-[#002B66] text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Semua ({parsedRows.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('valid')}
                      className={`px-2 py-1 rounded text-[11px] font-bold ${
                        previewFilter === 'valid' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:text-emerald-900'
                      }`}
                    >
                      Valid ({validCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('duplicate')}
                      className={`px-2 py-1 rounded text-[11px] font-bold ${
                        previewFilter === 'duplicate' ? 'bg-amber-500 text-white' : 'text-amber-700 hover:text-amber-900'
                      }`}
                    >
                      Duplikat ({duplicateCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('invalid')}
                      className={`px-2 py-1 rounded text-[11px] font-bold ${
                        previewFilter === 'invalid' ? 'bg-rose-600 text-white' : 'text-rose-700 hover:text-rose-900'
                      }`}
                    >
                      Error ({invalidCount})
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama / email..."
                      value={searchPreview}
                      onChange={(e) => setSearchPreview(e.target.value)}
                      className="pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white outline-none w-36 sm:w-48"
                    />
                  </div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold border-b border-slate-200 z-10">
                      <tr>
                        <th className="p-2.5 w-12 text-center">Baris</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Nama Lengkap</th>
                        <th className="p-2.5">Jabatan</th>
                        <th className="p-2.5">Unit / Fakultas</th>
                        <th className="p-2.5">Kontak</th>
                        <th className="p-2.5">Catatan / Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredPreviewRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-400">
                            Tidak ada data baris yang cocok dengan filter.
                          </td>
                        </tr>
                      ) : (
                        filteredPreviewRows.map((r, i) => (
                          <tr key={i} className={`hover:bg-slate-50/80 ${
                            r.status === 'invalid' ? 'bg-rose-50/30' : r.status === 'duplicate' ? 'bg-amber-50/30' : ''
                          }`}>
                            <td className="p-2.5 text-center font-mono text-slate-500 font-bold">{r.rowNumber}</td>
                            <td className="p-2.5 whitespace-nowrap">
                              {r.status === 'valid' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Valid
                                </span>
                              )}
                              {r.status === 'duplicate' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  Duplikat
                                </span>
                              )}
                              {r.status === 'invalid' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                  Error
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 font-bold text-slate-800">
                              {[r.data.gelarDepan, r.data.namaLengkap, r.data.gelarBelakang].filter(Boolean).join(' ')}
                            </td>
                            <td className="p-2.5 text-slate-600">{r.data.jabatan}</td>
                            <td className="p-2.5 text-slate-600 max-w-[160px] truncate" title={r.data.unitFakultas}>
                              {r.data.unitFakultas}
                            </td>
                            <td className="p-2.5 text-slate-600">
                              <div>{r.data.email || '-'}</div>
                              <div className="text-[10px] text-slate-400">{r.data.nomorHp || '-'}</div>
                            </td>
                            <td className="p-2.5 text-[11px]">
                              {r.errors.length > 0 && (
                                <span className="text-rose-600 font-medium">{r.errors.join(', ')}</span>
                              )}
                              {r.duplicateReason && (
                                <span className="text-amber-700">{r.duplicateReason}</span>
                              )}
                              {r.status === 'valid' && (
                                <span className="text-emerald-600 font-medium">Siap diimpor</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
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
            onClick={handleExecuteImport}
            disabled={parsedRows.length === 0 || isSubmitting || (validCount === 0 && duplicateCount === 0)}
            className="px-6 py-2 bg-[#002B66] hover:bg-[#002252] disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#FDB913]" />
                <span>Menyimpan ke Database...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-[#FDB913]" />
                <span>
                  Proses Import ({duplicateHandling === 'skip' ? validCount : validCount + duplicateCount} PIC)
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
