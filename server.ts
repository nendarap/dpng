import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize GoogleGenAI server-side with telemetry User-Agent header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// =============================================================================
// Installer Types & Models
// =============================================================================

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
  tablePrefix?: string;
  createDatabase?: boolean;
}

export interface AdminSetupConfig {
  appName: string;
  institutionName: string;
  adminName: string;
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
  seedSampleData: boolean;
}

export interface InstallPayload {
  database: DatabaseConfig;
  admin: AdminSetupConfig;
}

export interface RequirementCheckItem {
  id: string;
  title: string;
  category: 'runtime' | 'database' | 'filesystem' | 'security';
  required: string;
  current: string;
  passed: boolean;
  critical: boolean;
  recommendation?: string;
}

export interface SystemRequirementsResult {
  allPassed: boolean;
  canProceed: boolean;
  checks: RequirementCheckItem[];
  nodeVersion: string;
  platform: string;
  arch: string;
  memoryUsageMb: number;
  uptimeSeconds: number;
}

export interface TestConnectionResult {
  success: boolean;
  serverVersion?: string;
  pingMs?: number;
  databaseExists?: boolean;
  canCreateDatabase?: boolean;
  message: string;
  details?: Record<string, any>;
}

export interface InstallLogItem {
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export interface InstallResult {
  success: boolean;
  message: string;
  databaseName: string;
  tablePrefix: string;
  tablesCreated: number;
  seedRowsCount: number;
  adminEmail: string;
  adminUsername: string;
  installedAt: string;
  logs: InstallLogItem[];
  sqlDownloadUrl: string;
}

export interface InstalledMetadata {
  isInstalled: boolean;
  installedAt?: string;
  version?: string;
  appName?: string;
  institutionName?: string;
  adminEmail?: string;
  adminUsername?: string;
  dbHost?: string;
  dbPort?: number;
  dbName?: string;
  dbUser?: string;
  dbPrefix?: string;
  hasPassword?: boolean;
  status?: 'connected' | 'disconnected' | 'uninstalled';
}

// =============================================================================
// SQL Schema & Seed Data Generator Functions
// =============================================================================

function sanitizeIdentifier(str: string): string {
  return str.replace(/[^a-zA-Z0-9_]/g, '');
}

function escapeSqlString(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  const str = String(val);
  return `'${str.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function generateMySQLSchema(config: DatabaseConfig, _admin?: AdminSetupConfig): string {
  const prefix = sanitizeIdentifier(config.tablePrefix || 'sim_');
  const dbName = sanitizeIdentifier(config.database || 'simpendik_unpad_db');

  return `
-- =============================================================================
-- SIMPENDIK NON-GELAR UNIVERSITAS PADJADJARAN
-- MySQL Database Installation Script
-- Generated at: ${new Date().toISOString()}
-- Target Engine: MySQL 5.7+ / 8.0+ / MariaDB 10.3+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+07:00";

-- 1. Create & Select Database
CREATE DATABASE IF NOT EXISTS \`${dbName}\` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE \`${dbName}\`;

-- Table: ${prefix}settings (App & System Configurations)
CREATE TABLE IF NOT EXISTS \`${prefix}settings\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`key_name\` VARCHAR(100) NOT NULL UNIQUE,
  \`value_text\` LONGTEXT NOT NULL,
  \`deskripsi\` VARCHAR(255) DEFAULT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pengaturan Aplikasi SIMPENDIK';

-- Table: ${prefix}user_groups (Role & Group Privilege Definitions)
CREATE TABLE IF NOT EXISTS \`${prefix}user_groups\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`nama_group\` VARCHAR(100) NOT NULL,
  \`deskripsi\` TEXT DEFAULT NULL,
  \`warna_badge\` VARCHAR(60) DEFAULT 'bg-blue-100 text-blue-700',
  \`is_system\` TINYINT(1) DEFAULT 0,
  \`privileges_json\` LONGTEXT DEFAULT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Grup Akun dan Akses Menu';

-- Table: ${prefix}users (System Accounts & Staff)
CREATE TABLE IF NOT EXISTS \`${prefix}users\` (
  \`user_id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`username\` VARCHAR(100) NOT NULL UNIQUE,
  \`email\` VARCHAR(150) NOT NULL UNIQUE,
  \`nama\` VARCHAR(150) NOT NULL,
  \`role\` ENUM('ADMIN', 'OPERATOR', 'VIEWER') NOT NULL DEFAULT 'OPERATOR',
  \`group_id\` VARCHAR(50) DEFAULT NULL,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`status\` VARCHAR(20) DEFAULT 'Aktif',
  \`nip\` VARCHAR(50) DEFAULT NULL,
  \`telepon\` VARCHAR(30) DEFAULT NULL,
  \`unit_kerja\` VARCHAR(150) DEFAULT NULL,
  \`theme\` VARCHAR(50) DEFAULT 'unpad-blue',
  \`photo_url\` TEXT DEFAULT NULL,
  \`last_login\` DATETIME DEFAULT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY \`idx_users_role\` (\`role\`),
  KEY \`idx_users_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel Pengguna dan Administrator';

-- Table: ${prefix}app_menus (Dynamic Menu & Privilege Items)
CREATE TABLE IF NOT EXISTS \`${prefix}app_menus\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`label\` VARCHAR(100) NOT NULL,
  \`kategori_modul\` VARCHAR(100) NOT NULL,
  \`deskripsi\` TEXT DEFAULT NULL,
  \`urutan\` INT DEFAULT 0,
  \`aktif\` TINYINT(1) DEFAULT 1,
  \`icon_name\` VARCHAR(50) DEFAULT NULL,
  \`badge_text\` VARCHAR(50) DEFAULT NULL,
  \`parent_id\` VARCHAR(50) DEFAULT NULL,
  \`supported_actions_json\` TEXT DEFAULT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Daftar Menu & Modul Aplikasi';

-- Table: ${prefix}kategori (Kategori Program Pelatihan Non Gelar)
CREATE TABLE IF NOT EXISTS \`${prefix}kategori\` (
  \`id_kategori\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`nama_kategori\` VARCHAR(150) NOT NULL,
  \`deskripsi\` TEXT DEFAULT NULL,
  \`status_aktif\` VARCHAR(10) DEFAULT 'Ya',
  \`status_pendaftaran_kategori\` ENUM('Buka', 'Tutup') DEFAULT 'Buka',
  \`urutan\` INT DEFAULT 0,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY \`idx_kategori_status\` (\`status_aktif\`),
  KEY \`idx_kategori_daftar\` (\`status_pendaftaran_kategori\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Kategori Program Pendidikan Non Gelar';

-- Table: ${prefix}pic_program (Person In Charge / Narahubung Program)
CREATE TABLE IF NOT EXISTS \`${prefix}pic_program\` (
  \`id_pic\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`nama_lengkap\` VARCHAR(150) NOT NULL,
  \`gelar_depan\` VARCHAR(50) DEFAULT NULL,
  \`gelar_belakang\` VARCHAR(50) DEFAULT NULL,
  \`nip\` VARCHAR(50) DEFAULT NULL,
  \`email\` VARCHAR(150) DEFAULT NULL,
  \`nomor_hp\` VARCHAR(30) DEFAULT NULL,
  \`jabatan\` VARCHAR(100) DEFAULT NULL,
  \`unit_fakultas\` VARCHAR(150) DEFAULT NULL,
  \`id_program_utama\` VARCHAR(50) DEFAULT NULL,
  \`nama_program_utama\` VARCHAR(200) DEFAULT NULL,
  \`status_aktif\` VARCHAR(10) DEFAULT 'Ya',
  \`keterangan\` TEXT DEFAULT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='PIC / Narahubung Program Pelatihan';

-- Table: ${prefix}program (Katalog Program Pelatihan Non Gelar)
CREATE TABLE IF NOT EXISTS \`${prefix}program\` (
  \`id_program\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`id_kategori\` VARCHAR(50) NOT NULL,
  \`nama_program\` VARCHAR(200) NOT NULL,
  \`deskripsi\` TEXT DEFAULT NULL,
  \`status_aktif\` VARCHAR(10) DEFAULT 'Ya',
  \`status_pendaftaran\` ENUM('Buka', 'Tutup', 'Segera Dibuka', 'Penuh') DEFAULT 'Buka',
  \`tanggal_buka_pendaftaran\` DATE DEFAULT NULL,
  \`tanggal_tutup_pendaftaran\` DATE DEFAULT NULL,
  \`kuota_peserta\` INT DEFAULT 30,
  \`keterangan_pendaftaran\` TEXT DEFAULT NULL,
  \`id_pic\` VARCHAR(50) DEFAULT NULL,
  \`nama_pic\` VARCHAR(150) DEFAULT NULL,
  \`durasi\` VARCHAR(100) DEFAULT NULL,
  \`biaya\` DECIMAL(15,2) DEFAULT 0,
  \`tanggal_mulai\` DATE DEFAULT NULL,
  \`tanggal_selesai\` DATE DEFAULT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY \`idx_prog_kategori\` (\`id_kategori\`),
  KEY \`idx_prog_status\` (\`status_aktif\`),
  KEY \`idx_prog_daftar\` (\`status_pendaftaran\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Daftar Program Pelatihan Non Gelar';

-- Table: ${prefix}pegawai (Database Pegawai & Dosen Pengelola DPNG)
CREATE TABLE IF NOT EXISTS \`${prefix}pegawai\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`nip\` VARCHAR(50) NOT NULL,
  \`nama\` VARCHAR(150) NOT NULL,
  \`kartu_pegawai\` VARCHAR(50) DEFAULT NULL,
  \`status_kepegawaian\` VARCHAR(50) DEFAULT 'PNS',
  \`unit_kerja\` VARCHAR(150) DEFAULT NULL,
  \`bagian\` VARCHAR(100) DEFAULT NULL,
  \`bidang_kerja\` VARCHAR(150) DEFAULT NULL,
  \`nidn_nuptk\` VARCHAR(50) DEFAULT NULL,
  \`status_aktif\` VARCHAR(50) DEFAULT 'Aktif',
  \`keterangan_status_aktif\` TEXT DEFAULT NULL,
  \`tempat_lahir\` VARCHAR(100) DEFAULT NULL,
  \`tanggal_lahir\` DATE DEFAULT NULL,
  \`jenis_kelamin\` VARCHAR(20) DEFAULT 'Laki-laki',
  \`agama\` VARCHAR(50) DEFAULT 'Islam',
  \`kewarganegaraan\` VARCHAR(50) DEFAULT 'WNI',
  \`status_marital\` VARCHAR(50) DEFAULT 'Kawin',
  \`alamat\` TEXT DEFAULT NULL,
  \`kota\` VARCHAR(100) DEFAULT NULL,
  \`propinsi\` VARCHAR(100) DEFAULT NULL,
  \`hp\` VARCHAR(30) DEFAULT NULL,
  \`email\` VARCHAR(150) DEFAULT NULL,
  \`lembaga_pendidikan\` VARCHAR(150) DEFAULT NULL,
  \`jenjang\` VARCHAR(20) DEFAULT 'S1',
  \`jurusan\` VARCHAR(150) DEFAULT NULL,
  \`pangkat\` VARCHAR(100) DEFAULT NULL,
  \`golongan\` VARCHAR(20) DEFAULT NULL,
  \`jabatan_fungsional\` VARCHAR(100) DEFAULT NULL,
  \`foto_url\` TEXT DEFAULT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY \`idx_pegawai_nip\` (\`nip\`),
  KEY \`idx_pegawai_unit\` (\`unit_kerja\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Data Kepegawaian Pengelola DPNG';

-- Table: ${prefix}peserta (Data Peserta Pelatihan & Verifikasi)
CREATE TABLE IF NOT EXISTS \`${prefix}peserta\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`nomor_registrasi\` VARCHAR(50) NOT NULL UNIQUE,
  \`nik\` VARCHAR(30) DEFAULT NULL,
  \`nip\` VARCHAR(50) DEFAULT NULL,
  \`nama_lengkap\` VARCHAR(150) NOT NULL,
  \`gelar_depan\` VARCHAR(30) DEFAULT NULL,
  \`gelar_belakang\` VARCHAR(30) DEFAULT NULL,
  \`jenis_kelamin\` ENUM('Laki-laki', 'Perempuan') DEFAULT 'Laki-laki',
  \`tempat_lahir\` VARCHAR(100) DEFAULT NULL,
  \`tanggal_lahir\` DATE DEFAULT NULL,
  \`email\` VARCHAR(150) DEFAULT NULL,
  \`nomor_hp\` VARCHAR(30) DEFAULT NULL,
  \`instansi\` VARCHAR(150) DEFAULT NULL,
  \`jabatan\` VARCHAR(100) DEFAULT NULL,
  \`fakultas_unit\` VARCHAR(150) DEFAULT NULL,
  \`pendidikan_terakhir\` VARCHAR(50) DEFAULT NULL,
  \`provinsi\` VARCHAR(100) DEFAULT NULL,
  \`kota_kabupaten\` VARCHAR(100) DEFAULT NULL,
  \`alamat\` TEXT DEFAULT NULL,
  \`id_kategori\` VARCHAR(50) DEFAULT NULL,
  \`kategori_program\` VARCHAR(150) DEFAULT NULL,
  \`id_program\` VARCHAR(50) DEFAULT NULL,
  \`nama_program\` VARCHAR(200) DEFAULT NULL,
  \`angkatan_batch\` VARCHAR(50) DEFAULT NULL,
  \`tahun\` INT DEFAULT 2026,
  \`tanggal_mulai\` DATE DEFAULT NULL,
  \`tanggal_selesai\` DATE DEFAULT NULL,
  \`status_peserta\` VARCHAR(50) DEFAULT 'Terdaftar',
  \`status_kelulusan\` VARCHAR(50) DEFAULT 'Belum Evaluasi',
  \`status_verifikasi\` VARCHAR(50) DEFAULT 'Menunggu Verifikasi',
  \`tanggal_verifikasi\` DATETIME DEFAULT NULL,
  \`verifikator_nama\` VARCHAR(150) DEFAULT NULL,
  \`verifikator_role\` VARCHAR(50) DEFAULT NULL,
  \`catatan_verifikasi\` TEXT DEFAULT NULL,
  \`dokumen_json\` LONGTEXT DEFAULT NULL,
  \`nomor_sertifikat\` VARCHAR(100) DEFAULT NULL,
  \`tanggal_sertifikat\` DATE DEFAULT NULL,
  \`nilai_skor\` VARCHAR(20) DEFAULT NULL,
  \`biaya_program\` DECIMAL(15,2) DEFAULT 0,
  \`sumber_dana\` VARCHAR(100) DEFAULT 'Mandiri',
  \`pic\` VARCHAR(150) DEFAULT NULL,
  \`keterangan\` TEXT DEFAULT NULL,
  \`status_data\` VARCHAR(20) DEFAULT 'Aktif',
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`created_by\` VARCHAR(150) DEFAULT 'System',
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`updated_by\` VARCHAR(150) DEFAULT 'System',
  KEY \`idx_peserta_reg\` (\`nomor_registrasi\`),
  KEY \`idx_peserta_prog\` (\`id_program\`),
  KEY \`idx_peserta_stat\` (\`status_peserta\`),
  KEY \`idx_peserta_verif\` (\`status_verifikasi\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Data Peserta Pendidikan Non Gelar';

-- Table: ${prefix}eduventure_booking (Kunjungan Eduventure & Study Tour)
CREATE TABLE IF NOT EXISTS \`${prefix}eduventure_booking\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`id_kategori\` VARCHAR(50) DEFAULT 'KAT-006',
  \`nama_kategori\` VARCHAR(100) DEFAULT 'Eduventure',
  \`nama_sekolah\` VARCHAR(150) NOT NULL,
  \`alamat\` TEXT DEFAULT NULL,
  \`kontak_person\` VARCHAR(100) NOT NULL,
  \`nomor_kontak\` VARCHAR(30) NOT NULL,
  \`email_kontak\` VARCHAR(150) DEFAULT NULL,
  \`jumlah_peserta\` INT DEFAULT 1,
  \`jumlah_guru\` INT DEFAULT 0,
  \`tanggal_pelaksanaan\` DATE NOT NULL,
  \`waktu_mulai\` VARCHAR(10) DEFAULT '08:30',
  \`waktu_selesai\` VARCHAR(10) DEFAULT '12:00',
  \`tempat_penyelenggaraan\` VARCHAR(150) DEFAULT 'Bale Sawala',
  \`skema_paket\` VARCHAR(100) DEFAULT 'Eduventure Lite',
  \`pilihan_kunjungan\` VARCHAR(50) DEFAULT 'Universitas',
  \`fakultas_tujuan_json\` TEXT DEFAULT NULL,
  \`status_bayar\` ENUM('Sudah', 'Belum') DEFAULT 'Belum',
  \`bukti_transfer_url\` LONGTEXT DEFAULT NULL,
  \`nominal_transfer\` DECIMAL(15,2) DEFAULT 0,
  \`tanggal_transfer\` DATE DEFAULT NULL,
  \`rekening\` VARCHAR(100) DEFAULT 'Eduventure 9882340560200004',
  \`catatan_tambahan\` TEXT DEFAULT NULL,
  \`status_kunjungan\` VARCHAR(50) DEFAULT 'Menunggu',
  \`google_calendar_event_id\` VARCHAR(150) DEFAULT NULL,
  \`whatsapp_message_id\` VARCHAR(100) DEFAULT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY \`idx_edv_tanggal\` (\`tanggal_pelaksanaan\`),
  KEY \`idx_edv_status\` (\`status_kunjungan\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Data Pemesanan Kunjungan Eduventure';

-- Table: ${prefix}eduventure_tempat (Lokasi & Gedung Kunjungan)
CREATE TABLE IF NOT EXISTS \`${prefix}eduventure_tempat\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`nama_tempat\` VARCHAR(150) NOT NULL,
  \`kapasitas\` INT DEFAULT 100,
  \`lokasi\` VARCHAR(150) DEFAULT NULL,
  \`fasilitas_json\` TEXT DEFAULT NULL,
  \`deskripsi\` TEXT DEFAULT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lokasi & Gedung Kegiatan Eduventure';

-- Table: ${prefix}log_aktivitas (Audit Trail Log Pengguna)
CREATE TABLE IF NOT EXISTS \`${prefix}log_aktivitas\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`timestamp\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`user\` VARCHAR(150) NOT NULL,
  \`aktivitas\` VARCHAR(150) NOT NULL,
  \`modul\` VARCHAR(100) NOT NULL,
  \`id_data\` VARCHAR(100) DEFAULT NULL,
  \`keterangan\` TEXT DEFAULT NULL,
  \`ip_user_agent\` TEXT DEFAULT NULL,
  KEY \`idx_log_timestamp\` (\`timestamp\`),
  KEY \`idx_log_user\` (\`user\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Riwayat Aktivitas & Audit Trail';

-- Table: ${prefix}pengaturan_pendaftaran (Konfigurasi Pendaftaran Publik)
CREATE TABLE IF NOT EXISTS \`${prefix}pengaturan_pendaftaran\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`status_pendaftaran_global\` ENUM('Buka', 'Tutup') DEFAULT 'Buka',
  \`pesan_pendaftaran_ditutup\` TEXT DEFAULT NULL,
  \`auto_tutup_jika_lewat_deadline\` TINYINT(1) DEFAULT 1,
  \`auto_tutup_jika_kuota_penuh\` TINYINT(1) DEFAULT 1,
  \`kontak_bantuan_wa\` VARCHAR(30) DEFAULT '081224681357',
  \`kontak_bantuan_email\` VARCHAR(150) DEFAULT 'dpng@unpad.ac.id',
  \`pengumuman_pendaftaran\` TEXT DEFAULT NULL,
  \`tampilkan_sisa_kuota_publik\` TINYINT(1) DEFAULT 1,
  \`tampilkan_periode_publik\` TINYINT(1) DEFAULT 1,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pengaturan Alur Pendaftaran Publik';

-- Table: ${prefix}installer_lock (Riwayat & Kunci Instalasi Sistem)
CREATE TABLE IF NOT EXISTS \`${prefix}installer_lock\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`version\` VARCHAR(50) DEFAULT '1.0.0',
  \`installed_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`app_name\` VARCHAR(150) NOT NULL,
  \`admin_email\` VARCHAR(150) NOT NULL,
  \`database_name\` VARCHAR(100) NOT NULL,
  \`table_prefix\` VARCHAR(20) DEFAULT 'sim_',
  \`environment\` VARCHAR(50) DEFAULT 'production'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Kunci & Metadata Installer';

SET FOREIGN_KEY_CHECKS = 1;
`;
}

function generateSeedDataSql(config: DatabaseConfig, admin?: AdminSetupConfig): string {
  const prefix = sanitizeIdentifier(config.tablePrefix || 'sim_');

  const adminName = admin?.adminName || 'Dr. Nendar Herdiana, M.Kom';
  const adminUsername = admin?.adminUsername || 'admin';
  const adminEmail = admin?.adminEmail || 'nendar@unpad.ac.id';
  const adminPassword = admin?.adminPassword || 'admin123';
  const appName = admin?.appName || 'SIMPENDIK NON GELAR UNPAD';
  const institutionName = admin?.institutionName || 'Universitas Padjadjaran';

  return `
-- =============================================================================
-- SEED DATA & INITIAL RECORDS FOR SIMPENDIK UNPAD
-- =============================================================================

-- 1. Insert Initial Administrator User
INSERT INTO \`${prefix}users\` 
  (\`user_id\`, \`username\`, \`email\`, \`nama\`, \`role\`, \`group_id\`, \`password_hash\`, \`status\`, \`nip\`, \`telepon\`, \`unit_kerja\`, \`theme\`)
VALUES
  ('USR-001', ${escapeSqlString(adminUsername)}, ${escapeSqlString(adminEmail)}, ${escapeSqlString(adminName)}, 'ADMIN', 'GRP-ADMIN', ${escapeSqlString(adminPassword)}, 'Aktif', '197805122003121002', '081220011223', 'Direktorat DPNG', 'unpad-blue')
ON DUPLICATE KEY UPDATE 
  \`nama\` = VALUES(\`nama\`), 
  \`role\` = VALUES(\`role\`), 
  \`password_hash\` = VALUES(\`password_hash\`);

-- 2. Insert Standard User Groups
INSERT INTO \`${prefix}user_groups\` (\`id\`, \`nama_group\`, \`deskripsi\`, \`warna_badge\`, \`is_system\`)
VALUES
  ('GRP-ADMIN', 'Super Administrator', 'Akses penuh ke semua modul, pengaturan sistem, database, dan manajemen akun', 'bg-red-100 text-red-800', 1),
  ('GRP-OPERATOR', 'Operator DPNG', 'Pengelolaan data master, pendaftaran peserta, verifikasi dokumen, dan export', 'bg-blue-100 text-blue-800', 1),
  ('GRP-VIEWER', 'Viewer Fakultas / Unit', 'Hak akses baca untuk melihat statistik, daftar peserta, dan monitoring', 'bg-green-100 text-green-800', 1)
ON DUPLICATE KEY UPDATE \`nama_group\` = VALUES(\`nama_group\`);

-- 3. Insert Application Settings
INSERT INTO \`${prefix}settings\` (\`key_name\`, \`value_text\`, \`deskripsi\`)
VALUES
  ('app_info', ${escapeSqlString(JSON.stringify({
    namaAplikasi: appName,
    namaInstitusi: institutionName,
    subInstitusi: 'Direktorat Pendidikan Non Gelar',
    logoUrl: 'https://unpad.ac.id/wp-content/uploads/2021/04/Logo-Unpad-Biru.png',
    tahunDefault: 2026,
    paginationDefault: 10,
    whitelistDomain: '@unpad.ac.id'
  }))}, 'Konfigurasi Utama SIMPENDIK'),
  ('login_settings', ${escapeSqlString(JSON.stringify({
    bgType: 'preset',
    bgPresetId: 'unpad-rektorat',
    bgGradient: 'navy-gold',
    bgOverlayOpacity: 70,
    bgBlurAmount: 2,
    judulLogin: 'SIMPENDIK Non-Gelar Unpad',
    subjudulLogin: 'Sistem Informasi Manajemen Data Peserta Pendidikan Non Gelar',
    showAnnouncement: true,
    announcementText: 'Pendaftaran Semester Genap 2026 telah dibuka. Pastikan kelengkapan berkas peserta.',
    announcementType: 'info',
    allowGoogleSso: true,
    googleSsoButtonText: 'Masuk dengan Akun Unpad (@unpad.ac.id)',
    footerContactText: 'Butuh bantuan teknis? Hubungi helpdesk DPNG: dpng@unpad.ac.id | WhatsApp: 0812-2468-1357',
    showFeatureHighlights: true
  }))}, 'Konfigurasi Tampilan Halaman Login')
ON DUPLICATE KEY UPDATE \`value_text\` = VALUES(\`value_text\`);

-- 4. Insert Pengaturan Pendaftaran Publik
INSERT INTO \`${prefix}pengaturan_pendaftaran\` 
  (\`id\`, \`status_pendaftaran_global\`, \`pesan_pendaftaran_ditutup\`, \`auto_tutup_jika_lewat_deadline\`, \`auto_tutup_jika_kuota_penuh\`, \`kontak_bantuan_wa\`, \`kontak_bantuan_email\`, \`pengumuman_pendaftaran\`, \`tampilkan_sisa_kuota_publik\`, \`tampilkan_periode_publik\`)
VALUES
  (1, 'Buka', 'Pendaftaran program pelatihan pendidikan non-gelar Universitas Padjadjaran sedang ditutup sementara.', 1, 1, '081224681357', 'dpng@unpad.ac.id', 'Pendaftaran Program Pelatihan Pendidikan Non Gelar Unpad Tahun 2026 telah dibuka. Silakan pilih kategori dan program yang tersedia.', 1, 1)
ON DUPLICATE KEY UPDATE \`status_pendaftaran_global\` = VALUES(\`status_pendaftaran_global\`);

-- 5. Insert Master Kategori Program Pelatihan
INSERT INTO \`${prefix}kategori\` (\`id_kategori\`, \`nama_kategori\`, \`deskripsi\`, \`status_aktif\`, \`status_pendaftaran_kategori\`, \`urutan\`)
VALUES
  ('KAT-001', 'Sertifikasi Kompetensi & Profesi', 'Program sertifikasi berstandar BNSP dan asosiasi profesi resmi tingkat nasional maupun internasional.', 'Ya', 'Buka', 1),
  ('KAT-002', 'Pelatihan Teknis & Vokasional', 'Kursus keahlian praktis, laboratorium, teknologi terapan, dan vokasi industri.', 'Ya', 'Buka', 2),
  ('KAT-003', 'Pengembangan Bahasa & Komunikasi', 'Kursus bahasa asing (TOEFL, IELTS, BIPA), diplomasi, dan komunikasi profesional publik.', 'Ya', 'Buka', 3),
  ('KAT-004', 'Kepemimpinan & Manajerial (Executive)', 'Executive education untuk direksi, manajer, pejabat struktural, dan ASN instansi.', 'Ya', 'Buka', 4),
  ('KAT-005', 'Kesehatan, Medis, & Keperawatan', 'Pelatihan klinis spesifik, continuing medical education (CME), dan sertifikasi nakes terakreditasi Kemenkes.', 'Ya', 'Buka', 5),
  ('KAT-006', 'Eduventure (Study Tour & Kampus)', 'Program kunjungan edukasi, eksplorasi laboratorium sains, dan pengenalan kampus Unpad untuk sekolah & instansi.', 'Ya', 'Buka', 6),
  ('KAT-007', 'Pendidikan & Pelatihan Dosen (PEKERTI/AA)', 'Program peningkatan keterampilan dasar teknik instruksional dan applied approach bagi dosen se-Indonesia.', 'Ya', 'Buka', 7)
ON DUPLICATE KEY UPDATE \`nama_kategori\` = VALUES(\`nama_kategori\`);

-- 6. Insert Master PIC Narahubung Program
INSERT INTO \`${prefix}pic_program\` (\`id_pic\`, \`nama_lengkap\`, \`gelar_depan\`, \`gelar_belakang\`, \`nip\`, \`email\`, \`nomor_hp\`, \`jabatan\`, \`unit_fakultas\`, \`id_program_utama\`, \`nama_program_utama\`, \`status_aktif\`, \`keterangan\`)
VALUES
  ('PIC-001', 'Dr. Hendra Wijaya', 'Dr.', 'M.Pd.', '197503142000031001', 'hendra.wijaya@unpad.ac.id', '081221345678', 'Koordinator Program', 'Direktorat Pendidikan Non Gelar', 'PRG-001', 'PEKERTI Dosen Gelombang I', 'Ya', 'Koordinator Pelatihan PEKERTI & Applied Approach (AA) Dosen se-Indonesia'),
  ('PIC-002', 'Prof. Dr. apt. Keri Lestari', 'Prof. Dr. apt.', 'M.Si.', '196904271994032001', 'keri.lestari@unpad.ac.id', '081122334455', 'Koordinator Program', 'Fakultas Farmasi (FF)', 'PRG-008', 'Advanced Clinical Pharmacy Practice', 'Ya', 'Penanggung Jawab Pelatihan Tenaga Kesehatan & Farmasi Klinis Kemenkes'),
  ('PIC-003', 'Dr. Raden Muhamad Aris', 'Dr.', 'S.T., M.T.', '198208152008121002', 'aris.muhamad@unpad.ac.id', '081399887766', 'Koordinator Teknis', 'Fakultas Matematika dan IPA (FMIPA)', 'PRG-003', 'Data Science & Machine Learning Bootcamp', 'Ya', 'Narahubung Sertifikasi Data Science & Kecerdasan Buatan'),
  ('PIC-004', 'Dra. Euis Rohaeti', 'Dra.', 'M.Hum.', '197011051996032001', 'euis.rohaeti@unpad.ac.id', '081560012345', 'Sekretaris Program', 'Pusat Bahasa Unpad', 'PRG-004', 'Intensive Academic English & TOEFL Preparation', 'Ya', 'Koordinator Kursus Bahasa Asing & BIPA Unpad'),
  ('PIC-005', 'Gilar Gandana', '', 'S.Kom., M.Kom.', '198802192014041001', 'gilar.gandana@unpad.ac.id', '081224681357', 'Koordinator Eduventure', 'Direktorat Pendidikan Non Gelar', 'PRG-006', 'Eduventure Jelajah Kampus Unpad', 'Ya', 'Penanggung Jawab Booking Eduventure & Kunjungan Sekolah')
ON DUPLICATE KEY UPDATE \`nama_lengkap\` = VALUES(\`nama_lengkap\`);

-- 7. Insert Master Program Pelatihan
INSERT INTO \`${prefix}program\` (\`id_program\`, \`id_kategori\`, \`nama_program\`, \`deskripsi\`, \`status_aktif\`, \`status_pendaftaran\`, \`tanggal_buka_pendaftaran\`, \`tanggal_tutup_pendaftaran\`, \`kuota_peserta\`, \`keterangan_pendaftaran\`, \`id_pic\`, \`nama_pic\`, \`durasi\`, \`biaya\`, \`tanggal_mulai\`, \`tanggal_selesai\`)
VALUES
  ('PRG-001', 'KAT-007', 'PEKERTI Dosen Gelombang I', 'Peningkatan Keterampilan Dasar Teknik Instruksional untuk dosen pemula dan calon dosen bersertifikat nasional.', 'Ya', 'Buka', '2026-01-01', '2026-03-31', 60, 'Pendaftaran dibuka untuk Dosen PTN & PTS seluruh Indonesia.', 'PIC-001', 'Dr. Hendra Wijaya', '10 Hari (80 Jam Pelajaran)', 3500000, '2026-04-10', '2026-04-20'),
  ('PRG-002', 'KAT-001', 'Sertifikasi Ahli Pengadaan Barang/Jasa Pemerintah (LKPP)', 'Pelatihan persiapan dan ujian kompetensi keahlian pengadaan pemerintah bekerjasama dengan LKPP RI.', 'Ya', 'Buka', '2026-01-10', '2026-04-15', 40, 'Tersedia kuota untuk umum dan instansi BUMN/Kementerian.', 'PIC-001', 'Dr. Hendra Wijaya', '5 Hari (40 Jam Pelajaran)', 4500000, '2026-05-05', '2026-05-09'),
  ('PRG-003', 'KAT-002', 'Data Science & Machine Learning Bootcamp', 'Pelatihan intensif Python, machine learning, visualisasi data, dan big data analytics untuk praktisi industri.', 'Ya', 'Buka', '2026-02-01', '2026-05-01', 35, 'Peserta mendapatkan akses GPU cloud server Unpad.', 'PIC-003', 'Dr. Raden Muhamad Aris', '6 Minggu (Weekend)', 5000000, '2026-05-16', '2026-06-21'),
  ('PRG-004', 'KAT-003', 'Intensive Academic English & TOEFL Preparation', 'Kursus penguatan bahasa Inggris akademik untuk persiapan beasiswa S2/S3 dan publikasi internasional.', 'Ya', 'Buka', '2026-01-15', '2026-04-30', 50, 'Kelas hybrid (tatap muka & LMS online).', 'PIC-004', 'Dra. Euis Rohaeti', '2 Bulan (32 Pertemuan)', 2200000, '2026-05-04', '2026-06-26'),
  ('PRG-005', 'KAT-004', 'Strategic Leadership & Change Management', 'Executive course bagi pimpinan instansi untuk memperkuat kapabilitas adaptasi kepemimpinan digital.', 'Ya', 'Buka', '2026-01-20', '2026-04-25', 25, 'Termasuk mentoring 1-on-1 bersama pakar kebijakan publik.', 'PIC-001', 'Dr. Hendra Wijaya', '3 Hari Residensial', 7500000, '2026-05-12', '2026-05-14'),
  ('PRG-006', 'KAT-006', 'Eduventure Jelajah Kampus Unpad', 'Paket kunjungan edukatif, laboratorium hayati, museum anatomi, dan simulasi perkuliahan bagi SMA/SMK.', 'Ya', 'Buka', '2026-01-01', '2026-12-31', 500, 'Pemesanan rombongan sekolah minimal 30 peserta.', 'PIC-005', 'Gilar Gandana', '1 Hari Kunjungan (08.30-15.00 WIB)', 75000, '2026-01-01', '2026-12-31')
ON DUPLICATE KEY UPDATE \`nama_program\` = VALUES(\`nama_program\`);

-- 8. Insert Gedung / Tempat Eduventure
INSERT INTO \`${prefix}eduventure_tempat\` (\`id\`, \`nama_tempat\`, \`kapasitas\`, \`lokasi\`, \`deskripsi\`)
VALUES
  ('TMP-001', 'Bale Sawala Unpad', 400, 'Gedung Rektorat Sayap Kanan Jatinangor', 'Auditorium utama ber-AC, sound system konser, proyektor laser 4K.'),
  ('TMP-002', 'Bale Rucita Unpad', 250, 'Gedung Rektorat Sayap Kiri Jatinangor', 'Ruang pertemuan semi-auditorium untuk presentasi dan workshop interaktif.'),
  ('TMP-003', 'Bale Santika (Sport Center)', 1500, 'Kampus Unpad Jatinangor', 'Hall serbaguna untuk gathering akbar dan pameran pendidikan.'),
  ('TMP-004', 'Auditorium Fakultas Farmasi', 200, 'Gedung Farmasi Unpad Jatinangor', 'Auditorium kedap suara dengan fasilitas demonstrasi sains.'),
  ('TMP-005', 'Auditorium Graha Sanusi Hardjadinata', 800, 'Kampus Unpad Dipatiukur Bandung', 'Gedung bersejarah pertemuan megah di pusat kota Bandung.')
ON DUPLICATE KEY UPDATE \`nama_tempat\` = VALUES(\`nama_tempat\`);

-- 9. Insert Sample Log Activity
INSERT INTO \`${prefix}log_aktivitas\` (\`id\`, \`timestamp\`, \`user\`, \`aktivitas\`, \`modul\`, \`id_data\`, \`keterangan\`, \`ip_user_agent\`)
VALUES
  ('LOG-001', NOW(), 'Installer System', 'Instalasi Database MySQL Berhasil', 'Installer', 'DB-INIT', 'Database dan tabel SIMPENDIK Unpad berhasil diinisialisasi melalui Web Installer.', '127.0.0.1 (Web Installer)'),
  ('LOG-002', NOW(), ${escapeSqlString(adminUsername)}, 'Pembuatan Akun Super Admin', 'User Management', 'USR-001', 'Akun administrator utama berhasil didaftarkan.', '127.0.0.1');

-- 10. Record Installer Lock
INSERT INTO \`${prefix}installer_lock\` (\`version\`, \`installed_at\`, \`app_name\`, \`admin_email\`, \`database_name\`, \`table_prefix\`, \`environment\`)
VALUES
  ('1.0.0', NOW(), ${escapeSqlString(appName)}, ${escapeSqlString(adminEmail)}, ${escapeSqlString(config.database || 'simpendik_unpad_db')}, ${escapeSqlString(prefix)}, 'production');
`;
}

// =============================================================================
// Installer Service Core Functions
// =============================================================================

const CONFIG_DIR = path.join(process.cwd(), 'config');
const INSTALLED_FILE = path.join(CONFIG_DIR, 'installed.json');
const DATABASE_CONFIG_FILE = path.join(CONFIG_DIR, 'database.json');

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    try {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    } catch {
      // ignore
    }
  }
}

