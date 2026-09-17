import React from 'react';
import { 
  LayoutDashboard, Users, UserPlus, Layers, GraduationCap, 
  Search, FileSpreadsheet, Download, BarChart3, ShieldCheck, 
  History, Settings, Code, X, LogOut, Map
} from 'lucide-react';
import { UserRole } from '../types';
import { UnpadLogo } from './UnpadLogo';

export type ActiveTab = 
  | 'dashboard' 
  | 'map_dashboard'
  | 'peserta' 
  | 'tambah' 
  | 'kategori' 
  | 'program' 
  | 'search' 
  | 'import' 
  | 'export' 
  | 'statistik' 
  | 'user' 
  | 'log' 
  | 'setting' 
  | 'gas_code';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  userRole: UserRole;
  isOpen: boolean;
  onCloseMobile: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  isOpen,
  onCloseMobile,
  onLogout,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard, role: 'VIEWER' },
    { id: 'map_dashboard', label: 'Peta Sebaran (Map)', icon: Map, role: 'VIEWER' },
    { id: 'peserta', label: 'Data Peserta', icon: Users, role: 'VIEWER' },
    { id: 'tambah', label: 'Tambah Peserta', icon: UserPlus, role: 'OPERATOR' },
    { id: 'kategori', label: 'Kategori Program', icon: Layers, role: 'OPERATOR' },
    { id: 'program', label: 'Program', icon: GraduationCap, role: 'OPERATOR' },
    { id: 'search', label: 'Advanced Search', icon: Search, role: 'VIEWER' },
    { id: 'import', label: 'Import Data', icon: FileSpreadsheet, role: 'ADMIN' },
    { id: 'export', label: 'Export Data', icon: Download, role: 'OPERATOR' },
    { id: 'statistik', label: 'Statistik', icon: BarChart3, role: 'VIEWER' },
    { id: 'user', label: 'User Management', icon: ShieldCheck, role: 'ADMIN' },
    { id: 'log', label: 'Log Aktivitas', icon: History, role: 'OPERATOR' },
    { id: 'setting', label: 'Pengaturan', icon: Settings, role: 'ADMIN' },
    { id: 'gas_code', label: 'Script GAS & Setup', icon: Code, role: 'VIEWER' },
  ];

  const hasAccess = (itemRole: string) => {
    if (userRole === 'ADMIN') return true;
    if (userRole === 'OPERATOR') return itemRole === 'OPERATOR' || itemRole === 'VIEWER';
    if (userRole === 'VIEWER') return itemRole === 'VIEWER';
    return false;
  };

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
        className={`fixed lg:static top-0 left-0 bottom-0 w-64 bg-[#002B66] text-white flex flex-col z-50 transition-transform duration-200 ease-in-out ${
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
            className="lg:hidden text-white/70 hover:text-white p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Navigation Items */}
        <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1 custom-scrollbar">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu Utama
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const allowed = hasAccess(item.role);
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                onClick={() => {
                  if (allowed) {
                    onSelectTab(item.id as ActiveTab);
                    if (window.innerWidth < 1024) onCloseMobile();
                  }
                }}
                disabled={!allowed}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  !allowed 
                    ? 'opacity-40 cursor-not-allowed text-slate-400' 
                    : isActive
                      ? 'bg-[#FDB913] text-[#002B66] shadow-xs font-bold'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#002B66]' : 'text-slate-300'}`} />
                  <span>{item.label}</span>
                </div>
                {!allowed && (
                  <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-slate-300">
                    {item.role}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info & Logout */}
        <div className="p-3 border-t border-white/10 bg-[#002252] text-[11px] text-slate-300 space-y-2">
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
