import { EduventureBooking } from '../types';

export interface CalendarEventPayload {
  title: string;
  description: string;
  location: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:mm
  timeZone: string;
}

/**
 * Normalizes date (YYYY-MM-DD) and time (HH:mm) into a formatted string for Google Calendar URL
 */
function formatDateTimeForGoogle(dateStr: string, timeStr?: string, defaultHour: number = 8, defaultMinute: number = 30): string {
  if (!dateStr) {
    const today = new Date();
    dateStr = today.toISOString().substring(0, 10);
  }
  
  const cleanDate = dateStr.replace(/-/g, '');
  let hours = defaultHour;
  let minutes = defaultMinute;

  if (timeStr && timeStr.includes(':')) {
    const [h, m] = timeStr.split(':').map(Number);
    if (!isNaN(h)) hours = h;
    if (!isNaN(m)) minutes = m;
  }

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${cleanDate}T${pad(hours)}${pad(minutes)}00`;
}

/**
 * Builds standard Google Calendar event details from an Eduventure booking
 */
export function buildEduventureEventPayload(booking: EduventureBooking): CalendarEventPayload {
  const date = booking.tanggalPelaksanaan || new Date().toISOString().substring(0, 10);
  const startTime = booking.waktuMulai || '08:30';
  const endTime = booking.waktuSelesai || '12:00';

  const title = `[Eduventure Unpad] ${booking.namaSekolah} (${booking.skemaPaket || 'Kunjungan Kampus'})`;
  
  const venue = booking.tempatPenyelenggaraan || 'Bale Sawala';
  const location = `${venue}, Kampus Universitas Padjadjaran, Jl. Raya Bandung Sumedang KM.21, Jatinangor, Jawa Barat 45363`;

  const detailsList: string[] = [
    `🎓 AGENDA KUNJUNGAN EDUVENTURE UNIVERSITAS PADJADJARAN`,
    `--------------------------------------------------`,
    `📌 Sekolah: ${booking.namaSekolah}`,
    `📦 Skema Paket: ${booking.skemaPaket}`,
    `🏛️ Tempat / Venue: ${venue}`,
    `🎯 Pilihan Kunjungan: ${booking.pilihanKunjungan}${booking.fakultasTujuan && booking.fakultasTujuan.length > 0 ? ` (${booking.fakultasTujuan.join(', ')})` : ''}`,
    `👥 Jumlah Rombongan: ${booking.jumlahPeserta} Siswa${booking.jumlahGuru ? ` + ${booking.jumlahGuru} Guru Pendamping` : ''}`,
    `💰 Status Pembayaran: ${booking.statusBayar === 'Sudah' ? 'LUNAS' : 'Belum Lunas / Menunggu'}`,
    `👤 Narahubung Sekolah: ${booking.kontakPerson || '-'}`,
    `📞 No. Kontak: ${booking.nomorKontak || '-'}`,
  ];

  if (booking.catatanTambahan) {
    detailsList.push(`📝 Catatan Tambahan: ${booking.catatanTambahan}`);
  }

  detailsList.push(
    `--------------------------------------------------`,
    `📍 Google Maps Venue: https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`,
    `✨ Dikelola melalui SIMPENDIK Non Gelar Universitas Padjadjaran`
  );

  return {
    title,
    description: detailsList.join('\n'),
    location,
    startDate: date,
    startTime,
    endDate: date,
    endTime,
    timeZone: 'Asia/Jakarta',
  };
}

/**
 * Generates direct 1-click Google Calendar Web URL
 */
export function createGoogleCalendarUrl(booking: EduventureBooking): string {
  const payload = buildEduventureEventPayload(booking);
  const startStr = formatDateTimeForGoogle(payload.startDate, payload.startTime, 8, 30);
  const endStr = formatDateTimeForGoogle(payload.endDate, payload.endTime, 12, 0);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: payload.title,
    dates: `${startStr}/${endStr}`,
    details: payload.description,
    location: payload.location,
    ctz: payload.timeZone,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates an RFC 5545 iCalendar (.ics) string for Google Calendar import
 */
export function generateIcsContent(bookings: EduventureBooking[]): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const escapeIcs = (str: string) => {
    return (str || '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  const eventsIcs = bookings.map((b) => {
    const payload = buildEduventureEventPayload(b);
    const dateClean = (payload.startDate || '').replace(/-/g, '');
    
    let [startH, startM] = (payload.startTime || '08:30').split(':').map(Number);
    let [endH, endM] = (payload.endTime || '12:00').split(':').map(Number);
    if (isNaN(startH)) startH = 8;
    if (isNaN(startM)) startM = 30;
    if (isNaN(endH)) endH = 12;
    if (isNaN(endM)) endM = 0;

    const dtStart = `${dateClean}T${pad(startH)}${pad(startM)}00`;
    const dtEnd = `${dateClean}T${pad(endH)}${pad(endM)}00`;
    const uid = `eduventure-${b.id || Math.random().toString(36).substring(2, 9)}@unpad.ac.id`;

    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Asia/Jakarta:${dtStart}`,
      `DTEND;TZID=Asia/Jakarta:${dtEnd}`,
      `SUMMARY:${escapeIcs(payload.title)}`,
      `DESCRIPTION:${escapeIcs(payload.description)}`,
      `LOCATION:${escapeIcs(payload.location)}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'BEGIN:VALARM',
      'TRIGGER:-PT24H',
      'ACTION:DISPLAY',
      `DESCRIPTION:Pengingat Kunjungan ${escapeIcs(b.namaSekolah)} besok hari`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT2H',
      'ACTION:DISPLAY',
      `DESCRIPTION:Persiapan Kunjungan ${escapeIcs(b.namaSekolah)} dalam 2 jam`,
      'END:VALARM',
      'END:VEVENT'
    ].join('\r\n');
  }).join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Universitas Padjadjaran//SIMPENDIK Eduventure//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Agenda Eduventure Unpad',
    'X-WR-TIMEZONE:Asia/Jakarta',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Jakarta',
    'X-LIC-LOCATION:Asia/Jakarta',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0700',
    'TZOFFSETTO:+0700',
    'TZNAME:WIB',
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE',
    eventsIcs,
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Triggers download of an .ics file in browser
 */
export function downloadIcsFile(filename: string, icsContent: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export single booking as .ics
 */
export function exportSingleBookingIcs(booking: EduventureBooking): void {
  const ics = generateIcsContent([booking]);
  const safeName = (booking.namaSekolah || 'kunjungan')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 30);
  const filename = `eduventure_${booking.tanggalPelaksanaan || 'jadwal'}_${safeName}.ics`;
  downloadIcsFile(filename, ics);
}

/**
 * Export batch bookings as .ics
 */
export function exportBatchBookingsIcs(bookings: EduventureBooking[], prefix = 'agenda_eduventure_unpad'): void {
  const ics = generateIcsContent(bookings);
  const dateStr = new Date().toISOString().substring(0, 10);
  downloadIcsFile(`${prefix}_${dateStr}.ics`, ics);
}

/**
 * Inserts an event directly into the user's Google Calendar via Google Calendar REST API
 * using OAuth access token
 */
export async function insertEventToGoogleCalendar(
  accessToken: string,
  booking: EduventureBooking
): Promise<{ success: boolean; eventId?: string; htmlLink?: string; error?: string }> {
  try {
    const payload = buildEduventureEventPayload(booking);
    
    // Parse start and end RFC 3339
    const pad = (n: number) => n.toString().padStart(2, '0');
    let [sh, sm] = (payload.startTime || '08:30').split(':').map(Number);
    let [eh, em] = (payload.endTime || '12:00').split(':').map(Number);
    if (isNaN(sh)) sh = 8;
    if (isNaN(sm)) sm = 30;
    if (isNaN(eh)) eh = 12;
    if (isNaN(em)) em = 0;

    const startDateTime = `${payload.startDate}T${pad(sh)}:${pad(sm)}:00+07:00`;
    const endDateTime = `${payload.endDate}T${pad(eh)}:${pad(em)}:00+07:00`;

    const body = {
      summary: payload.title,
      description: payload.description,
      location: payload.location,
      start: {
        dateTime: startDateTime,
        timeZone: 'Asia/Jakarta',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Asia/Jakarta',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 120 },     // 2 hours before
        ],
      },
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error?.message || `HTTP ${res.status}: Gagal menambahkan event ke Google Calendar`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      eventId: data.id,
      htmlLink: data.htmlLink,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Gagal menghubungi Google Calendar API',
    };
  }
}
