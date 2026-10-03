import React, { useState, useEffect, useMemo } from 'react';
import { 
  GraduationCap, CheckCircle2, AlertCircle, ArrowRight, UserCheck, 
  Building2, Phone, Mail, MapPin, Calendar, Award, Download, Printer, 
  ExternalLink, Copy, Check, LogOut, ChevronRight, Search, ShieldCheck, 
  Sparkles, FileText, ArrowLeft, RefreshCw, QrCode, BookOpen, Clock, Users,
  Plus
} from 'lucide-react';
import { Peserta, Kategori, Program } from '../types';
import { UnpadLogo } from './UnpadLogo';
import { createPeserta } from '../services/storageService';

interface GooglePublicUser {
  email: string;
  name: string;
  picture: string;
  googleId: string;
  verified: boolean;
}

interface PublicRegistrationViewProps {
  kategoriList: Kategori[];
  programList: Program[];
  allPesertaList: Peserta[];
  onBackToLogin: () => void;
  onRefreshData?: () => void;
}

const DEFAULT_GOOGLE_PRESETS = [
  {
    name: 'Dr. Nendar, S.Kom., M.T.',
    email: 'nendar@unpad.ac.id',
    picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    googleId: 'g_unpad_nendar'
  },
  {
    name: 'Ahmad Fauzi, S.T.',
    email: 'ahmad.fauzi@gmail.com',
    picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    googleId: 'g_ahmad_fauzi'
  },
  {
    name: 'Siti Rahmawati, S.E.',
    email: 'siti.rahma@gmail.com',
    picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    googleId: 'g_siti_rahma'
  }
];

