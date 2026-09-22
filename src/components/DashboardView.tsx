import React, { useState, useMemo } from 'react';
import { 
  Users, UserCheck, Clock, Award, XCircle, 
  GraduationCap, Layers, Calendar, Filter, RotateCcw,
  Building2, MapPin, ArrowUpRight, Map, Compass, ChevronRight
} from 'lucide-react';
import { Peserta, Kategori, Program, LogAktivitas, EduventureBooking } from '../types';
import { UnpadLogo } from './UnpadLogo';

interface DashboardViewProps {
  pesertaList: Peserta[];
  kategoriList: Kategori[];
  programList: Program[];
  recentLogs: LogAktivitas[];
  eduventureList?: EduventureBooking[];
  onNavigateToPeserta: (filter?: Partial<Peserta>) => void;
  onNavigateToTambah: () => void;
  onNavigateToMap?: () => void;
  onNavigateToEduventure?: (targetTab?: 'eduventure' | 'eduventure_dashboard') => void;
  onNavigateToKategori?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  pesertaList,
  kategoriList,
  programList,
  recentLogs,
  eduventureList = [],
  onNavigateToPeserta,
  onNavigateToTambah,
  onNavigateToMap,
  onNavigateToEduventure,
  onNavigateToKategori,
}) => {
  // Filter state
  const [filterTahun, setFilterTahun] = useState<string>('ALL');
  const [filterKategori, setFilterKategori] = useState<string>('ALL');
  const [filterProgram, setFilterProgram] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterGender, setFilterGender] = useState<string>('ALL');
  const [filterProvinsi, setFilterProvinsi] = useState<string>('ALL');

  const handleResetFilters = () => {
    setFilterTahun('ALL');
    setFilterKategori('ALL');
    setFilterProgram('ALL');
    setFilterStatus('ALL');
    setFilterGender('ALL');
    setFilterProvinsi('ALL');
  };

  // Filtered Peserta Data
  const filteredPeserta = useMemo(() => {
    return pesertaList.filter(p => {
      if (filterTahun !== 'ALL' && String(p.tahun) !== filterTahun) return false;
      if (filterKategori !== 'ALL' && p.kategoriProgram !== filterKategori) return false;
      if (filterProgram !== 'ALL' && p.namaProgram !== filterProgram) return false;
      if (filterStatus !== 'ALL' && p.statusPeserta !== filterStatus) return false;
      if (filterGender !== 'ALL' && p.jenisKelamin !== filterGender) return false;
      if (filterProvinsi !== 'ALL' && p.provinsi !== filterProvinsi) return false;
      return true;
    });
  }, [pesertaList, filterTahun, filterKategori, filterProgram, filterStatus, filterGender, filterProvinsi]);

  // Calculations for 8 Stat Cards
  const currentYear = new Date().getFullYear();
  const totalPeserta = filteredPeserta.length;
  const pesertaAktif = filteredPeserta.filter(p => p.statusPeserta === 'Aktif').length;
  const pesertaSelesai = filteredPeserta.filter(p => p.statusPeserta === 'Selesai').length;
  const pesertaLulus = filteredPeserta.filter(p => p.statusPeserta === 'Lulus' || p.statusKelulusan === 'Lulus').length;
  const pesertaTidakLulus = filteredPeserta.filter(p => p.statusPeserta === 'Tidak Lulus' || p.statusPeserta === 'Mengundurkan Diri').length;
  const totalProg = programList.length;
  const totalKat = kategoriList.length;
  const pesertaTahunBerjalan = filteredPeserta.filter(p => p.tahun === currentYear).length;

  // Chart 1: Peserta per Kategori
  const kategoriStats = useMemo(() => {
    const counts: Record<string, number> = {};
    kategoriList.forEach(k => { counts[k.namaKategori] = 0; });
    filteredPeserta.forEach(p => {
      counts[p.kategoriProgram] = (counts[p.kategoriProgram] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [kategoriList, filteredPeserta]);

  // Chart 2: Peserta per Tahun
  const tahunStats = useMemo(() => {
    const counts: Record<string, number> = {};
    [2024, 2025, 2026].forEach(yr => { counts[yr] = 0; });
    filteredPeserta.forEach(p => {
      counts[p.tahun] = (counts[p.tahun] || 0) + 1;
    });
    return Object.entries(counts).map(([year, count]) => ({ year, count }));
  }, [filteredPeserta]);

  // Chart 3: Peserta per Status
  const statusStats = useMemo(() => {
    const counts: Record<string, number> = {
      Terdaftar: 0,
      Aktif: 0,
      Selesai: 0,
      Lulus: 0,
      'Tidak Lulus': 0,
      'Mengundurkan Diri': 0
    };
    filteredPeserta.forEach(p => {
      counts[p.statusPeserta] = (counts[p.statusPeserta] || 0) + 1;
    });
    return Object.entries(counts).filter(([, c]) => c > 0);
  }, [filteredPeserta]);

  // Chart 4: Jenis Kelamin
  const genderStats = useMemo(() => {
    const male = filteredPeserta.filter(p => p.jenisKelamin === 'Laki-laki').length;
    const female = filteredPeserta.filter(p => p.jenisKelamin === 'Perempuan').length;
    return { male, female };
  }, [filteredPeserta]);

  // Chart 5: Top 10 Instansi
  const topInstansi = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredPeserta.forEach(p => {
      if (p.instansi) {
        counts[p.instansi] = (counts[p.instansi] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredPeserta]);

  // Chart 6: Distribusi per Provinsi
  const provinsiStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredPeserta.forEach(p => {
      if (p.provinsi) {
        counts[p.provinsi] = (counts[p.provinsi] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredPeserta]);

  const maxKategoriCount = Math.max(...kategoriStats.map(k => k.count), 1);
  const maxInstansiCount = Math.max(...topInstansi.map(i => i.count), 1);

  // Eduventure metrics summary for linked display
  const eduventureSummary = useMemo(() => {
    const totalVisits = eduventureList.length;
    const totalParticipants = eduventureList.reduce(
      (sum, b) => sum + (Number(b.jumlahPeserta) || 0) + (Number(b.jumlahGuru) || 0), 
      0
    );
    const paidVisits = eduventureList.filter(b => b.statusPembayaran === 'Lunas').length;
    return { totalVisits, totalParticipants, paidVisits };
  }, [eduventureList]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Title & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <UnpadLogo variant="color" size="sm" />
          <div className="border-l border-slate-200 pl-3.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#002B66]">Dashboard Statistik Peserta</h1>
              <span className="text-[11px] font-bold bg-[#FDB913]/20 text-[#002B66] px-2 py-0.5 rounded-full border border-[#FDB913]/40">
                Live Google Sheets
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ringkasan data real-time Pendidikan Non Gelar Universitas Padjadjaran
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {onNavigateToEduventure && (
            <button
              id="btn-quick-eduventure"
              type="button"
              onClick={() => onNavigateToEduventure('eduventure')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#002B66] font-bold rounded-lg text-xs border border-indigo-200 shadow-xs transition-colors cursor-pointer"
              title="Buka Modul Eduventure (Agenda Kunjungan & VA)"
            >
              <Compass className="w-4 h-4 text-indigo-700" />
              <span>Modul Eduventure</span>
            </button>
          )}
          {onNavigateToMap && (
            <button
              id="btn-quick-map"
              onClick={onNavigateToMap}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Map className="w-4 h-4 text-slate-900" />
              <span>Peta Sebaran (Map)</span>
            </button>
          )}
          <button
            id="btn-quick-tambah"
            onClick={onNavigateToTambah}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span>+ Input Peserta Baru</span>
          </button>
        </div>
      </div>

      {/* 8 Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {/* Card 1: Total Peserta */}
        <div 
          onClick={() => onNavigateToPeserta()}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-[#002B66] cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Total Peserta</span>
            <Users className="w-4 h-4 text-[#002B66]" />
          </div>
          <div className="text-2xl font-black text-[#002B66]">{totalPeserta}</div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center">
            Database Terdaftar
          </div>
        </div>

        {/* Card 2: Peserta Aktif */}
        <div 
          onClick={() => onNavigateToPeserta({ statusPeserta: 'Aktif' })}
          className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-xs hover:border-blue-400 cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <span className="text-[11px] font-semibold">Peserta Aktif</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600">{pesertaAktif}</div>
          <div className="text-[10px] text-slate-400 mt-1">Sedang Belajar</div>
        </div>

        {/* Card 3: Peserta Selesai */}
        <div 
          onClick={() => onNavigateToPeserta({ statusPeserta: 'Selesai' })}
          className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs hover:border-amber-400 cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[11px] font-semibold">Selesai</span>
            <UserCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{pesertaSelesai}</div>
          <div className="text-[10px] text-slate-400 mt-1">Tuntas Modul</div>
        </div>

        {/* Card 4: Peserta Lulus */}
        <div 
          onClick={() => onNavigateToPeserta({ statusKelulusan: 'Lulus' })}
          className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs hover:border-emerald-400 cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[11px] font-semibold">Peserta Lulus</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{pesertaLulus}</div>
          <div className="text-[10px] text-emerald-600 mt-1 font-medium">Bersertifikat</div>
        </div>

        {/* Card 5: Peserta Tidak Lulus */}
        <div 
          onClick={() => onNavigateToPeserta({ statusPeserta: 'Tidak Lulus' })}
          className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs hover:border-rose-400 cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[11px] font-semibold">Tidak Lulus</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">{pesertaTidakLulus}</div>
          <div className="text-[10px] text-slate-400 mt-1">Evaluasi/DO</div>
        </div>

        {/* Card 6: Total Program */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Total Program</span>
            <GraduationCap className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">{totalProg}</div>
          <div className="text-[10px] text-slate-400 mt-1">Kurikulum Aktif</div>
        </div>

        {/* Card 7: Total Kategori */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Kategori</span>
            <Layers className="w-4 h-4 text-[#FDB913]" />
          </div>
          <div className="text-2xl font-black text-slate-800">{totalKat}</div>
          <div className="text-[10px] text-slate-400 mt-1">Divisi Program</div>
        </div>

        {/* Card 8: Peserta Tahun Berjalan */}
        <div className="bg-white p-3.5 rounded-xl border border-[#002B66]/30 shadow-xs bg-linear-to-b from-[#002B66]/5 to-transparent">
          <div className="flex items-center justify-between text-[#002B66] mb-1">
            <span className="text-[11px] font-bold">Tahun {currentYear}</span>
            <Calendar className="w-4 h-4 text-[#002B66]" />
          </div>
          <div className="text-2xl font-black text-[#002B66]">{pesertaTahunBerjalan}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">Tahun Berjalan</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#002B66]">
            <Filter className="w-4 h-4 text-[#FDB913]" />
            <span>Filter Statistik Dinamis</span>
          </div>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {/* Filter Tahun */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tahun</label>
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="ALL">Semua Tahun</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Filter Kategori */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kategori</label>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="ALL">Semua Kategori</option>
              {kategoriList.map(k => (
                <option key={k.idKategori} value={k.namaKategori}>{k.namaKategori}</option>
              ))}
            </select>
          </div>

          {/* Filter Program */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Program</label>
            <select
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="ALL">Semua Program</option>
              {programList.map(p => (
                <option key={p.idProgram} value={p.namaProgram}>{p.namaProgram}</option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status Peserta</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="ALL">Semua Status</option>
              <option value="Terdaftar">Terdaftar</option>
              <option value="Aktif">Aktif</option>
              <option value="Selesai">Selesai</option>
              <option value="Lulus">Lulus</option>
              <option value="Tidak Lulus">Tidak Lulus</option>
              <option value="Mengundurkan Diri">Mengundurkan Diri</option>
            </select>
          </div>

          {/* Filter Gender */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jenis Kelamin</label>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="ALL">Semua Gender</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          {/* Filter Provinsi */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Provinsi</label>
            <select
              value={filterProvinsi}
              onChange={(e) => setFilterProvinsi(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="ALL">Semua Provinsi</option>
              <option value="Jawa Barat">Jawa Barat</option>
              <option value="DKI Jakarta">DKI Jakarta</option>
              <option value="Jawa Tengah">Jawa Tengah</option>
              <option value="Jawa Timur">Jawa Timur</option>
              <option value="Sumatera Utara">Sumatera Utara</option>
              <option value="Bali">Bali</option>
              <option value="Sulawesi Selatan">Sulawesi Selatan</option>
            </select>
          </div>
        </div>
      </div>

      {/* 6 Responsive Dynamic Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Grafik 1: Peserta Berdasarkan Kategori */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#002B66]">Grafik 1: Peserta Berdasarkan Kategori</h2>
              <p className="text-[11px] text-slate-500">Distribusi peserta pada 13 kategori program</p>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {filteredPeserta.length} Data
            </span>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {kategoriStats.map(item => {
              const pct = maxKategoriCount > 0 ? (item.count / maxKategoriCount) * 100 : 0;
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 truncate pr-2">{item.name}</span>
                    <span className="font-bold text-[#002B66]">{item.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-[#002B66] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grafik 2: Trend Peserta per Tahun */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#002B66]">Grafik 2: Trend Peserta per Tahun</h2>
              <p className="text-[11px] text-slate-500">Pertumbuhan registrasi tahun 2024 - 2026</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Naik +35%
            </span>
          </div>

          <div className="h-[260px] flex items-end justify-around gap-6 pt-8 pb-4 border-b border-slate-200">
            {tahunStats.map(t => {
              const maxTahun = Math.max(...tahunStats.map(x => x.count), 1);
              const heightPct = Math.max((t.count / maxTahun) * 80, 10);
              return (
                <div key={t.year} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-xs font-bold text-[#002B66]">{t.count} Org</span>
                  <div className="w-full max-w-[60px] bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-[180px]">
                    <div 
                      className="w-full bg-gradient-to-t from-[#002B66] to-sky-500 rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-extrabold text-slate-700">{t.year}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grafik 3: Distribusi Status Peserta */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#002B66]">Grafik 3: Distribusi Status Peserta</h2>
              <p className="text-[11px] text-slate-500">Status penyelesaian studi peserta</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {statusStats.map(([st, cnt]) => {
              const badgeColors: Record<string, string> = {
                Terdaftar: 'border-slate-300 bg-slate-50 text-slate-700',
                Aktif: 'border-blue-300 bg-blue-50 text-blue-700',
                Selesai: 'border-amber-300 bg-amber-50 text-amber-700',
                Lulus: 'border-emerald-300 bg-emerald-50 text-emerald-700',
                'Tidak Lulus': 'border-rose-300 bg-rose-50 text-rose-700',
                'Mengundurkan Diri': 'border-purple-300 bg-purple-50 text-purple-700'
              };
              return (
                <div 
                  key={st}
                  className={`p-3 rounded-xl border ${badgeColors[st] || 'bg-slate-50'} text-center`}
                >
                  <div className="text-xl font-black">{cnt}</div>
                  <div className="text-[11px] font-semibold mt-0.5">{st}</div>
                  <div className="text-[10px] opacity-75">
                    {totalPeserta > 0 ? Math.round((cnt / totalPeserta) * 100) : 0}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grafik 4: Komposisi Jenis Kelamin */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#002B66]">Grafik 4: Komposisi Jenis Kelamin</h2>
              <p className="text-[11px] text-slate-500">Perbandingan peserta Laki-laki vs Perempuan</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
            <div className="flex items-center gap-4 bg-sky-50 border border-sky-200 p-4 rounded-xl flex-1 justify-center">
              <div className="w-12 h-12 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-base">
                LK
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600">Laki-laki</div>
                <div className="text-2xl font-black text-sky-800">{genderStats.male}</div>
                <div className="text-[11px] text-sky-600 font-medium">
                  {totalPeserta > 0 ? Math.round((genderStats.male / totalPeserta) * 100) : 0}%
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-rose-50 border border-rose-200 p-4 rounded-xl flex-1 justify-center">
              <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-base">
                PR
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600">Perempuan</div>
                <div className="text-2xl font-black text-rose-800">{genderStats.female}</div>
                <div className="text-[11px] text-rose-600 font-medium">
                  {totalPeserta > 0 ? Math.round((genderStats.female / totalPeserta) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grafik 5: Top 10 Instansi Peserta */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#002B66]">Grafik 5: Top 10 Instansi Peserta</h2>
              <p className="text-[11px] text-slate-500">Lembaga, universitas, & korporasi mitra</p>
            </div>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {topInstansi.map((ins, idx) => {
              const pct = maxInstansiCount > 0 ? (ins.count / maxInstansiCount) * 100 : 0;
              return (
                <div key={ins.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 truncate pr-2 font-medium">
                      <span className="text-slate-400 font-bold mr-1.5">{idx + 1}.</span>
                      {ins.name}
                    </span>
                    <span className="font-bold text-[#002B66]">{ins.count} Peserta</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-[#FDB913] h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grafik 6: Distribusi Peserta Berdasarkan Provinsi */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#002B66]">Grafik 6: Distribusi Asal Provinsi</h2>
              <p className="text-[11px] text-slate-500">Sebaran geografis asal peserta kursus</p>
            </div>
            {onNavigateToMap && (
              <button
                type="button"
                onClick={onNavigateToMap}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-[#002B66] hover:bg-blue-100 text-xs font-bold border border-blue-200 transition-colors cursor-pointer"
              >
                <Map className="w-3.5 h-3.5 text-[#002B66]" />
                <span>Buka di Peta</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {provinsiStats.map((prov) => (
              <div 
                key={prov.name}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80"
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="w-2 h-2 rounded-full bg-[#002B66]" />
                  <span className="text-xs font-semibold text-slate-800 truncate">{prov.name}</span>
                </div>
                <span className="text-xs font-bold text-[#002B66] bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                  {prov.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Log Strip */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#002B66]">Aktivitas Terakhir Sistem</h2>
          <span className="text-xs text-slate-400">Tercatat di Sheet LOG_AKTIVITAS</span>
        </div>

        <div className="divide-y divide-slate-100">
          {recentLogs.slice(0, 5).map(log => (
            <div key={log.id} className="py-2.5 flex items-start justify-between gap-4 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{log.aktivitas}</span>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                    {log.modul}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">{log.keterangan}</p>
              </div>
              <div className="text-right text-[11px] text-slate-400 shrink-0">
                <div>{log.timestamp}</div>
                <div className="text-[10px] text-slate-500 font-mono">{log.user}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
