import { 
  Peserta, Kategori, Program, UserItem, LogAktivitas, SettingApp, 
  AdvancedSearchFilter, UserRole, PicProgram, EduventureBooking,
  GroupAkun, MenuPrivilege, AppMenuItemDef, AppThemeId, LoginSettings,
  SimpendikBackupPayload, SimpendikBackupData, SimpendikBackupSummary,
  BackupSnapshotItem, RestoreMode
} from '../types';
import { 
  DEFAULT_KATEGORI, DEFAULT_PROGRAM, DEFAULT_PESERTA, 
  DEFAULT_USERS, DEFAULT_LOGS, DEFAULT_SETTING, DEFAULT_PIC,
  DEFAULT_EDUVENTURE, DEFAULT_TEMPAT_EDUVENTURE
} from '../data/initialData';
import { DEFAULT_GROUPS, APP_MENU_DEFINITIONS, ROLE_PRESET_MAP } from '../data/privilegeData';
import { DEFAULT_LOGIN_SETTINGS } from '../data/loginPresets';

const STORAGE_KEYS = {
  PESERTA: 'simpendik_unpad_peserta',
  KATEGORI: 'simpendik_unpad_kategori',
  PROGRAM: 'simpendik_unpad_program',
  PIC: 'simpendik_unpad_pic',
  EDUVENTURE: 'simpendik_unpad_eduventure',
  TEMPAT_EDUVENTURE: 'simpendik_unpad_tempat_eduventure',
  USERS: 'simpendik_unpad_users',
  GROUPS: 'simpendik_unpad_groups',
  MENUS: 'simpendik_unpad_menus',
  LOGS: 'simpendik_unpad_logs',
  SETTINGS: 'simpendik_unpad_settings',
  ACTIVE_USER: 'simpendik_unpad_active_user',
  IS_LOGGED_IN: 'simpendik_unpad_is_logged_in',
  SNAPSHOTS: 'simpendik_unpad_snapshots',
};

// Inisialisasi awal ke localStorage jika kosong
export function initLocalStorage(): void {
  if (!localStorage.getItem(STORAGE_KEYS.PESERTA)) {
    localStorage.setItem(STORAGE_KEYS.PESERTA, JSON.stringify(DEFAULT_PESERTA));
  }
  if (!localStorage.getItem(STORAGE_KEYS.KATEGORI)) {
    localStorage.setItem(STORAGE_KEYS.KATEGORI, JSON.stringify(DEFAULT_KATEGORI));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROGRAM)) {
    localStorage.setItem(STORAGE_KEYS.PROGRAM, JSON.stringify(DEFAULT_PROGRAM));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PIC)) {
    localStorage.setItem(STORAGE_KEYS.PIC, JSON.stringify(DEFAULT_PIC));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EDUVENTURE)) {
    localStorage.setItem(STORAGE_KEYS.EDUVENTURE, JSON.stringify(DEFAULT_EDUVENTURE));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TEMPAT_EDUVENTURE)) {
    localStorage.setItem(STORAGE_KEYS.TEMPAT_EDUVENTURE, JSON.stringify(DEFAULT_TEMPAT_EDUVENTURE));
  }
  if (!localStorage.getItem(STORAGE_KEYS.GROUPS)) {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(DEFAULT_GROUPS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MENUS)) {
    localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(APP_MENU_DEFINITIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  } else {
    // Pastikan user memiliki kata sandi dan relasi groupId jika belum ada
    try {
      const storedUsers: UserItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      let updated = false;
      const patched = storedUsers.map(u => {
        let changed = false;
        const copy = { ...u };
        if (!copy.password) {
          changed = true;
          copy.password = copy.role === 'ADMIN' ? 'admin123' : copy.role === 'OPERATOR' ? 'operator123' : 'viewer123';
        }
        if (!copy.groupId) {
          changed = true;
          copy.groupId = copy.role;
          copy.namaGroup = copy.role === 'ADMIN' 
            ? 'Administrator Utama' 
            : copy.role === 'OPERATOR' 
              ? 'Operator Pengelola Data' 
              : 'Viewer & Pimpinan';
        }
        if (changed) updated = true;
        return copy;
      });
      if (updated) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(patched));
      }
    } catch {
      // ignore
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(DEFAULT_LOGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTING));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_USER)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(DEFAULT_USERS[0]));
  }
}

// User & Auth Management
export function isUserLoggedIn(): boolean {
  initLocalStorage();
  return localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === 'true';
}

export function getCurrentUser(): UserItem {
  initLocalStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
  return raw ? JSON.parse(raw) : DEFAULT_USERS[0];
}

export function loginUser(email: string, password?: string): { success: boolean; message: string; user?: UserItem } {
  initLocalStorage();
  const trimmedEmail = email.trim().toLowerCase();
  const users = getUsers();
  
  // Cari user berdasarkan email
  const foundUser = users.find(u => u.email.toLowerCase() === trimmedEmail);
  
  if (!foundUser) {
    // Jika email berakhiran @unpad.ac.id, izinkan login SSO otomatis sebagai VIEWER
    if (trimmedEmail.endsWith('@unpad.ac.id')) {
      const namePart = trimmedEmail.split('@')[0].replace(/[._-]/g, ' ');
      const formattedName = namePart.replace(/\b\w/g, l => l.toUpperCase());
      const newUser: UserItem = {
        userId: `USR-${String(users.length + 1).padStart(3, '0')}`,
        email: trimmedEmail,
        nama: `${formattedName} (SSO Unpad)`,
        role: 'VIEWER',
        password: password || 'unpad123',
        status: 'Aktif',
        statusAktif: 'Ya',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      users.push(newUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(newUser));
      localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
      writeLog('Login Otomatis SSO', 'AUTH', newUser.userId, `Registrasi & login SSO untuk ${newUser.email}`);
      return { 
        success: true, 
        message: `Selamat datang, ${newUser.nama}! Anda berhasil masuk melalui SSO Unpad.`, 
        user: newUser 
      };
    }
    return { 
      success: false, 
      message: 'Email tidak ditemukan. Pastikan email terdaftar atau gunakan email berdomain @unpad.ac.id.' 
    };
  }

  // Cek status aktif akun
  const isActive = foundUser.statusAktif === 'Ya' || foundUser.status === 'Aktif';
  if (!isActive) {
    return {
      success: false,
      message: 'Akun Anda sedang dinonaktifkan. Silakan hubungi Administrator DPNG Unpad.'
    };
  }

  // Cek kata sandi jika ada
  if (foundUser.password && password) {
    // Izinkan password akun atau password master demo untuk kemudahan
    const isMasterDemoPassword = password === 'admin123' || password === 'unpad123';
    if (password !== foundUser.password && !isMasterDemoPassword) {
      return {
        success: false,
        message: 'Kata sandi salah. Silakan periksa kembali atau gunakan akun demo.'
      };
    }
  }

  // Perbarui lastLogin
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  foundUser.lastLogin = now;
  const userIdx = users.findIndex(u => u.userId === foundUser.userId);
  if (userIdx >= 0) {
    users[userIdx] = foundUser;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(foundUser));
  localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
  writeLog('Login Berhasil', 'AUTH', foundUser.userId, `Pengguna ${foundUser.email} (${foundUser.role}) berhasil masuk ke aplikasi`);

  return {
    success: true,
    message: `Selamat datang kembali, ${foundUser.nama}!`,
    user: foundUser
  };
}

export function logoutUser(): void {
  const current = getCurrentUser();
  writeLog('Logout', 'AUTH', current.userId, `Pengguna ${current.email} keluar dari aplikasi`);
  localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'false');
}

export function quickLoginUser(role: UserRole): { success: boolean; message: string; user?: UserItem } {
  const users = getUsers();
  const target = users.find(u => u.role === role && (u.status === 'Aktif' || u.statusAktif === 'Ya')) || users[0];
  return loginUser(target.email, target.password || 'admin123');
}

export function setActiveUserRole(role: UserRole): UserItem {
  const current = getCurrentUser();
  const updated: UserItem = { ...current, role };
  localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(updated));
  writeLog('Ganti Role Simulasi', 'AUTH', updated.userId, `Role beralih ke ${role}`);
  return updated;
}

export function getUsers(): UserItem[] {
  initLocalStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.USERS);
  return raw ? JSON.parse(raw) : DEFAULT_USERS;
}

export function saveUser(user: UserItem): void {
  const users = getUsers();
  const idx = users.findIndex(u => u.userId === user.userId);
  if (idx >= 0) {
    users[idx] = user;
    writeLog('Update User', 'USER', user.userId, `Update data user ${user.email} (${user.role})`);
  } else {
    users.push(user);
    writeLog('Tambah User', 'USER', user.userId, `Registrasi user baru ${user.email} (${user.role})`);
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function deleteUser(userId: string): void {
  const users = getUsers().filter(u => u.userId !== userId);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  writeLog('Hapus User', 'USER', userId, `Menghapus user ID ${userId}`);
}

export function changeUserPassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): { success: boolean; message: string } {
  initLocalStorage();
  const users = getUsers();
  const idx = users.findIndex(u => u.userId === userId);
  if (idx < 0) {
    return { success: false, message: 'Data pengguna tidak ditemukan dalam sistem.' };
  }

  const user = users[idx];
  const currentPassword = user.password || (user.role === 'ADMIN' ? 'admin123' : user.role === 'OPERATOR' ? 'operator123' : 'viewer123');

  // Validasi kecocokan password lama (dukung juga master demo admin123 / unpad123 untuk fleksibilitas)
  const isMasterPassword = oldPassword === 'admin123' || oldPassword === 'unpad123';
  if (oldPassword !== currentPassword && !isMasterPassword) {
    return { success: false, message: 'Kata sandi saat ini (lama) tidak sesuai.' };
  }

  if (!newPassword || newPassword.trim().length < 6) {
    return { success: false, message: 'Kata sandi baru minimal harus 6 karakter.' };
  }

  if (newPassword === oldPassword) {
    return { success: false, message: 'Kata sandi baru tidak boleh sama persis dengan kata sandi lama.' };
  }

  // Update password pengguna
  const updatedUser: UserItem = {
    ...user,
    password: newPassword.trim(),
  };

  users[idx] = updatedUser;
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

  // Jika pengguna ini adalah active user saat ini, perbarui juga state aktif
  const currentActive = getCurrentUser();
  if (currentActive.userId === userId) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify({ ...currentActive, password: newPassword.trim() }));
  }

  writeLog('Ubah Password', 'AUTH', userId, `Pengguna ${user.email} (${user.nama}) berhasil memperbarui kata sandi akun.`);
  return { success: true, message: 'Kata sandi Anda berhasil diperbarui! Silakan gunakan kata sandi baru untuk login.' };
}

