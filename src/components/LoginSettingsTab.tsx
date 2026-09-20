import React, { useState, useRef } from 'react';
import { 
  Image, Upload, Palette, Sliders, Shield, Sparkles, 
  Check, RotateCcw, AlertCircle, Eye, Info, CheckCircle2,
  Lock, Globe, Building2, GraduationCap, ShieldCheck, Mail
} from 'lucide-react';
import { LoginSettings, LoginBgType } from '../types';
import { 
  LOGIN_PRESET_BACKGROUNDS, 
  LOGIN_GRADIENT_OPTIONS, 
  DEFAULT_LOGIN_SETTINGS 
} from '../data/loginPresets';
import { UnpadLogo } from './UnpadLogo';

interface LoginSettingsTabProps {
  loginSettings: LoginSettings;
  onSaveLoginSettings: (settings: LoginSettings) => void;
  isAdmin?: boolean;
}

export const LoginSettingsTab: React.FC<LoginSettingsTabProps> = ({
  loginSettings,
  onSaveLoginSettings,
  isAdmin = true,
}) => {
  const [formData, setFormData] = useState<LoginSettings>({ ...loginSettings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'desktop' | 'mobile'>('desktop');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Ukuran file gambar maksimal 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData(prev => ({
        ...prev,
        bgType: 'custom',
        bgCustomUrl: base64,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Kembalikan pengaturan halaman login ke standar resmi Unpad?')) {
      setFormData({ ...DEFAULT_LOGIN_SETTINGS });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveLoginSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Tentukan preview background style
  const selectedPreset = LOGIN_PRESET_BACKGROUNDS.find(p => p.id === formData.bgPresetId) || LOGIN_PRESET_BACKGROUNDS[0];
  const selectedGradient = LOGIN_GRADIENT_OPTIONS.find(g => g.id === formData.bgGradient) || LOGIN_GRADIENT_OPTIONS[0];

  const previewBgImage = formData.bgType === 'preset'
    ? selectedPreset.imageUrl
    : formData.bgType === 'custom' && formData.bgCustomUrl
      ? formData.bgCustomUrl
      : undefined;

  return (
    <div className="space-y-6">
      {/* Super Admin Notice Card */}
      <div className="p-4 bg-gradient-to-r from-[#002B66] to-[#003B8D] text-white rounded-xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
            <Sliders className="w-5 h-5 text-[#FDB913]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">Pengaturan Halaman Login</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDB913] text-[#002B66]">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-blue-100 mt-0.5 leading-relaxed">
              Kustomisasi tampilan halaman masuk SIMPENDIK Unpad: foto latar kampus, kegelapan overlay, teks branding, banner pengumuman, dan integrasi SSO.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetToDefault}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold border border-white/20 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset ke Default</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">Pengaturan halaman login berhasil disimpan dan langsung diterapkan ke sistem.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6 text-xs">
            
            {/* SECTION 1: TIPE & LATAR BELAKANG */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-bold text-[#002B66] flex items-center gap-2">
                  <Image className="w-4 h-4 text-[#002B66]" />
                  <span>1. Latar Belakang (Background) Halaman Login</span>
                </h4>
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  Tipe: {formData.bgType}
                </span>
              </div>

              {/* Tipe Selector Tabs */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, bgType: 'preset' })}
                  className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                    formData.bgType === 'preset'
                      ? 'border-[#002B66] bg-blue-50/50 text-[#002B66] font-bold ring-2 ring-[#002B66]/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <Building2 className="w-4 h-4 mx-auto mb-1 text-[#002B66]" />
                  <span>Foto Kampus Unpad</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, bgType: 'custom' })}
                  className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                    formData.bgType === 'custom'
                      ? 'border-[#002B66] bg-blue-50/50 text-[#002B66] font-bold ring-2 ring-[#002B66]/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <Upload className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                  <span>Unggah Kustom / URL</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, bgType: 'gradient' })}
                  className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                    formData.bgType === 'gradient'
                      ? 'border-[#002B66] bg-blue-50/50 text-[#002B66] font-bold ring-2 ring-[#002B66]/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <Palette className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                  <span>Gradien Warna</span>
                </button>
              </div>

              {/* Option 1: Preset Photos */}
              {formData.bgType === 'preset' && (
                <div className="space-y-3 pt-2">
                  <label className="block font-bold text-slate-700">
                    Pilih Foto Ikonik Kampus Universitas Padjadjaran:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {LOGIN_PRESET_BACKGROUNDS.map((preset) => {
                      const isSelected = formData.bgPresetId === preset.id;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => setFormData({ ...formData, bgPresetId: preset.id })}
                          className={`group relative rounded-xl overflow-hidden border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#002B66] ring-2 ring-[#002B66]/40 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="h-24 overflow-hidden relative">
                            <img 
                              src={preset.thumbnailUrl} 
                              alt={preset.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                            {isSelected && (
                              <span className="absolute top-2 right-2 bg-[#002B66] text-[#FDB913] p-1 rounded-full shadow-xs">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                            <div className="absolute bottom-2 left-2 right-2 text-white">
                              <span className="font-bold text-xs block truncate leading-tight">
                                {preset.name}
                              </span>
                              <span className="text-[10px] text-slate-300 block truncate">
                                {preset.location}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Option 2: Custom Upload or URL */}
              {formData.bgType === 'custom' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Unggah Gambar Latar (PNG/JPG/WebP, max 3MB):</label>
                    <div className="flex items-center gap-3">
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
                        className="px-3.5 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Pilih File dari Perangkat</span>
                      </button>

                      {formData.bgCustomUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, bgCustomUrl: '' })}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold transition-colors cursor-pointer"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Atau Masukkan Tautan Gambar Eksternal (URL):</label>
                    <input
                      type="url"
                      placeholder="https://example.com/foto-kampus-unpad.jpg"
                      value={formData.bgCustomUrl || ''}
                      onChange={(e) => setFormData({ ...formData, bgCustomUrl: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white font-mono"
                    />
                  </div>

                  {formData.bgCustomUrl && (
                    <div className="p-2 border border-slate-200 rounded-lg bg-slate-50 flex items-center gap-3">
                      <img 
                        src={formData.bgCustomUrl} 
                        alt="Custom Preview" 
                        className="w-16 h-12 object-cover rounded-md border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-[11px] text-slate-600 truncate flex-1">
                        <span className="font-bold block text-slate-800">Foto Kustom Aktif</span>
                        <span className="truncate block font-mono">{formData.bgCustomUrl.substring(0, 45)}...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Option 3: Gradients */}
              {formData.bgType === 'gradient' && (
                <div className="space-y-3 pt-2">
                  <label className="block font-bold text-slate-700">Pilih Palet Gradien Resmi:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {LOGIN_GRADIENT_OPTIONS.map((grad) => {
                      const isSelected = formData.bgGradient === grad.id;
                      return (
                        <div
                          key={grad.id}
                          onClick={() => setFormData({ ...formData, bgGradient: grad.id as any })}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#002B66] ring-2 ring-[#002B66]/30 bg-blue-50/30'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg shadow-2xs border border-white/50 bg-gradient-to-br ${grad.cssClass}`} />
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-slate-800 block truncate">{grad.name}</span>
                              <span className="text-[10px] text-slate-500 block truncate">{grad.desc}</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-[#002B66]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sliders: Overlay Kegelapan & Blur */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Tingkat Kegelapan Overlay:</label>
                    <span className="font-bold font-mono text-[#002B66]">{formData.bgOverlayOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={formData.bgOverlayOpacity}
                    onChange={(e) => setFormData({ ...formData, bgOverlayOpacity: Number(e.target.value) })}
                    className="w-full accent-[#002B66] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Terang (10%)</span>
                    <span>Standar (45%)</span>
                    <span>Gelap (90%)</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Efek Blur Latar Belakang:</label>
                    <span className="font-bold font-mono text-[#002B66]">{formData.bgBlurAmount}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="1"
                    value={formData.bgBlurAmount}
                    onChange={(e) => setFormData({ ...formData, bgBlurAmount: Number(e.target.value) })}
                    className="w-full accent-[#002B66] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Tajam (0px)</span>
                    <span>Halus (2px)</span>
                    <span>Kuat (12px)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: BRANDING & TEKS LOGIN */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="font-bold text-[#002B66] flex items-center gap-2 border-b border-slate-100 pb-2">
                <Globe className="w-4 h-4 text-[#002B66]" />
                <span>2. Identitas Teks & Informasi Panel Login</span>
              </h4>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul Utama Panel Kiri:</label>
                  <input
                    type="text"
                    value={formData.judulLogin}
                    onChange={(e) => setFormData({ ...formData, judulLogin: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-bold focus:bg-white"
                    placeholder="SIMPENDIK NON GELAR"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subjudul / Deskripsi Singkat:</label>
                  <textarea
                    rows={2}
                    value={formData.subjudulLogin}
                    onChange={(e) => setFormData({ ...formData, subjudulLogin: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:bg-white"
                    placeholder="Sistem Informasi Manajemen Data Peserta Pendidikan Non Gelar Universitas Padjadjaran."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Teks Badge Panel Kiri:</label>
                    <input
                      type="text"
                      value={formData.cardHeroTag || ''}
                      onChange={(e) => setFormData({ ...formData, cardHeroTag: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-slate-300 focus:bg-white"
                      placeholder="Portal Resmi Non Gelar"
                    />
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showFeatureHighlights}
                        onChange={(e) => setFormData({ ...formData, showFeatureHighlights: e.target.checked })}
                        className="w-4 h-4 accent-[#002B66] rounded cursor-pointer"
                      />
                      <span className="font-bold text-slate-700">Tampilkan 3 Kartu Keunggulan Program</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: BANNER PENGUMUMAN & KEBIJAKAN AKSES */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="font-bold text-[#002B66] flex items-center gap-2 border-b border-slate-100 pb-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>3. Pengumuman & Kebijakan Autentikasi Single Sign-On (SSO)</span>
              </h4>

              {/* Banner Toggle */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">Banner Pengumuman Halaman Login</span>
                    <span className="text-[11px] text-slate-500">
                      Tampilkan pengumuman resmi (misal: Pendaftaran Baru atau Pemeliharaan Server) di atas formulir.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.showAnnouncement}
                    onChange={(e) => setFormData({ ...formData, showAnnouncement: e.target.checked })}
                    className="w-4 h-4 accent-[#002B66] rounded cursor-pointer"
                  />
                </div>

                {formData.showAnnouncement && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div className="sm:col-span-3">
                        <label className="block font-bold text-slate-700 mb-1">Teks Pesan Pengumuman:</label>
                        <input
                          type="text"
                          value={formData.announcementText || ''}
                          onChange={(e) => setFormData({ ...formData, announcementText: e.target.value })}
                          className="w-full p-2 text-xs rounded-lg border border-slate-300"
                          placeholder="Pendaftaran Program Pelatihan Semester Gasal Telah Dibuka!"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Tipe Pesan:</label>
                        <select
                          value={formData.announcementType || 'info'}
                          onChange={(e) => setFormData({ ...formData, announcementType: e.target.value as any })}
                          className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="info">Info (Biru)</option>
                          <option value="warning">Peringatan (Kuning)</option>
                          <option value="success">Sukses (Hijau)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SSO Toggle */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">Autentikasi Single Sign-On (SSO) Unpad</span>
                    <span className="text-[11px] text-slate-500">
                      Izinkan pengguna masuk langsung dengan akun Google Workspace resmi @unpad.ac.id.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.allowGoogleSso}
                    onChange={(e) => setFormData({ ...formData, allowGoogleSso: e.target.checked })}
                    className="w-4 h-4 accent-[#002B66] rounded cursor-pointer"
                  />
                </div>

                {formData.allowGoogleSso && (
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block font-bold text-slate-700 mb-1">Label Tombol SSO Google:</label>
                    <input
                      type="text"
                      value={formData.googleSsoButtonText}
                      onChange={(e) => setFormData({ ...formData, googleSsoButtonText: e.target.value })}
                      className="w-full p-2 text-xs rounded-lg border border-slate-300"
                      placeholder="Single Sign-On Akun @unpad.ac.id"
                    />
                  </div>
                )}
              </div>

              {/* Footer text */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Teks Bantuan & Kontak Layanan di Footer:</label>
                <input
                  type="text"
                  value={formData.footerContactText}
                  onChange={(e) => setFormData({ ...formData, footerContactText: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:bg-white"
                  placeholder="Gedung Rektorat Unpad Jatinangor, Sumedang | Layanan Bantuan: dpng@unpad.ac.id"
                />
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Reset Default
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-[#002B66] hover:bg-[#083a7e] text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 text-[#FDB913]" />
                <span>Simpan Pengaturan Halaman Login</span>
              </button>
            </div>
          </div>

          {/* Live Preview Column (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs sticky top-20">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#002B66]" />
                  <span>Pratinjau Langsung (Live Preview)</span>
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                  <span>Skala 1:2</span>
                </div>
              </div>

              {/* Interactive Simulated Preview Box */}
              <div 
                className="rounded-xl overflow-hidden border border-slate-300 shadow-inner relative aspect-[4/3] flex flex-col justify-between p-3 select-none"
                style={{
                  backgroundColor: formData.bgType === 'gradient' ? selectedGradient.previewHex : undefined,
                }}
              >
                {/* Background Image Layer */}
                {previewBgImage && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                    style={{
                      backgroundImage: `url(${previewBgImage})`,
                      filter: `blur(${formData.bgBlurAmount}px)`,
                      transform: 'scale(1.05)',
                    }}
                  />
                )}

                {/* Gradient Layer */}
                {formData.bgType === 'gradient' && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${selectedGradient.cssClass}`} />
                )}

                {/* Dark Overlay Layer */}
                <div 
                  className="absolute inset-0 bg-black transition-opacity"
                  style={{ opacity: formData.bgOverlayOpacity / 100 }}
                />

                {/* Content Simulated Inside Preview */}
                <div className="relative z-10 flex items-center justify-between text-[9px] text-white/90">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-[#FDB913] text-[#002B66] flex items-center justify-center font-black text-[8px]">
                      U
                    </div>
                    <span className="font-bold truncate">SIMPENDIK Unpad</span>
                  </div>
                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-[8px]">Akses Terproteksi</span>
                </div>

                {/* Simulated Login Card Center */}
                <div className="relative z-10 my-auto bg-white rounded-lg shadow-lg border border-slate-100 p-2.5 max-w-[210px] mx-auto w-full text-[8px] space-y-1.5">
                  <div className="text-center pb-1 border-b border-slate-100">
                    <span className="font-black text-[#002B66] block text-[9px] truncate">
                      {formData.judulLogin || 'SIMPENDIK NON GELAR'}
                    </span>
                    <span className="text-[7px] text-slate-500 block truncate">
                      Masuk dengan Akun Resmi
                    </span>
                  </div>

                  {formData.showAnnouncement && (
                    <div className={`p-1 rounded text-[7px] font-semibold truncate ${
                      formData.announcementType === 'warning' 
                        ? 'bg-amber-50 text-amber-800' 
                        : formData.announcementType === 'success' 
                          ? 'bg-emerald-50 text-emerald-800' 
                          : 'bg-blue-50 text-blue-800'
                    }`}>
                      {formData.announcementText || 'Pengumuman Aktif'}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="bg-slate-100 rounded px-1.5 py-1 text-slate-400">email@unpad.ac.id</div>
                    <div className="bg-slate-100 rounded px-1.5 py-1 text-slate-400">••••••••</div>
                    <div className="bg-[#002B66] text-white rounded py-1 text-center font-bold">Masuk ke Sistem</div>
                  </div>

                  {formData.allowGoogleSso && (
                    <div className="border border-slate-200 rounded py-0.5 text-center text-slate-600 font-medium truncate px-1">
                      {formData.googleSsoButtonText || 'Single Sign-On @unpad.ac.id'}
                    </div>
                  )}
                </div>

                {/* Footer Simulated */}
                <div className="relative z-10 text-[7px] text-white/70 text-center truncate">
                  {formData.footerContactText}
                </div>
              </div>

              {/* Status Pill Indicator */}
              <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Latar Belakang:</span>
                  <span className="font-bold text-[#002B66] capitalize">
                    {formData.bgType === 'preset' ? selectedPreset.name : formData.bgType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Overlay / Blur:</span>
                  <span className="font-mono text-slate-700">{formData.bgOverlayOpacity}% / {formData.bgBlurAmount}px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Google SSO:</span>
                  <span className={`font-bold ${formData.allowGoogleSso ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {formData.allowGoogleSso ? 'Diaktifkan' : 'Dinonaktifkan'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
