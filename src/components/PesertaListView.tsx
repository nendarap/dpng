import React, { useState, useMemo } from 'react';
import { 
  Search, Eye, Edit2, Trash2, Plus, Download, 
  ChevronLeft, ChevronRight, SlidersHorizontal, 
  FileText, CheckSquare, Square, AlertTriangle
} from 'lucide-react';
import { Peserta, UserRole } from '../types';

interface PesertaListViewProps {
  pesertaList: Peserta[];
  userRole: UserRole;
  onViewDetail: (peserta: Peserta) => void;
  onEditPeserta: (peserta: Peserta) => void;
  onDeletePeserta: (id: string) => void;
  onNavigateTambah: () => void;
  onExport: () => void;
}

export const PesertaListView: React.FC<PesertaListViewProps> = ({
  pesertaList,
  userRole,
  onViewDetail,
  onEditPeserta,
  onDeletePeserta,
  onNavigateTambah,
  onExport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [kategoriFilter, setKategoriFilter] = useState('ALL');
  const [tahunFilter, setTahunFilter] = useState('ALL');
  
  // Sorting
  const [sortField, setSortField] = useState<keyof Peserta>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Column Visibility
  const [showColumns, setShowColumns] = useState({
    nikNip: true,
    instansi: true,
    kategori: true,
    program: true,
    tahunBatch: true,
    status: true,
    kelulusan: true,
  });
  const [showColMenu, setShowColMenu] = useState(false);

  // Modal Delete Confirm
  const [deleteTarget, setDeleteTarget] = useState<Peserta | null>(null);

  // Filtered & Sorted Data
  const filteredData = useMemo(() => {
    return pesertaList.filter(p => {
      // Status Filter
      if (statusFilter !== 'ALL' && p.statusPeserta !== statusFilter) return false;
      // Kategori Filter
      if (kategoriFilter !== 'ALL' && p.kategoriProgram !== kategoriFilter) return false;
      // Tahun Filter
      if (tahunFilter !== 'ALL' && String(p.tahun) !== tahunFilter) return false;

      // Text Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match = 
          p.namaLengkap.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.nomorRegistrasi.toLowerCase().includes(q) ||
          p.nik.toLowerCase().includes(q) ||
          p.nip.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.instansi.toLowerCase().includes(q) ||
          p.namaProgram.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    }).sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      
      let cmp = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        cmp = valA - valB;
      } else {
        cmp = String(valA).localeCompare(String(valB));
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [pesertaList, searchTerm, statusFilter, kategoriFilter, tahunFilter, sortField, sortOrder]);

  // Pagination calculation
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSort = (field: keyof Peserta) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      onDeletePeserta(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-[#002B66]">Data Peserta Pendidikan Non Gelar</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {pesertaList.length} peserta terdata di Google Spreadsheet
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="btn-export-peserta"
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          {userRole !== 'VIEWER' && (
            <button
              id="btn-tambah-peserta-table"
              onClick={onNavigateTambah}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4 text-[#FDB913]" />
              <span>Tambah Peserta</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, ID, NIK, NIP, email, instansi, atau program..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66] focus:bg-white transition-all"
            />
          </div>

          {/* Quick Dropdown Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="Terdaftar">Terdaftar</option>
              <option value="Aktif">Aktif</option>
              <option value="Selesai">Selesai</option>
              <option value="Lulus">Lulus</option>
              <option value="Tidak Lulus">Tidak Lulus</option>
              <option value="Mengundurkan Diri">Mengundurkan Diri</option>
            </select>

            {/* Tahun Filter */}
            <select
              value={tahunFilter}
              onChange={(e) => { setTahunFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">Semua Tahun</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>

            {/* Column Visibility Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowColMenu(!showColMenu)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Kolom</span>
              </button>

              {showColMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 p-2 z-20 space-y-1 text-xs">
                  <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showColumns.nikNip} 
                      onChange={() => setShowColumns(prev => ({ ...prev, nikNip: !prev.nikNip }))} 
                    />
                    <span>NIK / NIP</span>
                  </label>
                  <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showColumns.instansi} 
                      onChange={() => setShowColumns(prev => ({ ...prev, instansi: !prev.instansi }))} 
                    />
                    <span>Instansi</span>
                  </label>
                  <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showColumns.kategori} 
                      onChange={() => setShowColumns(prev => ({ ...prev, kategori: !prev.kategori }))} 
                    />
                    <span>Kategori</span>
                  </label>
                  <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showColumns.program} 
                      onChange={() => setShowColumns(prev => ({ ...prev, program: !prev.program }))} 
                    />
                    <span>Program</span>
                  </label>
                  <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showColumns.tahunBatch} 
                      onChange={() => setShowColumns(prev => ({ ...prev, tahunBatch: !prev.tahunBatch }))} 
                    />
                    <span>Tahun / Batch</span>
                  </label>
                  <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showColumns.kelulusan} 
                      onChange={() => setShowColumns(prev => ({ ...prev, kelulusan: !prev.kelulusan }))} 
                    />
                    <span>Kelulusan</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {['ALL', 'Terdaftar', 'Aktif', 'Selesai', 'Lulus', 'Tidak Lulus'].map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-full font-semibold transition-colors ${
                statusFilter === st 
                  ? 'bg-[#002B66] text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'Semua Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#002B66] text-white font-bold tracking-wide">
              <tr>
                <th className="p-3 w-12 text-center">No</th>
                <th 
                  onClick={() => handleSort('id')} 
                  className="p-3 cursor-pointer hover:bg-[#083a7e]"
                >
                  ID Peserta
                </th>
                <th 
                  onClick={() => handleSort('namaLengkap')} 
                  className="p-3 cursor-pointer hover:bg-[#083a7e]"
                >
                  Nama Lengkap
                </th>
                {showColumns.nikNip && (
                  <th className="p-3">NIK / NIP</th>
                )}
                {showColumns.instansi && (
                  <th 
                    onClick={() => handleSort('instansi')} 
                    className="p-3 cursor-pointer hover:bg-[#083a7e]"
                  >
                    Instansi
                  </th>
                )}
                {showColumns.kategori && (
                  <th className="p-3">Kategori</th>
                )}
                {showColumns.program && (
                  <th className="p-3">Program</th>
                )}
                {showColumns.tahunBatch && (
                  <th 
                    onClick={() => handleSort('tahun')} 
                    className="p-3 cursor-pointer hover:bg-[#083a7e]"
                  >
                    Tahun / Batch
                  </th>
                )}
                {showColumns.status && (
                  <th 
                    onClick={() => handleSort('statusPeserta')} 
                    className="p-3 cursor-pointer hover:bg-[#083a7e]"
                  >
                    Status
                  </th>
                )}
                {showColumns.kelulusan && (
                  <th className="p-3">Kelulusan</th>
                )}
                <th className="p-3 text-center w-28">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Tidak ada data peserta yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                paginatedData.map((p, idx) => {
                  const globalNo = (currentPage - 1) * pageSize + idx + 1;
                  const fullName = [p.gelarDepan, p.namaLengkap, p.gelarBelakang].filter(Boolean).join(' ');

                  const badgeColors: Record<string, string> = {
                    Terdaftar: 'bg-slate-100 text-slate-700 border-slate-300',
                    Aktif: 'bg-blue-50 text-blue-700 border-blue-200',
                    Selesai: 'bg-amber-50 text-amber-700 border-amber-200',
                    Lulus: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    'Tidak Lulus': 'bg-rose-50 text-rose-700 border-rose-200',
                    'Mengundurkan Diri': 'bg-purple-50 text-purple-700 border-purple-200'
                  };

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center text-slate-400 font-medium">{globalNo}</td>
                      <td className="p-3 font-mono font-bold text-[#002B66]">
                        {p.id}
                        <div className="text-[10px] text-slate-400 font-normal">{p.nomorRegistrasi}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{fullName}</div>
                        <div className="text-[11px] text-slate-500">{p.email}</div>
                      </td>
                      {showColumns.nikNip && (
                        <td className="p-3 text-slate-600 font-mono text-[11px]">
                          <div>NIK: {p.nik || '-'}</div>
                          {p.nip && <div className="text-slate-400">NIP: {p.nip}</div>}
                        </td>
                      )}
                      {showColumns.instansi && (
                        <td className="p-3 text-slate-700">
                          <div className="font-medium">{p.instansi || '-'}</div>
                          <div className="text-[11px] text-slate-400">{p.jabatan || ''}</div>
                        </td>
                      )}
                      {showColumns.kategori && (
                        <td className="p-3">
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                            {p.kategoriProgram}
                          </span>
                        </td>
                      )}
                      {showColumns.program && (
                        <td className="p-3 text-slate-700 font-medium max-w-[200px] truncate" title={p.namaProgram}>
                          {p.namaProgram}
                        </td>
                      )}
                      {showColumns.tahunBatch && (
                        <td className="p-3 text-slate-700">
                          <span className="font-bold">{p.tahun}</span>
                          <div className="text-[10px] text-slate-400">{p.angkatanBatch || '-'}</div>
                        </td>
                      )}
                      {showColumns.status && (
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColors[p.statusPeserta] || 'bg-slate-100 text-slate-700'}`}>
                            {p.statusPeserta}
                          </span>
                        </td>
                      )}
                      {showColumns.kelulusan && (
                        <td className="p-3">
                          <span className={`inline-block text-[11px] font-semibold ${
                            p.statusKelulusan === 'Lulus' ? 'text-emerald-600' : 'text-slate-600'
                          }`}>
                            {p.statusKelulusan}
                          </span>
                          {p.nomorSertifikat && (
                            <div className="text-[9px] text-slate-400 font-mono truncate max-w-[100px]" title={p.nomorSertifikat}>
                              {p.nomorSertifikat}
                            </div>
                          )}
                        </td>
                      )}
                      {/* Action buttons */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            id={`btn-view-${p.id}`}
                            onClick={() => onViewDetail(p)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Lihat Detail Profil & Cetak"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {userRole !== 'VIEWER' && (
                            <button
                              id={`btn-edit-${p.id}`}
                              onClick={() => onEditPeserta(p)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                              title="Edit Data Peserta"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {userRole === 'ADMIN' && (
                            <button
                              id={`btn-del-${p.id}`}
                              onClick={() => setDeleteTarget(p)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                              title="Hapus Data (Admin)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Page Size Toolbar */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              Menampilkan {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} dari {totalItems} peserta
            </span>
            <div className="flex items-center gap-1.5">
              <span>Per halaman:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-semibold focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-[#002B66]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 rounded-full bg-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Konfirmasi Hapus Peserta</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus data peserta <strong className="text-slate-900">{deleteTarget.namaLengkap}</strong> ({deleteTarget.id}) dari database Google Sheets?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs shadow-xs"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