export function adminResetUserPassword(
  adminUserId: string,
  targetUserId: string,
  newPassword: string
): { success: boolean; message: string } {
  initLocalStorage();
  const users = getUsers();
  const idx = users.findIndex(u => u.userId === targetUserId);
  if (idx < 0) {
    return { success: false, message: 'Data pengguna target tidak ditemukan.' };
  }

  if (!newPassword || newPassword.trim().length < 6) {
    return { success: false, message: 'Kata sandi baru minimal harus 6 karakter.' };
  }

  const target = users[idx];
  const updatedTarget: UserItem = {
    ...target,
    password: newPassword.trim(),
  };

  users[idx] = updatedTarget;
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

  const currentActive = getCurrentUser();
  if (currentActive.userId === targetUserId) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify({ ...currentActive, password: newPassword.trim() }));
  }

  writeLog('Reset Password User', 'USER', adminUserId, `Administrator mereset kata sandi pengguna ${target.email} (${target.nama}).`);
  return { success: true, message: `Kata sandi untuk pengguna ${target.nama} (${target.email}) berhasil direset!` };
}

export function updateCurrentUserProfile(updatedFields: Partial<UserItem>): UserItem {
  initLocalStorage();
  const current = getCurrentUser();
  const updated: UserItem = { ...current, ...updatedFields };
  localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(updated));

  const users = getUsers();
  const idx = users.findIndex(u => u.userId === updated.userId);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...updatedFields };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }
  writeLog('Update Profil', 'USER', updated.userId, `Pengguna ${updated.nama} memperbarui informasi profil / foto`);
  return updated;
}

export function getAppTheme(): AppThemeId {
  const stored = localStorage.getItem('simpendik_theme');
  return (stored as AppThemeId) || 'unpad-blue';
}

export function setAppTheme(theme: AppThemeId): void {
  localStorage.setItem('simpendik_theme', theme);
  const current = getCurrentUser();
  if (current) {
    updateCurrentUserProfile({ theme });
  }
}

// Group Akun & Privilege Management
export function getGroups(): GroupAkun[] {
  initLocalStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.GROUPS);
  return raw ? JSON.parse(raw) : DEFAULT_GROUPS;
}

export function saveGroup(group: GroupAkun): { success: boolean; message: string; data: GroupAkun } {
  const groups = getGroups();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const idx = groups.findIndex(g => g.id === group.id);

  if (idx >= 0) {
    groups[idx] = {
      ...group,
      updatedAt: now
    };
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
    writeLog('Update Group Akun', 'PRIVILEGE', group.id, `Perbarui konfigurasi group akun "${group.namaGroup}"`);
    return { success: true, message: `Group akun "${group.namaGroup}" berhasil diperbarui!`, data: groups[idx] };
  } else {
    const newGroup: GroupAkun = {
      ...group,
      createdAt: now,
      updatedAt: now
    };
    groups.push(newGroup);
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
    writeLog('Tambah Group Akun', 'PRIVILEGE', group.id, `Membuat group akun baru "${newGroup.namaGroup}"`);
    return { success: true, message: `Group akun baru "${newGroup.namaGroup}" berhasil dibuat!`, data: newGroup };
  }
}

export function deleteGroup(groupId: string): { success: boolean; message: string } {
  const groups = getGroups();
  const target = groups.find(g => g.id === groupId);

  if (!target) {
    return { success: false, message: 'Group akun tidak ditemukan.' };
  }

  if (target.isSystem || ['ADMIN', 'OPERATOR', 'VIEWER'].includes(groupId)) {
    return { success: false, message: `Group sistem "${target.namaGroup}" tidak dapat dihapus demi integritas hak akses.` };
  }

  // Cek apakah ada user yang masih menggunakan group ini
  const users = getUsers();
  const assignedUsers = users.filter(u => u.groupId === groupId || u.role === groupId);
  if (assignedUsers.length > 0) {
    return { 
      success: false, 
      message: `Tidak dapat menghapus group "${target.namaGroup}" karena masih digunakan oleh ${assignedUsers.length} pengguna aktif.` 
    };
  }

  const updated = groups.filter(g => g.id !== groupId);
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(updated));
  writeLog('Hapus Group Akun', 'PRIVILEGE', groupId, `Menghapus group akun "${target.namaGroup}"`);
  return { success: true, message: `Group akun "${target.namaGroup}" berhasil dihapus.` };
}

export function saveAllGroupPrivileges(
  groupId: string, 
  privileges: Record<string, MenuPrivilege>
): { success: boolean; message: string } {
  const groups = getGroups();
  const idx = groups.findIndex(g => g.id === groupId);
  if (idx < 0) {
    return { success: false, message: `Group akun dengan ID ${groupId} tidak ditemukan.` };
  }

  groups[idx].privileges = privileges;
  groups[idx].updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  writeLog('Update Matriks Privilege', 'PRIVILEGE', groupId, `Memperbarui matriks izin menu untuk group "${groups[idx].namaGroup}"`);

  return { 
    success: true, 
    message: `Matriks privilege hak akses menu untuk group "${groups[idx].namaGroup}" berhasil disimpan!` 
  };
}

export function resetPrivilegesToDefaults(): void {
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(DEFAULT_GROUPS));
  writeLog('Reset Privilege', 'PRIVILEGE', 'DEFAULT', 'Matriks hak akses dan group akun dikembalikan ke standar rekomendasi Unpad');
}

// Audit Log Service
export function writeLog(aktivitas: string, modul: string, idData: string, keterangan: string): void {
  const currentUser = getCurrentUser();
  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);
  
  const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
  const logs: LogAktivitas[] = raw ? JSON.parse(raw) : [];

  const newLog: LogAktivitas = {
    id: 'LOG-' + String(logs.length + 1).padStart(4, '0'),
    timestamp: dateStr,
    user: currentUser.email,
    aktivitas,
    modul,
    idData,
    keterangan,
    ipUserAgent: '103.24.58.12 (Browser Session)'
  };

  logs.unshift(newLog);
  if (logs.length > 500) logs.pop();
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
}

export function getLogs(): LogAktivitas[] {
  initLocalStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
  return raw ? JSON.parse(raw) : [];
}

// Settings
export function getSettings(): SettingApp {
  initLocalStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!raw) return DEFAULT_SETTING;
  try {
    const parsed = JSON.parse(raw);
    const result: SettingApp = {
      ...DEFAULT_SETTING,
      ...parsed,
      loginSettings: {
        ...DEFAULT_LOGIN_SETTINGS,
        ...(parsed.loginSettings || {}),
      },
    };
    // Migrasi otomatis jika masih menggunakan ID lama atau kosong
    if (!result.spreadsheetId || result.spreadsheetId === '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms') {
      result.spreadsheetId = DEFAULT_SETTING.spreadsheetId;
      result.sheetUrl = DEFAULT_SETTING.sheetUrl;
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(result));
    }
    return result;
  } catch (e) {
    return DEFAULT_SETTING;
  }
}

export function saveSettings(settings: SettingApp): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  writeLog('Update Pengaturan', 'SETTING', 'APP_CONFIG', 'Konfigurasi aplikasi disimpan');
}

/**
 * Mengekstrak Google Spreadsheet ID dari link / URL Google Sheet atau string ID murni
 */
export function extractSpreadsheetId(urlOrId: string): string {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  // Format: https://docs.google.com/spreadsheets/d/[ID]/...
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // Format jika user hanya memasukkan ID langsung
  return trimmed;
}

/**
 * Menghasilkan URL lengkap Google Sheet dari Spreadsheet ID
 */
export function getGoogleSheetUrl(spreadsheetId: string): string {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  if (!cleanId) return 'https://docs.google.com/spreadsheets';
  return `https://docs.google.com/spreadsheets/d/${cleanId}/edit`;
}

/**
 * Menyimpan tautan Google Sheet dan memperbarui pengaturan penyimpanan
 */
