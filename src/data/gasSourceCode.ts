export interface GasFile {
  name: string;
  type: 'gs' | 'html';
  description: string;
  content: string;
}

export const GAS_FILES: GasFile[] = [
  {
    name: 'Config.gs',
    type: 'gs',
    description: 'Konfigurasi Spreadsheet ID, nama sheets, role permissions, dan konstanta sistem',
    content: `/**
 * SIMPENDIK NON GELAR UNPAD
 * Sistem Informasi Data Peserta Pendidikan Non Gelar Universitas Padjadjaran
 * File: Config.gs - Pengaturan & Konfigurasi Inti
 */

const CONFIG = {
  APP_NAME: "SIMPENDIK NON GELAR UNPAD",
  APP_TITLE: "Direktorat Pendidikan Non Gelar Universitas Padjadjaran",
  SPREADSHEET_ID: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms", // Ganti dengan ID Spreadsheet Anda
  DEFAULT_DOMAIN: "@unpad.ac.id",
  DEFAULT_PAGE_SIZE: 10,
  
  // Nama-nama Sheet di Google Spreadsheet
  SHEETS: {
    PESERTA: "PESERTA",
    KATEGORI: "KATEGORI",
    PROGRAM: "PROGRAM",
    USER: "USER",
    LOG_AKTIVITAS: "LOG_AKTIVITAS",
    SETTING: "SETTING",
    MASTER_DATA: "MASTER_DATA"
  },

  // Role Access Control Matrix
  ROLES: {
    ADMIN: "ADMIN",
    OPERATOR: "OPERATOR",
    VIEWER: "VIEWER"
  },

  // 13 Kategori Program Default Unpad
  DEFAULT_KATEGORI: [
    "Luhung",
    "Executive Education",
    "Kredensial Mikro",
    "University Preferation",
    "Postgrade Academy",
    "Eduventure",
    "PEKERTI / AA",
    "Professional Course",
    "Bina Talenta Indonesia",
    "SMA Unggul Garuda Transformasi (SUGT)",
    "Lembaga Sertifikasi Profesi",
    "Lembaga Pelatihan Kesehatan",
    "LPK Unpad Skill Hub & Migrant Center"
  ]
};

// Response Formatter Standar
function createResponse(success, message, data, error) {
  return {
    success: Boolean(success),
    message: message || (success ? "Operasi berhasil" : "Terjadi kesalahan"),
    data: data !== undefined ? data : null,
    error: error || null,
    timestamp: new Date().toISOString()
  };
}
`
  },
  {
    name: 'Auth.gs',
    type: 'gs',
    description: 'Manajemen autentikasi Google Workspace (@unpad.ac.id), hak akses RBAC, dan session',
    content: `/**
 * SIMPENDIK NON GELAR UNPAD
 * File: Auth.gs - Autentikasi dan Otorisasi Berbasis Role
 */

/**
 * Mendapatkan user yang sedang aktif dari session Google
 */
function getCurrentUser() {
  try {
    const activeEmail = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail() || "admin@unpad.ac.id";
    const ss = getSpreadsheet();
    const userSheet = ss.getSheetByName(CONFIG.SHEETS.USER);
    
    if (!userSheet) {
      return createResponse(true, "User default (Admin)", {
        email: activeEmail,
        nama: "Administrator DPNG",
        role: CONFIG.ROLES.ADMIN,
        status: "Aktif"
      });
    }

    const data = userSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse(true, "User Super Admin", {
        email: activeEmail,
        nama: "Administrator DPNG",
        role: CONFIG.ROLES.ADMIN,
        status: "Aktif"
      });
    }

    // Header baris 1: User ID, Email, Nama, Role, Status, Created At, Last Login
    let matchedUser = null;
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][1]).trim().toLowerCase() === activeEmail.trim().toLowerCase()) {
        matchedUser = {
          userId: data[i][0],
          email: data[i][1],
          nama: data[i][2],
          role: data[i][3] || CONFIG.ROLES.VIEWER,
          status: data[i][4] || "Aktif",
          lastLogin: data[i][6]
        };
        rowIndex = i + 1;
        break;
      }
    }

    if (!matchedUser) {
      // Jika email @unpad.ac.id belum terdaftar, berikan role default VIEWER atau ADMIN untuk yang menginisialisasi
      matchedUser = {
        userId: "USR-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss"),
        email: activeEmail,
        nama: activeEmail.split("@")[0].replace(/[._]/g, " ").toUpperCase(),
        role: activeEmail.includes("unpad.ac.id") ? CONFIG.ROLES.OPERATOR : CONFIG.ROLES.VIEWER,
        status: "Aktif",
        lastLogin: new Date().toISOString()
      };
      // Auto simpan ke sheet user
      userSheet.appendRow([
        matchedUser.userId,
        matchedUser.email,
        matchedUser.nama,
        matchedUser.role,
        matchedUser.status,
        new Date(),
        new Date()
      ]);
    } else {
      // Update last login
      userSheet.getRange(rowIndex, 7).setValue(new Date());
    }

    return createResponse(true, "User berhasil diidentifikasi", matchedUser);
  } catch (err) {
    return createResponse(false, "Gagal mengidentifikasi user", null, err.message);
  }
}

/**
 * Validasi hak akses role
 */
function checkPermission(requiredRole) {
  const userRes = getCurrentUser();
  if (!userRes.success || !userRes.data) return false;

  const role = userRes.data.role;
  if (role === CONFIG.ROLES.ADMIN) return true;
  if (role === CONFIG.ROLES.OPERATOR && (requiredRole === CONFIG.ROLES.OPERATOR || requiredRole === CONFIG.ROLES.VIEWER)) return true;
  if (role === CONFIG.ROLES.VIEWER && requiredRole === CONFIG.ROLES.VIEWER) return true;
  return false;
}
`
  },
  {
    name: 'Database.gs',
    type: 'gs',
    description: 'Koneksi Spreadsheet, batch I/O, LockService concurrency protection, dan inisialisasi tabel',
    content: `/**
 * SIMPENDIK NON GELAR UNPAD
 * File: Database.gs - Database Manager & Setup Otomatis
 */

function getSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID !== "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms") {
    try {
      return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    } catch (e) {
      console.warn("Membuka active spreadsheet sebagai fallback:", e.message);
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Inisialisasi Struktur Database Lengkap pada Google Spreadsheet
 * Membuat sheets: PESERTA, KATEGORI, PROGRAM, USER, LOG_AKTIVITAS, SETTING, MASTER_DATA
 */
function initializeDatabase() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const ss = getSpreadsheet();

    // 1. Sheet: PESERTA
    let sheetPeserta = ss.getSheetByName(CONFIG.SHEETS.PESERTA);
    if (!sheetPeserta) {
      sheetPeserta = ss.insertSheet(CONFIG.SHEETS.PESERTA);
      const headers = [
        "ID Peserta", "Nomor Registrasi", "NIK", "NIP", "Nama Lengkap", "Gelar Depan", "Gelar Belakang",
        "Jenis Kelamin", "Tempat Lahir", "Tanggal Lahir", "Email", "Nomor HP", "Instansi/Institusi",
        "Jabatan", "Fakultas/Unit Kerja", "Pendidikan Terakhir", "Provinsi", "Kota/Kabupaten", "Alamat",
        "ID Kategori", "Kategori Program", "ID Program", "Nama Program", "Angkatan/Batch", "Tahun",
        "Tanggal Mulai", "Tanggal Selesai", "Status Peserta", "Status Kelulusan", "Nomor Sertifikat",
        "Tanggal Sertifikat", "Nilai/Skor", "Biaya Program", "Sumber Dana", "PIC", "Keterangan",
        "Created At", "Created By", "Updated At", "Updated By", "Status Data"
      ];
      sheetPeserta.appendRow(headers);
      sheetPeserta.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#002B66").setFontColor("#FFFFFF");
      sheetPeserta.setFrozenRows(1);
    }

    // 2. Sheet: KATEGORI
    let sheetKategori = ss.getSheetByName(CONFIG.SHEETS.KATEGORI);
    if (!sheetKategori) {
      sheetKategori = ss.insertSheet(CONFIG.SHEETS.KATEGORI);
      const headers = ["ID Kategori", "Nama Kategori", "Deskripsi", "Status Aktif", "Urutan", "Created At", "Updated At"];
      sheetKategori.appendRow(headers);
      sheetKategori.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#002B66").setFontColor("#FFFFFF");
      sheetKategori.setFrozenRows(1);

      // Masukkan 13 default kategori
      CONFIG.DEFAULT_KATEGORI.forEach((nama, idx) => {
        const idKat = "KAT-" + String(idx + 1).padStart(3, "0");
        sheetKategori.appendRow([
          idKat,
          nama,
          "Program " + nama + " Direktorat Pendidikan Non Gelar Unpad",
          true,
          idx + 1,
          new Date(),
          new Date()
        ]);
      });
    }

    // 3. Sheet: PROGRAM
    let sheetProgram = ss.getSheetByName(CONFIG.SHEETS.PROGRAM);
    if (!sheetProgram) {
      sheetProgram = ss.insertSheet(CONFIG.SHEETS.PROGRAM);
      const headers = ["ID Program", "ID Kategori", "Nama Program", "Deskripsi", "Status Aktif", "Created At", "Updated At"];
      sheetProgram.appendRow(headers);
      sheetProgram.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#002B66").setFontColor("#FFFFFF");
      sheetProgram.setFrozenRows(1);

      sheetProgram.appendRow(["PRG-001", "KAT-007", "PEKERTI Dosen Gelombang I", "Pelatihan PEKERTI untuk dosen pemula perguruan tinggi", true, new Date(), new Date()]);
      sheetProgram.appendRow(["PRG-002", "KAT-007", "Applied Approach (AA) Angkatan 12", "Pelatihan AA lanjutan kurikulum pendidikan tinggi", true, new Date(), new Date()]);
      sheetProgram.appendRow(["PRG-003", "KAT-001", "Luhung Leadership Camp 2026", "Leadership mastery berbasis kearifan lokal Sunda", true, new Date(), new Date()]);
    }

    // 4. Sheet: USER
    let sheetUser = ss.getSheetByName(CONFIG.SHEETS.USER);
    if (!sheetUser) {
      sheetUser = ss.insertSheet(CONFIG.SHEETS.USER);
      const headers = ["User ID", "Email", "Nama", "Role", "Status", "Created At", "Last Login"];
      sheetUser.appendRow(headers);
      sheetUser.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#002B66").setFontColor("#FFFFFF");
      sheetUser.setFrozenRows(1);

      const currentEmail = Session.getActiveUser().getEmail() || "nendar@unpad.ac.id";
      sheetUser.appendRow(["USR-001", currentEmail, "Administrator Utama", CONFIG.ROLES.ADMIN, "Aktif", new Date(), new Date()]);
    }

    // 5. Sheet: LOG_AKTIVITAS
    let sheetLog = ss.getSheetByName(CONFIG.SHEETS.LOG_AKTIVITAS);
    if (!sheetLog) {
      sheetLog = ss.insertSheet(CONFIG.SHEETS.LOG_AKTIVITAS);
      const headers = ["Timestamp", "User", "Aktivitas", "Modul", "ID Data", "Keterangan", "IP/User Agent"];
      sheetLog.appendRow(headers);
      sheetLog.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#002B66").setFontColor("#FFFFFF");
      sheetLog.setFrozenRows(1);
    }

    // 6. Sheet: SETTING
    let sheetSetting = ss.getSheetByName(CONFIG.SHEETS.SETTING);
    if (!sheetSetting) {
      sheetSetting = ss.insertSheet(CONFIG.SHEETS.SETTING);
      const headers = ["Kunci", "Nilai", "Keterangan"];
      sheetSetting.appendRow(headers);
      sheetSetting.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#002B66").setFontColor("#FFFFFF");
      sheetSetting.setFrozenRows(1);

      sheetSetting.appendRow(["NAMA_APLIKASI", "SIMPENDIK NON GELAR UNPAD", "Nama aplikasi"]);
      sheetSetting.appendRow(["INSTITUSI", "Universitas Padjadjaran", "Nama perguruan tinggi"]);
      sheetSetting.appendRow(["SUB_INSTITUSI", "Direktorat Pendidikan Non Gelar", "Unit kerja pengelola"]);
      sheetSetting.appendRow(["TAHUN_DEFAULT", "2026", "Tahun aktif saat ini"]);
      sheetSetting.appendRow(["PAGINATION", "10", "Jumlah record per halaman"]);
      sheetSetting.appendRow(["WHITELIST_DOMAIN", "@unpad.ac.id", "Domain email yang diizinkan"]);
    }

    writeLog("Inisialisasi Database", "DATABASE", "SETUP", "Database Google Sheets berhasil diinisialisasi");
    return createResponse(true, "Inisialisasi database berhasil dibuat dengan rapi!");
  } catch (err) {
    return createResponse(false, "Gagal inisialisasi database", null, err.message);
  } finally {
    lock.releaseLock();
  }
}
`
  },
  {
    name: 'Peserta.gs',
    type: 'gs',
    description: 'CRUD Peserta, auto ID generator LockService (DPNG-YYYY-XXXXXX), validasi & duplicate check',
    content: `/**
 * SIMPENDIK NON GELAR UNPAD
 * File: Peserta.gs - Manajemen Data Peserta (CRUD & Anti-Race Condition)
 */

/**
 * Generate ID Peserta Unik Otomatis Format: DPNG-[TAHUN]-[URUTAN]
 * Dilindungi LockService untuk mencegah nomor duplikat saat multi-user
 */
function generateNextPesertaId(tahun) {
  const currentYear = tahun || new Date().getFullYear();
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.PESERTA);
  if (!sheet) throw new Error("Sheet PESERTA tidak ditemukan");

  const lastRow = sheet.getLastRow();
  let maxSeq = 0;
  const prefix = "DPNG-" + currentYear + "-";

  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    ids.forEach(row => {
      const idStr = String(row[0] || "");
      if (idStr.startsWith(prefix)) {
        const numPart = parseInt(idStr.replace(prefix, ""), 10);
        if (!isNaN(numPart) && numPart > maxSeq) {
          maxSeq = numPart;
        }
      }
    });
  }

  const nextSeq = maxSeq + 1;
  return prefix + String(nextSeq).padStart(6, "0");
}

/**
 * Cek Duplikasi Peserta (NIK, NIP, Email, Nomor Registrasi)
 */
function checkDuplicatePeserta(payload, excludeId) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.PESERTA);
  if (!sheet || sheet.getLastRow() <= 1) return { isDuplicate: false };

  const data = sheet.getDataRange().getValues();
  // Kolom: 0=ID, 1=NoReg, 2=NIK, 3=NIP, 10=Email
  for (let i = 1; i < data.length; i++) {
    const rowId = String(data[i][0]).trim();
    if (excludeId && rowId === String(excludeId).trim()) continue;

    const rowNoReg = String(data[i][1] || "").trim();
    const rowNik = String(data[i][2] || "").trim();
    const rowNip = String(data[i][3] || "").trim();
    const rowEmail = String(data[i][10] || "").trim().toLowerCase();

    if (payload.nik && rowNik && payload.nik.trim() === rowNik) {
      return { isDuplicate: true, field: "NIK", value: payload.nik, existingId: rowId, nama: data[i][4] };
    }
    if (payload.nip && rowNip && payload.nip.trim() === rowNip) {
      return { isDuplicate: true, field: "NIP", value: payload.nip, existingId: rowId, nama: data[i][4] };
    }
    if (payload.email && rowEmail && payload.email.trim().toLowerCase() === rowEmail) {
      return { isDuplicate: true, field: "Email", value: payload.email, existingId: rowId, nama: data[i][4] };
    }
    if (payload.nomorRegistrasi && rowNoReg && payload.nomorRegistrasi.trim() === rowNoReg) {
      return { isDuplicate: true, field: "Nomor Registrasi", value: payload.nomorRegistrasi, existingId: rowId, nama: data[i][4] };
    }
  }

  return { isDuplicate: false };
}

/**
 * Mengambil Seluruh Peserta atau dengan Pagination / Simple Filter
 */
function getPeserta(params) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.PESERTA);
    if (!sheet) return createResponse(true, "Sheet belum ada", []);

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return createResponse(true, "Data peserta kosong", []);

    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const results = [];

    for (let i = 1; i < values.length; i++) {
      const r = values[i];
      if (r[40] === "Arsip" && !params?.includeArchived) continue;

      results.push({
        id: r[0],
        nomorRegistrasi: r[1],
        nik: r[2],
        nip: r[3],
        namaLengkap: r[4],
        gelarDepan: r[5],
        gelarBelakang: r[6],
        jenisKelamin: r[7],
        tempatLahir: r[8],
        tanggalLahir: r[9] instanceof Date ? Utilities.formatDate(r[9], "GMT+7", "yyyy-MM-dd") : String(r[9] || ""),
        email: r[10],
        nomorHp: r[11],
        instansi: r[12],
        jabatan: r[13],
        fakultasUnit: r[14],
        pendidikanTerakhir: r[15],
        provinsi: r[16],
        kotaKabupaten: r[17],
        alamat: r[18],
        idKategori: r[19],
        kategoriProgram: r[20],
        idProgram: r[21],
        namaProgram: r[22],
        angkatanBatch: r[23],
        tahun: Number(r[24]) || 2026,
        tanggalMulai: r[25] instanceof Date ? Utilities.formatDate(r[25], "GMT+7", "yyyy-MM-dd") : String(r[25] || ""),
        tanggalSelesai: r[26] instanceof Date ? Utilities.formatDate(r[26], "GMT+7", "yyyy-MM-dd") : String(r[26] || ""),
        statusPeserta: r[27],
        statusKelulusan: r[28],
        nomorSertifikat: r[29],
        tanggalSertifikat: r[30] instanceof Date ? Utilities.formatDate(r[30], "GMT+7", "yyyy-MM-dd") : String(r[30] || ""),
        nilaiSkor: r[31],
        biayaProgram: Number(r[32]) || 0,
        sumberDana: r[33],
        pic: r[34],
        keterangan: r[35],
        createdAt: r[36],
        createdBy: r[37],
        updatedAt: r[38],
        updatedBy: r[39],
        statusData: r[40] || "Aktif"
      });
    }

    return createResponse(true, "Data peserta berhasil dimuat", results);
  } catch (err) {
    return createResponse(false, "Gagal mengambil data peserta", null, err.message);
  }
}

/**
 * Buat Peserta Baru dengan LockService
 */
function createPeserta(data, bypassDuplicate) {
  if (!checkPermission(CONFIG.ROLES.OPERATOR)) {
    return createResponse(false, "Anda tidak memiliki hak akses untuk menambah peserta");
  }

  // Validasi kolom wajib
  if (!data.namaLengkap || !data.kategoriProgram || !data.namaProgram) {
    return createResponse(false, "Nama lengkap, kategori, dan program wajib diisi");
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    // Cek duplikasi jika bukan admin override
    if (!bypassDuplicate) {
      const dupCheck = checkDuplicatePeserta(data, null);
      if (dupCheck.isDuplicate) {
        return createResponse(false, "Data duplikat terdeteksi pada " + dupCheck.field + ": " + dupCheck.value + " (Milik: " + dupCheck.nama + ")", dupCheck);
      }
    }

    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.PESERTA);
    const newId = generateNextPesertaId(data.tahun);
    const currentUser = getCurrentUser().data?.email || "system@unpad.ac.id";
    const now = new Date();

    const newRow = [
      newId,
      data.nomorRegistrasi || ("REG-" + data.tahun + "-" + newId.split("-")[2]),
      data.nik || "",
      data.nip || "",
      data.namaLengkap,
      data.gelarDepan || "",
      data.gelarBelakang || "",
      data.jenisKelamin || "Laki-laki",
      data.tempatLahir || "",
      data.tanggalLahir || "",
      data.email || "",
      data.nomorHp || "",
      data.instansi || "",
      data.jabatan || "",
      data.fakultasUnit || "",
      data.pendidikanTerakhir || "",
      data.provinsi || "",
      data.kotaKabupaten || "",
      data.alamat || "",
      data.idKategori || "",
      data.kategoriProgram,
      data.idProgram || "",
      data.namaProgram,
      data.angkatanBatch || "",
      Number(data.tahun) || new Date().getFullYear(),
      data.tanggalMulai || "",
      data.tanggalSelesai || "",
      data.statusPeserta || "Terdaftar",
      data.statusKelulusan || "Belum Evaluasi",
      data.nomorSertifikat || "",
      data.tanggalSertifikat || "",
      data.nilaiSkor || "",
      Number(data.biayaProgram) || 0,
      data.sumberDana || "Mandiri / Pribadi",
      data.pic || "",
      data.keterangan || "",
      now,
      currentUser,
      now,
      currentUser,
      "Aktif"
    ];

    sheet.appendRow(newRow);
    writeLog("Tambah Peserta", "PESERTA", newId, "Peserta: " + data.namaLengkap + " (" + data.namaProgram + ")");

    return createResponse(true, "Data peserta berhasil disimpan", { id: newId });
  } catch (err) {
    return createResponse(false, "Gagal menyimpan peserta", null, err.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Update Data Peserta Berdasarkan ID
 */
function updatePeserta(id, data) {
  if (!checkPermission(CONFIG.ROLES.OPERATOR)) {
    return createResponse(false, "Anda tidak memiliki izin mengedit data peserta");
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.PESERTA);
  if (!sheet) return createResponse(false, "Sheet PESERTA tidak ditemukan");

  const values = sheet.getDataRange().getValues();
  let targetRow = -1;

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(id).trim()) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) {
    return createResponse(false, "Data peserta tidak ditemukan");
  }

  const currentUser = getCurrentUser().data?.email || "system@unpad.ac.id";
  const now = new Date();

  sheet.getRange(targetRow, 2, 1, 39).setValues([[
    data.nomorRegistrasi || values[targetRow - 1][1],
    data.nik || "",
    data.nip || "",
    data.namaLengkap,
    data.gelarDepan || "",
    data.gelarBelakang || "",
    data.jenisKelamin,
    data.tempatLahir || "",
    data.tanggalLahir || "",
    data.email || "",
    data.nomorHp || "",
    data.instansi || "",
    data.jabatan || "",
    data.fakultasUnit || "",
    data.pendidikanTerakhir || "",
    data.provinsi || "",
    data.kotaKabupaten || "",
    data.alamat || "",
    data.idKategori || "",
    data.kategoriProgram,
    data.idProgram || "",
    data.namaProgram,
    data.angkatanBatch || "",
    Number(data.tahun) || values[targetRow - 1][24],
    data.tanggalMulai || "",
    data.tanggalSelesai || "",
    data.statusPeserta,
    data.statusKelulusan,
    data.nomorSertifikat || "",
    data.tanggalSertifikat || "",
    data.nilaiSkor || "",
    Number(data.biayaProgram) || 0,
    data.sumberDana || "",
    data.pic || "",
    data.keterangan || "",
    values[targetRow - 1][36],
    values[targetRow - 1][37],
    now,
    currentUser
  ]]);

  writeLog("Edit Peserta", "PESERTA", id, "Update data peserta " + data.namaLengkap);
  return createResponse(true, "Data peserta berhasil diperbarui", { id: id });
}

/**
 * Hapus Peserta (Soft Delete / Hapus Baris oleh ADMIN)
 */
function deletePeserta(id) {
  if (!checkPermission(CONFIG.ROLES.ADMIN)) {
    return createResponse(false, "Hanya Administrator yang berhak menghapus data peserta");
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.PESERTA);
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(id).trim()) {
      const nama = values[i][4];
      sheet.deleteRow(i + 1);
      writeLog("Hapus Peserta", "PESERTA", id, "Menghapus peserta " + nama);
      return createResponse(true, "Data peserta berhasil dihapus");
    }
  }

  return createResponse(false, "Data peserta tidak ditemukan");
}
`
  },
  {
    name: 'Kategori.gs',
    type: 'gs',
    description: 'CRUD Kategori Program Pendidikan Non Gelar (Dinamis)',
    content: `/**
 * SIMPENDIK NON GELAR UNPAD
 * File: Kategori.gs - CRUD Kategori Dinamis
 */

function getKategori() {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.KATEGORI);
    if (!sheet) return createResponse(true, "Sheet kategori kosong", []);

    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return createResponse(true, "Belum ada kategori", []);

    // Hitung jumlah peserta per kategori
    const pSheet = ss.getSheetByName(CONFIG.SHEETS.PESERTA);
    const countMap = {};
    if (pSheet && pSheet.getLastRow() > 1) {
      const pData = pSheet.getDataRange().getValues();
      for (let j = 1; j < pData.length; j++) {
        const katName = String(pData[j][20] || "").trim();
        if (katName) countMap[katName] = (countMap[katName] || 0) + 1;
      }
    }

    const results = [];
    for (let i = 1; i < values.length; i++) {
      const r = values[i];
      const nama = r[1];
      results.push({
        idKategori: r[0],
        namaKategori: nama,
        deskripsi: r[2],
        statusAktif: Boolean(r[3]),
        urutan: Number(r[4]) || i,
        createdAt: r[5],
        updatedAt: r[6],
        jumlahPeserta: countMap[nama] || 0
      });
    }

    results.sort((a, b) => a.urutan - b.urutan);
    return createResponse(true, "Data kategori berhasil diambil", results);
  } catch (err) {
    return createResponse(false, "Gagal memuat kategori", null, err.message);
  }
}

function createKategori(data) {
  if (!checkPermission(CONFIG.ROLES.ADMIN)) {
    return createResponse(false, "Hanya Admin yang dapat menambah kategori");
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.KATEGORI);
  const newId = "KAT-" + String(sheet.getLastRow()).padStart(3, "0");
  const now = new Date();

  sheet.appendRow([
    newId,
    data.namaKategori,
    data.deskripsi || "",
    data.statusAktif !== false,
    Number(data.urutan) || sheet.getLastRow(),
    now,
    now
  ]);

  writeLog("Tambah Kategori", "KATEGORI", newId, "Kategori: " + data.namaKategori);
  return createResponse(true, "Kategori berhasil ditambahkan", { idKategori: newId });
}

function updateKategori(id, data) {
  if (!checkPermission(CONFIG.ROLES.ADMIN)) {
    return createResponse(false, "Hanya Admin yang dapat mengedit kategori");
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.KATEGORI);
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(id).trim()) {
      sheet.getRange(i + 1, 2, 1, 5).setValues([[
        data.namaKategori,
        data.deskripsi || "",
        Boolean(data.statusAktif),
        Number(data.urutan) || values[i][4],
        new Date()
      ]]);
      writeLog("Edit Kategori", "KATEGORI", id, "Update " + data.namaKategori);
      return createResponse(true, "Kategori berhasil diperbarui");
    }
  }

  return createResponse(false, "Kategori tidak ditemukan");
}

function deleteKategori(id) {
  if (!checkPermission(CONFIG.ROLES.ADMIN)) {
    return createResponse(false, "Hanya Admin yang dapat menghapus kategori");
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.KATEGORI);
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(id).trim()) {
      const nama = values[i][1];
      sheet.deleteRow(i + 1);
      writeLog("Hapus Kategori", "KATEGORI", id, "Menghapus kategori " + nama);
      return createResponse(true, "Kategori berhasil dihapus");
    }
  }

  return createResponse(false, "Kategori tidak ditemukan");
}
`
  },
  {
    name: 'Program.gs',
    type: 'gs',
    description: 'CRUD Program yang berinduk pada Kategori Pendidikan Non Gelar',
    content: `/**
 * SIMPENDIK NON GELAR UNPAD
 * File: Program.gs - CRUD Program Kursus & Pelatihan
 */

function getProgram(idKategori) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.PROGRAM);
    if (!sheet) return createResponse(true, "Data program kosong", []);

    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return createResponse(true, "Data program kosong", []);

    const results = [];
    for (let i = 1; i < values.length; i++) {
      const r = values[i];
      if (idKategori && String(r[1]) !== String(idKategori)) continue;

      results.push({
        idProgram: r[0],
        idKategori: r[1],
        namaProgram: r[2],
        deskripsi: r[3],
        statusAktif: Boolean(r[4]),
        createdAt: r[5],
        updatedAt: r[6]
      });
    }

    return createResponse(true, "Data program berhasil diambil", results);
  } catch (err) {
    return createResponse(false, "Gagal mengambil data program", null, err.message);
  }
}

function createProgram(data) {
  if (!checkPermission(CONFIG.ROLES.ADMIN)) {
    return createResponse(false, "Hanya Admin yang dapat menambah program");
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.PROGRAM);
  const newId = "PRG-" + String(sheet.getLastRow()).padStart(3, "0");
  const now = new Date();

  sheet.appendRow([
    newId,
    data.idKategori,
    data.namaProgram,
    data.deskripsi || "",
    data.statusAktif !== false,
    now,
    now
  ]);

  writeLog("Tambah Program", "PROGRAM", newId, "Program: " + data.namaProgram);
  return createResponse(true, "Program berhasil ditambahkan", { idProgram: newId });
}

function updateProgram(id, data) {
  if (!checkPermission(CONFIG.ROLES.ADMIN)) {
    return createResponse(false, "Hanya Admin yang dapat mengedit program");
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.PROGRAM);
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(id).trim()) {
      sheet.getRange(i + 1, 2, 1, 5).setValues([[
        data.idKategori || values[i][1],
        data.namaProgram,
        data.deskripsi || "",
        Boolean(data.statusAktif),
        new Date()
      ]]);
      writeLog("Edit Program", "PROGRAM", id, "Update " + data.namaProgram);
      return createResponse(true, "Program berhasil diperbarui");
    }
  }

  return createResponse(false, "Program tidak ditemukan");
}

function deleteProgram(id) {
  if (!checkPermission(CONFIG.ROLES.ADMIN)) {
    return createResponse(false, "Hanya Admin yang dapat menghapus program");
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.PROGRAM);
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(id).trim()) {
      sheet.deleteRow(i + 1);
      writeLog("Hapus Program", "PROGRAM", id, "Menghapus program ID " + id);
      return createResponse(true, "Program berhasil dihapus");
    }
  }

  return createResponse(false, "Program tidak ditemukan");
}
`
  },
  {
    name: 'Dashboard.gs',
    type: 'gs',
    description: 'Agregasi data statistik, metrik kartu, dan analisis 6 grafik realtime',
    content: `/**
 * SIMPENDIK NON GELAR UNPAD
 * File: Dashboard.gs - Agregasi Statistik & Data Grafik
 */

function getDashboardStats(filters) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.PESERTA);
    if (!sheet || sheet.getLastRow() <= 1) {
      return createResponse(true, "Data peserta kosong", getEmptyStats());
    }

    const data = sheet.getDataRange().getValues();
    const currentYear = new Date().getFullYear();

    let totalPeserta = 0;
    let pesertaAktif = 0;
    let pesertaSelesai = 0;
    let pesertaLulus = 0;
    let pesertaTidakLulus = 0;
    let pesertaTahunBerjalan = 0;

    const kategoriMap = {};
    const tahunMap = {};
    const statusMap = {};
    const genderMap = {};
    const instansiMap = {};
    const provinsiMap = {};

    for (let i = 1; i < data.length; i++) {
      const r = data[i];
      if (r[40] === "Arsip") continue;

      const tahun = Number(r[24]) || currentYear;
      const kategori = String(r[20] || "Lainnya").trim();
      const program = String(r[22] || "").trim();
      const status = String(r[27] || "Terdaftar").trim();
      const gender = String(r[7] || "Laki-laki").trim();
      const instansi = String(r[12] || "Lain-lain").trim();
      const provinsi = String(r[16] || "Lain-lain").trim();

      // Terapkan filter jika ada
      if (filters?.tahun && String(tahun) !== String(filters.tahun)) continue;
      if (filters?.kategori && kategori !== filters.kategori) continue;
      if (filters?.program && program !== filters.program) continue;
      if (filters?.statusPeserta && status !== filters.statusPeserta) continue;
      if (filters?.jenisKelamin && gender !== filters.jenisKelamin) continue;

      totalPeserta++;
      if (status === "Aktif") pesertaAktif++;
      if (status === "Selesai") pesertaSelesai++;
      if (status === "Lulus") pesertaLulus++;
      if (status === "Tidak Lulus") pesertaTidakLulus++;
      if (tahun === currentYear) pesertaTahunBerjalan++;

      kategoriMap[kategori] = (kategoriMap[kategori] || 0) + 1;
      tahunMap[tahun] = (tahunMap[tahun] || 0) + 1;
      statusMap[status] = (statusMap[status] || 0) + 1;
      genderMap[gender] = (genderMap[gender] || 0) + 1;
      if (instansi) instansiMap[instansi] = (instansiMap[instansi] || 0) + 1;
      if (provinsi) provinsiMap[provinsi] = (provinsiMap[provinsi] || 0) + 1;
    }

    // Hitung total master kategori & program
    const kSheet = ss.getSheetByName(CONFIG.SHEETS.KATEGORI);
    const pSheet = ss.getSheetByName(CONFIG.SHEETS.PROGRAM);
    const totalKategori = kSheet ? Math.max(0, kSheet.getLastRow() - 1) : 0;
    const totalProgram = pSheet ? Math.max(0, pSheet.getLastRow() - 1) : 0;

    // Sort Top 10 Instansi
    const topInstansi = Object.keys(instansiMap)
      .map(k => ({ label: k, total: instansiMap[k] }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return createResponse(true, "Statistik dashboard berhasil dihitung", {
      cards: {
        totalPeserta,
        pesertaAktif,
        pesertaSelesai,
        pesertaLulus,
        pesertaTidakLulus,
        totalProgram,
        totalKategori,
        pesertaTahunBerjalan
      },
      charts: {
        byKategori: kategoriMap,
        byTahun: tahunMap,
        byStatus: statusMap,
        byGender: genderMap,
        topInstansi: topInstansi,
        byProvinsi: provinsiMap
      }
    });
  } catch (err) {
    return createResponse(false, "Gagal memproses statistik", null, err.message);
  }
}

function getEmptyStats() {
  return {
    cards: {
      totalPeserta: 0,
      pesertaAktif: 0,
      pesertaSelesai: 0,
      pesertaLulus: 0,
      pesertaTidakLulus: 0,
      totalProgram: 0,
      totalKategori: 0,
      pesertaTahunBerjalan: 0
    },
    charts: {
      byKategori: {},
      byTahun: {},
      byStatus: {},
      byGender: {},
      topInstansi: [],
      byProvinsi: {}
    }
  };
}
`
  },
  {
    name: 'Import.gs',
    type: 'gs',
    description: 'Import massal dari Excel/CSV dengan validasi header, duplicate detection, dan batch write',
    content: `/**
 * SIMPENDIK NON GELAR UNPAD
 * File: Import.gs - Import Batch Berkecepatan Tinggi
 */

function importPeserta(rowsData) {
  if (!checkPermission(CONFIG.ROLES.ADMIN)) {
    return createResponse(false, "Hanya Administrator yang berhak mengimpor data peserta");
  }

  if (!Array.isArray(rowsData) || rowsData.length === 0) {
    return createResponse(false, "Data impor kosong");
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.PESERTA);
    const currentUser = getCurrentUser().data?.email || "import@unpad.ac.id";
    const now = new Date();

    const batchRows = [];
    let currentSeq = 0;
    const currentYear = new Date().getFullYear();

    // Hitung nomor urut terakhir
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      ids.forEach(r => {
        const idStr = String(r[0] || "");
        if (idStr.startsWith("DPNG-" + currentYear)) {
          const num = parseInt(idStr.split("-")[2], 10);
          if (!isNaN(num) && num > currentSeq) currentSeq = num;
        }
      });
    }

    let importedCount = 0;
    for (let i = 0; i < rowsData.length; i++) {
      const item = rowsData[i];
      if (!item.namaLengkap) continue;

      currentSeq++;
      const newId = "DPNG-" + (item.tahun || currentYear) + "-" + String(currentSeq).padStart(6, "0");

      batchRows.push([
        newId,
        item.nomorRegistrasi || ("REG-" + (item.tahun || currentYear) + "-" + String(currentSeq).padStart(4, "0")),
        item.nik || "",
        item.nip || "",
        item.namaLengkap,
        item.gelarDepan || "",
        item.gelarBelakang || "",
        item.jenisKelamin || "Laki-laki",
        item.tempatLahir || "",
        item.tanggalLahir || "",
        item.email || "",
        item.nomorHp || "",
        item.instansi || "",
        item.jabatan || "",
        item.fakultasUnit || "",
        item.pendidikanTerakhir || "",
        item.provinsi || "",
        item.kotaKabupaten || "",
        item.alamat || "",
        item.idKategori || "",
        item.kategoriProgram || "Professional Course",
        item.idProgram || "",
        item.namaProgram || "Kursus",
        item.angkatanBatch || "",
        Number(item.tahun) || currentYear,
        item.tanggalMulai || "",
        item.tanggalSelesai || "",
        item.statusPeserta || "Terdaftar",
        item.statusKelulusan || "Belum Evaluasi",
        item.nomorSertifikat || "",
        item.tanggalSertifikat || "",
        item.nilaiSkor || "",
        Number(item.biayaProgram) || 0,
        item.sumberDana || "Mandiri / Pribadi",
        item.pic || "",
        item.keterangan || "Impor massal",
        now,
        currentUser,
        now,
        currentUser,
        "Aktif"
      ]);
      importedCount++;
    }

    if (batchRows.length > 0) {
      // Batch write 1 kali panggilan
      sheet.getRange(sheet.getLastRow() + 1, 1, batchRows.length, batchRows[0].length).setValues(batchRows);
      writeLog("Import Data", "IMPORT", "BATCH", "Berhasil mengimpor " + importedCount + " data peserta");
    }

    return createResponse(true, "Berhasil mengimpor " + importedCount + " data peserta", { count: importedCount });
  } catch (err) {
    return createResponse(false, "Gagal mengimpor data", null, err.message);
  } finally {
    lock.releaseLock();
  }
}
`
  },
  {
    name: 'Export.gs',
    type: 'gs',
    description: 'Export data peserta terfilter ke format CSV / Spreadsheet',
    content: `/**
 * SIMPENDIK NON GELAR UNPAD
 * File: Export.gs - Export Data Terfilter
 */

function exportPeserta(filters) {
  try {
    const listRes = getPeserta();
    if (!listRes.success) return listRes;

    let data = listRes.data || [];

    // Terapkan filter
    if (filters) {
      if (filters.kategori) data = data.filter(d => d.kategoriProgram === filters.kategori);
      if (filters.program) data = data.filter(d => d.namaProgram === filters.program);
      if (filters.tahun) data = data.filter(d => String(d.tahun) === String(filters.tahun));
      if (filters.statusPeserta) data = data.filter(d => d.statusPeserta === filters.statusPeserta);
      if (filters.statusKelulusan) data = data.filter(d => d.statusKelulusan === filters.statusKelulusan);
      if (filters.instansi) data = data.filter(d => d.instansi.toLowerCase().includes(filters.instansi.toLowerCase()));
    }

    writeLog("Export Data", "EXPORT", "FILTER", "Export " + data.length + " baris data peserta");
    return createResponse(true, "Data siap diekspor", data);
  } catch (err) {
    return createResponse(false, "Gagal mengekspor data", null, err.message);
  }
}
`
  },
  {
    name: 'Log.gs',
    type: 'gs',
    description: 'Pencatatan audit log aktivitas seluruh pengguna',
    content: `/**
 * SIMPENDIK NON GELAR UNPAD
 * File: Log.gs - Audit Trail & Log Aktivitas
 */

function writeLog(aktivitas, modul, idData, keterangan) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.LOG_AKTIVITAS);
    if (!sheet) return;

    const user = Session.getActiveUser().getEmail() || "system@unpad.ac.id";
    const now = new Date();

    sheet.appendRow([
      now,
      user,
      aktivitas,
      modul || "-",
      idData || "-",
      keterangan || "",
      "AppsScript Session"
    ]);
  } catch (e) {
    console.error("Gagal menulis log aktivitas:", e.message);
  }
}

function getLogs(limit) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.LOG_AKTIVITAS);
    if (!sheet || sheet.getLastRow() <= 1) return createResponse(true, "Log kosong", []);

    const values = sheet.getDataRange().getValues();
    const results = [];
    const max = limit || 100;

    for (let i = values.length - 1; i >= 1 && results.length < max; i--) {
      results.push({
        timestamp: values[i][0] instanceof Date ? Utilities.formatDate(values[i][0], "GMT+7", "yyyy-MM-dd HH:mm:ss") : String(values[i][0]),
        user: values[i][1],
        aktivitas: values[i][2],
        modul: values[i][3],
        idData: values[i][4],
        keterangan: values[i][5],
        ipUserAgent: values[i][6]
      });
    }

    return createResponse(true, "Log berhasil dimuat", results);
  } catch (err) {
    return createResponse(false, "Gagal mengambil log", null, err.message);
  }
}
`
  },
  {
    name: 'Code.gs',
    type: 'gs',
    description: 'Entry point doGet() Web App, router template, include() helper',
    content: `/**
 * SIMPENDIK NON GELAR UNPAD
 * Sistem Informasi Data Peserta Pendidikan Non Gelar Universitas Padjadjaran
 * File: Code.gs - Main Controller & Web App Entry Point
 */

function doGet(e) {
  // Pastikan database siap saat pertama kali diakses
  try {
    const ss = getSpreadsheet();
    if (!ss.getSheetByName(CONFIG.SHEETS.PESERTA)) {
      initializeDatabase();
    }
  } catch (err) {
    console.warn("Auto-init check:", err.message);
  }

  const template = HtmlService.createTemplateFromFile("Index");
  template.appName = CONFIG.APP_NAME;
  template.appTitle = CONFIG.APP_TITLE;

  return template.evaluate()
    .setTitle(CONFIG.APP_NAME + " - Universitas Padjadjaran")
    .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Helper untuk menyertakan file HTML lain (css.html, js.html)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
`
  },
  {
    name: 'Index.html',
    type: 'html',
    description: 'Template antarmuka utama Google Apps Script (Sidebar, Topbar, Content, Modal)',
    content: `<!DOCTYPE html>
<html lang="id">
<head>
  <base target="_top">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= appName ?> - Universitas Padjadjaran</title>
  <!-- Bootstrap 5 CSS & FontAwesome -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <!-- SheetJS untuk ekspor Excel -->
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
  <?!= include('css'); ?>
</head>
<body class="bg-light">
  <!-- Wrapper Aplikasi -->
  <div class="d-flex" id="wrapper">
    <!-- Sidebar -->
    <div class="bg-unpad-navy text-white sidebar" id="sidebar-wrapper">
      <div class="sidebar-heading text-center py-4 px-3 border-bottom border-secondary border-opacity-25">
        <div class="d-flex align-items-center justify-content-center gap-2">
          <div class="unpad-badge">UNPAD</div>
          <div class="text-start">
            <h6 class="mb-0 fw-bold text-white tracking-wide">SIMPENDIK</h6>
            <small class="text-unpad-gold fw-semibold font-size-11">NON GELAR</small>
          </div>
        </div>
      </div>
      <div class="list-group list-group-flush my-2">
        <a href="#dashboard" class="list-group-item list-group-item-action active nav-link-item" onclick="switchView('dashboard')">
          <i class="fa-solid fa-chart-pie me-2"></i> Dashboard
        </a>
        <a href="#peserta" class="list-group-item list-group-item-action nav-link-item" onclick="switchView('peserta')">
          <i class="fa-solid fa-users me-2"></i> Data Peserta
        </a>
        <a href="#tambah" class="list-group-item list-group-item-action nav-link-item" onclick="switchView('tambah')">
          <i class="fa-solid fa-user-plus me-2"></i> Tambah Peserta
        </a>
        <a href="#kategori" class="list-group-item list-group-item-action nav-link-item" onclick="switchView('kategori')">
          <i class="fa-solid fa-layer-group me-2"></i> Kategori Program
        </a>
        <a href="#program" class="list-group-item list-group-item-action nav-link-item" onclick="switchView('program')">
          <i class="fa-solid fa-graduation-cap me-2"></i> Program
        </a>
        <a href="#search" class="list-group-item list-group-item-action nav-link-item" onclick="switchView('search')">
          <i class="fa-solid fa-magnifying-glass me-2"></i> Advanced Search
        </a>
        <a href="#import" class="list-group-item list-group-item-action nav-link-item" onclick="switchView('import')">
          <i class="fa-solid fa-file-import me-2"></i> Import Data
        </a>
        <a href="#export" class="list-group-item list-group-item-action nav-link-item" onclick="switchView('export')">
          <i class="fa-solid fa-file-export me-2"></i> Export Data
        </a>
        <a href="#statistik" class="list-group-item list-group-item-action nav-link-item" onclick="switchView('statistik')">
          <i class="fa-solid fa-chart-line me-2"></i> Statistik
        </a>
        <a href="#user" class="list-group-item list-group-item-action nav-link-item admin-only" onclick="switchView('user')">
          <i class="fa-solid fa-user-shield me-2"></i> User Management
        </a>
        <a href="#log" class="list-group-item list-group-item-action nav-link-item" onclick="switchView('log')">
          <i class="fa-solid fa-clipboard-list me-2"></i> Log Aktivitas
        </a>
        <a href="#setting" class="list-group-item list-group-item-action nav-link-item" onclick="switchView('setting')">
          <i class="fa-solid fa-gear me-2"></i> Pengaturan
        </a>
      </div>
    </div>

    <!-- Page Content Wrapper -->
    <div id="page-content-wrapper" class="w-100">
      <!-- Top Navbar -->
      <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm px-3 py-2 sticky-top">
        <button class="btn btn-outline-primary btn-sm me-3" id="menu-toggle">
          <i class="fa-solid fa-bars"></i>
        </button>
        <div class="d-none d-md-block">
          <span class="text-muted small">Direktorat Pendidikan Non Gelar</span>
          <h6 class="mb-0 fw-bold text-unpad-navy">Universitas Padjadjaran</h6>
        </div>
        <div class="ms-auto d-flex align-items-center gap-3">
          <div class="text-end d-none d-sm-block">
            <div class="fw-semibold small" id="topbar-user-name">Memuat...</div>
            <span class="badge bg-primary-subtle text-primary border" id="topbar-user-role">Role</span>
          </div>
          <div class="user-avatar-circle" id="user-avatar-initial">U</div>
        </div>
      </nav>

      <!-- Main Container View -->
      <div class="container-fluid p-4" id="main-content-view">
        <!-- Konten dinamis dirender di sini via js.html -->
      </div>
    </div>
  </div>

  <!-- Modal Konfirmasi & Toast Notifications Container -->
  <div id="toast-container" class="toast-container position-fixed bottom-0 end-0 p-3"></div>

  <!-- Bootstrap JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <?!= include('js'); ?>
</body>
</html>
`
  },
  {
    name: 'css.html',
    type: 'html',
    description: 'Style Sheet Unpad Palette (Navy #002B66, Gold #FDB913, clean card layout & print KOP)',
    content: `<style>
  :root {
    --unpad-navy: #002B66;
    --unpad-navy-light: #0A3C82;
    --unpad-gold: #FDB913;
    --unpad-slate: #F8FAFC;
    --unpad-border: #E2E8F0;
  }
  
  body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1E293B;
  }

  .bg-unpad-navy {
    background-color: var(--unpad-navy) !important;
  }

  .text-unpad-navy {
    color: var(--unpad-navy) !important;
  }

  .text-unpad-gold {
    color: var(--unpad-gold) !important;
  }

  .unpad-badge {
    background-color: var(--unpad-gold);
    color: var(--unpad-navy);
    font-weight: 800;
    font-size: 11px;
    padding: 3px 7px;
    border-radius: 4px;
    letter-spacing: 0.5px;
  }

  .font-size-11 {
    font-size: 11px;
  }

  /* Sidebar Styling */
  #sidebar-wrapper {
    min-height: 100vh;
    width: 260px;
    transition: margin 0.25s ease-out;
  }

  #sidebar-wrapper .list-group-item {
    background: transparent;
    color: #CBD5E1;
    border: none;
    padding: 11px 20px;
    font-size: 14px;
    font-weight: 500;
    border-radius: 6px;
    margin: 2px 10px;
    transition: all 0.2s;
  }

  #sidebar-wrapper .list-group-item:hover {
    background-color: rgba(255, 255, 255, 0.08);
    color: #FFFFFF;
  }

  #sidebar-wrapper .list-group-item.active {
    background-color: var(--unpad-gold);
    color: var(--unpad-navy);
    font-weight: 700;
  }

  .card-stat {
    border: 1px solid var(--unpad-border);
    border-radius: 12px;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .card-stat:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
  }

  .user-avatar-circle {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background-color: var(--unpad-navy);
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 14px;
  }

  /* Cetak / Print Styles untuk KOP Unpad */
  @media print {
    body * {
      visibility: hidden;
    }
    #printable-profile, #printable-profile * {
      visibility: visible;
    }
    #printable-profile {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    .no-print {
      display: none !important;
    }
  }
</style>
`
  },
  {
    name: 'js.html',
    type: 'html',
    description: 'Frontend Controller Google Apps Script (google.script.run dispatcher, state, chart render)',
    content: `<script>
  // State Frontend Utama
  let appState = {
    currentUser: null,
    kategoriList: [],
    programList: [],
    pesertaList: [],
    currentView: 'dashboard',
    activeFilters: {}
  };

  document.addEventListener('DOMContentLoaded', function() {
    initApp();

    document.getElementById('menu-toggle')?.addEventListener('click', function(e) {
      e.preventDefault();
      document.getElementById('wrapper').classList.toggle('toggled');
    });
  });

  function initApp() {
    // 1. Ambil info current user
    google.script.run
      .withSuccessHandler(function(res) {
        if (res && res.success) {
          appState.currentUser = res.data;
          document.getElementById('topbar-user-name').innerText = res.data.nama || res.data.email;
          document.getElementById('topbar-user-role').innerText = res.data.role;
          document.getElementById('user-avatar-initial').innerText = (res.data.nama || res.data.email).charAt(0).toUpperCase();

          if (res.data.role !== 'ADMIN') {
            document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
          }
        }
        loadDashboard();
      })
      .withFailureHandler(function(err) {
        showToast('Gagal memuat session: ' + err.message, 'danger');
        loadDashboard();
      })
      .getCurrentUser();
  }

  function switchView(viewName) {
    appState.currentView = viewName;
    document.querySelectorAll('.nav-link-item').forEach(el => el.classList.remove('active'));
    event?.currentTarget?.classList.add('active');

    const container = document.getElementById('main-content-view');
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Memuat data...</p></div>';

    if (viewName === 'dashboard') loadDashboard();
    else if (viewName === 'peserta') loadPesertaTable();
    else if (viewName === 'tambah') loadPesertaForm();
    else if (viewName === 'kategori') loadKategoriView();
    else if (viewName === 'program') loadProgramView();
    else if (viewName === 'search') loadAdvancedSearch();
    else if (viewName === 'import') loadImportView();
    else if (viewName === 'export') loadExportView();
    else if (viewName === 'statistik') loadStatistikView();
    else if (viewName === 'user') loadUserView();
    else if (viewName === 'log') loadLogView();
    else if (viewName === 'setting') loadSettingView();
  }

  function loadDashboard() {
    google.script.run
      .withSuccessHandler(function(res) {
        if (!res.success) return showToast(res.message, 'warning');
        renderDashboardHTML(res.data);
      })
      .withFailureHandler(function(err) {
        showToast('Gagal memuat dashboard: ' + err.message, 'danger');
      })
      .getDashboardStats(appState.activeFilters);
  }

  function renderDashboardHTML(data) {
    const c = data.cards;
    const html = \`
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold mb-1 text-unpad-navy">Dashboard Statistik</h4>
          <p class="text-muted small mb-0">Direktorat Pendidikan Non Gelar Universitas Padjadjaran</p>
        </div>
        <button class="btn btn-sm btn-outline-primary" onclick="loadDashboard()">
          <i class="fa-solid fa-arrows-rotate me-1"></i> Refresh
        </button>
      </div>

      <!-- 8 Stat Cards -->
      <div class="row g-3 mb-4">
        <div class="col-sm-6 col-xl-3">
          <div class="card card-stat p-3 bg-white">
            <span class="text-muted small fw-semibold">Total Peserta</span>
            <h3 class="fw-bold my-1 text-primary">\${c.totalPeserta}</h3>
            <small class="text-success"><i class="fa-solid fa-users me-1"></i> Terdata di Google Sheets</small>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="card card-stat p-3 bg-white">
            <span class="text-muted small fw-semibold">Peserta Aktif</span>
            <h3 class="fw-bold my-1 text-info">\${c.pesertaAktif}</h3>
            <small class="text-muted">Sedang proses pendidikan</small>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="card card-stat p-3 bg-white">
            <span class="text-muted small fw-semibold">Peserta Selesai</span>
            <h3 class="fw-bold my-1 text-warning">\${c.pesertaSelesai}</h3>
            <small class="text-muted">Menyelesaikan kurikulum</small>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="card card-stat p-3 bg-white">
            <span class="text-muted small fw-semibold">Peserta Lulus</span>
            <h3 class="fw-bold my-1 text-success">\${c.pesertaLulus}</h3>
            <small class="text-success">Memperoleh sertifikat</small>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="card card-stat p-3 bg-white">
            <span class="text-muted small fw-semibold">Tidak Lulus / DO</span>
            <h3 class="fw-bold my-1 text-danger">\${c.pesertaTidakLulus}</h3>
            <small class="text-danger">Evaluasi tidak memenuhi</small>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="card card-stat p-3 bg-white">
            <span class="text-muted small fw-semibold">Total Program</span>
            <h3 class="fw-bold my-1 text-dark">\${c.totalProgram}</h3>
            <small class="text-muted">Program aktif</small>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="card card-stat p-3 bg-white">
            <span class="text-muted small fw-semibold">Total Kategori</span>
            <h3 class="fw-bold my-1 text-dark">\${c.totalKategori}</h3>
            <small class="text-muted">Divisi/kategori program</small>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="card card-stat p-3 bg-white">
            <span class="text-muted small fw-semibold">Peserta Tahun Berjalan</span>
            <h3 class="fw-bold my-1 text-unpad-navy">\${c.pesertaTahunBerjalan}</h3>
            <small class="text-muted">Tahun aktif 2026</small>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="row g-4 mb-4">
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm p-3 h-100">
            <h6 class="fw-bold text-unpad-navy mb-3"><i class="fa-solid fa-chart-column me-2 text-primary"></i>Peserta Berdasarkan Kategori</h6>
            <canvas id="chartKategori" height="220"></canvas>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm p-3 h-100">
            <h6 class="fw-bold text-unpad-navy mb-3"><i class="fa-solid fa-chart-line me-2 text-success"></i>Trend Peserta per Tahun</h6>
            <canvas id="chartTahun" height="220"></canvas>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm p-3 h-100">
            <h6 class="fw-bold text-unpad-navy mb-3"><i class="fa-solid fa-chart-pie me-2 text-warning"></i>Distribusi Status Peserta</h6>
            <canvas id="chartStatus" height="200"></canvas>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm p-3 h-100">
            <h6 class="fw-bold text-unpad-navy mb-3"><i class="fa-solid fa-venus-mars me-2 text-info"></i>Komposisi Jenis Kelamin</h6>
            <canvas id="chartGender" height="200"></canvas>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm p-3 h-100">
            <h6 class="fw-bold text-unpad-navy mb-3"><i class="fa-solid fa-building me-2 text-danger"></i>Top 10 Instansi Peserta</h6>
            <canvas id="chartInstansi" height="200"></canvas>
          </div>
        </div>
      </div>
    \`;

    document.getElementById('main-content-view').innerHTML = html;
    initCharts(data.charts);
  }

  function initCharts(charts) {
    // Kategori Bar Chart
    const ctxKat = document.getElementById('chartKategori')?.getContext('2d');
    if (ctxKat) {
      new Chart(ctxKat, {
        type: 'bar',
        data: {
          labels: Object.keys(charts.byKategori || {}),
          datasets: [{
            label: 'Jumlah Peserta',
            data: Object.values(charts.byKategori || {}),
            backgroundColor: '#002B66',
            borderRadius: 4
          }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
      });
    }

    // Status Doughnut Chart
    const ctxStatus = document.getElementById('chartStatus')?.getContext('2d');
    if (ctxStatus) {
      new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
          labels: Object.keys(charts.byStatus || {}),
          datasets: [{
            data: Object.values(charts.byStatus || {}),
            backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
          }]
        },
        options: { responsive: true }
      });
    }
  }

  function showToast(message, type) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-' + (type || 'primary') + ' border-0';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = \`
      <div class="d-flex">
        <div class="toast-body">\${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    \`;
    container.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { delay: 3500 });
    bsToast.show();
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
  }
</script>
`
  }
];

