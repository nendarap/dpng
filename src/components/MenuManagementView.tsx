import React, { useState, useMemo } from 'react';
import { 
  SlidersHorizontal, Plus, Edit3, Trash2, Check, X, ArrowUp, ArrowDown,
  LayoutDashboard, Map, Layers, GraduationCap, Users, UserPlus, Compass,
  Search, FileSpreadsheet, Download, BarChart3, ShieldCheck, History,
  Settings, Code, UserCheck, AlertCircle, RefreshCw, Eye, EyeOff,
  CheckCircle2, XCircle, Info, Filter, Link2, Shield, User as UserIcon,
  Sparkles, RotateCcw, Lock, Unlock, ChevronRight
} from 'lucide-react';
import { AppMenuItemDef, GroupAkun, UserItem, MenuPrivilege } from '../types';
import { 
  getAppMenus, saveAppMenu, deleteAppMenu, toggleMenuStatus, 
  updateMenuOrder, resetMenusToDefault, updateMenuGroupsAccess, 
  batchUpdateUserMenuOverrides, applyRolePresetToGroup,
  toggleGroupMenuAccess, resetUserPrivilegeOverrides,
  setUserMenuAccessOverride, updateUserMenuOverride
} from '../services/storageService';
import { getEffectivePrivilege, hasMenuAccess } from '../data/privilegeData';
import { MenuMatrixView } from './MenuMatrixView';
import { UserMenuSimulatorView } from './UserMenuSimulatorView';

const MENU_ICONS: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  map_dashboard: Map,
  kategori: Layers,
  program: GraduationCap,
  pic: UserCheck,
  peserta: Users,
  tambah: UserPlus,
  eduventure: Compass,
  search: Search,
  statistik: BarChart3,
  export: Download,
  import: FileSpreadsheet,
  user: ShieldCheck,
  menu_manage: SlidersHorizontal,
  log: History,
  setting: Settings,
  gas_code: Code,
};

const KATEGORI_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Dashboard & Peta': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'Master Data Program': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Operasional & Peserta': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Laporan & Analitik': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Administrasi Sistem': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

interface MenuManagementViewProps {
  groups: GroupAkun[];
  users: UserItem[];
  currentUser: UserItem;
  onRefreshData?: () => void;
}

