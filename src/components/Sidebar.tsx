import React, { useMemo } from 'react';
import { 
  LayoutDashboard, Users, UserPlus, Layers, GraduationCap, 
  Search, FileSpreadsheet, Download, BarChart3, ShieldCheck, 
  History, Settings, Code, X, LogOut, Map, UserCheck, Compass,
  SlidersHorizontal, Shield, ChevronRight
} from 'lucide-react';
import { UserRole, GroupAkun, UserItem, AppMenuId, AppMenuItemDef, AppThemeId } from '../types';
import { hasMenuAccess } from '../data/privilegeData';
import { getAppMenus } from '../services/storageService';
import { UnpadLogo } from './UnpadLogo';

export type ActiveTab = 
  | 'dashboard' 
  | 'map_dashboard'
  | 'peserta' 
  | 'tambah' 
  | 'kategori' 
  | 'program' 
  | 'pic'
  | 'eduventure'
  | 'search' 
  | 'import' 
  | 'export' 
  | 'statistik' 
  | 'user' 
  | 'menu_manage'
  | 'log' 
  | 'setting' 
  | 'gas_code';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  userRole: UserRole;
  currentUser?: UserItem;
  groups?: GroupAkun[];
  isOpen: boolean;
  onCloseMobile: () => void;
  onLogout?: () => void;
  currentTheme?: AppThemeId;
}