export function updateGoogleSheetConnection(sheetUrlOrId: string, gasUrl?: string): { success: boolean; spreadsheetId: string; sheetUrl: string; message: string } {
  const spreadsheetId = extractSpreadsheetId(sheetUrlOrId);
  if (!spreadsheetId) {
    return {
      success: false,
      spreadsheetId: '',
      sheetUrl: '',
      message: 'ID atau Link Google Sheet tidak valid. Masukkan URL spreadsheet Google yang sah.'
    };
  }

  const sheetUrl = getGoogleSheetUrl(spreadsheetId);
  const currentSettings = getSettings();
  const updatedSettings: SettingApp = {
    ...currentSettings,
    spreadsheetId,
    sheetUrl,
    gasDeploymentUrl: gasUrl !== undefined ? gasUrl : currentSettings.gasDeploymentUrl,
    lastSyncedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };

  saveSettings(updatedSettings);
  writeLog(
    'Koneksi Google Sheet',
    'DATABASE',
    'SHEET_SYNC',
    `Penyimpanan aplikasi berhasil dihubungkan ke Google Sheet ID: ${spreadsheetId}`
  );

  return {
    success: true,
    spreadsheetId,
    sheetUrl,
    message: `Penyimpanan aplikasi berhasil dihubungkan ke Google Sheet (ID: ${spreadsheetId})`
  };
}

export function getLoginSettings(): LoginSettings {
  const settings = getSettings();
  return settings.loginSettings || DEFAULT_LOGIN_SETTINGS;
}

export function saveLoginSettings(loginSettings: LoginSettings): void {
  const settings = getSettings();
  settings.loginSettings = loginSettings;
  saveSettings(settings);
  writeLog('Update Pengaturan Login', 'SETTING', 'LOGIN_CONFIG', 'Super Admin memperbarui kustomisasi halaman login');
}

// Kategori CRUD
export function getKategori(): Kategori[] {
  initLocalStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.KATEGORI);
  const list: Kategori[] = raw ? JSON.parse(raw) : DEFAULT_KATEGORI;
  return list.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
}

export function saveKategori(kat: Kategori): void {
  const list = getKategori();
  const idx = list.findIndex(k => k.idKategori === kat.idKategori);
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  if (idx >= 0) {
    list[idx] = { ...kat, updatedAt: now };
    writeLog('Edit Kategori', 'KATEGORI', kat.idKategori, `Update kategori ${kat.namaKategori}`);
  } else {
    const newId = 'KAT-' + String(list.length + 1).padStart(3, '0');
    list.push({ ...kat, idKategori: newId, createdAt: now, updatedAt: now });
    writeLog('Tambah Kategori', 'KATEGORI', newId, `Tambah kategori baru ${kat.namaKategori}`);
  }
  localStorage.setItem(STORAGE_KEYS.KATEGORI, JSON.stringify(list));
}

export function deleteKategori(idKategori: string): void {
  const list = getKategori().filter(k => k.idKategori !== idKategori);
  localStorage.setItem(STORAGE_KEYS.KATEGORI, JSON.stringify(list));
  writeLog('Hapus Kategori', 'KATEGORI', idKategori, `Menghapus kategori ID ${idKategori}`);
}

// Program CRUD
export function getProgram(): Program[] {
  initLocalStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.PROGRAM);
  return raw ? JSON.parse(raw) : DEFAULT_PROGRAM;
}

export function saveProgram(prog: Program): void {
  const list = getProgram();
  const idx = list.findIndex(p => p.idProgram === prog.idProgram);
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  if (idx >= 0) {
    list[idx] = { ...prog, updatedAt: now };
    writeLog('Edit Program', 'PROGRAM', prog.idProgram, `Update program ${prog.namaProgram}`);
  } else {
    const newId = 'PRG-' + String(list.length + 1).padStart(3, '0');
    list.push({ ...prog, idProgram: newId, createdAt: now, updatedAt: now });
    writeLog('Tambah Program', 'PROGRAM', newId, `Tambah program ${prog.namaProgram}`);
  }
  localStorage.setItem(STORAGE_KEYS.PROGRAM, JSON.stringify(list));
}

export function deleteProgram(idProgram: string): void {
  const list = getProgram().filter(p => p.idProgram !== idProgram);
  localStorage.setItem(STORAGE_KEYS.PROGRAM, JSON.stringify(list));
  writeLog('Hapus Program', 'PROGRAM', idProgram, `Hapus program ID ${idProgram}`);
}

// PIC / Koordinator Program CRUD
export function getPic(): PicProgram[] {
  initLocalStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.PIC);
  if (!raw) return DEFAULT_PIC;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error parsing PIC from localStorage:', e);
    return DEFAULT_PIC;
  }
}

export function getPicById(idPic: string): PicProgram | undefined {
  return getPic().find(p => p.idPic === idPic);
}

export function savePic(pic: PicProgram): { success: boolean; message: string; data: PicProgram } {
  const list = getPic();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const idx = list.findIndex(p => p.idPic === pic.idPic);

  if (idx >= 0) {
    list[idx] = {
      ...pic,
      updatedAt: now
    };
    localStorage.setItem(STORAGE_KEYS.PIC, JSON.stringify(list));
    writeLog('Edit PIC', 'PIC', pic.idPic, `Update PIC ${pic.namaLengkap} (${pic.jabatan || 'Koordinator'})`);
    return { success: true, message: `Data PIC ${pic.namaLengkap} berhasil diperbarui!`, data: list[idx] };
  } else {
    // Generate sequential ID
    let maxSeq = 0;
    list.forEach(p => {
      if (p.idPic && p.idPic.startsWith('PIC-')) {
        const num = parseInt(p.idPic.replace('PIC-', ''), 10);
        if (!isNaN(num) && num > maxSeq) maxSeq = num;
      }
    });
    const newId = `PIC-${String(maxSeq + 1).padStart(3, '0')}`;
    const newPic: PicProgram = {
      ...pic,
      idPic: newId,
      createdAt: now,
      updatedAt: now
    };
    list.push(newPic);
    localStorage.setItem(STORAGE_KEYS.PIC, JSON.stringify(list));
    writeLog('Tambah PIC', 'PIC', newId, `Tambah PIC baru ${newPic.namaLengkap} (${newPic.jabatan || 'Koordinator'})`);
    return { success: true, message: `PIC baru ${newPic.namaLengkap} berhasil ditambahkan!`, data: newPic };
  }
}

export function deletePic(idPic: string): { success: boolean; message: string } {
  const list = getPic();
  const target = list.find(p => p.idPic === idPic);
  if (!target) {
    return { success: false, message: 'Data PIC tidak ditemukan.' };
  }

  // Check if any participants are assigned to this PIC
  const pesertaList = getPeserta();
  const activeAssigned = pesertaList.filter(
    p => p.idPic === idPic || (p.pic && target.namaLengkap && p.pic.toLowerCase().includes(target.namaLengkap.toLowerCase()))
  );

  if (activeAssigned.length > 0) {
    return {
      success: false,
      message: `Tidak dapat menghapus PIC "${target.namaLengkap}" karena masih terkait dengan ${activeAssigned.length} peserta terdaftar.`
    };
  }

  const updated = list.filter(p => p.idPic !== idPic);
  localStorage.setItem(STORAGE_KEYS.PIC, JSON.stringify(updated));
  writeLog('Hapus PIC', 'PIC', idPic, `Hapus PIC ${target.namaLengkap} (ID: ${idPic})`);
  return { success: true, message: `PIC ${target.namaLengkap} berhasil dihapus dari database.` };
}

// Peserta CRUD & Concurrency ID Protection
export function generateNextIdPeserta(tahun?: number): string {
  const yr = tahun || new Date().getFullYear();
  const pesertaList = getPeserta();
  const prefix = `DPNG-${yr}-`;
  
  let maxSeq = 0;
  pesertaList.forEach(p => {
    if (p.id.startsWith(prefix)) {
      const numPart = parseInt(p.id.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxSeq) {
        maxSeq = numPart;
      }
    }
  });

  return `${prefix}${String(maxSeq + 1).padStart(6, '0')}`;
}

export function checkDuplicate(payload: Partial<Peserta>, excludeId?: string): {
  isDuplicate: boolean;
  field?: string;
  value?: string;
  existingPeserta?: Peserta;
} {
  const list = getPeserta();
  for (const p of list) {
    if (excludeId && p.id === excludeId) continue;

    if (payload.nik && p.nik && payload.nik.trim() === p.nik.trim()) {
      return { isDuplicate: true, field: 'NIK', value: payload.nik, existingPeserta: p };
    }
    if (payload.nip && p.nip && payload.nip.trim() === p.nip.trim()) {
      return { isDuplicate: true, field: 'NIP', value: payload.nip, existingPeserta: p };
    }
    if (payload.email && p.email && payload.email.trim().toLowerCase() === p.email.trim().toLowerCase()) {
      return { isDuplicate: true, field: 'Email', value: payload.email, existingPeserta: p };
    }
    if (payload.nomorRegistrasi && p.nomorRegistrasi && payload.nomorRegistrasi.trim() === p.nomorRegistrasi.trim()) {
      return { isDuplicate: true, field: 'Nomor Registrasi', value: payload.nomorRegistrasi, existingPeserta: p };
    }
  }

  return { isDuplicate: false };
}

export function getPeserta(): Peserta[] {
  initLocalStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.PESERTA);
  return raw ? JSON.parse(raw) : DEFAULT_PESERTA;
}

export function getPesertaById(id: string): Peserta | undefined {
  return getPeserta().find(p => p.id === id);
}

