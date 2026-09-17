import React, { useState, useMemo } from 'react';
import { 
  History, Search, Filter, Download, 
  Calendar, User, Shield, Terminal
} from 'lucide-react';
import { LogAktivitas } from '../types';

interface LogAktivitasViewProps {
  logs: LogAktivitas[];
}

export const LogAktivitasView: React.FC<LogAktivitasViewProps> = ({ logs }) => {
  const [searchKw, setSearchKw] = useState('');
  const [selectedModul, setSelectedModul] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (selectedModul !== 'ALL' && l.modul !== selectedModul) return false;
      if (searchKw.trim()) {
        const kw = searchKw.toLowerCase();
        return (
          l.aktivitas.toLowerCase().includes(kw) ||
          l.user.toLowerCase().includes(kw) ||
          l.idData.toLowerCase().includes(kw) ||
          l.keterangan.toLowerCase().includes(kw)
        );
      }
      return true;
    });
  }, [logs, selectedModul, searchKw]);

  const handleExportLogs = () => {
    const headers = ['ID Log', 'Waktu Timestamp', 'User', 'Modul', 'Aktivitas', 'ID Data', 'Keterangan', 'IP / User Agent'];
    const rows = filteredLogs.map(l => [
      l.id, l.timestamp, l.user, l.modul, l.aktivitas, l.idData, l.keterangan, l.ipUserAgent || ''
    ]);

    const content = 'data:text/csv;charset=utf-8,\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const encodedUri = encodeURI(content);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Log_Aktivitas_SIMPENDIK_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-[#002B66]">Audit Trail Log Aktivitas Sistem</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rekam jejak setiap aksi penambahan, perubahan, dan penghapusan data pada Google Sheets
          </p>
        </div>

        <button
          onClick={handleExportLogs}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Log CSV</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari aktivitas, user, ID data, atau keterangan..."
            value={searchKw}
            onChange={(e) => setSearchKw(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedModul}
            onChange={(e) => setSelectedModul(e.target.value)}
            className="w-full md:w-48 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Semua Modul</option>
            <option value="PESERTA">Modul PESERTA</option>
            <option value="KATEGORI">Modul KATEGORI</option>
            <option value="PROGRAM">Modul PROGRAM</option>
            <option value="USER">Modul USER</option>
            <option value="AUTH">Modul AUTH</option>
            <option value="SETTING">Modul SETTING</option>
            <option value="SETUP">Modul SETUP</option>
          </select>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#002B66] text-white font-bold">
              <tr>
                <th className="p-3 w-16">ID</th>
                <th className="p-3 w-40">Waktu & Tanggal</th>
                <th className="p-3">User Pelaksana</th>
                <th className="p-3">Modul</th>
                <th className="p-3">Aktivitas</th>
                <th className="p-3">ID Data</th>
                <th className="p-3">Keterangan Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Tidak ada catatan log aktivitas yang cocok.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-400">{l.id}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">{l.timestamp}</td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-800">{l.user}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                        {l.modul}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-[#002B66]">{l.aktivitas}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">{l.idData}</td>
                    <td className="p-3 text-slate-600 max-w-sm">{l.keterangan}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