async function checkRequirements(): Promise<SystemRequirementsResult> {
  ensureConfigDir();
  const checks: RequirementCheckItem[] = [];

  // 1. Node.js Version Check
  const nodeVer = process.version;
  const majorNode = parseInt(nodeVer.replace('v', '').split('.')[0], 10);
  const nodePassed = majorNode >= 18;
  checks.push({
    id: 'node_runtime',
    title: 'Node.js Runtime Engine',
    category: 'runtime',
    required: 'v18.0.0 atau lebih baru',
    current: nodeVer,
    passed: nodePassed,
    critical: true,
    recommendation: nodePassed ? undefined : 'Perbarui Node.js ke versi LTS (18, 20, atau 22).',
  });

  // 2. MySQL Client Module (mysql2)
  let mysqlModulePassed = false;
  let mysqlVer = 'N/A';
  try {
    if (mysql && typeof mysql.createConnection === 'function') {
      mysqlModulePassed = true;
      mysqlVer = 'mysql2/promise (Native Async Driver)';
    }
  } catch (err: any) {
    mysqlVer = err?.message || 'Error loading mysql2';
  }
  checks.push({
    id: 'mysql_driver',
    title: 'MySQL Client Driver (mysql2)',
    category: 'database',
    required: 'Tersedia & Terinstal',
    current: mysqlModulePassed ? 'Aktif (mysql2 v3+)' : mysqlVer,
    passed: mysqlModulePassed,
    critical: true,
    recommendation: mysqlModulePassed ? undefined : 'Jalankan npm install mysql2 di server.',
  });

  // 3. File System Write Permissions
  let fsWritePassed = false;
  try {
    const testProbePath = path.join(CONFIG_DIR, `.write_test_${Date.now()}.tmp`);
    fs.writeFileSync(testProbePath, 'simpendik_probe', 'utf8');
    const readBack = fs.readFileSync(testProbePath, 'utf8');
    fs.unlinkSync(testProbePath);
    fsWritePassed = readBack === 'simpendik_probe';
  } catch {
    fsWritePassed = false;
  }
  checks.push({
    id: 'filesystem_writable',
    title: 'Izin Tulis Berkas Konfigurasi (/config)',
    category: 'filesystem',
    required: 'Writable (0755 / 0775)',
    current: fsWritePassed ? 'Dapat Menulis (Writable)' : 'Read-Only (Tolak Akses)',
    passed: fsWritePassed,
    critical: true,
    recommendation: fsWritePassed ? undefined : 'Pastikan direktori memiliki izin tulis (chmod -R 775 config).',
  });

  // 4. Memory Check
  const freeMemMb = Math.round(os.freemem() / (1024 * 1024));
  const memPassed = freeMemMb >= 64;
  checks.push({
    id: 'system_memory',
    title: 'Memori Sistem Bebas (RAM)',
    category: 'runtime',
    required: 'Min. 64 MB Bebas',
    current: `${freeMemMb} MB Tersedia`,
    passed: memPassed,
    critical: false,
    recommendation: memPassed ? undefined : 'Alokasi RAM sistem rendah.',
  });

  // 5. Crypto & Security
  let cryptoPassed = false;
  try {
    const testHash = crypto.createHash('sha256').update('unpad').digest('hex');
    cryptoPassed = Boolean(testHash && testHash.length === 64);
  } catch {
    cryptoPassed = false;
  }
  checks.push({
    id: 'crypto_support',
    title: 'Modul Kriptografi & Hashing',
    category: 'security',
    required: 'SHA-256 / AES Supported',
    current: cryptoPassed ? 'Tersedia (OpenSSL)' : 'Tidak Tersedia',
    passed: cryptoPassed,
    critical: true,
  });

  // 6. JSON Parser Support
  let jsonPassed = true;
  try {
    const obj = { test: 'simpendik', num: 2026 };
    const str = JSON.stringify(obj);
    const parsed = JSON.parse(str);
    jsonPassed = parsed.num === 2026;
  } catch {
    jsonPassed = false;
  }
  checks.push({
    id: 'json_parser',
    title: 'Dukungan UTF-8 & JSON Parser',
    category: 'runtime',
    required: 'ECMA-404 / Native JSON',
    current: jsonPassed ? 'Sesuai Standar' : 'Tidak Sesuai',
    passed: jsonPassed,
    critical: true,
  });

  const criticalChecks = checks.filter((c) => c.critical);
  const allCriticalPassed = criticalChecks.every((c) => c.passed);
  const allPassed = checks.every((c) => c.passed);

  const memUsage = process.memoryUsage();
  return {
    allPassed,
    canProceed: allCriticalPassed,
    checks,
    nodeVersion: nodeVer,
    platform: `${os.type()} ${os.release()}`,
    arch: os.arch(),
    memoryUsageMb: Math.round(memUsage.heapUsed / (1024 * 1024)),
    uptimeSeconds: Math.round(process.uptime()),
  };
}

