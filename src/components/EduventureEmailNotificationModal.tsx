import React, { useState, useMemo } from 'react';
import { 
  Mail, Send, Check, X, Copy, ExternalLink, RefreshCw, 
  AlertCircle, CheckCircle2, Building2, Calendar, Clock, 
  Users, MapPin, Sparkles, ShieldCheck, Eye, Code, FileText
} from 'lucide-react';
import { EduventureBooking } from '../types';
import { 
  buildEduventureEmailPayload, 
  createGmailComposeUrl, 
  createMailtoUrl, 
  sendEmailViaGmailApi 
} from '../services/eduventureEmailNotificationService';
import { updateEduventureCalendarAndEmailStatus } from '../services/storageService';

interface EduventureEmailNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: EduventureBooking | null;
  onStatusUpdated?: (updatedBooking: EduventureBooking) => void;
}

export const EduventureEmailNotificationModal: React.FC<EduventureEmailNotificationModalProps> = ({
  isOpen,
  onClose,
  booking,
  onStatusUpdated,
}) => {
  if (!isOpen || !booking) return null;

  // Form states
  const [recipient, setRecipient] = useState<string>(
    booking.emailKontak || 'narahubung@sekolah.sch.id'
  );
  const [ccRecipient, setCcRecipient] = useState<string>('non-gelar@unpad.ac.id');
  const [customSubject, setCustomSubject] = useState<string>(
    `[Konfirmasi Eduventure Unpad] Jadwal Kunjungan Kampus: ${booking.namaSekolah} (${booking.tanggalPelaksanaan || 'Terjadwal'})`
  );
  const [previewTab, setPreviewTab] = useState<'html' | 'text'>('html');
  const [copied, setCopied] = useState<boolean>(false);

  // Direct Gmail API states
  const [showApiInput, setShowApiInput] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string>('');
  const [isSendingApi, setIsSendingApi] = useState<boolean>(false);
  const [apiFeedback, setApiFeedback] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const [confirmSendPrompt, setConfirmSendPrompt] = useState<boolean>(false);

  // Email payload
  const emailPayload = useMemo(() => {
    return buildEduventureEmailPayload(booking, recipient);
  }, [booking, recipient]);

  // Handle Copy
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle Mark Sent
  const handleMarkAsSent = () => {
    const now = new Date().toISOString();
    const res = updateEduventureCalendarAndEmailStatus(booking.id, {
      emailNotifikasiTerkirim: true,
      emailNotifikasiTanggal: now,
      emailNotifikasiPenerima: recipient,
    });
    if (res.success && res.data && onStatusUpdated) {
      onStatusUpdated(res.data);
    }
    setApiFeedback({
      status: 'success',
      message: `Status email konfirmasi untuk ${booking.namaSekolah} ditandai Terkirim ke ${recipient}`,
    });
  };

  // Handle Send via Gmail API with User Confirmation
  const handleSendViaGmailApi = async () => {
    setConfirmSendPrompt(false);
    if (!accessToken.trim()) {
      setShowApiInput(true);
      return;
    }

    setIsSendingApi(true);
    setApiFeedback(null);

    const res = await sendEmailViaGmailApi(
      accessToken.trim(),
      recipient,
      customSubject,
      emailPayload.htmlContent,
      emailPayload.plainText,
      ccRecipient
    );

    setIsSendingApi(false);

    if (res.success) {
      handleMarkAsSent();
      setApiFeedback({
        status: 'success',
        message: `Email notifikasi berhasil dikirim melalui Gmail API ke ${recipient} (ID Pesan: ${res.messageId || 'OK'})`,
      });
    } else {
      setApiFeedback({
        status: 'error',
        message: res.error || 'Gagal mengirim email melalui Gmail API.',
      });
    }
  };

  // URLs
  const gmailComposeUrl = createGmailComposeUrl(recipient, customSubject, emailPayload.plainText, ccRecipient);
  const mailtoUrl = createMailtoUrl(recipient, customSubject, emailPayload.plainText, ccRecipient);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* Header with Google Gmail Branding */}
        <div className="bg-gradient-to-r from-[#002B66] via-[#1a73e8] to-[#ea4335] p-5 text-white flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center p-2.5">
              <svg viewBox="0 0 48 48" className="w-full h-full">
                <path fill="#4285F4" d="M45 16.2v21.6c0 2.3-1.9 4.2-4.2 4.2H36V22.2L24 30.6 12 22.2V42H7.2C4.9 42 3 40.1 3 37.8V16.2l21 15 21-15z"/>
                <path fill="#34A853" d="M36 42h4.8c2.3 0 4.2-1.9 4.2-4.2V16.2L36 22.2V42z"/>
                <path fill="#EA4335" d="M45 16.2l-21 15-21-15L24 6l21 10.2z"/>
                <path fill="#FBBC05" d="M3 16.2L12 22.2V42H7.2C4.9 42 3 40.1 3 37.8V16.2z"/>
                <path fill="#C5221F" d="M24 31.2l-12-9V12.6l12 8.6 12-8.6v9.6l-12 9z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Kirim Notifikasi Email Konfirmasi
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white tracking-wide uppercase">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Konfirmasi jadwal kunjungan {booking.namaSekolah} yang telah dijadwalkan di Google Calendar
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Status Alert if already sent */}
          {booking.emailNotifikasiTerkirim && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Email notifikasi telah dikirim sebelumnya ke <strong>{booking.emailNotifikasiPenerima || booking.emailKontak}</strong> pada {booking.emailNotifikasiTanggal ? new Date(booking.emailNotifikasiTanggal).toLocaleString('id-ID') : '-'}
                </span>
              </div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                TERKIRIM
              </span>
            </div>
          )}

          {/* Feedback banner */}
          {apiFeedback && (
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              apiFeedback.status === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-center gap-2">
                {apiFeedback.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{apiFeedback.message}</span>
              </div>
              <button 
                type="button"
                onClick={() => setApiFeedback(null)}
                className="text-slate-400 hover:text-slate-600 font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left: Email Config & Dispatch Actions (5 cols) */}
            <div className="lg:col-span-5 space-y-3.5">
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold text-slate-800 block border-b border-slate-200 pb-2">
                  Pengaturan Penerima Notifikasi
                </span>

                {/* To */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                    <span>Email Penerima (Sekolah / Narahubung):</span>
                    {booking.kontakPerson && (
                      <span className="text-[10px] text-blue-600 font-medium">
                        {booking.kontakPerson}
                      </span>
                    )}
                  </label>
                  <input
                    type="email"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="contoh@sekolah.sch.id"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* CC */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    Tembusan (CC Panitia Unpad):
                  </label>
                  <input
                    type="text"
                    value={ccRecipient}
                    onChange={(e) => setCcRecipient(e.target.value)}
                    placeholder="non-gelar@unpad.ac.id"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Subject */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    Subjek Email:
                  </label>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>
              </div>

              {/* Action Buttons Box */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-xs">
                <span className="text-xs font-bold text-slate-800 block">
                  Pilihan Pengiriman Email
                </span>

                {/* 1-Click Open in Gmail Web */}
                <a
                  href={gmailComposeUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleMarkAsSent}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm transform hover:-translate-y-0.5"
                  title="Buka Form Kirim Gmail Web dengan Template Lengkap"
                >
                  <svg viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
                    <path fill="#fff" d="M45 16.2v21.6c0 2.3-1.9 4.2-4.2 4.2H36V22.2L24 30.6 12 22.2V42H7.2C4.9 42 3 40.1 3 37.8V16.2l21 15 21-15z"/>
                  </svg>
                  <span>Buka di Gmail Web (1-Klik Siap Kirim)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {/* Default Mailto */}
                <a
                  href={mailtoUrl}
                  onClick={handleMarkAsSent}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 border border-slate-200"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>Buka di Klien Email Default (Outlook / Apple Mail)</span>
                </a>

                {/* Copy Text */}
                <button
                  type="button"
                  onClick={() => handleCopyText(emailPayload.plainText)}
                  className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copied ? 'Teks Email Tersalin!' : 'Salin Teks Format Lengkap'}</span>
                </button>

                {/* Mark as sent manual toggle */}
                <button
                  type="button"
                  onClick={handleMarkAsSent}
                  className="w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl text-[11px] transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tandai Sebagai Email Terkirim</span>
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-2 text-[10px] font-bold text-slate-400 uppercase">Atau</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {/* Direct Gmail API */}
                {!showApiInput ? (
                  <button
                    type="button"
                    onClick={() => setShowApiInput(true)}
                    className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Kirim Otomatis via Gmail REST API</span>
                  </button>
                ) : (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-900">
                        OAuth Bearer Token (Gmail API):
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowApiInput(false)}
                        className="text-slate-400 hover:text-slate-600 text-[10px]"
                      >
                        Sembunyikan
                      </button>
                    </div>
                    <input
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="Tempel Access Token Google..."
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-200 rounded-lg font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setConfirmSendPrompt(true)}
                      disabled={!accessToken.trim() || isSendingApi}
                      className="w-full py-1.5 px-3 bg-[#1a73e8] hover:bg-[#1557b0] disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5"
                    >
                      {isSendingApi ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Mengirim Email...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Kirim Email Sekarang</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

              </div>

            </div>

            {/* Right: Email Rendered Preview (7 cols) */}
            <div className="lg:col-span-7 flex flex-col space-y-2">
              <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 px-2 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  Pratinjau Pesan Konfirmasi
                </span>
                
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('html')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      previewTab === 'html' 
                        ? 'bg-white text-blue-700 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Code className="w-3 h-3" />
                    <span>Format HTML</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('text')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      previewTab === 'text' 
                        ? 'bg-white text-blue-700 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    <span>Format Teks</span>
                  </button>
                </div>
              </div>

              {/* Preview Content Container */}
              <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs min-h-[420px] max-h-[480px] flex flex-col">
                {previewTab === 'html' ? (
                  <iframe
                    title="Pratinjau Email"
                    srcDoc={emailPayload.htmlContent}
                    className="w-full flex-1 border-0"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div className="p-4 overflow-y-auto flex-1 font-mono text-[11px] leading-relaxed text-slate-800 whitespace-pre-wrap bg-slate-50/50">
                    {emailPayload.plainText}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Mail className="w-4 h-4 text-red-600" />
            <span>Terintegrasi dengan Google Workspace Gmail & Calendar</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>

      {/* Confirmation Dialog before sending email (Workspace Integration Mandatory Pattern) */}
      {confirmSendPrompt && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 text-red-700 rounded-xl">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Konfirmasi Pengiriman Email
                </h4>
                <p className="text-xs text-slate-500">
                  Operasi ini akan mengirim email melalui akun Google Anda
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Anda akan mengirim email konfirmasi jadwal Eduventure untuk <strong>{booking.namaSekolah}</strong> ke alamat <strong>{recipient}</strong>. Lanjutkan pengiriman?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmSendPrompt(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSendViaGmailApi}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
              >
                Ya, Kirim Email Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
