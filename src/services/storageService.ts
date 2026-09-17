import { 
  Peserta, Kategori, Program, UserItem, LogAktivitas, SettingApp, 
  AdvancedSearchFilter, UserRole 
} from '../types';
import { 
  DEFAULT_KATEGORI, DEFAULT_PROGRAM, DEFAULT_PESERTA, 
  DEFAULT_USERS, DEFAULT_LOGS, DEFAULT_SETTING 
} from '../data/initialData';

const STORAGE_KEYS = {
  PESERTA: 'simpendik_unpad_peserta',
  KATEGORI: 'simpendik_unpad_kategori',
  PROGRAM: 'simpendik_unpad_program',
  USERS: 'simpendik_unpad_users',
  LOGS: 'simpendik_unpad_logs',
  SETTINGS: 'simpendik_unpad_settings',
  ACTIVE_USER: 'simpendik_unpad_active_user',
  IS_LOGGED_IN: 'simpendik_unpad_is_logged_in',
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
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  } else {
    // Pastikan user memiliki kata sandi jika belum ada
    try {
      const storedUsers: UserItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      let updated = false;
      const patched = storedUsers.map(u => {
        if (!u.password) {
          updated = true;
          return {
            ...u,
            password: u.role === 'ADMIN' ? 'admin123' : u.role === 'OPERATOR' ? 'operator123' : 'viewer123'
          };
        }
        return u;
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
  return raw ? JSON.parse(raw) : DEFAULT_SETTING;
}

export function saveSettings(settings: SettingApp): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  writeLog('Update Pengaturan', 'SETTING', 'APP_CONFIG', 'Konfigurasi aplikasi disimpan');
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

// Reset / Initialize Database
export function initializeDatabaseToDefaults(): void {
  localStorage.setItem(STORAGE_KEYS.PESERTA, JSON.stringify(DEFAULT_PESERTA));
  localStorage.setItem(STORAGE_KEYS.KATEGORI, JSON.stringify(DEFAULT_KATEGORI));
  localStorage.setItem(STORAGE_KEYS.PROGRAM, JSON.stringify(DEFAULT_PROGRAM));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTING));
  
  writeLog('Inisialisasi Database', 'SETUP', 'DEFAULT_SEED', 'Database Google Sheets direset ke struktur awal');
}
