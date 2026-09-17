import React, { useState, useMemo } from 'react';
import { 
  Download, FileSpreadsheet, CheckSquare, Square, 
  Calendar, Layers, Filter, CheckCircle2
} from 'lucide-react';
import { Peserta, Kategori, Program } from '../types';

interface ExportViewProps {
  pesertaList: Peserta[];
  kategoriList: Kategori[];
  programList: Program[];
}

interface ColumnOption {
  id: string;
  label: string;
}

const AVAILABLE_COLUMNS: ColumnOption[] = [
  { id: 'id', label: 'ID Peserta (DPNG)' },
  { id: 'nomorRegistrasi', label: 'Nomor Registrasi' },
  { id: 'namaLengkap', label: 'Nama Lengkap' },
  { id: 'gelarDepan', label: 'Gelar Depan' },
  { id: 'gelarBelakang', label: 'Gelar Belakang' },
  { id: 'nik', label: 'NIK KTP' },
  { id: 'nip', label: 'NIP / NUPTK' },
  { id: 'jenisKelamin', label: 'Jenis Kelamin' },
  { id: 'tempatLahir', label: 'Tempat Lahir' },
  { id: 'tanggalLahir', label: 'Tanggal Lahir' },
  { id: 'email', label: 'Email' },
  { id: 'nomorHp', label: 'Nomor HP' },
  { id: 'alamat', label: 'Alamat' },
  { id: 'kotaKabupaten', label: 'Kota / Kabupaten' },
  { id: 'provinsi', label: 'Provinsi' },
  { id: 'instansi', label: 'Instansi' },
  { id: 'jabatan', label: 'Jabatan' },
  { id: 'fakultasUnit', label: 'Fakultas / Unit' },
  { id: 'pendidikanTerakhir', label: 'Pendidikan Terakhir' },
  { id: 'kategoriProgram', label: 'Kategori Program' },
  { id: 'namaProgram', label: 'Nama Program' },
  { id: 'angkatanBatch', label: 'Angkatan / Batch' },
  { id: 'tahun', label: 'Tahun' },
  { id: 'tanggalMulai', label: 'Tanggal Mulai' },
  { id: 'tanggalSelesai', label: 'Tanggal Selesai' },
  { id: 'statusPeserta', label: 'Status Peserta' },
  { id: 'statusKelulusan', label: 'Status Kelulusan' },
  { id: 'nomorSertifikat', label: 'Nomor Sertifikat' },
  { id: 'nilaiSkor', label: 'Nilai / Predikat' },
  { id: 'biayaProgram', label: 'Biaya Program' },
  { id: 'sumberDana', label: 'Sumber Dana' },
  { id: 'pic', label: 'PIC' },
  { id: 'keterangan', label: 'Keterangan' },
];

