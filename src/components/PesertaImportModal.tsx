import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, Upload, Download, CheckCircle2, 
  AlertTriangle, XCircle, ArrowRight, ShieldCheck, 
  X, RefreshCw, Check, Users, Search, 
  Building2, Briefcase, Info, Sparkles, Filter, FileText
} from 'lucide-react';
import { Peserta, Kategori, Program } from '../types';
import { bulkImportPeserta } from '../services/storageService';

interface ParsedPesertaRow {
  rowNumber: number;
  data: Partial<Peserta>;
  status: 'valid' | 'duplicate' | 'invalid';
  errors: string[];
  duplicateReason?: string;
  duplicateField?: string;
  duplicateValue?: string;
  existingPesertaName?: string;
}

interface PesertaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingPeserta: Peserta[];
  kategoriList?: Kategori[];
  programList?: Program[];
  onImportSuccess: (result: { count: number; updatedCount: number; skippedCount: number }) => void;
}

export const PesertaImportModal: React.FC<PesertaImportModalProps> = ({
  isOpen,
  onClose,
  existingPeserta,
  kategoriList = [],
  programList = [],
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedPesertaRow[]>([]);
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'update' | 'force'>('skip');
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'valid' | 'duplicate' | 'invalid'>('ALL');
  const [searchPreview, setSearchPreview] = useState('');
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; count: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Template Downloader: Excel (.xlsx) and CSV (.csv)
  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    const headers = [
      'Nama Lengkap (Wajib)',
      'Gelar Depan',
      'Gelar Belakang',
      'NIK (16 Digit)',
      'NIP / NUPTK',
      'Jenis Kelamin (Laki-laki / Perempuan)',
      'Tempat Lahir',
      'Tanggal Lahir (YYYY-MM-DD)',
      'Email (Wajib)',
      'Nomor HP / WA (Wajib)',
      'Instansi / Perusahaan',
      'Jabatan',
      'Fakultas / Unit Kerja',
      'Pendidikan Terakhir',
      'Provinsi',
      'Kota / Kabupaten',
      'Alamat Domisili',
      'Kategori Program',
      'Nama Program',
      'Angkatan / Batch',
      'Tahun',
      'Tanggal Mulai (YYYY-MM-DD)',
      'Tanggal Selesai (YYYY-MM-DD)',
      'Status Peserta (Terdaftar / Aktif / Lulus / Selesai)',
      'Status Kelulusan (Lulus / Dalam Proses / Belum Evaluasi)',
      'Nomor Sertifikat (Opsional)',
      'Biaya Program (Angka Rp)',
      'Sumber Dana (Beasiswa / Mandiri / CSR)'
    ];

    const sampleRows = [
      [
        'Dr. Hendra Gunawan, S.T., M.Kom.',
        'Dr.',
        'M.Kom.',
        '3204121508890099',
        '198908152019031008',
        'Laki-laki',
        'Bandung',
        '1989-08-15',
        'hendra.gunawan@example.com',
        '081223344556',
        'Universitas Padjadjaran',
        'Lektor Kepala / Peneliti',
        'Fakultas MIPA',
        'Doktor (S3)',
        'Jawa Barat',
        'Kota Bandung',
        'Jl. Dipati Ukur No. 35, Bandung',
        'Kredensial Mikro',
        'Data Science & AI for Healthcare',
        'Batch 1 - 2026',
        '2026',
        '2026-03-01',
        '2026-04-15',
        'Terdaftar',
        'Dalam Proses',
        '',
        '3500000',
        'Beasiswa Instansi'
      ],
      [
        'Rina Kusuma Dewi, S.Farm., Apt.',
        '',
        'S.Farm., Apt.',
        '3273155204940088',
        '',
        'Perempuan',
        'Cimahi',
        '1994-04-12',
        'rina.kusuma@rshs.or.id',
        '081398765432',
        'RSUP Dr. Hasan Sadikin',
        'Apoteker Spesialis Klinis',
        'Instalasi Farmasi RS',
        'Profesi / Spesialis',
        'Jawa Barat',
        'Kota Bandung',
        'Jl. Pasteur No. 38, Bandung',
        'Lembaga Pelatihan Kesehatan',
        'Advanced Clinical Pharmacy Practice',
        'Batch 2 - 2026',
        '2026',
        '2026-03-10',
        '2026-03-25',
        'Aktif',
        'Dalam Proses',
        '',
        '4500000',
        'Mandiri / Pribadi'
      ],
      [
        'Bambang Sugiarto',
        '',
        'S.E., M.M.',
        '3171052107850077',
        '9920150918',
        'Laki-laki',
        'Jakarta',
        '1985-07-21',
        'bambang.s@pertamina.com',
        '081112233445',
        'PT Pertamina (Persero)',
        'Senior Manager Talent Development',
        'Human Capital Directorate',
        'Magister (S2)',
        'DKI Jakarta',
        'Kota Jakarta Pusat',
        'Jl. Medan Merdeka Timur No. 1A',
        'Executive Education',
        'Strategic Business Leadership BUMN',
        'Executive Class 2026',
        '2026',
        '2026-02-01',
        '2026-02-28',
        'Lulus',
        'Lulus',
        'UNPAD/DPNG/EXEC/2026/088',
        '15000000',
        'CSR Korporat'
      ]
    ];

    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();
      const wsData = [headers, ...sampleRows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Auto-fit column widths
      const colWidths = headers.map((h, i) => {
        let maxL = h.length;
        sampleRows.forEach(row => {
          const val = String(row[i] || '');
          if (val.length > maxL) maxL = val.length;
        });
        return { wch: Math.min(Math.max(maxL + 3, 12), 40) };
      });
      ws['!cols'] = colWidths;

      // Add instruction sheet
      const wsInstructionsData = [
        ['PANDUAN FORMAT IMPORT DATA PESERTA PENDIDIKAN NON GELAR UNPAD'],
        [''],
        ['1. Format File', 'Gunakan format Microsoft Excel (.xlsx / .xls) atau CSV (.csv).'],
        ['2. Kolom Wajib', 'Nama Lengkap, Email, dan Nomor HP wajib diisi untuk setiap baris.'],
        ['3. Deteksi Duplikat', 'Sistem otomatis memeriksa bentrok NIK (16 digit), NIP, Email, atau Nomor Registrasi.'],
        ['4. Opsi Duplikat', 'Anda dapat memilih Lewati (Skip), Timpa/Perbarui (Update), atau Tetap Tambah (Force).'],
        ['5. Kategori Program', 'Dapat menggunakan kategori yang terdaftar (Luhung, Kredensial Mikro, PEKERTI/AA, dll.).'],
        ['6. Format Tanggal', 'Gunakan format YYYY-MM-DD (Contoh: 2026-03-15) agar terbaca akurat.'],
        ['7. Biaya Program', 'Masukkan angka murni tanpa titik atau simbol Rp (Contoh: 3500000).'],
        [''],
        ['Direktorat Pendidikan Non Gelar - Universitas Padjadjaran']
      ];
      const wsInst = XLSX.utils.aoa_to_sheet(wsInstructionsData);
      wsInst['!cols'] = [{ wch: 25 }, { wch: 70 }];

      XLSX.utils.book_append_sheet(wb, ws, 'Data_Peserta');
      XLSX.utils.book_append_sheet(wb, wsInst, 'Petunjuk_Pengisian');
      XLSX.writeFile(wb, `Template_Import_Peserta_UNPAD_${new Date().getFullYear()}.xlsx`);
    } else {
      // CSV Download with UTF-8 BOM
      const csvContent = '\uFEFF' + [
        headers.map(h => `"${h}"`).join(','),
        ...sampleRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      ].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Template_Import_Peserta_UNPAD_${new Date().getFullYear()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // File parsing logic supporting .xlsx, .xls, .csv
  const processUploadedFile = (uploadedFile: File) => {
    setFile(uploadedFile);
    setFileName(uploadedFile.name);
    setIsParsing(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let rows: any[] = [];

        if (uploadedFile.name.endsWith('.csv')) {
          const text = typeof data === 'string' ? data : new TextDecoder().decode(data as ArrayBuffer);
          const wb = XLSX.read(text, { type: 'string' });
          const firstSheet = wb.Sheets[wb.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
        } else {
          const wb = XLSX.read(data, { type: 'array' });
          const firstSheet = wb.Sheets[wb.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
        }

        if (rows.length === 0) {
          alert('File kosong atau tidak memuat baris data yang valid.');
          setIsParsing(false);
          return;
        }

        // Map and validate rows
        const parsed: ParsedPesertaRow[] = [];
        const fileNikSet = new Set<string>();
        const fileEmailSet = new Set<string>();

        rows.forEach((row: any, idx: number) => {
          const rowNum = idx + 2; // header is row 1
          const errors: string[] = [];

          // Fuzzy header mapping
          const getVal = (aliases: string[]): string => {
            for (const key of Object.keys(row)) {
              const cleanKey = key.trim().toLowerCase();
              for (const alias of aliases) {
                if (cleanKey === alias.toLowerCase() || cleanKey.includes(alias.toLowerCase())) {
                  return String(row[key] || '').trim();
                }
              }
            }
            return '';
          };

          const namaLengkap = getVal(['Nama Lengkap', 'Nama Peserta', 'namaLengkap', 'Nama']);
          const gelarDepan = getVal(['Gelar Depan', 'gelarDepan']);
          const gelarBelakang = getVal(['Gelar Belakang', 'gelarBelakang']);
          const nik = getVal(['NIK', 'nik', 'KTP', 'No KTP']);
          const nip = getVal(['NIP', 'nip', 'NUPTK']);
          const rawGender = getVal(['Jenis Kelamin', 'Gender', 'Sex', 'L/P']);
          const jenisKelamin = rawGender.toLowerCase().startsWith('p') ? 'Perempuan' : 'Laki-laki';
          const tempatLahir = getVal(['Tempat Lahir', 'tempatLahir']);
          const tanggalLahir = getVal(['Tanggal Lahir', 'tanggalLahir']);
          const email = getVal(['Email', 'Surel', 'E-mail', 'email']);
          const nomorHp = getVal(['Nomor HP', 'No HP', 'Telepon', 'WhatsApp', 'No WA', 'nomorHp']);
          const instansi = getVal(['Instansi', 'Institusi', 'Perusahaan', 'Asal Instansi', 'instansi']);
          const jabatan = getVal(['Jabatan', 'jabatan', 'Posisi']);
          const fakultasUnit = getVal(['Fakultas', 'Unit Kerja', 'fakultasUnit']);
          const pendidikanTerakhir = getVal(['Pendidikan Terakhir', 'Pendidikan', 'pendidikanTerakhir']) || 'Diploma IV (D4) / Sarjana (S1)';
          const provinsi = getVal(['Provinsi', 'provinsi']) || 'Jawa Barat';
          const kotaKabupaten = getVal(['Kota', 'Kabupaten', 'kotaKabupaten']);
          const alamat = getVal(['Alamat', 'alamat']);
          const kategoriProgram = getVal(['Kategori Program', 'Kategori', 'kategoriProgram']) || 'Luhung';
          const namaProgram = getVal(['Nama Program', 'Program', 'namaProgram']) || 'Pendidikan Non Gelar Unpad';
          const angkatanBatch = getVal(['Angkatan', 'Batch', 'angkatanBatch']) || 'Batch 1';
          const rawTahun = getVal(['Tahun', 'tahun']);
          const tahun = parseInt(rawTahun, 10) || new Date().getFullYear();
          const tanggalMulai = getVal(['Tanggal Mulai', 'tanggalMulai']);
          const tanggalSelesai = getVal(['Tanggal Selesai', 'tanggalSelesai']);
          const statusPeserta = (getVal(['Status Peserta', 'statusPeserta']) as any) || 'Terdaftar';
          const statusKelulusan = (getVal(['Status Kelulusan', 'statusKelulusan']) as any) || 'Belum Evaluasi';
          const nomorSertifikat = getVal(['Nomor Sertifikat', 'No Sertifikat', 'nomorSertifikat']);
          const rawBiaya = getVal(['Biaya Program', 'Biaya', 'biayaProgram']);
          const biayaProgram = parseFloat(rawBiaya.replace(/[^0-9.]/g, '')) || 0;
          const sumberDana = getVal(['Sumber Dana', 'sumberDana']) || 'Mandiri / Pribadi';
          const pic = getVal(['PIC', 'pic', 'Koordinator']);
          const keterangan = getVal(['Keterangan', 'keterangan', 'Catatan']) || 'Import Batch Excel/CSV';

          // Validation
          if (!namaLengkap) {
            errors.push('Nama Lengkap wajib diisi.');
          }

          let status: 'valid' | 'duplicate' | 'invalid' = 'valid';
          let duplicateReason: string | undefined;
          let duplicateField: string | undefined;
          let duplicateValue: string | undefined;
          let existingPesertaName: string | undefined;

          // Check duplicate against existing DB
          if (nik) {
            const existingNik = existingPeserta.find(p => p.nik && p.nik.trim() === nik);
            if (existingNik) {
              status = 'duplicate';
              duplicateReason = `NIK (${nik}) sudah terdaftar di sistem`;
              duplicateField = 'NIK';
              duplicateValue = nik;
              existingPesertaName = existingNik.namaLengkap;
            }
          }

          if (status === 'valid' && nip) {
            const existingNip = existingPeserta.find(p => p.nip && p.nip.trim() === nip);
            if (existingNip) {
              status = 'duplicate';
              duplicateReason = `NIP (${nip}) sudah terdaftar di sistem`;
              duplicateField = 'NIP';
              duplicateValue = nip;
              existingPesertaName = existingNip.namaLengkap;
            }
          }

          if (status === 'valid' && email) {
            const existingEmail = existingPeserta.find(p => p.email && p.email.toLowerCase().trim() === email.toLowerCase());
            if (existingEmail) {
              status = 'duplicate';
              duplicateReason = `Email (${email}) sudah terdaftar di sistem`;
              duplicateField = 'Email';
              duplicateValue = email;
              existingPesertaName = existingEmail.namaLengkap;
            }
          }

          // Check internal file duplicates
          if (status === 'valid' && nik && fileNikSet.has(nik)) {
            status = 'duplicate';
            duplicateReason = `NIK (${nik}) duplikat dalam berkas yang sama`;
            duplicateField = 'NIK (Internal File)';
            duplicateValue = nik;
          }
          if (status === 'valid' && email && fileEmailSet.has(email.toLowerCase())) {
            status = 'duplicate';
            duplicateReason = `Email (${email}) duplikat dalam berkas yang sama`;
            duplicateField = 'Email (Internal File)';
            duplicateValue = email;
          }

          if (nik) fileNikSet.add(nik);
          if (email) fileEmailSet.add(email.toLowerCase());

          if (errors.length > 0) {
            status = 'invalid';
          }

          const matchedKat = kategoriList.find(k => k.namaKategori.toLowerCase() === kategoriProgram.toLowerCase());
          const matchedProg = programList.find(p => p.namaProgram.toLowerCase() === namaProgram.toLowerCase());

          parsed.push({
            rowNumber: rowNum,
            status,
            errors,
            duplicateReason,
            duplicateField,
            duplicateValue,
            existingPesertaName,
            data: {
              namaLengkap,
              gelarDepan,
              gelarBelakang,
              nik,
              nip,
              jenisKelamin,
              tempatLahir,
              tanggalLahir,
              email,
              nomorHp,
              instansi,
              jabatan,
              fakultasUnit,
              pendidikanTerakhir,
              provinsi,
              kotaKabupaten,
              alamat,
              idKategori: matchedKat?.idKategori || '',
              kategoriProgram,
              idProgram: matchedProg?.idProgram || '',
              namaProgram,
              angkatanBatch,
              tahun,
              tanggalMulai,
              tanggalSelesai,
              statusPeserta,
              statusKelulusan,
              nomorSertifikat,
              biayaProgram,
              sumberDana,
              pic,
              keterangan
            }
          });
        });

        setParsedRows(parsed);
      } catch (err: any) {
        alert('Gagal membaca file: ' + (err?.message || 'Format tidak didukung.'));
      } finally {
        setIsParsing(false);
      }
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  // Filter preview rows
  const filteredPreviewRows = parsedRows.filter(row => {
    if (previewFilter !== 'ALL' && row.status !== previewFilter) return false;
    if (searchPreview.trim()) {
      const q = searchPreview.toLowerCase();
      const nama = row.data.namaLengkap?.toLowerCase() || '';
      const email = row.data.email?.toLowerCase() || '';
      const instansi = row.data.instansi?.toLowerCase() || '';
      const program = row.data.namaProgram?.toLowerCase() || '';
      return nama.includes(q) || email.includes(q) || instansi.includes(q) || program.includes(q);
    }
    return true;
  });

  const validCount = parsedRows.filter(r => r.status === 'valid').length;
  const duplicateCount = parsedRows.filter(r => r.status === 'duplicate').length;
  const invalidCount = parsedRows.filter(r => r.status === 'invalid').length;

  // Execute Import
  const handleExecuteImport = () => {
    if (parsedRows.length === 0) return;

    let rowsToImport = parsedRows.filter(r => r.status !== 'invalid');

    if (duplicateHandling === 'skip') {
      rowsToImport = rowsToImport.filter(r => r.status !== 'duplicate');
    }

    if (rowsToImport.length === 0) {
      alert('Tidak ada data yang dapat diimport dengan konfigurasi saat ini.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = rowsToImport.map(r => r.data);
      const res = bulkImportPeserta(payload, duplicateHandling);

      setImportResult({
        success: res.success,
        message: res.message,
        count: res.count + res.updatedCount
      });

      onImportSuccess({
        count: res.count,
        updatedCount: res.updatedCount,
        skippedCount: res.skippedCount
      });
    } catch (e: any) {
      alert('Terjadi kesalahan saat memproses import: ' + e?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileName('');
    setParsedRows([]);
    setImportResult(null);
    setSearchPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#002B66] via-[#083a7e] to-[#002B66] p-4 sm:p-5 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-5 h-5 text-[#FDB913]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  Import Data Peserta Pendidikan Non Gelar
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDB913]/20 text-[#FDB913] border border-[#FDB913]/30 uppercase tracking-wider">
                  Excel & CSV
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Unggah berkas spreadsheet untuk menambahkan atau memperbarui peserta secara massal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          {/* Download Template Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-amber-50/70 via-slate-50 to-blue-50/70 rounded-xl border border-amber-200/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FDB913]/20 text-[#002B66] flex items-center justify-center shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Unduh Template Resmi Format SIMPENDIK
                </span>
                <span className="text-[11px] text-slate-500">
                  Gunakan template standar dengan petunjuk kolom dan contoh data agar parsing berjalan 100% akurat.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleDownloadTemplate('xlsx')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#002B66] hover:bg-[#083a7e] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#FDB913]" />
                <span>Template Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadTemplate('csv')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Template CSV (.csv)</span>
              </button>
            </div>
          </div>

          {/* Upload Area / Drag & Drop */}
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#002B66] bg-blue-50/60 scale-[0.99]'
                  : 'border-slate-300 hover:border-[#002B66] bg-slate-50/50 hover:bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    processUploadedFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-[#002B66]/10 text-[#002B66] flex items-center justify-center mx-auto mb-3">
                <Upload className="w-7 h-7 text-[#002B66]" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">
                Tarik & Letakkan berkas Excel atau CSV di sini
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-3">
                Mendukung format Microsoft Excel (<strong>.xlsx</strong>, <strong>.xls</strong>) dan CSV (<strong>.csv</strong>) hingga ribuan data peserta.
              </p>
              <button
                type="button"
                className="px-4 py-2 bg-[#002B66] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#083a7e] transition-colors pointer-events-none"
              >
                Pilih Berkas dari Komputer
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span>{fileName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {parsedRows.length} Baris Terbaca
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Ukuran: {(file.size / 1024).toFixed(1)} KB • Klik ganti berkas untuk memilih file lain
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-rose-600 font-semibold border border-slate-200 rounded-lg hover:bg-white transition-colors cursor-pointer"
              >
                Ganti Berkas
              </button>
            </div>
          )}

          {/* Validation Metric Strip */}
          {parsedRows.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Baris</span>
                  <div className="text-xl font-black text-slate-800 mt-0.5">{parsedRows.length}</div>
                  <span className="text-[10px] text-slate-500">Dalam berkas</span>
                </div>

                <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Data Valid
                  </span>
                  <div className="text-xl font-black text-emerald-700 mt-0.5">{validCount}</div>
                  <span className="text-[10px] text-emerald-600">Siap diimport langsung</span>
                </div>

                <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Data Duplikat
                  </span>
                  <div className="text-xl font-black text-amber-700 mt-0.5">{duplicateCount}</div>
                  <span className="text-[10px] text-amber-600">Bentrok NIK/NIP/Email</span>
                </div>

                <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    Tidak Valid
                  </span>
                  <div className="text-xl font-black text-rose-700 mt-0.5">{invalidCount}</div>
                  <span className="text-[10px] text-rose-600">Kolom wajib kosong</span>
                </div>
              </div>

              {/* Duplicate Handling Selector */}
              {duplicateCount > 0 && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-bold text-amber-900">
                      Terdapat {duplicateCount} data peserta yang terdeteksi sudah terdaftar (Duplikat). Pilih perlakuan:
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                    <label className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-all ${
                      duplicateHandling === 'skip'
                        ? 'bg-white border-amber-400 ring-2 ring-amber-300/40 shadow-xs'
                        : 'bg-amber-100/40 border-amber-200 hover:bg-white'
                    }`}>
                      <input
                        type="radio"
                        name="dupAction"
                        value="skip"
                        checked={duplicateHandling === 'skip'}
                        onChange={() => setDuplicateHandling('skip')}
                        className="mt-0.5 text-amber-600"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">Lewati (Skip)</span>
                        <span className="text-[11px] text-slate-500">Data duplikat tidak diimport, hanya masukkan data baru.</span>
                      </div>
                    </label>

                    <label className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-all ${
                      duplicateHandling === 'update'
                        ? 'bg-white border-amber-400 ring-2 ring-amber-300/40 shadow-xs'
                        : 'bg-amber-100/40 border-amber-200 hover:bg-white'
                    }`}>
                      <input
                        type="radio"
                        name="dupAction"
                        value="update"
                        checked={duplicateHandling === 'update'}
                        onChange={() => setDuplicateHandling('update')}
                        className="mt-0.5 text-amber-600"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">Perbarui (Update)</span>
                        <span className="text-[11px] text-slate-500">Timpa data lama dengan data baru dari file Excel.</span>
                      </div>
                    </label>

                    <label className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-all ${
                      duplicateHandling === 'force'
                        ? 'bg-white border-amber-400 ring-2 ring-amber-300/40 shadow-xs'
                        : 'bg-amber-100/40 border-amber-200 hover:bg-white'
                    }`}>
                      <input
                        type="radio"
                        name="dupAction"
                        value="force"
                        checked={duplicateHandling === 'force'}
                        onChange={() => setDuplicateHandling('force')}
                        className="mt-0.5 text-amber-600"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">Tetap Tambah (Force)</span>
                        <span className="text-[11px] text-slate-500">Masukkan sebagai record baru dengan ID unik terpisah.</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Preview Table Header & Search Filter */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">
                      Pratinjau Data ({filteredPreviewRows.length} dari {parsedRows.length}):
                    </span>
                    <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-[11px] border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setPreviewFilter('ALL')}
                        className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                          previewFilter === 'ALL' ? 'bg-white text-[#002B66] shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Semua ({parsedRows.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewFilter('valid')}
                        className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                          previewFilter === 'valid' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Valid ({validCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewFilter('duplicate')}
                        className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                          previewFilter === 'duplicate' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Duplikat ({duplicateCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewFilter('invalid')}
                        className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                          previewFilter === 'invalid' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Tidak Valid ({invalidCount})
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari dalam pratinjau..."
                      value={searchPreview}
                      onChange={(e) => setSearchPreview(e.target.value)}
                      className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs w-full sm:w-56 focus:outline-none focus:border-[#002B66]"
                    />
                  </div>
                </div>

                {/* Preview Table Container */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#002B66] text-white font-bold sticky top-0 z-10">
                      <tr>
                        <th className="p-2.5 w-12 text-center">Baris</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Nama Peserta</th>
                        <th className="p-2.5">NIK / NIP</th>
                        <th className="p-2.5">Email / HP</th>
                        <th className="p-2.5">Instansi</th>
                        <th className="p-2.5">Program</th>
                        <th className="p-2.5 text-right">Biaya</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredPreviewRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-slate-400 text-xs">
                            Tidak ada baris yang sesuai dengan kriteria filter.
                          </td>
                        </tr>
                      ) : (
                        filteredPreviewRows.map((row) => (
                          <tr key={row.rowNumber} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 text-center font-mono text-slate-400">{row.rowNumber}</td>
                            <td className="p-2.5">
                              {row.status === 'valid' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <Check className="w-3 h-3" /> Valid
                                </span>
                              )}
                              {row.status === 'duplicate' && (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 cursor-help"
                                  title={`${row.duplicateReason}${row.existingPesertaName ? ` (Pemilik: ${row.existingPesertaName})` : ''}`}
                                >
                                  <AlertTriangle className="w-3 h-3" /> Duplikat
                                </span>
                              )}
                              {row.status === 'invalid' && (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 cursor-help"
                                  title={row.errors.join(', ')}
                                >
                                  <X className="w-3 h-3" /> Tidak Valid
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 font-semibold text-slate-800">
                              <div>{row.data.namaLengkap || '-'}</div>
                              {row.data.gelarBelakang && (
                                <div className="text-[10px] text-slate-400 font-normal">
                                  {row.data.gelarDepan} ... {row.data.gelarBelakang}
                                </div>
                              )}
                            </td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-600">
                              <div>{row.data.nik || '-'}</div>
                              <div className="text-[10px] text-slate-400">{row.data.nip || ''}</div>
                            </td>
                            <td className="p-2.5 text-slate-600">
                              <div className="truncate max-w-[150px]" title={row.data.email}>{row.data.email || '-'}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{row.data.nomorHp || '-'}</div>
                            </td>
                            <td className="p-2.5 text-slate-700 truncate max-w-[140px]" title={row.data.instansi}>
                              {row.data.instansi || '-'}
                            </td>
                            <td className="p-2.5 text-slate-700 truncate max-w-[140px]" title={row.data.namaProgram}>
                              <div className="font-medium">{row.data.namaProgram || '-'}</div>
                              <div className="text-[10px] text-slate-400">{row.data.kategoriProgram} • {row.data.tahun}</div>
                            </td>
                            <td className="p-2.5 text-right font-mono text-slate-700">
                              Rp {(row.data.biayaProgram || 0).toLocaleString('id-ID')}
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

          {/* Success Banner */}
          {importResult && (
            <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
              importResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-sm block">Import Peserta Berhasil Diselesaikan!</span>
                <p className="leading-relaxed">{importResult.message}</p>
                <div className="text-[11px] text-slate-500 pt-1">
                  Data telah tersinkronisasi ke Google Spreadsheet SIMPENDIK Unpad.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {parsedRows.length > 0 && (
              <span>
                Akan memproses{' '}
                <strong>
                  {duplicateHandling === 'skip' ? validCount : validCount + duplicateCount}
                </strong>{' '}
                data peserta ke database.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              {importResult ? 'Selesai' : 'Batal'}
            </button>

            {parsedRows.length > 0 && !importResult && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isSubmitting || (duplicateHandling === 'skip' && validCount === 0)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#FDB913]" />
                    <span>Menyimpan ke Database...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-[#FDB913]" />
                    <span>
                      Jalankan Import ({duplicateHandling === 'skip' ? validCount : validCount + duplicateCount} Peserta)
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