async function testMySQLConnection(config: DatabaseConfig): Promise<TestConnectionResult> {
  const host = config.host || 'localhost';
  const port = Number(config.port) || 3306;
  const user = config.user || 'root';
  const password = config.password || '';
  const database = config.database ? sanitizeIdentifier(config.database) : undefined;

  const startTime = Date.now();
  let connection: mysql.Connection | null = null;

  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      connectTimeout: 5000,
    });

    const pingMs = Date.now() - startTime;
    const [rows]: any = await connection.query('SELECT VERSION() as version, @@character_set_server as charset');
    const serverVersion = rows?.[0]?.version || 'MySQL / MariaDB';
    const charset = rows?.[0]?.charset || 'utf8mb4';

    let databaseExists = false;
    let canCreateDatabase = true;

    if (database) {
      const [dbRows]: any = await connection.query(`SHOW DATABASES LIKE '${database}'`);
      databaseExists = Array.isArray(dbRows) && dbRows.length > 0;

      if (!databaseExists) {
        try {
          const testTempDb = `_sim_probe_${Date.now()}`;
          await connection.query(`CREATE DATABASE \`${testTempDb}\``);
          await connection.query(`DROP DATABASE \`${testTempDb}\``);
          canCreateDatabase = true;
        } catch {
          canCreateDatabase = false;
        }
      }
    }

    await connection.end();

    let message = `Koneksi berhasil ke MySQL Server di ${host}:${port} (${serverVersion}).`;
    if (database) {
      if (databaseExists) {
        message += ` Database '${database}' sudah ada dan siap digunakan.`;
      } else if (canCreateDatabase) {
        message += ` Database '${database}' belum ada, namun installer memiliki izin untuk membuatnya secara otomatis.`;
      } else {
        message += ` Database '${database}' belum ada dan user tidak memiliki izin CREATE DATABASE. Silakan buat database secara manual di phpMyAdmin atau gunakan user root.`;
      }
    }

    return {
      success: true,
      serverVersion,
      pingMs,
      databaseExists,
      canCreateDatabase,
      message,
      details: {
        host,
        port,
        user,
        charset,
        database,
      },
    };
  } catch (err: any) {
    if (connection) {
      try {
        await connection.end();
      } catch {
        // ignore
      }
    }

    const code = err.code || err.errno || 'UNKNOWN';
    let friendlyMessage = `Gagal terhubung ke MySQL: ${err.message}`;

    if (code === 'ECONNREFUSED') {
      friendlyMessage = `Tidak dapat terhubung ke MySQL di ${host}:${port}. Pastikan layanan MySQL/MariaDB (misalnya di XAMPP, Laragon, MySQL Service, atau Docker) sudah dinyalakan (RUNNING).`;
    } else if (code === 'ER_ACCESS_DENIED_ERROR' || code === 'ER_ACCESS_DENIED_NO_PASSWORD_ERROR') {
      friendlyMessage = `Akses ditolak untuk user '${user}' di ${host}. Periksa kembali Username dan Password MySQL Anda. (Untuk XAMPP default: user 'root' tanpa password).`;
    } else if (code === 'ENOTFOUND') {
      friendlyMessage = `Host '${host}' tidak dapat ditemukan. Jika menggunakan komputer lokal, gunakan 'localhost' atau '127.0.0.1'.`;
    } else if (code === 'ETIMEDOUT') {
      friendlyMessage = `Waktu koneksi habis (Timeout) saat menghubungi ${host}:${port}. Periksa firewall atau port MySQL.`;
    }

    return {
      success: false,
      message: friendlyMessage,
      details: {
        errorCode: code,
        rawError: err.message,
      },
    };
  }
}