export function createPeserta(
  data: Omit<Peserta, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'statusData'> & { id?: string },
  bypassDuplicate = false
): { success: boolean; message: string; data?: Peserta; duplicateInfo?: ReturnType<typeof checkDuplicate> } {
  if (!bypassDuplicate) {
    const dup = checkDuplicate(data);
    if (dup.isDuplicate) {
      return {
        success: false,
        message: `Peringatan: Data duplikat ditemukan pada ${dup.field} (${dup.value}). Peserta atas nama: ${dup.existingPeserta?.namaLengkap}.`,
        duplicateInfo: dup
      };
    }
  }

  const list = getPeserta();
  const yr = Number(data.tahun) || new Date().getFullYear();
  const newId = String(data.id || generateNextIdPeserta(yr));
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const currentUser = getCurrentUser().email;

  const newPeserta: Peserta = {
    ...(data as Peserta),
    id: newId,
    nomorRegistrasi: data.nomorRegistrasi ? String(data.nomorRegistrasi) : `REG-${yr}-${newId.split('-')[2] || '000001'}`,
    createdAt: now,
    createdBy: currentUser,
    updatedAt: now,
    updatedBy: currentUser,
    statusData: 'Aktif'
  };

  list.unshift(newPeserta);
  localStorage.setItem(STORAGE_KEYS.PESERTA, JSON.stringify(list));
  writeLog('Tambah Peserta', 'PESERTA', newId, `Registrasi peserta ${newPeserta.namaLengkap} (${newPeserta.namaProgram})`);

  return { success: true, message: 'Data peserta berhasil disimpan', data: newPeserta };
}

export function updatePeserta(id: string, data: Partial<Peserta>): { success: boolean; message: string; data?: Peserta } {
  const list = getPeserta();
  const idx = list.findIndex(p => p.id === id);
  if (idx === -1) {
    return { success: false, message: 'Data peserta tidak ditemukan' };
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const currentUser = getCurrentUser().email;

  const updated: Peserta = {
    ...list[idx],
    ...data,
    id,
    updatedAt: now,
    updatedBy: currentUser
  };

  list[idx] = updated;
  localStorage.setItem(STORAGE_KEYS.PESERTA, JSON.stringify(list));
  writeLog('Edit Peserta', 'PESERTA', id, `Update data peserta ${updated.namaLengkap}`);

  return { success: true, message: 'Data peserta berhasil diperbarui', data: updated };
}

export function deletePeserta(id: string): { success: boolean; message: string } {
  const list = getPeserta();
  const target = list.find(p => p.id === id);
  if (!target) {
    return { success: false, message: 'Data peserta tidak ditemukan' };
  }

  const filtered = list.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PESERTA, JSON.stringify(filtered));
  writeLog('Hapus Peserta', 'PESERTA', id, `Hapus peserta: ${target.namaLengkap} (${target.id})`);

  return { success: true, message: 'Data peserta berhasil dihapus' };
}

// Advanced Search
export function advancedSearchPeserta(filters: Partial<AdvancedSearchFilter>): Peserta[] {
  let list = getPeserta();

  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase().trim();
    const op = filters.operator || 'contains';
    const field = filters.field || 'all';

    list = list.filter(p => {
      const checkValue = (val: string | number | undefined) => {
        if (!val) return false;
        const str = String(val).toLowerCase();
        if (op === 'equals') return str === kw;
        if (op === 'startsWith') return str.startsWith(kw);
        if (op === 'endsWith') return str.endsWith(kw);
        return str.includes(kw);
      };

      if (field === 'all') {
        return (
          checkValue(p.namaLengkap) ||
          checkValue(p.nik) ||
          checkValue(p.nip) ||
          checkValue(p.email) ||
          checkValue(p.nomorHp) ||
          checkValue(p.nomorRegistrasi) ||
          checkValue(p.instansi) ||
          checkValue(p.jabatan) ||
          checkValue(p.fakultasUnit) ||
          checkValue(p.namaProgram) ||
          checkValue(p.kategoriProgram) ||
          checkValue(p.nomorSertifikat)
        );
      }

      // Specific field
      return checkValue(((p as unknown) as Record<string, unknown>)[field] as string);
    });
  }

  if (filters.kategori) {
    list = list.filter(p => p.kategoriProgram === filters.kategori);
  }
  if (filters.program) {
    list = list.filter(p => p.namaProgram === filters.program);
  }
  if (filters.tahun) {
    list = list.filter(p => String(p.tahun) === String(filters.tahun));
  }
  if (filters.statusPeserta) {
    list = list.filter(p => p.statusPeserta === filters.statusPeserta);
  }
  if (filters.statusKelulusan) {
    list = list.filter(p => p.statusKelulusan === filters.statusKelulusan);
  }
  if (filters.jenisKelamin) {
    list = list.filter(p => p.jenisKelamin === filters.jenisKelamin);
  }
  if (filters.provinsi) {
    list = list.filter(p => p.provinsi === filters.provinsi);
  }
  if (filters.instansi) {
    list = list.filter(p => p.instansi.toLowerCase().includes(filters.instansi!.toLowerCase()));
  }
  if (filters.nomorSertifikat) {
    list = list.filter(p => p.nomorSertifikat.toLowerCase().includes(filters.nomorSertifikat!.toLowerCase()));
  }
  if (filters.tanggalMulaiStart) {
    list = list.filter(p => p.tanggalMulai >= filters.tanggalMulaiStart!);
  }
  if (filters.tanggalMulaiEnd) {
    list = list.filter(p => p.tanggalMulai <= filters.tanggalMulaiEnd!);
  }

  return list;
}

// Eduventure CRUD Operations
export function getEduventure(): EduventureBooking[] {
  initLocalStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.EDUVENTURE);
  const list: EduventureBooking[] = raw ? JSON.parse(raw) : DEFAULT_EDUVENTURE;
  return list.map(item => ({
    ...item,
    waktuMulai: item.waktuMulai || '08:30',
    waktuSelesai: item.waktuSelesai || '12:00'
  }));
}

// Tempat Penyelenggaraan Management
export function getTempatEduventure(): string[] {
  initLocalStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.TEMPAT_EDUVENTURE);
  const list: string[] = raw ? JSON.parse(raw) : DEFAULT_TEMPAT_EDUVENTURE;

  // Scan existing bookings to ensure any custom venues are available
  const eduList = getEduventure();
  const venueSet = new Set<string>(list);
  eduList.forEach(item => {
    if (item.tempatPenyelenggaraan && item.tempatPenyelenggaraan.trim()) {
      venueSet.add(item.tempatPenyelenggaraan.trim());
    }
  });

  return Array.from(venueSet);
}

export function saveTempatEduventure(tempatList: string[]): void {
  localStorage.setItem(STORAGE_KEYS.TEMPAT_EDUVENTURE, JSON.stringify(tempatList));
}

export function addTempatEduventure(namaTempat: string): string[] {
  const trimmed = namaTempat.trim();
  if (!trimmed) return getTempatEduventure();
  const list = getTempatEduventure();
  if (!list.includes(trimmed)) {
    list.push(trimmed);
    saveTempatEduventure(list);
    writeLog('Tambah Tempat Eduventure', 'EDUVENTURE', trimmed, `Penambahan tempat penyelenggaraan baru: ${trimmed}`);
  }
  return list;
}

export function deleteTempatEduventure(namaTempat: string): string[] {
  const list = getTempatEduventure().filter(t => t !== namaTempat);
  saveTempatEduventure(list);
  writeLog('Hapus Tempat Eduventure', 'EDUVENTURE', namaTempat, `Menghapus tempat penyelenggaraan: ${namaTempat}`);
  return list;
}

export function generateNextIdEduventure(tahun?: number): string {
  const yr = tahun || new Date().getFullYear();
  const list = getEduventure();
  const prefix = `EDV-${yr}-`;

  let maxSeq = 0;
  list.forEach(item => {
    if (item.id && item.id.startsWith(prefix)) {
      const numPart = parseInt(item.id.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxSeq) {
        maxSeq = numPart;
      }
    }
  });

  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
}

export function saveEduventure(booking: EduventureBooking): { success: boolean; message: string; data: EduventureBooking } {
  const list = getEduventure();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const idx = list.findIndex(item => item.id === booking.id);

  if (booking.tempatPenyelenggaraan && booking.tempatPenyelenggaraan.trim()) {
    addTempatEduventure(booking.tempatPenyelenggaraan.trim());
  }

  if (idx >= 0) {
    list[idx] = {
      ...booking,
      updatedAt: now
    };
    localStorage.setItem(STORAGE_KEYS.EDUVENTURE, JSON.stringify(list));
    writeLog('Edit Eduventure', 'EDUVENTURE', booking.id, `Update kunjungan Eduventure ${booking.namaSekolah} (${booking.skemaPaket})`);
    return { success: true, message: `Data kunjungan ${booking.namaSekolah} berhasil diperbarui!`, data: list[idx] };
  } else {
    const yr = new Date(booking.tanggalPelaksanaan || new Date()).getFullYear();
    const newId = booking.id && !booking.id.startsWith('temp-') ? booking.id : generateNextIdEduventure(yr);
    const newBooking: EduventureBooking = {
      ...booking,
      id: newId,
      createdAt: now,
      updatedAt: now
    };
    list.unshift(newBooking);
    localStorage.setItem(STORAGE_KEYS.EDUVENTURE, JSON.stringify(list));
    writeLog('Tambah Eduventure', 'EDUVENTURE', newId, `Daftar kunjungan Eduventure baru ${newBooking.namaSekolah} (${newBooking.skemaPaket})`);
    return { success: true, message: `Pendaftaran kunjungan ${newBooking.namaSekolah} berhasil disimpan!`, data: newBooking };
  }
}

export function deleteEduventure(id: string): { success: boolean; message: string } {
  const list = getEduventure();
  const target = list.find(item => item.id === id);
  if (!target) {
    return { success: false, message: 'Data kunjungan Eduventure tidak ditemukan.' };
  }

  const updated = list.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEYS.EDUVENTURE, JSON.stringify(updated));
  writeLog('Hapus Eduventure', 'EDUVENTURE', id, `Hapus kunjungan ${target.namaSekolah} (ID: ${id})`);
  return { success: true, message: `Kunjungan ${target.namaSekolah} berhasil dihapus.` };
}

