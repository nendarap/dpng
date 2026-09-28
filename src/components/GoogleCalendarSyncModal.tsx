import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, ExternalLink, Download, Check, 
  X, AlertCircle, Clock, Building2, Users, School, 
  CheckCircle2, Sparkles, Filter, ChevronRight, Share2, 
  Layers, Info, ShieldCheck, ArrowRight, RefreshCw, Send,
  Mail
} from 'lucide-react';
import { EduventureBooking } from '../types';
import { 
  createGoogleCalendarUrl, 
  downloadIcsFile, 
  generateIcsContent, 
  buildEduventureEventPayload,
  insertEventToGoogleCalendar 
} from '../services/googleCalendarService';
import { EduventureEmailNotificationModal } from './EduventureEmailNotificationModal';

interface GoogleCalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: EduventureBooking[];
  initialSelectedBooking?: EduventureBooking | null;
  onBookingUpdated?: (updated: EduventureBooking) => void;
}

export const GoogleCalendarSyncModal: React.FC<GoogleCalendarSyncModalProps> = ({
  isOpen,
  onClose,
  bookings,
  initialSelectedBooking,
  onBookingUpdated,
}) => {
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (initialSelectedBooking) {
      return [initialSelectedBooking.id];
    }
    // Default to upcoming bookings
    const today = new Date().toISOString().substring(0, 10);
    const upcoming = bookings.filter(b => (b.tanggalPelaksanaan || '') >= today);
    return upcoming.length > 0 ? upcoming.map(b => b.id) : bookings.slice(0, 10).map(b => b.id);
  });

  const [filterMode, setFilterMode] = useState<'all' | 'upcoming' | 'paid'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewBookingId, setPreviewBookingId] = useState<string | null>(() => {
    return initialSelectedBooking ? initialSelectedBooking.id : (bookings[0]?.id || null);
  });

  // Email Notification Modal state
  const [emailModalBooking, setEmailModalBooking] = useState<EduventureBooking | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);

  // Direct API sync states
  const [accessToken, setAccessToken] = useState<string>('');
  const [showDirectApiInput, setShowDirectApiInput] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResults, setSyncResults] = useState<{ [id: string]: { status: 'success' | 'error'; message: string; link?: string } }>({});
  const [confirmSyncPrompt, setConfirmSyncPrompt] = useState<boolean>(false);

  // Filtered list
  const filteredBookings = useMemo(() => {
    const today = new Date().toISOString().substring(0, 10);
    return bookings.filter(b => {
      if (filterMode === 'upcoming' && (b.tanggalPelaksanaan || '') < today) {
        return false;
      }
      if (filterMode === 'paid' && b.statusBayar !== 'Sudah') {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSchool = (b.namaSekolah || '').toLowerCase().includes(q);
        const matchVenue = (b.tempatPenyelenggaraan || '').toLowerCase().includes(q);
        const matchPaket = (b.skemaPaket || '').toLowerCase().includes(q);
        const matchContact = (b.kontakPerson || '').toLowerCase().includes(q);
        return matchSchool || matchVenue || matchPaket || matchContact;
      }
      return true;
    }).sort((a, b) => (a.tanggalPelaksanaan || '').localeCompare(b.tanggalPelaksanaan || ''));
  }, [bookings, filterMode, searchQuery]);

  // Selected bookings objects
  const selectedBookings = useMemo(() => {
    return bookings.filter(b => selectedIds.includes(b.id));
  }, [bookings, selectedIds]);

  // Current preview booking
  const previewBooking = useMemo(() => {
    return bookings.find(b => b.id === previewBookingId) || selectedBookings[0] || bookings[0];
  }, [bookings, previewBookingId, selectedBookings]);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredBookings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBookings.map(b => b.id));
    }
  };

  const handleDownloadIcs = () => {
    if (selectedBookings.length === 0) return;
    const dateStr = new Date().toISOString().substring(0, 10);
    const filename = `jadwal_eduventure_unpad_${dateStr}.ics`;
    const ics = generateIcsContent(selectedBookings);
    downloadIcsFile(filename, ics);
  };

  // Direct REST API sync with confirmation dialog
  const handleExecuteDirectSync = async () => {
    if (!accessToken.trim()) {
      setShowDirectApiInput(true);
      return;
    }
    setConfirmSyncPrompt(false);
    setIsSyncing(true);

    const newResults: { [id: string]: { status: 'success' | 'error'; message: string; link?: string } } = {};

    for (const booking of selectedBookings) {
      const res = await insertEventToGoogleCalendar(accessToken.trim(), booking);
      if (res.success) {
        newResults[booking.id] = {
          status: 'success',
          message: 'Berhasil dijadwalkan ke Google Calendar',
          link: res.htmlLink,
        };
      } else {
        newResults[booking.id] = {
          status: 'error',
          message: res.error || 'Gagal sinkronisasi',
        };
      }
    }

    setSyncResults(prev => ({ ...prev, ...newResults }));
    setIsSyncing(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* Header with Google Calendar Brand Colors */}
        <div className="bg-gradient-to-r from-[#002B66] via-[#0b3b82] to-[#1a73e8] p-5 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
            <svg className="w-48 h-48 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
            </svg>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            {/* Google Calendar Logo Icon */}
            <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center border border-white/20 p-2">
              <svg viewBox="0 0 48 48" className="w-full h-full">
                <path fill="#4285F4" d="M38 44H10c-3.3 0-6-2.7-6-6V10c0-3.3 2.7-6 6-6h28c3.3 0 6 2.7 6 6v28c0 3.3-2.7 6-6 6z"/>
                <path fill="#fff" d="M10 8h28c1.1 0 2 .9 2 2v28c0 1.1-.9 2-2 2H10c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2z"/>
                <path fill="#EA4335" d="M38 4H10C6.7 4 4 6.7 4 10v4h40v-4c0-3.3-2.7-6-6-6z"/>
                <path fill="#188038" d="M34 22h-6v-6h-4v6h-6v4h6v6h4v-6h6z"/>
                <circle cx="14" cy="9" r="2" fill="#fff"/>
                <circle cx="34" cy="9" r="2" fill="#fff"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Integrasi Google Calendar Eduventure
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white tracking-wide uppercase">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Jadwalkan kunjungan rombongan sekolah secara otomatis ke Google Calendar Anda
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors relative z-10"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

          {/* Quick Info Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-slate-700">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg mt-0.5 shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <span className="font-bold text-[#002B66] block">
                3 Cara Mudah Integrasi dengan Google Calendar:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                <li><strong>1-Klik Langsung:</strong> Klik tombol Google Calendar di tiap item untuk membuka form event siap simpan di calendar.google.com.</li>
                <li><strong>Unduh File .ICS:</strong> Export seluruh agenda terpilih dalam 1 berkas kalender standar yang dapat diimpor langsung ke Google Calendar atau Outlook.</li>
                <li><strong>Sinkronisasi API:</strong> Hubungkan akses kalender untuk menambahkan event otomatis ke akun Google Calendar utama Anda.</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left Column: Agenda List & Selection (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilterMode('upcoming')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      filterMode === 'upcoming' 
                        ? 'bg-[#002B66] text-white shadow-sm' 
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    Mendatang
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      filterMode === 'all' 
                        ? 'bg-[#002B66] text-white shadow-sm' 
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    Semua ({bookings.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('paid')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      filterMode === 'paid' 
                        ? 'bg-[#002B66] text-white shadow-sm' 
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    Lunas Saja
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-semibold text-[#002B66] hover:underline"
                  >
                    {selectedIds.length === filteredBookings.length ? 'Batal Pilih' : 'Pilih Semua'}
                  </button>
                  <span className="text-[11px] font-bold text-slate-400">|</span>
                  <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {selectedIds.length} Terpilih
                  </span>
                </div>
              </div>

              {/* Search Box */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari sekolah, tempat, paket, atau narahubung..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002B66]/20"
              />

              {/* Booking List Container */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredBookings.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                    Tidak ada agenda kunjungan yang cocok dengan filter.
                  </div>
                ) : (
                  filteredBookings.map((item) => {
                    const isSelected = selectedIds.includes(item.id);
                    const isPreview = previewBookingId === item.id;
                    const syncStatus = syncResults[item.id];
                    const gcalUrl = createGoogleCalendarUrl(item);

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition-all text-xs flex flex-col gap-2 ${
                          isSelected 
                            ? 'bg-blue-50/40 border-blue-300 shadow-xs' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        } ${isPreview ? 'ring-2 ring-indigo-500/40' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(item.id)}
                              className="w-4 h-4 rounded text-[#002B66] focus:ring-[#002B66] border-slate-300 mt-0.5 cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900 hover:text-blue-700 cursor-pointer" onClick={() => setPreviewBookingId(item.id)}>
                                  {item.namaSekolah}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                  {item.skemaPaket}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                <span className="flex items-center gap-1 font-semibold text-blue-800">
                                  <CalendarIcon className="w-3 h-3 text-blue-600" />
                                  {item.tanggalPelaksanaan || '-'}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-slate-600">
                                  <Clock className="w-3 h-3 text-indigo-500" />
                                  {item.waktuMulai || '08:30'} - {item.waktuSelesai || '12:00'}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-purple-700 font-medium truncate max-w-[130px]">
                                  <Building2 className="w-3 h-3 text-purple-600" />
                                  {item.tempatPenyelenggaraan || 'Bale Sawala'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* 1-Click Open in Google Calendar */}
                            <a
                              href={gcalUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-blue-50 text-[#1a73e8] hover:text-[#174ea6] font-bold rounded-lg border border-blue-200 transition-colors shadow-2xs text-[11px]"
                              title="Buka dan Simpan Langsung di Google Calendar"
                            >
                              <svg viewBox="0 0 48 48" className="w-3.5 h-3.5">
                                <path fill="#4285F4" d="M38 44H10c-3.3 0-6-2.7-6-6V10c0-3.3 2.7-6 6-6h28c3.3 0 6 2.7 6 6v28c0 3.3-2.7 6-6 6z"/>
                                <path fill="#fff" d="M10 8h28c1.1 0 2 .9 2 2v28c0 1.1-.9 2-2 2H10c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2z"/>
                                <path fill="#EA4335" d="M38 4H10C6.7 4 4 6.7 4 10v4h40v-4c0-3.3-2.7-6-6-6z"/>
                              </svg>
                              <span>Google Cal</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            {/* Email Notification Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setEmailModalBooking(item);
                                setIsEmailModalOpen(true);
                              }}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                item.emailNotifikasiTerkirim 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-white text-slate-500 border-slate-200 hover:bg-red-50 hover:text-red-600'
                              }`}
                              title={item.emailNotifikasiTerkirim ? 'Email notifikasi sudah terkirim (Klik untuk kelola)' : 'Kirim Email Notifikasi Konfirmasi'}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setPreviewBookingId(item.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded"
                              title="Lihat Pratinjau Event"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Sync feedback badge if any */}
                        {syncStatus && (
                          <div className={`p-1.5 rounded-lg text-[10px] flex items-center justify-between ${
                            syncStatus.status === 'success' 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            <div className="flex items-center gap-1">
                              {syncStatus.status === 'success' ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                              )}
                              <span>{syncStatus.message}</span>
                            </div>
                            {syncStatus.link && (
                              <a
                                href={syncStatus.link}
                                target="_blank"
                                rel="noreferrer"
                                className="font-bold underline text-emerald-700 flex items-center gap-0.5"
                              >
                                Lihat Event
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Event Preview & Actions (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Event Card Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                    Pratinjau Event Google Calendar
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Format Standar Google
                  </span>
                </div>

                {previewBooking ? (
                  (() => {
                    const payload = buildEduventureEventPayload(previewBooking);
                    return (
                      <div className="bg-white rounded-xl border border-blue-200 p-3.5 shadow-sm space-y-3">
                        <div className="border-l-4 border-[#1a73e8] pl-2.5 space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">
                            {payload.title}
                          </h4>
                          <span className="text-[11px] font-bold text-[#1a73e8] block">
                            {payload.startDate}, {payload.startTime} - {payload.endTime} WIB
                          </span>
                        </div>

                        <div className="space-y-1.5 text-[11px] text-slate-600">
                          <div className="flex items-start gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                            <span className="font-medium text-slate-800">
                              {payload.location}
                            </span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                            <span>
                              {previewBooking.jumlahPeserta} Siswa {previewBooking.jumlahGuru ? `+ ${previewBooking.jumlahGuru} Guru` : ''} ({previewBooking.skemaPaket})
                            </span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                            <span>
                              Kontak: {previewBooking.kontakPerson || '-'} ({previewBooking.nomorKontak || '-'})
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setEmailModalBooking(previewBooking);
                              setIsEmailModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold rounded-lg text-xs transition-colors"
                            title="Kirim Notifikasi Email Konfirmasi ke Sekolah"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Kirim Email</span>
                          </button>
                          <a
                            href={createGoogleCalendarUrl(previewBooking)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold rounded-lg text-xs transition-colors shadow-2xs"
                          >
                            <span>Jadwalkan</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Pilih agenda di sebelah kiri untuk melihat rincian event.
                  </div>
                )}
              </div>

              {/* Action Buttons Box */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                <span className="text-xs font-bold text-slate-800 block">
                  Aksi Sinkronisasi ({selectedBookings.length} Agenda Terpilih)
                </span>

                <div className="space-y-2">
                  {/* Send Email Notification to Selected / Preview */}
                  {previewBooking && (
                    <button
                      type="button"
                      onClick={() => {
                        setEmailModalBooking(previewBooking);
                        setIsEmailModalOpen(true);
                      }}
                      className="w-full py-2 px-3 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Kirim Email Konfirmasi ke {previewBooking.namaSekolah}</span>
                    </button>
                  )}

                  {/* Download .ICS */}
                  <button
                    type="button"
                    onClick={handleDownloadIcs}
                    disabled={selectedBookings.length === 0}
                    className="w-full py-2 px-3 bg-[#002B66] hover:bg-[#002252] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Kalender .ICS ({selectedBookings.length} Event)</span>
                  </button>
                  <p className="text-[10px] text-slate-500 text-center">
                    Kompatibel dengan Google Calendar, Apple Calendar, dan Microsoft Outlook
                  </p>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-2 text-[10px] font-bold text-slate-400 uppercase">Atau</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  {/* Direct Google Calendar REST API Sync */}
                  {!showDirectApiInput ? (
                    <button
                      type="button"
                      onClick={() => setShowDirectApiInput(true)}
                      className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-[#1a73e8] border border-blue-200 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Sinkronisasi Otomatis via Token API</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                          OAuth Bearer Access Token:
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowDirectApiInput(false)}
                          className="text-slate-400 hover:text-slate-600 text-[10px]"
                        >
                          Sembunyikan
                        </button>
                      </div>
                      <input
                        type="password"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder="Tempel Google OAuth Access Token di sini..."
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/30 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setConfirmSyncPrompt(true)}
                        disabled={!accessToken.trim() || selectedBookings.length === 0 || isSyncing}
                        className="w-full py-1.5 px-3 bg-[#1a73e8] hover:bg-[#1557b0] disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        {isSyncing ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Menyinkronkan ke Google Calendar...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Kirim {selectedBookings.length} Event ke Google Calendar</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Google Calendar Import Step Instructions */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 space-y-1.5">
                <span className="font-bold text-slate-700 block">
                  💡 Cara Impor File .ICS ke Google Calendar:
                </span>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-500">
                  <li>Unduh berkas <code>.ics</code> melalui tombol di atas.</li>
                  <li>Buka <a href="https://calendar.google.com/calendar/u/0/r/settings/export" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">Google Calendar Settings &gt; Import</a>.</li>
                  <li>Pilih berkas <code>.ics</code> yang diunduh lalu klik <strong>Import</strong>.</li>
                </ol>
              </div>

            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span>Terintegrasi dengan Google Workspace Calendar</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Selesai / Tutup
          </button>
        </div>

      </div>

      {/* Confirmation Dialog for Direct Calendar Mutation (per Workspace Integration requirement) */}
      {confirmSyncPrompt && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Konfirmasi Sinkronisasi Google Calendar
                </h4>
                <p className="text-xs text-slate-500">
                  Operasi ini akan menambahkan jadwal ke kalender Google Anda
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Anda akan menambahkan <strong>{selectedBookings.length} agenda kunjungan Eduventure</strong> ke akun Google Calendar utama Anda. Lanjutkan proses ini?
            </p>

            <div className="max-h-36 overflow-y-auto bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] space-y-1">
              {selectedBookings.map(b => (
                <div key={b.id} className="flex justify-between items-center text-slate-700">
                  <span className="font-semibold truncate max-w-[240px]">{b.namaSekolah}</span>
                  <span className="font-mono text-slate-400">{b.tanggalPelaksanaan}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmSyncPrompt(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteDirectSync}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-lg shadow-sm"
              >
                Ya, Sinkronkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Eduventure Email Notification Modal */}
      <EduventureEmailNotificationModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        booking={emailModalBooking}
        onStatusUpdated={(updated) => {
          if (onBookingUpdated) onBookingUpdated(updated);
        }}
      />

    </div>
  );
};
