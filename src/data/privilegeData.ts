import { AppMenuItemDef, AppMenuId, GroupAkun, MenuActionKey, MenuPrivilege, UserItem } from '../types';

export const APP_MENU_DEFINITIONS: AppMenuItemDef[] = [
  // 1. Dashboard & Peta
  {
    id: 'dashboard',
    label: 'Dashboard Utama',
    kategoriModul: 'Dashboard & Peta',
    deskripsi: 'Ringkasan eksekutif statistik peserta, status kelulusan, dan grafik capaian program.',
    supportedActions: { canCreate: false, canEdit: false, canDelete: false, canExport: true }
  },
  {
    id: 'map_dashboard',
    label: 'Peta Sebaran (Map)',
    kategoriModul: 'Dashboard & Peta',
    deskripsi: 'Peta interaktif sebaran asal provinsi dan instansi peserta non-gelar Unpad se-Indonesia.',
    supportedActions: { canCreate: false, canEdit: false, canDelete: false, canExport: true }
  },

  // 2. Master Data Program
  {
    id: 'kategori',
    label: 'Kategori Program',
    kategoriModul: 'Master Data Program',
    deskripsi: 'Master klasifikasi kategori pelatihan (Sertifikasi, Pelatihan Singkat, Eduventure, dll).',
    supportedActions: { canCreate: true, canEdit: true, canDelete: true, canExport: true }
  },
  {
    id: 'program',
    label: 'Program Pelatihan',
    kategoriModul: 'Master Data Program',
    deskripsi: 'Katalog program pendidikan non-gelar, kurikulum, durasi, biaya, dan kuota.',
    supportedActions: { canCreate: true, canEdit: true, canDelete: true, canExport: true }
  },
  {
    id: 'pic',
    label: 'PIC / Koordinator',
    kategoriModul: 'Master Data Program',
    deskripsi: 'Daftar dosen/koordinator pelaksana penanggung jawab program pelatihan Unpad.',
    supportedActions: { canCreate: true, canEdit: true, canDelete: true, canExport: true }
  },

  // 3. Operasional & Peserta
  {
    id: 'peserta',
    label: 'Data Peserta',
    kategoriModul: 'Operasional & Peserta',
    deskripsi: 'Database utama seluruh peserta, NIK/NIP, instansi, sertifikat, kelulusan, dan riwayat.',
    supportedActions: { canCreate: true, canEdit: true, canDelete: true, canExport: true }
  },
  {
    id: 'tambah',
    label: 'Tambah Peserta',
    kategoriModul: 'Operasional & Peserta',
    deskripsi: 'Formulir input registrasi peserta baru beserta validasi duplikasi NIK/NIP.',
    supportedActions: { canCreate: true, canEdit: false, canDelete: false, canExport: false }
  },
  {
    id: 'eduventure',
    label: 'Eduventure (Kunjungan)',
    kategoriModul: 'Operasional & Peserta',
    deskripsi: 'Pengelolaan kunjungan kampus sekolah, verifikasi bukti bayar VA, dan jadwal kunjungan.',
    supportedActions: { canCreate: true, canEdit: true, canDelete: true, canExport: true }
  },
  {
    id: 'search',
    label: 'Advanced Search',
    kategoriModul: 'Operasional & Peserta',
    deskripsi: 'Pencarian mendalam multi-parameter filter gabungan data peserta dan sertifikat.',
    supportedActions: { canCreate: false, canEdit: false, canDelete: false, canExport: true }
  },

  // 4. Laporan & Analitik
  {
    id: 'statistik',
    label: 'Statistik & Analitik',
    kategoriModul: 'Laporan & Analitik',
    deskripsi: 'Analitik visual demografi, tren pendapatan, batch angkatan, dan persentase kelulusan.',
    supportedActions: { canCreate: false, canEdit: false, canDelete: false, canExport: true }
  },
  {
    id: 'export',
    label: 'Export Data',
    kategoriModul: 'Laporan & Analitik',
    deskripsi: 'Pengunduhan laporan format Excel, CSV, format cetak resmi, dan arsip data.',
    supportedActions: { canCreate: false, canEdit: false, canDelete: false, canExport: true }
  },
  {
    id: 'import',
    label: 'Import Data Batch',
    kategoriModul: 'Laporan & Analitik',
    deskripsi: 'Upload massal data peserta via template spreadsheet dan sinkronisasi berkas CSV.',
    supportedActions: { canCreate: true, canEdit: false, canDelete: false, canExport: false }
  },

  // 5. Administrasi Sistem
  {
    id: 'user',
    label: 'User Management & Privilege',
    kategoriModul: 'Administrasi Sistem',
    deskripsi: 'Pengaturan akun pengguna, kelompok group akun, dan matriks hak akses privilege menu.',
    urutan: 13,
    aktif: true,
    iconName: 'ShieldCheck',
    supportedActions: { canCreate: true, canEdit: true, canDelete: true, canExport: true }
  },
  {
    id: 'menu_manage',
    label: 'Pengaturan Menu',
    kategoriModul: 'Administrasi Sistem',
    deskripsi: 'Pengaturan menu aplikasi, urutan, status aktif/nonaktif, serta relasi hak akses ke Group Akun dan Pengguna.',
    urutan: 14,
    aktif: true,
    iconName: 'SlidersHorizontal',
    supportedActions: { canCreate: true, canEdit: true, canDelete: true, canExport: true }
  },
  {
    id: 'log',
    label: 'Log Aktivitas & Audit',
    kategoriModul: 'Administrasi Sistem',
    deskripsi: 'Rekam jejak digital (audit trail) setiap perubahan data, waktu, dan pelaksana.',
    urutan: 15,
    aktif: true,
    iconName: 'History',
    supportedActions: { canCreate: false, canEdit: false, canDelete: false, canExport: true }
  },
  {
    id: 'setting',
    label: 'Pengaturan Sistem',
    kategoriModul: 'Administrasi Sistem',
    deskripsi: 'Konfigurasi Google Spreadsheet ID, URL Google Apps Script, dan whitelist domain.',
    urutan: 16,
    aktif: true,
    iconName: 'Settings',
    supportedActions: { canCreate: false, canEdit: true, canDelete: false, canExport: false }
  },
  {
    id: 'gas_code',
    label: 'Script GAS & Setup',
    kategoriModul: 'Administrasi Sistem',
    deskripsi: 'Kode sumber Google Apps Script Code.gs, panduan deploy, dan skema sheet.',
    urutan: 17,
    aktif: true,
    iconName: 'Code',
    supportedActions: { canCreate: false, canEdit: false, canDelete: false, canExport: true }
  }
];

