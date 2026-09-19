import React, { useState } from 'react';
import { 
  Users, UserCheck, Shield, RotateCcw, Check, X, 
  CheckCircle2, XCircle, AlertCircle, Sparkles, Filter,
  SlidersHorizontal, Lock, Unlock, Eye, HelpCircle
} from 'lucide-react';
import { AppMenuItemDef, GroupAkun, UserItem, MenuPrivilege } from '../types';
import { getEffectivePrivilege, hasMenuAccess } from '../data/privilegeData';

const KATEGORI_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Dashboard & Peta': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'Master Data Program': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Operasional & Peserta': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Laporan & Analitik': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Administrasi Sistem': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

interface UserMenuSimulatorViewProps {
  menus: AppMenuItemDef[];
  groups: GroupAkun[];
  users: UserItem[];
  selectedUserId: string;
  onSelectUserId: (userId: string) => void;
  onSetUserMenuAccess: (userId: string, menuId: string, canAccess: boolean) => void;
  onClearUserMenuOverride: (userId: string, menuId: string) => void;
  onResetUserOverrides: (userId: string) => void;
}

export const UserMenuSimulatorView: React.FC<UserMenuSimulatorViewProps> = ({
  menus,
  groups,
  users,
  selectedUserId,
  onSelectUserId,
  onSetUserMenuAccess,
  onClearUserMenuOverride,
  onResetUserOverrides,
}) => {
  const [filterModule, setFilterModule] = useState('ALL');
  const [filterOverrideOnly, setFilterOverrideOnly] = useState(false);

  const selectedUser = users.find(u => u.userId === selectedUserId) || users[0];
  const userGroup = groups.find(g => g.id === (selectedUser?.groupId || selectedUser?.role));

  const categories = ['ALL', ...Array.from(new Set(menus.map(m => m.kategoriModul || 'Operasional & Peserta')))];

  const userCustomPrivileges = selectedUser?.customPrivileges || {};
  const overrideCount = Object.keys(userCustomPrivileges).length;

  const filteredMenus = menus.filter(m => {
    if (filterModule !== 'ALL' && m.kategoriModul !== filterModule) return false;
    if (filterOverrideOnly && !(m.id in userCustomPrivileges)) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* User Selection & Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* User Selector Dropdown */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#002B66] text-white flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Pilih Pengguna yang Diatur:
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => onSelectUserId(e.target.value)}
                className="mt-0.5 text-sm font-bold text-[#002B66] bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#002B66] focus:outline-hidden"
              >
                {users.map(u => (
                  <option key={u.userId} value={u.userId}>
                    {u.nama} ({u.role} - {u.groupId || 'Default'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User Badge & Reset Button */}
          {selectedUser && (
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-800">{selectedUser.nama}</div>
                <div className="text-[11px] text-slate-400 font-mono">{selectedUser.email || selectedUser.userId}</div>
              </div>

              <div className="px-3 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-xs font-semibold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Group: {userGroup?.namaGroup || selectedUser.groupId || selectedUser.role}</span>
              </div>

              {overrideCount > 0 ? (
                <button
                  onClick={() => onResetUserOverrides(selectedUser.userId)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  title="Hapus semua override custom dan kembalikan hak akses mengikuti Group Akun"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Reset {overrideCount} Hak Khusus</span>
                </button>
              ) : (
                <div className="px-3 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-medium">
                  100% Mengikuti Group
                </div>
              )}
            </div>
          )}
        </div>

        {/* Explain Banner */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
          <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            <strong>Prinsip Hierarki Akses Menu:</strong> Hak akses menu pengguna pertama-tama diwariskan dari <strong>Group Akun</strong> ({userGroup?.namaGroup || 'Role'}). Jika pengguna diberikan <strong>Hak Khusus (Override)</strong>, hak tersebut akan menggantikan izin group. Menu yang berstatus <em>Nonaktif</em> akan disembunyikan untuk non-admin.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter Modul:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterModule(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                filterModule === cat
                  ? 'bg-[#002B66] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'Semua' : cat}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={filterOverrideOnly}
            onChange={(e) => setFilterOverrideOnly(e.target.checked)}
            className="rounded border-slate-300 text-[#002B66] focus:ring-[#002B66]"
          />
          <span>Hanya tampilkan menu dengan Hak Khusus ({overrideCount})</span>
        </label>
      </div>

      {/* Detailed Menu Permissions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 min-w-[200px]">Menu Aplikasi</th>
                <th className="py-3 px-3">Izin Group Akun</th>
                <th className="py-3 px-3">Hak Khusus User</th>
                <th className="py-3 px-3 text-center">Status Efektif</th>
                <th className="py-3 px-4 text-right">Aksi Cepat Pengguna</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredMenus.map((menu, idx) => {
                const catColor = KATEGORI_COLORS[menu.kategoriModul] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
                const isGlobalAktif = menu.aktif !== false;

                // Group baseline
                const groupPriv = userGroup?.privileges ? userGroup.privileges[menu.id] : undefined;
                const groupCanAccess = selectedUser.role === 'ADMIN' ? true : (groupPriv ? groupPriv.canAccess : false);

                // User override
                const hasOverride = menu.id in userCustomPrivileges;
                const overrideVal = userCustomPrivileges[menu.id];
                const overrideCanAccess = overrideVal?.canAccess;

                // Final effective access
                const effectiveAllowed = hasMenuAccess(selectedUser, groups, menu.id as any, menus);

                return (
                  <tr 
                    key={menu.id} 
                    className={`hover:bg-slate-50/80 transition-colors ${!isGlobalAktif ? 'bg-slate-50/50 opacity-70' : ''}`}
                  >
                    <td className="py-3 px-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    {/* Menu Details */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 text-xs">{menu.label}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono text-slate-400">id: {menu.id}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                          {menu.kategoriModul}
                        </span>
                        {!isGlobalAktif && (
                          <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-semibold">
                            Nonaktif Global
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Group Baseline Status */}
                    <td className="py-3 px-3">
                      {groupCanAccess ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Diizinkan oleh Group
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          <X className="w-3 h-3 text-slate-400" />
                          Terkunci di Group
                        </span>
                      )}
                    </td>

                    {/* User Override Status */}
                    <td className="py-3 px-3">
                      {hasOverride ? (
                        overrideCanAccess ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            Akses Diberikan Khusus
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300">
                            <Lock className="w-3 h-3 text-rose-600" />
                            Akses Dicabut Khusus
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Mengikuti Group
                        </span>
                      )}
                    </td>

                    {/* Effective Result */}
                    <td className="py-3 px-3 text-center">
                      {effectiveAllowed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          BISA DIAKSES
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300">
                          <XCircle className="w-3.5 h-3.5 text-slate-400" />
                          TERKUNCI
                        </span>
                      )}
                    </td>

                    {/* Quick User Override Action Buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {hasOverride ? (
                          <button
                            onClick={() => onClearUserMenuOverride(selectedUser.userId, menu.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Hapus hak khusus, kembali mengikuti Group"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Kembali ke Group</span>
                          </button>
                        ) : (
                          <>
                            {effectiveAllowed ? (
                              <button
                                onClick={() => onSetUserMenuAccess(selectedUser.userId, menu.id, false)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                                title="Kunci menu ini khusus untuk pengguna ini saja"
                              >
                                <Lock className="w-3 h-3 text-rose-600" />
                                <span>Kunci Khusus</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => onSetUserMenuAccess(selectedUser.userId, menu.id, true)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                                title="Beri izin menu ini khusus untuk pengguna ini saja"
                              >
                                <Unlock className="w-3 h-3 text-emerald-600" />
                                <span>Beri Akses Khusus</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
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
