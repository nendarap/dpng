import React, { useState } from 'react';
import { 
  Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, 
  CheckCircle2, AlertCircle, GraduationCap, Building2, KeyRound, Sparkles
} from 'lucide-react';
import { UserItem, UserRole } from '../types';
import { loginUser } from '../services/storageService';
import { UnpadLogo } from './UnpadLogo';

interface LoginViewProps {
  onLoginSuccess: (user: UserItem) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('nendar@unpad.ac.id');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Silakan masukkan alamat email Unpad Anda.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = loginUser(email, password);
      setIsLoading(false);

      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.message);
      }
    }, 400);
  };

  const handleQuickSelect = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = loginUser(demoEmail, demoPass);
      setIsLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.message);
      }
    }, 300);
  };

  const handleGoogleSso = () => {
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      // Login as user's unpad account
      const ssoEmail = 'nendar@unpad.ac.id';
      const res = loginUser(ssoEmail, 'admin123');
      setIsLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.message);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-amber-50/40 flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8">
      {/* Top Header Bar */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <UnpadLogo variant="color" size="sm" />
          <div className="border-l border-slate-300 pl-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider text-[#002B66] uppercase">Universitas Padjadjaran</span>
              <span className="text-[10px] bg-[#002B66]/10 text-[#002B66] font-semibold px-2 py-0.5 rounded">
                SIMPENDIK
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Direktorat Pendidikan Non Gelar (DPNG)</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Sistem Akses Terproteksi</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full my-auto py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Hero / Info Branding Panel */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#002B66] via-[#002252] to-[#001736] p-8 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Background Decorative Circles */}
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#FDB913]/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="mb-6 flex items-center justify-between">
                <UnpadLogo variant="light" size="md" />
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-[11px] font-semibold border border-white/15">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Portal Resmi Non Gelar</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-white mb-3">
                SIMPENDIK <span className="text-[#FDB913]">NON GELAR</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed font-normal mb-8">
                Sistem Informasi Manajemen Data Peserta Pendidikan Non Gelar Universitas Padjadjaran.
              </p>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-xs">
                  <GraduationCap className="w-5 h-5 text-[#FDB913] shrink-0 mt-0.5" />
                  <div>
                    <h2 className="font-bold text-white text-xs">13 Kategori Program Unggulan</h2>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Luhung, Executive Education, Kredensial Mikro, Summer School, hingga ToT.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-xs">
                  <Building2 className="w-5 h-5 text-[#FDB913] shrink-0 mt-0.5" />
                  <div>
                    <h2 className="font-bold text-white text-xs">Integrasi Google Workspace</h2>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Sinkronisasi database Google Sheets & Google Apps Script Unpad.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h2 className="font-bold text-white text-xs">Akses Berbasis Peran (RBAC)</h2>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Hak akses bertingkat Administrator, Operator DPNG, dan Viewer Fakultas.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-8 mt-6 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Universitas Padjadjaran</span>
              <span className="text-amber-300/80 font-mono">v3.2 Production</span>
            </div>
          </div>

          {/* Right Login Form Panel */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <UnpadLogo variant="color" size="sm" />
                <span className="text-[11px] font-semibold text-slate-400">Pendidikan Non Gelar</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Masuk ke Aplikasi
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Gunakan akun terdaftar atau Single Sign-On (SSO) email Unpad.
              </p>
            </div>

            {/* Error Alert Box */}
            {errorMessage && (
              <div 
                id="login-error-alert"
                className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2.5 animate-fadeIn"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label 
                  htmlFor="input-login-email" 
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Email Akun Unpad / Terdaftar <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="input-login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@unpad.ac.id"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-[#002B66] focus:ring-2 focus:ring-[#002B66]/20 transition-all outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label 
                    htmlFor="input-login-password" 
                    className="block text-xs font-bold text-slate-700"
                  >
                    Kata Sandi <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[11px] text-[#002B66] font-semibold hover:underline cursor-pointer">
                    Lupa sandi?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-[#002B66] focus:ring-2 focus:ring-[#002B66]/20 transition-all outline-none"
                  />
                  <button
                    type="button"
                    id="btn-toggle-password-visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-[#002B66] focus:ring-[#002B66] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 font-medium">Ingat sesi di perangkat ini</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="btn-submit-login"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#002B66] hover:bg-[#001f4d] active:bg-[#001736] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Masuk ke Sistem</span>
                    <ArrowRight className="w-4 h-4 text-[#FDB913]" />
                  </>
                )}
              </button>
            </form>

            {/* Separator */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative inline-block px-3 bg-white text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                atau masuk langsung
              </div>
            </div>

            {/* SSO Google Unpad Button */}
            <button
              type="button"
              id="btn-login-google-sso"
              onClick={handleGoogleSso}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Single Sign-On Akun @unpad.ac.id</span>
            </button>

            {/* Quick Demo Access Pills */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#002B66]" />
                  Pilih Akun Demo Siap Pakai:
                </span>
                <span className="text-[10px] text-slate-400">1-Klik Masuk</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  id="btn-demo-admin"
                  onClick={() => handleQuickLogin('nendar@unpad.ac.id', 'admin123')}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 text-left transition-all group cursor-pointer"
                  title="Masuk sebagai Administrator"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 group-hover:text-[#002B66]">Admin</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">nendar@unpad.ac.id</div>
                  <div className="text-[9px] text-amber-700 font-medium">Akses Penuh</div>
                </button>

                <button
                  type="button"
                  id="btn-demo-operator"
                  onClick={() => handleQuickLogin('operator.dpng@unpad.ac.id', 'operator123')}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-left transition-all group cursor-pointer"
                  title="Masuk sebagai Operator DPNG"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 group-hover:text-blue-800">Operator</span>
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">operator.dpng</div>
                  <div className="text-[9px] text-blue-700 font-medium">Input & Verifikasi</div>
                </button>

                <button
                  type="button"
                  id="btn-demo-viewer"
                  onClick={() => handleQuickLogin('viewer.fakultas@unpad.ac.id', 'viewer123')}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-left transition-all group cursor-pointer"
                  title="Masuk sebagai Viewer Fakultas"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-800">Viewer</span>
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">viewer.fakultas</div>
                  <div className="text-[9px] text-slate-600 font-medium">Hanya Lihat</div>
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-slate-400 py-3">
        <p>© 2026 Direktorat Pendidikan Non Gelar — Universitas Padjadjaran. Hak Cipta Dilindungi.</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Gedung Rektorat Unpad Jatinangor, Sumedang, Jawa Barat | Layanan Bantuan: dpng@unpad.ac.id
        </p>
      </footer>
    </div>
  );
};
