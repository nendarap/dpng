import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  Filter,
  BarChart3,
  Layers,
  Award,
  DollarSign,
  Download,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { Peserta, Kategori } from '../types';

interface TrenPendaftarChartProps {
  pesertaList: Peserta[];
  kategoriList: Kategori[];
}

type TimeframeOption = '12_MONTHS' | 'YEAR_2026' | 'YEAR_2025' | 'ALL';
type ChartStyleOption = 'area' | 'bar' | 'line';
type MetricBreakdownOption = 'overview' | 'status' | 'kategori';
type DateBasisOption = 'createdAt' | 'tanggalMulai';

const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const BULAN_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

// Helper to safely parse Indonesian or ISO date strings
function parseDateSafely(dateStr: string | undefined): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    return new Date(year, month, day);
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const idMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (idMatch) {
    const day = parseInt(idMatch[1], 10);
    const month = parseInt(idMatch[2], 10) - 1;
    const year = parseInt(idMatch[3], 10);
    return new Date(year, month, day);
  }

  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d;
  return null;
}

interface MonthlyDataPoint {
  key: string;              // "2026-01"
  label: string;            // "Jan 2026"
  labelFull: string;        // "Januari 2026"
  year: number;
  month: number;            // 0 - 11
  total: number;
  cumulative: number;
  totalBiaya: number;
  // Status breakdown
  lulus: number;
  aktif: number;
  selesai: number;
  terdaftar: number;
  lainnya: number;
  // Dynamic category counts: Record<string, number>
  [key: string]: string | number;
}

