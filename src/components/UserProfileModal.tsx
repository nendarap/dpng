import React, { useState, useRef } from 'react';
import { 
  User, Camera, Upload, Trash2, Check, X, Shield, Mail, 
  Phone, Building2, IdCard, Palette, Sparkles, CheckCircle2,
  Clock, Lock, ShieldCheck, Sun, Moon
} from 'lucide-react';
import { UserItem, AppThemeId } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserItem;
  currentTheme: AppThemeId;
  onUpdateUser: (updatedUser: UserItem) => void;
  onThemeChange: (theme: AppThemeId) => void;
  onLogout: () => void;
}

const PRESET_AVATARS = [
  { id: 'avatar-1', label: 'Dosen Pria', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: 'avatar-2', label: 'Dosen Wanita', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
  { id: 'avatar-3', label: 'Pimpinan/Rektorat', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'avatar-4', label: 'Staf Tendik', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
  { id: 'avatar-5', label: 'Operator DPNG', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
];

const THEME_OPTIONS: Array<{
  id: AppThemeId;
  name: string;
  desc: string;
  primaryColor: string;
  accentColor: string;
  bgPreview: string;
}> = [
  {
    id: 'unpad-blue',
    name: 'Unpad Classic Navy & Gold',
    desc: 'Warna resmi khas Universitas Padjadjaran (Biru Dongker & Emas)',
    primaryColor: '#002B66',
    accentColor: '#FDB913',
    bgPreview: 'from-[#002B66] to-[#001736]',
  },
  {
    id: 'unpad-emerald',
    name: 'Unpad Emerald Green',
    desc: 'Nuansa Hijau Kampus Lestari Unpad yang segar dan asri',
    primaryColor: '#046A38',
    accentColor: '#FDB913',
    bgPreview: 'from-[#046A38] to-[#023e20]',
  },
  {
    id: 'unpad-dark',
    name: 'Unpad Slate Dark',
    desc: 'Mode Gelap Elegan & Modern dengan kenyamanan visual malam hari',
    primaryColor: '#0F172A',
    accentColor: '#38BDF8',
    bgPreview: 'from-[#0F172A] to-[#020617]',
  },
  {
    id: 'unpad-maroon',
    name: 'Unpad Royal Maroon',
    desc: 'Nuansa Wibawa Akademik Merah Marun & Sentuhan Emas Elegan',
    primaryColor: '#881337',
    accentColor: '#F59E0B',
    bgPreview: 'from-[#881337] to-[#4c0519]',
  },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentTheme,
  onUpdateUser,
  onThemeChange,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'photo' | 'theme'>('info');

  // Form states
  const [nama, setNama] = useState(currentUser.nama || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [nip, setNip] = useState(currentUser.nip || '198005122005011002');
  const [telepon, setTelepon] = useState(currentUser.telepon || '081223344556');
  const [unitKerja, setUnitKerja] = useState(currentUser.unitKerja || 'Direktorat Pendidikan Non Gelar (DPNG) Unpad');
  const [photoUrl, setPhotoUrl] = useState(currentUser.photoUrl || '');
  const [previewPhoto, setPreviewPhoto] = useState(currentUser.photoUrl || '');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Photo File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file foto maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreviewPhoto(base64);
    };
    reader.readAsDataURL(file);
  };

  // Save Info
  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserItem = {
      ...currentUser,
      nama: nama.trim() || currentUser.nama,
      email: email.trim() || currentUser.email,
      nip: nip.trim(),
      telepon: telepon.trim(),
      unitKerja: unitKerja.trim(),
      photoUrl: previewPhoto || undefined,
    };

    onUpdateUser(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  // Apply Photo
  const handleApplyPhoto = (url: string) => {
    setPreviewPhoto(url);
    const updated: UserItem = {
      ...currentUser,
      photoUrl: url || undefined,
    };
    onUpdateUser(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  const handleRemovePhoto = () => {
    setPreviewPhoto('');
    setPhotoUrl('');
    const updated: UserItem = {
      ...currentUser,
      photoUrl: undefined,
    };
    onUpdateUser(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Profile Hero */}
        <div className="bg-gradient-to-r from-[#002B66] via-[#003B8D] to-[#002B66] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar with Camera Overlay */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#FDB913] text-[#002B66] flex items-center justify-center font-bold text-2xl shadow-lg border-2 border-white/80">
                {previewPhoto ? (
                  <img 
                    src={previewPhoto} 
                    alt={currentUser.nama} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{currentUser.nama ? currentUser.nama.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('photo')}
                className="absolute -bottom-1 -right-1 bg-white text-[#002B66] hover:bg-amber-100 p-1.5 rounded-full shadow-md transition-transform hover:scale-105"
                title="Ganti Foto Profil"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Name & Role Details */}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-lg font-bold text-white truncate max-w-[280px]">
                  {currentUser.nama}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDB913] text-[#002B66] shadow-xs">
                  {currentUser.role === 'ADMIN' ? 'ADMIN UTAMA' : currentUser.role}
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5 flex items-center justify-center sm:justify-start gap-1 font-mono">
                <Mail className="w-3 h-3" /> {currentUser.email}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2 text-[11px] text-blue-200">
                <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md">
                  <Shield className="w-3 h-3 text-[#FDB913]" />
                  Group: {currentUser.namaGroup || currentUser.groupId || 'Default'}
                </span>
                <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3 text-emerald-300" />
                  Status: Aktif
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'info'
                ? 'border-[#002B66] text-[#002B66] bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Informasi User</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('photo')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'photo'
                ? 'border-[#002B66] text-[#002B66] bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Update Photo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'theme'
                ? 'border-[#002B66] text-[#002B66] bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Palette className="w-4 h-4 text-amber-500" />
            <span>Ganti Tema</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1">
          {savedSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Perubahan data pengguna & profil berhasil disimpan secara permanen.</span>
            </div>
          )}

          {/* TAB 1: INFORMASI USER */}
          {activeTab === 'info' && (
            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:border-transparent outline-none font-medium"
                      placeholder="Nama Lengkap Pengguna"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIP / NIK Unpad
                  </label>
                  <div className="relative">
                    <IdCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={nip}
                      onChange={(e) => setNip(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:border-transparent outline-none font-mono"
                      placeholder="198005122005011002"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Akun Unpad <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:border-transparent outline-none font-medium"
                      placeholder="nama@unpad.ac.id"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. Telepon / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={telepon}
                      onChange={(e) => setTelepon(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:border-transparent outline-none font-mono"
                      placeholder="081223344556"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unit Kerja / Fakultas
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={unitKerja}
                      onChange={(e) => setUnitKerja(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:border-transparent outline-none font-medium"
                      placeholder="Direktorat Pendidikan Non Gelar / Fakultas"
                    />
                  </div>
                </div>
              </div>

              {/* Readonly Account Details */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl mt-4">
                <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  Hak Akses & Detail Sistem
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">User ID:</span>
                    <span className="font-mono font-bold text-slate-800">{currentUser.userId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Role Akses:</span>
                    <span className="font-bold text-[#002B66]">{currentUser.role}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Group Akun:</span>
                    <span className="font-semibold text-slate-700">{currentUser.namaGroup || currentUser.groupId || 'Default'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#002B66] hover:bg-[#083a7e] rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan Informasi</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: UPDATE PHOTO */}
          {activeTab === 'photo' && (
            <div className="space-y-6">
              {/* Main Photo Preview & Upload */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-3xl shadow-inner border-2 border-white">
                  {previewPhoto ? (
                    <img 
                      src={previewPhoto} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{currentUser.nama ? currentUser.nama.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <h4 className="text-xs font-bold text-slate-800">Unggah Foto Pengguna</h4>
                  <p className="text-[11px] text-slate-500">
                    Pilih file gambar berformat PNG, JPG, JPEG, atau WebP (maksimal 2MB). Foto akan langsung disimpan di akun Anda.
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-[#002B66] hover:bg-[#083a7e] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Pilih File Gambar</span>
                    </button>

                    {previewPhoto && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Foto</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Preset Avatars */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Atau Pilih Avatar Bawaan Unpad:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {PRESET_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => handleApplyPhoto(av.url)}
                      className={`p-2 rounded-xl border text-center transition-all group cursor-pointer ${
                        previewPhoto === av.url
                          ? 'border-[#002B66] bg-blue-50/50 ring-2 ring-[#002B66]/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-14 h-14 mx-auto rounded-xl overflow-hidden mb-1.5 border border-slate-200 shadow-2xs">
                        <img 
                          src={av.url} 
                          alt={av.label} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 block truncate">
                        {av.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: GANTI TEMA APLIKASI */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-1">Pilihan Palet Tema Aplikasi SIMPENDIK</h4>
                <p className="text-xs text-slate-500">
                  Pilih nuansa warna antarmuka yang paling nyaman untuk aktivitas kerja Anda. Pengaturan tema akan tersimpan otomatis.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {THEME_OPTIONS.map((theme) => {
                  const isActive = currentTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        onThemeChange(theme.id);
                        setSavedSuccess(true);
                        setTimeout(() => setSavedSuccess(false), 2000);
                      }}
                      className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer ${
                        isActive
                          ? 'border-[#002B66] bg-blue-50/40 ring-2 ring-[#002B66]/30 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-[#002B66] bg-white px-2 py-0.5 rounded-full shadow-2xs border border-blue-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Aktif
                        </span>
                      )}

                      {/* Theme preview swatch */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <div 
                          className={`w-10 h-7 rounded-lg shadow-2xs border border-white/60 bg-gradient-to-br ${theme.bgPreview}`}
                        />
                        <div 
                          className="w-4 h-7 rounded-lg shadow-2xs"
                          style={{ backgroundColor: theme.accentColor }}
                        />
                      </div>

                      <h5 className="text-xs font-bold text-slate-800">{theme.name}</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{theme.desc}</p>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2 mt-4">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Setiap tema dirancang sesuai dengan standar kontras WCAG AA Universitas Padjadjaran, memastikan keterbacaan data pendidikan non gelar tetap optimal.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Logout */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            SIMPENDIK Unpad • DPNG © 2026
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Keluar Akun (Logout)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