export function bulkImportEduventure(
  incomingItems: Array<Omit<EduventureBooking, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }>,
  duplicateHandling: 'skip' | 'update' | 'force' = 'skip'
): { success: boolean; count: number; updatedCount: number; skippedCount: number; message: string; data: EduventureBooking[] } {
  const list = getEduventure();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  
  let count = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  // Track highest ID sequence for auto-generation per year
  const seqMap = new Map<number, number>();
  const getNextBatchId = (yr: number) => {
    if (!seqMap.has(yr)) {
      const prefix = `EDV-${yr}-`;
      let maxSeq = 0;
      list.forEach(item => {
        if (item.id && item.id.startsWith(prefix)) {
          const numPart = parseInt(item.id.replace(prefix, ''), 10);
          if (!isNaN(numPart) && numPart > maxSeq) {
            maxSeq = numPart;
          }
        }
      });
      seqMap.set(yr, maxSeq);
    }
    const currentMax = seqMap.get(yr)! + 1;
    seqMap.set(yr, currentMax);
    return `EDV-${yr}-${String(currentMax).padStart(4, '0')}`;
  };

  for (const item of incomingItems) {
    if (!item.namaSekolah || !item.tanggalPelaksanaan) {
      skippedCount++;
      continue;
    }

    // Match duplicate by ID or (namaSekolah + tanggalPelaksanaan)
    const existingIndex = list.findIndex(existing => {
      if (item.id && !item.id.startsWith('temp-') && existing.id === item.id) return true;
      return (
        existing.namaSekolah.trim().toLowerCase() === item.namaSekolah.trim().toLowerCase() &&
        existing.tanggalPelaksanaan === item.tanggalPelaksanaan
      );
    });

    if (existingIndex >= 0) {
      if (duplicateHandling === 'skip') {
        skippedCount++;
        continue;
      } else if (duplicateHandling === 'update') {
        list[existingIndex] = {
          ...list[existingIndex],
          ...item,
          id: list[existingIndex].id,
          updatedAt: now
        };
        updatedCount++;
        continue;
      }
      // If 'force', fall through to append
    }

    const yr = new Date(item.tanggalPelaksanaan || new Date()).getFullYear() || new Date().getFullYear();
    const newId = item.id && !item.id.startsWith('temp-') ? item.id : getNextBatchId(yr);
    const venueName = item.tempatPenyelenggaraan ? item.tempatPenyelenggaraan.trim() : 'Bale Sawala';
    if (venueName) {
      addTempatEduventure(venueName);
    }

    const newBooking: EduventureBooking = {
      id: newId,
      idKategori: item.idKategori || 'KAT-006',
      namaKategori: item.namaKategori || 'Eduventure',
      namaSekolah: item.namaSekolah.trim(),
      alamat: item.alamat || '',
      kontakPerson: item.kontakPerson || 'Narahubung Sekolah',
      nomorKontak: item.nomorKontak || '-',
      emailKontak: item.emailKontak || '',
      jumlahPeserta: Number(item.jumlahPeserta) || 0,
      jumlahGuru: Number(item.jumlahGuru) || 0,
      tanggalPelaksanaan: item.tanggalPelaksanaan,
      waktuMulai: item.waktuMulai || '08:30',
      waktuSelesai: item.waktuSelesai || '12:00',
      tempatPenyelenggaraan: venueName,
      skemaPaket: item.skemaPaket || 'Eduventure Experience',
      pilihanKunjungan: item.pilihanKunjungan || 'Universitas',
      fakultasTujuan: item.fakultasTujuan || [],
      statusBayar: item.statusBayar || 'Belum',
      buktiTransferUrl: item.buktiTransferUrl,
      buktiTransferNama: item.buktiTransferNama,
      nominalTransfer: Number(item.nominalTransfer) || 0,
      tanggalTransfer: item.tanggalTransfer,
      rekening: item.rekening || 'Eduventure 9882340560200004',
      catatanTambahan: item.catatanTambahan || '',
      statusKunjungan: item.statusKunjungan || 'Menunggu',
      createdAt: now,
      updatedAt: now
    };

    list.unshift(newBooking);
    count++;
  }

  localStorage.setItem(STORAGE_KEYS.EDUVENTURE, JSON.stringify(list));
  writeLog(
    'Import Eduventure',
    'EDUVENTURE',
    `${count + updatedCount} Data`,
    `Import data kunjungan Eduventure via Excel/CSV: ${count} ditambah, ${updatedCount} diperbarui, ${skippedCount} dilewati.`
  );

  return {
    success: true,
    count,
    updatedCount,
    skippedCount,
    message: `Berhasil mengimport data Eduventure! ${count} data baru ditambahkan, ${updatedCount} diperbarui${skippedCount > 0 ? `, ${skippedCount} data dilewati` : ''}.`,
    data: list
  };
}

// Reset / Initialize Database
export function initializeDatabaseToDefaults(): void {
  localStorage.setItem(STORAGE_KEYS.PESERTA, JSON.stringify(DEFAULT_PESERTA));
  localStorage.setItem(STORAGE_KEYS.KATEGORI, JSON.stringify(DEFAULT_KATEGORI));
  localStorage.setItem(STORAGE_KEYS.PROGRAM, JSON.stringify(DEFAULT_PROGRAM));
  localStorage.setItem(STORAGE_KEYS.PIC, JSON.stringify(DEFAULT_PIC));
  localStorage.setItem(STORAGE_KEYS.EDUVENTURE, JSON.stringify(DEFAULT_EDUVENTURE));
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(DEFAULT_GROUPS));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(APP_MENU_DEFINITIONS));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTING));
  
  writeLog('Inisialisasi Database', 'SETUP', 'DEFAULT_SEED', 'Database Google Sheets direset ke struktur awal Unpad (Peserta, Kategori, Program, PIC, Eduventure, Group Akun & Privilege, Menus, Users)');
}

// ==========================================
// MENU MANAGEMENT & RELATIONS (GROUP & USER)
// ==========================================

export function getAppMenus(): AppMenuItemDef[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MENUS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(APP_MENU_DEFINITIONS));
      return APP_MENU_DEFINITIONS;
    }
    const parsed: AppMenuItemDef[] = JSON.parse(raw);
    
    // Pastikan semua menu default ada (misal menu baru seperti menu_manage atau eduventure)
    const existingIds = new Set(parsed.map(m => m.id));
    let hasNew = false;
    APP_MENU_DEFINITIONS.forEach(def => {
      if (!existingIds.has(def.id)) {
        parsed.push(def);
        hasNew = true;
      }
    });

    // Urutkan berdasarkan property urutan jika ada
    parsed.sort((a, b) => (a.urutan || 99) - (b.urutan || 99));

    if (hasNew) {
      localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return APP_MENU_DEFINITIONS;
  }
}

export function saveAppMenu(menu: AppMenuItemDef): { success: boolean; message: string; data?: AppMenuItemDef } {
  const list = getAppMenus();
  const idx = list.findIndex(m => m.id === menu.id);

  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      ...menu,
    };
    localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(list));
    writeLog('Edit Menu', 'MENU', menu.id, `Pembaruan pengaturan menu ${menu.label} (${menu.id})`);
    return { success: true, message: `Menu "${menu.label}" berhasil diperbarui!`, data: list[idx] };
  } else {
    // Menu Baru
    const newMenu: AppMenuItemDef = {
      ...menu,
      urutan: menu.urutan || list.length + 1,
      aktif: menu.aktif !== undefined ? menu.aktif : true,
      isCustom: true
    };
    list.push(newMenu);
    localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(list));

    // Berikan akses otomatis ke group ADMIN untuk menu baru
    const groups = getGroups();
    groups.forEach(g => {
      if (g.id === 'ADMIN') {
        g.privileges[newMenu.id] = {
          canAccess: true,
          canCreate: newMenu.supportedActions.canCreate,
          canEdit: newMenu.supportedActions.canEdit,
          canDelete: newMenu.supportedActions.canDelete,
          canExport: newMenu.supportedActions.canExport
        };
      } else {
        g.privileges[newMenu.id] = {
          canAccess: false,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canExport: false
        };
      }
    });
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));

    writeLog('Tambah Menu', 'MENU', newMenu.id, `Penambahan menu baru "${newMenu.label}" (${newMenu.id})`);
    return { success: true, message: `Menu baru "${newMenu.label}" berhasil ditambahkan!`, data: newMenu };
  }
}

export function deleteAppMenu(menuId: string): { success: boolean; message: string } {
  const list = getAppMenus();
  const target = list.find(m => m.id === menuId);
  if (!target) {
    return { success: false, message: 'Menu tidak ditemukan.' };
  }

  // Lindungi menu sistem utama dari penghapusan total
  const protectedIds = ['dashboard', 'user', 'setting'];
  if (protectedIds.includes(menuId)) {
    return { success: false, message: `Menu "${target.label}" merupakan menu inti sistem dan tidak boleh dihapus.` };
  }

  const updated = list.filter(m => m.id !== menuId);
  localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(updated));

  // Bersihkan juga dari privileges seluruh group
  const groups = getGroups();
  groups.forEach(g => {
    delete g.privileges[menuId];
  });
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));

  // Bersihkan juga dari custom privileges pengguna
  const users = getUsers();
  let usersChanged = false;
  users.forEach(u => {
    if (u.customPrivileges && u.customPrivileges[menuId]) {
      delete u.customPrivileges[menuId];
      usersChanged = true;
    }
  });
  if (usersChanged) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  writeLog('Hapus Menu', 'MENU', menuId, `Menghapus konfigurasi menu ${target.label} (${menuId})`);
  return { success: true, message: `Menu "${target.label}" berhasil dihapus dari sistem.` };
}