export const TrenPendaftarChart: React.FC<TrenPendaftarChartProps> = ({
  pesertaList,
  kategoriList
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('12_MONTHS');
  const [chartStyle, setChartStyle] = useState<ChartStyleOption>('area');
  const [breakdown, setBreakdown] = useState<MetricBreakdownOption>('overview');
  const [dateBasis, setDateBasis] = useState<DateBasisOption>('createdAt');
  const [filterKategori, setFilterKategori] = useState<string>('ALL');
  const [showTable, setShowTable] = useState<boolean>(false);

  // Top 5 Categories for color assignment and breakdown
  const topCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    pesertaList.forEach(p => {
      const kat = p.kategoriProgram || 'Lainnya';
      counts[kat] = (counts[kat] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
  }, [pesertaList]);

  // Color palette for categories
  const categoryColors: Record<string, string> = {
    [topCategories[0] || '']: '#002B66',
    [topCategories[1] || '']: '#FDB913',
    [topCategories[2] || '']: '#10B981',
    [topCategories[3] || '']: '#8B5CF6',
    [topCategories[4] || '']: '#EC4899',
  };

  // Build the monthly timeline and aggregate data
  const { chartData, kpiStats } = useMemo(() => {
    // Current simulated system date (defaults to current runtime date: Sep 2026)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // 1. Generate month slots based on selected timeframe
    const slots: { year: number; month: number; key: string; label: string; labelFull: string }[] = [];

    if (timeframe === '12_MONTHS') {
      // 12 months rolling window ending at current month
      for (let i = 11; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const key = `${y}-${String(m + 1).padStart(2, '0')}`;
        slots.push({
          year: y,
          month: m,
          key,
          label: `${BULAN_SHORT[m]} '${String(y).slice(-2)}`,
          labelFull: `${BULAN_NAMES[m]} ${y}`
        });
      }
    } else if (timeframe === 'YEAR_2026') {
      for (let m = 0; m < 12; m++) {
        const key = `2026-${String(m + 1).padStart(2, '0')}`;
        slots.push({
          year: 2026,
          month: m,
          key,
          label: `${BULAN_SHORT[m]} '26`,
          labelFull: `${BULAN_NAMES[m]} 2026`
        });
      }
    } else if (timeframe === 'YEAR_2025') {
      for (let m = 0; m < 12; m++) {
        const key = `2025-${String(m + 1).padStart(2, '0')}`;
        slots.push({
          year: 2025,
          month: m,
          key,
          label: `${BULAN_SHORT[m]} '25`,
          labelFull: `${BULAN_NAMES[m]} 2025`
        });
      }
    } else {
      // ALL: Gather all years present in data
      let minYear = 2024;
      let maxYear = 2026;
      pesertaList.forEach(p => {
        if (p.tahun && p.tahun < minYear) minYear = p.tahun;
        if (p.tahun && p.tahun > maxYear) maxYear = p.tahun;
      });
      for (let y = minYear; y <= maxYear; y++) {
        for (let m = 0; m < 12; m++) {
          const key = `${y}-${String(m + 1).padStart(2, '0')}`;
          slots.push({
            year: y,
            month: m,
            key,
            label: `${BULAN_SHORT[m]} '${String(y).slice(-2)}`,
            labelFull: `${BULAN_NAMES[m]} ${y}`
          });
        }
      }
    }

    // Initialize mapping
    const map: Record<string, MonthlyDataPoint> = {};
    slots.forEach(s => {
      const point: MonthlyDataPoint = {
        key: s.key,
        label: s.label,
        labelFull: s.labelFull,
        year: s.year,
        month: s.month,
        total: 0,
        cumulative: 0,
        totalBiaya: 0,
        lulus: 0,
        aktif: 0,
        selesai: 0,
        terdaftar: 0,
        lainnya: 0
      };
      // Initialize categories
      topCategories.forEach(c => {
        point[c] = 0;
      });
      map[s.key] = point;
    });

    // Filter participants by category filter if set
    const candidates = pesertaList.filter(p => {
      if (filterKategori !== 'ALL' && p.kategoriProgram !== filterKategori) return false;
      return true;
    });

    // Populate data into months
    candidates.forEach(p => {
      let d: Date | null = null;
      if (dateBasis === 'createdAt') {
        d = parseDateSafely(p.createdAt) || parseDateSafely(p.tanggalMulai);
      } else {
        d = parseDateSafely(p.tanggalMulai) || parseDateSafely(p.createdAt);
      }

      // If still null, fallback to year and default to January or midpoint
      let year = p.tahun || 2026;
      let month = 0;
      if (d) {
        year = d.getFullYear();
        month = d.getMonth();
      }

      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      if (map[key]) {
        map[key].total += 1;
        map[key].totalBiaya += Number(p.biayaProgram || 0);

        // Status
        const st = (p.statusPeserta || '').toLowerCase();
        if (st === 'lulus') map[key].lulus += 1;
        else if (st === 'aktif') map[key].aktif += 1;
        else if (st === 'selesai') map[key].selesai += 1;
        else if (st === 'terdaftar') map[key].terdaftar += 1;
        else map[key].lainnya += 1;

        // Category breakdown
        const kat = p.kategoriProgram || 'Lainnya';
        if (topCategories.includes(kat)) {
          map[key][kat] = ((map[key][kat] as number) || 0) + 1;
        }
      }
    });

    // Compute cumulative counts
    let runningTotal = 0;
    const finalData = slots.map(s => {
      const item = map[s.key];
      runningTotal += item.total;
      item.cumulative = runningTotal;
      return item;
    });

    // KPI Metrics calculation
    const totalPendaftarPeriode = finalData.reduce((acc, curr) => acc + curr.total, 0);
    const totalBiayaPeriode = finalData.reduce((acc, curr) => acc + curr.totalBiaya, 0);
    const avgPerBulan = (totalPendaftarPeriode / (finalData.length || 1)).toFixed(1);

    // Peak Month
    let peakMonth = finalData[0] || null;
    finalData.forEach(d => {
      if (!peakMonth || d.total > peakMonth.total) {
        peakMonth = d;
      }
    });

    // Month-over-Month calculation (last month vs second-last month)
    const lastItem = finalData[finalData.length - 1];
    const prevItem = finalData.length > 1 ? finalData[finalData.length - 2] : null;
    let momGrowth: number | null = null;
    if (lastItem && prevItem) {
      if (prevItem.total === 0) {
        momGrowth = lastItem.total > 0 ? 100 : 0;
      } else {
        momGrowth = Math.round(((lastItem.total - prevItem.total) / prevItem.total) * 100);
      }
    }

    return {
      chartData: finalData,
      kpiStats: {
        totalPendaftarPeriode,
        totalBiayaPeriode,
        avgPerBulan,
        peakMonth,
        momGrowth,
        activeMonthsCount: finalData.filter(d => d.total > 0).length,
        totalMonths: finalData.length,
        lastMonthLabel: lastItem?.labelFull || ''
      }
    };
  }, [pesertaList, timeframe, dateBasis, filterKategori, topCategories]);

  // Export current chart data as CSV
  const handleExportCSV = () => {
    const headers = [
      'Kode Bulan',
      'Nama Bulan',
      'Tahun',
      'Total Pendaftar',
      'Akumulasi Pendaftar',
      'Status Terdaftar',
      'Status Aktif',
      'Status Selesai',
      'Status Lulus',
      'Estimasi Biaya Program (Rp)'
    ];

    const rows = chartData.map(d => [
      `"${d.key}"`,
      `"${d.labelFull}"`,
      d.year,
      d.total,
      d.cumulative,
      d.terdaftar,
      d.aktif,
      d.selesai,
      d.lulus,
      d.totalBiaya
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tren_Pendaftar_SIMPENDIK_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as MonthlyDataPoint;
      return (
        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 shadow-xl text-xs space-y-2 min-w-[200px]">
          <div className="border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#002B66]" />
              {dataPoint.labelFull}
            </span>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {dataPoint.total} pendaftar baru bulan ini
            </div>
          </div>

          {breakdown === 'overview' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#002B66]"></span>
                  Pendaftar Baru:
                </span>
                <span className="font-black text-[#002B66]">{dataPoint.total} orang</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FDB913]"></span>
                  Akumulasi Pendaftar:
                </span>
                <span className="font-bold text-slate-800">{dataPoint.cumulative} orang</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-slate-100">
                <span className="text-slate-500">Estimasi PNBP:</span>
                <span className="font-semibold text-emerald-600 font-mono">
                  Rp {dataPoint.totalBiaya.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}

          {breakdown === 'status' && (
            <div className="space-y-1 pt-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Komposisi Status:</div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Lulus:
                </span>
                <span className="font-bold text-slate-800">{dataPoint.lulus}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Aktif:
                </span>
                <span className="font-bold text-slate-800">{dataPoint.aktif}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Selesai:
                </span>
                <span className="font-bold text-slate-800">{dataPoint.selesai}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Terdaftar:
                </span>
                <span className="font-bold text-slate-800">{dataPoint.terdaftar}</span>
              </div>
            </div>
          )}

          {breakdown === 'kategori' && (
            <div className="space-y-1 pt-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Top Kategori Program:</div>
              {topCategories.map(cat => {
                const count = (dataPoint[cat] as number) || 0;
                return (
                  <div key={cat} className="flex justify-between items-center text-slate-600 gap-2">
                    <span className="truncate max-w-[140px] flex items-center gap-1" title={cat}>
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: categoryColors[cat] || '#64748B' }}
                      />
                      {cat}
                    </span>
                    <span className="font-bold text-slate-800">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* Top Header Card */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/70 via-white to-amber-50/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#002B66] text-white flex items-center justify-center shadow-xs">
                <TrendingUp className="w-4 h-4 text-[#FDB913]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#002B66] flex items-center gap-2">
                  Tren Pendaftar Peserta Non Gelar
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#FDB913]/20 text-[#002B66] rounded-full">
                    Recharts Interactive
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Visualisasi grafik time-series jumlah pendaftar per bulan selama setahun terakhir
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Timeframe Selector */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setTimeframe('12_MONTHS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeframe === '12_MONTHS'
                    ? 'bg-[#002B66] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                12 Bulan Terakhir
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('YEAR_2026')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeframe === 'YEAR_2026'
                    ? 'bg-[#002B66] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tahun 2026
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('YEAR_2025')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeframe === 'YEAR_2025'
                    ? 'bg-[#002B66] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tahun 2025
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeframe === 'ALL'
                    ? 'bg-[#002B66] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Unduh data tren pendaftar format CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Secondary Toolbar: Chart Type & Breakdown Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-200/70 text-xs">
          {/* Chart Type Segmented Control */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Bentuk Visual:</span>
            <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setChartStyle('area')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  chartStyle === 'area'
                    ? 'bg-white text-[#002B66] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Area Halus
              </button>
              <button
                type="button"
                onClick={() => setChartStyle('bar')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  chartStyle === 'bar'
                    ? 'bg-white text-[#002B66] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Batang Kolom
              </button>
              <button
                type="button"
                onClick={() => setChartStyle('line')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  chartStyle === 'line'
                    ? 'bg-white text-[#002B66] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Garis Tren
              </button>
            </div>
          </div>

          {/* Breakdown Mode */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Mode Layer:</span>
            <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setBreakdown('overview')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  breakdown === 'overview'
                    ? 'bg-white text-[#002B66] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Total & Akumulasi
              </button>
              <button
                type="button"
                onClick={() => setBreakdown('status')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  breakdown === 'status'
                    ? 'bg-white text-[#002B66] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Status Peserta
              </button>
              <button
                type="button"
                onClick={() => setBreakdown('kategori')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  breakdown === 'kategori'
                    ? 'bg-white text-[#002B66] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Top Kategori
              </button>
            </div>
          </div>

          {/* Date Basis & Category Filter Selectors */}
          <div className="flex items-center gap-2">
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 focus:outline-none focus:border-[#002B66] cursor-pointer"
            >
              <option value="ALL">Semua Kategori ({pesertaList.length})</option>
              {kategoriList.map(k => (
                <option key={k.idKategori} value={k.namaKategori}>
                  {k.namaKategori}
                </option>
              ))}
            </select>

            <select
              value={dateBasis}
              onChange={(e) => setDateBasis(e.target.value as DateBasisOption)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 focus:outline-none focus:border-[#002B66] cursor-pointer"
              title="Pilih dasar perhitungan tanggal"
            >
              <option value="createdAt">Tgl Registrasi (createdAt)</option>
              <option value="tanggalMulai">Tgl Mulai Program</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Trend Highlight Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-b border-slate-100 bg-white">
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#002B66]/10 text-[#002B66] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Pendaftar
            </div>
            <div className="text-xl font-black text-[#002B66]">
              {kpiStats.totalPendaftarPeriode}{' '}
              <span className="text-xs font-semibold text-slate-500">orang</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Dalam {kpiStats.totalMonths} bulan pantauan
            </div>
          </div>
        </div>

        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Rerata per Bulan
            </div>
            <div className="text-xl font-black text-amber-700">
              {kpiStats.avgPerBulan}{' '}
              <span className="text-xs font-semibold text-slate-500">org/bln</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {kpiStats.activeMonthsCount} bulan terdapat pendaftaran
            </div>
          </div>
        </div>

        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Bulan Puncak
            </div>
            <div className="text-xl font-black text-emerald-600">
              {kpiStats.peakMonth ? `${kpiStats.peakMonth.total} org` : '-'}
            </div>
            <div className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]" title={kpiStats.peakMonth?.labelFull || ''}>
              {kpiStats.peakMonth?.labelFull || '-'}
            </div>
          </div>
        </div>

        <div className="p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            kpiStats.momGrowth === null
              ? 'bg-slate-100 text-slate-500'
              : kpiStats.momGrowth > 0
              ? 'bg-emerald-50 text-emerald-600'
              : kpiStats.momGrowth < 0
              ? 'bg-rose-50 text-rose-600'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {kpiStats.momGrowth === null ? (
              <Minus className="w-5 h-5" />
            ) : kpiStats.momGrowth > 0 ? (
              <ArrowUpRight className="w-5 h-5" />
            ) : kpiStats.momGrowth < 0 ? (
              <ArrowDownRight className="w-5 h-5" />
            ) : (
              <Minus className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Pertumbuhan MoM
            </div>
            <div className={`text-xl font-black ${
              kpiStats.momGrowth === null
                ? 'text-slate-600'
                : kpiStats.momGrowth > 0
                ? 'text-emerald-600'
                : kpiStats.momGrowth < 0
                ? 'text-rose-600'
                : 'text-slate-700'
            }`}>
              {kpiStats.momGrowth === null ? '0%' : `${kpiStats.momGrowth > 0 ? '+' : ''}${kpiStats.momGrowth}%`}
            </div>
            <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
              Bulan terakhir ({kpiStats.lastMonthLabel.split(' ')[0] || ''})
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Recharts Area */}
      <div className="p-4 sm:p-6 bg-white">
        <div className="w-full h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            {chartStyle === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#002B66" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#002B66" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FDB913" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FDB913" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorLulus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorAktif" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 16, fontSize: 11 }}
                  iconType="circle"
                />

                {breakdown === 'overview' && (
                  <>
                    <Area
                      type="monotone"
                      name="Pendaftar Baru"
                      dataKey="total"
                      stroke="#002B66"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                      activeDot={{ r: 6, fill: '#002B66', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                    <Area
                      type="monotone"
                      name="Akumulasi"
                      dataKey="cumulative"
                      stroke="#FDB913"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#colorCum)"
                      activeDot={{ r: 5, fill: '#FDB913', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                  </>
                )}

                {breakdown === 'status' && (
                  <>
                    <Area
                      type="monotone"
                      name="Lulus"
                      dataKey="lulus"
                      stackId="statusStack"
                      stroke="#10B981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorLulus)"
                    />
                    <Area
                      type="monotone"
                      name="Aktif"
                      dataKey="aktif"
                      stackId="statusStack"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAktif)"
                    />
                    <Area
                      type="monotone"
                      name="Selesai"
                      dataKey="selesai"
                      stackId="statusStack"
                      stroke="#6366F1"
                      strokeWidth={2}
                      fill="#6366F1"
                      fillOpacity={0.25}
                    />
                    <Area
                      type="monotone"
                      name="Terdaftar"
                      dataKey="terdaftar"
                      stackId="statusStack"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      fill="#F59E0B"
                      fillOpacity={0.25}
                    />
                  </>
                )}

                {breakdown === 'kategori' && (
                  <>
                    {topCategories.map(cat => (
                      <Area
                        key={cat}
                        type="monotone"
                        name={cat}
                        dataKey={cat}
                        stackId="catStack"
                        stroke={categoryColors[cat] || '#64748B'}
                        strokeWidth={2}
                        fill={categoryColors[cat] || '#64748B'}
                        fillOpacity={0.25}
                      />
                    ))}
                  </>
                )}
              </AreaChart>
            ) : chartStyle === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 16, fontSize: 11 }}
                  iconType="circle"
                />

                {breakdown === 'overview' && (
                  <>
                    <Bar
                      name="Pendaftar Baru"
                      dataKey="total"
                      fill="#002B66"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={40}
                    />
                  </>
                )}

                {breakdown === 'status' && (
                  <>
                    <Bar name="Lulus" dataKey="lulus" stackId="statusBar" fill="#10B981" />
                    <Bar name="Aktif" dataKey="aktif" stackId="statusBar" fill="#3B82F6" />
                    <Bar name="Selesai" dataKey="selesai" stackId="statusBar" fill="#6366F1" />
                    <Bar name="Terdaftar" dataKey="terdaftar" stackId="statusBar" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                  </>
                )}

                {breakdown === 'kategori' && (
                  <>
                    {topCategories.map((cat, index) => (
                      <Bar
                        key={cat}
                        name={cat}
                        dataKey={cat}
                        stackId="catBar"
                        fill={categoryColors[cat] || '#64748B'}
                        radius={index === topCategories.length - 1 ? [6, 6, 0, 0] : undefined}
                      />
                    ))}
                  </>
                )}
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 16, fontSize: 11 }}
                  iconType="circle"
                />

                {breakdown === 'overview' && (
                  <>
                    <Line
                      type="monotone"
                      name="Pendaftar Baru"
                      dataKey="total"
                      stroke="#002B66"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#002B66', strokeWidth: 1, stroke: '#FFFFFF' }}
                      activeDot={{ r: 7, fill: '#002B66', stroke: '#FDB913', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      name="Akumulasi"
                      dataKey="cumulative"
                      stroke="#FDB913"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 3, fill: '#FDB913' }}
                    />
                  </>
                )}

                {breakdown === 'status' && (
                  <>
                    <Line type="monotone" name="Lulus" dataKey="lulus" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" name="Aktif" dataKey="aktif" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" name="Selesai" dataKey="selesai" stroke="#6366F1" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" name="Terdaftar" dataKey="terdaftar" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                  </>
                )}

                {breakdown === 'kategori' && (
                  <>
                    {topCategories.map(cat => (
                      <Line
                        key={cat}
                        type="monotone"
                        name={cat}
                        dataKey={cat}
                        stroke={categoryColors[cat] || '#64748B'}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    ))}
                  </>
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Collapsible Monthly Tabular Audit Breakdown */}
      <div className="border-t border-slate-100 bg-slate-50/60 p-4">
        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          className="w-full flex items-center justify-between text-xs font-bold text-[#002B66] hover:text-[#001D45] transition-all cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#FDB913]" />
            Tabel Rekapitulasi Rincian Pendaftar Bulanan ({chartData.length} Bulan)
          </span>
          <span className="flex items-center gap-1 text-slate-500 font-normal text-[11px]">
            {showTable ? 'Sembunyikan Tabel' : 'Tampilkan Data Angka'}
            {showTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {showTable && (
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#002B66] text-white font-bold">
                <tr>
                  <th className="p-2.5">Bulan & Tahun</th>
                  <th className="p-2.5 text-center">Pendaftar Baru</th>
                  <th className="p-2.5 text-center">Akumulasi</th>
                  <th className="p-2.5 text-center">Lulus</th>
                  <th className="p-2.5 text-center">Aktif</th>
                  <th className="p-2.5 text-center">Selesai / Terdaftar</th>
                  <th className="p-2.5 text-right">Estimasi PNBP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {chartData.map(d => (
                  <tr key={d.key} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 font-sans font-semibold text-slate-800">
                      {d.labelFull}
                    </td>
                    <td className="p-2.5 text-center font-bold text-[#002B66]">
                      {d.total > 0 ? (
                        <span className="bg-[#002B66]/10 text-[#002B66] px-2 py-0.5 rounded-full">
                          {d.total}
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center text-slate-700">
                      {d.cumulative}
                    </td>
                    <td className="p-2.5 text-center text-emerald-600 font-semibold">
                      {d.lulus}
                    </td>
                    <td className="p-2.5 text-center text-blue-600">
                      {d.aktif}
                    </td>
                    <td className="p-2.5 text-center text-slate-600">
                      {d.selesai + d.terdaftar}
                    </td>
                    <td className="p-2.5 text-right font-semibold text-slate-700">
                      Rp {d.totalBiaya.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t border-slate-200">
                <tr>
                  <td className="p-2.5 text-slate-800">Total Keseluruhan</td>
                  <td className="p-2.5 text-center text-[#002B66]">
                    {kpiStats.totalPendaftarPeriode}
                  </td>
                  <td className="p-2.5 text-center text-slate-700">
                    {chartData[chartData.length - 1]?.cumulative || 0}
                  </td>
                  <td className="p-2.5 text-center text-emerald-700">
                    {chartData.reduce((acc, c) => acc + c.lulus, 0)}
                  </td>
                  <td className="p-2.5 text-center text-blue-700">
                    {chartData.reduce((acc, c) => acc + c.aktif, 0)}
                  </td>
                  <td className="p-2.5 text-center text-slate-700">
                    {chartData.reduce((acc, c) => acc + c.selesai + c.terdaftar, 0)}
                  </td>
                  <td className="p-2.5 text-right text-[#002B66]">
                    Rp {kpiStats.totalBiayaPeriode.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
