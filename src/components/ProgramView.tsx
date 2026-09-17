import React, { useState, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, GraduationCap, CheckCircle2, 
  XCircle, AlertTriangle, Users, Search, Filter
} from 'lucide-react';
import { Program, Kategori, Peserta, UserRole } from '../types';

interface ProgramViewProps {
  programList: Program[];
  kategoriList: Kategori[];
  pesertaList: Peserta[];
  userRole: UserRole;
  onSaveProgram: (prog: Program) => void;
  onDeleteProgram: (idProgram: string) => void;
}

export const ProgramView: React.FC<ProgramViewProps> = ({
  programList,
  kategoriList,
  pesertaList,
  userRole,
  onSaveProgram,
  onDeleteProgram,
}) => {
  const [selectedKat, setSelectedKat] = useState<string>('ALL');
  const [searchKw, setSearchKw] = useState<string>('');
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Program | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);

  // Form State
  const [idKategori, setIdKategori] = useState('');
  const [namaProgram, setNamaProgram] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [statusAktif, setStatusAktif] = useState<'Ya' | 'Tidak'>('Ya');

  const filteredPrograms = useMemo(() => {
    return programList.filter(p => {
      if (selectedKat !== 'ALL' && p.idKategori !== selectedKat) return false;
      if (searchKw.trim() && !p.namaProgram.toLowerCase().includes(searchKw.toLowerCase())) return false;
      return true;
    });
  }, [programList, selectedKat, searchKw]);

  const handleOpenAdd = () => {
    setEditItem(null);
    setIdKategori(kategoriList[0]?.idKategori || '');
    setNamaProgram('');
    setDeskripsi('');
    setStatusAktif('Ya');
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Program) => {
    setEditItem(p);
    setIdKategori(p.idKategori);
    setNamaProgram(p.namaProgram);
    setDeskripsi(p.deskripsi || '');
    setStatusAktif(p.statusAktif === true || p.statusAktif === 'Ya' ? 'Ya' : 'Tidak');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaProgram.trim() || !idKategori) return;

    const payload: Program = {
      idProgram: editItem ? editItem.idProgram : '',
      idKategori,
      namaProgram: namaProgram.trim(),
      deskripsi: deskripsi.trim(),
      statusAktif,
    };

    onSaveProgram(payload);
    setModalOpen(false);
  };

  const getKatName = (idKat: string) => {
    return kategoriList.find(k => k.idKategori === idKat)?.namaKategori || 'Lainnya';
  };

  const getParticipantCount = (namaProg: string) => {
    return pesertaList.filter(p => p.namaProgram === namaProg).length;
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-[#002B66]">Daftar Program Pendidikan Non Gelar</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {programList.length} kurikulum dan program spesifik yang terdata
          </p>
        </div>

        {userRole !== 'VIEWER' && (
          <button
            id="btn-tambah-program"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-[#FDB913]" />
            <span>Tambah Program Baru</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama program kursus..."
            value={searchKw}
            onChange={(e) => setSearchKw(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedKat}
            onChange={(e) => setSelectedKat(e.target.value)}
            className="w-full md:w-64 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Semua Kategori ({kategoriList.length})</option>
            {kategoriList.map(k => (
              <option key={k.idKategori} value={k.idKategori}>{k.namaKategori}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Program Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#002B66] text-white font-bold">
              <tr>
                <th className="p-3 w-16">ID</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Nama Program</th>
                <th className="p-3">Deskripsi</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Peserta</th>
                <th className="p-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPrograms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Tidak ada program yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredPrograms.map((p) => {
                  const count = getParticipantCount(p.namaProgram);
                  return (
                    <tr key={p.idProgram} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-[#002B66]">{p.idProgram}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200">
                          {getKatName(p.idKategori)}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{p.namaProgram}</td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">{p.deskripsi || '-'}</td>
                      <td className="p-3 text-center">
                        {(() => {
                          const isActive = p.statusAktif === true || p.statusAktif === 'Ya';
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isActive 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {isActive ? 'Aktif' : 'Non-Aktif'}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-bold text-[#002B66] bg-slate-100 px-2 py-0.5 rounded">
                          {count}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {userRole !== 'VIEWER' && (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                              title="Edit Program"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {userRole === 'ADMIN' && (
                              <button
                                onClick={() => setDeleteTarget(p)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                title="Hapus Program"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-[#002B66] mb-4">
              {editItem ? 'Edit Program' : 'Tambah Program Baru'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kategori Program <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={idKategori}
                  onChange={(e) => setIdKategori(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium"
                >
                  {kategoriList.map(k => (
                    <option key={k.idKategori} value={k.idKategori}>{k.namaKategori}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Program <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Certified Healthcare Executive"
                  value={namaProgram}
                  onChange={(e) => setNamaProgram(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={3}
                  placeholder="Penjelasan sasaran peserta, materi..."
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Aktif</label>
                <select
                  value={statusAktif}
                  onChange={(e) => setStatusAktif(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium"
                >
                  <option value="Ya">Aktif (Ya)</option>
                  <option value="Tidak">Non-Aktif (Tidak)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white font-bold rounded-lg shadow-xs"
                >
                  Simpan Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 rounded-full bg-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Hapus Program</h3>
                <p className="text-xs text-slate-500">Konfirmasi penghapusan program kursus</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus program <strong>{deleteTarget.namaProgram}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteProgram(deleteTarget.idProgram);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
