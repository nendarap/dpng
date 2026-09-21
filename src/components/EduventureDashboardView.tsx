import React, { useState, useMemo } from 'react';
import { 
  Compass, Calendar, Users, CreditCard, Building2, 
  TrendingUp, CheckCircle2, Clock, AlertTriangle, 
  ArrowUpRight, School, Sparkles, Filter, RotateCcw, 
  CalendarDays, Table, LayoutGrid, FileSpreadsheet,
  Download, MessageCircle, ExternalLink, ChevronRight,
  ShieldCheck, Banknote, MapPin
} from 'lucide-react';
import { EduventureBooking, UserRole } from '../types';
import { UnpadLogo } from './UnpadLogo';

interface EduventureDashboardViewProps {
  eduventureList: EduventureBooking[];
  onSelectBooking: (item: EduventureBooking) => void;
  onEditBooking: (item: EduventureBooking) => void;
  onAddNewBooking: () => void;
  onSwitchViewMode: (mode: 'card' | 'table' | 'calendar') => void;
  onExportCSV: () => void;
  userRole: UserRole;
}

export const EduventureDashboardView: React.FC<EduventureDashboardViewProps> = ({
  eduventureList,
  onSelectBooking,
  onEditBooking,
  onAddNewBooking,
  onSwitchViewMode,
  onExportCSV,
  userRole,
}) => {
  // Filter States
  const [filterTahun, setFilterTahun] = useState<string>('ALL');
  const [filterSkema, setFilterSkema] = useState<string>('ALL');
  const [filterStatusBayar, setFilterStatusBayar] = useState<string>('ALL');
  const [filterPilihan, setFilterPilihan] = useState<string>('ALL');
  const [filterTempat, setFilterTempat] = useState<string>('ALL');

  // Extract unique available years and venues
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    eduventureList.forEach(item => {
      if (item.tanggalPelaksanaan) {
        const y = item.tanggalPelaksanaan.split('-')[0];
        if (y) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [eduventureList]);

  const availableVenues = useMemo(() => {
    const venues = new Set<string>();
    eduventureList.forEach(item => {
      if (item.tempatPenyelenggaraan) {
        venues.add(item.tempatPenyelenggaraan);
      }
    });
    return Array.from(venues).sort();
  }, [eduventureList]);

  const hasActiveFilters = filterTahun !== 'ALL' || filterSkema !== 'ALL' || filterStatusBayar !== 'ALL' || filterPilihan !== 'ALL' || filterTempat !== 'ALL';

  const handleResetFilters = () => {
    setFilterTahun('ALL');
    setFilterSkema('ALL');
    setFilterStatusBayar('ALL');
    setFilterPilihan('ALL');
    setFilterTempat('ALL');
  };

  // Filtered dataset
  const filteredList = useMemo(() => {
    return eduventureList.filter(item => {
      if (filterTahun !== 'ALL') {
        const y = item.tanggalPelaksanaan?.split('-')[0];
        if (y !== filterTahun) return false;
      }
      if (filterSkema !== 'ALL' && item.skemaPaket !== filterSkema) return false;
      if (filterStatusBayar !== 'ALL' && item.statusBayar !== filterStatusBayar) return false;
      if (filterPilihan !== 'ALL' && item.pilihanKunjungan !== filterPilihan) return false;
      if (filterTempat !== 'ALL' && (item.tempatPenyelenggaraan || 'Bale Sawala') !== filterTempat) return false;
      return true;
    });
  }, [eduventureList, filterTahun, filterSkema, filterStatusBayar, filterPilihan, filterTempat]);

  // Executive KPI Computations
  const stats = useMemo(() => {
    const totalBookings = filteredList.length;
    const totalSiswa = filteredList.reduce((acc, curr) => acc + (Number(curr.jumlahPeserta) || 0), 0);
    const totalGuru = filteredList.reduce((acc, curr) => acc + (Number(curr.jumlahGuru) || 0), 0);
    const totalPartisipan = totalSiswa + totalGuru;

    const sudahBayarItems = filteredList.filter(b => b.statusBayar === 'Sudah');
    const belumBayarItems = filteredList.filter(b => b.statusBayar === 'Belum');

    const totalNominalLunas = sudahBayarItems.reduce((acc, curr) => acc + (Number(curr.nominalTransfer) || 0), 0);
    const totalNominalPiutang = belumBayarItems.reduce((acc, curr) => acc + (Number(curr.nominalTransfer) || 0), 0);
    const totalPotentialRevenue = totalNominalLunas + totalNominalPiutang;

    const paymentRate = totalBookings > 0 
      ? Math.round((sudahBayarItems.length / totalBookings) * 100) 
      : 0;

    const avgPesertaPerSekolah = totalBookings > 0 
      ? Math.round(totalPartisipan / totalBookings) 
      : 0;

    // Status Kunjungan
    const terlaksanaCount = filteredList.filter(b => b.statusKunjungan === 'Terlaksana').length;
    const dikonfirmasiCount = filteredList.filter(b => b.statusKunjungan === 'Dikonfirmasi').length;
    const menungguCount = filteredList.filter(b => !b.statusKunjungan || b.statusKunjungan === 'Menunggu').length;
    const batalCount = filteredList.filter(b => b.statusKunjungan === 'Batal').length;

    // Top Venue
    const venueCountMap: Record<string, { count: number; peserta: number }> = {};
    filteredList.forEach(item => {
      const v = item.tempatPenyelenggaraan || 'Bale Sawala';
      if (!venueCountMap[v]) venueCountMap[v] = { count: 0, peserta: 0 };
      venueCountMap[v].count++;
      venueCountMap[v].peserta += (Number(item.jumlahPeserta) || 0) + (Number(item.jumlahGuru) || 0);
    });
    const topVenueEntry = Object.entries(venueCountMap).sort((a, b) => b[1].count - a[1].count)[0];
    const topVenue = topVenueEntry ? { name: topVenueEntry[0], count: topVenueEntry[1].count, peserta: topVenueEntry[1].peserta } : { name: 'Bale Sawala', count: 0, peserta: 0 };

    // Top Package
    const packageCountMap: Record<string, { count: number; revenue: number }> = {};
    filteredList.forEach(item => {
      const p = item.skemaPaket || 'Eduventure Experience';
      if (!packageCountMap[p]) packageCountMap[p] = { count: 0, revenue: 0 };
      packageCountMap[p].count++;
      if (item.statusBayar === 'Sudah') {
        packageCountMap[p].revenue += Number(item.nominalTransfer) || 0;
      }
    });
    const topPackageEntry = Object.entries(packageCountMap).sort((a, b) => b[1].count - a[1].count)[0];
    const topPackage = topPackageEntry ? { name: topPackageEntry[0], count: topPackageEntry[1].count } : { name: 'Eduventure Experience', count: 0 };

    return {
      totalBookings,
      totalSiswa,
      totalGuru,
      totalPartisipan,
      totalNominalLunas,
      totalNominalPiutang,
      totalPotentialRevenue,
      paymentRate,
      avgPesertaPerSekolah,
      terlaksanaCount,
      dikonfirmasiCount,
      menungguCount,
      batalCount,
      topVenue,
      topPackage,
      venueCountMap,
      packageCountMap,
      belumBayarCount: belumBayarItems.length,
      sudahBayarCount: sudahBayarItems.length
    };
  }, [filteredList]);

  // Monthly Distribution Trend (12 Months)
  const monthlyData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const currentMonthIdx = new Date().getMonth();
    
    const data = monthNames.map((name, idx) => ({
      monthName: name,
      monthIdx: idx,
      kunjungan: 0,
      peserta: 0,
      nominal: 0,
      isCurrentMonth: idx === currentMonthIdx,
    }));

    filteredList.forEach(item => {
      if (item.tanggalPelaksanaan) {
        const parts = item.tanggalPelaksanaan.split('-');
        if (parts.length >= 2) {
          const mIdx = parseInt(parts[1], 10) - 1;
          if (mIdx >= 0 && mIdx < 12) {
            data[mIdx].kunjungan++;
            data[mIdx].peserta += (Number(item.jumlahPeserta) || 0) + (Number(item.jumlahGuru) || 0);
            if (item.statusBayar === 'Sudah') {
              data[mIdx].nominal += Number(item.nominalTransfer) || 0;
            }
          }
        }
      }
    });

    const maxKunjungan = Math.max(...data.map(d => d.kunjungan), 1);
    const maxPeserta = Math.max(...data.map(d => d.peserta), 1);

    return { data, maxKunjungan, maxPeserta };
  }, [filteredList]);

  // Pilihan Kunjungan: Universitas vs Fakultas
  const kunjunganPilihanStats = useMemo(() => {
    let univCount = 0;
    let fakultasCount = 0;
    const facultyMap: Record<string, number> = {};

    filteredList.forEach(item => {
      if (item.pilihanKunjungan === 'Universitas') {
        univCount++;
      } else {
        fakultasCount++;
        if (item.fakultasTujuan && Array.isArray(item.fakultasTujuan)) {
          item.fakultasTujuan.forEach(f => {
            facultyMap[f] = (facultyMap[f] || 0) + 1;
          });
        }
      }
    });

    const topFaculties = Object.entries(facultyMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { univCount, fakultasCount, topFaculties };
  }, [filteredList]);

  // Rekening Virtual Account Breakdown
  const rekeningStats = useMemo(() => {
    const rekMap: Record<string, { count: number; nominal: number }> = {
      'Eduventure 9882340560200004': { count: 0, nominal: 0 },
      'Luhung 9880619020200219': { count: 0, nominal: 0 }
    };

    filteredList.forEach(item => {
      const rek = item.rekening || 'Eduventure 9882340560200004';
      if (!rekMap[rek]) rekMap[rek] = { count: 0, nominal: 0 };
      rekMap[rek].count++;
      if (item.statusBayar === 'Sudah') {
        rekMap[rek].nominal += Number(item.nominalTransfer) || 0;
      }
    });

    return Object.entries(rekMap);
  }, [filteredList]);

  // Upcoming Visits (Next visits from today onwards, or sorted by date)
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingVisits = useMemo(() => {
    return [...filteredList]
      .filter(item => item.tanggalPelaksanaan && item.statusKunjungan !== 'Batal')
      .sort((a, b) => a.tanggalPelaksanaan.localeCompare(b.tanggalPelaksanaan))
      .slice(0, 6);
  }, [filteredList]);

  // Pending Payments requiring follow-up
  const pendingPayments = useMemo(() => {
    return [...filteredList]
      .filter(item => item.statusBayar === 'Belum' && item.statusKunjungan !== 'Batal')
      .sort((a, b) => a.tanggalPelaksanaan.localeCompare(b.tanggalPelaksanaan))
      .slice(0, 5);
  }, [filteredList]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getWaLink = (item: EduventureBooking) => {
    const rawNo = item.nomorKontak ? item.nomorKontak.replace(/[^0-9]/g, '') : '';
    let waPhone = rawNo;
    if (waPhone.startsWith('0')) {
      waPhone = '62' + waPhone.substring(1);
    }
    const message = encodeURIComponent(
      `Halo Bapak/Ibu ${item.kontakPerson || 'Narahubung'},\n\nKami dari Sekretariat Eduventure Universitas Padjadjaran mengonfirmasi terkait rencana kunjungan kampus dari *${item.namaSekolah}* pada tanggal *${item.tanggalPelaksanaan}* (${item.waktuMulai || '08:30'} - ${item.waktuSelesai || '12:00'} WIB) di *${item.tempatPenyelenggaraan || 'Bale Sawala'}*.\n\nMohon informasi terkait kelengkapan administrasi dan pembayaran Virtual Account (${item.rekening}) sebesar ${formatRupiah(item.nominalTransfer)}.\n\nTerima kasih.`
    );
    return `https://wa.me/${waPhone}?text=${message}`;
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Header Banner & Action Bar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#002B66] via-[#083a7e] to-[#002252] text-white p-6 sm:p-7 shadow-xl border border-blue-900/40">
        {/* Decorative Background Elements */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#FDB913]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 right-40 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-semibold tracking-wide text-amber-300">
              <Compass className="w-3.5 h-3.5 animate-spin-slow" />
              <span>Universitas Padjadjaran • Direktorat Pendidikan Non-Gelar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Dashboard Eduventure</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FDB913] text-slate-900 border border-amber-300 shadow-xs">
                Eksekutif & Analitik
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl leading-relaxed">
              Ringkasan performa kunjungan kampus sekolah, pemantauan kapasitas rombongan siswa, utilisasi gedung/bale pertemuan, dan rekonsiliasi penerimaan Virtual Account (VA) Unpad.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {userRole !== 'VIEWER' && (
              <button
                id="btn-dash-tambah-kunjungan"
                type="button"
                onClick={onAddNewBooking}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-[#FDB913] hover:bg-[#e5a60d] text-slate-900 font-bold rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-150 transform hover:-translate-y-0.5 border border-amber-300 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-900" />
                <span>+ Tambah Agenda</span>
              </button>
            )}

            <button
              id="btn-dash-open-kalender"
              type="button"
              onClick={() => onSwitchViewMode('calendar')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-150 transform hover:-translate-y-0.5 border border-indigo-500/40 cursor-pointer"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Kalender Agenda</span>
            </button>

            <button
              id="btn-dash-open-table"
              type="button"
              onClick={() => onSwitchViewMode('table')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-xs sm:text-sm border border-white/20 transition-all cursor-pointer"
            >
              <Table className="w-4 h-4" />
              <span>Data Tabel</span>
            </button>

            <button
              type="button"
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-xs border border-white/20 transition-all cursor-pointer"
              title="Unduh Laporan Rekap CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Global Filter Bar inside Header */}
        <div className="mt-6 pt-5 border-t border-white/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-2">
            <span className="font-semibold text-blue-200 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#FDB913]" />
              Filter Parameter Analitik:
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1 transition-colors self-start sm:self-auto cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Semua Filter ({filteredList.length} dari {eduventureList.length} agenda)
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
            {/* Filter Tahun */}
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-blue-200/80 mb-1">
                Tahun
              </label>
              <select
                value={filterTahun}
                onChange={(e) => setFilterTahun(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#FDB913]"
              >
                <option value="ALL" className="text-slate-900">Semua Tahun</option>
                {availableYears.map(y => (
                  <option key={y} value={y} className="text-slate-900">Tahun {y}</option>
                ))}
              </select>
            </div>

            {/* Filter Skema Paket */}
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-blue-200/80 mb-1">
                Skema Paket
              </label>
              <select
                value={filterSkema}
                onChange={(e) => setFilterSkema(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#FDB913]"
              >
                <option value="ALL" className="text-slate-900">Semua Skema Paket</option>
                <option value="Eduventure Lite" className="text-slate-900">Eduventure Lite</option>
                <option value="Eduventure Experience" className="text-slate-900">Eduventure Experience</option>
                <option value="Eduventure Tematik" className="text-slate-900">Eduventure Tematik</option>
              </select>
            </div>

            {/* Filter Status Bayar */}
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-blue-200/80 mb-1">
                Status Pembayaran VA
              </label>
              <select
                value={filterStatusBayar}
                onChange={(e) => setFilterStatusBayar(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#FDB913]"
              >
                <option value="ALL" className="text-slate-900">Semua Status Bayar</option>
                <option value="Sudah" className="text-slate-900">Sudah Bayar (Lunas)</option>
                <option value="Belum" className="text-slate-900">Belum Bayar</option>
              </select>
            </div>

            {/* Filter Pilihan Kunjungan */}
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-blue-200/80 mb-1">
                Tingkat Kunjungan
              </label>
              <select
                value={filterPilihan}
                onChange={(e) => setFilterPilihan(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#FDB913]"
              >
                <option value="ALL" className="text-slate-900">Semua Tingkat</option>
                <option value="Universitas" className="text-slate-900">Universitas (Rektorat/Pusat)</option>
                <option value="Fakultas" className="text-slate-900">Fakultas Spesifik</option>
              </select>
            </div>

            {/* Filter Tempat */}
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-blue-200/80 mb-1">
                Tempat / Venue
              </label>
              <select
                value={filterTempat}
                onChange={(e) => setFilterTempat(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#FDB913]"
              >
                <option value="ALL" className="text-slate-900">Semua Venue</option>
                {availableVenues.map(v => (
                  <option key={v} value={v} className="text-slate-900">{v}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Executive KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Kunjungan Sekolah */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Kunjungan</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#002B66] flex items-center justify-center border border-blue-100">
              <School className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.totalBookings}
            </span>
            <span className="text-xs font-semibold text-slate-500">Sekolah</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              {stats.terlaksanaCount} Selesai
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              {stats.dikonfirmasiCount} Dikonfirmasi
            </span>
            {stats.menungguCount > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                {stats.menungguCount} Menunggu
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Total Partisipan (Siswa & Guru) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Partisipan</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.totalPartisipan.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-semibold text-slate-500">Orang</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-100">
            <span><strong>{stats.totalSiswa.toLocaleString('id-ID')}</strong> Siswa</span>
            <span>•</span>
            <span><strong>{stats.totalGuru.toLocaleString('id-ID')}</strong> Guru Pendamping</span>
          </div>
        </div>

        {/* Card 3: Realisasi Finansial Virtual Account */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Realisasi VA (Lunas)</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-100">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight truncate" title={formatRupiah(stats.totalNominalLunas)}>
            {formatRupiah(stats.totalNominalLunas)}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
            <span className="text-slate-500">Piutang Belum Bayar:</span>
            <span className="font-bold text-rose-600">{formatRupiah(stats.totalNominalPiutang)}</span>
          </div>
        </div>

        {/* Card 4: Tingkat Pelunasan VA */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tingkat Pelunasan</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.paymentRate}%
            </span>
            <span className="text-xs font-bold text-slate-500">
              {stats.sudahBayarCount} / {stats.totalBookings} Lunas
            </span>
          </div>
          {/* Visual Progress Bar */}
          <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-purple-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${stats.paymentRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Visual Analytics Panels (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel 1: Tren Bulanan Kunjungan & Partisipan (Span 2) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#002B66]" />
                Tren Kunjungan & Volume Partisipan Bulanan
              </h2>
              <p className="text-xs text-slate-500">
                Visualisasi frekuensi sekolah yang berkunjung dan akumulasi peserta per bulan
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 rounded-xs bg-[#002B66]" />
                Frekuensi Kunjungan
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 rounded-xs bg-[#FDB913]" />
                Bulan Berjalan
              </span>
            </div>
          </div>

          {/* Interactive Bar Chart Visualization */}
          <div className="grid grid-cols-12 gap-1.5 sm:gap-2 pt-6 pb-2 items-end h-56 border-b border-slate-200">
            {monthlyData.data.map((m) => {
              const heightPercent = m.kunjungan > 0 
                ? Math.max(Math.round((m.kunjungan / monthlyData.maxKunjungan) * 100), 12) 
                : 4;

              return (
                <div key={m.monthName} className="flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-12 z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 text-white text-[11px] rounded-lg py-1 px-2 shadow-lg whitespace-nowrap">
                    <p className="font-bold">{m.monthName}: {m.kunjungan} Kunjungan</p>
                    <p className="text-amber-300 font-mono text-[10px]">{m.peserta} Peserta</p>
                  </div>

                  {/* Frequency Value Badge */}
                  {m.kunjungan > 0 && (
                    <span className="text-[10px] font-bold text-slate-700 mb-1 font-mono">
                      {m.kunjungan}
                    </span>
                  )}

                  {/* Bar */}
                  <div 
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      m.isCurrentMonth
                        ? 'bg-[#FDB913] hover:bg-amber-400 shadow-xs'
                        : m.kunjungan > 0
                          ? 'bg-[#002B66] hover:bg-blue-800'
                          : 'bg-slate-100'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />

                  {/* Month Label */}
                  <span className={`text-[10px] sm:text-xs mt-2 font-medium ${m.isCurrentMonth ? 'text-[#002B66] font-bold' : 'text-slate-500'}`}>
                    {m.monthName}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Monthly Insights Summary Bar */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-500 block text-[11px]">Rata-rata Rombongan:</span>
              <span className="font-bold text-slate-800">{stats.avgPesertaPerSekolah} Orang / Kunjungan</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Venue Terfavorit:</span>
              <span className="font-bold text-purple-700 truncate block">{stats.topVenue.name} ({stats.topVenue.count}x)</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Paket Terlaris:</span>
              <span className="font-bold text-blue-800 truncate block">{stats.topPackage.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Status Kunjungan:</span>
              <span className="font-bold text-emerald-700">{stats.terlaksanaCount} Sukses Terlaksana</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Distribusi Skema Paket Eduventure (Span 1) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Skema Paket Kunjungan
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Pangsa pilihan paket edukasi dan kontribusi penerimaan rupiah
            </p>

            {/* Package List */}
            <div className="space-y-4">
              {[
                { 
                  name: 'Eduventure Experience', 
                  color: 'bg-[#002B66]', 
                  textColor: 'text-blue-900', 
                  desc: 'Tur kampus interaktif, laboratorium & fakultas pilihan' 
                },
                { 
                  name: 'Eduventure Lite', 
                  color: 'bg-emerald-600', 
                  textColor: 'text-emerald-900', 
                  desc: 'Eksplorasi pengenalan kampus dan fasilitas Unpad' 
                },
                { 
                  name: 'Eduventure Tematik', 
                  color: 'bg-purple-600', 
                  textColor: 'text-purple-900', 
                  desc: 'Workshop khusus, kelas praktikum & kuliah pakar' 
                },
              ].map(pkg => {
                const count = stats.packageCountMap[pkg.name]?.count || 0;
                const revenue = stats.packageCountMap[pkg.name]?.revenue || 0;
                const percent = stats.totalBookings > 0 ? Math.round((count / stats.totalBookings) * 100) : 0;

                return (
                  <div key={pkg.name} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-800">{pkg.name}</span>
                      <span className="font-black text-slate-900">{count} Sekolah ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                      <div className={`${pkg.color} h-full rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="text-[10px] text-slate-400 truncate max-w-[140px]">{pkg.desc}</span>
                      <span className="font-semibold text-emerald-700 font-mono">{formatRupiah(revenue)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Potensi Total Bruto:</span>
            <span className="font-black text-slate-900 text-sm font-mono">{formatRupiah(stats.totalPotentialRevenue)}</span>
          </div>
        </div>
      </div>

      {/* 4. Secondary Analytics Row: Venue Utilization & Virtual Account Reconciliation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Utilisasi Tempat Penyelenggaraan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-purple-600" />
            Utilisasi Tempat Penyelenggaraan
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Auditorium & bale kampus yang digunakan untuk penerimaan
          </p>

          <div className="space-y-3">
            {Object.entries(stats.venueCountMap)
              .sort((a, b) => b[1].count - a[1].count)
              .slice(0, 5)
              .map(([venueName, data]) => {
                const percent = stats.totalBookings > 0 ? Math.round((data.count / stats.totalBookings) * 100) : 0;
                return (
                  <div key={venueName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 truncate max-w-[180px]">{venueName}</span>
                      <span className="font-bold text-slate-900">{data.count} Kunjungan ({data.peserta} orang)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Card 2: Pilihan Kunjungan & Fakultas Paling Diminati */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
            <School className="w-4 h-4 text-blue-600" />
            Destinasi: Univ vs Fakultas
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Proporsi kunjungan tingkat universitas vs fakultas spesifik
          </p>

          {/* Univ vs Fakultas split bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1 font-semibold">
              <span className="text-blue-700">Tingkat Univ: {kunjunganPilihanStats.univCount}</span>
              <span className="text-emerald-700">Tingkat Fak: {kunjunganPilihanStats.fakultasCount}</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
              <div 
                className="bg-[#002B66] h-full" 
                style={{ 
                  width: `${stats.totalBookings > 0 ? (kunjunganPilihanStats.univCount / stats.totalBookings) * 100 : 50}%` 
                }} 
              />
              <div 
                className="bg-emerald-500 h-full" 
                style={{ 
                  width: `${stats.totalBookings > 0 ? (kunjunganPilihanStats.fakultasCount / stats.totalBookings) * 100 : 50}%` 
                }} 
              />
            </div>
          </div>

          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Top Fakultas Tujuan
          </span>
          <div className="space-y-2 text-xs">
            {kunjunganPilihanStats.topFaculties.length > 0 ? (
              kunjunganPilihanStats.topFaculties.map(([fac, count]) => (
                <div key={fac} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-700 font-medium truncate max-w-[190px]">{fac}</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-900 text-[11px]">
                    {count} Kunjungan
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic py-2">Belum ada kunjungan bertarget fakultas spesifik</p>
            )}
          </div>
        </div>

        {/* Card 3: Rekonsiliasi Rekening Virtual Account */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            Rekening Virtual Account (VA)
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Distribusi transaksi pada rekening penerimaan resmi BNI
          </p>

          <div className="space-y-3">
            {rekeningStats.map(([rekName, data]) => (
              <div key={rekName} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">{rekName}</span>
                  <span className="text-[11px] font-semibold text-slate-500">{data.count} Transaksi</span>
                </div>
                <div className="text-sm font-black text-emerald-700 font-mono">
                  {formatRupiah(data.nominal)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  Rekening Giro Terdaftar Unpad
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>Pastikan bukti transfer telah diverifikasi dan dicocokkan dengan mutasi rekening koran BNI.</span>
          </div>
        </div>
      </div>

      {/* 5. Operational Action Center: Upcoming Schedule & Pending Payment Follow-up */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jadwal Kunjungan Terdekat */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Jadwal Kunjungan Terdekat
              </h2>
              <p className="text-xs text-slate-500">Agenda kunjungan sekolah yang akan datang</p>
            </div>
            <button
              type="button"
              onClick={() => onSwitchViewMode('calendar')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              Lihat Kalender <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingVisits.length > 0 ? (
              upcomingVisits.map(item => (
                <div 
                  key={item.id}
                  onClick={() => onSelectBooking(item)}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white hover:bg-slate-50/80 transition-all cursor-pointer shadow-2xs group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-indigo-700 transition-colors">
                          {item.namaSekolah}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {item.skemaPaket}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Calendar className="w-3 h-3 text-indigo-600" />
                          {item.tanggalPelaksanaan}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-indigo-700">
                          <Clock className="w-3 h-3 text-indigo-500" />
                          {item.waktuMulai || '08:30'} - {item.waktuSelesai || '12:00'} WIB
                        </span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <Building2 className="w-3 h-3 text-purple-500" />
                          {item.tempatPenyelenggaraan || 'Bale Sawala'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        item.statusBayar === 'Sudah'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {item.statusBayar === 'Sudah' ? 'Lunas' : 'Belum Bayar'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {(Number(item.jumlahPeserta) || 0) + (Number(item.jumlahGuru) || 0)} Peserta
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                Tidak ada agenda kunjungan terdekat pada filter aktif.
              </div>
            )}
          </div>
        </div>

        {/* Tindak Lanjut Pembayaran Belum Lunas */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Tindak Lanjut Tagihan Belum Lunas
              </h2>
              <p className="text-xs text-slate-500">Sekolah terdaftar dengan status konfirmasi pembayaran tertunda</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              {stats.belumBayarCount} Tertunda
            </span>
          </div>

          <div className="space-y-3">
            {pendingPayments.length > 0 ? (
              pendingPayments.map(item => (
                <div 
                  key={item.id}
                  className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/30 hover:bg-rose-50/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                        {item.namaSekolah}
                      </h3>
                      <p className="text-[11px] text-slate-600">
                        Kontak: <strong>{item.kontakPerson}</strong> ({item.nomorKontak || '-'})
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>Jadwal: {item.tanggalPelaksanaan}</span>
                        <span>•</span>
                        <span className="font-black text-rose-700 font-mono">
                          {formatRupiah(item.nominalTransfer)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {item.nomorKontak && (
                        <a
                          href={getWaLink(item)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-2xs transition-colors"
                          title="Kirim Pesan Konfirmasi via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Hubungi WA</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => onEditBooking(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                        title="Verifikasi Pembayaran"
                      >
                        Verifikasi
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <span>Semua tagihan kunjungan pada filter aktif telah terverifikasi lunas!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
