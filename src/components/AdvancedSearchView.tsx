import React, { useState, useMemo } from 'react';
import { 
  Search, RotateCcw, Download, Eye, Edit2, Filter, 
  Layers, Calendar, Briefcase, Award, CheckCircle2
} from 'lucide-react';
import { Peserta, Kategori, Program, UserRole, AdvancedSearchFilter } from '../types';
import { advancedSearchPeserta } from '../services/storageService';

interface AdvancedSearchViewProps {
  kategoriList: Kategori[];
  programList: Program[];
  userRole: UserRole;
  onViewDetail: (peserta: Peserta) => void;
  onEditPeserta: (peserta: Peserta) => void;
}

export const AdvancedSearchView: React.FC<AdvancedSearchViewProps> = ({
  kategoriList,
  programList,
  userRole,
  onViewDetail,
  onEditPeserta,
}) => {
  const [filters, setFilters] = useState<Partial<AdvancedSearchFilter>>({
    field: 'all',
    operator: 'contains',
    keyword: '',
    kategori: '',
    program: '',
    tahun: '',
    statusPeserta: '',
    statusKelulusan: '',
    jenisKelamin: '',
    provinsi: '',
    instansi: '',
    nomorSertifikat: '',
    tanggalMulaiStart: '',
    tanggalMulaiEnd: '',
  });

  const [hasSearched, setHasSearched] = useState(true);

  // Search Results
  const searchResults = useMemo(() => {
    return advancedSearchPeserta(filters);
  }, [filters]);

  const handleReset = () => {
    setFilters({
      field: 'all',
      operator: 'contains',
      keyword: '',
      kategori: '',
      program: '',
      tahun: '',
      statusPeserta: '',
      statusKelulusan: '',
      jenisKelamin: '',
      provinsi: '',
      instansi: '',
      nomorSertifikat: '',
      tanggalMulaiStart: '',
      tanggalMulaiEnd: '',
    });
  };

  const exportFilteredResults = () => {
    const headers = [
      'ID Peserta', 'Nomor Registrasi', 'Nama Lengkap', 'Gelar Depan', 'Gelar Belakang',
      'NIK', 'NIP', 'Jenis Kelamin', 'Email', 'No HP', 'Instansi', 'Jabatan',
      'Kategori', 'Program', 'Tahun', 'Batch', 'Status Peserta', 'Kelulusan', 'No Sertifikat'
    ];

    const rows = searchResults.map(p => [
      p.id, p.nomorRegistrasi, p.namaLengkap, p.gelarDepan, p.gelarBelakang,
      p.nik, p.nip, p.jenisKelamin, p.email, p.nomorHp, p.instansi, p.jabatan,
      p.kategoriProgram, p.namaProgram, p.tahun, p.angkatanBatch, p.statusPeserta, p.statusKelulusan, p.nomorSertifikat
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(e => e.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Hasil_Pencarian_Peserta_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-[#002B66]">Pencarian Lanjutan (Advanced Search)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Saring data peserta dengan operator perbandingan dan multi-kriteria presisi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Kriteria</span>
          </button>

          <button
            onClick={exportFilteredResults}
            disabled={searchResults.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-40 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#FDB913]" />
            <span>Export Hasil ({searchResults.length})</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Form Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Filter className="w-4 h-4 text-[#002B66]" />
          <h2 className="text-xs font-bold text-[#002B66] uppercase tracking-wider">
            Parameter Pencarian & Operator
          </h2>
        </div>

        {/* Primary Keyword Search Bar with Field & Operator */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
          {/* Target Field */}
          <div className="md:col-span-3">
            <label className="block font-bold text-slate-600 mb-1">Target Kolom</label>
            <select
              value={filters.field}
              onChange={(e) => setFilters({ ...filters, field: e.target.value })}
              className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="all">Semua Kolom (Global)</option>
              <option value="namaLengkap">Nama Lengkap</option>
              <option value="nik">NIK</option>
              <option value="nip">NIP</option>
              <option value="email">Email</option>
              <option value="nomorHp">Nomor HP</option>
              <option value="nomorRegistrasi">Nomor Registrasi</option>
              <option value="instansi">Instansi</option>
              <option value="jabatan">Jabatan</option>
              <option value="fakultasUnit">Fakultas / Unit</option>
              <option value="nomorSertifikat">Nomor Sertifikat</option>
            </select>
          </div>

          {/* Operator */}
          <div className="md:col-span-3">
            <label className="block font-bold text-slate-600 mb-1">Operator Perbandingan</label>
            <select
              value={filters.operator}
              onChange={(e) => setFilters({ ...filters, operator: e.target.value as any })}
              className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="contains">Contains (Mengandung Kata)</option>
              <option value="equals">Equals (Sama Persis)</option>
              <option value="startsWith">Starts With (Diawali)</option>
              <option value="endsWith">Ends With (Diakhiri)</option>
            </select>
          </div>

          {/* Keyword Input */}
          <div className="md:col-span-6">
            <label className="block font-bold text-slate-600 mb-1">Kata Kunci Pencarian</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ketik kata kunci pencarian..."
                value={filters.keyword || ''}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66] focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Secondary Detailed Multi-dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs pt-2 border-t border-slate-100">
          {/* Kategori */}
          <div>
            <label className="block font-bold text-slate-600 mb-1">Kategori Program</label>
            <select
              value={filters.kategori || ''}
              onChange={(e) => setFilters({ ...filters, kategori: e.target.value })}
              className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="">Semua Kategori</option>
              {kategoriList.map(k => (
                <option key={k.idKategori} value={k.namaKategori}>{k.namaKategori}</option>
              ))}
            </select>
          </div>

          {/* Program */}
          <div>
            <label className="block font-bold text-slate-600 mb-1">Nama Program</label>
            <select
              value={filters.program || ''}
              onChange={(e) => setFilters({ ...filters, program: e.target.value })}
              className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="">Semua Program</option>
              {programList.map(p => (
                <option key={p.idProgram} value={p.namaProgram}>{p.namaProgram}</option>
              ))}
            </select>
          </div>

          {/* Tahun */}
          <div>
            <label className="block font-bold text-slate-600 mb-1">Tahun</label>
            <select
              value={filters.tahun || ''}
              onChange={(e) => setFilters({ ...filters, tahun: e.target.value })}
              className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="">Semua Tahun</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Status Peserta */}
          <div>
            <label className="block font-bold text-slate-600 mb-1">Status Peserta</label>
            <select
              value={filters.statusPeserta || ''}
              onChange={(e) => setFilters({ ...filters, statusPeserta: e.target.value })}
              className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="">Semua Status</option>
              <option value="Terdaftar">Terdaftar</option>
              <option value="Aktif">Aktif</option>
              <option value="Selesai">Selesai</option>
              <option value="Lulus">Lulus</option>
              <option value="Tidak Lulus">Tidak Lulus</option>
              <option value="Mengundurkan Diri">Mengundurkan Diri</option>
            </select>
          </div>

          {/* Status Kelulusan */}
          <div>
            <label className="block font-bold text-slate-600 mb-1">Status Kelulusan</label>
            <select
              value={filters.statusKelulusan || ''}
              onChange={(e) => setFilters({ ...filters, statusKelulusan: e.target.value })}
              className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="">Semua Status</option>
              <option value="Lulus">Lulus</option>
              <option value="Dalam Proses">Dalam Proses</option>
              <option value="Tidak Lulus">Tidak Lulus</option>
              <option value="Belum Evaluasi">Belum Evaluasi</option>
            </select>
          </div>

          {/* Jenis Kelamin */}
          <div>
            <label className="block font-bold text-slate-600 mb-1">Jenis Kelamin</label>
            <select
              value={filters.jenisKelamin || ''}
              onChange={(e) => setFilters({ ...filters, jenisKelamin: e.target.value })}
              className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="">Semua Gender</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
        </div>

        {/* Date Range & Specific Criteria */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100">
          <div>
            <label className="block font-bold text-slate-600 mb-1">Tanggal Mulai (Dari Tanggal)</label>
            <input
              type="date"
              value={filters.tanggalMulaiStart || ''}
              onChange={(e) => setFilters({ ...filters, tanggalMulaiStart: e.target.value })}
              className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Tanggal Mulai (Sampai Tanggal)</label>
            <input
              type="date"
              value={filters.tanggalMulaiEnd || ''}
              onChange={(e) => setFilters({ ...filters, tanggalMulaiEnd: e.target.value })}
              className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Pencarian Nomor Sertifikat</label>
            <input
              type="text"
              placeholder="Ketik sebagian nomor sertifikat..."
              value={filters.nomorSertifikat || ''}
              onChange={(e) => setFilters({ ...filters, nomorSertifikat: e.target.value })}
              className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            />
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#002B66]">Ditemukan {searchResults.length} Peserta</span>
            <span className="text-[10px] text-slate-400">Sesuai Kriteria Filter</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#002B66] text-white font-bold">
              <tr>
                <th className="p-3">ID Peserta</th>
                <th className="p-3">Nama Lengkap</th>
                <th className="p-3">NIK / NIP</th>
                <th className="p-3">Instansi</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Program</th>
                <th className="p-3">Tahun</th>
                <th className="p-3">Status</th>
                <th className="p-3">Kelulusan</th>
                <th className="p-3 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {searchResults.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-400">
                    Tidak ada peserta yang memenuhi semua filter kombinasi di atas.
                  </td>
                </tr>
              ) : (
                searchResults.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-[#002B66]">{p.id}</td>
                    <td className="p-3 font-semibold text-slate-800">
                      {[p.gelarDepan, p.namaLengkap, p.gelarBelakang].filter(Boolean).join(' ')}
                      <div className="text-[10px] text-slate-400 font-normal">{p.email}</div>
                    </td>
                    <td className="p-3 text-slate-600 font-mono text-[11px]">
                      <div>{p.nik || '-'}</div>
                      <div className="text-slate-400">{p.nip || ''}</div>
                    </td>
                    <td className="p-3 text-slate-700">{p.instansi || '-'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                        {p.kategoriProgram}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 font-medium">{p.namaProgram}</td>
                    <td className="p-3 font-bold">{p.tahun}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {p.statusPeserta}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-emerald-600 font-bold text-[11px]">{p.statusKelulusan}</span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onViewDetail(p)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {userRole !== 'VIEWER' && (
                          <button
                            onClick={() => onEditPeserta(p)}
                            className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
