import React, { useState } from 'react';
import { 
  ShieldCheck, Plus, Edit2, Trash2, CheckCircle2, 
  XCircle, Mail, User, Shield
} from 'lucide-react';
import { UserItem, UserRole } from '../types';

interface UserManagementViewProps {
  users: UserItem[];
  currentUser: UserItem;
  onSaveUser: (user: UserItem) => void;
  onDeleteUser: (userId: string) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  currentUser,
  onSaveUser,
  onDeleteUser,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<UserItem | null>(null);

  // Form
  const [email, setEmail] = useState('');
  const [nama, setNama] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('OPERATOR');
  const [statusAktif, setStatusAktif] = useState<'Ya' | 'Tidak'>('Ya');

  const handleOpenAdd = () => {
    setEditItem(null);
    setEmail('');
    setNama('');
    setPassword('unpad123');
    setRole('OPERATOR');
    setStatusAktif('Ya');
    setModalOpen(true);
  };

  const handleOpenEdit = (u: UserItem) => {
    setEditItem(u);
    setEmail(u.email);
    setNama(u.nama);
    setPassword(u.password || '');
    setRole(u.role);
    setStatusAktif(u.statusAktif === 'Ya' || u.status === 'Aktif' ? 'Ya' : 'Tidak');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !nama.trim()) return;

    const payload: UserItem = {
      userId: editItem ? editItem.userId : 'USR-' + String(users.length + 1).padStart(3, '0'),
      email: email.trim(),
      nama: nama.trim(),
      password: password.trim() || editItem?.password || 'unpad123',
      role,
      status: statusAktif === 'Ya' ? 'Aktif' : 'Nonaktif',
      statusAktif,
      lastLogin: editItem?.lastLogin || 'Belum Login'
    };

    onSaveUser(payload);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#002B66]">Manajemen Pengguna (User Management)</h1>
            <span className="text-[11px] font-bold bg-[#002B66] text-white px-2 py-0.5 rounded">
              Khusus ADMIN
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola hak akses operator dan staf pengelola Direktorat Pendidikan Non Gelar Unpad
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 text-[#FDB913]" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Role Permission Legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
          <div className="font-bold text-[#002B66] flex items-center gap-1.5 mb-1">
            <Shield className="w-4 h-4 text-[#002B66]" />
            <span>ADMINISTRATOR</span>
          </div>
          <p className="text-slate-500 text-[11px]">
            Akses penuh: Tambah, edit, hapus seluruh data peserta, kategori, import batch, user management, dan reset sistem.
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
          <div className="font-bold text-blue-700 flex items-center gap-1.5 mb-1">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>OPERATOR</span>
          </div>
          <p className="text-slate-500 text-[11px]">
            Input dan edit peserta, kelola kategori/program, export data, dan melihat dashboard serta log aktivitas.
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
          <div className="font-bold text-slate-700 flex items-center gap-1.5 mb-1">
            <Shield className="w-4 h-4 text-slate-500" />
            <span>VIEWER</span>
          </div>
          <p className="text-slate-500 text-[11px]">
            Hanya dapat melihat dashboard statistik, mencari peserta, dan melihat detail profil peserta tanpa hak modifikasi.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#002B66] text-white font-bold">
              <tr>
                <th className="p-3 w-16">ID User</th>
                <th className="p-3">Nama Pengguna</th>
                <th className="p-3">Email Unpad</th>
                <th className="p-3">Role Hak Akses</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3">Login Terakhir</th>
                <th className="p-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((u) => (
                <tr key={u.userId} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-[#002B66]">{u.userId}</td>
                  <td className="p-3 font-bold text-slate-800">{u.nama}</td>
                  <td className="p-3 text-slate-600 font-mono text-[11px]">{u.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      u.role === 'ADMIN' 
                        ? 'bg-[#002B66] text-white' 
                        : u.role === 'OPERATOR'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {(() => {
                      const isActive = u.statusAktif === 'Ya' || u.status === 'Aktif';
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {isActive ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="p-3 text-slate-400 font-mono text-[11px]">{u.lastLogin || '-'}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {u.userId !== currentUser.userId && (
                        <button
                          onClick={() => onDeleteUser(u.userId)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                          title="Hapus User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-[#002B66] mb-4">
              {editItem ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dr. Budi Santoso"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email Akun Google / Unpad <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="username@unpad.ac.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kata Sandi (Password) <span className="text-xs text-slate-400 font-normal">(Default: unpad123)</span>
                </label>
                <input
                  type="text"
                  placeholder="Masukkan kata sandi login..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hak Akses (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium"
                >
                  <option value="ADMIN">ADMIN (Full Access)</option>
                  <option value="OPERATOR">OPERATOR (Input, Edit, Export)</option>
                  <option value="VIEWER">VIEWER (Read Only)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Keaktifan</label>
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
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
