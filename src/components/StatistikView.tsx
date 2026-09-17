import React, { useMemo } from 'react';
import { 
  BarChart3, PieChart, TrendingUp, DollarSign, 
  Award, Building2, Layers, CheckCircle2
} from 'lucide-react';
import { Peserta, Kategori, Program } from '../types';

interface StatistikViewProps {
  pesertaList: Peserta[];
  kategoriList: Kategori[];
  programList: Program[];
}

export const StatistikView: React.FC<StatistikViewProps> = ({
  pesertaList,
  kategoriList,
  programList,
}) => {
  // Cross-tabulation: Kategori vs Tahun
  const crossTabKategoriTahun = useMemo(() => {
    const years = [2024, 2025, 2026];
    const data: Record<string, Record<number, number>> = {};

    kategoriList.forEach(k => {
      data[k.namaKategori] = { 2024: 0, 2025: 0, 2026: 0 };
    });

    pesertaList.forEach(p => {
      if (data[p.kategoriProgram] && data[p.kategoriProgram][p.tahun] !== undefined) {
        data[p.kategoriProgram][p.tahun]++;
      }
    });

    return { years, data };
  }, [pesertaList, kategoriList]);

  // Sumber Dana Breakdown
  const fundingStats = useMemo(() => {
    const counts: Record<string, { count: number; totalRevenue: number }> = {};
    pesertaList.forEach(p => {
      const fund = p.sumberDana || 'Lainnya';
      if (!counts[fund]) counts[fund] = { count: 0, totalRevenue: 0 };
      counts[fund].count++;
      counts[fund].totalRevenue += Number(p.biayaProgram || 0);
    });
    return Object.entries(counts).sort((a, b) => b[1].count - a[1].count);
  }, [pesertaList]);

  // Kelulusan Rate
  const totalEvaluated = pesertaList.filter(p => p.statusKelulusan === 'Lulus' || p.statusKelulusan === 'Tidak Lulus').length;
  const totalLulus = pesertaList.filter(p => p.statusKelulusan === 'Lulus').length;
  const passRate = totalEvaluated > 0 ? Math.round((totalLulus / totalEvaluated) * 100) : 100;

  // Total Estimated Non-Degree Revenue
  const totalRevenue = pesertaList.reduce((acc, p) => acc + Number(p.biayaProgram || 0), 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-[#002B66]">Analitik & Statistik Pendidikan Non Gelar</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan komprehensif performa pendaftaran, rasio kelulusan, dan kontribusi pembiayaan
          </p>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Rasio Kelulusan</span>
            <div className="text-2xl font-black text-emerald-600">{passRate}%</div>
            <div className="text-[10px] text-slate-500">{totalLulus} dari {totalEvaluated} peserta terevaluasi</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#002B66]/10 text-[#002B66] flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Estimasi PNBP / Penerimaan</span>
            <div className="text-2xl font-black text-[#002B66]">
              Rp {(totalRevenue / 1000000).toFixed(1)} Jt
            </div>
            <div className="text-[10px] text-slate-500">Dari seluruh batch pendidikan</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FDB913]/20 text-[#002B66] flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Rata-rata Peserta / Program</span>
            <div className="text-2xl font-black text-slate-800">
              {programList.length > 0 ? (pesertaList.length / programList.length).toFixed(1) : 0}
            </div>
            <div className="text-[10px] text-slate-500">Rerata per kurikulum aktif</div>
          </div>
        </div>
      </div>

      {/* Cross-Tabulation Table: Kategori x Tahun */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#002B66]">Tabel Silang (Cross-Tab): Peserta per Kategori & Tahun</h2>
            <p className="text-[11px] text-slate-500">Perbandingan pertumbuhan peserta tahun 2024 - 2026</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#002B66] text-white font-bold">
              <tr>
                <th className="p-3">Kategori Program</th>
                <th className="p-3 text-center w-24">Tahun 2024</th>
                <th className="p-3 text-center w-24">Tahun 2025</th>
                <th className="p-3 text-center w-24">Tahun 2026</th>
                <th className="p-3 text-center w-28">Total Akumulasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {Object.entries(crossTabKategoriTahun.data).map(([katName, yrs]) => {
                const totalKat = (yrs[2024] || 0) + (yrs[2025] || 0) + (yrs[2026] || 0);
                return (
                  <tr key={katName} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-800">{katName}</td>
                    <td className="p-3 text-center font-mono">{yrs[2024] || 0}</td>
                    <td className="p-3 text-center font-mono">{yrs[2025] || 0}</td>
                    <td className="p-3 text-center font-mono font-bold text-[#002B66]">{yrs[2026] || 0}</td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-[#002B66] bg-slate-100 px-2 py-0.5 rounded">
                        {totalKat}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Funding Distribution Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#002B66]">Distribusi Sumber Pembiayaan Peserta</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {fundingStats.map(([fund, data]) => (
            <div key={fund} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-xs font-bold text-slate-800 truncate" title={fund}>{fund}</div>
              <div className="text-xl font-black text-[#002B66]">{data.count} Peserta</div>
              <div className="text-[10px] text-slate-500 font-mono">
                Rp {data.totalRevenue.toLocaleString('id-ID')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
