import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  GraduationCap, CheckCircle2, AlertCircle, ArrowRight, UserCheck, 
  Building2, Phone, Mail, MapPin, Calendar, Award, Download, Printer, 
  ExternalLink, Copy, Check, LogOut, ChevronRight, Search, ShieldCheck, 
  Sparkles, FileText, ArrowLeft, RefreshCw, QrCode, BookOpen, Clock, Users,
  Plus, Upload, Eye, Trash2, FileCheck, AlertTriangle, ShieldAlert, Image as ImageIcon, X,
  Filter, CheckCircle, HelpCircle
} from 'lucide-react';
import { 
  Peserta, Kategori, Program, DokumenPendaftaranItem, DokumenPendaftaran, 
  StatusVerifikasiPendaftaran, SettingApp, PengaturanPendaftaran, StatusPendaftaranProgram 
} from '../types';
import { UnpadLogo } from './UnpadLogo';
import { createPeserta, updatePeserta, checkProgramRegistrationStatus, getSettings } from '../services/storageService';

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
  settings?: SettingApp;
  onBackToLogin: () => void;
  onRefreshData?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToMap?: () => void;
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
  settings,
  onBackToLogin,
  onRefreshData,
  onNavigateToDashboard,
  onNavigateToMap,
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

  // Document Upload States
  const [docKtp, setDocKtp] = useState<DokumenPendaftaranItem | null>(null);
  const [docKk, setDocKk] = useState<DokumenPendaftaranItem | null>(null);
  const [docPasPhoto, setDocPasPhoto] = useState<DokumenPendaftaranItem | null>(null);
  const [docIjazah, setDocIjazah] = useState<DokumenPendaftaranItem | null>(null);
  const [previewDocModal, setPreviewDocModal] = useState<{ title: string; doc: DokumenPendaftaranItem } | null>(null);
  const [repairPesertaTarget, setRepairPesertaTarget] = useState<Peserta | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredResult, setRegisteredResult] = useState<Peserta | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Link copy feedback
  const [copiedLink, setCopiedLink] = useState(false);

  // Document Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'ktp' | 'kk' | 'pas_photo' | 'ijazah') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 6 * 1024 * 1024) {
      setErrorMessage(`Ukuran file "${file.name}" melebihi batas maksimum 6 MB.`);
      return;
    }
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const docItem: DokumenPendaftaranItem = {
        namaFile: file.name,
        tipeDokumen: type,
        fileUrl: result,
        fileSize: `${Math.round(file.size / 1024)} KB`,
        uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        statusVerifikasiDokumen: 'Menunggu'
      };

      if (type === 'ktp') setDocKtp(docItem);
      if (type === 'kk') setDocKk(docItem);
      if (type === 'pas_photo') setDocPasPhoto(docItem);
      if (type === 'ijazah') setDocIjazah(docItem);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDoc = (type: 'ktp' | 'kk' | 'pas_photo' | 'ijazah') => {
    if (type === 'ktp') setDocKtp(null);
    if (type === 'kk') setDocKk(null);
    if (type === 'pas_photo') setDocPasPhoto(null);
    if (type === 'ijazah') setDocIjazah(null);
  };

  // Helper generator demo document
  const generateDemoDocument = (type: 'ktp' | 'kk' | 'pas_photo' | 'ijazah', nama: string): DokumenPendaftaranItem => {
    let title = '';
    let subtitle = '';
    let bgColor = '#002B66';
    let textColor = '#FDB913';

    if (type === 'ktp') {
      title = 'REPUBLIK INDONESIA - KTP ELEKTRONIK';
      subtitle = `NIK: ${nik || '3204123456780001'} - ${nama.toUpperCase() || 'CALON PESERTA'}`;
      bgColor = '#1e3a8a';
      textColor = '#ffffff';
    } else if (type === 'kk') {
      title = 'KARTU KELUARGA (KK) REPUBLIK INDONESIA';
      subtitle = `No. KK: 3204001928374651 - KEPALA KELUARGA: ${nama.toUpperCase() || 'KELUARGA'}`;
      bgColor = '#312e81';
      textColor = '#ffffff';
    } else if (type === 'pas_photo') {
      title = 'PAS PHOTO FORMAL RESMI';
      subtitle = `${nama.toUpperCase() || 'CALON PESERTA DPNG'} (LATAR MERAH)`;
      bgColor = '#b91c1c';
      textColor = '#ffffff';
    } else {
      title = 'IJAZAH PENDIDIKAN RESMI';
      subtitle = `${pendidikanTerakhir || 'Sarjana (S1)'} - ${nama.toUpperCase() || 'LULUSAN'}`;
      bgColor = '#047857';
      textColor = '#ffffff';
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="${bgColor}"/>
      <rect x="20" y="20" width="560" height="360" rx="12" fill="none" stroke="${textColor}" stroke-width="4" stroke-dasharray="8 8"/>
      <circle cx="300" cy="130" r="45" fill="${textColor}" opacity="0.25"/>
      <text x="300" y="140" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="${textColor}" text-anchor="middle">UNPAD DPNG</text>
      <text x="300" y="220" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">${title}</text>
      <text x="300" y="255" font-family="Arial, sans-serif" font-size="14" fill="#cbd5e1" text-anchor="middle">${subtitle}</text>
      <text x="300" y="320" font-family="Arial, sans-serif" font-size="12" fill="${textColor}" text-anchor="middle">BERKAS TERVERIFIKASI SISTEM DIGITAL</text>
    </svg>`;

    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

    const fileNames = {
      ktp: `KTP_${(nama || 'Peserta').replace(/\s+/g, '_')}.png`,
      kk: `KK_${(nama || 'Keluarga').replace(/\s+/g, '_')}.png`,
      pas_photo: `Foto_${(nama || 'Peserta').replace(/\s+/g, '_')}.png`,
      ijazah: `Ijazah_${(nama || 'Lulusan').replace(/\s+/g, '_')}.png`,
    };

    return {
      namaFile: fileNames[type],
      tipeDokumen: type,
      fileUrl: dataUrl,
      fileSize: '142 KB',
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      statusVerifikasiDokumen: 'Menunggu'
    };
  };

  const handleUseDemoDocuments = () => {
    const nama = namaLengkap || googleUser?.name || 'Peserta Non Gelar';
    setDocKtp(generateDemoDocument('ktp', nama));
    setDocKk(generateDemoDocument('kk', nama));
    setDocPasPhoto(generateDemoDocument('pas_photo', nama));
    setDocIjazah(generateDemoDocument('ijazah', nama));
  };

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

  // Effective App Settings and Registration Configuration from Admin
  const currentSettings = useMemo(() => {
    return settings || getSettings();
  }, [settings]);

  const regConfig: PengaturanPendaftaran = useMemo(() => {
    return currentSettings.pengaturanPendaftaran || {
      statusPendaftaranGlobal: 'Buka',
      pesanPendaftaranDitutup: 'Pendaftaran program pelatihan pendidikan non-gelar Universitas Padjadjaran sedang ditutup sementara.',
      autoTutupJikaLewatDeadline: true,
      autoTutupJikaKuotaPenuh: true,
      kontakBantuanWa: '081224681357',
      kontakBantuanEmail: 'dpng@unpad.ac.id',
      pengumumanPendaftaran: 'Pendaftaran Program Pelatihan Pendidikan Non Gelar Unpad Tahun 2026 telah dibuka. Silakan pilih kategori dan program yang tersedia.',
      tampilkanSisaKuotaPublik: true,
      tampilkanPeriodePublik: true,
    };
  }, [currentSettings]);

  // Filter toggle: Hanya tampilkan program yang sedang BUKA
  const [filterHanyaBuka, setFilterHanyaBuka] = useState<boolean>(true);

  // Status mapping for all programs based on admin configuration
  const programStatusMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof checkProgramRegistrationStatus>>();
    programList.forEach(prog => {
      const pId = getProgId(prog);
      const kat = kategoriList.find(k => k.idKategori === prog.idKategori || k.namaKategori === getProgKategori(prog));
      const stat = checkProgramRegistrationStatus(prog, kat, currentSettings, allPesertaList);
      map.set(pId, stat);
    });
    return map;
  }, [programList, kategoriList, currentSettings, allPesertaList]);

  // Selected Category Object & its admin status
  const selectedKategoriObj = useMemo(() => {
    if (!selectedKategori) return null;
    return kategoriList.find(k => k.namaKategori === selectedKategori || k.idKategori === selectedKategori) || null;
  }, [kategoriList, selectedKategori]);

  const isSelectedCategoryClosed = useMemo(() => {
    return selectedKategoriObj?.statusPendaftaranKategori === 'Tutup';
  }, [selectedKategoriObj]);

  // Selected Program Object & its admin status
  const selectedProgramObj = useMemo(() => {
    return programList.find(p => getProgId(p) === selectedProgramId);
  }, [programList, selectedProgramId]);

  const selectedProgramStatus = useMemo(() => {
    if (!selectedProgramObj) return null;
    return programStatusMap.get(getProgId(selectedProgramObj)) || checkProgramRegistrationStatus(selectedProgramObj, selectedKategoriObj || undefined, currentSettings, allPesertaList);
  }, [selectedProgramObj, selectedKategoriObj, programStatusMap, currentSettings, allPesertaList]);

  // Filtered Programs based on selected category and admin open/closed settings
  const filteredPrograms = useMemo(() => {
    let list = programList;
    if (selectedKategori) {
      list = list.filter(p => getProgKategori(p) === selectedKategori || p.idKategori === selectedKategori);
    }
    if (filterHanyaBuka) {
      list = list.filter(p => {
        const stat = programStatusMap.get(getProgId(p));
        return stat ? stat.isOpen : true;
      });
    }
    return list;
  }, [programList, selectedKategori, kategoriList, filterHanyaBuka, programStatusMap]);

  // Total Open Programs Count
  const openProgramsCount = useMemo(() => {
    let count = 0;
    programList.forEach(p => {
      const stat = programStatusMap.get(getProgId(p));
      if (stat?.isOpen) count++;
    });
    return count;
  }, [programList, programStatusMap]);

  // Whether registration submission is blocked by admin rules
  const isRegistrationBlocked = useMemo(() => {
    if (regConfig.statusPendaftaranGlobal === 'Tutup') return true;
    if (isSelectedCategoryClosed) return true;
    if (selectedProgramStatus && !selectedProgramStatus.isOpen) return true;
    return false;
  }, [regConfig.statusPendaftaranGlobal, isSelectedCategoryClosed, selectedProgramStatus]);

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

    // Validasi Pengaturan Buka/Tutup Admin
    if (regConfig.statusPendaftaranGlobal === 'Tutup') {
      setErrorMessage(`Pendaftaran Ditutup: ${regConfig.pesanPendaftaranDitutup || 'Pendaftaran seluruh program sedang ditutup sementara oleh Administrator.'}`);
      return;
    }

    if (isSelectedCategoryClosed) {
      setErrorMessage(`Kategori Ditutup: Pendaftaran untuk seluruh program dalam kategori "${selectedKategoriObj?.namaKategori}" sedang ditutup oleh pihak Administrator.`);
      return;
    }

    if (selectedProgramStatus && !selectedProgramStatus.isOpen) {
      setErrorMessage(`Pendaftaran Tidak Dapat Diproses: ${selectedProgramStatus.reason || 'Program pelatihan yang Anda pilih saat ini sedang tidak menerima pendaftaran baru.'}`);
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
        statusVerifikasi: 'Menunggu Verifikasi',
        dokumen: {
          ktp: docKtp || generateDemoDocument('ktp', namaLengkap),
          kartuKeluarga: docKk || generateDemoDocument('kk', namaLengkap),
          pasPhoto: docPasPhoto || generateDemoDocument('pas_photo', namaLengkap),
          ijazahTerakhir: docIjazah || generateDemoDocument('ijazah', namaLengkap)
        },
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

          <div className="flex items-center gap-2 flex-wrap">
            {onNavigateToDashboard && (
              <button
                type="button"
                onClick={onNavigateToDashboard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer border border-white/15"
                title="Buka Dashboard Statistik Publik"
              >
                <span>📊 Dashboard Publik</span>
              </button>
            )}

            {onNavigateToMap && (
              <button
                type="button"
                onClick={onNavigateToMap}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer border border-white/15"
                title="Buka Peta Sebaran Mitra & Peserta Publik"
              >
                <span>🗺️ Peta Mitra</span>
              </button>
            )}

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
        {/* Admin Announcement / Registration Status Notice */}
        {regConfig.statusPendaftaranGlobal === 'Tutup' ? (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 mb-6 text-rose-900 shadow-md">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-rose-100 rounded-xl text-rose-700 shrink-0 mt-0.5">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black text-base text-rose-950">
                    Pemberitahuan: Pendaftaran Program Pelatihan Sedang Ditutup Sementara
                  </h3>
                  <span className="px-2 py-0.5 bg-rose-200 text-rose-900 font-bold text-[10px] rounded-full">
                    Ditutup Global
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-rose-800 leading-relaxed">
                  {regConfig.pesanPendaftaranDitutup || 'Pendaftaran seluruh program pendidikan non-gelar Universitas Padjadjaran sedang ditutup sementara oleh Administrator. Silakan pantau pengumuman resmi atau hubungi narahubung kami.'}
                </p>
                {(regConfig.kontakBantuanWa || regConfig.kontakBantuanEmail) && (
                  <div className="mt-3 pt-3 border-t border-rose-200 flex flex-wrap items-center gap-3 text-xs font-semibold">
                    <span className="text-rose-900">Pusat Bantuan & Informasi:</span>
                    {regConfig.kontakBantuanWa && (
                      <a 
                        href={`https://wa.me/${regConfig.kontakBantuanWa.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-rose-300 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp: {regConfig.kontakBantuanWa}</span>
                      </a>
                    )}
                    {regConfig.kontakBantuanEmail && (
                      <a 
                        href={`mailto:${regConfig.kontakBantuanEmail}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-rose-300 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                        <span>Email: {regConfig.kontakBantuanEmail}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : regConfig.pengumumanPendaftaran ? (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 sm:p-5 mb-6 text-slate-800 shadow-xs flex items-start gap-3.5">
            <div className="p-2 bg-[#002B66] text-[#FDB913] rounded-xl shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 text-xs sm:text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-[#002B66] text-sm">Pengumuman Pendaftaran Peserta</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full border border-emerald-300">
                  Pendaftaran Dibuka
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {regConfig.pengumumanPendaftaran}
              </p>
            </div>
          </div>
        ) : null}

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
                  {/* Bagian 1: Pilihan Program Pelatihan (Disesuaikan dengan Pengaturan Admin) */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#002B66] text-[#FDB913] flex items-center justify-center text-xs font-black">
                          1
                        </span>
                        <h3 className="font-bold text-sm text-[#002B66]">Pilihan Program Pelatihan</h3>
                      </div>

                      {/* Filter Toggle: Saring hanya yang buka */}
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors self-start sm:self-auto select-none">
                        <input
                          type="checkbox"
                          checked={filterHanyaBuka}
                          onChange={(e) => setFilterHanyaBuka(e.target.checked)}
                          className="rounded text-[#002B66] focus:ring-[#002B66] accent-[#002B66] w-3.5 h-3.5 cursor-pointer"
                        />
                        <span>Hanya Program Buka ({openProgramsCount} dari {programList.length})</span>
                      </label>
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
                          {kategoriList.map(k => {
                            const isCatClosed = k.statusPendaftaranKategori === 'Tutup';
                            return (
                              <option key={k.idKategori} value={k.namaKategori}>
                                {k.namaKategori} {isCatClosed ? '🔴 (Pendaftaran Ditutup)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-semibold text-slate-700">
                            Nama Program Pelatihan <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-[10px] text-slate-500">
                            Tersedia: {filteredPrograms.length} program
                          </span>
                        </div>
                        <select
                          required
                          value={selectedProgramId}
                          onChange={(e) => {
                            const progId = e.target.value;
                            setSelectedProgramId(progId);
                            const found = programList.find(p => getProgId(p) === progId);
                            if (found && !selectedKategori) setSelectedKategori(getProgKategori(found));
                          }}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden font-medium ${
                            selectedProgramStatus && !selectedProgramStatus.isOpen
                              ? 'border-rose-300 bg-rose-50/20'
                              : 'border-slate-300'
                          }`}
                        >
                          <option value="">-- Pilih Program Pelatihan --</option>
                          {filteredPrograms.map(p => {
                            const pId = getProgId(p);
                            const stat = programStatusMap.get(pId);
                            const isOpen = stat?.isOpen ?? true;
                            const statusLabel = stat?.status || 'Buka';
                            const quotaText = (regConfig.tampilkanSisaKuotaPublik && stat?.sisaKuota !== undefined)
                              ? ` • Sisa: ${stat.sisaKuota}`
                              : '';

                            return (
                              <option 
                                key={pId} 
                                value={pId}
                                className={isOpen ? 'text-slate-900 font-medium' : 'text-slate-400 italic'}
                              >
                                {isOpen ? '🟢 [BUKA]' : `🔴 [${statusLabel.toUpperCase()}]`} {p.namaProgram} ({p.durasi || 'Non Gelar'}){quotaText}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Category Closed Warning Notice */}
                      {isSelectedCategoryClosed && (
                        <div className="md:col-span-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold block">Pendaftaran Kategori Ini Sedang Ditutup</span>
                            <span className="text-[11px] text-rose-700 leading-relaxed block">
                              Seluruh program di bawah kategori "{selectedKategoriObj?.namaKategori}" saat ini tidak menerima pendaftaran baru berdasarkan pengaturan Administrator.
                            </span>
                          </div>
                        </div>
                      )}

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

                    {/* Program Information Card Preview with Realtime Admin Settings */}
                    {selectedProgramObj && (
                      <div className={`rounded-xl p-4 border transition-all space-y-3 text-xs ${
                        selectedProgramStatus?.isOpen
                          ? 'bg-gradient-to-r from-emerald-50/60 to-blue-50/60 border-emerald-200'
                          : 'bg-rose-50/80 border-rose-200'
                      }`}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-[#002B66] text-sm block">
                                {selectedProgramObj.namaProgram}
                              </span>
                              
                              {/* Status Badge from Admin */}
                              {selectedProgramStatus?.isOpen ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>Pendaftaran Dibuka</span>
                                </span>
                              ) : selectedProgramStatus?.status === 'Segera Dibuka' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Segera Dibuka</span>
                                </span>
                              ) : selectedProgramStatus?.status === 'Penuh' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800 border border-slate-300">
                                  <Users className="w-3 h-3 text-slate-600" />
                                  <span>Kuota Terpenuhi</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  <X className="w-3 h-3 text-rose-600" />
                                  <span>Pendaftaran Ditutup</span>
                                </span>
                              )}
                            </div>

                            <span className="text-slate-600 block">
                              Kategori: <strong>{getProgKategori(selectedProgramObj)}</strong> • Durasi: <strong>{selectedProgramObj.durasi || 'Sesuai Jadwal'}</strong>
                            </span>
                          </div>

                          <div className="text-left sm:text-right shrink-0">
                            <span className="text-[10px] text-slate-500 block">Biaya Investasi:</span>
                            <span className="font-bold text-[#002B66] text-sm">
                              {selectedProgramObj.biaya ? `Rp ${selectedProgramObj.biaya.toLocaleString('id-ID')}` : 'Sesuai Ketentuan Program'}
                            </span>
                          </div>
                        </div>

                        {/* Closed Reason Notice if not open */}
                        {!selectedProgramStatus?.isOpen && (
                          <div className="p-2.5 bg-rose-100/70 border border-rose-200 rounded-lg text-rose-900 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="text-[11px] leading-relaxed">
                              <strong>Alasan Penutupan:</strong> {selectedProgramStatus?.reason || 'Program ini sedang tidak menerima registrasi baru berdasarkan jadwal atau kuota.'}
                            </div>
                          </div>
                        )}

                        {/* Metadata Rows: Periode Pendaftaran & Kuota */}
                        <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-600">
                          {regConfig.tampilkanPeriodePublik && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>
                                Periode: <strong>{selectedProgramObj.tanggalBukaPendaftaran || 'Buka'}</strong> s/d <strong>{selectedProgramObj.tanggalTutupPendaftaran || 'Selesai'}</strong>
                              </span>
                            </div>
                          )}

                          {regConfig.tampilkanSisaKuotaPublik && selectedProgramStatus && (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Sisa Kuota: <strong>{selectedProgramStatus.sisaKuota ?? 0}</strong> kursi</span>
                                </span>
                                <span className="font-mono text-[10px] text-slate-500">
                                  {selectedProgramStatus.totalTerdaftar} / {selectedProgramStatus.kuotaTotal || selectedProgramObj.kuotaPeserta || 30}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    (selectedProgramStatus.sisaKuota ?? 0) <= 0 
                                      ? 'bg-rose-500' 
                                      : (selectedProgramStatus.sisaKuota ?? 0) <= 5 
                                        ? 'bg-amber-500' 
                                        : 'bg-emerald-500'
                                  }`}
                                  style={{
                                    width: `${Math.min(100, Math.round((selectedProgramStatus.totalTerdaftar / (selectedProgramStatus.kuotaTotal || selectedProgramObj.kuotaPeserta || 30)) * 100))}%`
                                  }}
                                />
                              </div>
                            </div>
                          )}
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

                  {/* Bagian 4: Dokumen Persyaratan Pendaftaran (Upload Berkas) */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#002B66] text-[#FDB913] flex items-center justify-center text-xs font-black">
                          4
                        </span>
                        <div>
                          <h3 className="font-bold text-sm text-[#002B66]">Dokumen Persyaratan Pendaftaran (Upload Berkas)</h3>
                          <p className="text-[11px] text-slate-500">
                            Unggah berkas resmi untuk proses verifikasi oleh Admin atau PIC Koordinator Program.
                          </p>
                        </div>
                      </div>

                      {/* Demo Document Auto-Fill Button */}
                      <button
                        type="button"
                        onClick={handleUseDemoDocuments}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#002B66] text-xs font-bold border border-amber-300 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
                        title="Isi otomatis 4 dokumen simulasi resmi berformat SVG/PNG untuk pengujian cepat"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Gunakan Dokumen Demo (Simulasi Cepat)</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* 1. Upload KTP */}
                      <div className={`p-4 rounded-xl border-2 transition-all ${
                        docKtp ? 'border-emerald-300 bg-emerald-50/40' : 'border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center text-[10px]">1</span>
                            <span>KTP (Kartu Tanda Penduduk) <span className="text-rose-500">*</span></span>
                          </label>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            docKtp ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {docKtp ? '✓ Terunggah' : 'Wajib'}
                          </span>
                        </div>

                        {docKtp ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-emerald-200">
                              <div className="w-14 h-10 rounded bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                {docKtp.fileUrl && docKtp.fileUrl.startsWith('data:image') ? (
                                  <img src={docKtp.fileUrl} alt="Preview KTP" className="w-full h-full object-cover" />
                                ) : (
                                  <FileText className="w-5 h-5 text-blue-800" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-800 truncate text-[11px]">{docKtp.namaFile}</p>
                                <p className="text-[10px] text-slate-500">{docKtp.fileSize} • Terlampir</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewDocModal({ title: 'KTP (Kartu Tanda Penduduk)', doc: docKtp })}
                                className="flex-1 py-1.5 px-2 bg-[#002B66] text-white hover:bg-[#001D45] rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3 text-[#FDB913]" />
                                <span>Pratinjau KTP</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveDoc('ktp')}
                                className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 cursor-pointer"
                                title="Hapus berkas KTP"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="flex flex-col items-center justify-center py-4 px-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 cursor-pointer transition-colors text-center group">
                              <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#002B66] transition-colors mb-1" />
                              <span className="font-bold text-slate-700 text-xs">Pilih File KTP Asli / Scan</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">Format: JPG, PNG, PDF (Maks. 5MB)</span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => handleFileUpload(e, 'ktp')}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}
                      </div>

                      {/* 2. Upload Kartu Keluarga */}
                      <div className={`p-4 rounded-xl border-2 transition-all ${
                        docKk ? 'border-emerald-300 bg-emerald-50/40' : 'border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-900 font-bold flex items-center justify-center text-[10px]">2</span>
                            <span>Kartu Keluarga (KK) <span className="text-rose-500">*</span></span>
                          </label>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            docKk ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {docKk ? '✓ Terunggah' : 'Wajib'}
                          </span>
                        </div>

                        {docKk ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-emerald-200">
                              <div className="w-14 h-10 rounded bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                {docKk.fileUrl && docKk.fileUrl.startsWith('data:image') ? (
                                  <img src={docKk.fileUrl} alt="Preview KK" className="w-full h-full object-cover" />
                                ) : (
                                  <FileText className="w-5 h-5 text-purple-800" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-800 truncate text-[11px]">{docKk.namaFile}</p>
                                <p className="text-[10px] text-slate-500">{docKk.fileSize} • Terlampir</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewDocModal({ title: 'Kartu Keluarga (KK)', doc: docKk })}
                                className="flex-1 py-1.5 px-2 bg-[#002B66] text-white hover:bg-[#001D45] rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3 text-[#FDB913]" />
                                <span>Pratinjau KK</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveDoc('kk')}
                                className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 cursor-pointer"
                                title="Hapus berkas KK"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="flex flex-col items-center justify-center py-4 px-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 cursor-pointer transition-colors text-center group">
                              <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#002B66] transition-colors mb-1" />
                              <span className="font-bold text-slate-700 text-xs">Pilih File Kartu Keluarga</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">Format: JPG, PNG, PDF (Maks. 5MB)</span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => handleFileUpload(e, 'kk')}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}
                      </div>

                      {/* 3. Upload Pas Photo */}
                      <div className={`p-4 rounded-xl border-2 transition-all ${
                        docPasPhoto ? 'border-emerald-300 bg-emerald-50/40' : 'border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-red-100 text-red-900 font-bold flex items-center justify-center text-[10px]">3</span>
                            <span>Pas Photo Formal (Latar Merah / Biru) <span className="text-rose-500">*</span></span>
                          </label>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            docPasPhoto ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {docPasPhoto ? '✓ Terunggah' : 'Wajib'}
                          </span>
                        </div>

                        {docPasPhoto ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-emerald-200">
                              <div className="w-14 h-10 rounded bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                {docPasPhoto.fileUrl && docPasPhoto.fileUrl.startsWith('data:image') ? (
                                  <img src={docPasPhoto.fileUrl} alt="Preview Foto" className="w-full h-full object-cover" />
                                ) : (
                                  <ImageIcon className="w-5 h-5 text-red-700" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-800 truncate text-[11px]">{docPasPhoto.namaFile}</p>
                                <p className="text-[10px] text-slate-500">{docPasPhoto.fileSize} • Foto Formal</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewDocModal({ title: 'Pas Photo Formal (Foto Resmi)', doc: docPasPhoto })}
                                className="flex-1 py-1.5 px-2 bg-[#002B66] text-white hover:bg-[#001D45] rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3 text-[#FDB913]" />
                                <span>Pratinjau Foto</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveDoc('pas_photo')}
                                className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 cursor-pointer"
                                title="Hapus Pas Photo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="flex flex-col items-center justify-center py-4 px-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 cursor-pointer transition-colors text-center group">
                              <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#002B66] transition-colors mb-1" />
                              <span className="font-bold text-slate-700 text-xs">Pilih Pas Photo (Ukuran 4x6 / 3x4)</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">Format: JPG, PNG (Maks. 5MB)</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, 'pas_photo')}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}
                      </div>

                      {/* 4. Upload Ijazah Terakhir */}
                      <div className={`p-4 rounded-xl border-2 transition-all ${
                        docIjazah ? 'border-emerald-300 bg-emerald-50/40' : 'border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center text-[10px]">4</span>
                            <span>Ijazah Terakhir ({pendidikanTerakhir}) <span className="text-rose-500">*</span></span>
                          </label>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            docIjazah ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {docIjazah ? '✓ Terunggah' : 'Wajib'}
                          </span>
                        </div>

                        {docIjazah ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-emerald-200">
                              <div className="w-14 h-10 rounded bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                {docIjazah.fileUrl && docIjazah.fileUrl.startsWith('data:image') ? (
                                  <img src={docIjazah.fileUrl} alt="Preview Ijazah" className="w-full h-full object-cover" />
                                ) : (
                                  <GraduationCap className="w-5 h-5 text-emerald-800" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-800 truncate text-[11px]">{docIjazah.namaFile}</p>
                                <p className="text-[10px] text-slate-500">{docIjazah.fileSize} • Scan Ijazah</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewDocModal({ title: `Ijazah Terakhir (${pendidikanTerakhir})`, doc: docIjazah })}
                                className="flex-1 py-1.5 px-2 bg-[#002B66] text-white hover:bg-[#001D45] rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3 text-[#FDB913]" />
                                <span>Pratinjau Ijazah</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveDoc('ijazah')}
                                className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 cursor-pointer"
                                title="Hapus berkas Ijazah"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="flex flex-col items-center justify-center py-4 px-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 cursor-pointer transition-colors text-center group">
                              <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#002B66] transition-colors mb-1" />
                              <span className="font-bold text-slate-700 text-xs">Pilih File Scan Ijazah Asli</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">Format: JPG, PNG, PDF (Maks. 5MB)</span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => handleFileUpload(e, 'ijazah')}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2 text-xs text-blue-900">
                      <ShieldCheck className="w-4 h-4 text-[#002B66] shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-relaxed">
                        Seluruh berkas dokumen yang diunggah akan dienkripsi dan diproses verifikasi oleh <strong>Administrator DPNG</strong> dan <strong>PIC Koordinator Program</strong> sebelum status pendaftaran dinyatakan aktif.
                      </p>
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
                <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-slate-500 text-center sm:text-left">
                      {googleUser ? (
                        <span>Terdaftar dengan akun Google: <strong className="text-slate-800">{googleUser.email}</strong></span>
                      ) : (
                        <span className="text-amber-700 font-semibold">⚠️ Anda harus masuk dengan Akun Google sebelum mengirim</span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || isRegistrationBlocked}
                      className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-xs font-bold shadow-lg transition-all ${
                        isRegistrationBlocked
                          ? 'bg-slate-300 text-slate-500 border border-slate-300 cursor-not-allowed shadow-none'
                          : 'bg-[#002B66] hover:bg-[#001D45] text-white shadow-blue-900/20 cursor-pointer hover:scale-102 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-[#FDB913]" />
                          <span>Memproses Pendaftaran...</span>
                        </>
                      ) : isRegistrationBlocked ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-500" />
                          <span>Pendaftaran Ditutup ({selectedProgramStatus?.status || 'Tutup'})</span>
                        </>
                      ) : (
                        <>
                          <span>Kirimkan Pendaftaran Sekarang</span>
                          <ArrowRight className="w-4 h-4 text-[#FDB913]" />
                        </>
                      )}
                    </button>
                  </div>

                  {isRegistrationBlocked && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>
                          {selectedProgramStatus?.reason || regConfig.pesanPendaftaranDitutup || 'Program atau kategori yang Anda pilih saat ini sedang tidak membuka pendaftaran baru.'}
                        </span>
                      </div>
                      {(regConfig.kontakBantuanWa || regConfig.kontakBantuanEmail) && (
                        <span className="text-[11px] text-slate-500 shrink-0">
                          Hubungi Bantuan: {regConfig.kontakBantuanWa || regConfig.kontakBantuanEmail}
                        </span>
                      )}
                    </div>
                  )}
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
                {myRegistrations.map((p) => {
                  const verifStatus = p.statusVerifikasi || 'Menunggu Verifikasi';
                  const docKtpItem = p.dokumen?.ktp;
                  const docKkItem = p.dokumen?.kartuKeluarga;
                  const docPhotoItem = p.dokumen?.pasPhoto;
                  const docIjazahItem = p.dokumen?.ijazahTerakhir;

                  return (
                    <div
                      key={p.id}
                      className="p-5 rounded-xl border border-slate-200 hover:border-blue-300 bg-white transition-all shadow-xs flex flex-col gap-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-[#002B66] border border-blue-200">
                              {p.nomorRegistrasi || p.id}
                            </span>
                            <span className="text-xs font-bold text-slate-700">
                              {p.kategoriProgram}
                            </span>
                            {/* Verification Status Badge */}
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                              verifStatus === 'Terverifikasi'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : verifStatus === 'Perlu Perbaikan'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : verifStatus === 'Ditolak'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}>
                              <ShieldCheck className="w-3 h-3" />
                              <span>{verifStatus}</span>
                            </span>
                          </div>

                          <h4 className="font-bold text-base text-slate-900">
                            {p.namaProgram}
                          </h4>

                          <p className="text-xs text-slate-500">
                            Batch: <strong>{p.angkatanBatch} ({p.tahun})</strong> • Instansi: <strong>{p.instansi}</strong> • Tgl Daftar: <strong>{p.createdAt?.substring(0, 10) || '-'}</strong>
                          </p>

                          {/* Verification Notes from Admin / PIC */}
                          {p.catatanVerifikasi && (
                            <div className="mt-2 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Catatan Tim Verifikator ({p.verifikatorNama || 'Admin / PIC'}):</span>
                                <p className="italic mt-0.5">&ldquo;{p.catatanVerifikasi}&rdquo;</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                          {verifStatus === 'Perlu Perbaikan' && (
                            <button
                              type="button"
                              onClick={() => setRepairPesertaTarget(p)}
                              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Perbaiki Berkas</span>
                            </button>
                          )}

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

                      {/* Document Attachment Chips */}
                      <div className="pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap text-[11px]">
                        <span className="font-bold text-slate-400 uppercase text-[10px]">Dokumen Terlampir:</span>
                        
                        {docKtpItem ? (
                          <button
                            type="button"
                            onClick={() => setPreviewDocModal({ title: 'KTP (Kartu Tanda Penduduk)', doc: docKtpItem })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#002B66] rounded-md border border-slate-200 cursor-pointer transition-colors"
                          >
                            <FileText className="w-3 h-3 text-[#002B66]" />
                            <span>KTP: {docKtpItem.namaFile}</span>
                            <Eye className="w-3 h-3 text-slate-400 ml-0.5" />
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px]">KTP: -</span>
                        )}

                        {docKkItem ? (
                          <button
                            type="button"
                            onClick={() => setPreviewDocModal({ title: 'Kartu Keluarga (KK)', doc: docKkItem })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#002B66] rounded-md border border-slate-200 cursor-pointer transition-colors"
                          >
                            <FileText className="w-3 h-3 text-purple-700" />
                            <span>KK: {docKkItem.namaFile}</span>
                            <Eye className="w-3 h-3 text-slate-400 ml-0.5" />
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px]">KK: -</span>
                        )}

                        {docPhotoItem ? (
                          <button
                            type="button"
                            onClick={() => setPreviewDocModal({ title: 'Pas Photo Formal', doc: docPhotoItem })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#002B66] rounded-md border border-slate-200 cursor-pointer transition-colors"
                          >
                            <ImageIcon className="w-3 h-3 text-rose-600" />
                            <span>Pas Photo: {docPhotoItem.namaFile}</span>
                            <Eye className="w-3 h-3 text-slate-400 ml-0.5" />
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px]">Foto: -</span>
                        )}

                        {docIjazahItem ? (
                          <button
                            type="button"
                            onClick={() => setPreviewDocModal({ title: 'Ijazah Terakhir', doc: docIjazahItem })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#002B66] rounded-md border border-slate-200 cursor-pointer transition-colors"
                          >
                            <GraduationCap className="w-3 h-3 text-emerald-700" />
                            <span>Ijazah: {docIjazahItem.namaFile}</span>
                            <Eye className="w-3 h-3 text-slate-400 ml-0.5" />
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px]">Ijazah: -</span>
                        )}
                      </div>
                    </div>
                  );
                })}
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

      {/* Lightbox / Document Preview Modal */}
      {previewDocModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#002B66] text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">{previewDocModal.title}</h4>
                <p className="text-[11px] text-amber-200 font-mono truncate max-w-md">
                  {previewDocModal.doc.namaFile} • {previewDocModal.doc.fileSize || 'Ukuran Standar'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {previewDocModal.doc.fileUrl && (
                  <a
                    href={previewDocModal.doc.fileUrl}
                    download={previewDocModal.doc.namaFile}
                    className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
                    title="Unduh Berkas"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewDocModal(null)}
                  className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-900/10 min-h-[300px]">
              {previewDocModal.doc.fileUrl ? (
                previewDocModal.doc.fileUrl.startsWith('data:image') || previewDocModal.doc.namaFile.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                  <img
                    src={previewDocModal.doc.fileUrl}
                    alt={previewDocModal.title}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md border border-slate-200 bg-white"
                  />
                ) : (
                  <div className="text-center p-8 bg-white rounded-xl shadow-xs border border-slate-200 space-y-3">
                    <FileText className="w-16 h-16 text-[#002B66] mx-auto" />
                    <div>
                      <h5 className="font-bold text-slate-800 text-sm">{previewDocModal.doc.namaFile}</h5>
                      <p className="text-xs text-slate-500 mt-1">Dokumen format PDF / Dokumen Resmi Terlampir</p>
                    </div>
                    <a
                      href={previewDocModal.doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#002B66] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-[#001D45]"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#FDB913]" />
                      <span>Buka Dokumen PDF di Tab Baru</span>
                    </a>
                  </div>
                )
              ) : (
                <div className="text-center p-6 text-slate-400">Berkas tidak memiliki data preview</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Perbaikan Berkas Pendaftaran */}
      {repairPesertaTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[70] animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 bg-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-white" />
                <div>
                  <h4 className="font-bold text-sm">Unggah Perbaikan Berkas Dokumen</h4>
                  <p className="text-[11px] text-amber-100">{repairPesertaTarget.namaProgram}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRepairPesertaTarget(null)}
                className="text-white/80 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {repairPesertaTarget.catatanVerifikasi && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                  <span className="font-bold block text-[11px] text-amber-800 uppercase">Catatan Verifikator:</span>
                  <p className="mt-0.5 italic text-xs">&ldquo;{repairPesertaTarget.catatanVerifikasi}&rdquo;</p>
                </div>
              )}

              <p className="text-slate-600">
                Silakan pilih berkas pengganti untuk dokumen yang perlu diperbaiki. Setelah diunggah, status berkas Anda akan kembali dialihkan ke antrean <strong>Menunggu Verifikasi</strong>.
              </p>

              <div className="space-y-3">
                {/* Ganti KTP */}
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">KTP (Kartu Tanda Penduduk)</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {repairPesertaTarget.dokumen?.ktp?.namaFile || 'Belum ada'}
                    </span>
                  </div>
                  <label className="px-3 py-1.5 bg-[#002B66] text-white hover:bg-[#001D45] rounded-lg font-bold text-xs cursor-pointer">
                    <span>Ganti File</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const docItem: DokumenPendaftaranItem = {
                            namaFile: file.name,
                            tipeDokumen: 'ktp',
                            fileUrl: ev.target?.result as string,
                            fileSize: `${Math.round(file.size / 1024)} KB`,
                            uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
                            statusVerifikasiDokumen: 'Menunggu'
                          };
                          setRepairPesertaTarget(prev => prev ? {
                            ...prev,
                            dokumen: { ...(prev.dokumen || {}), ktp: docItem }
                          } : null);
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Ganti KK */}
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Kartu Keluarga (KK)</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {repairPesertaTarget.dokumen?.kartuKeluarga?.namaFile || 'Belum ada'}
                    </span>
                  </div>
                  <label className="px-3 py-1.5 bg-[#002B66] text-white hover:bg-[#001D45] rounded-lg font-bold text-xs cursor-pointer">
                    <span>Ganti File</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const docItem: DokumenPendaftaranItem = {
                            namaFile: file.name,
                            tipeDokumen: 'kk',
                            fileUrl: ev.target?.result as string,
                            fileSize: `${Math.round(file.size / 1024)} KB`,
                            uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
                            statusVerifikasiDokumen: 'Menunggu'
                          };
                          setRepairPesertaTarget(prev => prev ? {
                            ...prev,
                            dokumen: { ...(prev.dokumen || {}), kartuKeluarga: docItem }
                          } : null);
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Ganti Pas Photo */}
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Pas Photo Formal</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {repairPesertaTarget.dokumen?.pasPhoto?.namaFile || 'Belum ada'}
                    </span>
                  </div>
                  <label className="px-3 py-1.5 bg-[#002B66] text-white hover:bg-[#001D45] rounded-lg font-bold text-xs cursor-pointer">
                    <span>Ganti File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const docItem: DokumenPendaftaranItem = {
                            namaFile: file.name,
                            tipeDokumen: 'pas_photo',
                            fileUrl: ev.target?.result as string,
                            fileSize: `${Math.round(file.size / 1024)} KB`,
                            uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
                            statusVerifikasiDokumen: 'Menunggu'
                          };
                          setRepairPesertaTarget(prev => prev ? {
                            ...prev,
                            dokumen: { ...(prev.dokumen || {}), pasPhoto: docItem }
                          } : null);
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Ganti Ijazah */}
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Ijazah Terakhir</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {repairPesertaTarget.dokumen?.ijazahTerakhir?.namaFile || 'Belum ada'}
                    </span>
                  </div>
                  <label className="px-3 py-1.5 bg-[#002B66] text-white hover:bg-[#001D45] rounded-lg font-bold text-xs cursor-pointer">
                    <span>Ganti File</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const docItem: DokumenPendaftaranItem = {
                            namaFile: file.name,
                            tipeDokumen: 'ijazah',
                            fileUrl: ev.target?.result as string,
                            fileSize: `${Math.round(file.size / 1024)} KB`,
                            uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
                            statusVerifikasiDokumen: 'Menunggu'
                          };
                          setRepairPesertaTarget(prev => prev ? {
                            ...prev,
                            dokumen: { ...(prev.dokumen || {}), ijazahTerakhir: docItem }
                          } : null);
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRepairPesertaTarget(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!repairPesertaTarget) return;
                    updatePeserta(repairPesertaTarget.id, {
                      dokumen: repairPesertaTarget.dokumen,
                      statusVerifikasi: 'Menunggu Verifikasi',
                      catatanVerifikasi: 'Peserta telah mengunggah perbaikan berkas dokumen pada ' + new Date().toLocaleDateString('id-ID')
                    });
                    if (onRefreshData) onRefreshData();
                    setRepairPesertaTarget(null);
                  }}
                  className="px-5 py-2 bg-[#002B66] hover:bg-[#001D45] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-[#FDB913]" />
                  <span>Kirimkan Perbaikan Berkas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
