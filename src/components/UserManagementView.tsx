import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, Plus, Edit2, Trash2, CheckCircle2, 
  XCircle, Mail, User, Shield, Key, Eye, EyeOff, Save, 
  RotateCcw, Copy, Check, Info, Lock, Unlock, AlertTriangle, 
  Users, Layers, GraduationCap, Compass, Search, Download, 
  Upload, BarChart3, Settings, History, Code, Map, 
  LayoutDashboard, ChevronRight, UserPlus, Filter, SlidersHorizontal
} from 'lucide-react';
import { UserItem, UserRole, GroupAkun, MenuPrivilege, AppMenuId, MenuActionKey } from '../types';
import { APP_MENU_DEFINITIONS, getEffectivePrivilege, DEFAULT_GROUPS } from '../data/privilegeData';
import { 
  getGroups, saveGroup, deleteGroup, saveAllGroupPrivileges, 
  resetPrivilegesToDefaults, saveUser, writeLog 
} from '../services/storageService';
import { MenuManagementView } from './MenuManagementView';

interface UserManagementViewProps {
  users: UserItem[];
  currentUser: UserItem;
  groups?: GroupAkun[];
  initialSubTab?: 'matrix' | 'groups' | 'users' | 'menus';
  onSaveUser: (user: UserItem) => void;
  onDeleteUser: (userId: string) => void;
  onSaveGroup?: (group: GroupAkun) => void;
  onDeleteGroup?: (groupId: string) => void;
  onSaveGroupPrivileges?: (groupId: string, privileges: Record<string, MenuPrivilege>) => void;
  onResetPrivileges?: () => void;
  onRefreshData?: () => void;
}