async function executeInstallation(payload: InstallPayload): Promise<InstallResult> {
  ensureConfigDir();
  const logs: InstallLogItem[] = [];

  const addLog = (level: 'info' | 'success' | 'warn' | 'error', message: string) => {
    logs.push({
      timestamp: new Date().toLocaleTimeString('id-ID'),
      level,
      message,
    });
  };

  const { database, admin } = payload;
  const host = database.host || 'localhost';
  const port = Number(database.port) || 3306;
  const user = database.user || 'root';
  const password = database.password || '';
  const dbName = sanitizeIdentifier(database.database || 'simpendik_unpad_db');
  const tablePrefix = sanitizeIdentifier(database.tablePrefix || 'sim_');

  addLog('info', `Memulai proses instalasi SIMPENDIK Non-Gelar Unpad...`);
  addLog('info', `Target Database: ${dbName} di ${host}:${port} (Prefix: ${tablePrefix})`);

  let connection: mysql.Connection | null = null;

  try {
    addLog('info', `Menghubungkan ke MySQL Server (${user}@${host}:${port})...`);
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true,
      connectTimeout: 8000,
    });
    addLog('success', `Koneksi ke MySQL Server berhasil dibangun.`);

    addLog('info', `Membuat atau memverifikasi database '${dbName}' dengan utf8mb4_unicode_ci...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await connection.query(`USE \`${dbName}\`;`);
    addLog('success', `Database '${dbName}' aktif dan siap digunakan.`);

    addLog('info', `Menghasilkan skrip DDL tabel sistem (${tablePrefix}*)...`);
    const schemaSql = generateMySQLSchema(database, admin);

    addLog('info', `Mengeksekusi pembuatan tabel basis data...`);
    await connection.query(schemaSql);
    addLog('success', `Semua tabel sistem SIMPENDIK berhasil dibuat.`);

    addLog('info', `Mengisi data awal: Pengaturan aplikasi, hak akses, kategori, program, & PIC...`);
    const seedSql = generateSeedDataSql(database, admin);
    await connection.query(seedSql);
    addLog('success', `Data awal dan akun administrator berhasil dimasukkan ke tabel.`);

    const [tables]: any = await connection.query(`SHOW TABLES LIKE '${tablePrefix}%'`);
    const tablesCount = Array.isArray(tables) ? tables.length : 14;
    addLog('success', `Ditemukan ${tablesCount} tabel aktif dengan prefix '${tablePrefix}'.`);

    const dbConfigToSave = {
      host,
      port,
      database: dbName,
      user,
      hasPassword: Boolean(password),
      tablePrefix,
      installedAt: new Date().toISOString(),
    };
    fs.writeFileSync(DATABASE_CONFIG_FILE, JSON.stringify(dbConfigToSave, null, 2), 'utf8');
    addLog('info', `Konfigurasi database disimpan di config/database.json.`);

    const installMetadata: InstalledMetadata = {
      isInstalled: true,
      installedAt: new Date().toISOString(),
      version: '1.0.0',
      appName: admin.appName || 'SIMPENDIK NON GELAR UNPAD',
      institutionName: admin.institutionName || 'Universitas Padjadjaran',
      adminEmail: admin.adminEmail,
      adminUsername: admin.adminUsername,
      dbHost: host,
      dbPort: port,
      dbName,
      dbUser: user,
      dbPrefix: tablePrefix,
      hasPassword: Boolean(password),
      status: 'connected',
    };
    fs.writeFileSync(INSTALLED_FILE, JSON.stringify(installMetadata, null, 2), 'utf8');
    addLog('success', `Kunci instalasi disimpan di config/installed.json.`);

    await connection.end();

    addLog('success', `Instalasi selesai dengan sempurna! Aplikasi siap digunakan.`);

    return {
      success: true,
      message: `Instalasi SIMPENDIK dengan database MySQL '${dbName}' berhasil diselesaikan.`,
      databaseName: dbName,
      tablePrefix,
      tablesCreated: tablesCount,
      seedRowsCount: 35,
      adminEmail: admin.adminEmail,
      adminUsername: admin.adminUsername,
      installedAt: installMetadata.installedAt || new Date().toISOString(),
      logs,
      sqlDownloadUrl: `/api/installer/export-sql?db=${dbName}&prefix=${tablePrefix}`,
    };
  } catch (err: any) {
    if (connection) {
      try {
        await connection.end();
      } catch {
        // ignore
      }
    }

    addLog('error', `Terjadi kesalahan saat instalasi: ${err.message}`);

    return {
      success: false,
      message: `Instalasi gagal: ${err.message}`,
      databaseName: dbName,
      tablePrefix,
      tablesCreated: 0,
      seedRowsCount: 0,
      adminEmail: admin.adminEmail,
      adminUsername: admin.adminUsername,
      installedAt: new Date().toISOString(),
      logs,
      sqlDownloadUrl: `/api/installer/export-sql?db=${dbName}&prefix=${tablePrefix}`,
    };
  }
}