export const MenuManagementView: React.FC<MenuManagementViewProps> = ({
  groups,
  users,
  currentUser,
  onRefreshData,
}) => {
  // Menu list state
  const [menus, setMenus] = useState<AppMenuItemDef[]>(() => getAppMenus());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal: Relation Management (Menu to Group and User)
  const [relationModalOpen, setRelationModalOpen] = useState(false);
  const [activeMenuForRelation, setActiveMenuForRelation] = useState<AppMenuItemDef | null>(null);
  const [relationSubTab, setRelationSubTab] = useState<'groups' | 'users'>('groups');

  // In-modal Group Privileges Draft
  const [draftGroupPrivileges, setDraftGroupPrivileges] = useState<Record<string, MenuPrivilege>>({});

  // In-modal User Overrides Draft (key: userId -> override or null for inherit)
  const [draftUserOverrides, setDraftUserOverrides] = useState<Record<string, Partial<MenuPrivilege> | null>>({});
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userGroupFilter, setUserGroupFilter] = useState('ALL');
  const [userOverrideFilter, setUserOverrideFilter] = useState<'ALL' | 'OVERRIDDEN' | 'ALLOWED'>('ALL');

  // Modal: Create / Edit Menu
  const [menuEditModalOpen, setMenuEditModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<AppMenuItemDef | null>(null);
  const [menuFormId, setMenuFormId] = useState('');
  const [menuFormLabel, setMenuFormLabel] = useState('');
  const [menuFormCategory, setMenuFormCategory] = useState('Administrasi Sistem');
  const [menuFormDeskripsi, setMenuFormDeskripsi] = useState('');
  const [menuFormUrutan, setMenuFormUrutan] = useState<number>(1);
  const [menuFormIcon, setMenuFormIcon] = useState('SlidersHorizontal');

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const refreshMenus = () => {
    const list = getAppMenus();
    setMenus(list);
    if (onRefreshData) onRefreshData();
  };

  // Filtered menus
  const filteredMenus = useMemo(() => {
    return menus.filter(m => {
      const matchSearch = 
        m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCat = selectedCategory === 'ALL' || m.kategoriModul === selectedCategory;
      const matchStatus = 
        statusFilter === 'ALL' ? true :
        statusFilter === 'ACTIVE' ? (m.aktif !== false) :
        (m.aktif === false);

      return matchSearch && matchCat && matchStatus;
    });
  }, [menus, searchQuery, selectedCategory, statusFilter]);

  // View Mode: 'list' (Daftar & Urutan), 'matrix' (Matriks Group/Role), 'user_simulator' (Per-User Override)
  const [viewMode, setViewMode] = useState<'list' | 'matrix' | 'user_simulator'>('list');
  const [selectedUserId, setSelectedUserId] = useState<string>(() => {
    const defaultNonAdmin = users.find(u => u.role !== 'ADMIN');
    return defaultNonAdmin ? defaultNonAdmin.userId : (users[0]?.userId || '');
  });

  // Handler: Terapkan template role bawaan ke Group Akun
  const handleApplyRolePreset = (
    groupId: string, 
    presetKey: 'ADMIN' | 'OPERATOR' | 'VIEWER' | 'KEUANGAN' | 'KOORDINATOR_PROGRAM'
  ) => {
    const res = applyRolePresetToGroup(groupId, presetKey);
    if (res.success) {
      showToast(res.message);
      if (onRefreshData) onRefreshData();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Handler: Toggle akses menu untuk group akun
  const handleToggleGroupMenu = (groupId: string, menuId: string, currentAllowed: boolean) => {
    const res = toggleGroupMenuAccess(groupId, menuId, !currentAllowed);
    if (res.success) {
      showToast(res.message);
      if (onRefreshData) onRefreshData();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Handler: Reset semua override khusus pengguna
  const handleResetUserOverrides = (userId: string) => {
    const target = users.find(u => u.userId === userId);
    const confirmReset = window.confirm(`Reset semua hak khusus pada pengguna "${target?.nama || userId}"? Akses menu akan 100% mengikuti Group Akun.`);
    if (!confirmReset) return;

    const res = resetUserPrivilegeOverrides(userId);
    if (res.success) {
      showToast(res.message);
      if (onRefreshData) onRefreshData();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Handler: Set langsung akses menu untuk pengguna
  const handleSetUserMenuAccess = (userId: string, menuId: string, canAccess: boolean) => {
    const res = setUserMenuAccessOverride(userId, menuId, canAccess);
    if (res.success) {
      showToast(res.message);
      if (onRefreshData) onRefreshData();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Handler: Hapus override menu tertentu untuk pengguna (kembali ikuti Group)
  const handleClearUserMenuOverride = (userId: string, menuId: string) => {
    const res = updateUserMenuOverride(userId, menuId, null);
    if (res.success) {
      showToast(`Hak akses menu "${menuId}" dikembalikan mengikuti Group Akun.`);
      if (onRefreshData) onRefreshData();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Statistics
  const totalMenus = menus.length;
  const activeMenusCount = menus.filter(m => m.aktif !== false).length;
  const inactiveMenusCount = totalMenus - activeMenusCount;
  const customMenusCount = menus.filter(m => m.isCustom).length;

  // Toggle global menu status (aktif/nonaktif)
  const handleToggleMenuStatus = (menu: AppMenuItemDef) => {
    const newStatus = !(menu.aktif !== false);
    const res = toggleMenuStatus(menu.id, newStatus);
    if (res.success) {
      showToast(res.message);
      refreshMenus();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Reorder menu
  const handleMoveMenu = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= menus.length) return;

    const newMenus = [...menus];
    const temp = newMenus[index];
    newMenus[index] = newMenus[targetIndex];
    newMenus[targetIndex] = temp;

    const ids = newMenus.map(m => m.id);
    const res = updateMenuOrder(ids);
    if (res.success) {
      showToast(res.message);
      refreshMenus();
    }
  };

  // Open Relation Modal (Menu -> Groups & Users)
  const handleOpenRelationModal = (menu: AppMenuItemDef) => {
    setActiveMenuForRelation(menu);
    setRelationSubTab('groups');

    // Populate group privileges draft for this menu
    const gMap: Record<string, MenuPrivilege> = {};
    groups.forEach(g => {
      if (g.privileges && g.privileges[menu.id]) {
        gMap[g.id] = { ...g.privileges[menu.id] };
      } else {
        gMap[g.id] = {
          canAccess: g.id === 'ADMIN',
          canCreate: g.id === 'ADMIN' && menu.supportedActions.canCreate,
          canEdit: g.id === 'ADMIN' && menu.supportedActions.canEdit,
          canDelete: g.id === 'ADMIN' && menu.supportedActions.canDelete,
          canExport: g.id === 'ADMIN' && menu.supportedActions.canExport,
        };
      }
    });
    setDraftGroupPrivileges(gMap);

    // Populate user overrides draft for this menu
    const uMap: Record<string, Partial<MenuPrivilege> | null> = {};
    users.forEach(u => {
      if (u.customPrivileges && u.customPrivileges[menu.id]) {
        uMap[u.userId] = { ...u.customPrivileges[menu.id] };
      } else {
        uMap[u.userId] = null; // Inherit from group
      }
    });
    setDraftUserOverrides(uMap);

    setRelationModalOpen(true);
  };

  // Save Relation Modal (Persist to Groups & Users)
  const handleSaveRelations = () => {
    if (!activeMenuForRelation) return;
    const menuId = activeMenuForRelation.id;

    // 1. Save Group Privileges
    const resGroup = updateMenuGroupsAccess(menuId, draftGroupPrivileges);

    // 2. Save User Overrides
    const resUsers = batchUpdateUserMenuOverrides(menuId, draftUserOverrides);

    if (resGroup.success && resUsers.success) {
      showToast(`Hubungan menu "${activeMenuForRelation.label}" ke Group Akun dan Pengguna berhasil disimpan!`);
      setRelationModalOpen(false);
      refreshMenus();
    } else {
      showToast('Terjadi kesalahan saat menyimpan hubungan menu.', 'error');
    }
  };

  // Quick Action in Relation Modal: Grant all groups access
  const handleGrantAllGroups = () => {
    if (!activeMenuForRelation) return;
    const updated: Record<string, MenuPrivilege> = {};
    groups.forEach(g => {
      updated[g.id] = {
        canAccess: true,
        canCreate: activeMenuForRelation.supportedActions.canCreate,
        canEdit: activeMenuForRelation.supportedActions.canEdit,
        canDelete: g.id === 'ADMIN' && activeMenuForRelation.supportedActions.canDelete,
        canExport: activeMenuForRelation.supportedActions.canExport,
      };
    });
    setDraftGroupPrivileges(updated);
    showToast('Seluruh Group Akun kini diberikan akses ke menu ini.');
  };

  // Quick Action in Relation Modal: Revoke all non-admin groups access
  const handleRevokeNonAdminGroups = () => {
    if (!activeMenuForRelation) return;
    const updated: Record<string, MenuPrivilege> = {};
    groups.forEach(g => {
      const isAdmin = g.id === 'ADMIN';
      updated[g.id] = {
        canAccess: isAdmin,
        canCreate: isAdmin && activeMenuForRelation.supportedActions.canCreate,
        canEdit: isAdmin && activeMenuForRelation.supportedActions.canEdit,
        canDelete: isAdmin && activeMenuForRelation.supportedActions.canDelete,
        canExport: isAdmin && activeMenuForRelation.supportedActions.canExport,
      };
    });
    setDraftGroupPrivileges(updated);
    showToast('Akses menu hanya diset untuk Group Administrator.');
  };

  // Open Edit / Create Menu Modal
  const handleOpenEditMenuModal = (menu?: AppMenuItemDef) => {
    if (menu) {
      setEditingMenu(menu);
      setMenuFormId(menu.id);
      setMenuFormLabel(menu.label);
      setMenuFormCategory(menu.kategoriModul);
      setMenuFormDeskripsi(menu.deskripsi);
      setMenuFormUrutan(menu.urutan || menus.length + 1);
      setMenuFormIcon(menu.iconName || 'SlidersHorizontal');
    } else {
      setEditingMenu(null);
      setMenuFormId(`custom_${Date.now().toString().slice(-4)}`);
      setMenuFormLabel('');
      setMenuFormCategory('Operasional & Peserta');
      setMenuFormDeskripsi('');
      setMenuFormUrutan(menus.length + 1);
      setMenuFormIcon('SlidersHorizontal');
    }
    setMenuEditModalOpen(true);
  };

  // Save Menu definition
  const handleSaveMenuDefinition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuFormLabel.trim()) {
      showToast('Label nama menu wajib diisi!', 'error');
      return;
    }

    const payload: AppMenuItemDef = {
      id: editingMenu ? editingMenu.id : menuFormId.trim().toLowerCase().replace(/\s+/g, '_'),
      label: menuFormLabel.trim(),
      kategoriModul: menuFormCategory,
      deskripsi: menuFormDeskripsi.trim() || `Modul ${menuFormLabel.trim()}`,
      urutan: Number(menuFormUrutan) || menus.length + 1,
      aktif: editingMenu ? (editingMenu.aktif !== false) : true,
      iconName: menuFormIcon,
      isCustom: editingMenu ? editingMenu.isCustom : true,
      supportedActions: editingMenu ? editingMenu.supportedActions : {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canExport: true
      }
    };

    const res = saveAppMenu(payload);
    if (res.success) {
      showToast(res.message);
      setMenuEditModalOpen(false);
      refreshMenus();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Delete Menu
  const handleDeleteMenu = (menu: AppMenuItemDef) => {
    if (!window.confirm(`Yakin ingin menghapus menu "${menu.label}"? Menu ini akan dibersihkan dari navigasi dan seluruh group/user.`)) {
      return;
    }
    const res = deleteAppMenu(menu.id);
    if (res.success) {
      showToast(res.message);
      refreshMenus();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Reset Menus to default
  const handleResetToDefault = () => {
    if (!window.confirm('Apakah Anda yakin ingin mengembalikan seluruh susunan menu ke standar awal Unpad? Konfigurasi menu kustom akan direset.')) {
      return;
    }
    resetMenusToDefault();
    showToast('Seluruh menu aplikasi berhasil dikembalikan ke standar Unpad.');
    refreshMenus();
  };

  // Filtered Users inside Relation Modal
  const modalFilteredUsers = useMemo(() => {
    if (!activeMenuForRelation) return [];
    return users.filter(u => {
      const matchSearch = 
        u.nama.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.userId.toLowerCase().includes(userSearchQuery.toLowerCase());

      const matchGroup = userGroupFilter === 'ALL' || (u.groupId || u.role) === userGroupFilter;

      const override = draftUserOverrides[u.userId];
      const isOverridden = override !== null && override !== undefined;
      
      // Calculate effective access in draft
      const groupPriv = draftGroupPrivileges[u.groupId || u.role] || { canAccess: false };
      const hasAccess = override?.canAccess !== undefined ? Boolean(override.canAccess) : Boolean(groupPriv.canAccess);

      const matchOverride = 
        userOverrideFilter === 'ALL' ? true :
        userOverrideFilter === 'OVERRIDDEN' ? isOverridden :
        hasAccess;

      return matchSearch && matchGroup && matchOverride;
    });
  }, [users, userSearchQuery, userGroupFilter, userOverrideFilter, draftUserOverrides, draftGroupPrivileges, activeMenuForRelation]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg border flex items-center gap-3 transition-all ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span className="text-sm font-medium">{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Quick Stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#002B66]/10 text-[#002B66]">
                <SlidersHorizontal className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#002B66]">Pengaturan Menu & Relasi Akses</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Kelola visibilitas, urutan, status menu aplikasi, dan hubungkan langsung hak akses ke Group Akun serta Pengguna.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="Kembalikan daftar menu ke standar awal Unpad"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Menu Default
            </button>
            <button
              onClick={() => handleOpenEditMenuModal()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#002B66] hover:bg-[#001E47] rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Menu Kustom
            </button>
          </div>
        </div>

        {/* Statistical Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
            <span className="text-xs font-medium text-slate-500">Total Menu Terdaftar</span>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">{totalMenus}</div>
          </div>
          <div className="bg-emerald-50 p-3.5 rounded-lg border border-emerald-200/80">
            <span className="text-xs font-medium text-emerald-700">Menu Aktif (Live Navigasi)</span>
            <div className="text-2xl font-bold text-emerald-800 mt-0.5">{activeMenusCount}</div>
          </div>
          <div className="bg-amber-50 p-3.5 rounded-lg border border-amber-200/80">
            <span className="text-xs font-medium text-amber-700">Menu Nonaktif (Disembunyikan)</span>
            <div className="text-2xl font-bold text-amber-800 mt-0.5">{inactiveMenusCount}</div>
          </div>
          <div className="bg-blue-50 p-3.5 rounded-lg border border-blue-200/80">
            <span className="text-xs font-medium text-blue-700">Group Akun Terhubung</span>
            <div className="text-2xl font-bold text-blue-800 mt-0.5">{groups.length} Group</div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex flex-wrap border-b border-slate-200 mt-6 pt-1 gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'list'
                ? 'border-[#002B66] text-[#002B66] bg-[#002B66]/5 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Daftar & Konfigurasi Menu</span>
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'matrix'
                ? 'border-[#002B66] text-[#002B66] bg-[#002B66]/5 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Matriks Menu per Group & Role</span>
          </button>
          <button
            onClick={() => setViewMode('user_simulator')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'user_simulator'
                ? 'border-[#002B66] text-[#002B66] bg-[#002B66]/5 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Pengaturan Akses Pengguna (Per-User)</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: DAFTAR & KONFIGURASI MENU */}
      {viewMode === 'list' && (
        <>
          {/* Filter & Search Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama menu, ID, atau deskripsi..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#002B66] focus:border-transparent"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')} 
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-500">Kategori:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="Dashboard & Peta">Dashboard & Peta</option>
              <option value="Master Data Program">Master Data Program</option>
              <option value="Operasional & Peserta">Operasional & Peserta</option>
              <option value="Laporan & Analitik">Laporan & Analitik</option>
              <option value="Administrasi Sistem">Administrasi Sistem</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center text-xs bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'ALL' ? 'bg-white text-[#002B66] shadow-xs' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'ACTIVE' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'INACTIVE' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Nonaktif
            </button>
          </div>
        </div>
      </div>

      {/* Menu List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 w-16 text-center">Urutan</th>
                <th className="py-3 px-4">Menu & Identitas</th>
                <th className="py-3 px-4">Kategori Modul</th>
                <th className="py-3 px-4 text-center">Status Navigasi</th>
                <th className="py-3 px-4">Hubungan Group Akun</th>
                <th className="py-3 px-4">Hak Khusus User</th>
                <th className="py-3 px-4 text-right">Aksi Konfigurasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMenus.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">Tidak ada menu yang sesuai dengan filter pencarian.</p>
                  </td>
                </tr>
              ) : (
                filteredMenus.map((menu, idx) => {
                  const IconComp = MENU_ICONS[menu.id] || SlidersHorizontal;
                  const catColor = KATEGORI_COLORS[menu.kategoriModul] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
                  const isAktif = menu.aktif !== false;

                  // Hitung group yang memiliki akses ke menu ini
                  const groupsWithAccess = groups.filter(g => g.privileges && g.privileges[menu.id]?.canAccess);
                  
                  // Hitung user yang memiliki custom override di menu ini
                  const usersWithOverride = users.filter(u => u.customPrivileges && u.customPrivileges[menu.id]);

                  return (
                    <tr 
                      key={menu.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${!isAktif ? 'bg-slate-50/50 opacity-75' : ''}`}
                    >
                      {/* Urutan & Reorder Buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-bold text-slate-500 w-5 text-center">{idx + 1}</span>
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => handleMoveMenu(idx, 'up')}
                              disabled={idx === 0}
                              className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${idx === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500'}`}
                              title="Pindahkan ke atas"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleMoveMenu(idx, 'down')}
                              disabled={idx === filteredMenus.length - 1}
                              className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${idx === filteredMenus.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500'}`}
                              title="Pindahkan ke bawah"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Menu Label & ID */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isAktif ? 'bg-[#002B66]/10 text-[#002B66]' : 'bg-slate-200 text-slate-400'}`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-sm">{menu.label}</span>
                              {menu.isCustom && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                                  Kustom
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                              id: <code className="text-slate-600 bg-slate-100 px-1 py-0.2 rounded">{menu.id}</code>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 max-w-sm line-clamp-1">
                              {menu.deskripsi}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Kategori Modul */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                          {menu.kategoriModul}
                        </span>
                      </td>

                      {/* Status Toggle (Live/Hidden) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleMenuStatus(menu)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                            isAktif
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                          title="Klik untuk mengubah status tampil menu di navigasi"
                        >
                          {isAktif ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {isAktif ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>

                      {/* Hubungan Group Akun */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-blue-600" />
                            <span className="font-semibold text-slate-700">
                              {groupsWithAccess.length} dari {groups.length} Group
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {groups.map(g => {
                              const hasAccess = g.privileges && g.privileges[menu.id]?.canAccess;
                              return (
                                <span
                                  key={g.id}
                                  title={`${g.namaGroup}: ${hasAccess ? 'Diberikan Akses' : 'Tidak Memiliki Akses'}`}
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
                                    hasAccess 
                                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                      : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                                  }`}
                                >
                                  {g.id}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </td>

                      {/* Hubungan User Pengguna (Custom Overrides) */}
                      <td className="py-3 px-4">
                        {usersWithOverride.length > 0 ? (
                          <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 w-fit">
                            <UserIcon className="w-3.5 h-3.5 text-amber-600" />
                            <span className="font-semibold">{usersWithOverride.length} User Khusus</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Mengikuti Group (Standar)
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Pengaturan Relasi Group & User */}
                          <button
                            onClick={() => handleOpenRelationModal(menu)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#002B66] hover:bg-[#001E47] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                            title="Hubungkan menu ini ke Group Akun dan Pengguna"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            Atur Relasi
                          </button>

                          {/* Tombol Edit */}
                          <button
                            onClick={() => handleOpenEditMenuModal(menu)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit identitas menu"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Tombol Hapus (jika kustom) */}
                          {menu.isCustom && (
                            <button
                              onClick={() => handleDeleteMenu(menu)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus menu kustom ini"
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
    </>
  )}

  {/* VIEW 2: MATRIKS HAK AKSES PER GROUP / ROLE */}
  {viewMode === 'matrix' && (
    <MenuMatrixView
      menus={menus}
      groups={groups}
      onToggleGroupMenu={handleToggleGroupMenu}
      onApplyRolePreset={handleApplyRolePreset}
    />
  )}

  {/* VIEW 3: PENGATURAN AKSES PENGGUNA (PER-USER OVERRIDE) */}
  {viewMode === 'user_simulator' && (
    <UserMenuSimulatorView
      menus={menus}
      groups={groups}
      users={users}
      selectedUserId={selectedUserId}
      onSelectUserId={setSelectedUserId}
      onSetUserMenuAccess={handleSetUserMenuAccess}
      onClearUserMenuOverride={handleClearUserMenuOverride}
      onResetUserOverrides={handleResetUserOverrides}
    />
  )}

      {/* ============================================================ */}
      {/* MODAL 1: PENGATURAN RELASI MENU KE GROUP DAN USER            */}
      {/* ============================================================ */}
      {relationModalOpen && activeMenuForRelation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-[#002B66] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-white/10 text-white">
                  <Link2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">Relasi Akses Menu: {activeMenuForRelation.label}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#FDB913] text-[#002B66] font-bold">
                      {activeMenuForRelation.id}
                    </span>
                  </div>
                  <p className="text-xs text-white/80 mt-0.5">
                    Hubungkan menu aplikasi ini secara terpusat ke Group Akun dan akun Pengguna individual.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRelationModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="bg-slate-100 px-6 pt-3 border-b border-slate-200 flex items-center gap-2">
              <button
                onClick={() => setRelationSubTab('groups')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-t border-x ${
                  relationSubTab === 'groups'
                    ? 'bg-white text-[#002B66] border-slate-200 -mb-px'
                    : 'text-slate-600 hover:text-slate-900 border-transparent'
                }`}
              >
                <Shield className="w-4 h-4" />
                Hubungan ke Group Akun ({groups.length})
              </button>
              <button
                onClick={() => setRelationSubTab('users')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-t border-x ${
                  relationSubTab === 'users'
                    ? 'bg-white text-[#002B66] border-slate-200 -mb-px'
                    : 'text-slate-600 hover:text-slate-900 border-transparent'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                Hubungan ke Pengguna ({users.length})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* TAB 1: HUBUNGAN KE GROUP AKUN */}
              {relationSubTab === 'groups' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-blue-50/60 border border-blue-200 p-3.5 rounded-xl">
                    <div className="flex items-start gap-2.5">
                      <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-900">
                        <span className="font-bold">Konfigurasi Hak Akses Group:</span> Tentukan apakah anggota dari masing-masing Group Akun dapat mengakses menu ini, serta izin untuk Tambah, Ubah, Hapus, dan Export data.
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleGrantAllGroups}
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                      >
                        Beri Semua Group
                      </button>
                      <button
                        type="button"
                        onClick={handleRevokeNonAdminGroups}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                      >
                        Hanya Admin
                      </button>
                    </div>
                  </div>

                  {/* Grid Groups */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groups.map(group => {
                      const priv = draftGroupPrivileges[group.id] || {
                        canAccess: false,
                        canCreate: false,
                        canEdit: false,
                        canDelete: false,
                        canExport: false,
                      };
                      const isAdmin = group.id === 'ADMIN';

                      return (
                        <div 
                          key={group.id} 
                          className={`p-4 rounded-xl border transition-all ${
                            priv.canAccess 
                              ? 'bg-white border-blue-200 shadow-xs' 
                              : 'bg-slate-50/70 border-slate-200 opacity-80'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${group.warnaBadge}`}>
                                {group.id}
                              </span>
                              <span className="text-xs font-bold text-slate-800">{group.namaGroup}</span>
                            </div>

                            {/* Access Toggle Switch */}
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                disabled={isAdmin}
                                checked={priv.canAccess}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setDraftGroupPrivileges(prev => ({
                                    ...prev,
                                    [group.id]: {
                                      ...priv,
                                      canAccess: checked,
                                      // If turning off access, turn off child actions as well
                                      canCreate: checked ? priv.canCreate : false,
                                      canEdit: checked ? priv.canEdit : false,
                                      canDelete: checked ? priv.canDelete : false,
                                      canExport: checked ? priv.canExport : false,
                                    }
                                  }));
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#002B66]"></div>
                            </label>
                          </div>

                          <p className="text-[11px] text-slate-500 mb-3 line-clamp-2">
                            {group.deskripsi}
                          </p>

                          {/* Action Privileges Checkboxes */}
                          <div className="pt-2.5 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                            {/* Create */}
                            {activeMenuForRelation.supportedActions.canCreate && (
                              <label className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] cursor-pointer select-none transition-colors ${
                                !priv.canAccess ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200' :
                                priv.canCreate ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold' : 'bg-white text-slate-600 border-slate-200'
                              }`}>
                                <input
                                  type="checkbox"
                                  disabled={!priv.canAccess || isAdmin}
                                  checked={priv.canCreate}
                                  onChange={(e) => {
                                    setDraftGroupPrivileges(prev => ({
                                      ...prev,
                                      [group.id]: { ...priv, canCreate: e.target.checked }
                                    }));
                                  }}
                                  className="w-3 h-3 text-emerald-600 rounded"
                                />
                                <span>Tambah</span>
                              </label>
                            )}

                            {/* Edit */}
                            {activeMenuForRelation.supportedActions.canEdit && (
                              <label className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] cursor-pointer select-none transition-colors ${
                                !priv.canAccess ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200' :
                                priv.canEdit ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold' : 'bg-white text-slate-600 border-slate-200'
                              }`}>
                                <input
                                  type="checkbox"
                                  disabled={!priv.canAccess || isAdmin}
                                  checked={priv.canEdit}
                                  onChange={(e) => {
                                    setDraftGroupPrivileges(prev => ({
                                      ...prev,
                                      [group.id]: { ...priv, canEdit: e.target.checked }
                                    }));
                                  }}
                                  className="w-3 h-3 text-amber-600 rounded"
                                />
                                <span>Ubah</span>
                              </label>
                            )}

                            {/* Delete */}
                            {activeMenuForRelation.supportedActions.canDelete && (
                              <label className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] cursor-pointer select-none transition-colors ${
                                !priv.canAccess ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200' :
                                priv.canDelete ? 'bg-rose-50 text-rose-800 border-rose-300 font-semibold' : 'bg-white text-slate-600 border-slate-200'
                              }`}>
                                <input
                                  type="checkbox"
                                  disabled={!priv.canAccess || isAdmin}
                                  checked={priv.canDelete}
                                  onChange={(e) => {
                                    setDraftGroupPrivileges(prev => ({
                                      ...prev,
                                      [group.id]: { ...priv, canDelete: e.target.checked }
                                    }));
                                  }}
                                  className="w-3 h-3 text-rose-600 rounded"
                                />
                                <span>Hapus</span>
                              </label>
                            )}

                            {/* Export */}
                            {activeMenuForRelation.supportedActions.canExport && (
                              <label className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] cursor-pointer select-none transition-colors ${
                                !priv.canAccess ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200' :
                                priv.canExport ? 'bg-blue-50 text-blue-800 border-blue-300 font-semibold' : 'bg-white text-slate-600 border-slate-200'
                              }`}>
                                <input
                                  type="checkbox"
                                  disabled={!priv.canAccess || isAdmin}
                                  checked={priv.canExport}
                                  onChange={(e) => {
                                    setDraftGroupPrivileges(prev => ({
                                      ...prev,
                                      [group.id]: { ...priv, canExport: e.target.checked }
                                    }));
                                  }}
                                  className="w-3 h-3 text-blue-600 rounded"
                                />
                                <span>Export</span>
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: HUBUNGAN KE PENGGUNA (USER-LEVEL OVERRIDES) */}
              {relationSubTab === 'users' && (
                <div className="space-y-4">
                  <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl flex items-start gap-2.5">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900">
                      <span className="font-bold">Hak Akses Khusus Pengguna (Override):</span> Secara standar, pengguna mengikuti hak akses dari Group Akun masing-masing. Di sini Anda dapat memberikan hak akses khusus (izinkan atau larang) untuk pengguna tertentu pada menu ini tanpa harus memindahkan group akunnya.
                    </div>
                  </div>

                  {/* Filter Users */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Cari nama atau email user..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#002B66]"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={userGroupFilter}
                        onChange={(e) => setUserGroupFilter(e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
                      >
                        <option value="ALL">Semua Group</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.namaGroup}</option>
                        ))}
                      </select>

                      <select
                        value={userOverrideFilter}
                        onChange={(e) => setUserOverrideFilter(e.target.value as any)}
                        className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
                      >
                        <option value="ALL">Semua Status</option>
                        <option value="OVERRIDDEN">Hanya Hak Khusus (Override)</option>
                        <option value="ALLOWED">Hanya yang Punya Akses</option>
                      </select>
                    </div>
                  </div>

                  {/* User List Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase">
                          <th className="py-2.5 px-3">Pengguna</th>
                          <th className="py-2.5 px-3">Group Asal</th>
                          <th className="py-2.5 px-3">Status Izin Grup</th>
                          <th className="py-2.5 px-3">Status Hak Akses User</th>
                          <th className="py-2.5 px-3 text-right">Opsi Override</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {modalFilteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">
                              Tidak ada pengguna yang cocok dengan kriteria.
                            </td>
                          </tr>
                        ) : (
                          modalFilteredUsers.map(user => {
                            const userGroupId = user.groupId || user.role;
                            const groupPriv = draftGroupPrivileges[userGroupId] || { canAccess: false };
                            const override = draftUserOverrides[user.userId];
                            const isOverridden = override !== null && override !== undefined;
                            
                            // Akses efektif pengguna
                            const effectiveCanAccess = isOverridden 
                              ? (override.canAccess !== undefined ? Boolean(override.canAccess) : Boolean(groupPriv.canAccess))
                              : Boolean(groupPriv.canAccess);

                            return (
                              <tr key={user.userId} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-slate-800">{user.nama}</div>
                                  <div className="text-[11px] text-slate-400">{user.email}</div>
                                </td>

                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                    {userGroupId}
                                  </span>
                                </td>

                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                                    groupPriv.canAccess ? 'text-emerald-700' : 'text-slate-400'
                                  }`}>
                                    {groupPriv.canAccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                                    {groupPriv.canAccess ? 'Grup Diizinkan' : 'Grup Dilarang'}
                                  </span>
                                </td>

                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  {isOverridden ? (
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      effectiveCanAccess 
                                        ? 'bg-blue-50 text-blue-700 border-blue-300' 
                                        : 'bg-rose-50 text-rose-700 border-rose-300'
                                    }`}>
                                      {effectiveCanAccess ? 'Khusus Diizinkan' : 'Khusus Dilarang'}
                                    </span>
                                  ) : (
                                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                                      effectiveCanAccess ? 'text-emerald-700' : 'text-slate-500'
                                    }`}>
                                      {effectiveCanAccess ? 'Ikut Grup (Bisa Akses)' : 'Ikut Grup (Terkunci)'}
                                    </span>
                                  )}
                                </td>

                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {/* Selector: Inherit vs Override Grant vs Override Deny */}
                                    <select
                                      value={
                                        !isOverridden ? 'INHERIT' :
                                        override.canAccess ? 'GRANT' : 'DENY'
                                      }
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setDraftUserOverrides(prev => {
                                          if (val === 'INHERIT') {
                                            return { ...prev, [user.userId]: null };
                                          } else if (val === 'GRANT') {
                                            return {
                                              ...prev,
                                              [user.userId]: {
                                                canAccess: true,
                                                canCreate: activeMenuForRelation.supportedActions.canCreate,
                                                canEdit: activeMenuForRelation.supportedActions.canEdit,
                                                canDelete: false,
                                                canExport: activeMenuForRelation.supportedActions.canExport,
                                              }
                                            };
                                          } else {
                                            return {
                                              ...prev,
                                              [user.userId]: {
                                                canAccess: false,
                                                canCreate: false,
                                                canEdit: false,
                                                canDelete: false,
                                                canExport: false,
                                              }
                                            };
                                          }
                                        });
                                      }}
                                      className={`text-xs font-semibold rounded-lg px-2 py-1 border transition-colors cursor-pointer ${
                                        !isOverridden 
                                          ? 'bg-slate-50 text-slate-700 border-slate-300' :
                                        override.canAccess 
                                          ? 'bg-blue-50 text-blue-800 border-blue-300' 
                                          : 'bg-rose-50 text-rose-800 border-rose-300'
                                      }`}
                                    >
                                      <option value="INHERIT">Ikuti Group (Standar)</option>
                                      <option value="GRANT">Override: Izinkan Akses</option>
                                      <option value="DENY">Override: Kunci / Larang</option>
                                    </select>

                                    {isOverridden && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDraftUserOverrides(prev => ({
                                            ...prev,
                                            [user.userId]: null
                                          }));
                                        }}
                                        title="Kembalikan user ini mengikuti group"
                                        className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200"
                                      >
                                        <RefreshCw className="w-3.5 h-3.5" />
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
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Menu target: <strong className="text-slate-700">{activeMenuForRelation.label}</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRelationModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveRelations}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#002B66] hover:bg-[#001E47] rounded-lg shadow-sm transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Simpan Relasi Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: TAMBAH / EDIT MENU DEFINISI                        */}
      {/* ============================================================ */}
      {menuEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 bg-[#002B66] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/10">
                  <SlidersHorizontal className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingMenu ? 'Edit Identitas Menu' : 'Tambah Menu Baru'}
                  </h3>
                  <p className="text-xs text-white/80">
                    Konfigurasi nama, kategori modul, dan urutan menu navigasi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMenuEditModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenuDefinition} className="p-6 space-y-4">
              {/* ID Menu */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ID Menu (Unik)
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingMenu)}
                  value={menuFormId}
                  onChange={(e) => setMenuFormId(e.target.value)}
                  placeholder="contoh: rekap_keuangan"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#002B66] disabled:bg-slate-100 disabled:text-slate-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Gunakan huruf kecil tanpa spasi (misal: peserta, eduventure, program).
                </p>
              </div>

              {/* Label Menu */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Label Nama Menu
                </label>
                <input
                  type="text"
                  required
                  value={menuFormLabel}
                  onChange={(e) => setMenuFormLabel(e.target.value)}
                  placeholder="contoh: Rekapitulasi Pembayaran"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#002B66]"
                />
              </div>

              {/* Kategori Modul */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Modul
                </label>
                <select
                  value={menuFormCategory}
                  onChange={(e) => setMenuFormCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#002B66]"
                >
                  <option value="Dashboard & Peta">Dashboard & Peta</option>
                  <option value="Master Data Program">Master Data Program</option>
                  <option value="Operasional & Peserta">Operasional & Peserta</option>
                  <option value="Laporan & Analitik">Laporan & Analitik</option>
                  <option value="Administrasi Sistem">Administrasi Sistem</option>
                </select>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi Menu
                </label>
                <textarea
                  rows={2}
                  value={menuFormDeskripsi}
                  onChange={(e) => setMenuFormDeskripsi(e.target.value)}
                  placeholder="Keterangan singkat fungsi dan isi modul..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#002B66]"
                />
              </div>

              {/* Urutan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Urut Tampil
                </label>
                <input
                  type="number"
                  min={1}
                  value={menuFormUrutan}
                  onChange={(e) => setMenuFormUrutan(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#002B66]"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMenuEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#002B66] hover:bg-[#001E47] rounded-lg shadow-sm transition-colors"
                >
                  Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
