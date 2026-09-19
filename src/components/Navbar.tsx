import React from 'react';
import { 
  Menu, Shield, Database, RefreshCw, FileCode, CheckCircle2, UserCheck, LogOut
} from 'lucide-react';
import { UserItem, UserRole, GroupAkun } from '../types';
import { UnpadLogo } from './UnpadLogo';

interface NavbarProps {
  currentUser: UserItem;
  groups?: GroupAkun[];
  onRoleChange: (role: UserRole) => void;
  onGroupChange?: (groupId: string) => void;
  onOpenGasModal: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  groups,
  onRoleChange,
  onGroupChange,
  onOpenGasModal,
  onToggleSidebar,
  onLogout,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Sub-header with Official Unpad Logo */}
        <div className="flex items-center gap-3">
          <button
            id="btn-toggle-sidebar"
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <UnpadLogo variant="color" size="xs" />
            <div className="hidden sm:flex items-center gap-1.5 border-l border-slate-200 pl-2.5">
              <span className="text-[11px] font-bold text-[#002B66] bg-[#002B66]/10 px-2 py-0.5 rounded">
                SIMPENDIK
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Direktorat Pendidikan Non Gelar
              </span>
            </div>
          </div>
        </div>

        {/* Right: Database Engine Status, Role/Group Switcher, Script Button, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Google Sheets Connection Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Sheets Database</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-0.5" />
          </div>

          {/* Quick GAS Source Code Button */}
          <button
            id="btn-navbar-gas-source"
            onClick={onOpenGasModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#002B66] hover:bg-[#083a7e] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            title="Lihat Source Code Google Apps Script (GAS)"
          >
            <FileCode className="w-3.5 h-3.5 text-[#FDB913]" />
            <span className="hidden sm:inline">Source Code GAS</span>
          </button>

          {/* Group / Role Switcher (Simulasi Hak Akses Berelasi Group Akun) */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <Shield className="w-3.5 h-3.5 text-slate-500 ml-1" />
            <span className="text-slate-500 hidden lg:inline">Group:</span>
            {groups && groups.length > 0 && onGroupChange ? (
              <select
                id="select-active-group"
                value={currentUser.groupId || currentUser.role}
                onChange={(e) => onGroupChange(e.target.value)}
                className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded px-2 py-0.5 focus:ring-1 focus:ring-[#002B66] outline-none cursor-pointer max-w-[150px] sm:max-w-[200px] truncate"
                title="Ganti simulasi Group Akun & Hak Akses"
              >
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.namaGroup}
                  </option>
                ))}
              </select>
            ) : (
              <select
                id="select-active-role"
                value={currentUser.role}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded px-2 py-0.5 focus:ring-1 focus:ring-[#002B66] outline-none cursor-pointer"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="OPERATOR">OPERATOR</option>
                <option value="VIEWER">VIEWER</option>
              </select>
            )}
          </div>

          {/* User Profile Avatar & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#002B66] text-[#FDB913] flex items-center justify-center font-bold text-xs shadow-xs border border-white">
                {currentUser.nama ? currentUser.nama.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                  {currentUser.nama || 'Dr. Nendar H.'}
                </div>
                <div className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">
                  {currentUser.namaGroup || currentUser.role}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              id="btn-navbar-logout"
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1 cursor-pointer"
              title="Keluar dari Aplikasi (Logout)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