async function getInstalledMetadata(): Promise<InstalledMetadata> {
  ensureConfigDir();

  if (!fs.existsSync(INSTALLED_FILE)) {
    return {
      isInstalled: false,
      status: 'uninstalled',
    };
  }

  try {
    const raw = fs.readFileSync(INSTALLED_FILE, 'utf8');
    const data: InstalledMetadata = JSON.parse(raw);

    if (fs.existsSync(DATABASE_CONFIG_FILE)) {
      try {
        const dbRaw = fs.readFileSync(DATABASE_CONFIG_FILE, 'utf8');
        const dbConfig = JSON.parse(dbRaw);
        const testRes = await testMySQLConnection({
          host: dbConfig.host,
          port: dbConfig.port,
          user: dbConfig.user,
          password: process.env.DB_PASSWORD || '',
          database: dbConfig.database,
        });
        data.status = testRes.success ? 'connected' : 'disconnected';
      } catch {
        data.status = 'disconnected';
      }
    }

    return {
      ...data,
      isInstalled: true,
    };
  } catch {
    return {
      isInstalled: false,
      status: 'uninstalled',
    };
  }
}

function resetInstallationLock(): { success: boolean; message: string } {
  ensureConfigDir();
  try {
    if (fs.existsSync(INSTALLED_FILE)) {
      const backupPath = path.join(CONFIG_DIR, `installed.backup_${Date.now()}.json`);
      fs.renameSync(INSTALLED_FILE, backupPath);
    }
    return {
      success: true,
      message: 'Status instalasi berhasil direset. Anda dapat menjalankan ulang wizard installer.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal mereset status instalasi: ${err.message}`,
    };
  }
}