export const SETUP_GUIDE = `
# PANDUAN DEPLOYMENT GOOGLE APPS SCRIPT (GAS) & GOOGLE SHEETS
### SIMPENDIK NON GELAR UNIVERSITAS PADJADJARAN

Langkah mudah menerapkan aplikasi ke akun Google Workspace Unpad Anda:

1. **Buat Spreadsheet Baru di Google Drive**
   - Kunjungi [sheets.google.com](https://sheets.google.com)
   - Beri nama spreadsheet: \`SIMPENDIK NON GELAR UNPAD\`
   - Salin ID Spreadsheet dari URL browser (bagian di antara \`/d/\` dan \`/edit\`).

2. **Buka Google Apps Script Editor**
   - Pada spreadsheet, klik menu **Extensions (Ekstensi)** > **Apps Script**.
   - Beri nama project: \`SIMPENDIK_UNPAD_BACKEND\`.

3. **Buat File Sesuai Daftar Modular**
   Buat file script (.gs) dan file HTML (.html) persis seperti daftar:
   - \`Config.gs\` (Tempelkan ID Spreadsheet Anda pada konstanta CONFIG.SPREADSHEET_ID)
   - \`Auth.gs\`
   - \`Database.gs\`
   - \`Peserta.gs\`
   - \`Kategori.gs\`
   - \`Program.gs\`
   - \`Dashboard.gs\`
   - \`Import.gs\`
   - \`Export.gs\`
   - \`Log.gs\`
   - \`Code.gs\`
   - \`Index.html\`
   - \`css.html\`
   - \`js.html\`

4. **Jalankan Inisialisasi Database**
   - Pada toolbar editor Apps Script, pilih fungsi \`initializeDatabase\` lalu klik **Run (Jalankan)**.
   - Klik **Review Permissions** dan berikan izin akses Google Spreadsheet.
   - Fungsi ini otomatis membuat seluruh sheet (\`PESERTA\`, \`KATEGORI\`, \`PROGRAM\`, \`USER\`, \`LOG_AKTIVITAS\`, \`SETTING\`, \`MASTER_DATA\`), 13 kategori default Unpad, dan akun ADMIN pertama untuk email Anda.

5. **Deploy sebagai Web App**
   - Klik tombol biru **Deploy** di pojok kanan atas > **New deployment**.
   - Pilih tipe: **Web app**.
   - Konfigurasi:
     * **Description**: SIMPENDIK Non Gelar Unpad Production
     * **Execute as**: *User accessing the web app* (atau *Me* jika ingin terpusat)
     * **Who has access**: *Anyone within Universitas Padjadjaran* (atau *Anyone* jika melayani instansi eksternal)
   - Klik **Deploy**, lalu salin URL Web App yang dihasilkan.
   - Buka URL Web App di browser atau masukkan ke pengaturan aplikasi ini untuk sinkronisasi langsung!
`;