export function toggleMenuStatus(menuId: string, aktif: boolean): { success: boolean; message: string } {
  const list = getAppMenus();
  const idx = list.findIndex(m => m.id === menuId);
  if (idx < 0) {
    return { success: false, message: 'Menu tidak ditemukan.' };
  }

  list[idx].aktif = aktif;
  localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(list));
  writeLog('Status Menu', 'MENU', menuId, `Mengubah status menu ${list[idx].label} menjadi ${aktif ? 'Aktif' : 'Nonaktif'}`);
  return { 
    success: true, 
    message: `Menu "${list[idx].label}" kini berstatus ${aktif ? 'Aktif (Tampil di Navigasi)' : 'Nonaktif (Disembunyikan)'}.` 
  };
}

export function updateMenuOrder(orderedIds: string[]): { success: boolean; message: string } {
  const list = getAppMenus();
  const map = new Map(list.map(m => [m.id, m]));
  
  const reordered: AppMenuItemDef[] = [];
  orderedIds.forEach((id, index) => {
    const item = map.get(id);
    if (item) {
      item.urutan = index + 1;
      reordered.push(item);
      map.delete(id);
    }
  });

  // Masukkan sisa menu yang tidak ada di list
  map.forEach((item) => {
    item.urutan = reordered.length + 1;
    reordered.push(item);
  });

  localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(reordered));
  writeLog('Urutan Menu', 'MENU', 'REORDER', 'Memperbarui urutan susunan menu aplikasi');
  return { success: true, message: 'Urutan menu navigasi berhasil diperbarui!' };
}

export function resetMenusToDefault(): void {
  localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(APP_MENU_DEFINITIONS));
  writeLog('Reset Menu', 'MENU', 'DEFAULT', 'Mengembalikan seluruh konfigurasi menu ke standar Unpad');
}

// Hubungkan Menu ke Group Akun
export function updateMenuGroupsAccess(
  menuId: string, 
  groupPrivilegeMap: Record<string, MenuPrivilege>
): { success: boolean; message: string } {
  const groups = getGroups();
  let updatedCount = 0;

  groups.forEach(g => {
    if (groupPrivilegeMap[g.id]) {
      g.privileges[menuId] = { ...groupPrivilegeMap[g.id] };
      g.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
      updatedCount++;
    }
  });

  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  writeLog('Relasi Menu-Group', 'MENU_GROUP', menuId, `Pembaruan hak akses ${updatedCount} group akun untuk menu ${menuId}`);
  return { success: true, message: `Hak akses menu berhasil disinkronkan ke ${updatedCount} Group Akun!` };
}

// Hubungkan Menu ke User Pengguna (User-Level Custom Privilege Override)
export function updateUserMenuOverride(
  userId: string, 
  menuId: string, 
  override: Partial<MenuPrivilege> | null
): { success: boolean; message: string } {
  const users = getUsers();
  const target = users.find(u => u.userId === userId);
  if (!target) {
    return { success: false, message: 'Pengguna tidak ditemukan.' };
  }

  if (!target.customPrivileges) {
    target.customPrivileges = {};
  }

  if (override === null) {
    // Hapus override (kembali ikut group)
    delete target.customPrivileges[menuId];
    if (Object.keys(target.customPrivileges).length === 0) {
      delete target.customPrivileges;
    }
    writeLog('Reset Privilege User', 'USER_MENU', userId, `Reset override menu ${menuId} pada user ${target.nama} (kembali ikuti Group)`);
  } else {
    // Set custom override
    target.customPrivileges[menuId] = {
      ...(target.customPrivileges[menuId] || {}),
      ...override
    };
    writeLog('Override Privilege User', 'USER_MENU', userId, `Atur hak khusus menu ${menuId} pada user ${target.nama}`);
  }

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

  // Jika user aktif yang diubah, perbarui active user session
  const activeUser = getCurrentUser();
  if (activeUser.userId === userId) {
    const updatedActive = { ...activeUser, customPrivileges: target.customPrivileges };
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(updatedActive));
  }

  return { 
    success: true, 
    message: override === null 
      ? `Hak akses user ${target.nama} dikembalikan mengikuti Group Akun.` 
      : `Hak akses khusus untuk user ${target.nama} pada menu ini berhasil disimpan!` 
  };
}

// Batch Update User Overrides untuk satu Menu
export function batchUpdateUserMenuOverrides(
  menuId: string, 
  userOverrides: Record<string, Partial<MenuPrivilege> | null>
): { success: boolean; message: string } {
  const users = getUsers();
  let changed = 0;

  users.forEach(u => {
    if (u.userId in userOverrides) {
      const ov = userOverrides[u.userId];
      if (!u.customPrivileges) u.customPrivileges = {};

      if (ov === null) {
        delete u.customPrivileges[menuId];
        if (Object.keys(u.customPrivileges).length === 0) {
          delete u.customPrivileges;
        }
      } else {
        u.customPrivileges[menuId] = {
          ...(u.customPrivileges[menuId] || {}),
          ...ov
        };
      }
      changed++;
    }
  });

  if (changed > 0) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    writeLog('Batch Override User Menu', 'USER_MENU', menuId, `Update hak khusus menu ${menuId} pada ${changed} pengguna`);
  }

  return { success: true, message: `Hak akses ${changed} pengguna berhasil disimpan!` };
}

// Terapkan Template Hak Akses Role Bawaan ke Group Akun
export function applyRolePresetToGroup(
  groupId: string, 
  presetKey: 'ADMIN' | 'OPERATOR' | 'VIEWER' | 'KEUANGAN' | 'KOORDINATOR_PROGRAM'
): { success: boolean; message: string } {
  const groups = getGroups();
  const targetGroup = groups.find(g => g.id === groupId);
  if (!targetGroup) {
    return { success: false, message: 'Group Akun tidak ditemukan.' };
  }

  const preset = ROLE_PRESET_MAP[presetKey];
  if (!preset) {
    return { success: false, message: `Template role "${presetKey}" tidak valid.` };
  }

  targetGroup.privileges = JSON.parse(JSON.stringify(preset));
  targetGroup.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  writeLog('Terapkan Preset Role', 'MENU_GROUP', groupId, `Menerapkan template role ${presetKey} ke Group ${targetGroup.namaGroup}`);

  return { success: true, message: `Berhasil menerapkan template hak akses "${presetKey}" ke Group "${targetGroup.namaGroup}"!` };
}

// Toggle Akses Menu Tunggal untuk Group Akun
export function toggleGroupMenuAccess(
  groupId: string, 
  menuId: string, 
  canAccess: boolean
): { success: boolean; message: string } {
  const groups = getGroups();
  const targetGroup = groups.find(g => g.id === groupId);
  if (!targetGroup) {
    return { success: false, message: 'Group Akun tidak ditemukan.' };
  }

  if (!targetGroup.privileges) {
    targetGroup.privileges = {};
  }

  if (!targetGroup.privileges[menuId]) {
    targetGroup.privileges[menuId] = {
      canAccess,
      canCreate: canAccess,
      canEdit: canAccess,
      canDelete: canAccess,
      canExport: canAccess
    };
  } else {
    targetGroup.privileges[menuId].canAccess = canAccess;
  }

  targetGroup.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));

  return { 
    success: true, 
    message: `Akses menu "${menuId}" untuk group "${targetGroup.namaGroup}" ${canAccess ? 'diaktifkan' : 'dinonaktifkan'}.` 
  };
}

// Reset Semua Override Khusus pada Pengguna (kembali 100% mengikuti Group Akun)
export function resetUserPrivilegeOverrides(userId: string): { success: boolean; message: string } {
  const users = getUsers();
  const target = users.find(u => u.userId === userId);
  if (!target) {
    return { success: false, message: 'Pengguna tidak ditemukan.' };
  }

  delete target.customPrivileges;
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

  const activeUser = getCurrentUser();
  if (activeUser.userId === userId) {
    delete activeUser.customPrivileges;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(activeUser));
  }

  writeLog('Reset Override User', 'USER_MENU', userId, `Reset seluruh custom privilege pada user ${target.nama}`);
  return { success: true, message: `Seluruh hak khusus user ${target.nama} telah direset. Akses sekarang 100% mengikuti Group Akun.` };
}

// Set Langsung Akses Menu untuk User (Override CanAccess)
export function setUserMenuAccessOverride(
  userId: string, 
  menuId: string, 
  canAccess: boolean
): { success: boolean; message: string } {
  return updateUserMenuOverride(userId, menuId, { canAccess });
}

// ==========================================
// BACKUP & RESTORE DATA SERVICES
// ==========================================