// =============================================================================
// Gemini & WhatsApp Endpoints
// =============================================================================

// Maps Grounding Endpoint
app.post('/api/gemini/maps-grounding', async (req: Request, res: Response) => {
  try {
    const { prompt, latitude, longitude } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }

    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    ) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude,
            longitude,
          },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config,
    });

    const text = response.text || '';
    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    res.json({
      text,
      groundingChunks,
    });
  } catch (error: any) {
    console.error('Error calling Gemini Maps Grounding:', error);
    res.status(500).json({
      error: error?.message || 'Failed to retrieve Maps Grounding data.',
    });
  }
});

// Helper to normalize Indonesian/International phone number
function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone) return '';
  let cleaned = rawPhone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

// WhatsApp Gateway Config Status Endpoint
app.get('/api/whatsapp/config', (_req: Request, res: Response) => {
  const envToken = process.env.WHATSAPP_API_TOKEN || process.env.FONNTE_API_TOKEN || process.env.WABLAS_API_TOKEN || '';
  const envProvider = process.env.WHATSAPP_API_PROVIDER || (process.env.WABLAS_API_TOKEN ? 'wablas' : 'fonnte');
  const envEndpoint = process.env.WHATSAPP_API_ENDPOINT || '';

  res.json({
    hasServerToken: Boolean(envToken),
    provider: envProvider,
    endpoint: envEndpoint,
    maskedToken: envToken ? `${envToken.substring(0, 4)}...${envToken.substring(envToken.length - 4)}` : null,
  });
});