// Helper to create all privileges
function createFullPrivileges(val: boolean): Record<string, MenuPrivilege> {
  const res: Record<string, MenuPrivilege> = {};
  APP_MENU_DEFINITIONS.forEach(m => {
    res[m.id] = {
      canAccess: val,
      canCreate: val && m.supportedActions.canCreate,
      canEdit: val && m.supportedActions.canEdit,
      canDelete: val && m.supportedActions.canDelete,
      canExport: val && m.supportedActions.canExport
    };
  });
  return res;
}

// 1. ADMIN (Administrator Utama) - Full Access
export const ADMIN_PRIVILEGES: Record<string, MenuPrivilege> = createFullPrivileges(true);

// 2. OPERATOR (Operator Data & Pelatihan)
export const OPERATOR_PRIVILEGES: Record<string, MenuPrivilege> = {
  dashboard: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  map_dashboard: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  kategori: { canAccess: true, canCreate: true, canEdit: true, canDelete: false, canExport: true },
  program: { canAccess: true, canCreate: true, canEdit: true, canDelete: false, canExport: true },
  pic: { canAccess: true, canCreate: true, canEdit: true, canDelete: false, canExport: true },
  peserta: { canAccess: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
  tambah: { canAccess: true, canCreate: true, canEdit: false, canDelete: false, canExport: false },
  eduventure: { canAccess: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
  search: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  statistik: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  export: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  import: { canAccess: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
  user: { canAccess: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
  menu_manage: { canAccess: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
  log: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  setting: { canAccess: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
  gas_code: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: false }
};

// 3. VIEWER (Pengawas / Pimpinan Unpad) - Read-only
export const VIEWER_PRIVILEGES: Record<string, MenuPrivilege> = {
  dashboard: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  map_dashboard: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  kategori: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  program: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  pic: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  peserta: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  tambah: { canAccess: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
  eduventure: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  search: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  statistik: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  export: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  import: { canAccess: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
  user: { canAccess: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
  menu_manage: { canAccess: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
  log: { canAccess: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
  setting: { canAccess: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
  gas_code: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: false }
};

// 4. KEUANGAN (Verifikator Keuangan & Rekening Eduventure)
export const KEUANGAN_PRIVILEGES: Record<string, MenuPrivilege> = {
  dashboard: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  map_dashboard: { canAccess: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
  kategori: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  program: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  pic: { canAccess: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
  peserta: { canAccess: true, canCreate: false, canEdit: true, canDelete: false, canExport: true },
  tambah: { canAccess: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
  eduventure: { canAccess: true, canCreate: true, canEdit: true, canDelete: false, canExport: true },
  search: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  statistik: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  export: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  import: { canAccess: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
  user: { canAccess: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
  menu_manage: { canAccess: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
  log: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  setting: { canAccess: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
  gas_code: { canAccess: false, canCreate: false, canEdit: false, canDelete: false, canExport: false }
};

// 5. KOORDINATOR_PROGRAM (Koordinator Pelatihan & PIC)
export const KOORDINATOR_PRIVILEGES: Record<string, MenuPrivilege> = {
  dashboard: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  map_dashboard: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  kategori: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  program: { canAccess: true, canCreate: true, canEdit: true, canDelete: false, canExport: true },
  pic: { canAccess: true, canCreate: true, canEdit: true, canDelete: false, canExport: true },
  peserta: { canAccess: true, canCreate: true, canEdit: true, canDelete: false, canExport: true },
  tambah: { canAccess: true, canCreate: true, canEdit: false, canDelete: false, canExport: false },
  eduventure: { canAccess: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
  search: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  statistik: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  export: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
  import: { canAccess: true, canCreate: true, canEdit: false, canDelete: false, canExport: false },
  user: { canAccess: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
  menu_manage: { canAccess: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
  log: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, canExport: false },
  setting: { canAccess: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
  gas_code: { canAccess: false, canCreate: false, canEdit: false, canDelete: false, canExport: false }
};

export const ROLE_PRESET_MAP: Record<string, Record<string, MenuPrivilege>> = {
  ADMIN: ADMIN_PRIVILEGES,
  OPERATOR: OPERATOR_PRIVILEGES,
  VIEWER: VIEWER_PRIVILEGES,
  KEUANGAN: KEUANGAN_PRIVILEGES,
  KOORDINATOR_PROGRAM: KOORDINATOR_PRIVILEGES
};

export const DEFAULT_GROUPS: GroupAkun[] = [
  {
    id: 'ADMIN',
    namaGroup: 'Administrator Utama',
    deskripsi: 'Akses tanpa batas (Superadmin) untuk manajemen seluruh data peserta, kategori, pengguna, matriks hak akses, audit trail, dan konfigurasi sistem.',
    warnaBadge: 'bg-[#002B66] text-[#FDB913] border-amber-300',
    isSystem: true,
    privileges: ADMIN_PRIVILEGES,
    createdAt: '2024-01-01 08:00:00',
    updatedAt: '2026-09-18 00:00:00'
  },
  {
    id: 'OPERATOR',
    namaGroup: 'Operator Pengelola Data',
    deskripsi: 'Staf pengelola operasional harian: input data peserta, pembaruan master program/kategori, pengelolaan kunjungan Eduventure, dan export laporan.',
    warnaBadge: 'bg-blue-100 text-blue-800 border-blue-300',
    isSystem: true,
    privileges: OPERATOR_PRIVILEGES,
    createdAt: '2024-01-02 09:00:00',
    updatedAt: '2026-09-18 00:00:00'
  },
  {
    id: 'VIEWER',
    namaGroup: 'Viewer & Pimpinan Eksekutif',
    deskripsi: 'Akses pemantauan (Read-Only) untuk pimpinan universitas, dekanat, auditor, dan pengawas program yang memerlukan visibilitas data dan statistik.',
    warnaBadge: 'bg-slate-100 text-slate-800 border-slate-300',
    isSystem: true,
    privileges: VIEWER_PRIVILEGES,
    createdAt: '2024-01-03 10:00:00',
    updatedAt: '2026-09-18 00:00:00'
  },
  {
    id: 'KEUANGAN',
    namaGroup: 'Verifikator Keuangan & Kasir',
    deskripsi: 'Unit keuangan khusus untuk verifikasi bukti transfer pembayaran Eduventure, validasi nomor VA (Eduventure/Luhung), rekonsiliasi biaya, dan pelaporan.',
    warnaBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    isSystem: false,
    privileges: KEUANGAN_PRIVILEGES,
    createdAt: '2026-09-18 08:00:00',
    updatedAt: '2026-09-18 08:00:00'
  },
  {
    id: 'KOORDINATOR_PROGRAM',
    namaGroup: 'Koordinator Pelatihan & PIC',
    deskripsi: 'Dosen dan PIC pelaksana program non-gelar untuk pengelolaan kurikulum, peserta batch binaan, serta unggah berkas massal peserta pelatihan.',
    warnaBadge: 'bg-purple-100 text-purple-800 border-purple-300',
    isSystem: false,
    privileges: KOORDINATOR_PRIVILEGES,
    createdAt: '2026-09-18 08:00:00',
    updatedAt: '2026-09-18 08:00:00'
  }
];

// Privilege resolution logic
export function getEffectivePrivilege(
  user: UserItem | undefined,
  groups: GroupAkun[],
  menuId: AppMenuId,
  menus?: AppMenuItemDef[]
): MenuPrivilege {
  const fallback: MenuPrivilege = {
    canAccess: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: false
  };

  if (!user) return fallback;

  // Check if menu is disabled globally
  if (menus && menus.length > 0) {
    const targetMenu = menus.find(m => m.id === menuId);
    if (targetMenu && targetMenu.aktif === false) {
      if (user.role !== 'ADMIN' && user.groupId !== 'ADMIN') {
        return fallback;
      }
    }
  }

  // 1. Find matching group
  const groupId = user.groupId || user.role;
  const group = groups.find(g => g.id === groupId);

  let basePrivilege: MenuPrivilege = (user.role === 'ADMIN' || user.groupId === 'ADMIN')
    ? {
        canAccess: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canExport: true
      }
    : (group?.privileges[menuId] || fallback);

  // 2. Check individual user overrides if defined
  if (user.customPrivileges && user.customPrivileges[menuId]) {
    basePrivilege = {
      ...basePrivilege,
      ...user.customPrivileges[menuId]
    };
  }

  return basePrivilege;
}

export function hasMenuAccess(
  user: UserItem | undefined,
  groups: GroupAkun[],
  menuId: AppMenuId,
  menus?: AppMenuItemDef[]
): boolean {
  if (!user) return false;
  const priv = getEffectivePrivilege(user, groups, menuId, menus);
  return Boolean(priv.canAccess);
}

export function canUserPerform(
  user: UserItem | undefined,
  groups: GroupAkun[],
  menuId: AppMenuId,
  action: MenuActionKey,
  menus?: AppMenuItemDef[]
): boolean {
  if (!user) return false;
  const priv = getEffectivePrivilege(user, groups, menuId, menus);
  return Boolean(priv[action]);
}
