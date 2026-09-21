import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, Upload, Download, CheckCircle2, 
  AlertTriangle, XCircle, FileText, ArrowRight, ShieldCheck, 
  X, RefreshCw, Check, School, Calendar, Users, DollarSign,
  Info, Sparkles, Filter, Search
} from 'lucide-react';
import { 
  EduventureBooking, Kategori, 
  SkemaPaketEduventure, PilihanKunjunganEduventure, 
  StatusBayarEduventure, RekeningEduventure 
} from '../types';

interface ParsedEduventureRow {
  rowNumber: number;
  data: Omit<EduventureBooking, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };
  status: 'valid' | 'duplicate' | 'invalid';
  errors: string[];
  duplicateReason?: string;
}

interface EduventureImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingBookings: EduventureBooking[];
  kategoriList: Kategori[];
  onImportSuccess: (
    items: Array<Omit<EduventureBooking, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }>,
    mode: 'skip' | 'update' | 'force'
  ) => { success: boolean; message: string; count: number };
}

export const EduventureImportModal: React.FC<EduventureImportModalProps> = ({
  isOpen,
  onClose,
  existingBookings,
  kategoriList,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedEduventureRow[]>([]);
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'update' | 'force'>('skip');
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'valid' | 'duplicate' | 'invalid'>('ALL');
  const [searchPreview, setSearchPreview] = useState('');
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Find default Eduventure category (KAT-006)
  const defaultKategori = kategoriList.find(
    k => k.idKategori === 'KAT-006' || k.namaKategori.toLowerCase().includes('eduventure')
  ) || kategoriList[0];

  // 1. Download official Unpad Eduventure Templates
  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    const headers = [
      'Nama Sekolah',
      'Alamat',
      'Narahubung',
      'No Kontak',
      'Email Kontak',
      'Jml Peserta',
      'Jml Guru',
      'Tgl Pelaksanaan (YYYY-MM-DD)',
      'Tempat Penyelenggaraan',
      'Paket (Eduventure Lite / Experience / Tematik)',
      'Pilihan Kunjungan (Universitas / Fakultas)',
      'Fakultas Tujuan (Pisahkan Koma)',
      'Status Bayar (Sudah / Belum)',
      'Nominal Transfer',
      'Tgl Transfer (YYYY-MM-DD)',
      'Rekening (Eduventure / Luhung)',
      'Catatan Tambahan'
    ];

    const sampleRows = [
      [
        'SMA Negeri 1 Bandung',
        'Jl. Ir. H. Djuanda No. 93, Bandung',
        'Dra. Hj. Ratna Juwita, M.Pd.',
        '081223344556',
        'humas@sman1bdg.sch.id',
        120,
        8,
        '2026-04-15',
        'Auditorium Fakultas Farmasi',
        'Eduventure Experience',
        'Universitas',
        'Fakultas Kedokteran, FMIPA',
        'Sudah',
        36000000,
        '2026-03-20',
        'Eduventure 9882340560200004',
        'Rombongan kelas XII peminatan IPA & Kedokteran'
      ],
      [
        'SMA Labschool Kebayoran Jakarta',
        'Jl. KH. Ahmad Dahlan No. 14, Jakarta Selatan',
        'Bambang Sugiarto, S.Si.',
        '081399887766',
        'bambang@labschool-kb.sch.id',
        85,
        6,
        '2026-05-10',
        'Auditorium Fakultas Ilmu Komunikasi',
        'Eduventure Tematik',
        'Fakultas',
        'Fakultas Ekonomi dan Bisnis, Fakultas Ilmu Komunikasi',
        'Sudah',
        25500000,
        '2026-04-02',
        'Eduventure 9882340560200004',
        'Fokus simulasi trading room FEB dan lab broadcasting FIKOM'
      ],
      [
        'SMA Taruna Nusantara Magelang',
        'Jl. Raya Purworejo Km. 5, Magelang',
        'Mayor (Purn) Suryadi, M.Ed.',
        '08112233445',
        'edutour@tarunanusantara.sch.id',
        150,
        10,
        '2026-06-05',
        'Bale Sawala',
        'Eduventure Lite',
        'Universitas',
        'Rektorat Unpad, CISRAL',
        'Belum',
        0,
        '',
        'Eduventure 9882340560200004',
        'Orientasi seleksi SNBP/SNBT dan fasilitas kampus Jatinangor'
      ]
    ];

    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
      
      // Auto-fit column widths
      ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 3, 16) }));

      XLSX.utils.book_append_sheet(wb, ws, 'Template Eduventure');
      XLSX.writeFile(wb, `Template_Import_Kunjungan_Eduventure_UNPAD.xlsx`);
    } else {
      const csvContent = '\uFEFF' + [
        headers.map(h => `"${h}"`).join(','),
        ...sampleRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Template_Import_Kunjungan_Eduventure_UNPAD.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Helper date normalizer
  const parseExcelDate = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'number') {
      // Excel serial date to JS Date
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().substring(0, 10);
      }
    }
    const str = String(val).trim();
    // Check YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }
    // Check DD/MM/YYYY or DD-MM-YYYY
    const parts = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (parts) {
      const day = parts[1].padStart(2, '0');
      const month = parts[2].padStart(2, '0');
      const year = parts[3];
      return `${year}-${month}-${day}`;
    }
    // Try standard date parsing
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().substring(0, 10);
    }
    return str;
  };

  // 2. Parse uploaded file
  const processUploadedFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setIsParsing(true);
    setImportResult(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
      
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('Lembar kerja (worksheet) tidak ditemukan dalam file.');
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (rawRows.length < 2) {
        throw new Error('File tidak memiliki data baris yang cukup (minimal harus memiliki header dan 1 baris data).');
      }

      // Headers normalization
      const headerRow = (rawRows[0] as any[]).map(h => String(h || '').trim().toLowerCase());

      const getColIndex = (keywords: string[]) => {
        return headerRow.findIndex(h => keywords.some(k => h.includes(k.toLowerCase())));
      };

      const idxSekolah = getColIndex(['nama sekolah', 'sekolah', 'instansi', 'nama_sekolah', 'lembaga']);
      const idxAlamat = getColIndex(['alamat', 'lokasi', 'kota']);
      const idxKontakPerson = getColIndex(['narahubung', 'kontak person', 'nama guru', 'pic', 'penanggung']);
      const idxNomorKontak = getColIndex(['no kontak', 'nomor kontak', 'no hp', 'telepon', 'wa', 'whatsapp']);
      const idxEmail = getColIndex(['email', 'surel']);
      const idxPeserta = getColIndex(['peserta', 'siswa', 'jml peserta', 'jumlah peserta']);
      const idxGuru = getColIndex(['guru', 'pendamping', 'jml guru', 'jumlah guru']);
      const idxTanggal = getColIndex(['tgl pelaksanaan', 'tanggal pelaksanaan', 'tgl kunjungan', 'tanggal', 'jadwal']);
      const idxTempat = getColIndex(['tempat penyelenggaraan', 'tempat', 'lokasi penyelenggaraan', 'venue', 'gedung', 'bale']);
      const idxPaket = getColIndex(['paket', 'skema']);
      const idxPilihan = getColIndex(['pilihan kunjungan', 'pilihan', 'tujuan']);
      const idxFakultas = getColIndex(['fakultas tujuan', 'fakultas']);
      const idxStatusBayar = getColIndex(['status bayar', 'pembayaran', 'bayar', 'status']);
      const idxNominal = getColIndex(['nominal', 'biaya', 'tarif', 'transfer']);
      const idxTglTransfer = getColIndex(['tgl transfer', 'tanggal transfer']);
      const idxRekening = getColIndex(['rekening', 'no rek', 'va']);
      const idxCatatan = getColIndex(['catatan', 'keterangan']);

      const parsedList: ParsedEduventureRow[] = [];

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i] as any[];
        if (!row || row.every(cell => String(cell || '').trim() === '')) {
          continue; // skip blank rows
        }

        const rawSekolah = idxSekolah >= 0 ? String(row[idxSekolah] || '').trim() : String(row[0] || '').trim();
        const rawAlamat = idxAlamat >= 0 ? String(row[idxAlamat] || '').trim() : (row[1] ? String(row[1]).trim() : '');
        const rawKontak = idxKontakPerson >= 0 ? String(row[idxKontakPerson] || '').trim() : (row[2] ? String(row[2]).trim() : '');
        const rawNoKontak = idxNomorKontak >= 0 ? String(row[idxNomorKontak] || '').trim() : (row[3] ? String(row[3]).trim() : '');
        const rawEmail = idxEmail >= 0 ? String(row[idxEmail] || '').trim() : '';
        const rawPeserta = idxPeserta >= 0 ? Number(String(row[idxPeserta]).replace(/[^\d]/g, '')) : (Number(row[5]) || 0);
        const rawGuru = idxGuru >= 0 ? Number(String(row[idxGuru]).replace(/[^\d]/g, '')) : (Number(row[6]) || 0);
        const rawTanggal = idxTanggal >= 0 ? parseExcelDate(row[idxTanggal]) : parseExcelDate(row[7]);
        const rawTempat = idxTempat >= 0 ? String(row[idxTempat] || '').trim() : '';
        const rawPaket = idxPaket >= 0 ? String(row[idxPaket] || '').trim() : '';
        const rawPilihan = idxPilihan >= 0 ? String(row[idxPilihan] || '').trim() : '';
        const rawFakultas = idxFakultas >= 0 ? String(row[idxFakultas] || '').trim() : '';
        const rawStatusBayar = idxStatusBayar >= 0 ? String(row[idxStatusBayar] || '').trim() : '';
        const rawNominal = idxNominal >= 0 ? Number(String(row[idxNominal]).replace(/[^\d]/g, '')) : 0;
        const rawTglTransfer = idxTglTransfer >= 0 ? parseExcelDate(row[idxTglTransfer]) : '';
        const rawRekening = idxRekening >= 0 ? String(row[idxRekening] || '').trim() : '';
        const rawCatatan = idxCatatan >= 0 ? String(row[idxCatatan] || '').trim() : '';

        // Skema Paket mapping
        let skemaPaket: SkemaPaketEduventure = 'Eduventure Experience';
        const pLower = rawPaket.toLowerCase();
        if (pLower.includes('lite')) {
          skemaPaket = 'Eduventure Lite';
        } else if (pLower.includes('tematik')) {
          skemaPaket = 'Eduventure Tematik';
        } else if (pLower.includes('experience') || pLower.includes('experiance')) {
          skemaPaket = 'Eduventure Experience';
        }

        // Pilihan Kunjungan mapping
        const pilihanKunjungan: PilihanKunjunganEduventure = 
          rawPilihan.toLowerCase().includes('fakultas') ? 'Fakultas' : 'Universitas';

        // Fakultas Tujuan
        const fakultasTujuan: string[] = rawFakultas 
          ? rawFakultas.split(/[,;]/).map(f => f.trim()).filter(Boolean)
          : [];

        // Status Bayar
        const statusBayar: StatusBayarEduventure = 
          ['sudah', 'lunas', 'paid', 'yes', 'ya', 'terbayar'].includes(rawStatusBayar.toLowerCase())
            ? 'Sudah'
            : 'Belum';

        // Rekening mapping
        const rekening: RekeningEduventure = 
          rawRekening.toLowerCase().includes('luhung') || rawRekening.includes('9880619020200219')
            ? 'Luhung 9880619020200219'
            : 'Eduventure 9882340560200004';

        const errors: string[] = [];
        if (!rawSekolah) {
          errors.push('Nama Sekolah wajib diisi');
        }
        if (!rawTanggal || !/^\d{4}-\d{2}-\d{2}$/.test(rawTanggal)) {
          errors.push('Tanggal Pelaksanaan tidak valid (Gunakan format YYYY-MM-DD)');
        }

        // Duplicate Check against existingBookings
        const duplicateMatch = existingBookings.find(existing => {
          return (
            existing.namaSekolah.trim().toLowerCase() === rawSekolah.toLowerCase() &&
            existing.tanggalPelaksanaan === rawTanggal
          );
        });

        let status: 'valid' | 'duplicate' | 'invalid' = 'valid';
        let duplicateReason: string | undefined;

        if (errors.length > 0) {
          status = 'invalid';
        } else if (duplicateMatch) {
          status = 'duplicate';
          duplicateReason = `Kunjungan sekolah ${duplicateMatch.namaSekolah} pada tanggal ${duplicateMatch.tanggalPelaksanaan} sudah terdaftar dengan ID ${duplicateMatch.id}.`;
        }

        parsedList.push({
          rowNumber: i + 1,
          status,
          errors,
          duplicateReason,
          data: {
            idKategori: defaultKategori?.idKategori || 'KAT-006',
            namaKategori: defaultKategori?.namaKategori || 'Eduventure',
            namaSekolah: rawSekolah,
            alamat: rawAlamat,
            kontakPerson: rawKontak || 'Narahubung Sekolah',
            nomorKontak: rawNoKontak || '-',
            emailKontak: rawEmail,
            jumlahPeserta: rawPeserta || 0,
            jumlahGuru: rawGuru || 0,
            tanggalPelaksanaan: rawTanggal,
            tempatPenyelenggaraan: rawTempat || 'Bale Sawala',
            skemaPaket,
            pilihanKunjungan,
            fakultasTujuan,
            statusBayar,
            nominalTransfer: rawNominal || 0,
            tanggalTransfer: rawTglTransfer,
            rekening,
            catatanTambahan: rawCatatan,
            statusKunjungan: statusBayar === 'Sudah' ? 'Dikonfirmasi' : 'Menunggu'
          }
        });
      }

      setParsedRows(parsedList);
    } catch (err: any) {
      alert(`Gagal memproses file: ${err.message || 'Format file tidak didukung.'}`);
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processUploadedFile(droppedFile);
    }
  };

  // Clear / Reset Upload
  const handleReset = () => {
    setFile(null);
    setFileName('');
    setParsedRows([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Calculate statistics
  const totalRows = parsedRows.length;
  const validRows = parsedRows.filter(r => r.status === 'valid');
  const duplicateRows = parsedRows.filter(r => r.status === 'duplicate');
  const invalidRows = parsedRows.filter(r => r.status === 'invalid');

  // Count which rows will be executed based on duplicateHandling
  const getRunnableRowsCount = () => {
    if (duplicateHandling === 'skip') {
      return validRows.length;
    } else if (duplicateHandling === 'update') {
      return validRows.length + duplicateRows.length;
    } else {
      // force
      return validRows.length + duplicateRows.length;
    }
  };

  // Submit Batch Import
  const handleExecuteImport = () => {
    const runnableRows = parsedRows.filter(r => {
      if (r.status === 'invalid') return false;
      if (r.status === 'duplicate' && duplicateHandling === 'skip') return false;
      return true;
    });

    if (runnableRows.length === 0) {
      alert('Tidak ada baris data valid yang dapat diimport dengan konfigurasi saat ini.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      try {
        const payload = runnableRows.map(r => r.data);
        const res = onImportSuccess(payload, duplicateHandling);
        setImportResult({
          success: res.success,
          message: res.message
        });

        if (res.success) {
          setTimeout(() => {
            onClose();
          }, 1800);
        }
      } catch (err: any) {
        setImportResult({
          success: false,
          message: err.message || 'Terjadi kesalahan saat menyimpan data import.'
        });
      } finally {
        setIsSubmitting(false);
      }
    }, 400);
  };

  // Filtered preview data
  const filteredPreview = parsedRows.filter(row => {
    if (previewFilter !== 'ALL' && row.status !== previewFilter) {
      return false;
    }
    if (searchPreview.trim()) {
      const q = searchPreview.toLowerCase();
      return (
        row.data.namaSekolah.toLowerCase().includes(q) ||
        row.data.kontakPerson.toLowerCase().includes(q) ||
        row.data.tanggalPelaksanaan.includes(q) ||
        row.data.skemaPaket.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#002B66] via-[#003882] to-[#002252] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
              <FileSpreadsheet className="w-5 h-5 text-[#FDB913]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Import Data Kunjungan Eduventure
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-300/30">
                  Excel / CSV
                </span>
              </div>
              <p className="text-xs text-blue-100/80 mt-0.5">
                Pendaftaran dan pencatatan rombongan sekolah secara massal ke SIMPENDIK Non-Gelar Unpad.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* Step 1: Download Templates Banner */}
          <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#002B66] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#002B66] uppercase tracking-wider">
                  Unduh Template Format Resmi Unpad
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Gunakan template Excel atau CSV yang telah disesuaikan dengan skema paket Eduventure Unpad (Lite, Experience, Tematik) untuk menghindari kesalahan kolom.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                id="btn-download-template-xlsx"
                onClick={() => handleDownloadTemplate('xlsx')}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Template Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                id="btn-download-template-csv"
                onClick={() => handleDownloadTemplate('csv')}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Template CSV (.csv)</span>
              </button>
            </div>
          </div>

          {/* Step 2: Upload Dropzone Area */}
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                isDragging 
                  ? 'border-[#002B66] bg-blue-50/60 scale-[1.005]' 
                  : 'border-slate-300 bg-white hover:border-[#002B66] hover:bg-slate-50/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) processUploadedFile(selected);
                }}
                className="hidden"
              />

              <div className="max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100/80 text-[#002B66] flex items-center justify-center mx-auto shadow-inner">
                  <Upload className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Tarik dan lepaskan file Excel atau CSV di sini
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Atau <span className="text-[#002B66] font-semibold underline underline-offset-2">klik untuk memilih file</span> dari komputer Anda.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-slate-400 font-medium">
                  <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">.xlsx</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">.xls</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">.csv</span>
                  <span>(Maks. 15 MB)</span>
                </div>
              </div>
            </div>
          ) : (
            /* Uploaded File Info Bar */
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {fileName}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB • {totalRows} baris data terdeteksi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Ganti File
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Hapus
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    const selected = e.target.files?.[0];
                    if (selected) processUploadedFile(selected);
                  }}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isParsing && (
            <div className="py-8 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-[#002B66] animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-600">
                Membaca dan memvalidasi baris data kunjungan...
              </p>
            </div>
          )}

          {/* Parsed Data Analytics & Options */}
          {parsedRows.length > 0 && !isParsing && (
            <div className="space-y-4">
              {/* Summary Statistics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium block">Total Data Terbaca</span>
                  <span className="text-xl font-black text-slate-900 mt-0.5 block">{totalRows}</span>
                  <span className="text-[10px] text-slate-400">Baris kunjungan</span>
                </div>

                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl shadow-2xs">
                  <span className="text-[11px] text-emerald-700 font-semibold block">Siap Diimport (Valid)</span>
                  <span className="text-xl font-black text-emerald-800 mt-0.5 block">{validRows.length}</span>
                  <span className="text-[10px] text-emerald-600">Data baru tanpa duplikasi</span>
                </div>

                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl shadow-2xs">
                  <span className="text-[11px] text-amber-700 font-semibold block">Duplikat Terdeteksi</span>
                  <span className="text-xl font-black text-amber-800 mt-0.5 block">{duplicateRows.length}</span>
                  <span className="text-[10px] text-amber-600">Sekolah & tanggal sama</span>
                </div>

                <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl shadow-2xs">
                  <span className="text-[11px] text-rose-700 font-semibold block">Data Tidak Lengkap</span>
                  <span className="text-xl font-black text-rose-800 mt-0.5 block">{invalidRows.length}</span>
                  <span className="text-[10px] text-rose-600">Kolom wajib kosong</span>
                </div>
              </div>

              {/* Duplicate Handling Policy */}
              {duplicateRows.length > 0 && (
                <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Terdapat {duplicateRows.length} data kunjungan yang memiliki nama sekolah & tanggal sama di sistem</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <label className={`p-3 rounded-lg border cursor-pointer text-xs transition-all flex items-start gap-2.5 ${
                      duplicateHandling === 'skip'
                        ? 'bg-white border-[#002B66] ring-2 ring-[#002B66]/10 text-slate-900 font-bold'
                        : 'bg-white/60 border-amber-200 text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="duplicateHandling"
                        value="skip"
                        checked={duplicateHandling === 'skip'}
                        onChange={() => setDuplicateHandling('skip')}
                        className="mt-0.5 text-[#002B66]"
                      />
                      <div>
                        <span>Lewati Duplikat</span>
                        <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                          Hanya import {validRows.length} data baru. Data lama tetap aman.
                        </p>
                      </div>
                    </label>

                    <label className={`p-3 rounded-lg border cursor-pointer text-xs transition-all flex items-start gap-2.5 ${
                      duplicateHandling === 'update'
                        ? 'bg-white border-[#002B66] ring-2 ring-[#002B66]/10 text-slate-900 font-bold'
                        : 'bg-white/60 border-amber-200 text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="duplicateHandling"
                        value="update"
                        checked={duplicateHandling === 'update'}
                        onChange={() => setDuplicateHandling('update')}
                        className="mt-0.5 text-[#002B66]"
                      />
                      <div>
                        <span>Perbarui Data Lama</span>
                        <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                          Update data kunjungan jika sekolah & jadwal cocok.
                        </p>
                      </div>
                    </label>

                    <label className={`p-3 rounded-lg border cursor-pointer text-xs transition-all flex items-start gap-2.5 ${
                      duplicateHandling === 'force'
                        ? 'bg-white border-[#002B66] ring-2 ring-[#002B66]/10 text-slate-900 font-bold'
                        : 'bg-white/60 border-amber-200 text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="duplicateHandling"
                        value="force"
                        checked={duplicateHandling === 'force'}
                        onChange={() => setDuplicateHandling('force')}
                        className="mt-0.5 text-[#002B66]"
                      />
                      <div>
                        <span>Tetap Import Semua</span>
                        <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                          Simpan data duplikat sebagai pendaftaran baru (ID baru).
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Preview Table Header Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    Filter Data:
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      previewFilter === 'ALL'
                        ? 'bg-[#002B66] text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Semua ({totalRows})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('valid')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      previewFilter === 'valid'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    Valid ({validRows.length})
                  </button>
                  {duplicateRows.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('duplicate')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        previewFilter === 'duplicate'
                          ? 'bg-amber-600 text-white'
                          : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                      }`}
                    >
                      Duplikat ({duplicateRows.length})
                    </button>
                  )}
                  {invalidRows.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('invalid')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        previewFilter === 'invalid'
                          ? 'bg-rose-600 text-white'
                          : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                      }`}
                    >
                      Tidak Lengkap ({invalidRows.length})
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchPreview}
                    onChange={(e) => setSearchPreview(e.target.value)}
                    placeholder="Cari sekolah, paket..."
                    className="pl-8 pr-3 py-1 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#002B66]/20 focus:border-[#002B66] outline-none w-full sm:w-48"
                  />
                </div>
              </div>

              {/* Interactive Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">No</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Nama Sekolah</th>
                        <th className="py-2.5 px-3">Tgl Kunjungan</th>
                        <th className="py-2.5 px-3">Tempat</th>
                        <th className="py-2.5 px-3">Paket</th>
                        <th className="py-2.5 px-3 text-center">Peserta</th>
                        <th className="py-2.5 px-3">Narahubung</th>
                        <th className="py-2.5 px-3">No Kontak</th>
                        <th className="py-2.5 px-3">Status Bayar</th>
                        <th className="py-2.5 px-3 text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPreview.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-8 text-center text-slate-400 text-xs">
                            Tidak ada data kunjungan yang sesuai dengan filter.
                          </td>
                        </tr>
                      ) : (
                        filteredPreview.map((row) => (
                          <tr 
                            key={row.rowNumber}
                            className={`hover:bg-slate-50 transition-colors ${
                              row.status === 'invalid' 
                                ? 'bg-rose-50/40' 
                                : row.status === 'duplicate' 
                                  ? 'bg-amber-50/40' 
                                  : ''
                            }`}
                          >
                            <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                              {row.rowNumber}
                            </td>

                            <td className="py-2 px-3">
                              {row.status === 'valid' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Valid
                                </span>
                              )}
                              {row.status === 'duplicate' && (
                                <span 
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 cursor-help"
                                  title={row.duplicateReason}
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  Duplikat
                                </span>
                              )}
                              {row.status === 'invalid' && (
                                <span 
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-200 cursor-help"
                                  title={row.errors.join(', ')}
                                >
                                  <XCircle className="w-3 h-3" />
                                  Error
                                </span>
                              )}
                            </td>

                            <td className="py-2 px-3">
                              <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                                {row.data.namaSekolah || <span className="text-rose-500 italic">Nama Sekolah Kosong</span>}
                              </span>
                              {row.data.alamat && (
                                <span className="text-[10px] text-slate-500 block truncate max-w-[180px]">
                                  {row.data.alamat}
                                </span>
                              )}
                            </td>

                            <td className="py-2 px-3 whitespace-nowrap">
                              <span className="font-mono text-slate-700">
                                {row.data.tanggalPelaksanaan || <span className="text-rose-500 italic">-</span>}
                              </span>
                            </td>

                            <td className="py-2 px-3 whitespace-nowrap">
                              <span className="font-medium text-slate-800 text-[11px] block truncate max-w-[130px]" title={row.data.tempatPenyelenggaraan || 'Bale Sawala'}>
                                {row.data.tempatPenyelenggaraan || 'Bale Sawala'}
                              </span>
                            </td>

                            <td className="py-2 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                row.data.skemaPaket === 'Eduventure Lite'
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                  : row.data.skemaPaket === 'Eduventure Tematik'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              }`}>
                                {row.data.skemaPaket}
                              </span>
                            </td>

                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              <span className="font-semibold text-slate-800">{row.data.jumlahPeserta}</span>
                              <span className="text-[10px] text-slate-400 block">+{row.data.jumlahGuru || 0} guru</span>
                            </td>

                            <td className="py-2 px-3">
                              <span className="text-slate-700 font-medium block truncate max-w-[130px]">
                                {row.data.kontakPerson}
                              </span>
                            </td>

                            <td className="py-2 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                              {row.data.nomorKontak}
                            </td>

                            <td className="py-2 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.data.statusBayar === 'Sudah'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {row.data.statusBayar}
                              </span>
                            </td>

                            <td className="py-2 px-3 text-right font-mono font-medium text-slate-800 whitespace-nowrap">
                              {row.data.nominalTransfer > 0 
                                ? `Rp ${row.data.nominalTransfer.toLocaleString('id-ID')}` 
                                : '-'}
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

          {/* Import Result Notification */}
          {importResult && (
            <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
              importResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              {importResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-semibold leading-relaxed">
                {importResult.message}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {parsedRows.length > 0 ? (
              <span>
                Siap mengimport <strong className="text-[#002B66]">{getRunnableRowsCount()}</strong> dari total <strong>{totalRows}</strong> data kunjungan.
              </span>
            ) : (
              <span>Silakan unggah file template Excel atau CSV terlebih dahulu.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Tutup
            </button>

            <button
              type="button"
              id="btn-confirm-import-eduventure"
              onClick={handleExecuteImport}
              disabled={isSubmitting || parsedRows.length === 0 || getRunnableRowsCount() === 0}
              className="px-5 py-2 bg-[#002B66] hover:bg-[#001f4d] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#FDB913]" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#FDB913]" />
                  <span>Proses Import ({getRunnableRowsCount()} Data)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
