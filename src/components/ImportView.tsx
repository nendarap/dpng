import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, Upload, Download, CheckCircle2, 
  AlertTriangle, XCircle, ArrowRight, ShieldAlert,
  Users, Briefcase, RefreshCw, FileText
} from 'lucide-react';
import { Peserta, Kategori, Program, Pegawai } from '../types';
import { 
  checkDuplicate, generateNextIdPeserta, 
  getPegawai, bulkImportPegawai 
} from '../services/storageService';

interface ImportViewProps {
  kategoriList: Kategori[];
  programList: Program[];
  pegawaiList?: Pegawai[];
  onImportDone: (newPeserta: Peserta[]) => void;
  onImportPegawaiDone?: (
    items: Array<Partial<Pegawai>>,
    mode: 'skip' | 'update' | 'force'
  ) => { success: boolean; message: string; count: number; updatedCount?: number; skippedCount?: number };
}

type ImportModule = 'peserta' | 'pegawai';

export const ImportView: React.FC<ImportViewProps> = ({
  kategoriList,
  programList,
  pegawaiList = [],
  onImportDone,
  onImportPegawaiDone,
}) => {
  const [activeModule, setActiveModule] = useState<ImportModule>('peserta');
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    valid: number;
    duplicate: number;
    invalid: number;
    duplicateDetails: Array<{ row: number; field: string; value: string; name: string }>;
  } | null>(null);

  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'update' | 'force'>('skip');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Switch tab & reset state
  const handleSwitchModule = (mod: ImportModule) => {
    setActiveModule(mod);
    setFile(null);
    setParsedRows([]);
    setPreviewData([]);
    setImportSummary(null);
    setSuccessMessage(null);
  };

  // Template Downloader for Peserta
  const downloadPesertaTemplate = (format: 'xlsx' | 'csv') => {
    const headers = [
      'Nama Lengkap', 'Gelar Depan', 'Gelar Belakang', 'NIK', 'NIP',
      'Jenis Kelamin', 'Tempat Lahir', 'Tanggal Lahir', 'Email', 'No HP',
      'Alamat', 'Provinsi', 'Kota Kabupaten', 'Instansi', 'Jabatan',
      'Fakultas Unit', 'Pendidikan Terakhir', 'Kategori Program', 'Nama Program',
      'Angkatan Batch', 'Tahun', 'Tanggal Mulai', 'Tanggal Selesai',
      'Status Peserta', 'Status Kelulusan', 'Nomor Sertifikat', 'Biaya Program', 'Sumber Dana'
    ];

    const sampleRow = [
      'Ahmad Syauqi', 'Dr.', 'M.T.', '3204281985010099', '198501192010121005',
      'Laki-laki', 'Bandung', '1985-01-19', 'ahmad.syauqi@unpad.ac.id', '081234567890',
      'Jl. Raya Jatinangor No. 21', 'Jawa Barat', 'Kab. Sumedang', 'Universitas Padjadjaran', 'Dosen Lektor',
      'Fakultas Teknik Geologi', 'Doktor (S3)', 'Luhung', 'Pelatihan Penulisan Jurnal Scopus',
      'Batch 1', '2026', '2026-03-01', '2026-03-15',
      'Terdaftar', 'Belum Evaluasi', '', '2500000', 'Institusi / Instansi Asal'
    ];

    if (format === 'xlsx') {
      const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template Peserta');
      XLSX.writeFile(wb, 'Template_Import_Peserta_UNPAD.xlsx');
    } else {
      const content = 'data:text/csv;charset=utf-8,\uFEFF' + [
        headers.join(','),
        sampleRow.map(v => `"${v}"`).join(',')
      ].join('\n');
      const encodedUri = encodeURI(content);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'Template_Import_Peserta_UNPAD.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Template Downloader for Pegawai (44 fields)
  const downloadPegawaiTemplate = (format: 'xlsx' | 'csv') => {
    const headers = [
      'No', 'NIP', 'Nama', 'Kartu Pegawai', 'Status Kepegawaian', 'Unit Kerja', 
      'Bagian', 'Bidang Kerja', 'NIDN/NUPTK', 'Status Aktif', 'Keterangan Status Aktif', 
      'Tanggal Ditetapkan Status', 'Tempat Lahir', 'Tanggal Lahir', 'Jenis Kelamin', 
      'Agama', 'Golongan Darah', 'Suku Bangsa', 'Kewarganegaraan', 'Status Marital', 
      'Alamat', 'Kecamatan', 'Kelurahan', 'RT', 'RW', 'Kota', 'Propinsi', 'Kode Pos', 
      'Telepon', 'HP', 'Email', 'Lembaga Pendidikan', 'Jenjang', 'Jurusan', 'Tempat', 
      'Tahun Lulus', 'Gelar Depan', 'Gelar Belakang', 'Pangkat', 'Golongan', 
      'Jabatan Struktural', 'Periode', 'Unit Kerja Jabatan Struktural', 'Jabatan Fungsional'
    ];

    const sampleRow1 = [
      1, '198106122005011002', 'Nendar Herdiana', 'KP-198106122005011002', 'PNS',
      'Direktorat Pendidikan Non Gelar', 'Divisi Teknologi Informasi & Digital Learning', 'Sistem Informasi & Analitika Data',
      '0012068101', 'Aktif', 'Bertugas Penuh', '2024-01-02', 'Bandung', '1981-06-12', 'Laki-laki',
      'Islam', 'O', 'Sunda', 'WNI', 'Kawin', 'Jl. Raya Bandung-Sumedang Km. 21', 'Jatinangor', 'Hegarmanah',
      '03', '07', 'Kabupaten Sumedang', 'Jawa Barat', '45363', '022-7796010', '081320456789', 'nendar@unpad.ac.id',
      'Universitas Padjadjaran', 'S3', 'Ilmu Komputer', 'Bandung', 2018, 'Dr.', 'M.Kom.',
      'Pembina Tingkat I', 'IV/b', 'Kepala Divisi IT', '2024 - 2029', 'Direktorat Pendidikan Non Gelar', 'Lektor Kepala'
    ];

    const sampleRow2 = [
      2, '198705192023212004', 'Maya Rosmayanti', 'KP-198705192023212004', 'PPPK',
      'Fakultas Ekonomi dan Bisnis', 'Departemen Manajemen', 'Manajemen Keuangan',
      '0019058702', 'Aktif', 'Aktif Mengajar', '2023-04-01', 'Sumedang', '1987-05-19', 'Perempuan',
      'Islam', 'A', 'Sunda', 'WNI', 'Kawin', 'Jl. Dipati Ukur No. 35', 'Coblong', 'Lebakgede',
      '02', '04', 'Kota Bandung', 'Jawa Barat', '40132', '022-2503271', '081223344556', 'maya.rosmayanti@unpad.ac.id',
      'Universitas Gadjah Mada', 'S2', 'Manajemen Keuangan', 'Yogyakarta', 2014, '', 'S.E., M.M.',
      'Penata Muda Tingkat I', 'III/b', '', '', '', 'Lektor'
    ];

    if (format === 'xlsx') {
      const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow1, sampleRow2]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Master Data Pegawai');
      XLSX.writeFile(wb, 'Template_Master_Data_Pegawai_UNPAD.xlsx');
    } else {
      const content = 'data:text/csv;charset=utf-8,\uFEFF' + [
        headers.join(','),
        sampleRow1.map(v => `"${v}"`).join(','),
        sampleRow2.map(v => `"${v}"`).join(',')
      ].join('\n');
      const encodedUri = encodeURI(content);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'Template_Master_Data_Pegawai_UNPAD.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Universal File Upload & Parsing using XLSX for both XLSX and CSV
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setSuccessMessage(null);
    setIsProcessing(true);

    try {
      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (rows.length < 2) {
        alert('File tidak memiliki data baris yang cukup (minimal 1 baris header dan 1 baris data).');
        setIsProcessing(false);
        return;
      }

      const headers = rows[0].map((h: any) => String(h || '').trim());
      const dataRows: any[] = [];
      const duplicateDetails: any[] = [];
      let validCount = 0;
      let dupCount = 0;
      let invalidCount = 0;

      if (activeModule === 'peserta') {
        // Module Peserta
        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i];
          if (!cols || cols.every((c: any) => String(c).trim() === '')) continue;

          const rowData: Record<string, any> = {};
          headers.forEach((h, idx) => {
            rowData[h] = cols[idx] !== undefined ? String(cols[idx]).trim() : '';
          });

          const nama = rowData['Nama Lengkap'] || rowData['namaLengkap'] || cols[0] || '';
          const email = rowData['Email'] || rowData['email'] || cols[8] || '';
          const nik = rowData['NIK'] || rowData['nik'] || cols[3] || '';
          const nip = rowData['NIP'] || rowData['nip'] || cols[4] || '';
          const kategori = rowData['Kategori Program'] || rowData['kategoriProgram'] || cols[17] || 'Luhung';
          const program = rowData['Nama Program'] || rowData['namaProgram'] || cols[18] || 'Program Mandiri Unpad';
          const tahun = Number(rowData['Tahun'] || cols[20]) || new Date().getFullYear();

          if (!nama || !email) {
            invalidCount++;
            continue;
          }

          const dup = checkDuplicate({ namaLengkap: nama, email, nik, nip });
          if (dup.isDuplicate) {
            dupCount++;
            duplicateDetails.push({
              row: i + 1,
              field: dup.field || 'Email',
              value: dup.value || email,
              name: nama,
            });
          } else {
            validCount++;
          }

          dataRows.push({
            namaLengkap: nama,
            gelarDepan: rowData['Gelar Depan'] || cols[1] || '',
            gelarBelakang: rowData['Gelar Belakang'] || cols[2] || '',
            nik,
            nip,
            jenisKelamin: rowData['Jenis Kelamin'] || cols[5] || 'Laki-laki',
            tempatLahir: rowData['Tempat Lahir'] || cols[6] || '',
            tanggalLahir: rowData['Tanggal Lahir'] || cols[7] || '',
            email,
            nomorHp: rowData['No HP'] || rowData['Nomor HP'] || cols[9] || '',
            alamat: rowData['Alamat'] || cols[10] || '',
            provinsi: rowData['Provinsi'] || cols[11] || 'Jawa Barat',
            kotaKabupaten: rowData['Kota Kabupaten'] || cols[12] || '',
            instansi: rowData['Instansi'] || cols[13] || '',
            jabatan: rowData['Jabatan'] || cols[14] || '',
            fakultasUnit: rowData['Fakultas Unit'] || cols[15] || '',
            pendidikanTerakhir: rowData['Pendidikan Terakhir'] || cols[16] || 'Diploma IV (D4) / Sarjana (S1)',
            kategoriProgram: kategori,
            namaProgram: program,
            angkatanBatch: rowData['Angkatan Batch'] || cols[19] || 'Batch 1',
            tahun,
            tanggalMulai: rowData['Tanggal Mulai'] || cols[21] || '',
            tanggalSelesai: rowData['Tanggal Selesai'] || cols[22] || '',
            statusPeserta: rowData['Status Peserta'] || cols[23] || 'Terdaftar',
            statusKelulusan: rowData['Status Kelulusan'] || cols[24] || 'Belum Evaluasi',
            nomorSertifikat: rowData['Nomor Sertifikat'] || cols[25] || '',
            biayaProgram: Number(rowData['Biaya Program'] || cols[26]) || 0,
            sumberDana: rowData['Sumber Dana'] || cols[27] || 'Mandiri / Pribadi',
            isDuplicate: dup.isDuplicate,
            duplicateInfo: dup
          });
        }
      } else {
        // Module Pegawai (44 fields)
        const currentPegawaiList = pegawaiList.length > 0 ? pegawaiList : getPegawai();

        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i];
          if (!cols || cols.every((c: any) => String(c).trim() === '')) continue;

          const rowData: Record<string, any> = {};
          headers.forEach((h, idx) => {
            const cleanKey = h.toLowerCase().replace(/[^a-z0-9]/g, '');
            rowData[cleanKey] = cols[idx] !== undefined ? String(cols[idx]).trim() : '';
          });

          // Match variations of column names
          const nip = rowData['nip'] || rowData['nipwajib'] || cols[1] || '';
          const nama = rowData['nama'] || rowData['namalengkap'] || rowData['namawajib'] || cols[2] || '';

          if (!nama || !nama.trim()) {
            invalidCount++;
            continue;
          }

          // Check duplicate in Pegawai list by NIP
          const isDup = nip && nip !== '-' 
            ? currentPegawaiList.some(p => p.nip && p.nip.trim() === nip.trim()) 
            : false;

          if (isDup) {
            dupCount++;
            duplicateDetails.push({
              row: i + 1,
              field: 'NIP',
              value: nip,
              name: nama
            });
          } else {
            validCount++;
          }

          const pegawaiObj: Partial<Pegawai> = {
            no: Number(cols[0]) || i,
            nip: nip || '-',
            nama: nama.trim(),
            kartuPegawai: rowData['kartupegawai'] || cols[3] || '',
            statusKepegawaian: rowData['statuskepegawaian'] || cols[4] || 'PNS',
            unitKerja: rowData['unitkerja'] || cols[5] || 'Direktorat Pendidikan Non Gelar',
            bagian: rowData['bagian'] || cols[6] || '',
            bidangKerja: rowData['bidangkerja'] || cols[7] || '',
            nidnNuptk: rowData['nidnnuptk'] || rowData['nidn'] || cols[8] || '',
            statusAktif: rowData['statusaktif'] || cols[9] || 'Aktif',
            keteranganStatusAktif: rowData['keteranganstatusaktif'] || cols[10] || '',
            tanggalDitetapkanStatus: rowData['tanggalditetapkanstatus'] || cols[11] || '',
            tempatLahir: rowData['tempatlahir'] || cols[12] || '',
            tanggalLahir: rowData['tanggallahir'] || cols[13] || '',
            jenisKelamin: rowData['jeniskelamin'] || cols[14] || 'Laki-laki',
            agama: rowData['agama'] || cols[15] || 'Islam',
            golonganDarah: rowData['golongandarah'] || cols[16] || '',
            sukuBangsa: rowData['sukubangsa'] || cols[17] || '',
            kewarganegaraan: rowData['kewarganegaraan'] || cols[18] || 'WNI',
            statusMarital: rowData['statusmarital'] || cols[19] || 'Kawin',
            alamat: rowData['alamat'] || cols[20] || '',
            kecamatan: rowData['kecamatan'] || cols[21] || '',
            kelurahan: rowData['kelurahan'] || cols[22] || '',
            rt: rowData['rt'] || cols[23] || '',
            rw: rowData['rw'] || cols[24] || '',
            kota: rowData['kota'] || cols[25] || '',
            propinsi: rowData['propinsi'] || rowData['provinsi'] || cols[26] || 'Jawa Barat',
            kodePos: rowData['kodepos'] || cols[27] || '',
            telepon: rowData['telepon'] || cols[28] || '',
            hp: rowData['hp'] || rowData['nomorhp'] || cols[29] || '',
            email: rowData['email'] || cols[30] || '',
            lembagaPendidikan: rowData['lembagapendidikan'] || cols[31] || '',
            jenjang: rowData['jenjang'] || cols[32] || 'S1',
            jurusan: rowData['jurusan'] || cols[33] || '',
            tempat: rowData['tempat'] || cols[34] || '',
            tahunLulus: Number(rowData['tahunlulus'] || cols[35]) || new Date().getFullYear(),
            gelarDepan: rowData['gelardepan'] || cols[36] || '',
            gelarBelakang: rowData['gelarbelakang'] || cols[37] || '',
            pangkat: rowData['pangkat'] || cols[38] || '',
            golongan: rowData['golongan'] || cols[39] || '',
            jabatanStruktural: rowData['jabatanstruktural'] || cols[40] || '',
            periode: rowData['periode'] || cols[41] || '',
            unitKerjaJabatanStruktural: rowData['unitkerjajabatanstruktural'] || cols[42] || '',
            jabatanFungsional: rowData['jabatanfungsional'] || cols[43] || ''
          };

          dataRows.push({
            ...pegawaiObj,
            isDuplicate: isDup,
            duplicateInfo: isDup ? { field: 'NIP', value: nip } : null
          });
        }
      }

      setParsedRows(dataRows);
      setPreviewData(dataRows.slice(0, 10));
      setImportSummary({
        total: dataRows.length,
        valid: validCount,
        duplicate: dupCount,
        invalid: invalidCount,
        duplicateDetails,
      });
    } catch (err) {
      console.error('Error parsing file:', err);
      alert('Gagal membaca file. Pastikan format file Excel (.xlsx/.xls) atau CSV (.csv) sesuai dengan template.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Import
  const handleExecuteImport = () => {
    if (parsedRows.length === 0) return;

    if (activeModule === 'peserta') {
      let rowsToInsert = [...parsedRows];
      if (duplicateHandling === 'skip') {
        rowsToInsert = rowsToInsert.filter(r => !r.isDuplicate);
      }

      if (rowsToInsert.length === 0) {
        alert('Tidak ada data baru yang dapat diimport karena semua data terdeteksi duplikat dan opsi "Lewati" aktif.');
        return;
      }

      const currentYear = new Date().getFullYear();
      const finalPesertaList: Peserta[] = rowsToInsert.map((item, idx) => {
        const yr = item.tahun || currentYear;
        const genId = generateNextIdPeserta(yr);
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

        return {
          id: genId,
          nomorRegistrasi: `REG-${yr}-${genId.split('-')[2] || '000' + idx}`,
          namaLengkap: item.namaLengkap,
          gelarDepan: item.gelarDepan || '',
          gelarBelakang: item.gelarBelakang || '',
          nik: item.nik || '',
          nip: item.nip || '',
          jenisKelamin: item.jenisKelamin || 'Laki-laki',
          tempatLahir: item.tempatLahir || '',
          tanggalLahir: item.tanggalLahir || '',
          email: item.email,
          nomorHp: item.nomorHp || '',
          alamat: item.alamat || '',
          provinsi: item.provinsi || 'Jawa Barat',
          kotaKabupaten: item.kotaKabupaten || '',
          instansi: item.instansi || '',
          jabatan: item.jabatan || '',
          fakultasUnit: item.fakultasUnit || '',
          pendidikanTerakhir: item.pendidikanTerakhir || 'Diploma IV (D4) / Sarjana (S1)',
          idKategori: kategoriList.find(k => k.namaKategori === item.kategoriProgram)?.idKategori || 'KAT-01',
          kategoriProgram: item.kategoriProgram || 'Luhung',
          idProgram: programList.find(p => p.namaProgram === item.namaProgram)?.idProgram || 'PRG-01',
          namaProgram: item.namaProgram || 'Pendidikan Non Gelar Unpad',
          angkatanBatch: item.angkatanBatch || 'Batch 1',
          tahun: yr,
          tanggalMulai: item.tanggalMulai || '',
          tanggalSelesai: item.tanggalSelesai || '',
          statusPeserta: item.statusPeserta || 'Terdaftar',
          statusKelulusan: item.statusKelulusan || 'Belum Evaluasi',
          nomorSertifikat: item.nomorSertifikat || '',
          tanggalSertifikat: '',
          nilaiSkor: '',
          biayaProgram: item.biayaProgram || 0,
          sumberDana: item.sumberDana || 'Mandiri / Pribadi',
          pic: '',
          keterangan: 'Import Batch File',
          createdAt: now,
          createdBy: 'nendar@unpad.ac.id',
          updatedAt: now,
          updatedBy: 'nendar@unpad.ac.id',
          statusData: 'Aktif'
        };
      });

      onImportDone(finalPesertaList);
      setSuccessMessage(`Sukses! ${finalPesertaList.length} data peserta pelatihan berhasil diimport ke Google Sheets database.`);
    } else {
      // Execute import for Pegawai
      let itemsToImport = parsedRows.map(({ isDuplicate, duplicateInfo, ...rest }) => rest);

      let res;
      if (onImportPegawaiDone) {
        res = onImportPegawaiDone(itemsToImport, duplicateHandling);
      } else {
        res = bulkImportPegawai(itemsToImport, duplicateHandling);
      }

      setSuccessMessage(res.message);
    }

    setFile(null);
    setParsedRows([]);
    setImportSummary(null);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Module Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#002B66]/10 text-[#002B66]">
              Hub Import Data Sistem
            </span>
          </div>
          <h1 className="text-xl font-black text-[#002B66]">
            Import Data Massal (Excel & CSV)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unggah file data dengan verifikasi skema otomatis, deteksi duplikasi, dan integrasi Google Sheets
          </p>
        </div>

        {/* Tab Module Selector */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => handleSwitchModule('peserta')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-initial ${
              activeModule === 'peserta'
                ? 'bg-white text-[#002B66] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-[#002B66]" />
            <span>Data Peserta</span>
          </button>
          <button
            onClick={() => handleSwitchModule('pegawai')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-initial ${
              activeModule === 'pegawai'
                ? 'bg-[#002B66] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4 text-[#FDB913]" />
            <span>Data Pegawai (44 Field)</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-950 font-bold px-2 py-1">
            Tutup
          </button>
        </div>
      )}

      {/* Module Description & Template Downloads */}
      <div className="bg-gradient-to-r from-blue-50/60 to-slate-50 p-5 rounded-2xl border border-blue-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {activeModule === 'peserta' ? (
              <Users className="w-5 h-5 text-[#002B66]" />
            ) : (
              <Briefcase className="w-5 h-5 text-[#002B66]" />
            )}
            <h2 className="font-bold text-sm text-[#002B66]">
              {activeModule === 'peserta' 
                ? 'Modul Import Data Peserta Pendidikan Non Gelar' 
                : 'Modul Import Master Data Pegawai Unpad (44 Atribut Lengkap)'}
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            {activeModule === 'peserta'
              ? 'Pastikan file Anda menyertakan nama peserta, NIK/NIP, email, program pelatihan, tahun, dan status. Sistem akan memeriksa nomor registrasi serta duplikasi otomatis.'
              : 'File mencakup seluruh 44 kolom atribut kepegawaian (NIP, Nama, Karpeg, Unit Kerja, Bagian, Bidang, NIDN, Status Aktif, TMT, Tempat & Tanggal Lahir, Kontak, Alamat, Pendidikan Terakhir, Pangkat, Golongan, Jabatan Struktural, dan Fungsional).'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeModule === 'peserta' ? (
            <>
              <button
                onClick={() => downloadPesertaTemplate('xlsx')}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Template Excel (.xlsx)</span>
              </button>
              <button
                onClick={() => downloadPesertaTemplate('csv')}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Template CSV (.csv)</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => downloadPegawaiTemplate('xlsx')}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Template Pegawai Excel (.xlsx)</span>
              </button>
              <button
                onClick={() => downloadPegawaiTemplate('csv')}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Template Pegawai CSV (.csv)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Upload Dropzone */}
      <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#002B66] text-center space-y-4 transition-colors">
        <div className="w-16 h-16 rounded-full bg-[#002B66]/10 text-[#002B66] flex items-center justify-center mx-auto">
          {isProcessing ? (
            <RefreshCw className="w-8 h-8 animate-spin text-[#002B66]" />
          ) : (
            <Upload className="w-8 h-8" />
          )}
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-800">
            {isProcessing ? 'Sedang Memproses & Memvalidasi File...' : 'Pilih Berkas Excel (.xlsx, .xls) atau CSV (.csv)'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
            Sistem otomatis memetakan header kolom, memverifikasi data wajib, dan mendeteksi data duplikat secara real-time.
          </p>
        </div>

        <div>
          <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#002B66] hover:bg-[#083a7e] text-white font-bold text-xs rounded-xl cursor-pointer shadow-md transition-colors">
            <Upload className="w-4 h-4 text-[#FDB913]" />
            <span>Pilih File Dari Komputer</span>
            <input
              type="file"
              accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {file && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 rounded-lg text-xs font-mono text-slate-800 border border-slate-200">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">{file.name}</span>
            <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}
      </div>

      {/* Import Summary & Duplicate Handler */}
      {importSummary && (
        <div className="space-y-4 animate-in fade-in">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Baris File</span>
              <div className="text-2xl font-black text-slate-800 mt-0.5">{importSummary.total}</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Data Valid Siap Simpan</span>
              <div className="text-2xl font-black text-emerald-600 mt-0.5">{importSummary.valid}</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Data Duplikat</span>
              <div className="text-2xl font-black text-amber-600 mt-0.5">{importSummary.duplicate}</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Data Kurang Lengkap</span>
              <div className="text-2xl font-black text-rose-600 mt-0.5">{importSummary.invalid}</div>
            </div>
          </div>

          {/* Opsi Penanganan Duplikat */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Opsi Penanganan Data Duplikasi:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`p-3.5 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                duplicateHandling === 'skip' ? 'border-[#002B66] bg-[#002B66]/5 font-bold shadow-xs' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="dupAction"
                  checked={duplicateHandling === 'skip'}
                  onChange={() => setDuplicateHandling('skip')}
                  className="accent-[#002B66]"
                />
                <div>
                  <div className="text-slate-800">Lewati Data Duplikat</div>
                  <div className="text-[10px] text-slate-500 font-normal">Hanya import baris baru yang belum ada (Disarankan)</div>
                </div>
              </label>

              <label className={`p-3.5 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                duplicateHandling === 'update' ? 'border-[#002B66] bg-[#002B66]/5 font-bold shadow-xs' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="dupAction"
                  checked={duplicateHandling === 'update'}
                  onChange={() => setDuplicateHandling('update')}
                  className="accent-[#002B66]"
                />
                <div>
                  <div className="text-slate-800">Perbarui Data Duplikat</div>
                  <div className="text-[10px] text-slate-500 font-normal">Timpa data lama dengan data baru dari file</div>
                </div>
              </label>

              <label className={`p-3.5 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                duplicateHandling === 'force' ? 'border-[#002B66] bg-[#002B66]/5 font-bold shadow-xs' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="dupAction"
                  checked={duplicateHandling === 'force'}
                  onChange={() => setDuplicateHandling('force')}
                  className="accent-[#002B66]"
                />
                <div>
                  <div className="text-slate-800">Tetap Tambahkan Semua</div>
                  <div className="text-[10px] text-slate-500 font-normal">Izinkan penyimpanan baris baru secara terpisah</div>
                </div>
              </label>
            </div>
          </div>

          {/* Preview Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                Pratinjau {previewData.length} Baris Pertama ({activeModule === 'peserta' ? 'Data Peserta' : 'Data Pegawai'}):
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                Total {parsedRows.length} baris siap diproses
              </span>
            </div>

            <div className="overflow-x-auto">
              {activeModule === 'peserta' ? (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#002B66] text-white font-bold">
                    <tr>
                      <th className="p-2.5">No</th>
                      <th className="p-2.5">Nama Lengkap</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">NIK / NIP</th>
                      <th className="p-2.5">Kategori</th>
                      <th className="p-2.5">Program</th>
                      <th className="p-2.5">Status Duplikasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {previewData.map((row, idx) => (
                      <tr key={idx} className={row.isDuplicate ? 'bg-amber-50/50' : 'hover:bg-slate-50'}>
                        <td className="p-2.5 text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-800">
                          {[row.gelarDepan, row.namaLengkap, row.gelarBelakang].filter(Boolean).join(' ')}
                        </td>
                        <td className="p-2.5 text-slate-600">{row.email}</td>
                        <td className="p-2.5 font-mono text-[11px]">{row.nik || row.nip || '-'}</td>
                        <td className="p-2.5">{row.kategoriProgram}</td>
                        <td className="p-2.5 max-w-[150px] truncate">{row.namaProgram}</td>
                        <td className="p-2.5">
                          {row.isDuplicate ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                              Duplikat ({row.duplicateInfo?.field})
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                              Valid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#002B66] text-white font-bold">
                    <tr>
                      <th className="p-2.5">No</th>
                      <th className="p-2.5">NIP</th>
                      <th className="p-2.5">Nama Lengkap</th>
                      <th className="p-2.5">Status Kepegawaian</th>
                      <th className="p-2.5">Unit Kerja & Bagian</th>
                      <th className="p-2.5">Jabatan / Gol</th>
                      <th className="p-2.5">Pendidikan</th>
                      <th className="p-2.5">Status Duplikasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {previewData.map((row, idx) => (
                      <tr key={idx} className={row.isDuplicate ? 'bg-amber-50/50' : 'hover:bg-slate-50'}>
                        <td className="p-2.5 text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-mono font-bold text-[#002B66]">{row.nip || '-'}</td>
                        <td className="p-2.5 font-bold text-slate-800">
                          {[row.gelarDepan, row.nama, row.gelarBelakang].filter(Boolean).join(' ')}
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold border border-blue-200">
                            {row.statusKepegawaian || 'PNS'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600 max-w-[160px] truncate">
                          {row.unitKerja} {row.bagian ? `(${row.bagian})` : ''}
                        </td>
                        <td className="p-2.5 text-slate-600">
                          {row.jabatanFungsional || row.jabatanStruktural || '-'} {row.golongan ? `[${row.golongan}]` : ''}
                        </td>
                        <td className="p-2.5 text-slate-600">
                          {row.jenjang || '-'} {row.jurusan ? `- ${row.jurusan}` : ''}
                        </td>
                        <td className="p-2.5">
                          {row.isDuplicate ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                              Duplikat (NIP)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                              Valid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Action Bar */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-3 bg-slate-50/50">
              <button
                onClick={() => { setFile(null); setParsedRows([]); setImportSummary(null); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Batal
              </button>

              <button
                id="btn-proses-import"
                onClick={handleExecuteImport}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#002B66] hover:bg-[#083a7e] text-white text-xs font-bold rounded-lg shadow-md cursor-pointer transition-all"
              >
                <span>
                  Proses & Simpan ke Database {activeModule === 'peserta' ? 'Peserta' : 'Pegawai'}
                </span>
                <ArrowRight className="w-4 h-4 text-[#FDB913]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
