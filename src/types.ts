export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER';

export type StatusPeserta = 
  | 'Terdaftar' 
  | 'Aktif' 
  | 'Selesai' 
  | 'Mengundurkan Diri' 
  | 'Tidak Lulus' 
  | 'Lulus';

export type StatusKelulusan = 
  | 'Lulus' 
  | 'Tidak Lulus' 
  | 'Dalam Proses' 
  | 'Belum Evaluasi' 
  | 'Mengundurkan Diri';

export interface Peserta {
  id: string; // ID Peserta: DPNG-2026-000001
  nomorRegistrasi: string;
  nik: string;
  nip: string;
  namaLengkap: string;
  gelarDepan: string;
  gelarBelakang: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  tempatLahir: string;
  tanggalLahir: string;
  email: string;
  nomorHp: string;
  instansi: string;
  jabatan: string;
  fakultasUnit: string;
  pendidikanTerakhir: string;
  provinsi: string;
  kotaKabupaten: string;
  alamat: string;
  idKategori?: string;
  kategoriProgram: string;
  idProgram?: string;
  namaProgram: string;
  angkatanBatch: string;
  tahun: number;
  tanggalMulai: string;
  tanggalSelesai: string;
  statusPeserta: StatusPeserta;
  statusKelulusan: StatusKelulusan;
  nomorSertifikat: string;
  tanggalSertifikat: string;
  nilaiSkor: string;
  biayaProgram: number;
  sumberDana: string;
  idPic?: string;
  pic: string;
  keterangan: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  statusData: 'Aktif' | 'Arsip';
  [key: string]: unknown;
}

