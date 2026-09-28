import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Check,
  X,
  Copy,
  ExternalLink,
  Settings,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  RefreshCw,
  Sliders,
  Radio,
  Eye,
  Building2,
  Calendar,
  Layers,
  Info
} from 'lucide-react';
import { EduventureBooking, WhatsAppGatewayConfig, WhatsAppProviderType } from '../types';
import {
  buildEduventureWhatsAppMessage,
  cleanPhoneNumber,
  createDirectWhatsAppUrl,
  getWhatsAppGatewayConfig,
  saveWhatsAppGatewayConfig,
  sendEduventureWhatsAppNotification,
  SendWhatsAppResponse
} from '../services/eduventureWhatsAppService';

interface EduventureWhatsAppNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: EduventureBooking | null;
  onStatusUpdated?: (updatedBooking: EduventureBooking) => void;
}

export const EduventureWhatsAppNotificationModal: React.FC<EduventureWhatsAppNotificationModalProps> = ({
  isOpen,
  onClose,
  booking,
  onStatusUpdated,
}) => {
  if (!isOpen || !booking) return null;

  // View tabs: 'preview' | 'settings'
  const [activeTab, setActiveTab] = useState<'preview' | 'settings'>('preview');

  // Form states
  const [phone, setPhone] = useState<string>(booking.nomorKontak || '');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Gateway Config state
  const [gatewayConfig, setGatewayConfig] = useState<WhatsAppGatewayConfig>(() => getWhatsAppGatewayConfig());
  const [configSavedToast, setConfigSavedToast] = useState<boolean>(false);

  // Sending status
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<SendWhatsAppResponse | null>(null);

  // Initialize message on booking load
  useEffect(() => {
    if (booking) {
      setPhone(booking.nomorKontak || '');
      setCustomMessage(buildEduventureWhatsAppMessage(booking));
      setSendResult(null);
    }
  }, [booking]);

  const cleanPhone = useMemo(() => cleanPhoneNumber(phone), [phone]);

  const directWaUrl = useMemo(() => {
    return createDirectWhatsAppUrl(phone, customMessage);
  }, [phone, customMessage]);

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveWhatsAppGatewayConfig(gatewayConfig);
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 2500);
  };

  const handleSendViaGateway = async () => {
    if (!phone.trim()) {
      alert('Nomor telepon tujuan tidak boleh kosong.');
      return;
    }

    setIsSending(true);
    setSendResult(null);

    const res = await sendEduventureWhatsAppNotification(booking, phone.trim(), customMessage);
    setIsSending(false);
    setSendResult(res);

    if (res.success && onStatusUpdated) {
      const updatedBooking: EduventureBooking = {
        ...booking,
        whatsappNotifikasiTerkirim: true,
        whatsappNotifikasiTanggal: new Date().toISOString(),
        whatsappNotifikasiPenerima: phone.trim(),
        whatsappMessageId: res.messageId,
        whatsappGatewayProvider: res.provider || gatewayConfig.provider,
      };
      onStatusUpdated(updatedBooking);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] p-4 sm:p-5 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  Notifikasi WhatsApp Eduventure
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30 uppercase tracking-wider">
                  API Gateway
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5 truncate max-w-[280px] sm:max-w-md">
                Kirim pesan konfirmasi resmi ke {booking.namaSekolah} ({booking.id})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'preview' ? 'settings' : 'preview')}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-white text-[#075E54] shadow-xs'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title="Pengaturan WhatsApp Gateway API"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Gateway API</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Tracker Banner if already sent */}
        {booking.whatsappNotifikasiTerkirim && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Notifikasi WhatsApp telah terkirim ke <strong>{booking.whatsappNotifikasiPenerima || booking.nomorKontak}</strong> pada{' '}
                {booking.whatsappNotifikasiTanggal
                  ? new Date(booking.whatsappNotifikasiTanggal).toLocaleString('id-ID')
                  : 'Sebelumnya'}
              </span>
            </div>
            {booking.whatsappMessageId && (
              <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-700">
                ID: {booking.whatsappMessageId}
              </span>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 text-xs px-4">
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`py-3 px-4 font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'border-[#128C7E] text-[#075E54] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Pratinjau Pesan WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-[#128C7E] text-[#075E54] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Konfigurasi Gateway API (Fonnte / Wablas)
          </button>
        </div>

        {/* TAB 1: PREVIEW & SEND */}
        {activeTab === 'preview' && (
          <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Recipient Input & Normalization */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#128C7E]" />
                  Nomor WhatsApp Narahubung:
                </label>
                <span className="text-[11px] text-slate-500">
                  Target Konversi: <strong className="font-mono text-[#075E54]">+{cleanPhone}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#128C7E]/20 focus:border-[#128C7E]"
                />
                <button
                  type="button"
                  onClick={() => setCustomMessage(buildEduventureWhatsAppMessage(booking))}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Reset Template Pesan Resmi"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Reset Teks</span>
                </button>
              </div>
            </div>

            {/* Chat Bubble Simulation */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#128C7E]" />
                  Format Pesan Konfirmasi Resmi Unpad:
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-[#128C7E] hover:text-[#075E54] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Pesan'}</span>
                </button>
              </div>

              {/* Realistic WhatsApp Chat Bubble Container */}
              <div className="bg-[#E5DDD5] p-3 sm:p-4 rounded-xl border border-slate-300 relative shadow-inner">
                <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-xs border border-slate-200 max-w-xl text-xs space-y-2 text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                  <textarea
                    rows={12}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full text-xs font-sans text-slate-800 bg-transparent border-0 focus:ring-0 p-0 resize-y leading-relaxed outline-none"
                    placeholder="Tulis pesan..."
                  />
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 font-sans pt-1 border-t border-slate-100">
                    <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-[#34B7F1] font-bold">✓✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Send Result Feedback Alert */}
            {sendResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-200 ${
                  sendResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {sendResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold">
                    {sendResult.success ? 'Pesan WhatsApp Berhasil Dikirimkan!' : 'Gagal Mengirimkan Notifikasi'}
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {sendResult.success
                      ? `Notifikasi konfirmasi kunjungan untuk ${booking.namaSekolah} sukses dikirim ke ${sendResult.phone} via Gateway ${sendResult.provider}. ID Transaksi: ${sendResult.messageId}`
                      : sendResult.error}
                  </p>
                  {sendResult.note && (
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      Catatan: {sendResult.note}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <a
                href={directWaUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all border border-slate-200 cursor-pointer"
                title="Buka langsung di aplikasi WhatsApp Web / Desktop"
              >
                <ExternalLink className="w-4 h-4 text-emerald-600" />
                <span>Buka di WhatsApp Web / App</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Tutup
                </button>

                <button
                  type="button"
                  onClick={handleSendViaGateway}
                  disabled={isSending}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#1ebd5a] active:bg-[#128C7E] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengirimkan via Gateway API...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kirim Otomatis via Gateway</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GATEWAY CONFIGURATION */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveConfig} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600" />
                Tentang Integrasi WhatsApp Gateway Pihak Ketiga:
              </span>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                SIMPENDIK Non-Gelar Unpad mendukung pengiriman notifikasi otomatis melalui gateway WhatsApp populer di Indonesia seperti <strong>Fonnte</strong> (api.fonnte.com), <strong>Wablas</strong> (api.wablas.com), atau Webhook HTTP kustom. Bila token belum diisi, sistem berjalan dalam <em>Sandbox Delivery Mode</em> yang aman.
              </p>
            </div>

            {/* Provider Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Pilih Penyedia API Gateway (Provider):</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    id: 'fonnte',
                    name: 'Fonnte',
                    desc: 'api.fonnte.com',
                    badge: 'Rekomendasi Indonesia'
                  },
                  {
                    id: 'wablas',
                    name: 'Wablas',
                    desc: 'api.wablas.com',
                    badge: 'Populer ID'
                  },
                  {
                    id: 'generic',
                    name: 'Custom Webhook',
                    desc: 'Endpoint Mandiri / Proxy',
                    badge: 'Kustom'
                  }
                ].map((prov) => (
                  <div
                    key={prov.id}
                    onClick={() => setGatewayConfig({ ...gatewayConfig, provider: prov.id as WhatsAppProviderType })}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      gatewayConfig.provider === prov.id
                        ? 'bg-emerald-50/70 border-[#128C7E] ring-2 ring-[#128C7E]/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-800">{prov.name}</span>
                      {gatewayConfig.provider === prov.id && (
                        <CheckCircle2 className="w-4 h-4 text-[#128C7E]" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block">{prov.desc}</span>
                    <span className="inline-block mt-1 text-[9px] font-semibold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                      {prov.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* API Token Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>API Token / Secret Key:</span>
                <span className="text-[10px] text-slate-400 font-normal">Tersimpan aman di peramban lokal & env server</span>
              </label>
              <input
                type="password"
                value={gatewayConfig.apiToken}
                onChange={(e) => setGatewayConfig({ ...gatewayConfig, apiToken: e.target.value })}
                placeholder="Masukkan API Token dari Dashboard Fonnte / Wablas Anda"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#128C7E]/20 focus:border-[#128C7E]"
              />
              <p className="text-[10px] text-slate-400">
                Token dapat diperoleh gratis di <a href="https://fonnte.com" target="_blank" rel="noreferrer" className="text-[#128C7E] underline">fonnte.com</a> atau <a href="https://wablas.com" target="_blank" rel="noreferrer" className="text-[#128C7E] underline">wablas.com</a>.
              </p>
            </div>

            {/* Custom Endpoint URL if selected */}
            {gatewayConfig.provider === 'generic' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Custom Webhook Endpoint URL:</label>
                <input
                  type="url"
                  value={gatewayConfig.customEndpoint || ''}
                  onChange={(e) => setGatewayConfig({ ...gatewayConfig, customEndpoint: e.target.value })}
                  placeholder="https://api.domain-anda.com/v1/send-message"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#128C7E]/20 focus:border-[#128C7E]"
                />
              </div>
            )}

            {/* Auto-Send on Confirm Toggle */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-800 block">
                    Kirim Otomatis Saat Booking Dikonfirmasi
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Sistem langsung mengirim notifikasi WhatsApp resmi saat status kunjungan diubah menjadi <em>"Dikonfirmasi"</em>.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gatewayConfig.autoSendOnConfirm}
                    onChange={(e) => setGatewayConfig({ ...gatewayConfig, autoSendOnConfirm: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                </label>
              </div>
            </div>

            {configSavedToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                Konfigurasi WhatsApp Gateway berhasil disimpan!
              </div>
            )}

            {/* Save Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Kembali ke Pratinjau
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#002B66] hover:bg-[#003882] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Simpan Konfigurasi Gateway
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