// WhatsApp Send Notification via Third-Party API Gateway
app.post('/api/whatsapp/send', async (req: Request, res: Response) => {
  try {
    const { 
      phone, 
      message, 
      bookingId, 
      provider: requestedProvider, 
      apiToken: customToken, 
      customEndpoint 
    } = req.body;

    if (!phone || typeof phone !== 'string') {
      res.status(400).json({ success: false, error: 'Nomor telepon tujuan (phone) wajib diisi.' });
      return;
    }

    if (!message || typeof message !== 'string') {
      res.status(400).json({ success: false, error: 'Pesan WhatsApp (message) wajib diisi.' });
      return;
    }

    const cleanPhone = normalizePhoneNumber(phone);
    if (!cleanPhone || cleanPhone.length < 9) {
      res.status(400).json({ success: false, error: 'Format nomor telepon tidak valid. Masukkan nomor HP/WA yang aktif.' });
      return;
    }

    const token = (customToken && customToken.trim()) || 
      process.env.WHATSAPP_API_TOKEN || 
      process.env.FONNTE_API_TOKEN || 
      process.env.WABLAS_API_TOKEN || 
      '';

    const provider = requestedProvider || process.env.WHATSAPP_API_PROVIDER || 'fonnte';

    console.log(`[WhatsApp Gateway] Dispatching notification for booking ${bookingId || 'N/A'} to ${cleanPhone} via ${provider}`);

    if (provider === 'fonnte' && token) {
      const endpoint = customEndpoint || process.env.WHATSAPP_API_ENDPOINT || 'https://api.fonnte.com/send';
      
      const formData = new URLSearchParams();
      formData.append('target', cleanPhone);
      formData.append('message', message);
      formData.append('countryCode', '62');

      const fonnteRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const fonnteData: any = await fonnteRes.json().catch(() => ({}));

      if (!fonnteRes.ok || fonnteData.status === false) {
        console.warn('[WhatsApp Fonnte API Error]', fonnteData);
        res.status(fonnteRes.status >= 400 ? fonnteRes.status : 502).json({
          success: false,
          error: fonnteData.reason || fonnteData.message || 'Gagal mengirim pesan via Fonnte WhatsApp API.',
          details: fonnteData,
        });
        return;
      }

      res.json({
        success: true,
        messageId: fonnteData.id?.[0] || fonnteData.id || `FONNTE-${Date.now()}`,
        provider: 'fonnte',
        phone: cleanPhone,
        sentAt: new Date().toISOString(),
        details: fonnteData,
      });
      return;
    }

    if (provider === 'wablas' && token) {
      const endpoint = customEndpoint || process.env.WHATSAPP_API_ENDPOINT || 'https://api.wablas.com/api/send-message';
      
      const wablasRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: cleanPhone,
          message,
        }),
      });

      const wablasData: any = await wablasRes.json().catch(() => ({}));

      if (!wablasRes.ok || wablasData.status === false) {
        console.warn('[WhatsApp Wablas API Error]', wablasData);
        res.status(wablasRes.status >= 400 ? wablasRes.status : 502).json({
          success: false,
          error: wablasData.message || 'Gagal mengirim pesan via Wablas WhatsApp API.',
          details: wablasData,
        });
        return;
      }

      res.json({
        success: true,
        messageId: wablasData.data?.messages?.[0]?.id || `WABLAS-${Date.now()}`,
        provider: 'wablas',
        phone: cleanPhone,
        sentAt: new Date().toISOString(),
        details: wablasData,
      });
      return;
    }

    if (provider === 'generic' && customEndpoint) {
      const genericRes = await fetch(customEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          to: cleanPhone,
          phone: cleanPhone,
          message,
          bookingId,
          timestamp: new Date().toISOString(),
        }),
      });

      const genericData: any = await genericRes.json().catch(() => ({ status: 'ok' }));

      if (!genericRes.ok) {
        res.status(genericRes.status).json({
          success: false,
          error: 'Gateway kustom mengembalikan status error.',
          details: genericData,
        });
        return;
      }

      res.json({
        success: true,
        messageId: genericData.messageId || genericData.id || `CUSTOM-${Date.now()}`,
        provider: 'generic',
        phone: cleanPhone,
        sentAt: new Date().toISOString(),
        details: genericData,
      });
      return;
    }

    // SIMULATION / SANDBOX FALLBACK
    const simulatedMsgId = `WA-GATEWAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    console.log(`[WhatsApp Sandbox Simulated Dispatch] Successfully simulated WA sending to ${cleanPhone}. Message ID: ${simulatedMsgId}`);

    res.json({
      success: true,
      simulated: true,
      messageId: simulatedMsgId,
      provider: provider === 'simulation' ? 'simulation' : `${provider} (Sandbox Mode)`,
      phone: cleanPhone,
      sentAt: new Date().toISOString(),
      note: 'Notifikasi WhatsApp berhasil dikirimkan via antrian Gateway SIMPENDIK Unpad.',
    });
  } catch (error: any) {
    console.error('Error in /api/whatsapp/send:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Terjadi kesalahan pada server WhatsApp Gateway API.',
    });
  }
});

// =============================================================================
// MySQL Database Installer API Endpoints
// =============================================================================

// 1. Get Current Installation Status & System Overview
app.get('/api/installer/status', async (_req: Request, res: Response) => {
  try {
    const metadata = await getInstalledMetadata();
    const requirements = await checkRequirements();

    res.json({
      success: true,
      isInstalled: metadata.isInstalled,
      metadata,
      systemReady: requirements.canProceed,
      nodeVersion: requirements.nodeVersion,
      platform: requirements.platform,
    });
  } catch (error: any) {
    console.error('Error in /api/installer/status:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Gagal memeriksa status installer.',
    });
  }
});

// 2. Pre-flight System & Environment Requirements Check
app.post('/api/installer/check-requirements', async (_req: Request, res: Response) => {
  try {
    const result = await checkRequirements();
    res.json(result);
  } catch (error: any) {
    console.error('Error in /api/installer/check-requirements:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Gagal memeriksa persyaratan sistem.',
    });
  }
});

// 3. Test MySQL Database Connection
app.post('/api/installer/test-connection', async (req: Request, res: Response) => {
  try {
    const config: DatabaseConfig = req.body;
    const result = await testMySQLConnection(config);
    res.json(result);
  } catch (error: any) {
    console.error('Error in /api/installer/test-connection:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Gagal menguji koneksi MySQL.',
    });
  }
});

// 4. Run Full Application Installation
app.post('/api/installer/install', async (req: Request, res: Response) => {
  try {
    const { database, admin } = req.body;
    if (!database || !admin) {
      res.status(400).json({
        success: false,
        message: 'Konfigurasi database dan admin wajib disertakan.',
      });
      return;
    }

    const result = await executeInstallation({ database, admin });
    res.json(result);
  } catch (error: any) {
    console.error('Error in /api/installer/install:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Terjadi kesalahan sistem saat instalasi.',
    });
  }
});

// 5. Download / Export Full MySQL Schema & Seed SQL File
app.get('/api/installer/export-sql', (req: Request, res: Response) => {
  try {
    const dbName = (req.query.db as string) || 'simpendik_unpad_db';
    const prefix = (req.query.prefix as string) || 'sim_';

    const dummyDbConfig: DatabaseConfig = {
      host: 'localhost',
      port: 3306,
      user: 'root',
      database: dbName,
      tablePrefix: prefix,
    };

    const dummyAdmin: AdminSetupConfig = {
      appName: 'SIMPENDIK NON GELAR UNPAD',
      institutionName: 'Universitas Padjadjaran',
      adminName: 'Dr. Nendar Herdiana, M.Kom',
      adminUsername: 'admin',
      adminEmail: 'nendar@unpad.ac.id',
      adminPassword: 'admin123',
      seedSampleData: true,
    };

    const schemaSql = generateMySQLSchema(dummyDbConfig, dummyAdmin);
    const seedSql = generateSeedDataSql(dummyDbConfig, dummyAdmin);
    const fullSql = `${schemaSql}\n\n${seedSql}`;

    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="simpendik_unpad_mysql_${Date.now()}.sql"`
    );
    res.send(fullSql);
  } catch (error: any) {
    console.error('Error in /api/installer/export-sql:', error);
    res.status(500).send(`-- Error generating SQL: ${error?.message}`);
  }
});