export interface PicProgram {
  idPic: string; // ID unik: PIC-001
  namaLengkap: string;
  gelarDepan?: string;
  gelarBelakang?: string;
  nip?: string;
  email: string;
  nomorHp: string;
  jabatan: string; // e.g. 'Koordinator Program', 'Sekretaris Program', 'Penanggung Jawab Teknis'
  unitFakultas: string; // e.g. 'Direktorat Pendidikan Non Gelar', 'Fakultas Kedokteran (FK)'
  idProgramUtama?: string;
  namaProgramUtama?: string;
  idKategoriUtama?: string;
  statusAktif: boolean | 'Ya' | 'Tidak';
  keterangan?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Kategori {
  idKategori: string;
  namaKategori: string;
  deskripsi: string;
  statusAktif: boolean | 'Ya' | 'Tidak';
  urutan?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Program {
  idProgram: string;
  idKategori: string;
  namaProgram: string;
  deskripsi: string;
  statusAktif: boolean | 'Ya' | 'Tidak';
  idPic?: string;
  namaPic?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SkemaPaketEduventure = 'Eduventure Lite' | 'Eduventure Experience' | 'Eduventure Tematik';
export type PilihanKunjunganEduventure = 'Universitas' | 'Fakultas';
export type StatusBayarEduventure = 'Sudah' | 'Belum';
export type RekeningEduventure = 'Eduventure 9882340560200004' | 'Luhung 9880619020200219';

export interface EduventureBooking {
  id: string; // e.g. "EDV-2026-0001"
  idKategori: string; // Relasi ke Kategori Program (default "KAT-006")
  namaKategori: string; // "Eduventure"
  namaSekolah: string;
  alamat: string;
  kontakPerson: string; // Nama Guru / Narahubung
  nomorKontak: string; // No WA / Telepon
  emailKontak?: string;
  jumlahPeserta: number; // Total peserta / siswa
  jumlahGuru?: number; // Guru pendamping
  tanggalPelaksanaan: string; // YYYY-MM-DD
  waktuMulai?: string; // e.g. "08:30" (Format HH:mm WIB)
  waktuSelesai?: string; // e.g. "12:00" (Format HH:mm WIB)
  tempatPenyelenggaraan?: string; // e.g. "Bale Sawala", "Bale Rucita", "Bale Santika", "Auditorium Fakultas Farmasi", etc.
  skemaPaket: SkemaPaketEduventure;
  pilihanKunjungan: PilihanKunjunganEduventure;
  fakultasTujuan?: string[]; // Daftar fakultas yang dipilih jika pilihan adalah Fakultas
  statusBayar: StatusBayarEduventure;
  buktiTransferUrl?: string; // URL / Data URI base64 bukti transfer
  buktiTransferNama?: string; // Nama file bukti transfer
  nominalTransfer: number; // Nilai rupiah transfer
  tanggalTransfer?: string; // YYYY-MM-DD
  rekening: RekeningEduventure;
  catatanTambahan?: string;
  statusKunjungan?: 'Menunggu' | 'Dikonfirmasi' | 'Terlaksana' | 'Batal';
  createdAt: string;
  updatedAt: string;
}

export type AppThemeId = 'unpad-blue' | 'unpad-emerald' | 'unpad-dark' | 'unpad-maroon';

export interface UserItem {
  userId: string;
  email: string;
  nama: string;
  role: UserRole;
  groupId?: string;
  namaGroup?: string;
  customPrivileges?: Record<string, Partial<MenuPrivilege>>;
  password?: string;
  status?: 'Aktif' | 'Nonaktif';
  statusAktif?: 'Ya' | 'Tidak';
  createdAt?: string;
  lastLogin?: string;
  photoUrl?: string;
  nip?: string;
  telepon?: string;
  unitKerja?: string;
  theme?: AppThemeId;
}

export type AppMenuId = 
  | 'dashboard' 
  | 'eduventure_dashboard'
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
  | 'gas_code'
  | 'backup_restore'
  | (string & {});

export type MenuActionKey = 'canAccess' | 'canCreate' | 'canEdit' | 'canDelete' | 'canExport';

export interface MenuPrivilege {
  canAccess: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

export interface AppMenuItemDef {
  id: string;
  label: string;
  kategoriModul: 'Dashboard & Peta' | 'Master Data Program' | 'Operasional & Peserta' | 'Laporan & Analitik' | 'Administrasi Sistem' | string;
  deskripsi: string;
  urutan?: number;
  aktif?: boolean;
  iconName?: string;
  badgeText?: string;
  isCustom?: boolean;
  supportedActions: {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canExport: boolean;
  };
}

export interface GroupAkun {
  id: string;
  namaGroup: string;
  deskripsi: string;
  warnaBadge: string;
  isSystem: boolean;
  privileges: Record<string, MenuPrivilege>;
  createdAt?: string;
  updatedAt?: string;
}

export interface LogAktivitas {
  id: string;
  timestamp: string;
  user: string;
  aktivitas: string;
  modul: string;
  idData: string;
  keterangan: string;
  ipUserAgent: string;
}

export type LoginBgType = 'preset' | 'custom' | 'gradient';

export interface LoginPresetBackground {
  id: string;
  name: string;
  location: string;
  imageUrl: string;
  thumbnailUrl: string;
}

export interface LoginSettings {
  bgType: LoginBgType;
  bgPresetId: string;
  bgCustomUrl?: string;
  bgGradient: 'navy-gold' | 'emerald-forest' | 'midnight-slate' | 'royal-maroon';
  bgOverlayOpacity: number; // 10 to 90
  bgBlurAmount: number; // 0 to 12
  
  judulLogin: string;
  subjudulLogin: string;
  cardHeroTag?: string;
  showAnnouncement: boolean;
  announcementText?: string;
  announcementType?: 'info' | 'warning' | 'success';
  
  allowGoogleSso: boolean;
  googleSsoButtonText: string;
  footerContactText: string;
  showFeatureHighlights: boolean;
}

export interface SettingApp {
  namaAplikasi: string;
  namaInstitusi: string;
  unitKerja?: string;
  subInstitusi?: string;
  logoUrl?: string;
  tahunDefault: number;
  pageSizeDefault?: number;
  paginationDefault?: number;
  domainAllowed?: string;
  whitelistDomain?: string; // e.g. "@unpad.ac.id"
  spreadsheetId: string;
  sheetUrl?: string;
  gasDeploymentUrl?: string;
  webAppUrl?: string;
  modeKoneksi?: 'local_sheet' | 'gas_live';
  lastSyncedAt?: string;
  loginSettings?: LoginSettings;
}

export interface MasterData {
  jenisKelamin: string[];
  pendidikanTerakhir: string[];
  statusPeserta: StatusPeserta[];
  statusKelulusan: StatusKelulusan[];
  provinsi: string[];
  sumberDana: string[];
  fakultasUnpad: string[];
}

export interface AdvancedSearchFilter {
  keyword: string;
  field: string;
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith';
  kategori: string;
  program: string;
  tahun: string;
  statusPeserta: string;
  statusKelulusan: string;
  jenisKelamin: string;
  provinsi: string;
  instansi: string;
  tanggalMulaiStart: string;
  tanggalMulaiEnd: string;
  tanggalSelesaiStart: string;
  tanggalSelesaiEnd: string;
  nomorSertifikat: string;
}

export interface SimpendikBackupSummary {
  totalPeserta: number;
  totalKategori: number;
  totalProgram: number;
  totalPic: number;
  totalEduventure: number;
  totalTempatEduventure: number;
  totalUsers: number;
  totalGroups: number;
  totalMenus: number;
  totalLogs: number;
}

export interface SimpendikBackupData {
  peserta: Peserta[];
  kategori: Kategori[];
  program: Program[];
  pic: PicProgram[];
  eduventure: EduventureBooking[];
  tempatEduventure?: string[];
  users?: UserItem[];
  groups?: GroupAkun[];
  menus?: AppMenuItemDef[];
  logs?: LogAktivitas[];
  settings?: SettingApp;
  theme?: AppThemeId;
}

export interface SimpendikBackupPayload {
  version: string;
  app: string;
  createdAt: string;
  createdBy: {
    userId: string;
    nama: string;
    email: string;
    role: string;
  };
  summary: SimpendikBackupSummary;
  data: SimpendikBackupData;
  checksum?: string;
  description?: string;
}

export type RestoreMode = 'replace' | 'merge';

export interface BackupSnapshotItem {
  id: string;
  timestamp: string;
  label: string;
  creatorName: string;
  creatorRole: string;
  recordCount: number;
  sizeBytes: number;
  payload: SimpendikBackupPayload;
  isAutoSafety?: boolean;
}

