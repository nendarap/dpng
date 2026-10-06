import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Layers, CheckCircle2, XCircle, 
  AlertTriangle, Users, Compass, ChevronRight, ToggleLeft, ToggleRight, EyeOff
} from 'lucide-react';
import { Kategori, Peserta, UserRole } from '../types';

interface KategoriViewProps {
  kategoriList: Kategori[];
  pesertaList: Peserta[];
  userRole: UserRole;
  onSaveKategori: (kat: Kategori) => void;
  onDeleteKategori: (idKategori: string) => void;
  onNavigateToEduventure?: () => void;
  onNavigateToPengaturanPendaftaran?: () => void;
  onTogglePendaftaranKategori?: (idKategori: string, nextStatus: 'Buka' | 'Tutup') => void;
}

export const KategoriView: React.FC<KategoriViewProps> = ({
  kategoriList,
  pesertaList,
  userRole,
  onSaveKategori,
  onDeleteKategori,
  onNavigateToEduventure,
  onNavigateToPengaturanPendaftaran,
  onTogglePendaftaranKategori,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Kategori | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Kategori | null>(null);

  // Form State
  const [namaKategori, setNamaKategori] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [statusAktif, setStatusAktif] = useState<'Ya' | 'Tidak'>('Ya');
  const [statusPendaftaranKategori, setStatusPendaftaranKategori] = useState<'Buka' | 'Tutup'>('Buka');
  const [urutan, setUrutan] = useState<number>(1);

  const handleOpenAdd = () => {
    setEditItem(null);
    setNamaKategori('');
    setDeskripsi('');
    setStatusAktif('Ya');
    setStatusPendaftaranKategori('Buka');
    setUrutan(kategoriList.length + 1);
    setModalOpen(true);
  };

  const handleOpenEdit = (k: Kategori) => {
    setEditItem(k);
    setNamaKategori(k.namaKategori);
    setDeskripsi(k.deskripsi || '');
    setStatusAktif(k.statusAktif === true || k.statusAktif === 'Ya' ? 'Ya' : 'Tidak');
    setStatusPendaftaranKategori(k.statusPendaftaranKategori || 'Buka');
    setUrutan(k.urutan || 1);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKategori.trim()) return;

    const payload: Kategori = {
      idKategori: editItem ? editItem.idKategori : '',
      namaKategori: namaKategori.trim(),
      deskripsi: deskripsi.trim(),
      statusAktif,
      statusPendaftaranKategori,
      urutan: Number(urutan) || 1,
    };

    onSaveKategori(payload);
    setModalOpen(false);
  };

  const handleQuickTogglePendaftaran = (k: Kategori) => {
    const nextStatus = k.statusPendaftaranKategori === 'Tutup' ? 'Buka' : 'Tutup';
    if (onTogglePendaftaranKategori) {
      onTogglePendaftaranKategori(k.idKategori, nextStatus);
    } else {
      const updated: Kategori = {
        ...k,
        statusPendaftaranKategori: nextStatus,
      };
      onSaveKategori(updated);
    }
  };

  const getCountPeserta = (nama: string) => {
    return pesertaList.filter(p => p.kategoriProgram === nama).length;
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#002B66]">Kategori Program Pendidikan Non Gelar</h1>
            <span className="text-xs font-bold bg-[#FDB913]/20 text-[#002B66] px-2 py-0.5 rounded border border-[#FDB913]/40">
              {kategoriList.length} Kategori Master
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola pengelompokan program kursus, pelatihan, dan sertifikasi Unpad. Kategori dengan pendaftaran ditutup akan otomatis disembunyikan dari formulir publik.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToPengaturanPendaftaran && (
            <button
              type="button"
              onClick={onNavigateToPengaturanPendaftaran}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <ToggleLeft className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan Pendaftaran</span>
            </button>
          )}

          {userRole !== 'VIEWER' && (
            <button
              id="btn-tambah-kategori"
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#FDB913]" />
              <span>Tambah Kategori</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kategoriList.map((k) => {
          const participantCount = getCountPeserta(k.namaKategori);
          const isRegClosed = k.statusPendaftaranKategori === 'Tutup';
          const isActive = k.statusAktif === true || k.statusAktif === 'Ya';

          return (
            <div 
              key={k.idKategori}
              className={`bg-white p-5 rounded-xl border shadow-xs hover:border-[#002B66]/50 transition-all flex flex-col justify-between ${
                isRegClosed ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    #{k.urutan} | {k.idKategori}
                  </span>
                  
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {/* Status Pendaftaran Badge */}
                    {isRegClosed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300" title="Kategori ini disembunyikan dari pilihan formulir pendaftaran publik">
                        <EyeOff className="w-3 h-3 text-rose-600" />
                        <span>Ditutup (Hidden)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300" title="Kategori ini tampil di formulir pendaftaran publik">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Pendaftaran Buka</span>
                      </span>
                    )}

                    {/* Status Aktif */}
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isActive ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-[#002B66] mb-1.5">{k.namaKategori}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {k.deskripsi || 'Program pendidikan non gelar universitas padjadjaran.'}
                </p>

                {isRegClosed && (
                  <div className="mt-2.5 px-2.5 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-700 flex items-center gap-1.5">
                    <EyeOff className="w-3.5 h-3.5 shrink-0" />
                    <span>Disembunyikan dari Publik karena status pendaftaran ditutup.</span>
                  </div>
                )}

                {(k.idKategori === 'KAT-006' || k.namaKategori.toLowerCase().includes('eduventure')) && onNavigateToEduventure && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={onNavigateToEduventure}
                      className="w-full py-1.5 px-2.5 bg-blue-50 hover:bg-blue-100 text-[#002B66] border border-blue-200 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-blue-700" />
                        Buka Modul Eduventure
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Users className="w-3.5 h-3.5 text-[#002B66]" />
                  <span className="font-bold text-[#002B66]">{participantCount}</span>
                  <span className="text-[11px] text-slate-400">Peserta</span>
                </div>

                {userRole !== 'VIEWER' && (
                  <div className="flex items-center gap-1.5">
                    {/* Quick Toggle Pendaftaran Kategori */}
                    <button
                      type="button"
                      onClick={() => handleQuickTogglePendaftaran(k)}
                      className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                        isRegClosed
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-300'
                      }`}
                      title={isRegClosed ? 'Buka Pendaftaran Kategori (Tampilkan di Publik)' : 'Tutup Pendaftaran Kategori (Sembunyikan dari Publik)'}
                    >
                      {isRegClosed ? 'Buka Pendaftaran' : 'Tutup Pendaftaran'}
                    </button>

                    <button
                      onClick={() => handleOpenEdit(k)}
                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded cursor-pointer"
                      title="Edit Kategori"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {userRole === 'ADMIN' && (
                      <button
                        onClick={() => setDeleteTarget(k)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-[#002B66] mb-4">
              {editItem ? 'Edit Kategori Program' : 'Tambah Kategori Baru'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Luhung / Kredensial Mikro"
                  value={namaKategori}
                  onChange={(e) => setNamaKategori(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Kategori</label>
                <textarea
                  rows={3}
                  placeholder="Tujuan dan ruang lingkup kategori..."
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Status Pendaftaran Kategori (Publik)
                </label>
                <select
                  value={statusPendaftaranKategori}
                  onChange={(e) => setStatusPendaftaranKategori(e.target.value as 'Buka' | 'Tutup')}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium"
                >
                  <option value="Buka">🟢 Buka - Tampilkan Kategori di Formulir Publik</option>
                  <option value="Tutup">🔴 Tutup - Sembunyikan Kategori dari Formulir Publik</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Jika status "Tutup", kategori ini dan seluruh program di dalamnya otomatis disembunyikan dari pilihan peserta publik.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Urutan</label>
                  <input
                    type="number"
                    min={1}
                    value={urutan}
                    onChange={(e) => setUrutan(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Aktif Master</label>
                  <select
                    value={statusAktif}
                    onChange={(e) => setStatusAktif(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium"
                  >
                    <option value="Ya">Aktif (Ya)</option>
                    <option value="Tidak">Non-Aktif (Tidak)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Simpan Kategori
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
                <h3 className="text-base font-bold text-slate-800">Hapus Kategori Program</h3>
                <p className="text-xs text-slate-500">Konfirmasi penghapusan master kategori</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus kategori <strong>{deleteTarget.namaKategori}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteKategori(deleteTarget.idKategori);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
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
