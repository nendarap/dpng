import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, Upload, Download, CheckCircle2, 
  AlertTriangle, XCircle, ArrowRight, ShieldCheck, 
  X, RefreshCw, Check, Users, Search, Briefcase, Info
} from 'lucide-react';
import { Pegawai } from '../types';

interface ParsedPegawaiRow {
  rowNumber: number;
  data: Partial<Pegawai>;
  status: 'valid' | 'duplicate' | 'invalid';
  errors: string[];
  duplicateReason?: string;
}

interface PegawaiImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingPegawai: Pegawai[];
  onImportSuccess: (
    items: Array<Partial<Pegawai>>,
    mode: 'skip' | 'update' | 'force'
  ) => { success: boolean; message: string; count: number; updatedCount?: number; skippedCount?: number };
}

const TEMPLATE_HEADERS = [
  'No',
  'NIP (Wajib)',
  'Nama (Wajib)',
  'Gelar Depan',
  'Gelar Belakang',
  'Kartu Pegawai',
  'Status Kepegawaian',
  'Unit Kerja',
  'Bagian',
  'Bidang Kerja',
  'NIDN/NUPTK',
  'Status Aktif',
  'Keterangan Status Aktif',
  'Tanggal Ditetapkan Status (YYYY-MM-DD)',
  'Tempat Lahir',
  'Tanggal Lahir (YYYY-MM-DD)',
  'Jenis Kelamin',
  'Agama',
  'Golongan Darah',
  'Suku Bangsa',
  'Kewarganegaraan',
  'Status Marital',
  'Alamat',
  'Kecamatan',
  'Kelurahan',
  'RT',
  'RW',
  'Kota',
  'Propinsi',
  'Kode Pos',
  'Telepon',
  'HP (WA)',
  'Email',
  'Lembaga Pendidikan',
  'Jenjang',
  'Jurusan',
  'Tempat',
  'Tahun Lulus',
  'Pangkat',
  'Golongan',
  'Jabatan Struktural',
  'Periode',
  'Unit Kerja Jabatan Struktural',
  'Jabatan Fungsional'
];

