import React, { useState, useMemo } from 'react';
import { 
  Compass, Plus, Search, Filter, Calendar, Users, DollarSign, 
  CheckCircle2, Clock, School, MapPin, Phone, Mail, CreditCard, 
  FileText, ExternalLink, Edit2, Trash2, Eye, Download, Printer, 
  Layers, ChevronRight, Copy, Check, Upload, X, AlertTriangle, 
  Building2, Landmark, Sparkles, FileSpreadsheet, LayoutGrid, Table, CalendarDays,
  BarChart3
} from 'lucide-react';
import { 
  EduventureBooking, Kategori, Program, UserRole, 
  SkemaPaketEduventure, PilihanKunjunganEduventure, 
  StatusBayarEduventure, RekeningEduventure 
} from '../types';
import { DEFAULT_MASTER_DATA } from '../data/initialData';
import { EduventureImportModal } from './EduventureImportModal';
import { EduventureCalendarView } from './EduventureCalendarView';
import { EduventureDashboardView } from './EduventureDashboardView';
import { 
  bulkImportEduventure, 
  getTempatEduventure, 
  addTempatEduventure, 
  deleteTempatEduventure 
} from '../services/storageService';

interface EduventureViewProps {
  eduventureList: EduventureBooking[];
  kategoriList: Kategori[];
  programList?: Program[];
  userRole: UserRole;
  onSaveEduventure: (item: EduventureBooking) => void;
  onDeleteEduventure: (id: string) => void;
  onBulkImportEduventure?: (
    items: Array<Omit<EduventureBooking, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }>,
    mode: 'skip' | 'update' | 'force'
  ) => { success: boolean; message: string; count: number };
  onNavigateToKategori?: () => void;
  initialViewMode?: 'dashboard' | 'card' | 'table' | 'calendar';
}

const REKENING_OPTIONS: { value: RekeningEduventure; label: string; bank: string; rek: string; deskripsi: string }[] = [
  {
    value: 'Eduventure 9882340560200004',
    label: 'Eduventure 9882340560200004',
    bank: 'Bank BNI Virtual Account',
    rek: '9882340560200004',
    deskripsi: 'Rekening VA Operasional Eduventure & Kunjungan Kampus Non-Gelar Unpad'
  },
  {
    value: 'Luhung 9880619020200219',
    label: 'Luhung 9880619020200219',
    bank: 'Bank BNI Virtual Account',
    rek: '9880619020200219',
    deskripsi: 'Rekening VA Program Luhung & Kepemimpinan Budaya Unpad'
  }
];