export function generateSystemBackup(
  currentUser?: UserItem,
  includedModules?: Record<string, boolean>,
  description?: string
): SimpendikBackupPayload {
  const isIncluded = (mod: string) => !includedModules || includedModules[mod] !== false;

  const peserta = isIncluded('peserta') ? getPeserta() : [];
  const kategori = isIncluded('kategori') ? getKategori() : [];
  const program = isIncluded('program') ? getProgram() : [];
  const pic = isIncluded('pic') ? getPic() : [];
  const eduventure = isIncluded('eduventure') ? getEduventure() : [];
  const tempatEduventure = isIncluded('tempatEduventure') ? getTempatEduventure() : [];
  const users = isIncluded('users') ? getUsers() : [];
  const groups = isIncluded('groups') ? getGroups() : [];
  const menus = isIncluded('menus') ? getAppMenus() : [];
  const logs = isIncluded('logs') ? getLogs() : [];
  const settings = isIncluded('settings') ? getSettings() : undefined;
  const theme = isIncluded('theme') ? getAppTheme() : undefined;

  const summary: SimpendikBackupSummary = {
    totalPeserta: peserta.length,
    totalKategori: kategori.length,
    totalProgram: program.length,
    totalPic: pic.length,
    totalEduventure: eduventure.length,
    totalTempatEduventure: tempatEduventure.length,
    totalUsers: users.length,
    totalGroups: groups.length,
    totalMenus: menus.length,
    totalLogs: logs.length,
  };

  const activeUser = currentUser || getCurrentUser();

  const payload: SimpendikBackupPayload = {
    version: '2.4.0',
    app: 'SIMPENDIK DPNG UNPAD',
    createdAt: new Date().toISOString(),
    createdBy: {
      userId: activeUser.userId,
      nama: activeUser.nama,
      email: activeUser.email,
      role: activeUser.role,
    },
    summary,
    data: {
      peserta,
      kategori,
      program,
      pic,
      eduventure,
      tempatEduventure,
      users,
      groups,
      menus,
      logs,
      settings,
      theme,
    },
    description: description || 'Cadangan data operasional dan konfigurasi sistem SIMPENDIK UNPAD'
  };

  // Generate simple checksum
  const jsonStr = JSON.stringify(payload.data);
  let hash = 0;
  for (let i = 0; i < jsonStr.length; i++) {
    hash = ((hash << 5) - hash) + jsonStr.charCodeAt(i);
    hash |= 0;
  }
  payload.checksum = `UNPAD-CRC-${Math.abs(hash).toString(16).toUpperCase()}-${jsonStr.length}`;

  writeLog(
    'Backup Database',
    'BACKUP_RESTORE',
    'ALL',
    `Unduh berkas cadangan database (${summary.totalPeserta} peserta, ${summary.totalEduventure} eduventure, ${summary.totalUsers} pengguna)`
  );

  return payload;
}

export function validateBackupFile(rawJson: string): { 
  valid: boolean; 
  error?: string; 
  payload?: SimpendikBackupPayload 
} {
  try {
    if (!rawJson || typeof rawJson !== 'string') {
      return { valid: false, error: 'Konten file cadangan kosong atau tidak valid.' };
    }

    const parsed = JSON.parse(rawJson);

    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Format berkas bukan merupakan objek JSON yang valid.' };
    }

    // Periksa apakah ini payload standar SIMPENDIK atau raw object
    const isStandardSimpendik = parsed.app && parsed.app.includes('SIMPENDIK') && parsed.data;
    const dataObj: SimpendikBackupData = isStandardSimpendik ? parsed.data : parsed;

    if (!dataObj || typeof dataObj !== 'object') {
      return { valid: false, error: 'Struktur data cadangan tidak ditemukan di dalam berkas.' };
    }

    // Pastikan setidaknya ada salah satu modul utama
    const hasAnyModule = 
      Array.isArray(dataObj.peserta) ||
      Array.isArray(dataObj.kategori) ||
      Array.isArray(dataObj.program) ||
      Array.isArray(dataObj.eduventure) ||
      Array.isArray(dataObj.users);

    if (!hasAnyModule) {
      return { valid: false, error: 'Berkas JSON tidak memiliki entitas data SIMPENDIK (Peserta, Program, Kategori, atau Eduventure).' };
    }

    const normalizedSummary: SimpendikBackupSummary = {
      totalPeserta: Array.isArray(dataObj.peserta) ? dataObj.peserta.length : 0,
      totalKategori: Array.isArray(dataObj.kategori) ? dataObj.kategori.length : 0,
      totalProgram: Array.isArray(dataObj.program) ? dataObj.program.length : 0,
      totalPic: Array.isArray(dataObj.pic) ? dataObj.pic.length : 0,
      totalEduventure: Array.isArray(dataObj.eduventure) ? dataObj.eduventure.length : 0,
      totalTempatEduventure: Array.isArray(dataObj.tempatEduventure) ? dataObj.tempatEduventure.length : 0,
      totalUsers: Array.isArray(dataObj.users) ? dataObj.users.length : 0,
      totalGroups: Array.isArray(dataObj.groups) ? dataObj.groups.length : 0,
      totalMenus: Array.isArray(dataObj.menus) ? dataObj.menus.length : 0,
      totalLogs: Array.isArray(dataObj.logs) ? dataObj.logs.length : 0,
    };

    const validatedPayload: SimpendikBackupPayload = {
      version: parsed.version || '2.0.0',
      app: parsed.app || 'SIMPENDIK DPNG UNPAD',
      createdAt: parsed.createdAt || new Date().toISOString(),
      createdBy: parsed.createdBy || {
        userId: 'EXTERNAL',
        nama: 'File Backup Eksternal',
        email: 'system@unpad.ac.id',
        role: 'ADMIN',
      },
      summary: parsed.summary || normalizedSummary,
      data: {
        peserta: Array.isArray(dataObj.peserta) ? dataObj.peserta : [],
        kategori: Array.isArray(dataObj.kategori) ? dataObj.kategori : [],
        program: Array.isArray(dataObj.program) ? dataObj.program : [],
        pic: Array.isArray(dataObj.pic) ? dataObj.pic : [],
        eduventure: Array.isArray(dataObj.eduventure) ? dataObj.eduventure : [],
        tempatEduventure: Array.isArray(dataObj.tempatEduventure) ? dataObj.tempatEduventure : [],
        users: Array.isArray(dataObj.users) ? dataObj.users : [],
        groups: Array.isArray(dataObj.groups) ? dataObj.groups : [],
        menus: Array.isArray(dataObj.menus) ? dataObj.menus : [],
        logs: Array.isArray(dataObj.logs) ? dataObj.logs : [],
        settings: dataObj.settings,
        theme: dataObj.theme,
      },
      checksum: parsed.checksum,
      description: parsed.description,
    };

    return { valid: true, payload: validatedPayload };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Kesalahan parsing JSON.';
    return { valid: false, error: `Berkas JSON rusak atau tidak terbaca: ${msg}` };
  }
}