export const PegawaiImportModal: React.FC<PegawaiImportModalProps> = ({
  isOpen,
  onClose,
  existingPegawai,
  onImportSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedPegawaiRow[]>([]);
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'update' | 'force'>('skip');
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'valid' | 'duplicate' | 'invalid'>('ALL');
  const [searchPreview, setSearchPreview] = useState('');
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Download official Template Excel / CSV
  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    const sampleRows = [
      [
        1,
        '198106122005011002',
        'Nendar Herdiana',
        'Dr.',
        'M.Kom.',
        'KP-198106122005011002',
        'PNS',
        'Direktorat Pendidikan Non Gelar',
        'Divisi Teknologi Informasi & Digital Learning',
        'Sistem Informasi & Analitika Data',
        '0012068101',
        'Aktif',
        'Bertugas Penuh',
        '2024-01-02',
        'Bandung',
        '1981-06-12',
        'Laki-laki',
        'Islam',
        'O',
        'Sunda',
        'WNI',
        'Kawin',
        'Jl. Raya Bandung-Sumedang Km. 21',
        'Jatinangor',
        'Hegarmanah',
        '03',
        '07',
        'Kabupaten Sumedang',
        'Jawa Barat',
        '45363',
        '022-7796010',
        '081320456789',
        'nendar@unpad.ac.id',
        'Universitas Padjadjaran',
        'S3',
        'Ilmu Komputer',
        'Bandung',
        2018,
        'Pembina Tingkat I',
        'IV/b',
        'Kepala Divisi IT',
        '2024 - 2029',
        'Direktorat Pendidikan Non Gelar',
        'Lektor Kepala'
      ],
      [
        2,
        '198705192023212004',
        'Maya Rosmayanti',
        '',
        'S.E., M.M.',
        'PPPK-198705192023212004',
        'PPPK',
        'Direktorat Pendidikan Non Gelar',
        'Subbagian Keuangan',
        'Verifikasi PNBP',
        '2023058701',
        'Aktif',
        'Bertugas Penuh',
        '2023-06-01',
        'Bandung',
        '1987-05-19',
        'Perempuan',
        'Islam',
        'B',
        'Sunda',
        'WNI',
        'Kawin',
        'Jl. Cikuda No. 17',
        'Jatinangor',
        'Cikeruh',
        '05',
        '02',
        'Kabupaten Sumedang',
        'Jawa Barat',
        '45363',
        '022-7795511',
        '085721345690',
        'maya.rosmayanti@unpad.ac.id',
        'Universitas Padjadjaran',
        'S2',
        'Manajemen Keuangan',
        'Bandung',
        2014,
        'Penata Muda Tingkat I',
        'IX (PPPK)',
        'Bendahara Pengeluaran',
        '2023 - 2028',
        'Direktorat Pendidikan Non Gelar',
        'Analis Keuangan'
      ]
    ];

    if (format === 'xlsx') {
      const wsData = [TEMPLATE_HEADERS, ...sampleRows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template Pegawai');
      ws['!cols'] = TEMPLATE_HEADERS.map(h => ({ wch: Math.max(h.length + 3, 14) }));
      XLSX.writeFile(wb, 'Template_Import_Pegawai_Unpad.xlsx');
    } else {
      const csvLines = [
        TEMPLATE_HEADERS.map(h => `"${h}"`).join(','),
        ...sampleRows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      ];
      const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Template_Import_Pegawai_Unpad.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Parsing File Excel / CSV
  const parseFile = (uploadedFile: File) => {
    setIsParsing(true);
    setFileName(uploadedFile.name);
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawJson || rawJson.length < 2) {
          alert('Berkas kosong atau tidak memiliki baris data.');
          setIsParsing(false);
          return;
        }

        const headers: string[] = rawJson[0].map((h: any) => String(h).trim().toLowerCase());
        const findColIndex = (keywords: string[]) => {
          return headers.findIndex(h => keywords.some(kw => h.includes(kw.toLowerCase())));
        };

        const colMap = {
          no: findColIndex(['no']),
          nip: findColIndex(['nip']),
          nama: findColIndex(['nama']),
          gelarDepan: findColIndex(['gelar depan', 'depan']),
          gelarBelakang: findColIndex(['gelar belakang', 'belakang']),
          kartuPegawai: findColIndex(['kartu pegawai', 'karpeg']),
          statusKepegawaian: findColIndex(['status kepegawaian', 'kepegawaian']),
          unitKerja: findColIndex(['unit kerja', 'fakultas', 'unit']),
          bagian: findColIndex(['bagian', 'divisi']),
          bidangKerja: findColIndex(['bidang kerja', 'bidang']),
          nidnNuptk: findColIndex(['nidn', 'nuptk']),
          statusAktif: findColIndex(['status aktif']),
          keteranganStatusAktif: findColIndex(['keterangan status']),
          tanggalDitetapkanStatus: findColIndex(['tanggal ditetapkan']),
          tempatLahir: findColIndex(['tempat lahir']),
          tanggalLahir: findColIndex(['tanggal lahir']),
          jenisKelamin: findColIndex(['jenis kelamin', 'gender', 'jk']),
          agama: findColIndex(['agama']),
          golonganDarah: findColIndex(['golongan darah', 'goldar']),
          sukuBangsa: findColIndex(['suku']),
          kewarganegaraan: findColIndex(['kewarganegaraan', 'wn']),
          statusMarital: findColIndex(['status marital', 'marital', 'pernikahan']),
          alamat: findColIndex(['alamat']),
          kecamatan: findColIndex(['kecamatan']),
          kelurahan: findColIndex(['kelurahan', 'desa']),
          rt: findColIndex(['rt']),
          rw: findColIndex(['rw']),
          kota: findColIndex(['kota', 'kabupaten']),
          propinsi: findColIndex(['propinsi', 'provinsi']),
          kodePos: findColIndex(['kode pos', 'pos']),
          telepon: findColIndex(['telepon', 'telp']),
          hp: findColIndex(['hp', 'whatsapp', 'wa', 'ponsel']),
          email: findColIndex(['email']),
          lembagaPendidikan: findColIndex(['lembaga pendidikan', 'universitas', 'kampus']),
          jenjang: findColIndex(['jenjang', 'pendidikan']),
          jurusan: findColIndex(['jurusan', 'prodi']),
          tempat: findColIndex(['tempat']),
          tahunLulus: findColIndex(['tahun lulus', 'lulus']),
          pangkat: findColIndex(['pangkat']),
          golongan: findColIndex(['golongan', 'gol']),
          jabatanStruktural: findColIndex(['jabatan struktural', 'struktural']),
          periode: findColIndex(['periode']),
          unitKerjaJabatanStruktural: findColIndex(['unit kerja jabatan struktural']),
          jabatanFungsional: findColIndex(['jabatan fungsional', 'fungsional'])
        };

        const existingNipSet = new Set(existingPegawai.map(p => p.nip.trim().toLowerCase()));
        const fileNipSet = new Set<string>();

        const parsedRowsList: ParsedPegawaiRow[] = [];

        for (let r = 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!row || row.every((c: any) => String(c).trim() === '')) continue;

          const getVal = (colIdx: number) => (colIdx >= 0 && row[colIdx] !== undefined ? String(row[colIdx]).trim() : '');

          const nip = getVal(colMap.nip);
          const nama = getVal(colMap.nama);
          const errors: string[] = [];
          let duplicateReason: string | undefined;

          if (!nama) errors.push('Nama wajib diisi');
          if (!nip) errors.push('NIP wajib diisi');

          const normNip = nip.toLowerCase();
          let status: 'valid' | 'duplicate' | 'invalid' = 'valid';

          if (errors.length > 0) {
            status = 'invalid';
          } else if (fileNipSet.has(normNip)) {
            status = 'duplicate';
            duplicateReason = `Duplikat di dalam file ini (NIP: ${nip})`;
          } else if (existingNipSet.has(normNip)) {
            status = 'duplicate';
            duplicateReason = `NIP ${nip} sudah terdaftar di database`;
          }

          if (normNip) fileNipSet.add(normNip);

          const itemData: Partial<Pegawai> = {
            nip,
            nama,
            gelarDepan: getVal(colMap.gelarDepan),
            gelarBelakang: getVal(colMap.gelarBelakang),
            kartuPegawai: getVal(colMap.kartuPegawai),
            statusKepegawaian: getVal(colMap.statusKepegawaian) || 'PNS',
            unitKerja: getVal(colMap.unitKerja) || 'Direktorat Pendidikan Non Gelar',
            bagian: getVal(colMap.bagian),
            bidangKerja: getVal(colMap.bidangKerja),
            nidnNuptk: getVal(colMap.nidnNuptk),
            statusAktif: getVal(colMap.statusAktif) || 'Aktif',
            keteranganStatusAktif: getVal(colMap.keteranganStatusAktif),
            tanggalDitetapkanStatus: getVal(colMap.tanggalDitetapkanStatus),
            tempatLahir: getVal(colMap.tempatLahir),
            tanggalLahir: getVal(colMap.tanggalLahir),
            jenisKelamin: getVal(colMap.jenisKelamin) || 'Laki-laki',
            agama: getVal(colMap.agama) || 'Islam',
            golonganDarah: getVal(colMap.golonganDarah),
            sukuBangsa: getVal(colMap.sukuBangsa),
            kewarganegaraan: getVal(colMap.kewarganegaraan) || 'WNI',
            statusMarital: getVal(colMap.statusMarital) || 'Kawin',
            alamat: getVal(colMap.alamat),
            kecamatan: getVal(colMap.kecamatan),
            kelurahan: getVal(colMap.kelurahan),
            rt: getVal(colMap.rt),
            rw: getVal(colMap.rw),
            kota: getVal(colMap.kota),
            propinsi: getVal(colMap.propinsi) || 'Jawa Barat',
            kodePos: getVal(colMap.kodePos),
            telepon: getVal(colMap.telepon),
            hp: getVal(colMap.hp),
            email: getVal(colMap.email),
            lembagaPendidikan: getVal(colMap.lembagaPendidikan),
            jenjang: getVal(colMap.jenjang) || 'S1',
            jurusan: getVal(colMap.jurusan),
            tempat: getVal(colMap.tempat),
            tahunLulus: getVal(colMap.tahunLulus),
            pangkat: getVal(colMap.pangkat),
            golongan: getVal(colMap.golongan),
            jabatanStruktural: getVal(colMap.jabatanStruktural),
            periode: getVal(colMap.periode),
            unitKerjaJabatanStruktural: getVal(colMap.unitKerjaJabatanStruktural),
            jabatanFungsional: getVal(colMap.jabatanFungsional)
          };

          parsedRowsList.push({
            rowNumber: r + 1,
            data: itemData,
            status,
            errors,
            duplicateReason
          } as any);
        }

        setParsedRows(parsedRowsList as any);
      } catch (err: any) {
        alert('Gagal membaca berkas Excel/CSV: ' + err.message);
      } finally {
        setIsParsing(false);
      }
    };

    reader.readAsBinaryString(uploadedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      parseFile(e.dataTransfer.files[0]);
    }
  };

  const validCount = parsedRows.filter(r => r.status === 'valid').length;
  const duplicateCount = parsedRows.filter(r => r.status === 'duplicate').length;
  const invalidCount = parsedRows.filter(r => r.status === 'invalid').length;

  const filteredPreview = parsedRows.filter(row => {
    if (previewFilter !== 'ALL' && row.status !== previewFilter) return false;
    if (searchPreview.trim()) {
      const q = searchPreview.toLowerCase();
      const match =
        (row.data.nama && row.data.nama.toLowerCase().includes(q)) ||
        (row.data.nip && row.data.nip.toLowerCase().includes(q)) ||
        (row.data.unitKerja && row.data.unitKerja.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleExecuteImport = () => {
    const importableRows = parsedRows.filter(r => {
      if (r.status === 'invalid') return false;
      if (r.status === 'duplicate' && duplicateHandling === 'skip') return false;
      return true;
    });

    if (importableRows.length === 0) {
      alert('Tidak ada baris data valid yang dapat diimpor.');
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsToImport = importableRows.map(r => r.data);
      const res = onImportSuccess(itemsToImport, duplicateHandling);
      setImportResult({
        success: res.success,
        message: res.message || `Berhasil mengimpor ${res.count} data pegawai!`
      });
    } catch (e: any) {
      setImportResult({
        success: false,
        message: 'Gagal memproses impor: ' + e.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#002B66] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FDB913] text-[#002B66] flex items-center justify-center font-bold">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Import Data Pegawai Unpad</h3>
              <p className="text-[11px] text-amber-200">Unggah berkas spreadsheet Excel (.xlsx, .xls) atau CSV (.csv)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Success Result View */}
          {importResult ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-base font-bold text-slate-800">Proses Impor Selesai</h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">{importResult.message}</p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-[#002B66] text-white rounded-xl font-bold hover:bg-[#083a7e]"
              >
                Tutup & Kembali ke Data Pegawai
              </button>
            </div>
          ) : (
            <>
              {/* Template Download Area */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-[#002B66] shrink-0" />
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">Download Template Resmi Pegawai Unpad</h5>
                    <p className="text-[11px] text-slate-500">Berisi 44 header kolom lengkap beserta contoh data</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadTemplate('xlsx')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" /> Template Excel
                  </button>
                  <button
                    onClick={() => handleDownloadTemplate('csv')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" /> Template CSV
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              {parsedRows.length === 0 ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
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
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        parseFile(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-[#002B66]/10 text-[#002B66] flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 mb-1">
                    {isParsing ? 'Menganalisis berkas spreadsheet...' : 'Klik atau Tarik Berkas ke Sini'}
                  </h4>
                  <p className="text-slate-500 text-[11px] mb-2">Mendukung berkas Microsoft Excel (.xlsx, .xls) dan CSV (.csv)</p>
                  <span className="inline-block px-3 py-1 rounded-full bg-slate-200 text-slate-700 font-semibold text-[10px]">
                    Maks. 50 MB
                  </span>
                </div>
              ) : (
                /* Preview & Validation Results */
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-800">{fileName}</span>
                      <p className="text-slate-500 text-[11px]">Total {parsedRows.length} baris data ditemukan</p>
                    </div>
                    <button
                      onClick={() => { setParsedRows([]); setFile(null); }}
                      className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold text-[11px]"
                    >
                      Ganti Berkas
                    </button>
                  </div>

                  {/* Badges Count */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl border bg-slate-50 border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Total Baris</span>
                      <strong className="text-base text-slate-800">{parsedRows.length}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl border bg-emerald-50 border-emerald-200">
                      <span className="text-emerald-600 block text-[10px]">Valid</span>
                      <strong className="text-base text-emerald-700">{validCount}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl border bg-amber-50 border-amber-200">
                      <span className="text-amber-600 block text-[10px]">Duplikat</span>
                      <strong className="text-base text-amber-700">{duplicateCount}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl border bg-rose-50 border-rose-200">
                      <span className="text-rose-600 block text-[10px]">Tidak Valid</span>
                      <strong className="text-base text-rose-700">{invalidCount}</strong>
                    </div>
                  </div>

                  {/* Duplicate Handling Control */}
                  {duplicateCount > 0 && (
                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-amber-900 font-semibold">Tindakan jika ditemukan NIP duplikat:</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                          <input
                            type="radio"
                            name="dupHandle"
                            value="skip"
                            checked={duplicateHandling === 'skip'}
                            onChange={() => setDuplicateHandling('skip')}
                            className="text-[#002B66]"
                          />
                          <span>Lewati (Skip)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                          <input
                            type="radio"
                            name="dupHandle"
                            value="update"
                            checked={duplicateHandling === 'update'}
                            onChange={() => setDuplicateHandling('update')}
                            className="text-[#002B66]"
                          />
                          <span>Perbarui (Update)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                          <input
                            type="radio"
                            name="dupHandle"
                            value="force"
                            checked={duplicateHandling === 'force'}
                            onChange={() => setDuplicateHandling('force')}
                            className="text-[#002B66]"
                          />
                          <span>Tetap Tambah</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="p-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        {['ALL', 'valid', 'duplicate', 'invalid'].map(st => (
                          <button
                            key={st}
                            onClick={() => setPreviewFilter(st as any)}
                            className={`px-2.5 py-1 rounded-lg font-semibold text-[10px] ${
                              previewFilter === st ? 'bg-[#002B66] text-white' : 'bg-white text-slate-600 border'
                            }`}
                          >
                            {st === 'ALL' ? 'Semua' : st === 'valid' ? 'Valid' : st === 'duplicate' ? 'Duplikat' : 'Error'}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Cari dalam pratinjau..."
                        value={searchPreview}
                        onChange={e => setSearchPreview(e.target.value)}
                        className="px-2.5 py-1 text-xs border rounded-lg bg-white"
                      />
                    </div>

                    <div className="max-h-56 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                          <tr>
                            <th className="p-2 w-10 text-center">Baris</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">NIP</th>
                            <th className="p-2">Nama</th>
                            <th className="p-2">Status Kepegawaian</th>
                            <th className="p-2">Unit Kerja</th>
                            <th className="p-2">Catatan Validasi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredPreview.map((row) => (
                            <tr key={row.rowNumber} className="hover:bg-slate-50">
                              <td className="p-2 text-center text-slate-400 font-mono text-[10px]">{row.rowNumber}</td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  row.status === 'valid' ? 'bg-emerald-100 text-emerald-800' :
                                  row.status === 'duplicate' ? 'bg-amber-100 text-amber-800' :
                                  'bg-rose-100 text-rose-800'
                                }`}>
                                  {row.status === 'valid' ? 'Valid' : row.status === 'duplicate' ? 'Duplikat' : 'Error'}
                                </span>
                              </td>
                              <td className="p-2 font-mono font-bold text-[#002B66]">{row.data.nip || '-'}</td>
                              <td className="p-2 font-semibold text-slate-800">{row.data.nama || '-'}</td>
                              <td className="p-2 text-slate-600">{row.data.statusKepegawaian || '-'}</td>
                              <td className="p-2 text-slate-600 truncate max-w-[150px]">{row.data.unitKerja || '-'}</td>
                              <td className="p-2 text-[10px] text-slate-500">
                                {row.errors.length > 0 ? (
                                  <span className="text-rose-600 font-medium">{row.errors.join(', ')}</span>
                                ) : row.duplicateReason ? (
                                  <span className="text-amber-700">{row.duplicateReason}</span>
                                ) : (
                                  <span className="text-emerald-600 font-medium">Siap diimpor</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!importResult && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
            >
              Batal
            </button>
            {parsedRows.length > 0 && (
              <button
                disabled={isSubmitting || validCount + (duplicateHandling !== 'skip' ? duplicateCount : 0) === 0}
                onClick={handleExecuteImport}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#002B66] hover:bg-[#083a7e] disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-[#FDB913]" />
                    <span>
                      Impor {validCount + (duplicateHandling !== 'skip' ? duplicateCount : 0)} Data Pegawai
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
