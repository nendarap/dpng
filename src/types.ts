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
  pic: string;
  keterangan: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  statusData: 'Aktif' | 'Arsip';
  [key: string]: unknown;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface UserItem {
  userId: string;
  email: string;
  nama: string;
  role: UserRole;
  password?: string;
  status?: 'Aktif' | 'Nonaktif';
  statusAktif?: 'Ya' | 'Tidak';
  createdAt?: string;
  lastLogin?: string;
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
  gasDeploymentUrl?: string;
  webAppUrl?: string;
  modeKoneksi?: 'local_sheet' | 'gas_live';
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