export const PublicRegistrationView: React.FC<PublicRegistrationViewProps> = ({
  kategoriList,
  programList,
  allPesertaList,
  onBackToLogin,
  onRefreshData,
}) => {
  // Active Tab: 'form' (Formulir Pendaftaran) or 'history' (Status Pendaftaran Saya)
  const [activeSubTab, setActiveSubTab] = useState<'form' | 'history'>('form');

  // Google User State
  const [googleUser, setGoogleUser] = useState<GooglePublicUser | null>(() => {
    try {
      const saved = localStorage.getItem('simpendik_public_google_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  // Form Fields State
  const [selectedKategori, setSelectedKategori] = useState<string>('');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [angkatanBatch, setAngkatanBatch] = useState<string>('Batch 1');
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());

  const [namaLengkap, setNamaLengkap] = useState<string>('');
  const [gelarDepan, setGelarDepan] = useState<string>('');
  const [gelarBelakang, setGelarBelakang] = useState<string>('');
  const [nik, setNik] = useState<string>('');
  const [nomorHp, setNomorHp] = useState<string>('');
  const [tempatLahir, setTempatLahir] = useState<string>('');
  const [tanggalLahir, setTanggalLahir] = useState<string>('');
  const [jenisKelamin, setJenisKelamin] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [pendidikanTerakhir, setPendidikanTerakhir] = useState<string>('S1 / D4');

  const [instansi, setInstansi] = useState<string>('');
  const [jabatan, setJabatan] = useState<string>('');
  const [provinsi, setProvinsi] = useState<string>('Jawa Barat');
  const [kotaKabupaten, setKotaKabupaten] = useState<string>('Bandung');
  const [alamat, setAlamat] = useState<string>('');
  const [catatanMotivasi, setCatatanMotivasi] = useState<string>('');
  const [agreeTerms, setAgreeTerms] = useState<boolean>(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredResult, setRegisteredResult] = useState<Peserta | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Link copy feedback
  const [copiedLink, setCopiedLink] = useState(false);

  // Helper getters
  const getProgId = (p: Program) => p.idProgram || p.id || '';
  const getProgKategori = (p: Program) => {
    if (p.kategori) return p.kategori;
    const found = kategoriList.find(k => k.idKategori === p.idKategori);
    return found?.namaKategori || 'Pendidikan Non Gelar';
  };

  // Check URL parameters for pre-selected program e.g. ?program=XYZ
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const programParam = params.get('program');
      if (programParam) {
        const found = programList.find(p => getProgId(p) === programParam || p.namaProgram.toLowerCase() === programParam.toLowerCase());
        if (found) {
          setSelectedProgramId(getProgId(found));
          setSelectedKategori(getProgKategori(found));
        }
      }
    } catch {
      // ignore
    }
  }, [programList, kategoriList]);

  // Sync Google user with name
  useEffect(() => {
    if (googleUser && !namaLengkap) {
      setNamaLengkap(googleUser.name);
    }
  }, [googleUser, namaLengkap]);

  // Google Login Handlers
  const handleGoogleLogin = (user: GooglePublicUser) => {
    setGoogleUser(user);
    localStorage.setItem('simpendik_public_google_user', JSON.stringify(user));
    if (!namaLengkap) setNamaLengkap(user.name);
    setGoogleModalOpen(false);
  };

  const handleGoogleLogout = () => {
    setGoogleUser(null);
    localStorage.removeItem('simpendik_public_google_user');
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleEmail.trim() || !customGoogleName.trim()) return;
    const user: GooglePublicUser = {
      email: customGoogleEmail.trim().toLowerCase(),
      name: customGoogleName.trim(),
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(customGoogleName.trim())}&background=002B66&color=FDB913&bold=true`,
      googleId: `g_${Date.now()}`,
      verified: true
    };
    handleGoogleLogin(user);
  };

  // Filtered Programs based on selected category
  const filteredPrograms = useMemo(() => {
    if (!selectedKategori) return programList;
    return programList.filter(p => getProgKategori(p) === selectedKategori || p.idKategori === selectedKategori);
  }, [programList, selectedKategori, kategoriList]);

  const selectedProgramObj = useMemo(() => {
    return programList.find(p => getProgId(p) === selectedProgramId);
  }, [programList, selectedProgramId]);

  // My Registrations (Query all registrations by this Google user's email)
  const myRegistrations = useMemo(() => {
    if (!googleUser?.email) return [];
    const targetEmail = googleUser.email.toLowerCase().trim();
    return allPesertaList.filter(p => p.email && p.email.toLowerCase().trim() === targetEmail);
  }, [allPesertaList, googleUser]);

  // Copy shareable link
  const handleCopyLink = () => {
    const directUrl = `${window.location.origin}${window.location.pathname}?mode=daftar`;
    navigator.clipboard.writeText(directUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Form Submit Handler
  const handleSubmitRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!googleUser) {
      setErrorMessage('Silakan Masuk dengan Akun Google terlebih dahulu sebelum mengirimkan formulir.');
      setGoogleModalOpen(true);
      return;
    }

    if (!selectedProgramId) {
      setErrorMessage('Silakan pilih Program Pelatihan yang ingin Anda ikuti.');
      return;
    }

    if (!namaLengkap.trim()) {
      setErrorMessage('Nama Lengkap wajib diisi.');
      return;
    }

    if (!nik.trim() || nik.length < 10) {
      setErrorMessage('Nomor Induk Kependudukan (NIK) minimal 10 - 16 digit.');
      return;
    }

    if (!nomorHp.trim()) {
      setErrorMessage('Nomor Telepon / WhatsApp wajib diisi.');
      return;
    }

    if (!instansi.trim()) {
      setErrorMessage('Asal Instansi / Universitas / Perusahaan wajib diisi.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Harap centang persetujuan syarat & ketentuan pendaftaran.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const prog = programList.find(p => getProgId(p) === selectedProgramId);
      const kat = kategoriList.find(k => k.namaKategori === selectedKategori || (prog && k.idKategori === prog.idKategori));

      const newPesertaPayload: Omit<Peserta, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'statusData'> = {
        nomorRegistrasi: '',
        nik: nik.trim(),
        nip: '-',
        namaLengkap: namaLengkap.trim(),
        gelarDepan: gelarDepan.trim(),
        gelarBelakang: gelarBelakang.trim(),
        jenisKelamin,
        tempatLahir: tempatLahir.trim() || '-',
        tanggalLahir: tanggalLahir || '-',
        email: googleUser.email.toLowerCase().trim(),
        nomorHp: nomorHp.trim(),
        instansi: instansi.trim(),
        jabatan: jabatan.trim() || 'Peserta Mandiri',
        fakultasUnit: catatanMotivasi.trim() || '-',
        pendidikanTerakhir,
        provinsi: provinsi.trim() || 'Jawa Barat',
        kotaKabupaten: kotaKabupaten.trim() || 'Bandung',
        alamat: alamat.trim() || '-',
        idKategori: kat?.idKategori || prog?.idKategori || '',
        kategoriProgram: kat?.namaKategori || (prog ? getProgKategori(prog) : selectedKategori) || 'Pendidikan Non Gelar',
        idProgram: prog ? getProgId(prog) : '',
        namaProgram: prog?.namaProgram || 'Program Pelatihan Unpad',
        angkatanBatch,
        tahun,
        tanggalMulai: prog?.tanggalMulai || new Date().toISOString().slice(0, 10),
        tanggalSelesai: prog?.tanggalSelesai || new Date().toISOString().slice(0, 10),
        statusPeserta: 'Terdaftar',
        statusKelulusan: 'Dalam Proses',
        nomorSertifikat: '-',
        tanggalSertifikat: '-',
        nilaiSkor: '-',
        biayaProgram: prog?.biaya || 0,
        sumberDana: 'Mandiri / Google Public Registrant',
        pic: prog?.namaPic || 'Direktorat Pendidikan Non Gelar',
        keterangan: 'Pendaftaran Mandiri Publik via Google Login'
      };

      const res = createPeserta(newPesertaPayload, true);
      setIsSubmitting(false);

      if (res.success && res.data) {
        setRegisteredResult(res.data);
        if (onRefreshData) onRefreshData();
      } else {
        setErrorMessage(res.message || 'Gagal menyimpan pendaftaran.');
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#001D45] via-[#002B66] to-slate-900 text-slate-800 flex flex-col font-sans selection:bg-[#FDB913] selection:text-[#002B66]">
      {/* Top Navbar */}
      <header className="bg-[#002B66]/90 backdrop-blur-md border-b border-white/10 text-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UnpadLogo variant="light" size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-wide text-white">
                  PENDAFTARAN NON-GELAR
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FDB913] text-[#002B66]">
                  PUBLIK
                </span>
              </div>
              <p className="text-[10px] text-amber-200/90 font-medium hidden sm:block">
                Universitas Padjadjaran • Direktorat Pendidikan Non Gelar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Copy Public Link Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer border border-white/15"
              title="Salin tautan formulir pendaftaran ini untuk dibagikan"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-300" />}
              <span className="hidden md:inline">{copiedLink ? 'Link Tersalin!' : 'Bagikan Link'}</span>
            </button>

            {/* Back to Login Internal */}
            <button
              type="button"
              onClick={onBackToLogin}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FDB913] hover:bg-[#e2a40e] text-[#002B66] text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Login Staf / Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="py-8 px-4 sm:px-6 text-white text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 border border-white/15 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tahun Akademik {new Date().getFullYear()} / {new Date().getFullYear() + 1}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2 leading-tight">
          Formulir Pendaftaran Peserta Pendidikan Non Gelar
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Tingkatkan kompetensi profesional Anda melalui program sertifikasi, kursus intensif, pelatihan eksekutif, dan program Eduventure Universitas Padjadjaran.
        </p>

        {/* Tab Switcher: Daftar Baru vs Riwayat Saya */}
        <div className="flex justify-center mt-6">
          <div className="bg-white/10 p-1 rounded-xl backdrop-blur-md border border-white/20 flex gap-1">
            <button
              type="button"
              onClick={() => setActiveSubTab('form')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'form'
                  ? 'bg-[#FDB913] text-[#002B66] shadow-md'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Formulir Pendaftaran Baru</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('history')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'history'
                  ? 'bg-[#FDB913] text-[#002B66] shadow-md'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Status & Bukti Pendaftaran Saya</span>
              {myRegistrations.length > 0 && (
                <span className="bg-[#002B66] text-[#FDB913] px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                  {myRegistrations.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 pb-16">
        {/* Google Authentication Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-6">
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {googleUser ? (
                <div className="relative">
                  <img
                    src={googleUser.picture}
                    alt={googleUser.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] border-2 border-white">
                    ✓
                  </div>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
              )}

              <div>
                {googleUser ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-800">
                        {googleUser.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                        Google Verified
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {googleUser.email}
                    </span>
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-sm text-slate-800">
                      Login Google untuk Memulai Pendaftaran
                    </h3>
                    <p className="text-xs text-slate-500">
                      Gunakan akun Google aktif Anda agar bukti registrasi dan sertifikat terverifikasi otomatis.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div>
              {googleUser ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGoogleModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Ganti Akun
                  </button>
                  <button
                    type="button"
                    onClick={handleGoogleLogout}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Keluar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setGoogleModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 shadow-xs cursor-pointer transition-all hover:shadow-md"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Masuk dengan Google</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* View Mode: SUB-TAB 1: FORMULIR PENDAFTARAN */}
        {activeSubTab === 'form' && (
          <>
            {registeredResult ? (
              /* Success / Registration Card Slip */
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 bg-gradient-to-r from-emerald-600 to-[#002B66] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
                      <CheckCircle2 className="w-7 h-7 text-[#FDB913]" />
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider text-amber-300 font-bold">
                        Pendaftaran Berhasil Dikirimkan
                      </span>
                      <h2 className="text-xl font-black">
                        Bukti Registrasi Calon Peserta
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-[#FDB913] hover:bg-[#e2a40e] text-[#002B66] rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Bukti PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRegisteredResult(null);
                        setSelectedProgramId('');
                      }}
                      className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold"
                    >
                      Daftar Lagi
                    </button>
                  </div>
                </div>

                {/* Printable Slip Content */}
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Official Header Badge */}
                  <div className="border-b-2 border-[#002B66] pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UnpadLogo variant="dark" size="sm" />
                      <div>
                        <h3 className="font-black text-base text-[#002B66]">UNIVERSITAS PADJADJARAN</h3>
                        <p className="text-[11px] text-slate-500 font-medium">DIREKTORAT PENDIDIKAN NON GELAR & PELATIHAN BERKELANJUTAN</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Nomor Registrasi:</span>
                      <span className="font-mono font-black text-sm text-[#002B66] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {registeredResult.nomorRegistrasi}
                      </span>
                    </div>
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-[#002B66] uppercase text-[10px] tracking-wider block">
                        Identitas Calon Peserta
                      </span>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Nama Lengkap:</span>
                        <span className="font-bold text-slate-800 text-sm">{registeredResult.namaLengkap}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Email (Google Verified):</span>
                        <span className="font-semibold text-slate-700 font-mono">{registeredResult.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Nomor WhatsApp / HP:</span>
                        <span className="font-semibold text-slate-700">{registeredResult.nomorHp}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Asal Instansi:</span>
                        <span className="font-semibold text-slate-700">{registeredResult.instansi}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-[#002B66] uppercase text-[10px] tracking-wider block">
                        Program Pelatihan Pilihan
                      </span>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Nama Program:</span>
                        <span className="font-bold text-slate-800 text-sm">{registeredResult.namaProgram}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Kategori:</span>
                        <span className="font-semibold text-blue-700">{registeredResult.kategoriProgram}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Angkatan / Batch:</span>
                        <span className="font-semibold text-slate-700">{registeredResult.angkatanBatch} Tahun {registeredResult.tahun}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Status Registrasi:</span>
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                          {registeredResult.statusPeserta} (Menunggu Verifikasi)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-[#002B66]">
                      <AlertCircle className="w-4 h-4 text-[#FDB913]" />
                      <span>Petunjuk Selanjutnya untuk Peserta:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-700 leading-relaxed">
                      <li>Simpan atau cetak nomor registrasi ini sebagai bukti sah pengajuan pendaftaran.</li>
                      <li>Tim verifikator Direktorat Pendidikan Non Gelar Unpad akan memeriksa data Anda dalam 1x24 jam kerja.</li>
                      <li>Informasi jadwal pelaksanaan dan grup koordinasi pelatihan akan dikirimkan langsung ke email <strong>{registeredResult.email}</strong> dan nomor WhatsApp Anda.</li>
                    </ol>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 text-xs">
                    <span className="text-slate-400">
                      Waktu Registrasi: {registeredResult.createdAt || new Date().toLocaleString('id-ID')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('history')}
                      className="text-[#002B66] font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Lihat Riwayat & Status Registrasi Saya</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* The Registration Form */
              <form onSubmit={handleSubmitRegistration} className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="p-6 bg-[#002B66] text-white">
                  <h2 className="text-lg font-bold">Lengkapi Data Pendaftaran</h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Silakan isi data diri dan program pelatihan non-gelar yang ingin Anda ikuti dengan benar.
                  </p>
                </div>

                {errorMessage && (
                  <div className="m-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Bagian 1: Pilihan Program */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <span className="w-6 h-6 rounded-full bg-[#002B66] text-[#FDB913] flex items-center justify-center text-xs font-black">
                        1
                      </span>
                      <h3 className="font-bold text-sm text-[#002B66]">Pilihan Program Pelatihan</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Kategori Program <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={selectedKategori}
                          onChange={(e) => {
                            setSelectedKategori(e.target.value);
                            setSelectedProgramId('');
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden font-medium"
                        >
                          <option value="">-- Semua Kategori Program --</option>
                          {kategoriList.map(k => (
                            <option key={k.idKategori} value={k.namaKategori}>{k.namaKategori}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Nama Program Pelatihan <span className="text-rose-500">*</span>
                        </label>
                        <select
                          required
                          value={selectedProgramId}
                          onChange={(e) => {
                            const progId = e.target.value;
                            setSelectedProgramId(progId);
                            const found = programList.find(p => getProgId(p) === progId);
                            if (found && !selectedKategori) setSelectedKategori(getProgKategori(found));
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden font-medium"
                        >
                          <option value="">-- Pilih Program Pelatihan --</option>
                          {filteredPrograms.map(p => {
                            const pId = getProgId(p);
                            return (
                              <option key={pId} value={pId}>
                                {p.namaProgram} ({p.durasi || 'Non Gelar'})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Angkatan / Batch
                        </label>
                        <select
                          value={angkatanBatch}
                          onChange={(e) => setAngkatanBatch(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden"
                        >
                          <option value="Batch 1">Batch 1</option>
                          <option value="Batch 2">Batch 2</option>
                          <option value="Batch 3">Batch 3</option>
                          <option value="Reguler">Reguler</option>
                          <option value="Khusus Instansi">Khusus Instansi / Kemitraan</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Tahun Pelaksanaan
                        </label>
                        <input
                          type="number"
                          value={tahun}
                          onChange={(e) => setTahun(parseInt(e.target.value) || new Date().getFullYear())}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden font-mono"
                        />
                      </div>
                    </div>

                    {/* Program Information Card Preview */}
                    {selectedProgramObj && (
                      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-[#002B66] text-sm block">
                            {selectedProgramObj.namaProgram}
                          </span>
                          <span className="text-slate-600 block">
                            Kategori: <strong>{getProgKategori(selectedProgramObj)}</strong> • Durasi: <strong>{selectedProgramObj.durasi || 'Sesuai Jadwal'}</strong>
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-500 block">Biaya Investasi:</span>
                          <span className="font-bold text-[#002B66] text-sm">
                            {selectedProgramObj.biaya ? `Rp ${selectedProgramObj.biaya.toLocaleString('id-ID')}` : 'Sesuai Ketentuan Program'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bagian 2: Data Pribadi & Kontak */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <span className="w-6 h-6 rounded-full bg-[#002B66] text-[#FDB913] flex items-center justify-center text-xs font-black">
                        2
                      </span>
                      <h3 className="font-bold text-sm text-[#002B66]">Data Pribadi & Identitas</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="md:col-span-2">
                        <label className="block font-semibold text-slate-700 mb-1">
                          Nama Lengkap (Sesuai KTP / Ijazah) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={namaLengkap}
                          onChange={(e) => setNamaLengkap(e.target.value)}
                          placeholder="Masukkan nama lengkap tanpa gelar"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Gelar Depan
                        </label>
                        <input
                          type="text"
                          value={gelarDepan}
                          onChange={(e) => setGelarDepan(e.target.value)}
                          placeholder="Contoh: Dr., Ir., Prof."
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Gelar Belakang
                        </label>
                        <input
                          type="text"
                          value={gelarBelakang}
                          onChange={(e) => setGelarBelakang(e.target.value)}
                          placeholder="Contoh: S.Kom., M.T., Ph.D"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Email Terverifikasi (Google Account) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          readOnly
                          value={googleUser?.email || ''}
                          placeholder="Masuk dengan Google terlebih dahulu"
                          className="w-full px-3 py-2 border border-slate-200 bg-slate-100 text-slate-600 rounded-lg cursor-not-allowed font-mono font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Nomor WhatsApp / Telepon <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={nomorHp}
                          onChange={(e) => setNomorHp(e.target.value)}
                          placeholder="Contoh: 081234567890"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          NIK (KTP) 16 Digit <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={16}
                          value={nik}
                          onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                          placeholder="Nomor Induk Kependudukan 16 digit"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Pendidikan Terakhir
                        </label>
                        <select
                          value={pendidikanTerakhir}
                          onChange={(e) => setPendidikanTerakhir(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden"
                        >
                          <option value="SMA / SMK / Sederajat">SMA / SMK / Sederajat</option>
                          <option value="D3">Diploma 3 (D3)</option>
                          <option value="S1 / D4">Sarjana (S1 / D4)</option>
                          <option value="S2">Magister (S2)</option>
                          <option value="S3">Doktor (S3)</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Tempat Lahir
                        </label>
                        <input
                          type="text"
                          value={tempatLahir}
                          onChange={(e) => setTempatLahir(e.target.value)}
                          placeholder="Kota kelahiran"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Tanggal Lahir
                        </label>
                        <input
                          type="date"
                          value={tanggalLahir}
                          onChange={(e) => setTanggalLahir(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Jenis Kelamin
                        </label>
                        <div className="flex gap-4 pt-1.5">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="jenisKelamin"
                              checked={jenisKelamin === 'Laki-laki'}
                              onChange={() => setJenisKelamin('Laki-laki')}
                            />
                            <span>Laki-laki</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="jenisKelamin"
                              checked={jenisKelamin === 'Perempuan'}
                              onChange={() => setJenisKelamin('Perempuan')}
                            />
                            <span>Perempuan</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bagian 3: Instansi & Domisili */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <span className="w-6 h-6 rounded-full bg-[#002B66] text-[#FDB913] flex items-center justify-center text-xs font-black">
                        3
                      </span>
                      <h3 className="font-bold text-sm text-[#002B66]">Instansi Asal & Domisili</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Asal Instansi / Universitas / Lembaga <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={instansi}
                          onChange={(e) => setInstansi(e.target.value)}
                          placeholder="Contoh: Universitas Padjadjaran / PT Telkom / Mandiri"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Jabatan / Profesi Saat Ini
                        </label>
                        <input
                          type="text"
                          value={jabatan}
                          onChange={(e) => setJabatan(e.target.value)}
                          placeholder="Contoh: Staf IT / Dosen / Mahasiswa / Wirausaha"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Provinsi Domisili
                        </label>
                        <input
                          type="text"
                          value={provinsi}
                          onChange={(e) => setProvinsi(e.target.value)}
                          placeholder="Contoh: Jawa Barat"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Kota / Kabupaten Domisili
                        </label>
                        <input
                          type="text"
                          value={kotaKabupaten}
                          onChange={(e) => setKotaKabupaten(e.target.value)}
                          placeholder="Contoh: Kota Bandung / Sumedang"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block font-semibold text-slate-700 mb-1">
                          Alamat Lengkap
                        </label>
                        <textarea
                          rows={2}
                          value={alamat}
                          onChange={(e) => setAlamat(e.target.value)}
                          placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block font-semibold text-slate-700 mb-1">
                          Catatan Tambahan / Motivasi Mengikuti Program
                        </label>
                        <textarea
                          rows={2}
                          value={catatanMotivasi}
                          onChange={(e) => setCatatanMotivasi(e.target.value)}
                          placeholder="Jelaskan secara singkat harapan atau tujuan Anda mengikuti pelatihan ini..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Persetujuan Terms */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="flex items-start gap-3 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        required
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-0.5 rounded text-[#002B66] focus:ring-[#002B66] accent-[#FDB913]"
                      />
                      <span className="text-slate-700 leading-relaxed">
                        Saya menyatakan bahwa seluruh data yang diisikan adalah benar dan valid. Saya bersedia mengikuti tata tertib, jadwal pembelajaran, dan ketentuan resmi program Pendidikan Non Gelar Universitas Padjadjaran.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Submit Action Bar */}
                <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 text-center sm:text-left">
                    {googleUser ? (
                      <span>Terdaftar dengan akun Google: <strong className="text-slate-800">{googleUser.email}</strong></span>
                    ) : (
                      <span className="text-amber-700 font-semibold">⚠️ Anda harus masuk dengan Akun Google sebelum mengirim</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#002B66] hover:bg-[#001D45] text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-900/20 cursor-pointer transition-all hover:scale-102 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#FDB913]" />
                        <span>Memproses Pendaftaran...</span>
                      </>
                    ) : (
                      <>
                        <span>Kirimkan Pendaftaran Sekarang</span>
                        <ArrowRight className="w-4 h-4 text-[#FDB913]" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* View Mode: SUB-TAB 2: STATUS & RIWAYAT PENDAFTARAN SAYA */}
        {activeSubTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#002B66]">Riwayat Pendaftaran Anda</h2>
                <p className="text-xs text-slate-500">
                  Daftar program non-gelar yang terdaftar menggunakan akun Google Anda.
                </p>
              </div>

              {googleUser && (
                <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-[#002B66] font-mono border border-blue-200">
                  {googleUser.email}
                </span>
              )}
            </div>

            {!googleUser ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <h3 className="font-bold text-sm text-slate-800">Silakan Masuk dengan Google</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Untuk memeriksa status dan mengunduh bukti registrasi, Anda harus masuk menggunakan akun Google yang digunakan saat mendaftar.
                </p>
                <button
                  type="button"
                  onClick={() => setGoogleModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#002B66] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Login Google Sekarang</span>
                </button>
              </div>
            ) : myRegistrations.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <GraduationCap className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="font-bold text-sm text-slate-800">Belum Ada Program Terdaftar</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Akun <strong>{googleUser.email}</strong> belum memiliki riwayat pendaftaran program pelatihan non-gelar.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('form')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#002B66] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#FDB913]" />
                  <span>Buka Formulir Pendaftaran</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myRegistrations.map((p) => (
                  <div
                    key={p.id}
                    className="p-5 rounded-xl border border-slate-200 hover:border-blue-300 bg-white transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-[#002B66] border border-blue-200">
                          {p.nomorRegistrasi || p.id}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {p.kategoriProgram}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.statusPeserta === 'Terdaftar' ? 'bg-amber-100 text-amber-800' :
                          p.statusPeserta === 'Aktif' ? 'bg-blue-100 text-blue-800' :
                          p.statusPeserta === 'Lulus' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {p.statusPeserta}
                        </span>
                      </div>

                      <h4 className="font-bold text-base text-slate-900">
                        {p.namaProgram}
                      </h4>

                      <p className="text-xs text-slate-500">
                        Batch: <strong>{p.angkatanBatch} ({p.tahun})</strong> • Instansi: <strong>{p.instansi}</strong> • Tgl Daftar: <strong>{p.createdAt?.substring(0, 10) || '-'}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setRegisteredResult(p);
                          setActiveSubTab('form');
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#002B66] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak Bukti</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Google Login Simulation / Selector Modal */}
      {googleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-blue-600 to-[#002B66] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm">Masuk dengan Akun Google</h3>
                  <p className="text-[11px] text-blue-100">Pilih akun Google Anda untuk pendaftaran Unpad</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGoogleModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Pilih Akun yang Tersedia (One-Click SSO):
              </span>

              <div className="space-y-2">
                {DEFAULT_GOOGLE_PRESETS.map((preset) => (
                  <button
                    key={preset.email}
                    type="button"
                    onClick={() => handleGoogleLogin({
                      ...preset,
                      verified: true
                    })}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={preset.picture}
                        alt={preset.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-800 block group-hover:text-blue-700">
                          {preset.name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {preset.email}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold">
                  <span className="bg-white px-2 text-slate-400">Atau Masukkan Akun Google Lain</span>
                </div>
              </div>

              {/* Custom Google Account Form */}
              <form onSubmit={handleCustomGoogleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nama Lengkap Akun Google
                  </label>
                  <input
                    type="text"
                    required
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    placeholder="Contoh: Rina Melati"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Alamat Email Google (@gmail.com / domain instansi)
                  </label>
                  <input
                    type="email"
                    required
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="Contoh: rina.melati@gmail.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#002B66] hover:bg-[#001D45] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-[#FDB913]" />
                  <span>Gunakan Akun Ini & Lanjutkan</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