export const ExportView: React.FC<ExportViewProps> = ({
  pesertaList,
  kategoriList,
  programList,
}) => {
  // Filter criteria
  const [filterTahun, setFilterTahun] = useState('ALL');
  const [filterKategori, setFilterKategori] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterKelulusan, setFilterKelulusan] = useState('ALL');
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv');

  // Selected Columns
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    AVAILABLE_COLUMNS.map(c => c.id)
  );

  const toggleSelectAll = () => {
    if (selectedColumns.length === AVAILABLE_COLUMNS.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(AVAILABLE_COLUMNS.map(c => c.id));
    }
  };

  const toggleColumn = (id: string) => {
    if (selectedColumns.includes(id)) {
      setSelectedColumns(selectedColumns.filter(c => c !== id));
    } else {
      setSelectedColumns([...selectedColumns, id]);
    }
  };

  // Filtered dataset
  const filteredData = useMemo(() => {
    return pesertaList.filter(p => {
      if (filterTahun !== 'ALL' && String(p.tahun) !== filterTahun) return false;
      if (filterKategori !== 'ALL' && p.kategoriProgram !== filterKategori) return false;
      if (filterStatus !== 'ALL' && p.statusPeserta !== filterStatus) return false;
      if (filterKelulusan !== 'ALL' && p.statusKelulusan !== filterKelulusan) return false;
      return true;
    });
  }, [pesertaList, filterTahun, filterKategori, filterStatus, filterKelulusan]);

  const handleExport = () => {
    if (selectedColumns.length === 0) {
      alert('Pilih minimal satu kolom untuk diexport.');
      return;
    }

    const headers = AVAILABLE_COLUMNS
      .filter(c => selectedColumns.includes(c.id))
      .map(c => c.label);

    const rows = filteredData.map(p => {
      return AVAILABLE_COLUMNS
        .filter(c => selectedColumns.includes(c.id))
        .map(c => {
          const val = p[c.id];
          return val !== undefined && val !== null ? String(val) : '';
        });
    });

    const now = new Date();
    const dateStr = now.toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const filename = `SIMPENDIK_UNPAD_Data_Peserta_${dateStr}.${exportFormat === 'xlsx' ? 'csv' : 'csv'}`;

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(v => `"${v.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-black text-[#002B66]">Export Data Peserta</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Unduh rekapan data peserta dalam format Excel atau CSV dengan pemilihan kolom fleksibel
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Filter Ekspor & Format */}
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h2 className="font-bold text-[#002B66] flex items-center gap-2 border-b border-slate-100 pb-2">
              <Filter className="w-4 h-4 text-[#002B66]" />
              <span>1. Kriteria Penyaringan Data</span>
            </h2>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tahun Pelaksanaan</label>
              <select
                value={filterTahun}
                onChange={(e) => setFilterTahun(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium"
              >
                <option value="ALL">Semua Tahun</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Kategori Program</label>
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium"
              >
                <option value="ALL">Semua Kategori</option>
                {kategoriList.map(k => (
                  <option key={k.idKategori} value={k.namaKategori}>{k.namaKategori}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status Peserta</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium"
              >
                <option value="ALL">Semua Status</option>
                <option value="Terdaftar">Terdaftar</option>
                <option value="Aktif">Aktif</option>
                <option value="Selesai">Selesai</option>
                <option value="Lulus">Lulus</option>
                <option value="Tidak Lulus">Tidak Lulus</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status Kelulusan</label>
              <select
                value={filterKelulusan}
                onChange={(e) => setFilterKelulusan(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium"
              >
                <option value="ALL">Semua Kelulusan</option>
                <option value="Lulus">Lulus</option>
                <option value="Dalam Proses">Dalam Proses</option>
                <option value="Belum Evaluasi">Belum Evaluasi</option>
                <option value="Tidak Lulus">Tidak Lulus</option>
              </select>
            </div>
          </div>

          {/* Format File */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h2 className="font-bold text-[#002B66] flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileSpreadsheet className="w-4 h-4 text-[#002B66]" />
              <span>2. Pilih Format Berkas</span>
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 ${
                exportFormat === 'csv' ? 'border-[#002B66] bg-[#002B66]/5 font-bold' : 'border-slate-200'
              }`}>
                <input
                  type="radio"
                  name="format"
                  checked={exportFormat === 'csv'}
                  onChange={() => setExportFormat('csv')}
                />
                <span>CSV File (.csv)</span>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 ${
                exportFormat === 'xlsx' ? 'border-[#002B66] bg-[#002B66]/5 font-bold' : 'border-slate-200'
              }`}>
                <input
                  type="radio"
                  name="format"
                  checked={exportFormat === 'xlsx'}
                  onChange={() => setExportFormat('xlsx')}
                />
                <span>Excel Spreadsheet (.xlsx)</span>
              </label>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-slate-600 text-[11px] leading-relaxed">
              Total <strong>{filteredData.length} data</strong> terpilih sesuai filter. File otomatis menyertakan tanda UTF-8 BOM untuk kompatibilitas Microsoft Excel.
            </div>

            <button
              id="btn-trigger-export"
              onClick={handleExport}
              disabled={filteredData.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#002B66] hover:bg-[#083a7e] text-white font-bold rounded-lg shadow-md transition-colors disabled:opacity-40"
            >
              <Download className="w-4 h-4 text-[#FDB913]" />
              <span>Download Berkas Sekarang</span>
            </button>
          </div>
        </div>

        {/* Kolom Kanan: Pilihan Kolom Ekspor */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xs font-bold text-[#002B66] uppercase tracking-wider">
                3. Pilih Kolom yang Akan Diexport
              </h2>
              <p className="text-[11px] text-slate-500">
                {selectedColumns.length} dari {AVAILABLE_COLUMNS.length} kolom terpilih
              </p>
            </div>

            <button
              onClick={toggleSelectAll}
              className="text-xs font-semibold text-[#002B66] hover:underline"
            >
              {selectedColumns.length === AVAILABLE_COLUMNS.length ? 'Batal Pilih Semua' : 'Pilih Semua Kolom'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {AVAILABLE_COLUMNS.map(col => {
              const isChecked = selectedColumns.includes(col.id);
              return (
                <label 
                  key={col.id} 
                  onClick={() => toggleColumn(col.id)}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
                    isChecked ? 'border-[#002B66]/40 bg-[#002B66]/5 font-medium' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-[#002B66] shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="text-slate-700">{col.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
