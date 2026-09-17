import React, { useState } from 'react';
import { 
  FileSpreadsheet, Upload, Download, CheckCircle2, 
  AlertTriangle, XCircle, FileText, ArrowRight, ShieldAlert
} from 'lucide-react';
import { Peserta, Kategori, Program } from '../types';
import { checkDuplicate, generateNextIdPeserta } from '../services/storageService';

interface ImportViewProps {
  kategoriList: Kategori[];
  programList: Program[];
  onImportDone: (newPeserta: Peserta[]) => void;
}

export const ImportView: React.FC<ImportViewProps> = ({
  kategoriList,
  programList,
  onImportDone,
}) => {
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

  // Template Downloader
  const downloadTemplate = (format: 'csv' | 'txt') => {
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

    const content = 'data:text/csv;charset=utf-8,\uFEFF' + [
      headers.join(','),
      sampleRow.map(v => `"${v}"`).join(',')
    ].join('\n');

    const encodedUri = encodeURI(content);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Template_Import_Peserta_UNPAD.${format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setSuccessMessage(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter(l => l.trim().length > 0);
        
        if (lines.length < 2) {
          alert('File tidak memiliki data baris yang cukup.');
          setIsProcessing(false);
          return;
        }

        // Header parsing
        const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim());
        const dataRows: any[] = [];
        const duplicateDetails: any[] = [];
        let validCount = 0;
        let dupCount = 0;
        let invalidCount = 0;

        for (let i = 1; i < lines.length; i++) {
          // simple csv split regex preserving quotes
          const rawCols = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
          const cols = rawCols.map(c => c.replace(/^["']|["']$/g, '').trim());

          const rowData: any = {};
          headers.forEach((h, idx) => {
            rowData[h] = cols[idx] || '';
          });

          // Validation
          const nama = rowData['Nama Lengkap'] || rowData['namaLengkap'] || cols[0];
          const email = rowData['Email'] || rowData['email'] || cols[8];
          const nik = rowData['NIK'] || rowData['nik'] || cols[3];
          const nip = rowData['NIP'] || rowData['nip'] || cols[4];
          const kategori = rowData['Kategori Program'] || rowData['kategoriProgram'] || cols[17] || 'Luhung';
          const program = rowData['Nama Program'] || rowData['namaProgram'] || cols[18] || 'Program Mandiri Unpad';
          const tahun = Number(rowData['Tahun'] || cols[20]) || new Date().getFullYear();

          if (!nama || !email) {
            invalidCount++;
            continue;
          }

          // Check duplicate against existing
          const dup = checkDuplicate({ namaLengkap: nama, email, nik, nip });
          if (dup.isDuplicate) {
            dupCount++;
            duplicateDetails.push({
              row: i,
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

        setParsedRows(dataRows);
        setPreviewData(dataRows.slice(0, 10));
        setImportSummary({
          total: lines.length - 1,
          valid: validCount,
          duplicate: dupCount,
          invalid: invalidCount,
          duplicateDetails,
        });
      } catch (err) {
        alert('Gagal membaca file. Pastikan format CSV valid.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsText(uploadedFile);
  };

  const handleExecuteImport = () => {
    if (parsedRows.length === 0) return;

    let rowsToInsert = [...parsedRows];

    if (duplicateHandling === 'skip') {
      rowsToInsert = rowsToInsert.filter(r => !r.isDuplicate);
    }

    if (rowsToInsert.length === 0) {
      alert('Tidak ada data baru yang dapat diimport karena semua data duplikat dan opsi lewati aktif.');
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
    setSuccessMessage(`Sukses! ${finalPesertaList.length} data peserta berhasil diimport ke Google Sheets database.`);
    setFile(null);
    setParsedRows([]);
    setImportSummary(null);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-[#002B66]">Import Data Peserta dari Excel / CSV</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unggah file data massal dengan validasi skema otomatis dan deteksi duplikasi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadTemplate('csv')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Template CSV</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}

      {/* Upload Dropzone */}
      <div className="bg-white p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#002B66] text-center space-y-4 transition-colors">
        <div className="w-14 h-14 rounded-full bg-[#002B66]/10 text-[#002B66] flex items-center justify-center mx-auto">
          <Upload className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-800">
            Pilih File Excel (.xlsx, .xls) atau CSV (.csv)
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Sistem otomatis memverifikasi header kolom dan mendeteksi duplikat NIK, NIP, Email, & Nomor Registrasi.
          </p>
        </div>

        <div>
          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#002B66] hover:bg-[#083a7e] text-white font-bold text-xs rounded-lg cursor-pointer shadow-xs transition-colors">
            <span>Pilih File Dari Komputer</span>
            <input
              type="file"
              accept=".csv, .xlsx, .xls, text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {file && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-md text-xs font-mono text-slate-700">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}
      </div>

      {/* Import Summary & Duplicate Handler */}
      {importSummary && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Baris</span>
              <div className="text-xl font-black text-slate-800">{importSummary.total}</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Data Valid Siap Simpan</span>
              <div className="text-xl font-black text-emerald-600">{importSummary.valid}</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
              <span className="text-[10px] font-bold text-amber-600 uppercase">Data Duplikat</span>
              <div className="text-xl font-black text-amber-600">{importSummary.duplicate}</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs">
              <span className="text-[10px] font-bold text-rose-600 uppercase">Data Error / Invalid</span>
              <div className="text-xl font-black text-rose-600">{importSummary.invalid}</div>
            </div>
          </div>

          {/* Opsi Penanganan Duplikat */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Opsi Penanganan Data Duplikasi:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 ${
                duplicateHandling === 'skip' ? 'border-[#002B66] bg-[#002B66]/5 font-bold' : 'border-slate-200'
              }`}>
                <input
                  type="radio"
                  name="dupAction"
                  checked={duplicateHandling === 'skip'}
                  onChange={() => setDuplicateHandling('skip')}
                />
                <div>
                  <div>Lewati Data Duplikat</div>
                  <div className="text-[10px] text-slate-500 font-normal">Hanya import data baru (Disarankan)</div>
                </div>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 ${
                duplicateHandling === 'update' ? 'border-[#002B66] bg-[#002B66]/5 font-bold' : 'border-slate-200'
              }`}>
                <input
                  type="radio"
                  name="dupAction"
                  checked={duplicateHandling === 'update'}
                  onChange={() => setDuplicateHandling('update')}
                />
                <div>
                  <div>Update Data Duplikat</div>
                  <div className="text-[10px] text-slate-500 font-normal">Timpa data lama dengan data baru</div>
                </div>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 ${
                duplicateHandling === 'force' ? 'border-[#002B66] bg-[#002B66]/5 font-bold' : 'border-slate-200'
              }`}>
                <input
                  type="radio"
                  name="dupAction"
                  checked={duplicateHandling === 'force'}
                  onChange={() => setDuplicateHandling('force')}
                />
                <div>
                  <div>Tetap Import Semua</div>
                  <div className="text-[10px] text-slate-500 font-normal">Izinkan duplikasi data</div>
                </div>
              </label>
            </div>
          </div>

          {/* Preview Table (First 10 rows) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">Preview 10 Baris Pertama:</span>
              <span className="text-slate-400">Total {parsedRows.length} baris siap diproses</span>
            </div>

            <div className="overflow-x-auto">
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
                    <tr key={idx} className={row.isDuplicate ? 'bg-amber-50/40' : ''}>
                      <td className="p-2.5 text-slate-400">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-800">{row.namaLengkap}</td>
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
            </div>

            <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => { setFile(null); setParsedRows([]); setImportSummary(null); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Batal
              </button>

              <button
                id="btn-proses-import"
                onClick={handleExecuteImport}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#002B66] hover:bg-[#083a7e] text-white text-xs font-bold rounded-lg shadow-md"
              >
                <span>Proses & Simpan ke Database</span>
                <ArrowRight className="w-4 h-4 text-[#FDB913]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