// Map Menu ID to Icon
const MENU_ICONS: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  map_dashboard: Map,
  kategori: Layers,
  program: GraduationCap,
  pic: User,
  peserta: Users,
  tambah: UserPlus,
  eduventure: Compass,
  search: Search,
  statistik: BarChart3,
  export: Download,
  import: Upload,
  user: ShieldCheck,
  log: History,
  setting: Settings,
  gas_code: Code,
};

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  currentUser,
  groups: propGroups,
  initialSubTab,
  onSaveUser,
  onDeleteUser,
  onSaveGroup,
  onDeleteGroup,
  onSaveGroupPrivileges,
  onResetPrivileges,
  onRefreshData,
}) => {
  // Active Management Tab
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'groups' | 'users' | 'menus'>(initialSubTab || 'matrix');

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Groups State
  const [groups, setGroups] = useState<GroupAkun[]>(propGroups || getGroups());
  const [selectedGroupId, setSelectedGroupId] = useState<string>('OPERATOR');

  // Matrix Edit State (Privileges per Group)
  const [matrixState, setMatrixState] = useState<Record<string, Record<string, MenuPrivilege>>>(() => {
    const initialGroups = propGroups || getGroups();
    const map: Record<string, Record<string, MenuPrivilege>> = {};
    initialGroups.forEach(g => {
      map[g.id] = JSON.parse(JSON.stringify(g.privileges));
    });
    return map;
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // User Add/Edit Modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editUserItem, setEditUserItem] = useState<UserItem | null>(null);
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormNama, setUserFormNama] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [userFormGroupId, setUserFormGroupId] = useState<string>('OPERATOR');
  const [userFormStatusAktif, setUserFormStatusAktif] = useState<'Ya' | 'Tidak'>('Ya');

  // Group Add/Edit Modal
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editGroupItem, setEditGroupItem] = useState<GroupAkun | null>(null);
  const [groupFormId, setGroupFormId] = useState('');
  const [groupFormNama, setGroupFormNama] = useState('');
  const [groupFormDeskripsi, setGroupFormDeskripsi] = useState('');
  const [groupFormColor, setGroupFormColor] = useState('blue');
  const [groupFormTemplate, setGroupFormTemplate] = useState('OPERATOR');

  // User Privilege Inspector Modal
  const [inspectUser, setInspectUser] = useState<UserItem | null>(null);

  // Filter for User Tab
  const [userSearchKeyword, setUserSearchKeyword] = useState('');
  const [userFilterGroup, setUserFilterGroup] = useState<string>('ALL');

  const refreshGroups = () => {
    const updated = getGroups();
    setGroups(updated);
    const map: Record<string, Record<string, MenuPrivilege>> = {};
    updated.forEach(g => {
      map[g.id] = JSON.parse(JSON.stringify(g.privileges));
    });
    setMatrixState(map);
    setHasUnsavedChanges(false);
    if (onRefreshData) onRefreshData();
  };

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Currently selected group in Matrix
  const activeGroup = useMemo(() => {
    return groups.find(g => g.id === selectedGroupId) || groups[0];
  }, [groups, selectedGroupId]);

  // Current privileges for selected group in Matrix editor
  const currentGroupPrivileges = useMemo(() => {
    if (matrixState[selectedGroupId]) {
      return matrixState[selectedGroupId];
    }
    return activeGroup?.privileges || {};
  }, [matrixState, selectedGroupId, activeGroup]);

  // Group users count
  const groupUserCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    groups.forEach(g => { counts[g.id] = 0; });
    users.forEach(u => {
      const gid = u.groupId || u.role;
      counts[gid] = (counts[gid] || 0) + 1;
    });
    return counts;
  }, [groups, users]);

  // Allowed menus count for active group
  const activeGroupAllowedMenuCount = useMemo(() => {
    let count = 0;
    APP_MENU_DEFINITIONS.forEach(m => {
      if (currentGroupPrivileges[m.id]?.canAccess) {
        count++;
      }
    });
    return count;
  }, [currentGroupPrivileges]);

  // Matrix Privilege Toggles
  const handleToggleAction = (menuId: AppMenuId, action: MenuActionKey) => {
    setMatrixState(prev => {
      const groupPrivs = { ...(prev[selectedGroupId] || {}) };
      const currentPriv = groupPrivs[menuId] || {
        canAccess: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canExport: false
      };

      const nextVal = !currentPriv[action];
      const updatedPriv: MenuPrivilege = { ...currentPriv, [action]: nextVal };

      // If disabling canAccess, disable all other actions
      if (action === 'canAccess' && !nextVal) {
        updatedPriv.canCreate = false;
        updatedPriv.canEdit = false;
        updatedPriv.canDelete = false;
        updatedPriv.canExport = false;
      }
      // If enabling any sub-action, ensure canAccess is also enabled
      if (action !== 'canAccess' && nextVal) {
        updatedPriv.canAccess = true;
      }

      groupPrivs[menuId] = updatedPriv;
      setHasUnsavedChanges(true);
      return { ...prev, [selectedGroupId]: groupPrivs };
    });
  };

  // Quick Preset Actions
  const handleApplyPreset = (preset: 'ALL' | 'VIEW_ONLY' | 'RESET_DEFAULT') => {
    if (preset === 'ALL') {
      const newPrivs: Record<string, MenuPrivilege> = {};
      APP_MENU_DEFINITIONS.forEach(m => {
        newPrivs[m.id] = {
          canAccess: true,
          canCreate: m.supportedActions.canCreate,
          canEdit: m.supportedActions.canEdit,
          canDelete: m.supportedActions.canDelete,
          canExport: m.supportedActions.canExport,
        };
      });
      setMatrixState(prev => ({ ...prev, [selectedGroupId]: newPrivs }));
      setHasUnsavedChanges(true);
      showNotification(`Preset "Beri Semua Hak Akses" diterapkan untuk ${activeGroup.namaGroup}`);
    } else if (preset === 'VIEW_ONLY') {
      const newPrivs: Record<string, MenuPrivilege> = {};
      APP_MENU_DEFINITIONS.forEach(m => {
        newPrivs[m.id] = {
          canAccess: true,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canExport: m.supportedActions.canExport,
        };
      });
      setMatrixState(prev => ({ ...prev, [selectedGroupId]: newPrivs }));
      setHasUnsavedChanges(true);
      showNotification(`Preset "Hanya Baca (View Only)" diterapkan untuk ${activeGroup.namaGroup}`);
    } else if (preset === 'RESET_DEFAULT') {
      const originalGroup = getGroups().find(g => g.id === selectedGroupId);
      if (originalGroup) {
        setMatrixState(prev => ({ ...prev, [selectedGroupId]: JSON.parse(JSON.stringify(originalGroup.privileges)) }));
        setHasUnsavedChanges(false);
        showNotification(`Hak akses ${activeGroup.namaGroup} dikembalikan ke konfigurasi tersimpan`);
      }
    }
  };

  // Save Matrix Privileges
  const handleSaveMatrix = () => {
    const privsToSave = matrixState[selectedGroupId];
    if (!privsToSave) return;

    if (onSaveGroupPrivileges) {
      onSaveGroupPrivileges(selectedGroupId, privsToSave);
    } else {
      saveAllGroupPrivileges(selectedGroupId, privsToSave);
    }

    refreshGroups();
    showNotification(`Matriks hak akses untuk group "${activeGroup.namaGroup}" berhasil disimpan!`);
  };

  // User Handlers
  const handleOpenAddUser = () => {
    setEditUserItem(null);
    setUserFormEmail('');
    setUserFormNama('');
    setUserFormPassword('unpad123');
    setUserFormGroupId('OPERATOR');
    setUserFormStatusAktif('Ya');
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (u: UserItem) => {
    setEditUserItem(u);
    setUserFormEmail(u.email);
    setUserFormNama(u.nama);
    setUserFormPassword(u.password || 'unpad123');
    setUserFormGroupId(u.groupId || u.role);
    setUserFormStatusAktif(u.statusAktif === 'Ya' || u.status === 'Aktif' ? 'Ya' : 'Tidak');
    setUserModalOpen(true);
  };

  const handleSaveUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormEmail.trim() || !userFormNama.trim()) return;

    const targetGroup = groups.find(g => g.id === userFormGroupId);
    const roleMapping: UserRole = userFormGroupId === 'ADMIN' 
      ? 'ADMIN' 
      : userFormGroupId === 'VIEWER' 
        ? 'VIEWER' 
        : 'OPERATOR';

    const payload: UserItem = {
      userId: editUserItem ? editUserItem.userId : 'USR-' + String(users.length + 1).padStart(3, '0'),
      email: userFormEmail.trim(),
      nama: userFormNama.trim(),
      password: userFormPassword.trim() || editUserItem?.password || 'unpad123',
      role: roleMapping,
      groupId: userFormGroupId,
      namaGroup: targetGroup?.namaGroup || userFormGroupId,
      status: userFormStatusAktif === 'Ya' ? 'Aktif' : 'Nonaktif',
      statusAktif: userFormStatusAktif,
      lastLogin: editUserItem?.lastLogin || 'Belum Login'
    };

    onSaveUser(payload);
    setUserModalOpen(false);
    showNotification(`Data pengguna ${payload.nama} berhasil disimpan dengan Group "${payload.namaGroup}"!`);
  };

  const handleQuickAssignGroup = (user: UserItem, newGroupId: string) => {
    const targetGroup = groups.find(g => g.id === newGroupId);
    const roleMapping: UserRole = newGroupId === 'ADMIN' 
      ? 'ADMIN' 
      : newGroupId === 'VIEWER' 
        ? 'VIEWER' 
        : 'OPERATOR';

    const updatedUser: UserItem = {
      ...user,
      groupId: newGroupId,
      role: roleMapping,
      namaGroup: targetGroup?.namaGroup || newGroupId
    };

    saveUser(updatedUser);
    onSaveUser(updatedUser);
    showNotification(`Group akun ${user.nama} berhasil diubah ke "${updatedUser.namaGroup}"`);
  };

  // Group Handlers
  const handleOpenAddGroup = () => {
    setEditGroupItem(null);
    setGroupFormId('');
    setGroupFormNama('');
    setGroupFormDeskripsi('');
    setGroupFormColor('blue');
    setGroupFormTemplate('OPERATOR');
    setGroupModalOpen(true);
  };

  const handleOpenEditGroup = (g: GroupAkun) => {
    setEditGroupItem(g);
    setGroupFormId(g.id);
    setGroupFormNama(g.namaGroup);
    setGroupFormDeskripsi(g.deskripsi);
    setGroupFormColor('blue');
    setGroupModalOpen(true);
  };

  const handleSaveGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupFormNama.trim()) return;

    const idFormatted = editGroupItem ? editGroupItem.id : (groupFormId.trim().toUpperCase().replace(/\s+/g, '_') || `GRP_${Date.now().toString().slice(-4)}`);

    // Template privileges
    let initialPrivileges: Record<string, MenuPrivilege>;
    if (editGroupItem?.privileges) {
      initialPrivileges = editGroupItem.privileges;
    } else {
      const templateGroup = groups.find(g => g.id === groupFormTemplate) || groups[0] || DEFAULT_GROUPS[0];
      initialPrivileges = JSON.parse(JSON.stringify(templateGroup.privileges));
    }

    const badgeColors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      emerald: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      amber: 'bg-amber-100 text-amber-800 border-amber-300',
      purple: 'bg-purple-100 text-purple-800 border-purple-300',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      rose: 'bg-rose-100 text-rose-800 border-rose-300',
      slate: 'bg-slate-100 text-slate-800 border-slate-300',
    };

    const newGroupPayload: GroupAkun = {
      id: idFormatted,
      namaGroup: groupFormNama.trim(),
      deskripsi: groupFormDeskripsi.trim() || 'Kelompok akses pengguna aplikasi non-gelar Unpad.',
      warnaBadge: badgeColors[groupFormColor] || badgeColors.blue,
      isSystem: editGroupItem ? editGroupItem.isSystem : false,
      privileges: initialPrivileges,
    };

    if (onSaveGroup) {
      onSaveGroup(newGroupPayload);
    } else {
      saveGroup(newGroupPayload);
    }

    refreshGroups();
    setSelectedGroupId(idFormatted);
    setGroupModalOpen(false);
    showNotification(`Group akun "${newGroupPayload.namaGroup}" berhasil disimpan!`);
  };

  const handleDeleteGroupClick = (g: GroupAkun) => {
    if (g.isSystem) {
      alert(`Group sistem "${g.namaGroup}" tidak dapat dihapus.`);
      return;
    }
    const count = groupUserCounts[g.id] || 0;
    if (count > 0) {
      alert(`Group "${g.namaGroup}" masih digunakan oleh ${count} pengguna. Pindahkan pengguna ke group lain terlebih dahulu.`);
      return;
    }
    if (confirm(`Yakin ingin menghapus group akun "${g.namaGroup}"?`)) {
      if (onDeleteGroup) {
        onDeleteGroup(g.id);
      } else {
        deleteGroup(g.id);
      }
      refreshGroups();
      setSelectedGroupId('OPERATOR');
      showNotification(`Group akun "${g.namaGroup}" berhasil dihapus.`);
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchKw = !userSearchKeyword || 
        u.nama.toLowerCase().includes(userSearchKeyword.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchKeyword.toLowerCase()) ||
        u.userId.toLowerCase().includes(userSearchKeyword.toLowerCase());
      
      const userGid = u.groupId || u.role;
      const matchGrp = userFilterGroup === 'ALL' || userGid === userFilterGroup;

      return matchKw && matchGrp;
    });
  }, [users, userSearchKeyword, userFilterGroup]);

  // Group Modules by Category
  const menuCategories = useMemo(() => {
    const cats: Record<string, typeof APP_MENU_DEFINITIONS> = {
      'Dashboard & Peta': [],
      'Master Data Program': [],
      'Operasional & Peserta': [],
      'Laporan & Analitik': [],
      'Administrasi Sistem': []
    };

    APP_MENU_DEFINITIONS.forEach(m => {
      if (cats[m.kategoriModul]) {
        cats[m.kategoriModul].push(m);
      }
    });

    return cats;
  }, []);

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#002B66] text-white border-2 border-[#FDB913] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-[#FDB913] shrink-0" />
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#002B66] text-[#FDB913] flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#002B66] tracking-tight">
                User Privilege & Group Akun
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Pengaturan hak akses bertingkat, relasi Group Akun, dan otorisasi menu aplikasi SIMPENDIK Unpad
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs w-full md:w-auto justify-end">
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-500">Pengguna:</span>
            <span className="font-bold text-[#002B66]">{users.length}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-slate-500">Group:</span>
            <span className="font-bold text-[#002B66]">{groups.length}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-500">Menu:</span>
            <span className="font-bold text-[#002B66]">{APP_MENU_DEFINITIONS.length}</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 bg-white px-3 pt-2 rounded-t-xl">
        <button
          type="button"
          onClick={() => setActiveSubTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'matrix'
              ? 'border-[#002B66] text-[#002B66] bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Matriks Hak Akses (Privilege Matrix)</span>
          {hasUnsavedChanges && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Ada perubahan belum tersimpan" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('groups')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'groups'
              ? 'border-[#002B66] text-[#002B66] bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4 text-amber-600" />
          <span>Kelola Group Akun ({groups.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'users'
              ? 'border-[#002B66] text-[#002B66] bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-600" />
          <span>Daftar Pengguna & Penugasan ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('menus')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'menus'
              ? 'border-[#002B66] text-[#002B66] bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-purple-600" />
          <span>Pengaturan Menu & Relasi</span>
        </button>
      </div>

      {/* TAB 1: MATRIKS PRIVILEGE */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-4">
          {/* Group Selector Pills */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#002B66]" />
                Pilih Group Akun:
              </span>
              {groups.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGroupId(g.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedGroupId === g.id
                      ? 'bg-[#002B66] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{g.namaGroup}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedGroupId === g.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {groupUserCounts[g.id] || 0} user
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleOpenAddGroup}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#002B66] rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#002B66]" />
              <span>Tambah Group</span>
            </button>
          </div>

          {/* Group Header Info Banner & Preset Actions */}
          <div className="bg-linear-to-r from-blue-50/70 to-slate-50 p-4 rounded-xl border border-blue-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="font-black text-[#002B66] text-base">
                  {activeGroup.namaGroup}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold border border-blue-200">
                  ID: {activeGroup.id}
                </span>
                {activeGroup.isSystem && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    Group Sistem Default
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeGroup.deskripsi}
              </p>
              <div className="text-[11px] font-medium text-slate-500 pt-0.5 flex items-center gap-3">
                <span>Total Akses Menu: <strong className="text-blue-700">{activeGroupAllowedMenuCount} dari {APP_MENU_DEFINITIONS.length} Menu</strong></span>
                <span>•</span>
                <span>Anggota: <strong className="text-[#002B66]">{groupUserCounts[activeGroup.id] || 0} Pengguna</strong></span>
              </div>
            </div>

            {/* Quick Actions & Presets */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleApplyPreset('ALL')}
                className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Aktifkan seluruh menu dan aksi"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Beri Semua Akses</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('VIEW_ONLY')}
                className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Hanya izinkan melihat dan export, tanpa hak create/edit/delete"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Hanya Baca</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('RESET_DEFAULT')}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Kembalikan ke konfigurasi awal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#002B66]" />
                <span className="font-bold text-slate-800">
                  Matriks Izin Aksi per Menu ({activeGroup.namaGroup})
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Diizinkan
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-slate-200 inline-block" /> Dibatasi / Nonaktif
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#002B66] text-white font-bold">
                  <tr>
                    <th className="p-3.5 w-72">Menu Aplikasi & Modul</th>
                    <th className="p-3.5 text-center w-28">
                      <span className="block font-bold">Akses Menu</span>
                      <span className="text-[10px] font-normal text-blue-200">(Buka / Lihat)</span>
                    </th>
                    <th className="p-3.5 text-center w-24">
                      <span className="block font-bold">Tambah</span>
                      <span className="text-[10px] font-normal text-blue-200">(Create)</span>
                    </th>
                    <th className="p-3.5 text-center w-24">
                      <span className="block font-bold">Ubah</span>
                      <span className="text-[10px] font-normal text-blue-200">(Edit)</span>
                    </th>
                    <th className="p-3.5 text-center w-24">
                      <span className="block font-bold">Hapus</span>
                      <span className="text-[10px] font-normal text-blue-200">(Delete)</span>
                    </th>
                    <th className="p-3.5 text-center w-24">
                      <span className="block font-bold">Export</span>
                      <span className="text-[10px] font-normal text-blue-200">(CSV/Excel)</span>
                    </th>
                    <th className="p-3.5 text-center w-32">Status Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {Object.entries(menuCategories).map(([catName, menuItems]) => (
                    <React.Fragment key={catName}>
                      {/* Category Header Row */}
                      <tr className="bg-slate-100/80 font-bold text-[#002B66] text-[11px] uppercase tracking-wider">
                        <td colSpan={7} className="px-4 py-2 bg-slate-100 border-y border-slate-200">
                          {catName}
                        </td>
                      </tr>

                      {menuItems.map(menu => {
                        const MenuIcon = MENU_ICONS[menu.id] || Layers;
                        const priv = currentGroupPrivileges[menu.id] || {
                          canAccess: false,
                          canCreate: false,
                          canEdit: false,
                          canDelete: false,
                          canExport: false
                        };

                        const isAccessEnabled = Boolean(priv.canAccess);

                        // Calculate status badge
                        let statusText = 'Nonaktif';
                        let statusBadge = 'bg-slate-100 text-slate-500 border-slate-200';

                        if (isAccessEnabled) {
                          if (priv.canCreate && priv.canEdit && priv.canDelete) {
                            statusText = 'Full Access';
                            statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
                          } else if (priv.canCreate || priv.canEdit) {
                            statusText = 'Akses Edit';
                            statusBadge = 'bg-blue-50 text-blue-700 border-blue-200 font-bold';
                          } else {
                            statusText = 'Hanya Baca';
                            statusBadge = 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
                          }
                        }

                        return (
                          <tr 
                            key={menu.id} 
                            className={`transition-colors ${
                              isAccessEnabled ? 'hover:bg-slate-50/80' : 'bg-slate-50/40 text-slate-400'
                            }`}
                          >
                            {/* Menu Info */}
                            <td className="p-3.5">
                              <div className="flex items-start gap-2.5">
                                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                  isAccessEnabled ? 'bg-blue-50 text-[#002B66]' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  <MenuIcon className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <span>{menu.label}</span>
                                    <span className="text-[9px] font-mono text-slate-400 font-normal">
                                      #{menu.id}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 line-clamp-1 leading-tight mt-0.5">
                                    {menu.deskripsi}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* canAccess Toggle */}
                            <td className="p-3.5 text-center">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={priv.canAccess}
                                  onChange={() => handleToggleAction(menu.id, 'canAccess')}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#002B66]"></div>
                              </label>
                            </td>

                            {/* canCreate Checkbox */}
                            <td className="p-3.5 text-center">
                              {menu.supportedActions.canCreate ? (
                                <input
                                  type="checkbox"
                                  disabled={!isAccessEnabled}
                                  checked={priv.canCreate}
                                  onChange={() => handleToggleAction(menu.id, 'canCreate')}
                                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 disabled:opacity-30 cursor-pointer"
                                />
                              ) : (
                                <span className="text-[11px] text-slate-300 font-mono">-</span>
                              )}
                            </td>

                            {/* canEdit Checkbox */}
                            <td className="p-3.5 text-center">
                              {menu.supportedActions.canEdit ? (
                                <input
                                  type="checkbox"
                                  disabled={!isAccessEnabled}
                                  checked={priv.canEdit}
                                  onChange={() => handleToggleAction(menu.id, 'canEdit')}
                                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 disabled:opacity-30 cursor-pointer"
                                />
                              ) : (
                                <span className="text-[11px] text-slate-300 font-mono">-</span>
                              )}
                            </td>

                            {/* canDelete Checkbox */}
                            <td className="p-3.5 text-center">
                              {menu.supportedActions.canDelete ? (
                                <input
                                  type="checkbox"
                                  disabled={!isAccessEnabled}
                                  checked={priv.canDelete}
                                  onChange={() => handleToggleAction(menu.id, 'canDelete')}
                                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 disabled:opacity-30 cursor-pointer"
                                />
                              ) : (
                                <span className="text-[11px] text-slate-300 font-mono">-</span>
                              )}
                            </td>

                            {/* canExport Checkbox */}
                            <td className="p-3.5 text-center">
                              {menu.supportedActions.canExport ? (
                                <input
                                  type="checkbox"
                                  disabled={!isAccessEnabled}
                                  checked={priv.canExport}
                                  onChange={() => handleToggleAction(menu.id, 'canExport')}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 disabled:opacity-30 cursor-pointer"
                                />
                              ) : (
                                <span className="text-[11px] text-slate-300 font-mono">-</span>
                              )}
                            </td>

                            {/* Status Level Badge */}
                            <td className="p-3.5 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border ${statusBadge}`}>
                                {statusText}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Save Action Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600" />
                <span>
                  Perubahan hak akses akan langsung berdampak pada seluruh pengguna dengan Group <strong>{activeGroup.namaGroup}</strong>.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('RESET_DEFAULT')}
                  disabled={!hasUnsavedChanges}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleSaveMatrix}
                  className="flex items-center gap-2 px-5 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4 text-[#FDB913]" />
                  <span>Simpan Perubahan Matriks Hak Akses</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KELOLA GROUP AKUN */}
      {activeSubTab === 'groups' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-[#002B66]">Kelompok Hak Akses (Group Akun)</h2>
              <p className="text-xs text-slate-500">
                Kelola kategori akun pengguna, deskripsi wewenang, dan template hak akses aplikasi
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddGroup}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4 text-[#FDB913]" />
              <span>Tambah Group Akun Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map(g => {
              const count = groupUserCounts[g.id] || 0;
              let allowedCount = 0;
              APP_MENU_DEFINITIONS.forEach(m => {
                if (g.privileges[m.id]?.canAccess) allowedCount++;
              });

              return (
                <div 
                  key={g.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${g.warnaBadge}`}>
                        {g.namaGroup}
                      </span>
                      {g.isSystem ? (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          Sistem
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          Kustom
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 mb-2">
                      ID: {g.id}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                      {g.deskripsi}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <strong>{count}</strong> pengguna
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <strong>{allowedCount} / {APP_MENU_DEFINITIONS.length}</strong> menu
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGroupId(g.id);
                          setActiveSubTab('matrix');
                        }}
                        className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-[#002B66] rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                        <span>Atur Privilege</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditGroup(g)}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit Nama / Deskripsi"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {!g.isSystem && (
                        <button
                          type="button"
                          onClick={() => handleDeleteGroupClick(g)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Group"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DAFTAR PENGGUNA & PENUGASAN GROUP */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          {/* Filter & Add Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, email, atau ID user..."
                  value={userSearchKeyword}
                  onChange={(e) => setUserSearchKeyword(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none"
                />
              </div>

              <select
                value={userFilterGroup}
                onChange={(e) => setUserFilterGroup(e.target.value)}
                className="py-1.5 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700 outline-none"
              >
                <option value="ALL">Semua Group Akun</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.namaGroup}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenAddUser}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <UserPlus className="w-4 h-4 text-[#FDB913]" />
              <span>Tambah Pengguna Baru</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#002B66] text-white font-bold">
                  <tr>
                    <th className="p-3 w-16">ID User</th>
                    <th className="p-3">Nama Pengguna</th>
                    <th className="p-3">Email Unpad</th>
                    <th className="p-3 w-56">Group Akun (Role)</th>
                    <th className="p-3 text-center w-24">Status</th>
                    <th className="p-3">Login Terakhir</th>
                    <th className="p-3 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Tidak ada data pengguna yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const userGroupId = u.groupId || u.role;
                      const userGroup = groups.find(g => g.id === userGroupId);

                      return (
                        <tr key={u.userId} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono font-bold text-[#002B66]">{u.userId}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{u.nama}</div>
                            {u.userId === currentUser.userId && (
                              <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                                Akun Anda (Aktif)
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600 font-mono text-[11px]">{u.email}</td>
                          <td className="p-3">
                            {/* Fast Group Switch Dropdown */}
                            <select
                              value={userGroupId}
                              onChange={(e) => handleQuickAssignGroup(u, e.target.value)}
                              className="w-full p-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-800 focus:ring-1 focus:ring-[#002B66] outline-none cursor-pointer"
                            >
                              {groups.map(g => (
                                <option key={g.id} value={g.id}>
                                  {g.namaGroup}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3 text-center">
                            {(() => {
                              const isActive = u.statusAktif === 'Ya' || u.status === 'Aktif';
                              return (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isActive 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                    : 'bg-slate-100 text-slate-400'
                                }`}>
                                  {isActive ? 'Aktif' : 'Non-Aktif'}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="p-3 text-slate-400 font-mono text-[11px]">
                            {u.lastLogin || '-'}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Inspect Privilege Button */}
                              <button
                                type="button"
                                onClick={() => setInspectUser(u)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                title="Lihat Matriks Hak Akses User Ini"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditUser(u)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                                title="Edit Data Pengguna"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {u.userId !== currentUser.userId && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteUser(u.userId)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                                  title="Hapus Pengguna"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
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

      {/* TAB 4: PENGATURAN MENU & RELASI GROUP / USER */}
      {activeSubTab === 'menus' && (
        <MenuManagementView
          groups={groups}
          users={users}
          currentUser={currentUser}
          onRefreshData={() => {
            refreshGroups();
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

      {/* MODAL 1: ADD / EDIT USER */}
      {userModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-[#002B66] mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#FDB913]" />
              <span>{editUserItem ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}</span>
            </h2>

            <form onSubmit={handleSaveUserSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dr. Budi Santoso, M.Kom"
                  value={userFormNama}
                  onChange={(e) => setUserFormNama(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email Akun Google / Unpad <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="username@unpad.ac.id"
                  value={userFormEmail}
                  onChange={(e) => setUserFormEmail(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kata Sandi (Password) <span className="text-xs text-slate-400 font-normal">(Default: unpad123)</span>
                </label>
                <input
                  type="text"
                  placeholder="Masukkan kata sandi login..."
                  value={userFormPassword}
                  onChange={(e) => setUserFormPassword(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Group Akun & Privilege <span className="text-rose-500">*</span>
                </label>
                <select
                  value={userFormGroupId}
                  onChange={(e) => setUserFormGroupId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-semibold text-slate-800"
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.namaGroup} ({g.id})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Hak akses dan izin menu pengguna ini akan mengikuti konfigurasi privilege group terpilih.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Keaktifan Akun</label>
                <select
                  value={userFormStatusAktif}
                  onChange={(e) => setUserFormStatusAktif(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium"
                >
                  <option value="Ya">Aktif (Dapat Login)</option>
                  <option value="Tidak">Non-Aktif (Akses Ditangguhkan)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT GROUP */}
      {groupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-[#002B66] mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#FDB913]" />
              <span>{editGroupItem ? 'Edit Group Akun' : 'Tambah Group Akun Baru'}</span>
            </h2>

            <form onSubmit={handleSaveGroupSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Group Akun <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Staf Verifikator Sertifikat"
                  value={groupFormNama}
                  onChange={(e) => setGroupFormNama(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ID Kode Group (Singkat & Unik)
                </label>
                <input
                  type="text"
                  disabled={Boolean(editGroupItem)}
                  placeholder="Contoh: VERIFIKATOR_SERTIFIKAT"
                  value={groupFormId}
                  onChange={(e) => setGroupFormId(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-mono text-slate-700 uppercase disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Deskripsi Tanggung Jawab
                </label>
                <textarea
                  rows={2}
                  placeholder="Deskripsikan peran wewenang group akun ini..."
                  value={groupFormDeskripsi}
                  onChange={(e) => setGroupFormDeskripsi(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Warna Badge Visual</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'blue', label: 'Biru' },
                    { id: 'emerald', label: 'Hijau' },
                    { id: 'amber', label: 'Kuning' },
                    { id: 'purple', label: 'Ungu' },
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setGroupFormColor(c.id)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border cursor-pointer ${
                        groupFormColor === c.id
                          ? 'border-[#002B66] bg-blue-50 text-[#002B66]'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {!editGroupItem && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Salin Template Privilege Dari:
                  </label>
                  <select
                    value={groupFormTemplate}
                    onChange={(e) => setGroupFormTemplate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>
                        Salin Izin dari: {g.namaGroup}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGroupModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Simpan Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: USER PRIVILEGE INSPECTOR MODAL */}
      {inspectUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-[#002B66] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#FDB913]" />
                <div>
                  <h3 className="font-bold text-sm">Rincian Hak Akses Pengguna</h3>
                  <p className="text-[11px] text-blue-200">
                    {inspectUser.nama} ({inspectUser.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectUser(null)}
                className="text-white/70 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">Group Akun Terkait:</span>
                  <span className="font-bold text-[#002B66] text-sm">
                    {inspectUser.namaGroup || inspectUser.groupId || inspectUser.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGroupId(inspectUser.groupId || inspectUser.role);
                    setActiveSubTab('matrix');
                    setInspectUser(null);
                  }}
                  className="px-3 py-1.5 bg-[#002B66] text-white rounded-lg font-semibold text-[11px]"
                >
                  Sesuaikan di Matriks
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-2.5">Menu Aplikasi</th>
                      <th className="p-2.5 text-center">Buka</th>
                      <th className="p-2.5 text-center">Tambah</th>
                      <th className="p-2.5 text-center">Ubah</th>
                      <th className="p-2.5 text-center">Hapus</th>
                      <th className="p-2.5 text-center">Export</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {APP_MENU_DEFINITIONS.map(m => {
                      const priv = getEffectivePrivilege(inspectUser, groups, m.id);
                      return (
                        <tr key={m.id} className={priv.canAccess ? 'bg-white' : 'bg-slate-50/50 text-slate-400'}>
                          <td className="p-2.5 font-medium">{m.label}</td>
                          <td className="p-2.5 text-center">
                            {priv.canAccess ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300">-</span>}
                          </td>
                          <td className="p-2.5 text-center">
                            {priv.canCreate ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300">-</span>}
                          </td>
                          <td className="p-2.5 text-center">
                            {priv.canEdit ? <span className="text-blue-600 font-bold">✓</span> : <span className="text-slate-300">-</span>}
                          </td>
                          <td className="p-2.5 text-center">
                            {priv.canDelete ? <span className="text-rose-600 font-bold">✓</span> : <span className="text-slate-300">-</span>}
                          </td>
                          <td className="p-2.5 text-center">
                            {priv.canExport ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300">-</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectUser(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
