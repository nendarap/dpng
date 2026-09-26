import React, { useState, useEffect } from 'react';
import { 
  Sparkles, MapPin, ExternalLink, Search, Loader2, X, Compass, 
  Building2, School, Route, AlertCircle, ArrowUpRight, MessageSquareQuote, Check
} from 'lucide-react';
import { queryMapsGrounding, MapsGroundingResult, GroundingMapsChunk } from '../services/mapsGroundingService';

interface GoogleMapsAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  initialLocationName?: string;
  initialCoords?: { latitude: number; longitude: number };
}

export const GoogleMapsAiModal: React.FC<GoogleMapsAiModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = '',
  initialLocationName = 'Kampus Unpad Jatinangor',
  initialCoords = { latitude: -6.9261, longitude: 107.7747 },
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | undefined>(initialCoords);
  const [locationLabel, setLocationLabel] = useState<string>(initialLocationName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MapsGroundingResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialPrompt) {
        setPrompt(initialPrompt);
        handleExecute(initialPrompt, initialCoords);
      } else {
        setPrompt(`Rekomendasi rute akses transportasi, fasilitas umum, dan akomodasi di sekitar ${initialLocationName}`);
      }
      setCoords(initialCoords);
      setLocationLabel(initialLocationName);
      setError(null);
    }
  }, [isOpen, initialPrompt, initialLocationName, initialCoords]);

  const handleExecute = async (
    queryText?: string, 
    customCoords?: { latitude: number; longitude: number }
  ) => {
    const textToRun = (queryText || prompt).trim();
    if (!textToRun) return;

    setLoading(true);
    setError(null);
    try {
      const activeCoords = customCoords !== undefined ? customCoords : coords;
      const res = await queryMapsGrounding(textToRun, activeCoords);
      setResult(res);
    } catch (err: any) {
      console.error('Maps Grounding Error:', err);
      setError(err?.message || 'Gagal mengambil data dari Google Maps Grounding.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseUserLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung pada peramban Anda.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userCoords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setCoords(userCoords);
        setLocationLabel('Lokasi Anda Saat Ini (GPS)');
      },
      (geoErr) => {
        setError(`Gagal mendapatkan lokasi saat ini: ${geoErr.message}`);
      }
    );
  };

  if (!isOpen) return null;

  // Extract maps chunks
  const mapsChunks = result?.groundingChunks || [];
  const mapPlaces = mapsChunks.filter(c => c.maps && (c.maps.uri || c.maps.title));
  const webSources = mapsChunks.filter(c => c.web && c.web.uri);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-700 via-indigo-700 to-amber-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl shadow-inner">
              <Compass className="w-6 h-6 text-amber-300 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Google Maps AI Intelligence</h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-400 text-slate-900 rounded-full shadow-sm">
                  gemini-3.5-flash
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-500/50 text-white rounded-full border border-white/20">
                  Maps Grounding
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Pencarian berbasis data geospasial aktual Google Maps untuk lokasi, rute, dan fasilitas Unpad
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Query input card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>Titik Acuan Lokasi:</span>
                <span className="font-semibold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                  {locationLabel}
                </span>
                {coords && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    ({coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUseUserLocation}
                  className="px-2.5 py-1 text-[11px] font-medium bg-white dark:bg-slate-700 hover:bg-slate-100 text-blue-600 dark:text-blue-400 border border-slate-300 dark:border-slate-600 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Route className="w-3.5 h-3.5" />
                  Gunakan GPS Saya
                </button>
                <a
                  href={coords ? `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}` : 'https://www.google.com/maps'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 text-[11px] font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka Google Maps
                </a>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handleExecute()}
                  placeholder="Ketik pertanyaan tempat, fasilitas, akses transportasi, kuliner, penginapan..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={() => handleExecute()}
                disabled={loading || !prompt.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl flex items-center gap-2 shadow-sm transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mencari...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Tanya AI Maps</span>
                  </>
                )}
              </button>
            </div>

            {/* Preset Query Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-500">Saran Populer:</span>
              {[
                { label: 'Rute & Gerbang Tol ke Unpad Jatinangor', q: 'Akses gerbang tol Cisumdawu, transportasi umum, dan rute terbaik menuju Kampus Unpad Jatinangor' },
                { label: 'Hotel & Penginapan Dekat Unpad', q: 'Rekomendasi hotel dan penginapan terdekat dari Universitas Padjadjaran dengan ulasan terbaik' },
                { label: 'Kuliner & Kafe Sekitar Kampus Dipatiukur', q: 'Rekomendasi tempat makan, kafe, dan kuliner favorit dekat Unpad Dipatiukur Bandung' },
                { label: 'Fasilitas Layanan Kesehatan & RS Sekitar', q: 'Daftar rumah sakit, klinik, dan layanan darurat kesehatan terdekat dari Kampus Unpad' },
                { label: 'Spot Edukasi & Kunjungan Sains Unpad', q: 'Tempat menarik untuk kunjungan edukasi (Eduventure) sains, museum, dan gedung serbaguna di Unpad' }
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(chip.q);
                    handleExecute(chip.q);
                  }}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Terjadi Kendala</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                <MapPin className="w-5 h-5 text-amber-500 absolute inset-0 m-auto" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Menghubungi Google Maps Grounding via Gemini 3.5 Flash...
              </p>
              <p className="text-xs text-slate-500">
                Mengambil data geospasial real-time, ulasan tempat, dan rute lokasi
              </p>
            </div>
          )}

          {/* Results Display */}
          {result && !loading && (
            <div className="space-y-6 animate-fadeIn">
              {/* AI Markdown / Formatted Text */}
              <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Jawaban Grounding AI Google Maps</span>
                </div>
                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                  {result.text}
                </div>
              </div>

              {/* Grounded Places and URLs from Google Maps */}
              {mapPlaces.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      <span>Tempat Terverifikasi di Google Maps ({mapPlaces.length})</span>
                    </h4>
                    <span className="text-xs text-slate-500">
                      Tautan langsung ke Google Maps
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {mapPlaces.map((chunk, idx) => {
                      const place = chunk.maps!;
                      const snippets = place.placeAnswerSources?.reviewSnippets || [];
                      return (
                        <div
                          key={idx}
                          className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {place.title || 'Lokasi Google Maps'}
                              </h5>
                              {place.uri && (
                                <a
                                  href={place.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                                  title="Buka lokasi di Google Maps"
                                >
                                  <ArrowUpRight className="w-4 h-4" />
                                </a>
                              )}
                            </div>

                            {/* Review Snippets */}
                            {snippets.length > 0 && (
                              <div className="mt-2 space-y-1.5">
                                {snippets.slice(0, 2).map((s, sIdx) => (
                                  <div key={sIdx} className="text-xs text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-900/60 p-2 rounded border border-slate-200 dark:border-slate-700 flex items-start gap-1.5">
                                    <MessageSquareQuote className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <span>"{s.snippet}"</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-500" />
                              Google Maps Verified
                            </span>
                            {place.uri && (
                              <a
                                href={place.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                              >
                                Lihat di Google Maps &rarr;
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Web Sources if present */}
              {webSources.length > 0 && (
                <div className="pt-2">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Referensi & Sumber Tambahan
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {webSources.map((ws, wIdx) => (
                      <a
                        key={wIdx}
                        href={ws.web!.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                        <span>{ws.web!.title || ws.web!.uri}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Google Maps Grounding aktif untuk SIMPENDIK Non-Gelar Unpad</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