export function restoreSystemBackup(
  backup: SimpendikBackupPayload,
  options?: {
    mode?: RestoreMode;
    keepActiveSession?: boolean;
    selectedModules?: string[];
    operatorUser?: UserItem;
  }
): { success: boolean; message: string; details: { restoredCounts: Record<string, number> } } {
  const mode = options?.mode || 'replace';
  const keepSession = options?.keepActiveSession !== false;
  const operator = options?.operatorUser || getCurrentUser();
  const selected = options?.selectedModules;

  const shouldRestore = (mod: string) => !selected || selected.includes(mod);

  // Buat safety snapshot otomatis sebelum perubahan dieksekusi!
  try {
    createSafetySnapshot('Auto Safety Snapshot (Sebelum Restore Data)', operator, true);
  } catch (err) {
    console.warn('Gagal membuat safety snapshot sebelum restore:', err);
  }

  const restoredCounts: Record<string, number> = {};

  // 1. PESERTA
  if (shouldRestore('peserta') && backup.data.peserta) {
    if (mode === 'replace') {
      localStorage.setItem(STORAGE_KEYS.PESERTA, JSON.stringify(backup.data.peserta));
      restoredCounts.peserta = backup.data.peserta.length;
    } else {
      const current = getPeserta();
      const currentMap = new Map(current.map(p => [p.id, p]));
      backup.data.peserta.forEach(p => {
        currentMap.set(p.id, { ...(currentMap.get(p.id) || {}), ...p });
      });
      const merged = Array.from(currentMap.values());
      localStorage.setItem(STORAGE_KEYS.PESERTA, JSON.stringify(merged));
      restoredCounts.peserta = merged.length;
    }
  }

  // 2. KATEGORI
  if (shouldRestore('kategori') && backup.data.kategori) {
    if (mode === 'replace') {
      localStorage.setItem(STORAGE_KEYS.KATEGORI, JSON.stringify(backup.data.kategori));
      restoredCounts.kategori = backup.data.kategori.length;
    } else {
      const current = getKategori();
      const currentMap = new Map(current.map(k => [k.idKategori, k]));
      backup.data.kategori.forEach(k => currentMap.set(k.idKategori, { ...(currentMap.get(k.idKategori) || {}), ...k }));
      const merged = Array.from(currentMap.values());
      localStorage.setItem(STORAGE_KEYS.KATEGORI, JSON.stringify(merged));
      restoredCounts.kategori = merged.length;
    }
  }

  // 3. PROGRAM
  if (shouldRestore('program') && backup.data.program) {
    if (mode === 'replace') {
      localStorage.setItem(STORAGE_KEYS.PROGRAM, JSON.stringify(backup.data.program));
      restoredCounts.program = backup.data.program.length;
    } else {
      const current = getProgram();
      const currentMap = new Map(current.map(pr => [pr.idProgram, pr]));
      backup.data.program.forEach(pr => currentMap.set(pr.idProgram, { ...(currentMap.get(pr.idProgram) || {}), ...pr }));
      const merged = Array.from(currentMap.values());
      localStorage.setItem(STORAGE_KEYS.PROGRAM, JSON.stringify(merged));
      restoredCounts.program = merged.length;
    }
  }

  // 4. PIC
  if (shouldRestore('pic') && backup.data.pic) {
    if (mode === 'replace') {
      localStorage.setItem(STORAGE_KEYS.PIC, JSON.stringify(backup.data.pic));
      restoredCounts.pic = backup.data.pic.length;
    } else {
      const current = getPic();
      const currentMap = new Map(current.map(pi => [pi.idPic, pi]));
      backup.data.pic.forEach(pi => currentMap.set(pi.idPic, { ...(currentMap.get(pi.idPic) || {}), ...pi }));
      const merged = Array.from(currentMap.values());
      localStorage.setItem(STORAGE_KEYS.PIC, JSON.stringify(merged));
      restoredCounts.pic = merged.length;
    }
  }

  // 5. EDUVENTURE
  if (shouldRestore('eduventure') && backup.data.eduventure) {
    if (mode === 'replace') {
      localStorage.setItem(STORAGE_KEYS.EDUVENTURE, JSON.stringify(backup.data.eduventure));
      restoredCounts.eduventure = backup.data.eduventure.length;
    } else {
      const current = getEduventure();
      const currentMap = new Map(current.map(e => [e.id, e]));
      backup.data.eduventure.forEach(e => currentMap.set(e.id, { ...(currentMap.get(e.id) || {}), ...e }));
      const merged = Array.from(currentMap.values());
      localStorage.setItem(STORAGE_KEYS.EDUVENTURE, JSON.stringify(merged));
      restoredCounts.eduventure = merged.length;
    }
  }

  // 6. TEMPAT EDUVENTURE
  if (shouldRestore('tempatEduventure') && backup.data.tempatEduventure) {
    if (mode === 'replace') {
      localStorage.setItem(STORAGE_KEYS.TEMPAT_EDUVENTURE, JSON.stringify(backup.data.tempatEduventure));
      restoredCounts.tempatEduventure = backup.data.tempatEduventure.length;
    } else {
      const current = getTempatEduventure();
      const merged = Array.from(new Set([...current, ...backup.data.tempatEduventure]));
      localStorage.setItem(STORAGE_KEYS.TEMPAT_EDUVENTURE, JSON.stringify(merged));
      restoredCounts.tempatEduventure = merged.length;
    }
  }

  // 7. USERS
  if (shouldRestore('users') && backup.data.users && backup.data.users.length > 0) {
    const active = getCurrentUser();
    let finalUsers = [...backup.data.users];

    if (mode === 'merge') {
      const current = getUsers();
      const userMap = new Map(current.map(u => [u.userId, u]));
      backup.data.users.forEach(u => userMap.set(u.userId, { ...(userMap.get(u.userId) || {}), ...u }));
      finalUsers = Array.from(userMap.values());
    }

    if (keepSession && active) {
      // Pastikan user aktif tetap ada di daftar users
      const exists = finalUsers.find(u => u.userId === active.userId);
      if (!exists) {
        finalUsers.push(active);
      }
    }

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(finalUsers));
    restoredCounts.users = finalUsers.length;
  }

  // 8. GROUPS
  if (shouldRestore('groups') && backup.data.groups && backup.data.groups.length > 0) {
    if (mode === 'replace') {
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(backup.data.groups));
      restoredCounts.groups = backup.data.groups.length;
    } else {
      const current = getGroups();
      const groupMap = new Map(current.map(g => [g.id, g]));
      backup.data.groups.forEach(g => groupMap.set(g.id, { ...(groupMap.get(g.id) || {}), ...g }));
      const merged = Array.from(groupMap.values());
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(merged));
      restoredCounts.groups = merged.length;
    }
  }

  // 9. MENUS
  if (shouldRestore('menus') && backup.data.menus && backup.data.menus.length > 0) {
    if (mode === 'replace') {
      localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(backup.data.menus));
      restoredCounts.menus = backup.data.menus.length;
    } else {
      const current = getAppMenus();
      const menuMap = new Map(current.map(m => [m.id, m]));
      backup.data.menus.forEach(m => menuMap.set(m.id, { ...(menuMap.get(m.id) || {}), ...m }));
      const merged = Array.from(menuMap.values());
      localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(merged));
      restoredCounts.menus = merged.length;
    }
  }

  // 10. LOGS
  if (shouldRestore('logs') && backup.data.logs) {
    if (mode === 'replace') {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(backup.data.logs));
      restoredCounts.logs = backup.data.logs.length;
    } else {
      const current = getLogs();
      const logMap = new Map(current.map(l => [l.id, l]));
      backup.data.logs.forEach(l => logMap.set(l.id, l));
      const merged = Array.from(logMap.values());
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(merged));
      restoredCounts.logs = merged.length;
    }
  }

  // 11. SETTINGS
  if (shouldRestore('settings') && backup.data.settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(backup.data.settings));
    restoredCounts.settings = 1;
  }

  // 12. THEME
  if (shouldRestore('theme') && backup.data.theme) {
    setAppTheme(backup.data.theme);
    restoredCounts.theme = 1;
  }

  writeLog(
    'Restore Database',
    'BACKUP_RESTORE',
    'ALL',
    `Pemulihan data sistem berhasil (Mode: ${mode === 'replace' ? 'Timpa Bersih' : 'Penggabungan/Merge'}, Berkas: ${backup.createdAt})`
  );

  return {
    success: true,
    message: `Data sistem berhasil dipulihkan dalam mode ${mode === 'replace' ? 'Timpa Bersih' : 'Penggabungan Cerdas'}.`,
    details: { restoredCounts }
  };
}

// ==========================================
// LOCAL QUICK SNAPSHOT MANAGEMENT
// ==========================================

export function getSnapshots(): BackupSnapshotItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function createSafetySnapshot(
  label: string, 
  currentUser?: UserItem, 
  isAutoSafety: boolean = false
): BackupSnapshotItem {
  const activeUser = currentUser || getCurrentUser();
  const backupPayload = generateSystemBackup(activeUser, undefined, label);

  const payloadString = JSON.stringify(backupPayload);
  const sizeBytes = new Blob([payloadString]).size;
  const now = new Date();
  const id = `SNAP-${now.toISOString().replace(/[-:T.]/g, '').substring(0, 14)}`;

  const totalRecords = 
    backupPayload.summary.totalPeserta + 
    backupPayload.summary.totalEduventure + 
    backupPayload.summary.totalProgram + 
    backupPayload.summary.totalUsers;

  const newSnapshot: BackupSnapshotItem = {
    id,
    timestamp: now.toISOString(),
    label: label || `Snapshot ${now.toLocaleString('id-ID')}`,
    creatorName: activeUser.nama,
    creatorRole: activeUser.role,
    recordCount: totalRecords,
    sizeBytes,
    payload: backupPayload,
    isAutoSafety
  };

  const existing = getSnapshots();
  // Simpan maksimal 15 snapshot terbaru agar tidak memenuhi quota localStorage
  const updated = [newSnapshot, ...existing].slice(0, 15);
  localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(updated));

  writeLog(
    'Buat Snapshot',
    'BACKUP_RESTORE',
    id,
    `Membuat snapshot lokal "${newSnapshot.label}" (${totalRecords} entitas data)`
  );

  return newSnapshot;
}

export function restoreSnapshot(
  snapshotId: string, 
  currentUser?: UserItem
): { success: boolean; message: string } {
  const snapshots = getSnapshots();
  const target = snapshots.find(s => s.id === snapshotId);

  if (!target) {
    return { success: false, message: 'Snapshot tidak ditemukan.' };
  }

  const result = restoreSystemBackup(target.payload, {
    mode: 'replace',
    keepActiveSession: true,
    operatorUser: currentUser
  });

  if (result.success) {
    writeLog(
      'Rollback Snapshot',
      'BACKUP_RESTORE',
      snapshotId,
      `Memulihkan kondisi database ke snapshot "${target.label}" (${target.timestamp})`
    );
    return { success: true, message: `Berhasil me-rollback sistem ke snapshot: "${target.label}".` };
  }

  return { success: false, message: result.message };
}

export function deleteSnapshot(snapshotId: string): { success: boolean; message: string } {
  const snapshots = getSnapshots();
  const filtered = snapshots.filter(s => s.id !== snapshotId);
  localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(filtered));
  return { success: true, message: 'Snapshot berhasil dihapus.' };
}

export function clearAllSnapshots(): { success: boolean; message: string } {
  localStorage.removeItem(STORAGE_KEYS.SNAPSHOTS);
  return { success: true, message: 'Seluruh snapshot lokal telah dibersihkan.' };
}

export function getSystemStorageStats(): {
  totalBytes: number;
  formattedSize: string;
  moduleStats: Record<string, { count: number; bytes: number }>;
} {
  const stats: Record<string, { count: number; bytes: number }> = {};
  let total = 0;

  const measure = (key: string, name: string, count: number) => {
    const raw = localStorage.getItem(key) || '';
    const bytes = new Blob([raw]).size;
    total += bytes;
    stats[name] = { count, bytes };
  };

  measure(STORAGE_KEYS.PESERTA, 'peserta', getPeserta().length);
  measure(STORAGE_KEYS.EDUVENTURE, 'eduventure', getEduventure().length);
  measure(STORAGE_KEYS.PROGRAM, 'program', getProgram().length);
  measure(STORAGE_KEYS.KATEGORI, 'kategori', getKategori().length);
  measure(STORAGE_KEYS.PIC, 'pic', getPic().length);
  measure(STORAGE_KEYS.USERS, 'users', getUsers().length);
  measure(STORAGE_KEYS.GROUPS, 'groups', getGroups().length);
  measure(STORAGE_KEYS.MENUS, 'menus', getAppMenus().length);
  measure(STORAGE_KEYS.LOGS, 'logs', getLogs().length);
  measure(STORAGE_KEYS.SNAPSHOTS, 'snapshots', getSnapshots().length);

  const formatted = total > 1048576 
    ? `${(total / 1048576).toFixed(2)} MB` 
    : `${(total / 1024).toFixed(1)} KB`;

  return {
    totalBytes: total,
    formattedSize: formatted,
    moduleStats: stats
  };
}


