import React, { useState } from 'react';
import { 
  Shield, Check, X, Sparkles, Filter, Info, SlidersHorizontal,
  CheckCircle2, XCircle, ChevronDown, Lock, Unlock
} from 'lucide-react';
import { AppMenuItemDef, GroupAkun, MenuPrivilege } from '../types';

const KATEGORI_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Dashboard & Peta': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'Master Data Program': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Operasional & Peserta': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Laporan & Analitik': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Administrasi Sistem': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

const PRESET_OPTIONS: Array<{ key: 'ADMIN' | 'OPERATOR' | 'VIEWER' | 'KEUANGAN' | 'KOORDINATOR_PROGRAM'; label: string; desc: string }> = [
  { key: 'ADMIN', label: 'Preset: Administrator (Full Access)', desc: 'Akses penuh ke semua menu sistem & administrasi' },
  { key: 'OPERATOR', label: 'Preset: Operator Data', desc: 'Input peserta, master program/kategori, edukasi & export' },
  { key: 'VIEWER', label: 'Preset: Viewer / Pimpinan', desc: 'Read-only ke dashboard, peserta, statistik & peta' },
  { key: 'KEUANGAN', label: 'Preset: Verifikator Keuangan', desc: 'Akses data peserta, pembayaran eduventure & verifikasi' },
  { key: 'KOORDINATOR_PROGRAM', label: 'Preset: Koordinator Program', desc: 'Pengelolaan peserta, program, PIC & materi pelatihan' },
];

interface MenuMatrixViewProps {
  menus: AppMenuItemDef[];
  groups: GroupAkun[];
  onToggleGroupMenu: (groupId: string, menuId: string, currentAllowed: boolean) => void;
  onApplyRolePreset: (groupId: string, presetKey: 'ADMIN' | 'OPERATOR' | 'VIEWER' | 'KEUANGAN' | 'KOORDINATOR_PROGRAM') => void;
}

export const MenuMatrixView: React.FC<MenuMatrixViewProps> = ({
  menus,
  groups,
  onToggleGroupMenu,
  onApplyRolePreset,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [openPresetDropdown, setOpenPresetDropdown] = useState<string | null>(null);

  const categories = ['ALL', ...Array.from(new Set(menus.map(m => m.kategoriModul || 'Operasional & Peserta')))];

  const filteredMenus = menus.filter(m => {
    if (selectedCategory === 'ALL') return true;
    return m.kategoriModul === selectedCategory;
  });

  return (
    <div className="space-y-4">
      {/* Information Header & Category Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Matriks Hak Akses Menu per Group / Role</h3>
            <p className="text-xs text-slate-500">
              Klik pada sakelar hak akses untuk mengizinkan atau mencabut menu untuk group akun tertentu secara instan.
            </p>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Modul:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#002B66] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'Semua Modul' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 min-w-[220px]">Menu Aplikasi</th>
                <th className="py-3 px-3 min-w-[130px]">Status Global</th>
                
                {/* Columns for each Group */}
                {groups.map((group) => (
                  <th key={group.id} className="py-3 px-3 min-w-[170px] border-l border-slate-200 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-bold text-slate-800 text-xs truncate max-w-[150px]">
                        {group.namaGroup}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${group.warnaBadge}`}>
                        {group.id}
                      </span>

                      {/* Role Preset Dropdown Button */}
                      <div className="relative mt-1">
                        <button
                          onClick={() => setOpenPresetDropdown(openPresetDropdown === group.id ? null : group.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
                          title="Terapkan template hak akses role ke group ini"
                        >
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Preset Role</span>
                          <ChevronDown className="w-3 h-3 text-blue-600" />
                        </button>

                        {openPresetDropdown === group.id && (
                          <div className="absolute left-1/2 -translate-x-1/2 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1.5 text-left animate-in fade-in">
                            <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                              Terapkan Template Role:
                            </div>
                            <div className="py-1 space-y-1">
                              {PRESET_OPTIONS.map((opt) => (
                                <button
                                  key={opt.key}
                                  onClick={() => {
                                    onApplyRolePreset(group.id, opt.key);
                                    setOpenPresetDropdown(null);
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-blue-50 hover:text-blue-900 transition-colors cursor-pointer group"
                                >
                                  <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                                    {opt.label}
                                  </div>
                                  <div className="text-[10px] text-slate-400 leading-tight">
                                    {opt.desc}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredMenus.map((menu, idx) => {
                const isGlobalAktif = menu.aktif !== false;
                const catColor = KATEGORI_COLORS[menu.kategoriModul] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };

                return (
                  <tr key={menu.id} className={`hover:bg-slate-50/80 transition-colors ${!isGlobalAktif ? 'bg-slate-50/60 opacity-70' : ''}`}>
                    <td className="py-2.5 px-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    {/* Menu Label, ID & Category */}
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-xs">
                          {menu.label}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-400">
                            id: {menu.id}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                            {menu.kategoriModul}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Global Active/Inactive Status */}
                    <td className="py-2.5 px-3">
                      {isGlobalAktif ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Nonaktif (Tutup)
                        </span>
                      )}
                    </td>

                    {/* Checkbox / Toggle for each Group */}
                    {groups.map((group) => {
                      const groupPriv = group.privileges ? group.privileges[menu.id] : undefined;
                      const isAllowed = groupPriv ? groupPriv.canAccess : false;
                      const isSystemAdmin = group.id === 'ADMIN';

                      return (
                        <td key={group.id} className="py-2.5 px-3 border-l border-slate-100 text-center">
                          <button
                            onClick={() => {
                              if (isSystemAdmin) return;
                              onToggleGroupMenu(group.id, menu.id, isAllowed);
                            }}
                            disabled={isSystemAdmin}
                            className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                              isAllowed
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200'
                            } ${isSystemAdmin ? 'cursor-not-allowed opacity-90' : 'cursor-pointer shadow-2xs'}`}
                            title={
                              isSystemAdmin 
                                ? 'Role Admin Utama selalu memiliki hak akses penuh' 
                                : isAllowed 
                                  ? 'Akses diizinkan. Klik untuk mencabut' 
                                  : 'Akses terkunci. Klik untuk memberikan izin'
                            }
                          >
                            {isAllowed ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Diizinkan</span>
                              </>
                            ) : (
                              <>
                                <X className="w-3.5 h-3.5 text-slate-400" />
                                <span>Terkunci</span>
                              </>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
