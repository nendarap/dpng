import React, { useState } from 'react';
import { 
  Menu, Shield, Database, RefreshCw, FileCode, CheckCircle2, 
  UserCheck, LogOut, User, Camera, Palette, ChevronDown, Sparkles, Key
} from 'lucide-react';
import { UserItem, UserRole, GroupAkun, AppThemeId } from '../types';
import { UnpadLogo } from './UnpadLogo';
import { UserProfileModal } from './UserProfileModal';

interface NavbarProps {
  currentUser: UserItem;
  groups?: GroupAkun[];
  onRoleChange: (role: UserRole) => void;
  onGroupChange?: (groupId: string) => void;
  onOpenGasModal: () => void;
  onOpenSheetModal?: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onLogout: () => void;
  currentTheme?: AppThemeId;
  onUpdateUser?: (updatedUser: UserItem) => void;
  onThemeChange?: (theme: AppThemeId) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  groups,
  onRoleChange,
  onGroupChange,
  onOpenGasModal,
  onOpenSheetModal,
  onToggleSidebar,
  onLogout,
  currentTheme = 'unpad-blue',
  onUpdateUser = () => {},
  onThemeChange = () => {},
}) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'info' | 'password' | 'photo' | 'theme'>('info');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Hanya Admin Utama yang dapat melihat Google Sheets Database, Source Code GAS, dan Pilihan Group
  const isAdmin = currentUser.role === 'ADMIN';

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="px-4 py-2.5 flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle & Sub-header with Official Unpad Logo */}
          <div className="flex items-center gap-3">
            <button
              id="btn-toggle-sidebar"
              onClick={onToggleSidebar}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none cursor-pointer"
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

          {/* Right: Actions & User Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 1. Live Google Sheets Connection Badge (HANYA UNTUK ADMIN UTAMA) */}
            {isAdmin && (
              <button
                id="btn-navbar-sheets-connect"
                type="button"
                onClick={onOpenSheetModal}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-700 text-xs font-semibold animate-in fade-in transition-all cursor-pointer shadow-2xs hover:shadow-xs group"
                title="Atur & Sinkronkan Penyimpanan ke Google Sheet"
              >
                <Database className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span>Google Sheets Database</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-0.5" />
              </button>
            )}

            {/* 2. Quick GAS Source Code Button (HANYA UNTUK ADMIN UTAMA) */}
            {isAdmin && (
              <button
                id="btn-navbar-gas-source"
                onClick={onOpenGasModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#002B66] hover:bg-[#083a7e] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer animate-in fade-in"
                title="Lihat Source Code Google Apps Script (GAS)"
              >
                <FileCode className="w-3.5 h-3.5 text-[#FDB913]" />
                <span className="hidden sm:inline">Source Code GAS</span>
              </button>
            )}

            {/* 3. Group / Role Switcher (HANYA UNTUK ADMIN UTAMA) */}
            {isAdmin && (
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs animate-in fade-in">
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
            )}

            {/* 4. User Profile Dropdown & Modal Trigger (Pojok Kanan Atas) */}
            <div className="relative pl-1 border-l border-slate-200">
              <button
                type="button"
                id="btn-user-profile-menu"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group"
                title="Buka Menu Profil, Foto, dan Tema"
              >
                {/* Photo / Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#002B66] text-[#FDB913] flex items-center justify-center font-bold text-xs shadow-xs border-2 border-white ring-1 ring-slate-200 shrink-0">
                  {currentUser.photoUrl ? (
                    <img 
                      src={currentUser.photoUrl} 
                      alt={currentUser.nama} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{currentUser.nama ? currentUser.nama.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                </div>

                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px] group-hover:text-[#002B66]">
                    {currentUser.nama || 'Dr. Nendar H.'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium truncate max-w-[130px] flex items-center gap-1">
                    <span>{currentUser.namaGroup || currentUser.role}</span>
                  </div>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform" />
              </button>

              {/* Popover Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-2">
                    {/* User Mini Card */}
                    <div className="p-3 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-xl border border-slate-100 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#002B66] text-[#FDB913] flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                          {currentUser.photoUrl ? (
                            <img 
                              src={currentUser.photoUrl} 
                              alt={currentUser.nama} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span>{currentUser.nama ? currentUser.nama.charAt(0).toUpperCase() : 'U'}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">{currentUser.nama}</div>
                          <div className="text-[10px] text-slate-500 truncate font-mono">{currentUser.email}</div>
                          <span className="inline-block mt-0.5 text-[9px] font-bold px-2 py-0.2 rounded-full bg-[#002B66] text-[#FDB913]">
                            {currentUser.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Menu Items */}
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileModalTab('info');
                          setIsDropdownOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                        className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#002B66] hover:bg-slate-50 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4 text-blue-600" />
                        <span>Informasi User & Profil</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileModalTab('password');
                          setIsDropdownOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                        className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#002B66] hover:bg-slate-50 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Key className="w-4 h-4 text-amber-500" />
                        <div className="flex items-center justify-between flex-1">
                          <span>Ubah Password Akun</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">
                            Keamanan
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileModalTab('photo');
                          setIsDropdownOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                        className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#002B66] hover:bg-slate-50 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-emerald-600" />
                        <span>Update Photo Profil</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileModalTab('theme');
                          setIsDropdownOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                        className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#002B66] hover:bg-slate-50 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Palette className="w-4 h-4 text-amber-500" />
                        <div className="flex items-center justify-between flex-1">
                          <span>Ganti Tema Aplikasi</span>
                          <span className="text-[10px] font-mono text-slate-400 capitalize">
                            {currentTheme.replace('unpad-', '')}
                          </span>
                        </div>
                      </button>
                    </div>

                    <div className="my-1 border-t border-slate-100" />

                    {/* Logout Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Direct Logout Icon Button */}
            <button
              id="btn-navbar-logout"
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Keluar dari Aplikasi (Logout)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* User Profile, Photo & Theme Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        currentTheme={currentTheme}
        initialTab={profileModalTab}
        onUpdateUser={onUpdateUser}
        onThemeChange={onThemeChange}
        onLogout={onLogout}
      />
    </>
  );
};
