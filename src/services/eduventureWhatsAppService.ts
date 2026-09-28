import { EduventureBooking, WhatsAppGatewayConfig } from '../types';
import { createGoogleCalendarUrl } from './googleCalendarService';
import { updateEduventureCalendarAndEmailStatus, writeLog } from './storageService';

const STORAGE_KEY_WA_CONFIG = 'simpendik_unpad_wa_config';

export const DEFAULT_WA_CONFIG: WhatsAppGatewayConfig = {
  provider: 'fonnte',
  apiToken: '',
  customEndpoint: '',
  senderPhone: '',
  autoSendOnConfirm: true,
};

export function getWhatsAppGatewayConfig(): WhatsAppGatewayConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WA_CONFIG);
    if (!raw) return DEFAULT_WA_CONFIG;
    return { ...DEFAULT_WA_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_WA_CONFIG;
  }
}

export function saveWhatsAppGatewayConfig(config: WhatsAppGatewayConfig): void {
  localStorage.setItem(STORAGE_KEY_WA_CONFIG, JSON.stringify(config));
  writeLog(
    'Pengaturan WhatsApp Gateway',
    'SETTING',
    'WHATSAPP_CONFIG',
    `Memperbarui konfigurasi WhatsApp Gateway API (Provider: ${config.provider}, Auto-Send: ${config.autoSendOnConfirm ? 'Aktif' : 'Nonaktif'})`
  );
}

/**
 * Standardizes Indonesian and international phone numbers into 628... format
 */
export function cleanPhoneNumber(rawPhone: string): string {
  if (!rawPhone) return '';
  let cleaned = rawPhone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Generates official formatted WhatsApp notification text for Eduventure booking
 */
export function buildEduventureWhatsAppMessage(booking: EduventureBooking): string {
  const gcalUrl = createGoogleCalendarUrl(booking);
  const venue = booking.tempatPenyelenggaraan || 'Bale Sawala';
  const mapsLocation = `${venue}, Kampus Universitas Padjadjaran, Jatinangor, Sumedang, Jawa Barat`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsLocation)}`;

  const startTime = booking.waktuMulai || '08:30';
  const endTime = booking.waktuSelesai || '12:00';
  const dateFormatted = booking.tanggalPelaksanaan
    ? new Date(booking.tanggalPelaksanaan).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : booking.tanggalPelaksanaan || '-';

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return `*KONFIRMASI JADWAL KUNJUNGAN EDUVENTURE UNPAD* 🎓🏛️
--------------------------------------------------
Yth. Bapak/Ibu *${booking.kontakPerson || 'Koordinator Kunjungan'}*,
Pihak Sekolah: *${booking.namaSekolah}*

Salam hangat dari *Universitas Padjadjaran*.

Kami mengonfirmasi bahwa permohonan kunjungan Eduventure Anda telah resmi *DIKONFIRMASI* dalam sistem SIMPENDIK Non-Gelar Unpad dengan rincian sebagai berikut:

📋 *RINCIAN KUNJUNGAN:*
• *ID Registrasi:* ${booking.id}
• *Nama Sekolah:* ${booking.namaSekolah}
• *Hari & Tanggal:* ${dateFormatted}
• *Waktu:* ${startTime} - ${endTime} WIB
• *Tempat / Lokasi:* ${venue}, Kampus Unpad Jatinangor
• *Skema Paket:* ${booking.skemaPaket}
• *Pilihan Kunjungan:* ${booking.pilihanKunjungan}${booking.fakultasTujuan && booking.fakultasTujuan.length > 0 ? ` (${booking.fakultasTujuan.join(', ')})` : ''}
• *Estimasi Rombongan:* ${booking.jumlahPeserta} Siswa + ${booking.jumlahGuru || 0} Guru Pendamping
• *Status Administrasi:* ${booking.statusBayar === 'Sudah' ? '✅ LUNAS (Terkonfirmasi)' : '⏳ Belum Lunas / Menunggu'}
• *Nominal Paket:* ${formatRupiah(booking.nominalTransfer || 0)}
• *Rekening VA Unpad:* ${booking.rekening}

📍 *PANDUAN LOKASI & KALENDER:*
1. *Google Calendar (1-Klik Tambahkan Acara):*
${gcalUrl}

2. *Petunjuk Arah Google Maps ke Venue:*
${mapsUrl}

ℹ️ *PETUNJUK KEDATANGAN:*
1. Rombongan diharapkan tiba di lokasi kampus 15-20 menit sebelum jadwal untuk proses registrasi dan penyambutan.
2. Seluruh siswa disarankan mengenakan seragam sekolah rapi atau jas almamater sekolah.
3. Kendaraan bus rombongan akan dipandu parkir di kantong parkir resmi kampus oleh petugas keamanan Unpad.
4. Jika ada penyesuaian jumlah rombongan, mohon informasikan kembali kepada kami.

Terima kasih atas kepercayaan Bapak/Ibu memilih Universitas Padjadjaran sebagai destinasi edukasi siswa. Sampai jumpa di Kampus Unpad Jatinangor!

_Pesan otomatis resmi Direktorat Pendidikan Non Gelar Universitas Padjadjaran_
_Website: unpad.ac.id | Email: non-gelar@unpad.ac.id_`.trim();
}

/**
 * Creates direct WhatsApp Web / App link for fallback or instant 1-click chatting
 */
export function createDirectWhatsAppUrl(rawPhone: string, text: string): string {
  const phone = cleanPhoneNumber(rawPhone);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export interface SendWhatsAppResponse {
  success: boolean;
  messageId?: string;
  provider?: string;
  phone?: string;
  error?: string;
  simulated?: boolean;
  note?: string;
}

/**
 * Sends WhatsApp notification via third-party API gateway backend proxy
 */
export async function sendEduventureWhatsAppNotification(
  booking: EduventureBooking,
  overridePhone?: string,
  overrideMessage?: string
): Promise<SendWhatsAppResponse> {
  const config = getWhatsAppGatewayConfig();
  const targetPhone = overridePhone || booking.nomorKontak || '';
  const message = overrideMessage || buildEduventureWhatsAppMessage(booking);

  if (!targetPhone) {
    return {
      success: false,
      error: 'Nomor telepon narahubung sekolah kosong.',
    };
  }

  try {
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: targetPhone,
        message,
        bookingId: booking.id,
        provider: config.provider,
        apiToken: config.apiToken,
        customEndpoint: config.customEndpoint,
      }),
    });

    const data: any = await res.json().catch(() => ({}));

    if (res.ok && data.success) {
      const now = new Date().toISOString();
      // Update booking notification status in storage
      updateEduventureCalendarAndEmailStatus(booking.id, {
        whatsappNotifikasiTerkirim: true,
        whatsappNotifikasiTanggal: now,
        whatsappNotifikasiPenerima: targetPhone,
        whatsappMessageId: data.messageId,
        whatsappGatewayProvider: data.provider || config.provider,
      } as any);

      writeLog(
        'Kirim WhatsApp Eduventure',
        'EDUVENTURE',
        booking.id,
        `Notifikasi WhatsApp konfirmasi berhasil dikirim ke ${booking.namaSekolah} (${targetPhone}) via ${data.provider || config.provider}. MsgID: ${data.messageId}`
      );

      return {
        success: true,
        messageId: data.messageId,
        provider: data.provider || config.provider,
        phone: targetPhone,
        simulated: data.simulated,
        note: data.note,
      };
    } else {
      return {
        success: false,
        error: data.error || 'Gagal mengirim pesan WhatsApp melalui server API gateway.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Terjadi gangguan jaringan saat menghubungi gateway WhatsApp.',
    };
  }
}