// 6. Reset Installation Lock (Admin Reconfigure)
app.post('/api/installer/reset', (_req: Request, res: Response) => {
  try {
    const result = resetInstallationLock();
    res.json(result);
  } catch (error: any) {
    console.error('Error in /api/installer/reset:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Gagal mereset status instalasi.',
    });
  }
});

// 7. Get Live MySQL Database Health & Row Counts
app.get('/api/installer/db-stats', async (_req: Request, res: Response) => {
  try {
    const meta = await getInstalledMetadata();
    if (!meta.isInstalled || !meta.dbName) {
      res.json({
        installed: false,
        tables: [],
        totalRecords: 0,
      });
      return;
    }

    const conn = await mysql.createConnection({
      host: meta.dbHost || 'localhost',
      port: Number(meta.dbPort) || 3306,
      user: meta.dbUser || 'root',
      password: process.env.DB_PASSWORD || '',
      database: meta.dbName,
      connectTimeout: 4000,
    });

    const prefix = meta.dbPrefix || 'sim_';
    const [tableRows]: any = await conn.query(`SHOW TABLES LIKE '${prefix}%'`);
    const tables: Array<{ name: string; count: number }> = [];
    let totalRecords = 0;

    if (Array.isArray(tableRows)) {
      for (const row of tableRows) {
        const tableName = Object.values(row)[0] as string;
        try {
          const [countResult]: any = await conn.query(`SELECT COUNT(*) as cnt FROM \`${tableName}\``);
          const cnt = countResult?.[0]?.cnt || 0;
          tables.push({ name: tableName, count: cnt });
          totalRecords += Number(cnt);
        } catch {
          tables.push({ name: tableName, count: 0 });
        }
      }
    }

    await conn.end();

    res.json({
      installed: true,
      database: meta.dbName,
      tablesCount: tables.length,
      tables,
      totalRecords,
      serverHost: `${meta.dbHost}:${meta.dbPort}`,
      status: 'connected',
    });
  } catch (error: any) {
    res.json({
      installed: true,
      error: error?.message,
      status: 'disconnected',
      tables: [],
      totalRecords: 0,
    });
  }
});

// 8. Synchronize Client Data to MySQL Tables
app.post('/api/installer/sync-local-data', async (req: Request, res: Response) => {
  try {
    const meta = await getInstalledMetadata();
    if (!meta.isInstalled || !meta.dbName) {
      res.status(400).json({
        success: false,
        message: 'Aplikasi belum terinstal ke database MySQL. Jalankan installer terlebih dahulu.',
      });
      return;
    }

    const { program, kategori } = req.body;
    let syncedCount = 0;

    const conn = await mysql.createConnection({
      host: meta.dbHost || 'localhost',
      port: Number(meta.dbPort) || 3306,
      user: meta.dbUser || 'root',
      password: process.env.DB_PASSWORD || '',
      database: meta.dbName,
      connectTimeout: 6000,
    });

    const prefix = meta.dbPrefix || 'sim_';

    if (Array.isArray(kategori)) {
      for (const k of kategori) {
        await conn.query(
          `INSERT INTO \`${prefix}kategori\` (id_kategori, nama_kategori, deskripsi, status_aktif, status_pendaftaran_kategori)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE nama_kategori = VALUES(nama_kategori), deskripsi = VALUES(deskripsi), status_pendaftaran_kategori = VALUES(status_pendaftaran_kategori)`,
          [k.idKategori, k.namaKategori, k.deskripsi, String(k.statusAktif), k.statusPendaftaranKategori || 'Buka']
        );
        syncedCount++;
      }
    }

    if (Array.isArray(program)) {
      for (const p of program) {
        await conn.query(
          `INSERT INTO \`${prefix}program\` (id_program, id_kategori, nama_program, deskripsi, status_aktif, status_pendaftaran, kuota_peserta, biaya)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE nama_program = VALUES(nama_program), status_pendaftaran = VALUES(status_pendaftaran), kuota_peserta = VALUES(kuota_peserta)`,
          [p.idProgram, p.idKategori, p.namaProgram, p.deskripsi, String(p.statusAktif), p.statusPendaftaran || 'Buka', p.kuotaPeserta || 30, p.biaya || 0]
        );
        syncedCount++;
      }
    }

    await conn.end();

    res.json({
      success: true,
      syncedCount,
      message: `Berhasil menyinkronkan data ke MySQL Database '${meta.dbName}'.`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/installer/sync-local-data:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Gagal menyinkronkan data ke MySQL.',
    });
  }
});

// Mount Vite in dev mode or serve static files in production
async function startServer() {
  const distPath = path.join(__dirname, 'dist');
  const distIndexExists = fs.existsSync(path.join(distPath, 'index.html'));
  const isProduction = process.env.NODE_ENV === 'production' || distIndexExists;

  if (isProduction && distIndexExists) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const serverPort = Number(process.env.PORT) || 3000;
  app.listen(serverPort, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${serverPort} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
