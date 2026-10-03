import React, { useState, useMemo } from 'react';
import { 
  X, Copy, Check, ExternalLink, QrCode, Share2, 
  Sparkles, Download, Layers, GraduationCap, Globe
} from 'lucide-react';
import { Program, Kategori } from '../types';
import { UnpadLogo } from './UnpadLogo';

interface ShareRegistrationLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  programList: Program[];
  kategoriList: Kategori[];
}

export const ShareRegistrationLinkModal: React.FC<ShareRegistrationLinkModalProps> = ({
  isOpen,
  onClose,
  programList,
  kategoriList,
}) => {
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [copiedGeneral, setCopiedGeneral] = useState(false);
  const [copiedProgram, setCopiedProgram] = useState(false);

  // Base URL
  const baseUrl = useMemo(() => {
    return `${window.location.origin}${window.location.pathname}`;
  }, []);

  // General Public Registration URL
  const generalUrl = useMemo(() => {
    return `${baseUrl}?mode=daftar`;
  }, [baseUrl]);

  // Program Specific URL
  const programUrl = useMemo(() => {
    if (!selectedProgramId) return generalUrl;
    return `${baseUrl}?mode=daftar&program=${encodeURIComponent(selectedProgramId)}`;
  }, [baseUrl, selectedProgramId, generalUrl]);

  // QR Code Image URL (using reliable fast QR API)
  const qrCodeUrl = useMemo(() => {
    const target = selectedProgramId ? programUrl : generalUrl;
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(target)}`;
  }, [programUrl, generalUrl, selectedProgramId]);

  if (!isOpen) return null;

  const handleCopyGeneral = () => {
    navigator.clipboard.writeText(generalUrl);
    setCopiedGeneral(true);
    setTimeout(() => setCopiedGeneral(false), 3000);
  };

  const handleCopyProgram = () => {
    navigator.clipboard.writeText(programUrl);
    setCopiedProgram(true);
    setTimeout(() => setCopiedProgram(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 bg-[#002B66] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Link Pendaftaran Publik Peserta</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FDB913] text-[#002B66]">
                  Akses Publik
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Bagikan tautan formulir pendaftaran online untuk diakses calon peserta dengan login Google.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 custom-scrollbar">
          {/* Section 1: General Public Link */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#002B66]" />
                <span className="font-bold text-sm text-slate-800">
                  Tautan Utama Pendaftaran (Semua Program)
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                Aktif & Siap Dibagikan
              </span>
            </div>

            <p className="text-slate-500">
              Calon peserta dapat membuka tautan ini tanpa perlu akun staf, masuk dengan akun Google mereka, dan memilih program non-gelar yang tersedia.
            </p>

            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl p-2 font-mono text-[11px] text-slate-700">
              <span className="flex-1 truncate select-all">{generalUrl}</span>
              <button
                type="button"
                onClick={handleCopyGeneral}
                className="px-3 py-1.5 bg-[#002B66] hover:bg-[#001D45] text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copiedGeneral ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedGeneral ? 'Tersalin!' : 'Salin Link'}</span>
              </button>
              <a
                href={generalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                title="Buka Formulir di Tab Baru"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Section 2: Program Specific Direct Link */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#002B66]" />
              <span className="font-bold text-sm text-[#002B66]">
                Tautan Khusus Program Tertentu (Direct Program Link)
              </span>
            </div>

            <p className="text-slate-600">
              Pilih program pelatihan di bawah ini jika ingin membuat tautan yang langsung otomatis memilihkan program tersebut saat dibuka oleh pendaftar:
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Pilih Program Pelatihan:
              </label>
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-[#002B66] focus:outline-hidden"
              >
                <option value="">-- Tautan Umum (Pendaftar memilih sendiri) --</option>
                {programList.map(p => {
                  const pId = p.idProgram || p.id || '';
                  const katName = p.kategori || (kategoriList.find(k => k.idKategori === p.idKategori)?.namaKategori) || 'Non Gelar';
                  return (
                    <option key={pId} value={pId}>
                      {p.namaProgram} ({katName})
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedProgramId && (
              <div className="flex items-center gap-2 bg-white border border-blue-300 rounded-xl p-2 font-mono text-[11px] text-slate-700 animate-in fade-in">
                <span className="flex-1 truncate select-all">{programUrl}</span>
                <button
                  type="button"
                  onClick={handleCopyProgram}
                  className="px-3 py-1.5 bg-[#002B66] hover:bg-[#001D45] text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {copiedProgram ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedProgram ? 'Tersalin!' : 'Salin Link'}</span>
                </button>
                <a
                  href={programUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Buka Formulir di Tab Baru"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          {/* Section 3: QR Code Generator */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-5">
            <div className="bg-white p-3 rounded-xl border border-slate-300 shadow-xs shrink-0 text-center">
              <img
                src={qrCodeUrl}
                alt="QR Code Pendaftaran"
                className="w-32 h-32 object-contain mx-auto"
                loading="lazy"
              />
              <span className="text-[10px] text-slate-400 font-mono mt-1 block">Scan Kamera / HP</span>
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <h4 className="font-bold text-sm text-slate-800 flex items-center justify-center sm:justify-start gap-1.5">
                <QrCode className="w-4 h-4 text-[#002B66]" />
                <span>Barcode / QR Code Siap Cetak</span>
              </h4>
              <p className="text-slate-500 leading-relaxed">
                Gunakan QR Code ini pada brosur fisik, pamflet seminar, banner promosi, atau media sosial agar calon peserta dapat memindai langsung menggunakan kamera smartphone.
              </p>
              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <a
                  href={qrCodeUrl}
                  download="QR_Code_Pendaftaran_Non_Gelar_Unpad.png"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Gambar QR Code</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <UnpadLogo variant="dark" size="xs" />
            <span>Pendaftaran Resmi Universitas Padjadjaran</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
