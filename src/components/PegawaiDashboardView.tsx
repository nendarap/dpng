import React, { useState, useMemo } from 'react';
import { 
  Briefcase, Users, GraduationCap, Award, ShieldAlert, 
  Filter, RotateCcw, Download, Printer, UserCheck, 
  ChevronRight, Building2, Calendar, MapPin, Search,
  ArrowUpRight, Clock, HeartHandshake, CheckCircle2,
  Sparkles, Layers, FileSpreadsheet, Eye, Plus, AlertTriangle
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import { Pegawai, UserRole } from '../types';
import { UnpadLogo } from './UnpadLogo';

interface PegawaiDashboardViewProps {
  pegawaiList: Pegawai[];
  userRole: UserRole;
  onNavigateToTable: (filters?: {
    statusKepegawaian?: string;
    statusAktif?: string;
    unitKerja?: string;
    jenjang?: string;
    gender?: string;
    searchQuery?: string;
  }) => void;
  onAddNewPegawai?: () => void;
}

// Palet warna resmi Universitas Padjadjaran & turunan eksekutif
const UNPAD_COLORS = [
  '#002B66', // Unpad Deep Navy
  '#FDB913', // Unpad Warm Gold
  '#046A38', // Unpad Emerald Green
  '#881337', // Unpad Deep Maroon
  '#2563EB', // Royal Blue
  '#7C3AED', // Vivid Purple
  '#0891B2', // Cyan Teal
  '#D97706', // Amber
  '#4F46E5', // Indigo
  '#059669', // Mint
  '#E11D48', // Rose Red
  '#475569'  // Slate Slate
];

// Helper kalkulasi umur dari tanggal lahir (YYYY-MM-DD)
function calculateAge(tanggalLahir?: string): number | null {
  if (!tanggalLahir) return null;
  const parts = tanggalLahir.split('-');
  if (parts.length < 3) return null;
  const birthDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  if (isNaN(birthDate.getTime())) return null;
  
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 && age < 120 ? age : null;
}

// Estimasi batas usia pensiun (BUP) berdasarkan jabatan
function getBatasUsiaPensiun(jabatanFungsional: string = '', jabatanStruktural: string = ''): { bup: number; label: string } {
  const jf = (jabatanFungsional || '').toLowerCase();
  const js = (jabatanStruktural || '').toLowerCase();

  if (jf.includes('guru besar') || jf.includes('profesor') || jf.includes('professor')) {
    return { bup: 70, label: 'Guru Besar (BUP 70 Thn)' };
  }
  if (jf.includes('lektor kepala') || jf.includes('lektor') || jf.includes('asisten ahli') || jf.includes('dosen')) {
    return { bup: 65, label: 'Dosen / Fungsional Akademik (BUP 65 Thn)' };
  }
  if (js.includes('direktur') || js.includes('dekan') || js.includes('kepala biro')) {
    return { bup: 60, label: 'Pejabat Pimpinan Tinggi / Madya (BUP 60 Thn)' };
  }
  return { bup: 58, label: 'Tenaga Kependidikan / Fungsional (BUP 58 Thn)' };
}

export const PegawaiDashboardView: React.FC<PegawaiDashboardViewProps> = ({
  pegawaiList,
  userRole,
  onNavigateToTable,
  onAddNewPegawai,
}) => {
  // Sub-tab analitik
  const [activeTab, setActiveTab] = useState<'overview' | 'unit_kerja' | 'pensiun' | 'pendidikan'>('overview');

  // Filter States
  const [filterUnitKerja, setFilterUnitKerja] = useState<string>('ALL');
  const [filterKepegawaian, setFilterKepegawaian] = useState<string>('ALL');
  const [filterStatusAktif, setFilterStatusAktif] = useState<string>('ALL');
  const [filterJenjang, setFilterJenjang] = useState<string>('ALL');
  const [filterGender, setFilterGender] = useState<string>('ALL');
  const [filterUsiaBracket, setFilterUsiaBracket] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique options
  const unitKerjaOptions = useMemo(() => {
    const set = new Set<string>();
    pegawaiList.forEach(p => {
      if (p.unitKerja) set.add(p.unitKerja);
    });
    return Array.from(set).sort();
  }, [pegawaiList]);

  const kepegawaianOptions = useMemo(() => {
    const set = new Set<string>();
    pegawaiList.forEach(p => {
      if (p.statusKepegawaian) set.add(p.statusKepegawaian);
    });
    return Array.from(set).sort();
  }, [pegawaiList]);

  const jenjangOptions = useMemo(() => {
    const set = new Set<string>();
    pegawaiList.forEach(p => {
      if (p.jenjang) set.add(p.jenjang.toUpperCase());
    });
    return Array.from(set).sort();
  }, [pegawaiList]);

  const handleResetFilters = () => {
    setFilterUnitKerja('ALL');
    setFilterKepegawaian('ALL');
    setFilterStatusAktif('ALL');
    setFilterJenjang('ALL');
    setFilterGender('ALL');
    setFilterUsiaBracket('ALL');
    setSearchQuery('');
  };

  const hasActiveFilters = 
    filterUnitKerja !== 'ALL' ||
    filterKepegawaian !== 'ALL' ||
    filterStatusAktif !== 'ALL' ||
    filterJenjang !== 'ALL' ||
    filterGender !== 'ALL' ||
    filterUsiaBracket !== 'ALL' ||
    searchQuery.trim() !== '';

  // Filtered dataset
  const filteredPegawai = useMemo(() => {
    return pegawaiList.filter(p => {
      if (filterUnitKerja !== 'ALL' && p.unitKerja !== filterUnitKerja) return false;
      if (filterKepegawaian !== 'ALL' && p.statusKepegawaian !== filterKepegawaian) return false;
      if (filterStatusAktif !== 'ALL' && p.statusAktif !== filterStatusAktif) return false;
      if (filterJenjang !== 'ALL' && (p.jenjang || '').toUpperCase() !== filterJenjang) return false;
      if (filterGender !== 'ALL' && p.jenisKelamin !== filterGender) return false;

      const age = calculateAge(p.tanggalLahir);
      if (filterUsiaBracket !== 'ALL') {
        if (age === null) return false;
        if (filterUsiaBracket === '<30' && age >= 30) return false;
        if (filterUsiaBracket === '30-39' && (age < 30 || age > 39)) return false;
        if (filterUsiaBracket === '40-49' && (age < 40 || age > 49)) return false;
        if (filterUsiaBracket === '50-57' && (age < 50 || age > 57)) return false;
        if (filterUsiaBracket === '58-65' && (age < 58 || age > 65)) return false;
        if (filterUsiaBracket === '>65' && age <= 65) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (p.nama && p.nama.toLowerCase().includes(q)) ||
          (p.nip && p.nip.toLowerCase().includes(q)) ||
          (p.unitKerja && p.unitKerja.toLowerCase().includes(q)) ||
          (p.jabatanFungsional && p.jabatanFungsional.toLowerCase().includes(q)) ||
          (p.jabatanStruktural && p.jabatanStruktural.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [pegawaiList, filterUnitKerja, filterKepegawaian, filterStatusAktif, filterJenjang, filterGender, filterUsiaBracket, searchQuery]);

  // Executive KPI Computations
  const stats = useMemo(() => {
    const total = filteredPegawai.length;
    const totalAktif = filteredPegawai.filter(p => p.statusAktif === 'Aktif').length;
    const totalTugasBelajar = filteredPegawai.filter(p => (p.statusAktif || '').toLowerCase().includes('belajar')).length;
    const totalCuti = filteredPegawai.filter(p => (p.statusAktif || '').toLowerCase().includes('cuti')).length;
    const totalPensiun = filteredPegawai.filter(p => (p.statusAktif || '').toLowerCase().includes('pensiun')).length;

    // Status Kepegawaian
    const pnsCount = filteredPegawai.filter(p => (p.statusKepegawaian || '').toUpperCase() === 'PNS').length;
    const pppkCount = filteredPegawai.filter(p => (p.statusKepegawaian || '').toUpperCase() === 'PPPK').length;
    const tetapNonPnsCount = filteredPegawai.filter(p => (p.statusKepegawaian || '').toLowerCase().includes('tetap')).length;
    const kontrakCount = filteredPegawai.filter(p => (p.statusKepegawaian || '').toLowerCase().includes('kontrak')).length;

    // Pendidikan
    const s3Count = filteredPegawai.filter(p => (p.jenjang || '').toUpperCase() === 'S3').length;
    const s2Count = filteredPegawai.filter(p => (p.jenjang || '').toUpperCase() === 'S2').length;
    const s1Count = filteredPegawai.filter(p => (p.jenjang || '').toUpperCase() === 'S1').length;
    const diplomaCount = filteredPegawai.filter(p => {
      const j = (p.jenjang || '').toUpperCase();
      return j.includes('D3') || j.includes('D4') || j.includes('DIPLOMA');
    }).length;

    // Gender
    const maleCount = filteredPegawai.filter(p => p.jenisKelamin === 'Laki-laki').length;
    const femaleCount = filteredPegawai.filter(p => p.jenisKelamin === 'Perempuan').length;

    // Jabatan Fungsional
    const guruBesarCount = filteredPegawai.filter(p => {
      const j = (p.jabatanFungsional || '').toLowerCase();
      return j.includes('guru besar') || j.includes('profesor');
    }).length;
    const lektorKepalaCount = filteredPegawai.filter(p => (p.jabatanFungsional || '').toLowerCase().includes('lektor kepala')).length;
    const lektorCount = filteredPegawai.filter(p => {
      const j = (p.jabatanFungsional || '').toLowerCase();
      return j.includes('lektor') && !j.includes('kepala');
    }).length;
    const asistenAhliCount = filteredPegawai.filter(p => (p.jabatanFungsional || '').toLowerCase().includes('asisten ahli')).length;

    // Usia & Pensiun Analysis
    let totalAgeSum = 0;
    let countWithAge = 0;
    const approachingRetirementList: Array<{
      pegawai: Pegawai;
      age: number;
      bup: number;
      sisaTahun: number;
      kategoriBup: string;
    }> = [];

    filteredPegawai.forEach(p => {
      const age = calculateAge(p.tanggalLahir);
      if (age !== null) {
        totalAgeSum += age;
        countWithAge++;

        const { bup, label } = getBatasUsiaPensiun(p.jabatanFungsional, p.jabatanStruktural);
        const sisa = bup - age;
        // Peringatan jika sisa waktu menuju pensiun <= 3 tahun atau sudah mencapai BUP
        if (sisa <= 3) {
          approachingRetirementList.push({
            pegawai: p,
            age,
            bup,
            sisaTahun: sisa,
            kategoriBup: label
          });
        }
      }
    });

    const averageAge = countWithAge > 0 ? (totalAgeSum / countWithAge).toFixed(1) : '-';

    return {
      total,
      totalAktif,
      totalTugasBelajar,
      totalCuti,
      totalPensiun,
      pnsCount,
      pppkCount,
      tetapNonPnsCount,
      kontrakCount,
      s3Count,
      s2Count,
      s1Count,
      diplomaCount,
      maleCount,
      femaleCount,
      guruBesarCount,
      lektorKepalaCount,
      lektorCount,
      asistenAhliCount,
      averageAge,
      approachingRetirementList: approachingRetirementList.sort((a, b) => a.sisaTahun - b.sisaTahun)
    };
  }, [filteredPegawai]);

  // Chart Data 1: Distribusi Status Kepegawaian (Pie / Donut)
  const kepegawaianChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredPegawai.forEach(p => {
      const status = p.statusKepegawaian || 'Lainnya';
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredPegawai]);

  // Chart Data 2: Jenjang Pendidikan Terakhir (Bar)
  const jenjangChartData = useMemo(() => {
    const counts: Record<string, number> = {
      'S3': 0,
      'S2': 0,
      'S1': 0,
      'D4/D3': 0,
      'Lainnya': 0
    };
    filteredPegawai.forEach(p => {
      const j = (p.jenjang || '').toUpperCase().trim();
      if (j === 'S3' || j.includes('DOKTOR')) counts['S3']++;
      else if (j === 'S2' || j.includes('MAGISTER')) counts['S2']++;
      else if (j === 'S1' || j.includes('SARJANA')) counts['S1']++;
      else if (j.includes('D3') || j.includes('D4') || j.includes('DIPLOMA')) counts['D4/D3']++;
      else counts['Lainnya']++;
    });
    return Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [filteredPegawai]);

  // Chart Data 3: Sebaran Unit Kerja (Top 8 Horizontal Bar)
  const unitKerjaChartData = useMemo(() => {
    const counts: Record<string, { total: number; pns: number; nonPns: number }> = {};
    filteredPegawai.forEach(p => {
      const unit = p.unitKerja || 'Unit Tidak Terdefinisi';
      if (!counts[unit]) {
        counts[unit] = { total: 0, pns: 0, nonPns: 0 };
      }
      counts[unit].total++;
      if ((p.statusKepegawaian || '').toUpperCase() === 'PNS') {
        counts[unit].pns++;
      } else {
        counts[unit].nonPns++;
      }
    });

    return Object.entries(counts)
      .map(([unit, val]) => ({
        unit: unit.length > 28 ? unit.slice(0, 26) + '...' : unit,
        fullUnit: unit,
        total: val.total,
        pns: val.pns,
        nonPns: val.nonPns
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [filteredPegawai]);

  // Chart Data 4: Komposisi Golongan / Kepangkatan (Bar)
  const golonganChartData = useMemo(() => {
    const counts: Record<string, number> = {
      'Golongan IV (Pembina)': 0,
      'Golongan III (Penata)': 0,
      'Golongan II (Pengatur)': 0,
      'Golongan I / Non-Gol': 0
    };
    filteredPegawai.forEach(p => {
      const g = (p.golongan || '').toUpperCase();
      if (g.startsWith('IV')) counts['Golongan IV (Pembina)']++;
      else if (g.startsWith('III')) counts['Golongan III (Penata)']++;
      else if (g.startsWith('II')) counts['Golongan II (Pengatur)']++;
      else counts['Golongan I / Non-Gol']++;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredPegawai]);

  // Chart Data 5: Piramida Rentang Usia (Bar)
  const usiaBracketData = useMemo(() => {
    const brackets = [
      { key: '<30', label: '< 30 Thn (Junior)', count: 0 },
      { key: '30-39', label: '30 - 39 Thn', count: 0 },
      { key: '40-49', label: '40 - 49 Thn', count: 0 },
      { key: '50-57', label: '50 - 57 Thn (Senior)', count: 0 },
      { key: '58-65', label: '58 - 65 Thn (Pra-Pensiun)', count: 0 },
      { key: '>65', label: '> 65 Thn (Purnabakti)', count: 0 },
    ];

    filteredPegawai.forEach(p => {
      const age = calculateAge(p.tanggalLahir);
      if (age !== null) {
        if (age < 30) brackets[0].count++;
        else if (age <= 39) brackets[1].count++;
        else if (age <= 49) brackets[2].count++;
        else if (age <= 57) brackets[3].count++;
        else if (age <= 65) brackets[4].count++;
        else brackets[5].count++;
      }
    });

    return brackets;
  }, [filteredPegawai]);

  // Chart Data 6: Jabatan Fungsional Utama
  const fungsionalChartData = useMemo(() => {
    const list = [
      { name: 'Guru Besar / Prof.', value: stats.guruBesarCount },
      { name: 'Lektor Kepala', value: stats.lektorKepalaCount },
      { name: 'Lektor', value: stats.lektorCount },
      { name: 'Asisten Ahli', value: stats.asistenAhliCount },
      { 
        name: 'Tendik / Lainnya', 
        value: Math.max(0, stats.total - (stats.guruBesarCount + stats.lektorKepalaCount + stats.lektorCount + stats.asistenAhliCount))
      }
    ];
    return list.filter(item => item.value > 0);
  }, [stats]);

  // Chart Data 7: Rasio Gender per Status Kepegawaian (Stacked Bar)
  const genderPerStatusData = useMemo(() => {
    const map: Record<string, { name: string; lakiLaki: number; perempuan: number }> = {};
    filteredPegawai.forEach(p => {
      const status = p.statusKepegawaian || 'Lainnya';
      if (!map[status]) {
        map[status] = { name: status, lakiLaki: 0, perempuan: 0 };
      }
      if (p.jenisKelamin === 'Perempuan') {
        map[status].perempuan++;
      } else {
        map[status].lakiLaki++;
      }
    });
    return Object.values(map).sort((a, b) => (b.lakiLaki + b.perempuan) - (a.lakiLaki + a.perempuan));
  }, [filteredPegawai]);

  // Chart Data 8: Status Aktif (Donut)
  const statusAktifChartData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredPegawai.forEach(p => {
      const status = p.statusAktif || 'Tidak Diketahui';
      map[status] = (map[status] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredPegawai]);

  // Matriks Unit Kerja Lengkap (Table tab)
  const unitKerjaMatrix = useMemo(() => {
    const map: Record<string, {
      unitKerja: string;
      total: number;
      pns: number;
      pppk: number;
      nonPns: number;
      s3: number;
      s2: number;
      s1: number;
      lakiLaki: number;
      perempuan: number;
      aktif: number;
    }> = {};

    filteredPegawai.forEach(p => {
      const u = p.unitKerja || 'Unit Tidak Terdefinisi';
      if (!map[u]) {
        map[u] = {
          unitKerja: u,
          total: 0,
          pns: 0,
          pppk: 0,
          nonPns: 0,
          s3: 0,
          s2: 0,
          s1: 0,
          lakiLaki: 0,
          perempuan: 0,
          aktif: 0,
        };
      }
      map[u].total++;
      const st = (p.statusKepegawaian || '').toUpperCase();
      if (st === 'PNS') map[u].pns++;
      else if (st === 'PPPK') map[u].pppk++;
      else map[u].nonPns++;

      const j = (p.jenjang || '').toUpperCase();
      if (j === 'S3') map[u].s3++;
      else if (j === 'S2') map[u].s2++;
      else if (j === 'S1') map[u].s1++;

      if (p.jenisKelamin === 'Perempuan') map[u].perempuan++;
      else map[u].lakiLaki++;

      if (p.statusAktif === 'Aktif') map[u].aktif++;
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredPegawai]);

  // Export Executive Summary Excel
  const handleExportSummaryExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Ringkasan Eksekutif KPI
    const kpiRows = [
      { Indikator: 'Total Data Pegawai', Nilai: stats.total, Satuan: 'Orang' },
      { Indikator: 'Pegawai Status Aktif', Nilai: stats.totalAktif, Satuan: 'Orang' },
      { Indikator: 'Pegawai Tugas / Izin Belajar', Nilai: stats.totalTugasBelajar, Satuan: 'Orang' },
      { Indikator: 'Pegawai Cuti / Pensiun', Nilai: stats.totalCuti + stats.totalPensiun, Satuan: 'Orang' },
      { Indikator: 'Status Kepegawaian - PNS', Nilai: stats.pnsCount, Satuan: 'Orang' },
      { Indikator: 'Status Kepegawaian - PPPK', Nilai: stats.pppkCount, Satuan: 'Orang' },
      { Indikator: 'Status Kepegawaian - Pegawai Tetap Non-PNS', Nilai: stats.tetapNonPnsCount, Satuan: 'Orang' },
      { Indikator: 'Status Kepegawaian - Kontrak', Nilai: stats.kontrakCount, Satuan: 'Orang' },
      { Indikator: 'Kualifikasi Doktor (S3)', Nilai: stats.s3Count, Satuan: 'Orang' },
      { Indikator: 'Kualifikasi Magister (S2)', Nilai: stats.s2Count, Satuan: 'Orang' },
      { Indikator: 'Kualifikasi Sarjana (S1)', Nilai: stats.s1Count, Satuan: 'Orang' },
      { Indikator: 'Jabatan Guru Besar / Profesor', Nilai: stats.guruBesarCount, Satuan: 'Orang' },
      { Indikator: 'Jabatan Lektor Kepala', Nilai: stats.lektorKepalaCount, Satuan: 'Orang' },
      { Indikator: 'Pegawai Laki-laki', Nilai: stats.maleCount, Satuan: 'Orang' },
      { Indikator: 'Pegawai Perempuan', Nilai: stats.femaleCount, Satuan: 'Orang' },
      { Indikator: 'Rata-rata Usia Pegawai', Nilai: stats.averageAge, Satuan: 'Tahun' },
      { Indikator: 'Pegawai Mendekati Masa Pensiun (<= 3 Thn)', Nilai: stats.approachingRetirementList.length, Satuan: 'Orang' },
    ];
    const wsKpi = XLSX.utils.json_to_sheet(kpiRows);
    XLSX.utils.book_append_sheet(wb, wsKpi, 'Ringkasan KPI Pegawai');

    // Sheet 2: Distribusi per Unit Kerja
    const wsUnit = XLSX.utils.json_to_sheet(unitKerjaMatrix);
    XLSX.utils.book_append_sheet(wb, wsUnit, 'Statistik per Unit Kerja');

    // Sheet 3: Early Warning Pensiun
    const pensiunRows = stats.approachingRetirementList.map((item, idx) => ({
      No: idx + 1,
      NIP: item.pegawai.nip,
      Nama: item.pegawai.nama,
      'Unit Kerja': item.pegawai.unitKerja,
      'Jabatan Fungsional': item.pegawai.jabatanFungsional || '-',
      'Jabatan Struktural': item.pegawai.jabatanStruktural || '-',
      'Tanggal Lahir': item.pegawai.tanggalLahir,
      'Usia Saat Ini': `${item.age} Tahun`,
      'Batas Usia Pensiun (BUP)': `${item.bup} Tahun`,
      'Sisa Masa Kerja': item.sisaTahun <= 0 ? 'Mencapai BUP / Lewat' : `${item.sisaTahun} Tahun lagi`,
      'Kategori BUP': item.kategoriBup
    }));
    const wsPensiun = XLSX.utils.json_to_sheet(pensiunRows);
    XLSX.utils.book_append_sheet(wb, wsPensiun, 'Radar Masa Pensiun');

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Laporan_Eksekutif_Statistik_Pegawai_Unpad_${dateStr}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Print Header (Only visible on window.print) */}
      <div className="hidden print:block mb-6 pb-4 border-b-2 border-[#002B66]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <UnpadLogo variant="dark" size="md" />
            <div>
              <h1 className="text-xl font-bold text-[#002B66]">UNIVERSITAS PADJADJARAN</h1>
              <h2 className="text-sm font-semibold text-slate-700">DIREKTORAT PENDIDIKAN NON GELAR</h2>
              <p className="text-xs text-slate-500">Laporan Statistik & Dashboard Profil Sumber Daya Manusia (Pegawai)</p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
            <p>Total Data: {filteredPegawai.length} Pegawai</p>
          </div>
        </div>
      </div>

      {/* Top Banner Header & Executive Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#002B66] to-[#0a489c] text-[#FDB913] flex items-center justify-center font-bold shadow-md shrink-0">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[#002B66] tracking-tight">
                  Dashboard & Statistik Pegawai
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FDB913]/20 text-[#002B66] border border-[#FDB913]/40">
                  SDM Unpad
                </span>
                {hasActiveFilters && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                    Filter Aktif ({filteredPegawai.length} dari {pegawaiList.length})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Executive analytics profil SDM, piramida kepangkatan, kualifikasi akademik, rasio gender, sebaran unit kerja, dan proyeksi suksesi masa pensiun.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              title="Cetak Laporan Statistik Pegawai"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak Laporan</span>
            </button>

            <button
              onClick={handleExportSummaryExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-300 transition-colors shadow-xs cursor-pointer"
              title="Export Laporan Eksekutif Excel (Multi-Sheet)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Export Statistik Excel</span>
            </button>

            <button
              onClick={() => onNavigateToTable()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#002B66] hover:bg-[#07397b] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Buka Tabel Lengkap Master Pegawai"
            >
              <Users className="w-4 h-4 text-[#FDB913]" />
              <span>Buka Tabel Pegawai</span>
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#002B66] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FDB913]" />
            <span>Overview & Visualisasi Grafik</span>
          </button>

          <button
            onClick={() => setActiveTab('unit_kerja')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'unit_kerja'
                ? 'bg-[#002B66] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Matriks per Unit Kerja ({unitKerjaMatrix.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pensiun')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'pensiun'
                ? 'bg-[#881337] text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
            <span>Radar Pensiun & Suksesi SDM</span>
            {stats.approachingRetirementList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black">
                {stats.approachingRetirementList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('pendidikan')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'pendidikan'
                ? 'bg-[#002B66] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Kualifikasi Pendidikan & Fungsional</span>
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 print:hidden">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#002B66]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Filter Interaktif Analitik
            </h2>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          {/* Search box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari NIP, Nama, Unit Kerja, Jabatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66] focus:bg-white"
            />
          </div>

          {/* Unit Kerja */}
          <div>
            <select
              value={filterUnitKerja}
              onChange={(e) => setFilterUnitKerja(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="ALL">Semua Unit Kerja ({unitKerjaOptions.length})</option>
              {unitKerjaOptions.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* Status Kepegawaian */}
          <div>
            <select
              value={filterKepegawaian}
              onChange={(e) => setFilterKepegawaian(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="ALL">Semua Kepegawaian</option>
              {kepegawaianOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Jenjang */}
          <div>
            <select
              value={filterJenjang}
              onChange={(e) => setFilterJenjang(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="ALL">Semua Jenjang</option>
              {jenjangOptions.map(j => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>

          {/* Usia Bracket */}
          <div>
            <select
              value={filterUsiaBracket}
              onChange={(e) => setFilterUsiaBracket(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="ALL">Semua Rentang Usia</option>
              <option value="<30">&lt; 30 Tahun (Junior)</option>
              <option value="30-39">30 - 39 Tahun</option>
              <option value="40-49">40 - 49 Tahun</option>
              <option value="50-57">50 - 57 Tahun (Senior)</option>
              <option value="58-65">58 - 65 Tahun (Pra-Pensiun)</option>
              <option value=">65">&gt; 65 Tahun (Purnabakti)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 6 Executive KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        {/* KPI 1: Total Pegawai */}
        <div 
          onClick={() => onNavigateToTable()}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-[#002B66] transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50/60 rounded-bl-full pointer-events-none -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Pegawai</span>
            <div className="w-8 h-8 rounded-lg bg-[#002B66]/10 text-[#002B66] flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#002B66] tracking-tight">{stats.total}</span>
            <span className="text-xs text-slate-500">Orang</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            <span className="text-emerald-700 font-semibold">{stats.totalAktif} Aktif</span>
            <span>{stats.totalTugasBelajar} Tugas Bljr</span>
          </div>
        </div>

        {/* KPI 2: Status Kepegawaian (PNS / PPPK / Non-PNS) */}
        <div 
          onClick={() => onNavigateToTable({ statusKepegawaian: 'PNS' })}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-amber-400 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50/60 rounded-bl-full pointer-events-none -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Status ASN (PNS)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700 tracking-tight">{stats.pnsCount}</span>
            <span className="text-xs text-slate-500">
              ({stats.total > 0 ? ((stats.pnsCount / stats.total) * 100).toFixed(0) : 0}%)
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            <span>PPPK: {stats.pppkCount}</span>
            <span>Non-PNS: {stats.tetapNonPnsCount + stats.kontrakCount}</span>
          </div>
        </div>

        {/* KPI 3: Kualifikasi Doktor S3 */}
        <div 
          onClick={() => onNavigateToTable({ jenjang: 'S3' })}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-emerald-500 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50/60 rounded-bl-full pointer-events-none -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Doktor (S3)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-800 tracking-tight">{stats.s3Count}</span>
            <span className="text-xs text-slate-500">
              ({stats.total > 0 ? ((stats.s3Count / stats.total) * 100).toFixed(0) : 0}%)
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            <span>Magister (S2): {stats.s2Count}</span>
            <span>S1: {stats.s1Count}</span>
          </div>
        </div>

        {/* KPI 4: Guru Besar & Lektor Kepala */}
        <div 
          onClick={() => setActiveTab('pendidikan')}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-purple-500 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50/60 rounded-bl-full pointer-events-none -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Guru Besar & LK</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-800 tracking-tight">
              {stats.guruBesarCount + stats.lektorKepalaCount}
            </span>
            <span className="text-xs text-slate-500">Pakar</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            <span>Prof: {stats.guruBesarCount}</span>
            <span>LK: {stats.lektorKepalaCount}</span>
          </div>
        </div>

        {/* KPI 5: Demografi Gender */}
        <div 
          onClick={() => onNavigateToTable()}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-cyan-500 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-50/60 rounded-bl-full pointer-events-none -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Rasio Gender</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-700 flex items-center justify-center font-bold">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-900 tracking-tight">
              {stats.maleCount}:{stats.femaleCount}
            </span>
            <span className="text-[10px] text-slate-500">L/P</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            <span>L: {stats.total > 0 ? ((stats.maleCount / stats.total) * 100).toFixed(0) : 0}%</span>
            <span>P: {stats.total > 0 ? ((stats.femaleCount / stats.total) * 100).toFixed(0) : 0}%</span>
          </div>
        </div>

        {/* KPI 6: Radar Suksesi Pensiun */}
        <div 
          onClick={() => setActiveTab('pensiun')}
          className={`rounded-2xl p-4 border shadow-xs transition-all cursor-pointer group relative overflow-hidden ${
            stats.approachingRetirementList.length > 0
              ? 'bg-rose-50/70 border-rose-200 hover:border-rose-400'
              : 'bg-white border-slate-200 hover:border-slate-400'
          }`}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-100/50 rounded-bl-full pointer-events-none -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">Pra-Pensiun</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-900 tracking-tight">
              {stats.approachingRetirementList.length}
            </span>
            <span className="text-xs text-rose-700 font-semibold">&le; 3 Thn</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-rose-700 border-t border-rose-200/60 pt-2">
            <span>Rerata Usia: {stats.averageAge} Thn</span>
            <span className="font-bold underline">Cek Suksesi &rarr;</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & INTERACTIVE CHARTS */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Row 1 Charts: Status Kepegawaian & Jenjang Pendidikan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 1: Donut Status Kepegawaian */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#002B66]">Distribusi Status Kepegawaian</h3>
                  <p className="text-xs text-slate-500">Komposisi status pegawai PNS, PPPK, Tetap Non-PNS, dan Kontrak</p>
                </div>
                <button
                  onClick={() => onNavigateToTable()}
                  className="text-xs text-[#002B66] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Lihat Tabel</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={kepegawaianChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {kepegawaianChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={UNPAD_COLORS[index % UNPAD_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(val: any, name: any) => [`${val} Pegawai`, name]}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {kepegawaianChartData.map((item, idx) => (
                  <div 
                    key={item.name}
                    onClick={() => onNavigateToTable({ statusKepegawaian: item.name })}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100"
                  >
                    <div className="w-2.5 h-2.5 rounded-full mx-auto mb-1" style={{ backgroundColor: UNPAD_COLORS[idx % UNPAD_COLORS.length] }} />
                    <span className="text-[11px] font-bold text-slate-700 block truncate">{item.name}</span>
                    <span className="text-xs font-black text-[#002B66]">{item.value} Org</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Jenjang Pendidikan Terakhir */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#002B66]">Kualifikasi Jenjang Pendidikan Terakhir</h3>
                  <p className="text-xs text-slate-500">Tingkat strata pendidikan dosen dan tenaga kependidikan</p>
                </div>
                <button
                  onClick={() => onNavigateToTable()}
                  className="text-xs text-[#002B66] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Filter Jenjang</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={jenjangChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#475569' }} allowDecimals={false} />
                    <RechartsTooltip 
                      formatter={(val: any) => [`${val} Pegawai`, 'Jumlah']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[6, 6, 0, 0]}
                      onClick={(data) => onNavigateToTable({ jenjang: data.name })}
                      className="cursor-pointer"
                    >
                      {jenjangChartData.map((_, index) => (
                        <Cell key={`cell-jenjang-${index}`} fill={index === 0 ? '#046A38' : index === 1 ? '#002B66' : '#FDB913'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#046A38]" /> S3: {stats.s3Count} ({stats.total > 0 ? ((stats.s3Count / stats.total) * 100).toFixed(0) : 0}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#002B66]" /> S2: {stats.s2Count} ({stats.total > 0 ? ((stats.s2Count / stats.total) * 100).toFixed(0) : 0}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#FDB913]" /> S1 & Diploma: {stats.s1Count + stats.diplomaCount}
                </span>
              </div>
            </div>
          </div>

          {/* Row 2 Charts: Top Unit Kerja & Piramida Usia */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Chart 3: Top Unit Kerja (Horizontal Bar - 7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#002B66]">Sebaran Unit Kerja Terbesar</h3>
                  <p className="text-xs text-slate-500">Unit kerja / fakultas dengan alokasi pegawai terbanyak (PNS vs Non-PNS)</p>
                </div>
                <button
                  onClick={() => setActiveTab('unit_kerja')}
                  className="text-xs text-[#002B66] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Lihat Semua Unit ({unitKerjaMatrix.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={unitKerjaChartData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#475569' }} allowDecimals={false} />
                    <YAxis 
                      type="category" 
                      dataKey="unit" 
                      width={160} 
                      tick={{ fontSize: 10.5, fill: '#1e293b' }} 
                    />
                    <RechartsTooltip 
                      formatter={(val: any, name: any) => [`${val} Pegawai`, name === 'pns' ? 'PNS' : name === 'nonPns' ? 'Non-PNS' : 'Total']}
                      labelFormatter={(label) => {
                        const match = unitKerjaChartData.find(u => u.unit === label);
                        return match ? match.fullUnit : label;
                      }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend verticalAlign="top" height={32} iconType="circle" />
                    <Bar dataKey="pns" name="PNS" stackId="a" fill="#002B66" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="nonPns" name="Non-PNS" stackId="a" fill="#FDB913" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Piramida Usia (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#002B66]">Piramida Rentang Usia SDM</h3>
                    <p className="text-xs text-slate-500">Demografi umur untuk perencanaan regenerasi & kaderisasi</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#002B66] border border-blue-200">
                    Rerata: {stats.averageAge} Thn
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={usiaBracketData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 9.5, fill: '#475569' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#475569' }} allowDecimals={false} />
                      <RechartsTooltip 
                        formatter={(val: any) => [`${val} Pegawai`, 'Jumlah']}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      />
                      <Bar 
                        dataKey="count" 
                        radius={[6, 6, 0, 0]}
                        onClick={(data: any) => {
                          if (data && data.key) {
                            setFilterUsiaBracket(String(data.key));
                          }
                        }}
                        className="cursor-pointer"
                      >
                        {usiaBracketData.map((entry, index) => {
                          let color = '#2563EB';
                          if (entry.key === '58-65' || entry.key === '>65') color = '#E11D48';
                          else if (entry.key === '50-57') color = '#D97706';
                          else if (entry.key === '<30') color = '#059669';
                          return <Cell key={`cell-usia-${index}`} fill={color} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-2 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="text-emerald-700 font-semibold">Junior (&lt;30): {usiaBracketData[0].count}</span>
                <span className="text-amber-700 font-semibold">Produktif: {usiaBracketData[1].count + usiaBracketData[2].count}</span>
                <span className="text-rose-700 font-semibold">Senior/Pra-Pensiun: {usiaBracketData[3].count + usiaBracketData[4].count + usiaBracketData[5].count}</span>
              </div>
            </div>
          </div>

          {/* Row 3 Charts: Golongan Kepangkatan & Status Keaktifan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 5: Komposisi Golongan / Kepangkatan */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#002B66]">Komposisi Golongan & Kepangkatan ASN</h3>
                  <p className="text-xs text-slate-500">Struktur jenjang kepangkatan Golongan IV (Pembina), III (Penata), II (Pengatur)</p>
                </div>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={golonganChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: '#475569' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#475569' }} allowDecimals={false} />
                    <RechartsTooltip 
                      formatter={(val: any) => [`${val} Pegawai`, 'Jumlah']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="value" fill="#002B66" radius={[6, 6, 0, 0]}>
                      {golonganChartData.map((_, index) => (
                        <Cell key={`cell-gol-${index}`} fill={UNPAD_COLORS[(index * 2) % UNPAD_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 6: Rasio Gender per Status Kepegawaian */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#002B66]">Komposisi Gender per Status Kepegawaian</h3>
                  <p className="text-xs text-slate-500">Proporsi laki-laki dan perempuan pada setiap kategori pegawai</p>
                </div>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={genderPerStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#475569' }} allowDecimals={false} />
                    <RechartsTooltip 
                      formatter={(val: any, name: any) => [`${val} Orang`, name === 'lakiLaki' ? 'Laki-laki' : 'Perempuan']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend verticalAlign="top" height={32} iconType="circle" />
                    <Bar dataKey="lakiLaki" name="Laki-laki" fill="#002B66" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="perempuan" name="Perempuan" fill="#E11D48" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MATRIKS PER UNIT KERJA */}
      {/* ========================================================================= */}
      {activeTab === 'unit_kerja' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="text-base font-bold text-[#002B66] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#FDB913]" />
                <span>Matriks Distribusi Pegawai per Unit Kerja & Fakultas</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan alokasi SDM, kualifikasi doktor (S3), rasio status PNS/Non-PNS, dan keaktifan pada masing-masing unit.
              </p>
            </div>
            <button
              onClick={handleExportSummaryExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Matriks Unit</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#002B66] text-white font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Unit Kerja / Fakultas</th>
                  <th className="py-3 px-3 text-center">Total Pegawai</th>
                  <th className="py-3 px-3 text-center">PNS</th>
                  <th className="py-3 px-3 text-center">PPPK</th>
                  <th className="py-3 px-3 text-center">Tetap Non-PNS</th>
                  <th className="py-3 px-3 text-center">Doktor (S3)</th>
                  <th className="py-3 px-3 text-center">Magister (S2)</th>
                  <th className="py-3 px-3 text-center">L / P</th>
                  <th className="py-3 px-3 text-center">Status Aktif</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unitKerjaMatrix.map((row, idx) => (
                  <tr key={row.unitKerja} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono text-center">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 block text-xs">{row.unitKerja}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-black text-[#002B66]">
                      {row.total}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700">
                      {row.pns}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600">
                      {row.pppk}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600">
                      {row.nonPns}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-700 bg-emerald-50/40">
                      {row.s3}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600">
                      {row.s2}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">
                      {row.lakiLaki}/{row.perempuan}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {row.aktif} Aktif
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onNavigateToTable({ unitKerja: row.unitKerja })}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#002B66] hover:text-white text-slate-700 text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Buka data pegawai unit ini di tabel"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RADAR MASA PENSIUN & SUKSESI SDM */}
      {/* ========================================================================= */}
      {activeTab === 'pensiun' && (
        <div className="space-y-5">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950">
                  Radar Peringatan Dini Batas Usia Pensiun (BUP) & Suksesi SDM
                </h3>
                <p className="text-xs text-rose-800/90 mt-0.5">
                  Daftar pegawai yang berada dalam rentang &le; 3 tahun menuju masa pensiun atau telah melewati BUP (58 tahun untuk Tendik, 65 tahun untuk Dosen/Lektor Kepala, 70 tahun untuk Guru Besar). Dibutuhkan persiapan transfer pengetahuan & kaderisasi posisi strategis.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-600 text-white shadow-xs">
                {stats.approachingRetirementList.length} Pegawai Terdeteksi
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#002B66] text-white font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Pegawai (Nama & NIP)</th>
                    <th className="py-3 px-4">Unit Kerja & Bagian</th>
                    <th className="py-3 px-3">Jabatan Fungsional / Struktural</th>
                    <th className="py-3 px-3 text-center">Tgl Lahir / Usia</th>
                    <th className="py-3 px-3 text-center">BUP Standar</th>
                    <th className="py-3 px-3 text-center">Sisa Masa Kerja</th>
                    <th className="py-3 px-3 text-center">Status Kewaspadaan</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.approachingRetirementList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">Tidak ada pegawai yang mendekati batas usia pensiun (&le; 3 tahun).</p>
                        <p className="text-xs text-slate-400 mt-1">Seluruh personil pada filter saat ini berada dalam masa produktif aman.</p>
                      </td>
                    </tr>
                  ) : (
                    stats.approachingRetirementList.map((item, idx) => {
                      const isPastBup = item.sisaTahun <= 0;
                      const isVeryClose = item.sisaTahun === 1;

                      return (
                        <tr key={item.pegawai.id} className="hover:bg-rose-50/30 transition-colors">
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-center">{idx + 1}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block text-xs">{item.pegawai.nama}</span>
                            <span className="text-[11px] font-mono text-slate-500">{item.pegawai.nip}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800 block">{item.pegawai.unitKerja}</span>
                            <span className="text-[11px] text-slate-500">{item.pegawai.bagian || '-'}</span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-[#002B66] block">{item.pegawai.jabatanFungsional || '-'}</span>
                            {item.pegawai.jabatanStruktural && (
                              <span className="text-[11px] text-amber-700 block font-medium">
                                JS: {item.pegawai.jabatanStruktural}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className="font-mono text-slate-700 block">{item.pegawai.tanggalLahir}</span>
                            <span className="font-bold text-slate-900 text-xs">{item.age} Tahun</span>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className="font-bold text-slate-800 block">{item.bup} Thn</span>
                            <span className="text-[10px] text-slate-500">{item.kategoriBup.split('(')[0]}</span>
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold">
                            {isPastBup ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-600 text-white font-black animate-pulse">
                                Memasuki BUP ({item.age} Thn)
                              </span>
                            ) : isVeryClose ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                                1 Tahun lagi
                              </span>
                            ) : (
                              <span className="text-slate-700">
                                {item.sisaTahun} Tahun lagi
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isPastBup 
                                ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {isPastBup ? 'Siapkan Pensiun & SK' : 'Perlu Kaderisasi'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => onNavigateToTable({ searchQuery: item.pegawai.nip })}
                              className="px-2.5 py-1 rounded-lg bg-[#002B66] text-white hover:bg-[#07397b] text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Profil</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: KUALIFIKASI PENDIDIKAN & JABATAN FUNGSIONAL */}
      {/* ========================================================================= */}
      {activeTab === 'pendidikan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Box 1: Matriks Fungsional */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-base font-bold text-[#002B66] mb-1">
                Piramida Jabatan Fungsional Akademik
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Distribusi jenjang fungsional dosen dan tenaga fungsional Universitas Padjadjaran
              </p>

              <div className="space-y-3">
                {fungsionalChartData.map((item, idx) => {
                  const pct = stats.total > 0 ? ((item.value / stats.total) * 100).toFixed(1) : '0';
                  return (
                    <div key={item.name} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-800">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#002B66]">{item.value} Org</span>
                          <span className="text-[11px] text-slate-500 font-mono">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-2 rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${pct}%`,
                            backgroundColor: UNPAD_COLORS[idx % UNPAD_COLORS.length]
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Box 2: Pegawai Sedang Tugas Belajar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#002B66]">
                    Pegawai Tugas / Izin Belajar ({stats.totalTugasBelajar})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dosen dan tenaga kependidikan yang sedang menempuh studi lanjut (S2/S3/Spesialis)
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#002B66] text-xs font-bold border border-blue-200">
                  Penguatan Kapasitas
                </span>
              </div>

              {stats.totalTugasBelajar === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold">Tidak ada pegawai yang berstatus Tugas/Izin Belajar pada filter saat ini.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar">
                  {filteredPegawai
                    .filter(p => (p.statusAktif || '').toLowerCase().includes('belajar'))
                    .map(p => (
                      <div key={p.id} className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">{p.nama}</span>
                          <span className="text-[11px] text-slate-500">{p.unitKerja} &bull; {p.nip}</span>
                          <p className="text-[11px] text-blue-900 mt-1 italic">
                            {p.keteranganStatusAktif || 'Sedang menempuh program studi lanjut'}
                          </p>
                        </div>
                        <button
                          onClick={() => onNavigateToTable({ searchQuery: p.nip })}
                          className="px-2 py-1 bg-white hover:bg-[#002B66] hover:text-white text-[#002B66] border border-blue-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0"
                        >
                          Lihat
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
