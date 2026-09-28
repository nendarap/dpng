import { EduventureBooking } from '../types';
import { createGoogleCalendarUrl } from './googleCalendarService';

export interface EmailNotificationPayload {
  to: string;
  cc?: string;
  subject: string;
  plainText: string;
  htmlContent: string;
  googleCalendarUrl: string;
  mapsUrl: string;
}

/**
 * Builds the official confirmation email payload for an Eduventure booking
 */
export function buildEduventureEmailPayload(
  booking: EduventureBooking,
  overrideRecipient?: string
): EmailNotificationPayload {
  const recipient = overrideRecipient || booking.emailKontak || 'narahubung@sekolah.sch.id';
  const subject = `[Konfirmasi Eduventure Unpad] Jadwal Kunjungan Kampus: ${booking.namaSekolah} (${booking.tanggalPelaksanaan || 'Terjadwal'})`;
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
    : '-';

  // Plain Text Version
  const plainText = `
Yth. Bapak/Ibu ${booking.kontakPerson || 'Koordinator Kunjungan'},
Pihak Sekolah / Lembaga: ${booking.namaSekolah}

Salam hangat dari Kampus Universitas Padjadjaran!

Kami mengonfirmasi bahwa agenda kunjungan Eduventure Universitas Padjadjaran untuk ${booking.namaSekolah} telah berhasil dijadwalkan dan dikonfirmasi di Google Calendar resmi SIMPENDIK Non Gelar Unpad.

RINCIAN JADWAL KUNJUNGAN:
=====================================================
• Nama Sekolah      : ${booking.namaSekolah}
• Alamat Asal       : ${booking.alamat || '-'}
• Tanggal Kegiatan  : ${dateFormatted} (${booking.tanggalPelaksanaan})
• Waktu Pelaksanaan : ${startTime} - ${endTime} WIB
• Tempat / Venue    : ${venue}, Kampus Unpad Jatinangor
• Skema Paket       : ${booking.skemaPaket}
• Pilihan Kunjungan : ${booking.pilihanKunjungan}${booking.fakultasTujuan && booking.fakultasTujuan.length > 0 ? ` (${booking.fakultasTujuan.join(', ')})` : ''}
• Jumlah Rombongan  : ${booking.jumlahPeserta} Siswa + ${booking.jumlahGuru || 0} Guru Pendamping
• Status Administrasi: ${booking.statusBayar === 'Sudah' ? 'LUNAS (Terkonfirmasi)' : 'Menunggu / Belum Lunas'}
• Narahubung Sekolah: ${booking.kontakPerson || '-'} (${booking.nomorKontak || '-'})
=====================================================

Tautan Penting:
1. Tambahkan ke Google Calendar Anda (1-Klik):
${gcalUrl}

2. Petunjuk Arah Google Maps ke Lokasi Acara:
${mapsUrl}

PETUNJUK KEDATANGAN & PERSIAPAN ROMBONGAN:
1. Rombongan diharapkan tiba di lokasi kampus 15-20 menit sebelum acara dimulai untuk registrasi.
2. Seluruh siswa mengenakan seragam sekolah rapi atau almamater sekolah.
3. Bus / kendaraan rombongan dapat parkir di area yang telah diarahkan oleh petugas keamanan Unpad.
4. Apabila terdapat perubahan jumlah peserta atau jadwal kedatangan, mohon segera mengabari tim sekretariat kami.

Sekretariat Pendidikan Non Gelar Universitas Padjadjaran
Gedung Rektorat Unpad, Kampus Jatinangor, Sumedang, Jawa Barat 45363
Email: non-gelar@unpad.ac.id | Website: unpad.ac.id
`.trim();

  // Rich HTML Version
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
    .container { max-width: 620px; margin: 24px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #002B66 0%, #0b3b82 60%, #1a73e8 100%); color: #ffffff; padding: 32px 28px; text-align: left; }
    .header-badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; line-height: 1.3; }
    .header p { margin: 8px 0 0; font-size: 13px; color: #bfdbfe; }
    .content { padding: 28px; }
    .greeting { font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
    .intro { font-size: 13px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .card-detail { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .card-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #002B66; letter-spacing: 0.5px; margin-bottom: 14px; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; }
    .table-detail { width: 100%; border-collapse: collapse; font-size: 13px; }
    .table-detail td { padding: 7px 4px; vertical-align: top; }
    .table-detail .label { color: #64748b; width: 38%; font-weight: 500; }
    .table-detail .val { color: #0f172a; font-weight: 600; }
    .badge-paid { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }
    .btn-container { text-align: center; margin: 28px 0; }
    .btn-gcal { display: inline-block; background: #1a73e8; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 700; box-shadow: 0 2px 6px rgba(26,115,232,0.3); margin: 6px; }
    .btn-maps { display: inline-block; background: #f1f5f9; color: #002B66; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-size: 13px; font-weight: 700; border: 1px solid #cbd5e1; margin: 6px; }
    .notes-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 24px; font-size: 12px; color: #92400e; line-height: 1.6; }
    .footer { background: #f1f5f9; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-badge">Universitas Padjadjaran • Eduventure</div>
      <h1>Konfirmasi Jadwal Kunjungan Kampus</h1>
      <p>Jadwal telah terintegrasi dengan Google Calendar resmi SIMPENDIK Non Gelar</p>
    </div>
    <div class="content">
      <div class="greeting">
        Yth. Bapak/Ibu ${booking.kontakPerson || 'Koordinator Kunjungan'},<br>
        <strong>${booking.namaSekolah}</strong>
      </div>
      <p class="intro">
        Terima kasih atas kepercayaan Anda memilih Universitas Padjadjaran sebagai tujuan kunjungan edukatif. Jadwal kunjungan Eduventure rombongan sekolah Anda telah <strong>berhasil dikonfirmasi dan dimasukkan ke kalender resmi</strong>.
      </p>

      <div class="card-detail">
        <div class="card-title">Ringkasan Agenda Kunjungan</div>
        <table class="table-detail">
          <tr>
            <td class="label">Sekolah / Instansi</td>
            <td class="val">: <strong>${booking.namaSekolah}</strong></td>
          </tr>
          <tr>
            <td class="label">Tanggal Pelaksanaan</td>
            <td class="val">: <strong>${dateFormatted}</strong></td>
          </tr>
          <tr>
            <td class="label">Waktu Kunjungan</td>
            <td class="val">: <strong>${startTime} - ${endTime} WIB</strong></td>
          </tr>
          <tr>
            <td class="label">Tempat / Venue</td>
            <td class="val">: ${venue}, Kampus Unpad Jatinangor</td>
          </tr>
          <tr>
            <td class="label">Skema Paket</td>
            <td class="val">: ${booking.skemaPaket} (${booking.pilihanKunjungan})</td>
          </tr>
          <tr>
            <td class="label">Jumlah Rombongan</td>
            <td class="val">: ${booking.jumlahPeserta} Siswa + ${booking.jumlahGuru || 0} Guru Pendamping</td>
          </tr>
          <tr>
            <td class="label">Status Pembayaran</td>
            <td class="val">: <span class="badge-paid">${booking.statusBayar === 'Sudah' ? 'LUNAS' : 'Belum Lunas'}</span></td>
          </tr>
          <tr>
            <td class="label">Narahubung</td>
            <td class="val">: ${booking.kontakPerson || '-'} (${booking.nomorKontak || '-'})</td>
          </tr>
        </table>
      </div>

      <div class="btn-container">
        <a href="${gcalUrl}" target="_blank" class="btn-gcal">
          📅 Tambahkan ke Google Calendar
        </a>
        <a href="${mapsUrl}" target="_blank" class="btn-maps">
          📍 Petunjuk Arah Google Maps
        </a>
      </div>

      <div class="notes-box">
        <strong>💡 Panduan Kedatangan:</strong><br>
        • Rombongan dimohon hadir 15 menit sebelum acara untuk verifikasi kehadiran.<br>
        • Parkir bus dan kendaraan pengiring berada di area parkir utama Kampus Jatinangor.<br>
        • Seluruh peserta mengenakan seragam resmi sekolah/identitas almamater.
      </div>
    </div>
    <div class="footer">
      <strong>Direktorat Pendidikan Non Gelar Universitas Padjadjaran</strong><br>
      Gedung Rektorat Unpad, Jl. Raya Bandung Sumedang KM.21, Jatinangor, Sumedang, Jawa Barat 45363<br>
      Dikelola melalui Sistem Informasi SIMPENDIK Non Gelar Unpad.
    </div>
  </div>
</body>
</html>
`.trim();

  return {
    to: recipient,
    cc: 'non-gelar@unpad.ac.id',
    subject,
    plainText,
    htmlContent,
    googleCalendarUrl: gcalUrl,
    mapsUrl,
  };
}

/**
 * Creates a direct 1-click URL to compose email in Gmail Web client
 */
export function createGmailComposeUrl(to: string, subject: string, bodyText: string, cc?: string): string {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: to || '',
    su: subject || '',
    body: bodyText || '',
  });

  if (cc) {
    params.set('cc', cc);
  }

  return `https://mail.google.com/mail/?${params.toString()}`;
}

/**
 * Creates standard mailto link
 */
export function createMailtoUrl(to: string, subject: string, bodyText: string, cc?: string): string {
  const params = new URLSearchParams({
    subject: subject || '',
    body: bodyText || '',
  });

  if (cc) {
    params.set('cc', cc);
  }

  return `mailto:${encodeURIComponent(to || '')}?${params.toString()}`;
}

/**
 * Base64 URL safe encoder
 */
function base64UrlEncode(str: string): string {
  // Convert UTF-8 to binary string
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Sends an email directly using Gmail REST API (users.messages.send)
 * Requires OAuth token with `https://www.googleapis.com/auth/gmail.send`
 */
export async function sendEmailViaGmailApi(
  accessToken: string,
  to: string,
  subject: string,
  htmlBody: string,
  textBody: string,
  cc?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    const lines = [
      `To: ${to}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'MIME-Version: 1.0',
    ];

    if (cc) {
      lines.push(`Cc: ${cc}`);
    }

    lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`, '', `--${boundary}`);
    lines.push('Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: 7bit', '', textBody, '', `--${boundary}`);
    lines.push('Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: 7bit', '', htmlBody, '', `--${boundary}--`);

    const rawMessage = lines.join('\r\n');
    const encodedRaw = base64UrlEncode(rawMessage);

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedRaw }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errJson.error?.message || `HTTP ${res.status}: Gagal mengirim email via Gmail API`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      messageId: data.id,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Terjadi kesalahan saat memanggil Gmail API',
    };
  }
}