const ICON_MAP: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  map_dashboard: Map,
  peserta: Users,
  tambah: UserPlus,
  kategori: Layers,
  program: GraduationCap,
  pic: UserCheck,
  eduventure: Compass,
  search: Search,
  import: FileSpreadsheet,
  export: Download,
  statistik: BarChart3,
  user: ShieldCheck,
  menu_manage: SlidersHorizontal,
  log: History,
  setting: Settings,
  gas_code: Code,
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  currentUser,
  groups,
  isOpen,
  onCloseMobile,
  onLogout,
  currentTheme = 'unpad-blue',
}) => {
  // Ambil background class berdasarkan tema aktif
  const themeBg = currentTheme === 'unpad-emerald'
    ? 'bg-[#046A38]'
    : currentTheme === 'unpad-dark'
      ? 'bg-[#0F172A]'
      : currentTheme === 'unpad-maroon'
        ? 'bg-[#881337]'
        : 'bg-[#002B66]';

  const themeHeaderBg = currentTheme === 'unpad-emerald'
    ? 'bg-[#023e20]/80'
    : currentTheme === 'unpad-dark'
      ? 'bg-[#020617]/80'
      : currentTheme === 'unpad-maroon'
        ? 'bg-[#4c0519]/80'
        : 'bg-[#002252]/80';

  // Ambil daftar menu terkonfigurasi dari storage terurut
  const allMenus = useMemo(() => {
    return getAppMenus().sort((a, b) => (a.urutan || 99) - (b.urutan || 99));
  }, [activeTab, groups]);

  const checkItemAccess = (itemId: string): boolean => {
    const menuItem = allMenus.find(m => m.id === itemId);
    // Menu non-aktif disembunyikan secara global untuk non-admin
    if (menuItem && menuItem.aktif === false) {
      if (currentUser?.role !== 'ADMIN' && userRole !== 'ADMIN') {
        return false;
      }
    }

    if (currentUser && groups && groups.length > 0) {
      return hasMenuAccess(currentUser, groups, itemId as AppMenuId, allMenus);
    }
    if (userRole === 'ADMIN') return true;
    if (userRole === 'OPERATOR') {
      return ['dashboard', 'map_dashboard', 'kategori', 'program', 'pic', 'peserta', 'tambah', 'eduventure', 'search', 'statistik', 'export', 'log', 'gas_code'].includes(itemId);
    }
    if (userRole === 'VIEWER') {
      return ['dashboard', 'map_dashboard', 'kategori', 'program', 'pic', 'peserta', 'eduventure', 'search', 'statistik', 'export', 'gas_code'].includes(itemId);
    }
    return false;
  };

  // Filter menu yang diizinkan untuk pengguna & group saat ini
  const accessibleMenus = useMemo(() => {
    return allMenus.filter(item => {
      // Jika ADMIN, tampilkan semua menu yang aktif
      if (currentUser?.role === 'ADMIN' || userRole === 'ADMIN') {
        return item.aktif !== false;
      }
      // Untuk role/group lain, hanya tampilkan menu yang memiliki izin akses
      return checkItemAccess(item.id);
    });
  }, [allMenus, currentUser, userRole, groups]);

  // Kelompokkan menu berdasarkan Kategori Modul
  const groupedMenus = useMemo(() => {
    const categoryOrder = [
      'Dashboard & Peta',
      'Operasional & Peserta',
      'Master Data Program',
      'Laporan & Analitik',
      'Administrasi Sistem'
    ];

    const groupsMap: Record<string, AppMenuItemDef[]> = {};
    categoryOrder.forEach(cat => { groupsMap[cat] = []; });

    accessibleMenus.forEach(item => {
      const cat = item.kategoriModul || 'Operasional & Peserta';
      if (!groupsMap[cat]) groupsMap[cat] = [];
      groupsMap[cat].push(item);
    });

    return Object.entries(groupsMap).filter(([_, items]) => items.length > 0);
  }, [accessibleMenus]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed lg:static top-0 left-0 bottom-0 w-64 ${themeBg} text-white flex flex-col z-50 transition-all duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <UnpadLogo variant="light" size="xs" />
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FDB913] text-[#002B66]">
                GAS
              </span>
            </div>
            <div>
              <span className="font-black text-sm tracking-wide text-white block">
                SIMPENDIK NON GELAR
              </span>
              <p className="text-[10px] text-amber-200/90 font-medium leading-tight">
                Universitas Padjadjaran
              </p>
            </div>
          </div>
          
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-white/70 hover:text-white p-1 rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role & Group Info Header */}
        <div className={`px-3.5 py-2.5 ${themeHeaderBg} border-b border-white/5 flex items-center justify-between`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
              {currentUser?.photoUrl ? (
                <img 
                  src={currentUser.photoUrl} 
                  alt="" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <Shield className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-300 font-semibold block leading-tight truncate">
                {currentUser?.nama || 'Pengguna Unpad'}
              </span>
              <span className="font-bold text-[11px] text-amber-300 truncate block">
                {currentUser?.namaGroup || currentUser?.role || userRole}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-white/10 text-white/90 px-1.5 py-0.5 rounded shrink-0">
            {accessibleMenus.length} Menu
          </span>
        </div>

        {/* Menu Navigation Items Grouped by Role & Category */}
        <div className="flex-1 overflow-y-auto py-2 px-2.5 space-y-4 custom-scrollbar">
          {groupedMenus.map(([category, items]) => (
            <div key={category} className="space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400/80 flex items-center justify-between">
                <span>{category}</span>
                <span className="text-[9px] font-mono text-slate-500 font-normal">
                  {items.length}
                </span>
              </div>

              {items.map((item) => {
                const Icon = ICON_MAP[item.id] || LayoutDashboard;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    id={`sidebar-link-${item.id}`}
                    onClick={() => {
                      onSelectTab(item.id as ActiveTab);
                      if (window.innerWidth < 1024) onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#FDB913] text-[#002B66] shadow-xs font-bold'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#002B66]' : 'text-slate-300'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-[#002B66] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer info, User Group status & Logout */}
        <div className="p-3 border-t border-white/10 bg-[#002252] text-[11px] text-slate-300 space-y-2">
          {currentUser && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center justify-between">
              <div className="overflow-hidden">
                <span className="text-[10px] text-slate-400 block truncate">Group Akun Aktif:</span>
                <span className="font-bold text-amber-300 text-xs truncate block">
                  {currentUser.namaGroup || currentUser.role}
                </span>
              </div>
              <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-white/80 shrink-0 font-mono">
                {currentUser.groupId || currentUser.role}
              </span>
            </div>
          )}

          {onLogout && (
            <button
              id="sidebar-btn-logout"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-200 hover:text-white border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar (Logout)</span>
            </button>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="font-semibold text-white">Versi Apps Script</span>
            <span className="text-emerald-400 font-mono text-[10px]">v3.2 Production</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Google Sheets as Primary Database
          </p>
        </div>
      </aside>
    </>
  );
};