const SKEMA_OPTIONS: { value: SkemaPaketEduventure; label: string; desc: string; badgeColor: string }[] = [
  {
    value: 'Eduventure Lite',
    label: 'Eduventure Lite',
    desc: 'Campus Tour Unpad, Orientasi Jalur Masuk SNBP/SNBT, Kunjungan Rektorat & Landmark Unpad',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200'
  },
  {
    value: 'Eduventure Experience',
    label: 'Eduventure Experience (Experiance)',
    desc: 'Full Day Campus Experience, Workshop Praktikum Laboratorium, Simulasi Kuliah Interaktif',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  {
    value: 'Eduventure Tematik',
    label: 'Eduventure Tematik',
    desc: 'Kunjungan Spesifik Minat Bakat: Medis/Kesehatan, Bisnis, AI/Teknologi, Agro & Eksplorasi Geologi',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
  }
];

export const EduventureView: React.FC<EduventureViewProps> = ({
  eduventureList,
  kategoriList,
  userRole,
  onSaveEduventure,
  onDeleteEduventure,
  onBulkImportEduventure,
  onNavigateToKategori,
  initialViewMode,
}) => {
  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSkema, setFilterSkema] = useState<string>('ALL');
  const [filterStatusBayar, setFilterStatusBayar] = useState<string>('ALL');
  const [filterKunjungan, setFilterKunjungan] = useState<string>('ALL');
  const [filterRekening, setFilterRekening] = useState<string>('ALL');
  const [filterTempat, setFilterTempat] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'dashboard' | 'card' | 'table' | 'calendar'>(initialViewMode || 'card');

  // Dynamic Tempat Penyelenggaraan List
  const [tempatList, setTempatList] = useState<string[]>(() => getTempatEduventure());
  const [isManageTempatOpen, setIsManageTempatOpen] = useState<boolean>(false);
  const [newVenueInput, setNewVenueInput] = useState<string>('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EduventureBooking | null>(null);
  const [detailItem, setDetailItem] = useState<EduventureBooking | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EduventureBooking | null>(null);
  const [copiedRek, setCopiedRek] = useState<string | null>(null);
  const [previewBuktiUrl, setPreviewBuktiUrl] = useState<string | null>(null);

  // Form State
  const defaultKategori = kategoriList.find(k => k.idKategori === 'KAT-006' || k.namaKategori.toLowerCase().includes('eduventure')) || kategoriList[0];
  const [formIdKategori, setFormIdKategori] = useState<string>(defaultKategori?.idKategori || 'KAT-006');
  const [formNamaSekolah, setFormNamaSekolah] = useState('');
  const [formAlamat, setFormAlamat] = useState('');
  const [formKontakPerson, setFormKontakPerson] = useState('');
  const [formNomorKontak, setFormNomorKontak] = useState('');
  const [formEmailKontak, setFormEmailKontak] = useState('');
  const [formJumlahPeserta, setFormJumlahPeserta] = useState<number>(50);
  const [formJumlahGuru, setFormJumlahGuru] = useState<number>(4);
  const [formTanggalPelaksanaan, setFormTanggalPelaksanaan] = useState('');
  const [formWaktuMulai, setFormWaktuMulai] = useState('08:30');
  const [formWaktuSelesai, setFormWaktuSelesai] = useState('12:00');
  const [formTempatPenyelenggaraan, setFormTempatPenyelenggaraan] = useState<string>('Bale Sawala');
  const [isCustomTempat, setIsCustomTempat] = useState<boolean>(false);
  const [customTempatInput, setCustomTempatInput] = useState<string>('');
  const [formSkemaPaket, setFormSkemaPaket] = useState<SkemaPaketEduventure>('Eduventure Experience');
  const [formPilihanKunjungan, setFormPilihanKunjungan] = useState<PilihanKunjunganEduventure>('Universitas');
  const [formFakultasTujuan, setFormFakultasTujuan] = useState<string[]>([]);
  const [formStatusBayar, setFormStatusBayar] = useState<StatusBayarEduventure>('Belum');
  const [formNominalTransfer, setFormNominalTransfer] = useState<number>(5000000);
  const [formTanggalTransfer, setFormTanggalTransfer] = useState('');
  const [formRekening, setFormRekening] = useState<RekeningEduventure>('Eduventure 9882340560200004');
  const [formBuktiTransferUrl, setFormBuktiTransferUrl] = useState<string>('');
  const [formBuktiTransferNama, setFormBuktiTransferNama] = useState<string>('');
  const [formCatatanTambahan, setFormCatatanTambahan] = useState('');
  const [formStatusKunjungan, setFormStatusKunjungan] = useState<'Menunggu' | 'Dikonfirmasi' | 'Terlaksana' | 'Batal'>('Menunggu');

  // Related Kategori Eduventure Master
  const kategoriEduventure = useMemo(() => {
    return kategoriList.find(k => k.idKategori === 'KAT-006' || k.namaKategori.toLowerCase().includes('eduventure')) || kategoriList[0];
  }, [kategoriList]);

  // Statistics Summary
  const stats = useMemo(() => {
    const totalBookings = eduventureList.length;
    const totalSiswa = eduventureList.reduce((acc, cur) => acc + (Number(cur.jumlahPeserta) || 0), 0);
    const totalGuru = eduventureList.reduce((acc, cur) => acc + (Number(cur.jumlahGuru) || 0), 0);
    const sudahBayarCount = eduventureList.filter(b => b.statusBayar === 'Sudah').length;
    const belumBayarCount = eduventureList.filter(b => b.statusBayar === 'Belum').length;
    const totalNominalLunas = eduventureList
      .filter(b => b.statusBayar === 'Sudah')
      .reduce((acc, cur) => acc + (Number(cur.nominalTransfer) || 0), 0);
    const totalNominalPending = eduventureList
      .filter(b => b.statusBayar === 'Belum')
      .reduce((acc, cur) => acc + (Number(cur.nominalTransfer) || 0), 0);

    return {
      totalBookings,
      totalSiswa,
      totalGuru,
      totalOrang: totalSiswa + totalGuru,
      sudahBayarCount,
      belumBayarCount,
      totalNominalLunas,
      totalNominalPending,
    };
  }, [eduventureList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return eduventureList.filter(item => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          item.namaSekolah.toLowerCase().includes(q) ||
          item.alamat.toLowerCase().includes(q) ||
          item.kontakPerson.toLowerCase().includes(q) ||
          item.nomorKontak.toLowerCase().includes(q) ||
          item.skemaPaket.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          (item.tempatPenyelenggaraan && item.tempatPenyelenggaraan.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Filter Skema
      if (filterSkema !== 'ALL' && item.skemaPaket !== filterSkema) {
        return false;
      }

      // Filter Status Bayar
      if (filterStatusBayar !== 'ALL' && item.statusBayar !== filterStatusBayar) {
        return false;
      }

      // Filter Pilihan Kunjungan
      if (filterKunjungan !== 'ALL' && item.pilihanKunjungan !== filterKunjungan) {
        return false;
      }

      // Filter Rekening
      if (filterRekening !== 'ALL' && item.rekening !== filterRekening) {
        return false;
      }

      // Filter Tempat Penyelenggaraan
      if (filterTempat !== 'ALL') {
        const itemTempat = item.tempatPenyelenggaraan || 'Bale Sawala';
        if (itemTempat !== filterTempat) {
          return false;
        }
      }

      return true;
    });
  }, [eduventureList, searchQuery, filterSkema, filterStatusBayar, filterKunjungan, filterRekening, filterTempat]);

  // Venue Management Handlers
  const handleAddNewVenueToStorage = (venueName: string) => {
    if (!venueName.trim()) return;
    const updated = addTempatEduventure(venueName.trim());
    setTempatList(updated);
    setNewVenueInput('');
  };

  const handleDeleteVenueFromStorage = (venueName: string) => {
    if (confirm(`Hapus "${venueName}" dari daftar pilihan tempat?`)) {
      const updated = deleteTempatEduventure(venueName);
      setTempatList(updated);
      if (formTempatPenyelenggaraan === venueName) {
        setFormTempatPenyelenggaraan(updated[0] || 'Bale Sawala');
      }
      if (filterTempat === venueName) {
        setFilterTempat('ALL');
      }
    }
  };

  // Open Form Handlers
  const handleOpenAdd = (customDate?: string) => {
    const venues = getTempatEduventure();
    setTempatList(venues);
    setEditingItem(null);
    setFormIdKategori(kategoriEduventure?.idKategori || 'KAT-006');
    setFormNamaSekolah('');
    setFormAlamat('');
    setFormKontakPerson('');
    setFormNomorKontak('');
    setFormEmailKontak('');
    setFormJumlahPeserta(60);
    setFormJumlahGuru(4);
    if (customDate) {
      setFormTanggalPelaksanaan(customDate);
    } else {
      // default date 2 weeks from now
      const d = new Date();
      d.setDate(d.getDate() + 14);
      setFormTanggalPelaksanaan(d.toISOString().substring(0, 10));
    }
    setFormWaktuMulai('08:30');
    setFormWaktuSelesai('12:00');
    setFormTempatPenyelenggaraan(venues[0] || 'Bale Sawala');
    setIsCustomTempat(false);
    setCustomTempatInput('');
    setFormSkemaPaket('Eduventure Experience');
    setFormPilihanKunjungan('Universitas');
    setFormFakultasTujuan([]);
    setFormStatusBayar('Belum');
    setFormNominalTransfer(6000000);
    setFormTanggalTransfer('');
    setFormRekening('Eduventure 9882340560200004');
    setFormBuktiTransferUrl('');
    setFormBuktiTransferNama('');
    setFormCatatanTambahan('');
    setFormStatusKunjungan('Menunggu');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: EduventureBooking) => {
    const venues = getTempatEduventure();
    setEditingItem(item);
    setFormIdKategori(item.idKategori || kategoriEduventure?.idKategori || 'KAT-006');
    setFormNamaSekolah(item.namaSekolah);
    setFormAlamat(item.alamat);
    setFormKontakPerson(item.kontakPerson);
    setFormNomorKontak(item.nomorKontak);
    setFormEmailKontak(item.emailKontak || '');
    setFormJumlahPeserta(item.jumlahPeserta || 0);
    setFormJumlahGuru(item.jumlahGuru || 0);
    setFormTanggalPelaksanaan(item.tanggalPelaksanaan);
    setFormWaktuMulai(item.waktuMulai || '08:30');
    setFormWaktuSelesai(item.waktuSelesai || '12:00');
    const itemTempat = item.tempatPenyelenggaraan || 'Bale Sawala';
    if (!venues.includes(itemTempat)) {
      setTempatList([...venues, itemTempat]);
    } else {
      setTempatList(venues);
    }
    setFormTempatPenyelenggaraan(itemTempat);
    setIsCustomTempat(false);
    setCustomTempatInput('');
    setFormSkemaPaket(item.skemaPaket);
    setFormPilihanKunjungan(item.pilihanKunjungan);
    setFormFakultasTujuan(item.fakultasTujuan || []);
    setFormStatusBayar(item.statusBayar);
    setFormNominalTransfer(item.nominalTransfer || 0);
    setFormTanggalTransfer(item.tanggalTransfer || '');
    setFormRekening(item.rekening);
    setFormBuktiTransferUrl(item.buktiTransferUrl || '');
    setFormBuktiTransferNama(item.buktiTransferNama || '');
    setFormCatatanTambahan(item.catatanTambahan || '');
    setFormStatusKunjungan(item.statusKunjungan || 'Menunggu');
    setIsFormOpen(true);
  };

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaSekolah.trim()) {
      alert('Mohon isi nama sekolah.');
      return;
    }
    if (!formTanggalPelaksanaan) {
      alert('Mohon pilih tanggal pelaksanaan kunjungan.');
      return;
    }
    if (!formKontakPerson.trim() || !formNomorKontak.trim()) {
      alert('Mohon isi nama narahubung dan nomor kontak sekolah.');
      return;
    }

    const matchedKat = kategoriList.find(k => k.idKategori === formIdKategori);
    const namaKat = matchedKat ? matchedKat.namaKategori : 'Eduventure';

    const finalTempat = isCustomTempat && customTempatInput.trim()
      ? customTempatInput.trim()
      : (formTempatPenyelenggaraan.trim() || 'Bale Sawala');

    if (finalTempat) {
      addTempatEduventure(finalTempat);
      setTempatList(getTempatEduventure());
    }

    const payload: EduventureBooking = {
      id: editingItem ? editingItem.id : '',
      idKategori: formIdKategori,
      namaKategori: namaKat,
      namaSekolah: formNamaSekolah.trim(),
      alamat: formAlamat.trim(),
      kontakPerson: formKontakPerson.trim(),
      nomorKontak: formNomorKontak.trim(),
      emailKontak: formEmailKontak.trim(),
      jumlahPeserta: Number(formJumlahPeserta) || 0,
      jumlahGuru: Number(formJumlahGuru) || 0,
      tanggalPelaksanaan: formTanggalPelaksanaan,
      waktuMulai: formWaktuMulai || '08:30',
      waktuSelesai: formWaktuSelesai || '12:00',
      tempatPenyelenggaraan: finalTempat,
      skemaPaket: formSkemaPaket,
      pilihanKunjungan: formPilihanKunjungan,
      fakultasTujuan: formPilihanKunjungan === 'Fakultas' ? formFakultasTujuan : [],
      statusBayar: formStatusBayar,
      buktiTransferUrl: formBuktiTransferUrl,
      buktiTransferNama: formBuktiTransferNama,
      nominalTransfer: Number(formNominalTransfer) || 0,
      tanggalTransfer: formStatusBayar === 'Sudah' ? (formTanggalTransfer || formTanggalPelaksanaan) : formTanggalTransfer,
      rekening: formRekening,
      catatanTambahan: formCatatanTambahan.trim(),
      statusKunjungan: formStatusKunjungan,
      createdAt: editingItem ? editingItem.createdAt : '',
      updatedAt: ''
    };

    onSaveEduventure(payload);
    setIsFormOpen(false);
  };

  // File Upload Handler for Bukti Transfer
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB.');
        return;
      }
      setFormBuktiTransferNama(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormBuktiTransferUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRek(id);
    setTimeout(() => setCopiedRek(null), 2500);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const handleExportCSV = () => {
    const headers = [
      'ID Kunjungan', 'Nama Sekolah', 'Alamat', 'Narahubung', 'No Kontak', 
      'Jml Peserta', 'Jml Guru', 'Tgl Pelaksanaan', 'Waktu Mulai', 'Waktu Selesai', 'Tempat Penyelenggaraan', 'Paket', 'Pilihan Kunjungan', 
      'Fakultas Tujuan', 'Status Bayar', 'Nominal Transfer', 'Tgl Transfer', 'Rekening'
    ];
    const rows = filteredList.map(item => [
      item.id,
      `"${item.namaSekolah.replace(/"/g, '""')}"`,
      `"${item.alamat.replace(/"/g, '""')}"`,
      `"${item.kontakPerson.replace(/"/g, '""')}"`,
      `'${item.nomorKontak}`,
      item.jumlahPeserta,
      item.jumlahGuru || 0,
      item.tanggalPelaksanaan,
      `"${item.waktuMulai || '08:30'}"`,
      `"${item.waktuSelesai || '12:00'}"`,
      `"${(item.tempatPenyelenggaraan || 'Bale Sawala').replace(/"/g, '""')}"`,
      `"${item.skemaPaket}"`,
      `"${item.pilihanKunjungan}"`,
      `"${(item.fakultasTujuan || []).join('; ')}"`,
      item.statusBayar,
      item.nominalTransfer,
      item.tanggalTransfer || '-',
      `"${item.rekening}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Eduventure_Unpad_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="eduventure-view-container" className="space-y-6">
      {/* Header Banner with Kategori Relasi */}
      <div className="bg-gradient-to-r from-[#002B66] via-[#003882] to-[#001D45] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-300/30">
                <Compass className="w-3.5 h-3.5" />
                Eduventure & Campus Experience
              </span>
              
              {/* Relasi ke Kategori Program */}
              <button
                type="button"
                onClick={onNavigateToKategori}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30 transition-colors"
                title="Klik untuk membuka Master Kategori Program"
              >
                <Layers className="w-3.5 h-3.5 text-blue-300" />
                <span>Berelasi: Kategori Program ({kategoriEduventure?.namaKategori || 'Eduventure'} - {kategoriEduventure?.idKategori || 'KAT-006'})</span>
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Manajemen Kunjungan Eduventure Sekolah
            </h1>
            <p className="text-sm text-blue-100/90 leading-relaxed">
              Modul pendaftaran, penjadwalan kunjungan edukatif sekolah ke kampus Universitas Padjadjaran, monitoring paket <em>Eduventure Lite, Experience, & Tematik</em>, serta verifikasi rekening dan bukti transfer.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap">
            {userRole !== 'VIEWER' && (
              <>
                <button
                  id="btn-tambah-eduventure"
                  type="button"
                  onClick={() => handleOpenAdd()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold rounded-xl text-sm shadow-md hover:shadow-lg transition-all duration-150 transform hover:-translate-y-0.5"
                >
                  <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                  Daftar Kunjungan Baru
                </button>

                <button
                  id="btn-open-import-eduventure"
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-150 transform hover:-translate-y-0.5 border border-emerald-400/40"
                  title="Import Data Kunjungan dari Excel (.xlsx) atau CSV (.csv)"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                  <span>Import Data</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTempatList(getTempatEduventure());
                    setIsManageTempatOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-150 transform hover:-translate-y-0.5 border border-purple-500/40"
                  title="Kelola Daftar Pilihan Tempat Penyelenggaraan"
                >
                  <Building2 className="w-4 h-4 text-purple-200" />
                  <span className="hidden sm:inline">Kelola Tempat</span>
                </button>
              </>
            )}

            <button
              id="btn-header-dashboard-eduventure"
              type="button"
              onClick={() => setViewMode(viewMode === 'dashboard' ? 'card' : 'dashboard')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-150 transform hover:-translate-y-0.5 border ${
                viewMode === 'dashboard'
                  ? 'bg-[#FDB913] text-slate-900 border-amber-300 font-bold'
                  : 'bg-white/15 hover:bg-white/25 text-white border-white/20'
              }`}
              title="Buka Dashboard Eduventure"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              id="btn-header-kalender-eduventure"
              type="button"
              onClick={() => setViewMode(viewMode === 'calendar' ? 'card' : 'calendar')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-150 transform hover:-translate-y-0.5 border ${
                viewMode === 'calendar'
                  ? 'bg-amber-400 text-slate-900 border-amber-300 font-bold'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500/40'
              }`}
              title="Buka Kalender Agenda Eduventure"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Kalender Agenda</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium border border-white/15 transition-colors"
              title="Export Rekap Eduventure ke CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Quick Rekening Indicator */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {REKENING_OPTIONS.map((rek, idx) => (
            <div 
              key={idx}
              className="bg-white/5 border border-white/10 rounded-xl p-2.5 px-3.5 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CreditCard className="w-4 h-4 text-amber-300 flex-shrink-0" />
                <div className="truncate">
                  <span className="font-semibold text-white">{rek.value}</span>
                  <span className="text-blue-200 block text-[11px] truncate">{rek.deskripsi}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(rek.rek, rek.rek)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex-shrink-0 flex items-center gap-1 text-[11px]"
                title="Salin Nomor Rekening"
              >
                {copiedRek === rek.rek ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Kunjungan Sekolah</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#002B66] flex items-center justify-center">
              <School className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">{stats.totalBookings}</div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            Kunjungan terdaftar & terjadwal
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Peserta & Guru</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">{stats.totalOrang.toLocaleString('id-ID')}</div>
          <p className="text-xs text-indigo-600 mt-1 font-medium">
            {stats.totalSiswa} Siswa • {stats.totalGuru} Guru Pendamping
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Status Pembayaran Lunas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700">{formatRupiah(stats.totalNominalLunas)}</div>
          <p className="text-xs text-emerald-700 font-medium mt-1">
            {stats.sudahBayarCount} sekolah telah lunas transfer
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Menunggu Pembayaran</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700">{formatRupiah(stats.totalNominalPending)}</div>
          <p className="text-xs text-amber-700 font-medium mt-1">
            {stats.belumBayarCount} sekolah belum transfer / verifikasi
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-cari-eduventure"
              type="text"
              placeholder="Cari nama sekolah, alamat, narahubung, nomor kontak, paket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002B66]/20 focus:border-[#002B66]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              id="btn-tab-dashboard-eduventure"
              type="button"
              onClick={() => setViewMode('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'dashboard' 
                  ? 'bg-[#002B66] text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Dashboard Eduventure"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'card' 
                  ? 'bg-white text-[#002B66] shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table' 
                  ? 'bg-white text-[#002B66] shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Tabel"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
            <button
              id="btn-tab-kalender-agenda"
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'calendar' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Kalender Agenda"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Kalender Agenda</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Skema / Paket</label>
            <select
              value={filterSkema}
              onChange={(e) => setFilterSkema(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="ALL">Semua Paket ({eduventureList.length})</option>
              <option value="Eduventure Lite">Eduventure Lite</option>
              <option value="Eduventure Experience">Eduventure Experience</option>
              <option value="Eduventure Tematik">Eduventure Tematik</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Status Bayar</label>
            <select
              value={filterStatusBayar}
              onChange={(e) => setFilterStatusBayar(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="ALL">Semua Status Bayar</option>
              <option value="Sudah">Sudah (Lunas)</option>
              <option value="Belum">Belum (Pending)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Pilihan Kunjungan</label>
            <select
              value={filterKunjungan}
              onChange={(e) => setFilterKunjungan(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="ALL">Semua Kunjungan</option>
              <option value="Universitas">Universitas (Landmark)</option>
              <option value="Fakultas">Fakultas Tertentu</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Tempat Penyelenggaraan</label>
            <select
              value={filterTempat}
              onChange={(e) => setFilterTempat(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="ALL">Semua Tempat ({tempatList.length})</option>
              {tempatList.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Rekening Tujuan</label>
            <select
              value={filterRekening}
              onChange={(e) => setFilterRekening(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="ALL">Semua Rekening</option>
              <option value="Eduventure 9882340560200004">Eduventure (9882340560200004)</option>
              <option value="Luhung 9880619020200219">Luhung (9880619020200219)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content List */}
      {viewMode === 'dashboard' ? (
        <EduventureDashboardView
          eduventureList={eduventureList}
          onSelectBooking={(item) => {
            setDetailItem(item);
          }}
          onEditBooking={handleOpenEdit}
          onAddNewBooking={() => handleOpenAdd()}
          onSwitchViewMode={(mode) => setViewMode(mode)}
          onExportCSV={handleExportCSV}
          userRole={userRole}
        />
      ) : viewMode === 'calendar' ? (
        <EduventureCalendarView
          eduventureList={eduventureList}
          tempatList={tempatList}
          userRole={userRole}
          onSelectBooking={(item) => {
            setDetailItem(item);
          }}
          onEditBooking={handleOpenEdit}
          onAddNewBooking={(date) => {
            handleOpenAdd(date);
          }}
        />
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
            <School className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Tidak ada data kunjungan yang cocok</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau sesuaikan filter di atas.
          </p>
          {userRole !== 'VIEWER' && (
            <button
              type="button"
              onClick={() => handleOpenAdd()}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#002B66] text-white rounded-lg text-sm font-medium hover:bg-[#003882] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Daftar Kunjungan Baru
            </button>
          )}
        </div>
      ) : viewMode === 'card' ? (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredList.map((item) => {
            const skemaBadge = SKEMA_OPTIONS.find(s => s.value === item.skemaPaket);
            return (
              <div 
                key={item.id}
                className="bg-white rounded-xl border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition-all duration-150 p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Paket & Status Bayar */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${skemaBadge?.badgeColor || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                      {item.skemaPaket}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      item.statusBayar === 'Sudah' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {item.statusBayar === 'Sudah' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Sudah Bayar
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-600" />
                          Belum Bayar
                        </>
                      )}
                    </span>
                  </div>

                  {/* Nama Sekolah & ID */}
                  <div className="mb-2">
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-bold text-slate-900 text-base hover:text-[#002B66] transition-colors line-clamp-1">
                        {item.namaSekolah}
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{item.id} • Kategori: {item.namaKategori || 'Eduventure'}</span>
                  </div>

                  {/* Alamat */}
                  <div className="flex items-start gap-1.5 text-xs text-slate-600 mb-3 line-clamp-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{item.alamat || 'Alamat belum dilengkapi'}</span>
                  </div>

                  {/* Key Info Grid */}
                  <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-100 text-xs mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        Tgl Pelaksanaan:
                      </span>
                      <span className="font-semibold text-slate-800">{item.tanggalPelaksanaan}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        Waktu Kegiatan:
                      </span>
                      <span className="font-semibold text-indigo-700 font-mono">
                        {item.waktuMulai || '08:30'} - {item.waktuSelesai || '12:00'} WIB
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-purple-600" />
                        Tempat:
                      </span>
                      <span className="font-semibold text-slate-800 truncate max-w-[170px] text-right" title={item.tempatPenyelenggaraan || 'Bale Sawala'}>
                        {item.tempatPenyelenggaraan || 'Bale Sawala'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        Jumlah Peserta:
                      </span>
                      <span className="font-semibold text-slate-800">
                        {item.jumlahPeserta} Siswa {item.jumlahGuru ? `+ ${item.jumlahGuru} Guru` : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-amber-600" />
                        Pilihan Kunjungan:
                      </span>
                      <span className="font-semibold text-slate-800 truncate max-w-[170px] text-right">
                        {item.pilihanKunjungan === 'Fakultas' 
                          ? (item.fakultasTujuan && item.fakultasTujuan.length > 0 
                              ? item.fakultasTujuan.join(', ') 
                              : 'Fakultas') 
                          : 'Universitas (Landmark)'}
                      </span>
                    </div>
                  </div>

                  {/* Kontak Person & Telepon */}
                  <div className="text-xs text-slate-600 space-y-1 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">{item.kontakPerson}</span>
                      {item.nomorKontak && (
                        <a
                          href={`https://wa.me/${item.nomorKontak.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 font-mono text-[11px] inline-flex items-center gap-0.5"
                          title="Hubungi via WhatsApp"
                        >
                          <Phone className="w-3 h-3" />
                          {item.nomorKontak}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Informasi Rekening & Nominal */}
                  <div className="border-t border-slate-100 pt-2.5 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Nominal Transfer:</span>
                      <span className="font-bold text-slate-900 text-sm">{formatRupiah(item.nominalTransfer)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Rekening Tujuan:</span>
                      <span className="font-mono text-[11px] text-[#002B66] font-semibold block truncate max-w-[150px]">
                        {item.rekening.replace('Eduventure ', 'EDV ').replace('Luhung ', 'LHG ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDetailItem(item)}
                      className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                      title="Lihat Detail & Lembar Konfirmasi Kunjungan"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Detail
                    </button>
                    {item.buktiTransferUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewBuktiUrl(item.buktiTransferUrl || null)}
                        className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1"
                        title="Lihat Bukti Transfer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Bukti Bayar
                      </button>
                    )}
                  </div>

                  {userRole !== 'VIEWER' && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Data Kunjungan"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Data"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="py-3 px-4">ID & Sekolah</th>
                  <th className="py-3 px-4">Paket & Kunjungan</th>
                  <th className="py-3 px-4">Tgl Pelaksanaan</th>
                  <th className="py-3 px-4">Tempat</th>
                  <th className="py-3 px-4">Peserta</th>
                  <th className="py-3 px-4">Narahubung & Kontak</th>
                  <th className="py-3 px-4">Status Bayar</th>
                  <th className="py-3 px-4">Nominal Transfer</th>
                  <th className="py-3 px-4">Rekening Tujuan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block text-sm">{item.namaSekolah}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{item.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">{item.skemaPaket}</span>
                      <span className="text-slate-500 text-[11px]">
                        {item.pilihanKunjungan === 'Fakultas' 
                          ? (item.fakultasTujuan?.join(', ') || 'Fakultas') 
                          : 'Universitas'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                      <span className="font-semibold block">{item.tanggalPelaksanaan}</span>
                      <span className="text-[11px] text-indigo-700 font-mono flex items-center gap-1 font-medium mt-0.5">
                        <Clock className="w-3 h-3 text-indigo-500" />
                        {item.waktuMulai || '08:30'} - {item.waktuSelesai || '12:00'} WIB
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200" title={item.tempatPenyelenggaraan || 'Bale Sawala'}>
                        <Building2 className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                        <span className="truncate max-w-[140px]">{item.tempatPenyelenggaraan || 'Bale Sawala'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-800">{item.jumlahPeserta}</span> Siswa
                      {item.jumlahGuru ? <span className="text-slate-500 text-[11px] block">+{item.jumlahGuru} Guru</span> : null}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 block">{item.kontakPerson}</span>
                      <span className="text-slate-500 font-mono text-[11px]">{item.nomorKontak}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        item.statusBayar === 'Sudah' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {item.statusBayar === 'Sudah' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Sudah Bayar
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            Belum Bayar
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                      {formatRupiah(item.nominalTransfer)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] text-[#002B66] font-semibold block truncate max-w-[140px]">
                        {item.rekening}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setDetailItem(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {userRole !== 'VIEWER' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL FORM INPUT & EDIT EDUVENTURE ================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#002B66] to-[#003882] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Compass className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingItem ? 'Edit Data Kunjungan Eduventure' : 'Pendaftaran Kunjungan Eduventure Baru'}
                  </h3>
                  <p className="text-xs text-blue-200">
                    Form pendaftaran resmi rombongan sekolah berelasi dengan Kategori Program Unpad
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* Relasi Kategori Program */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#002B66] flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-700" />
                    Relasi Kategori Program:
                  </label>
                  <span className="text-[11px] text-blue-700 font-medium">Terhubung ke Master Kategori</span>
                </div>
                <select
                  value={formIdKategori}
                  onChange={(e) => setFormIdKategori(e.target.value)}
                  className="w-full py-2 px-3 bg-white border border-blue-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002B66]/30"
                >
                  {kategoriList.map(k => (
                    <option key={k.idKategori} value={k.idKategori}>
                      {k.namaKategori} ({k.idKategori}) {k.idKategori === 'KAT-006' ? '★ Kategori Utama Eduventure' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* SECTION 1: Sekolah & Narahubung */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <School className="w-4 h-4 text-blue-600" />
                  1. Informasi Sekolah & Kontak Narahubung
                </h4>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nama Sekolah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-nama-sekolah"
                    type="text"
                    required
                    placeholder="Contoh: SMA Negeri 3 Bandung / SMA Labschool Jakarta"
                    value={formNamaSekolah}
                    onChange={(e) => setFormNamaSekolah(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002B66]/20 focus:border-[#002B66]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Alamat Lengkap Sekolah
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Jalan, Nomor, Kelurahan, Kecamatan, Kota/Kabupaten, Provinsi"
                    value={formAlamat}
                    onChange={(e) => setFormAlamat(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#002B66]/20 focus:border-[#002B66]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nama Kontak / Guru <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Lengkap Narahubung"
                      value={formKontakPerson}
                      onChange={(e) => setFormKontakPerson(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#002B66]/20 focus:border-[#002B66]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nomor HP / WhatsApp <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 081223344556"
                      value={formNomorKontak}
                      onChange={(e) => setFormNomorKontak(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#002B66]/20 focus:border-[#002B66]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email Sekolah / Guru
                    </label>
                    <input
                      type="email"
                      placeholder="email.sekolah@sch.id"
                      value={formEmailKontak}
                      onChange={(e) => setFormEmailKontak(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#002B66]/20 focus:border-[#002B66]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Peserta, Pelaksanaan & Tempat */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  2. Jumlah Peserta, Tanggal & Tempat Penyelenggaraan
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Jumlah Siswa (Peserta) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formJumlahPeserta}
                      onChange={(e) => setFormJumlahPeserta(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#002B66]/20 focus:border-[#002B66]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Jumlah Guru Pendamping
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formJumlahGuru}
                      onChange={(e) => setFormJumlahGuru(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#002B66]/20 focus:border-[#002B66]"
                    />
                  </div>
                </div>

                {/* Tanggal & Waktu Pelaksanaan */}
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Tanggal Pelaksanaan <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formTanggalPelaksanaan}
                        onChange={(e) => setFormTanggalPelaksanaan(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#002B66]/20 focus:border-[#002B66]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Waktu Mulai (WIB) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="time"
                          required
                          value={formWaktuMulai}
                          onChange={(e) => setFormWaktuMulai(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#002B66]/20 focus:border-[#002B66]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Waktu Selesai (WIB) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="time"
                          required
                          value={formWaktuSelesai}
                          onChange={(e) => setFormWaktuSelesai(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#002B66]/20 focus:border-[#002B66]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preset Sesi Waktu */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <span className="font-medium text-slate-600">Preset Sesi:</span>
                    <button
                      type="button"
                      onClick={() => { setFormWaktuMulai('08:30'); setFormWaktuSelesai('12:00'); }}
                      className={`px-2 py-0.5 rounded border transition-colors ${
                        formWaktuMulai === '08:30' && formWaktuSelesai === '12:00'
                          ? 'bg-[#002B66] text-white border-[#002B66]'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      Pagi (08:30 - 12:00)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFormWaktuMulai('13:00'); setFormWaktuSelesai('16:30'); }}
                      className={`px-2 py-0.5 rounded border transition-colors ${
                        formWaktuMulai === '13:00' && formWaktuSelesai === '16:30'
                          ? 'bg-[#002B66] text-white border-[#002B66]'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      Siang (13:00 - 16:30)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFormWaktuMulai('09:00'); setFormWaktuSelesai('15:00'); }}
                      className={`px-2 py-0.5 rounded border transition-colors ${
                        formWaktuMulai === '09:00' && formWaktuSelesai === '15:00'
                          ? 'bg-[#002B66] text-white border-[#002B66]'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      Full Day (09:00 - 15:00)
                    </button>
                  </div>
                </div>

                {/* Tempat Penyelenggaraan */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Tempat Penyelenggaraan <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomTempat(!isCustomTempat);
                        if (!isCustomTempat) {
                          setCustomTempatInput('');
                        }
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline flex items-center gap-0.5"
                    >
                      {isCustomTempat ? '← Pilih dari daftar' : '+ Tambah Baru'}
                    </button>
                  </div>

                    {!isCustomTempat ? (
                      <select
                        id="select-tempat-penyelenggaraan"
                        value={formTempatPenyelenggaraan}
                        onChange={(e) => {
                          if (e.target.value === '__ADD_NEW__') {
                            setIsCustomTempat(true);
                            setCustomTempatInput('');
                          } else {
                            setFormTempatPenyelenggaraan(e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002B66]/20 focus:border-[#002B66] bg-white"
                      >
                        {tempatList.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                        <option value="__ADD_NEW__">+ Tambah Tempat Lainnya...</option>
                      </select>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Ketik tempat/gedung baru..."
                            value={customTempatInput}
                            onChange={(e) => setCustomTempatInput(e.target.value)}
                            className="flex-1 px-3 py-2 border border-blue-400 bg-blue-50/20 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (customTempatInput.trim()) {
                                handleAddNewVenueToStorage(customTempatInput.trim());
                                setFormTempatPenyelenggaraan(customTempatInput.trim());
                                setIsCustomTempat(false);
                              }
                            }}
                            className="px-3 py-1.5 bg-[#002B66] text-white rounded-lg text-xs font-semibold hover:bg-blue-900"
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsCustomTempat(false)}
                            className="px-2 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300"
                          >
                            Batal
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Tempat baru akan otomatis tersimpan dalam daftar pilihan.
                        </p>
                      </div>
                    )}
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Estimasi Total Rombongan:</span>
                  <span className="font-bold text-[#002B66]">
                    {(Number(formJumlahPeserta) || 0) + (Number(formJumlahGuru) || 0)} Orang ({formJumlahPeserta} Siswa + {formJumlahGuru} Guru)
                  </span>
                </div>
              </div>

              {/* SECTION 3: Skema / Paket & Pilihan Kunjungan */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  3. Skema / Paket & Pilihan Kunjungan
                </h4>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Skema atau Paket Eduventure <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {SKEMA_OPTIONS.map((pkg) => (
                      <div
                        key={pkg.value}
                        onClick={() => setFormSkemaPaket(pkg.value)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          formSkemaPaket === pkg.value
                            ? 'bg-blue-50/80 border-[#002B66] ring-2 ring-[#002B66]/10'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-slate-800">{pkg.value}</span>
                          {formSkemaPaket === pkg.value && (
                            <CheckCircle2 className="w-4 h-4 text-[#002B66]" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{pkg.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Pilihan Kunjungan <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                      formPilihanKunjungan === 'Universitas'
                        ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/10'
                        : 'bg-white border-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="pilihanKunjungan"
                        checked={formPilihanKunjungan === 'Universitas'}
                        onChange={() => setFormPilihanKunjungan('Universitas')}
                        className="mt-0.5 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-800 block">Universitas</span>
                        <span className="text-[11px] text-slate-500 block">
                          Orientasi kampus, Rektorat, Gedung Kandaga, Bale Sawala, dan Arboretum Unpad Jatinangor
                        </span>
                      </div>
                    </label>

                    <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                      formPilihanKunjungan === 'Fakultas'
                        ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/10'
                        : 'bg-white border-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="pilihanKunjungan"
                        checked={formPilihanKunjungan === 'Fakultas'}
                        onChange={() => setFormPilihanKunjungan('Fakultas')}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-800 block">Fakultas</span>
                        <span className="text-[11px] text-slate-500 block">
                          Kunjungan spesifik ke 1 atau beberapa fakultas, laboratorium, atau program studi
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Multi-select Fakultas jika pilihan adalah Fakultas */}
                  {formPilihanKunjungan === 'Fakultas' && (
                    <div className="mt-3 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-indigo-900">
                          Pilih Fakultas Tujuan Kunjungan:
                        </label>
                        <span className="text-[11px] text-indigo-600 font-medium">
                          {formFakultasTujuan.length} dipilih
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-1 text-xs">
                        {DEFAULT_MASTER_DATA.fakultasUnpad.map((fak) => {
                          const isChecked = formFakultasTujuan.includes(fak);
                          return (
                            <label
                              key={fak}
                              className={`flex items-center gap-1.5 p-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
                                isChecked ? 'bg-indigo-600 text-white font-medium' : 'bg-white text-slate-700 hover:bg-indigo-100/50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormFakultasTujuan([...formFakultasTujuan, fak]);
                                  } else {
                                    setFormFakultasTujuan(formFakultasTujuan.filter(f => f !== fak));
                                  }
                                }}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="truncate text-[11px]">{fak}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 4: Status Bayar, Rekening, & Bukti Transfer */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  4. Informasi Pembayaran & Rekening Resmi
                </h4>

                {/* Status Bayar Toggle */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Status Bayar <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormStatusBayar('Sudah')}
                      className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                        formStatusBayar === 'Sudah'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Sudah Bayar (Lunas)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStatusBayar('Belum')}
                      className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                        formStatusBayar === 'Belum'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      Belum Bayar (Menunggu)
                    </button>
                  </div>
                </div>

                {/* Rekening Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Pilihan Rekening Virtual Account Unpad <span className="text-rose-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {REKENING_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          formRekening === opt.value
                            ? 'bg-blue-50/90 border-[#002B66] ring-1 ring-[#002B66]'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="rekeningPilihan"
                            checked={formRekening === opt.value}
                            onChange={() => setFormRekening(opt.value)}
                            className="text-[#002B66] focus:ring-[#002B66]"
                          />
                          <div>
                            <span className="font-bold text-xs text-slate-800 block">{opt.label}</span>
                            <span className="text-[11px] text-slate-500 block">{opt.deskripsi}</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#002B66] px-2.5 py-1 bg-white rounded-md border border-slate-200">
                          {opt.rek}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Nominal & Tanggal Transfer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nominal Transfer (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                      <input
                        type="number"
                        required
                        min={0}
                        step={50000}
                        value={formNominalTransfer}
                        onChange={(e) => setFormNominalTransfer(Number(e.target.value))}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B66]/20 focus:border-[#002B66]"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {formatRupiah(formNominalTransfer)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Tanggal Transfer
                    </label>
                    <input
                      type="date"
                      value={formTanggalTransfer}
                      onChange={(e) => setFormTanggalTransfer(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#002B66]/20 focus:border-[#002B66]"
                    />
                  </div>
                </div>

                {/* Bukti Transfer Upload */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Bukti Transfer / Pembayaran
                  </label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-400 transition-colors bg-slate-50/50">
                    {formBuktiTransferUrl ? (
                      <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          <div className="text-left truncate">
                            <span className="text-xs font-semibold text-slate-800 block truncate">
                              {formBuktiTransferNama || 'Bukti Transfer Terlampir'}
                            </span>
                            <span className="text-[10px] text-emerald-600">File siap disimpan</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewBuktiUrl(formBuktiTransferUrl)}
                            className="p-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormBuktiTransferUrl('');
                              setFormBuktiTransferNama('');
                            }}
                            className="p-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded"
                            title="Hapus"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <Upload className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
                        <span className="text-xs font-semibold text-[#002B66] block">
                          Klik untuk upload Bukti Transfer (JPG, PNG, PDF)
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">Maksimal ukuran file: 5MB</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Catatan Tambahan */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Catatan Tambahan / Permintaan Khusus
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Jumlah armada bus, kebutuhan narasumber materi tertentu, simulasi gempa, dsb."
                    value={formCatatanTambahan}
                    onChange={(e) => setFormCatatanTambahan(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#002B66]/20 focus:border-[#002B66]"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  id="btn-simpan-eduventure"
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#002B66] hover:bg-[#003882] rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Kunjungan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DETAIL & CETAK INVOICE ================= */}
      {detailItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-8">
            {/* Modal Top Bar */}
            <div className="bg-[#002B66] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Compass className="w-6 h-6 text-amber-300" />
                <div>
                  <h3 className="text-base font-bold text-white">Lembar Konfirmasi Eduventure Unpad</h3>
                  <p className="text-xs text-blue-200">ID Kunjungan: {detailItem.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-1 text-xs"
                  title="Cetak Lembar Konfirmasi"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Cetak</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailItem(null)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="p-6 space-y-4 text-xs">
              {/* Header Info */}
              <div className="border-b border-slate-200 pb-4 flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
                    Direktorat Pendidikan Non Gelar • Universitas Padjadjaran
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-0.5">{detailItem.namaSekolah}</h2>
                  <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {detailItem.alamat || 'Alamat sekolah'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                    detailItem.statusBayar === 'Sudah' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {detailItem.statusBayar === 'Sudah' ? 'Status: LUNAS' : 'Status: BELUM LUNAS'}
                  </span>
                </div>
              </div>

              {/* Rincian Kunjungan */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">Skema / Paket:</span>
                  <span className="font-bold text-slate-800 text-sm">{detailItem.skemaPaket}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Tanggal Pelaksanaan:</span>
                  <span className="font-bold text-slate-800 text-sm">{detailItem.tanggalPelaksanaan}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Waktu Pelaksanaan:</span>
                  <span className="font-bold text-indigo-700 text-sm flex items-center gap-1.5 mt-0.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                    {detailItem.waktuMulai || '08:30'} - {detailItem.waktuSelesai || '12:00'} WIB
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Tempat Penyelenggaraan:</span>
                  <span className="font-bold text-purple-900 text-sm flex items-center gap-1.5 mt-0.5">
                    <Building2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    {detailItem.tempatPenyelenggaraan || 'Bale Sawala'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Jumlah Rombongan:</span>
                  <span className="font-semibold text-slate-800">
                    {detailItem.jumlahPeserta} Siswa + {detailItem.jumlahGuru || 0} Guru Pendamping
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px]">Pilihan Kunjungan:</span>
                  <span className="font-semibold text-slate-800">{detailItem.pilihanKunjungan}</span>
                  {detailItem.fakultasTujuan && detailItem.fakultasTujuan.length > 0 && (
                    <span className="text-slate-500 block text-[11px] mt-0.5">
                      Fakultas: {detailItem.fakultasTujuan.join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Rincian Narahubung */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">Narahubung / Koordinator Sekolah:</span>
                <div className="grid grid-cols-2 gap-3 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Nama Lengkap:</span>
                    <span className="font-medium text-slate-800">{detailItem.kontakPerson}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Kontak WhatsApp / Telp:</span>
                    <a 
                      href={`https://wa.me/${detailItem.nomorKontak.replace(/[^0-9]/g, '').replace(/^0/, '62')}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="font-mono text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {detailItem.nomorKontak}
                    </a>
                  </div>
                  {detailItem.emailKontak && (
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[11px]">Email Sekolah:</span>
                      <span className="text-slate-700">{detailItem.emailKontak}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rincian Keuangan */}
              <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4 space-y-2">
                <span className="font-bold text-[#002B66] block text-xs">Rincian Pembayaran & Rekening VA Unpad:</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Rekening Tujuan:</span>
                    <span className="font-mono font-bold text-slate-900">{detailItem.rekening}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Total Nominal:</span>
                    <span className="font-bold text-emerald-700 text-sm">{formatRupiah(detailItem.nominalTransfer)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Tanggal Transfer:</span>
                    <span className="font-medium text-slate-800">{detailItem.tanggalTransfer || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Status Bukti Transfer:</span>
                    {detailItem.buktiTransferUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewBuktiUrl(detailItem.buktiTransferUrl || null)}
                        className="text-blue-700 font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Lihat Gambar Bukti Transfer
                      </button>
                    ) : (
                      <span className="text-slate-400 italic">Belum ada file bukti transfer</span>
                    )}
                  </div>
                </div>
              </div>

              {detailItem.catatanTambahan && (
                <div className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700 block text-[11px] mb-1">Catatan Khusus:</span>
                  <p className="italic text-slate-600">{detailItem.catatanTambahan}</p>
                </div>
              )}
            </div>

            {/* Modal Bottom Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Dicatat: {detailItem.createdAt || '-'}
              </span>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL PREVIEW BUKTI TRANSFER ================= */}
      {previewBuktiUrl && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Bukti Transfer / Pembayaran Kunjungan
              </span>
              <button
                type="button"
                onClick={() => setPreviewBuktiUrl(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-100">
              {previewBuktiUrl.startsWith('data:image') || previewBuktiUrl.startsWith('http') ? (
                <img
                  src={previewBuktiUrl}
                  alt="Bukti Transfer"
                  className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-md"
                />
              ) : (
                <div className="text-center p-8 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm">Dokumen bukti transfer terlampir.</p>
                </div>
              )}
            </div>
            <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewBuktiUrl(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS ================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto mb-4 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Hapus Data Kunjungan Eduventure?
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Apakah Anda yakin ingin menghapus data kunjungan sekolah <strong>{deleteTarget.namaSekolah}</strong> ({deleteTarget.id})? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteEduventure(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
              >
                Ya, Hapus Kunjungan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL KELOLA TEMPAT PENYELENGGARAAN ================= */}
      {isManageTempatOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-[#2D1B69] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Building2 className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Kelola Tempat Penyelenggaraan</h3>
                  <p className="text-xs text-purple-200">Daftar gedung & auditorium kegiatan Eduventure Unpad</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManageTempatOpen(false)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Form Tambah Tempat Baru */}
              <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100">
                <label className="block text-xs font-bold text-purple-900 mb-1.5">
                  Tambah Tempat / Auditorium Baru:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contoh: Bale Rucita / Auditorium Pascasarjana"
                    value={newVenueInput}
                    onChange={(e) => setNewVenueInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewVenueToStorage(newVenueInput);
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddNewVenueToStorage(newVenueInput)}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah
                  </button>
                </div>
              </div>

              {/* List of Existing Venues */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">
                    Daftar Tempat Tersedia ({tempatList.length})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Tersimpan otomatis
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                  {tempatList.map((venue, idx) => (
                    <div
                      key={venue}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-800">{venue}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteVenueFromStorage(venue)}
                        className="opacity-60 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-all text-xs flex items-center gap-1"
                        title={`Hapus ${venue}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Hapus</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsManageTempatOpen(false)}
                className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Data Eduventure */}
      <EduventureImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingBookings={eduventureList}
        kategoriList={kategoriList}
        onImportSuccess={(items, mode) => {
          if (onBulkImportEduventure) {
            return onBulkImportEduventure(items, mode);
          }
          return bulkImportEduventure(items, mode);
        }}
      />
    </div>
  );
};
