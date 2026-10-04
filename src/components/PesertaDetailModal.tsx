import React, { useState, useEffect } from 'react';
import { 
  X, Printer, Edit2, CheckCircle2, User, Mail, 
  Briefcase, GraduationCap, Award, Calendar, DollarSign, 
  MapPin, ShieldCheck, QrCode, FileText, Eye, Check, 
  AlertTriangle, FileCheck, ExternalLink, Download, Image as ImageIcon,
  Clock, ShieldAlert, Sparkles
} from 'lucide-react';
import { Peserta, UserRole, PicProgram, DokumenPendaftaranItem, StatusVerifikasiPendaftaran } from '../types';
import { verifyPesertaPendaftaran } from '../services/storageService';

interface PesertaDetailModalProps {
  peserta: Peserta | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (peserta: Peserta) => void;
  userRole: UserRole;
  picList?: PicProgram[];
  onRefreshData?: () => void;
  initialTab?: 'biodata' | 'program' | 'dokumen' | 'cetak';
}

export const PesertaDetailModal: React.FC<PesertaDetailModalProps> = ({
  peserta,
  isOpen,
  onClose,
  onEdit,
  userRole,
  picList = [],
  onRefreshData,
  initialTab = 'biodata',
}) => {
  const [activeTab, setActiveTab] = useState<'biodata' | 'program' | 'dokumen' | 'cetak'>(initialTab);
  const [previewDocModal, setPreviewDocModal] = useState<{ title: string; doc: DokumenPendaftaranItem } | null>(null);

  // Local state for verification form
  const [statusVerifikasi, setStatusVerifikasi] = useState<StatusVerifikasiPendaftaran>('Menunggu Verifikasi');
  const [catatanVerifikasi, setCatatanVerifikasi] = useState<string>('');
  const [verifikatorNama, setVerifikatorNama] = useState<string>('');
  const [verifikatorRole, setVerifikatorRole] = useState<'ADMIN' | 'PIC' | string>('ADMIN');
  const [isSavingVerif, setIsSavingVerif] = useState(false);
  const [verifFeedback, setVerifFeedback] = useState<string | null>(null);

  // Reset tab and states when modal opens or peserta changes
  useEffect(() => {
    if (peserta) {
      setActiveTab(initialTab);
      setStatusVerifikasi(peserta.statusVerifikasi || 'Menunggu Verifikasi');
      setCatatanVerifikasi(peserta.catatanVerifikasi || '');
      setVerifikatorNama(peserta.verifikatorNama || (userRole === 'ADMIN' ? 'Administrator SIMPENDIK' : (peserta.pic || 'PIC Program DPNG')));
      setVerifikatorRole(peserta.verifikatorRole || (userRole === 'ADMIN' ? 'ADMIN' : 'PIC'));
      setVerifFeedback(null);
    }
  }, [peserta, isOpen, initialTab, userRole]);

  if (!isOpen || !peserta) return null;

  const fullName = [peserta.gelarDepan, peserta.namaLengkap, peserta.gelarBelakang].filter(Boolean).join(' ');

  // Lookup matched PIC from picList
  const matchedPic = picList.find(p => {
    if (peserta.idPic && p.idPic === peserta.idPic) return true;
    if (peserta.pic) {
      const full = [p.gelarDepan, p.namaLengkap, p.gelarBelakang].filter(Boolean).join(' ');
      return full.toLowerCase() === peserta.pic.toLowerCase() ||
             peserta.pic.toLowerCase().includes(p.namaLengkap.toLowerCase());
    }
    return false;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleSaveVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!peserta) return;
    setIsSavingVerif(true);

    const res = verifyPesertaPendaftaran(
      peserta.id,
      statusVerifikasi,
      catatanVerifikasi,
      verifikatorNama.trim() || 'Verifikator DPNG',
      verifikatorRole
    );

    setIsSavingVerif(false);
    if (res.success && res.data) {
      setVerifFeedback(`Hasil verifikasi berhasil disimpan sebagai "${statusVerifikasi}".`);
      onRefreshData?.();
      setTimeout(() => setVerifFeedback(null), 4000);
    }
  };

  const currentVerifStatus = peserta.statusVerifikasi || 'Menunggu Verifikasi';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#002B66] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#FDB913] text-[#002B66] flex items-center justify-center font-black text-lg border-2 border-white shadow-xs">
              {peserta.namaLengkap.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black">{fullName}</h2>
                <span className="text-[10px] bg-white/20 text-white font-mono px-2 py-0.5 rounded">
                  {peserta.id}
                </span>
                {/* Verification Badge */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  currentVerifStatus === 'Terverifikasi'
                    ? 'bg-emerald-500 text-white'
                    : currentVerifStatus === 'Perlu Perbaikan'
                    ? 'bg-amber-500 text-white'
                    : currentVerifStatus === 'Ditolak'
                    ? 'bg-rose-500 text-white'
                    : 'bg-amber-400/90 text-[#002B66]'
                }`}>
                  <ShieldCheck className="w-3 h-3" />
                  <span>{currentVerifStatus}</span>
                </span>
              </div>
              <p className="text-xs text-amber-200">
                {peserta.namaProgram} ({peserta.kategoriProgram})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors"
              title="Cetak Berkas / Dokumen"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            {userRole !== 'VIEWER' && onEdit && (
              <button
                onClick={() => { onClose(); onEdit(peserta); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FDB913] hover:bg-amber-400 text-[#002B66] rounded-lg text-xs font-bold transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-600 overflow-x-auto">
          <button
            onClick={() => setActiveTab('biodata')}
            className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'biodata' 
                ? 'border-[#002B66] text-[#002B66]' 
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Profil & Kontak
          </button>
          <button
            onClick={() => setActiveTab('program')}
            className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'program' 
                ? 'border-[#002B66] text-[#002B66]' 
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Program & Sertifikasi
          </button>
          <button
            onClick={() => setActiveTab('dokumen')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'dokumen' 
                ? 'border-[#002B66] text-[#002B66] font-extrabold' 
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#FDB913]" />
            <span>Dokumen & Verifikasi Berkas</span>
            {currentVerifStatus === 'Menunggu Verifikasi' && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse ml-0.5" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('cetak')}
            className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'cetak' 
                ? 'border-[#002B66] text-[#002B66]' 
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Lembar Verifikasi Resmi (KOP Unpad)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          {activeTab === 'biodata' && (
            <div className="space-y-6">
              {/* Status Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Status Peserta</span>
                  <div className="text-sm font-bold text-[#002B66] mt-0.5">{peserta.statusPeserta}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Status Kelulusan</span>
                  <div className="text-sm font-bold text-emerald-600 mt-0.5">{peserta.statusKelulusan}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Nomor Registrasi</span>
                  <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">{peserta.nomorRegistrasi}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Tahun / Angkatan</span>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{peserta.tahun} ({peserta.angkatanBatch || '-'})</div>
                </div>
              </div>

              {/* Biodata Section */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <User className="w-4 h-4 text-[#002B66]" />
                  <span>Identitas Diri</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Nama Lengkap:</span>
                    <strong className="text-slate-800">{fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">NIK:</span>
                    <span className="font-mono text-slate-800">{peserta.nik || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">NIP / NUPTK:</span>
                    <span className="font-mono text-slate-800">{peserta.nip || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Jenis Kelamin:</span>
                    <span className="text-slate-800">{peserta.jenisKelamin}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tempat, Tanggal Lahir:</span>
                    <span className="text-slate-800">
                      {[peserta.tempatLahir, peserta.tanggalLahir].filter(Boolean).join(', ') || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Pendidikan Terakhir:</span>
                    <span className="text-slate-800">{peserta.pendidikanTerakhir || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Kontak & Institusi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Mail className="w-4 h-4 text-[#002B66]" />
                    <span>Kontak & Domisili</span>
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Email:</span>
                      <span className="text-slate-800 font-medium">{peserta.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Nomor Handphone / WA:</span>
                      <span className="text-slate-800 font-medium">{peserta.nomorHp || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Alamat Lengkap:</span>
                      <span className="text-slate-800">{peserta.alamat || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Kota & Provinsi:</span>
                      <span className="text-slate-800">
                        {[peserta.kotaKabupaten, peserta.provinsi].filter(Boolean).join(', ') || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Briefcase className="w-4 h-4 text-[#002B66]" />
                    <span>Pekerjaan & Institusi</span>
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Instansi:</span>
                      <strong className="text-slate-800">{peserta.instansi || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Jabatan / Posisi:</span>
                      <span className="text-slate-800">{peserta.jabatan || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Fakultas / Unit Kerja:</span>
                      <span className="text-slate-800">{peserta.fakultasUnit || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'program' && (
            <div className="space-y-6">
              {/* Program Details */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <GraduationCap className="w-4 h-4 text-[#002B66]" />
                  <span>Informasi Program Kursus</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Kategori Program:</span>
                    <strong className="text-slate-800">{peserta.kategoriProgram}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Nama Program:</span>
                    <strong className="text-slate-800">{peserta.namaProgram}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Angkatan / Batch:</span>
                    <span className="text-slate-800">{peserta.angkatanBatch || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tanggal Mulai:</span>
                    <span className="text-slate-800">{peserta.tanggalMulai || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tanggal Selesai:</span>
                    <span className="text-slate-800">{peserta.tanggalSelesai || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">PIC / Koordinator:</span>
                    <span className="text-slate-900 font-semibold">{peserta.pic || '-'}</span>
                    {matchedPic && (
                      <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-1.5 bg-blue-50/60 p-2 rounded-lg border border-blue-100">
                        <span className="font-semibold text-[#002B66]">{matchedPic.jabatan}</span>
                        <span>•</span>
                        <span>{matchedPic.unitFakultas}</span>
                        {matchedPic.nomorHp && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 font-medium font-mono">WA: {matchedPic.nomorHp}</span>
                          </>
                        )}
                        {matchedPic.email && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600">{matchedPic.email}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sertifikat & Keuangan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-amber-50/40">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 border-b border-amber-200 pb-2">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>Sertifikat & Kelulusan</span>
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Nomor Sertifikat Resmi:</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {peserta.nomorSertifikat || 'Belum Diterbitkan'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Tanggal Sertifikat:</span>
                      <span className="text-slate-800 font-medium">{peserta.tanggalSertifikat || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Nilai / Predikat Akhir:</span>
                      <span className="text-slate-800 font-bold">{peserta.nilaiSkor || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Administrasi Keuangan</span>
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Biaya Program:</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        Rp {Number(peserta.biayaProgram || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Sumber Pendanaan:</span>
                      <span className="text-slate-800 font-medium">{peserta.sumberDana || 'Mandiri'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Catatan Khusus:</span>
                      <span className="text-slate-700">{peserta.keterangan || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit Timestamps */}
              <div className="bg-slate-50 p-3 rounded-lg text-[10px] text-slate-500 flex flex-wrap justify-between gap-2 border border-slate-200">
                <div>Didaftarkan: {peserta.createdAt} oleh <strong>{peserta.createdBy}</strong></div>
                <div>Terakhir diubah: {peserta.updatedAt} oleh <strong>{peserta.updatedBy}</strong></div>
              </div>
            </div>
          )}

          {/* TAB: DOKUMEN PERSYARATAN & VERIFIKASI BERKAS */}
          {activeTab === 'dokumen' && (
            <div className="space-y-6">
              {/* Status Verifikasi Banner */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                currentVerifStatus === 'Terverifikasi'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : currentVerifStatus === 'Perlu Perbaikan'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : currentVerifStatus === 'Ditolak'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs shrink-0 ${
                    currentVerifStatus === 'Terverifikasi'
                      ? 'bg-emerald-600'
                      : currentVerifStatus === 'Perlu Perbaikan'
                      ? 'bg-amber-600'
                      : currentVerifStatus === 'Ditolak'
                      ? 'bg-rose-600'
                      : 'bg-[#002B66]'
                  }`}>
                    {currentVerifStatus === 'Terverifikasi' ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : currentVerifStatus === 'Perlu Perbaikan' ? (
                      <AlertTriangle className="w-5 h-5 text-white" />
                    ) : currentVerifStatus === 'Ditolak' ? (
                      <ShieldAlert className="w-5 h-5 text-white" />
                    ) : (
                      <Clock className="w-5 h-5 text-[#FDB913]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">Status Verifikasi Pendaftaran:</span>
                      <strong className="text-sm font-black">{currentVerifStatus}</strong>
                    </div>
                    {peserta.verifikatorNama && (
                      <p className="text-xs opacity-90 mt-0.5">
                        Diverifikasi oleh: <strong>{peserta.verifikatorNama}</strong> ({peserta.verifikatorRole || 'Staf DPNG'}) • {peserta.tanggalVerifikasi || '-'}
                      </p>
                    )}
                    {peserta.catatanVerifikasi && (
                      <div className="mt-1 text-xs italic bg-white/70 px-2.5 py-1 rounded border border-black/10">
                        Catatan: &ldquo;{peserta.catatanVerifikasi}&rdquo;
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] opacity-75 block">Nomor Registrasi:</span>
                  <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-black/10">
                    {peserta.nomorRegistrasi}
                  </span>
                </div>
              </div>

              {/* 4 Dokumen Persyaratan Pendaftaran */}
              <div className="border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 bg-white shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-[#002B66] flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-[#FDB913]" />
                      <span>Berkas Dokumen yang Diunggah Peserta</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pratinjau KTP, Kartu Keluarga, Pas Photo, dan Ijazah Terakhir untuk verifikasi administrasi.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Dokumen 1: KTP */}
                  {(() => {
                    const doc = peserta.dokumen?.ktp;
                    return (
                      <div className="border border-slate-200 hover:border-blue-300 rounded-xl p-4 bg-slate-50/70 transition-all flex flex-col justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#002B66] flex items-center justify-center shrink-0 border border-blue-200 overflow-hidden">
                            {doc?.fileUrl && doc.fileUrl.startsWith('data:image') ? (
                              <img src={doc.fileUrl} alt="KTP" className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="w-6 h-6 text-[#002B66]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-slate-800">1. KTP (Kartu Tanda Penduduk)</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                doc ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                              }`}>
                                {doc ? 'Tersedia' : 'Belum Ada'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                              {doc?.namaFile || 'Belum diunggah oleh pendaftar'}
                            </p>
                            {doc && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Ukuran: {doc.fileSize || 'Standar'} • Diunggah: {doc.uploadedAt || peserta.createdAt}
                              </div>
                            )}
                          </div>
                        </div>

                        {doc ? (
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                            <button
                              type="button"
                              onClick={() => setPreviewDocModal({ title: 'KTP (Kartu Tanda Penduduk)', doc })}
                              className="flex-1 py-1.5 px-2.5 bg-[#002B66] hover:bg-[#001D45] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#FDB913]" />
                              <span>Lihat Dokumen</span>
                            </button>
                            {doc.fileUrl && (
                              <a
                                href={doc.fileUrl}
                                download={doc.namaFile || `KTP_${peserta.nik}.png`}
                                className="p-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg cursor-pointer transition-colors"
                                title="Unduh Berkas KTP"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-2 text-[11px] text-slate-400 italic bg-white/60 rounded border border-dashed border-slate-300">
                            Peserta belum melampirkan berkas KTP
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Dokumen 2: Kartu Keluarga */}
                  {(() => {
                    const doc = peserta.dokumen?.kartuKeluarga;
                    return (
                      <div className="border border-slate-200 hover:border-blue-300 rounded-xl p-4 bg-slate-50/70 transition-all flex flex-col justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 border border-purple-200 overflow-hidden">
                            {doc?.fileUrl && doc.fileUrl.startsWith('data:image') ? (
                              <img src={doc.fileUrl} alt="Kartu Keluarga" className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="w-6 h-6 text-purple-700" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-slate-800">2. Kartu Keluarga (KK)</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                doc ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                              }`}>
                                {doc ? 'Tersedia' : 'Belum Ada'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                              {doc?.namaFile || 'Belum diunggah oleh pendaftar'}
                            </p>
                            {doc && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Ukuran: {doc.fileSize || 'Standar'} • Diunggah: {doc.uploadedAt || peserta.createdAt}
                              </div>
                            )}
                          </div>
                        </div>

                        {doc ? (
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                            <button
                              type="button"
                              onClick={() => setPreviewDocModal({ title: 'Kartu Keluarga (KK)', doc })}
                              className="flex-1 py-1.5 px-2.5 bg-[#002B66] hover:bg-[#001D45] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#FDB913]" />
                              <span>Lihat Dokumen</span>
                            </button>
                            {doc.fileUrl && (
                              <a
                                href={doc.fileUrl}
                                download={doc.namaFile || `KK_${peserta.nik}.png`}
                                className="p-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg cursor-pointer transition-colors"
                                title="Unduh Berkas KK"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-2 text-[11px] text-slate-400 italic bg-white/60 rounded border border-dashed border-slate-300">
                            Peserta belum melampirkan berkas KK
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Dokumen 3: Pas Photo */}
                  {(() => {
                    const doc = peserta.dokumen?.pasPhoto;
                    return (
                      <div className="border border-slate-200 hover:border-blue-300 rounded-xl p-4 bg-slate-50/70 transition-all flex flex-col justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200 overflow-hidden">
                            {doc?.fileUrl && doc.fileUrl.startsWith('data:image') ? (
                              <img src={doc.fileUrl} alt="Pas Photo" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-amber-700" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-slate-800">3. Pas Photo Formal</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                doc ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                              }`}>
                                {doc ? 'Tersedia' : 'Belum Ada'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                              {doc?.namaFile || 'Belum diunggah oleh pendaftar'}
                            </p>
                            {doc && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Ukuran: {doc.fileSize || 'Standar'} • Diunggah: {doc.uploadedAt || peserta.createdAt}
                              </div>
                            )}
                          </div>
                        </div>

                        {doc ? (
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                            <button
                              type="button"
                              onClick={() => setPreviewDocModal({ title: 'Pas Photo Formal', doc })}
                              className="flex-1 py-1.5 px-2.5 bg-[#002B66] hover:bg-[#001D45] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#FDB913]" />
                              <span>Lihat Pas Photo</span>
                            </button>
                            {doc.fileUrl && (
                              <a
                                href={doc.fileUrl}
                                download={doc.namaFile || `Foto_${peserta.namaLengkap}.png`}
                                className="p-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg cursor-pointer transition-colors"
                                title="Unduh Pas Photo"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-2 text-[11px] text-slate-400 italic bg-white/60 rounded border border-dashed border-slate-300">
                            Peserta belum melampirkan Pas Photo
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Dokumen 4: Ijazah Terakhir */}
                  {(() => {
                    const doc = peserta.dokumen?.ijazahTerakhir;
                    return (
                      <div className="border border-slate-200 hover:border-blue-300 rounded-xl p-4 bg-slate-50/70 transition-all flex flex-col justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200 overflow-hidden">
                            {doc?.fileUrl && doc.fileUrl.startsWith('data:image') ? (
                              <img src={doc.fileUrl} alt="Ijazah" className="w-full h-full object-cover" />
                            ) : (
                              <GraduationCap className="w-6 h-6 text-emerald-700" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-slate-800">4. Ijazah Terakhir ({peserta.pendidikanTerakhir || 'Formal'})</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                doc ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                              }`}>
                                {doc ? 'Tersedia' : 'Belum Ada'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                              {doc?.namaFile || 'Belum diunggah oleh pendaftar'}
                            </p>
                            {doc && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Ukuran: {doc.fileSize || 'Standar'} • Diunggah: {doc.uploadedAt || peserta.createdAt}
                              </div>
                            )}
                          </div>
                        </div>

                        {doc ? (
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                            <button
                              type="button"
                              onClick={() => setPreviewDocModal({ title: 'Ijazah Terakhir', doc })}
                              className="flex-1 py-1.5 px-2.5 bg-[#002B66] hover:bg-[#001D45] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#FDB913]" />
                              <span>Lihat Ijazah</span>
                            </button>
                            {doc.fileUrl && (
                              <a
                                href={doc.fileUrl}
                                download={doc.namaFile || `Ijazah_${peserta.namaLengkap}.png`}
                                className="p-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg cursor-pointer transition-colors"
                                title="Unduh Berkas Ijazah"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-2 text-[11px] text-slate-400 italic bg-white/60 rounded border border-dashed border-slate-300">
                            Peserta belum melampirkan Ijazah Terakhir
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Panel Form Verifikasi oleh Admin atau PIC Program */}
              {userRole !== 'VIEWER' && (
                <form onSubmit={handleSaveVerification} className="border-2 border-blue-200 rounded-xl p-5 bg-gradient-to-br from-blue-50/50 via-white to-amber-50/30 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-blue-200 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#002B66] text-[#FDB913] flex items-center justify-center font-bold">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-[#002B66]">
                          Formulir Verifikasi Berkas (Admin & PIC Program)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Tentukan keputusan kelayakan berkas persyaratan pendaftar non-gelar ini.
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] bg-[#002B66]/10 text-[#002B66] font-bold px-2 py-0.5 rounded">
                      Role Anda: {userRole}
                    </span>
                  </div>

                  {verifFeedback && (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{verifFeedback}</span>
                    </div>
                  )}

                  {/* Verifier Identity Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Nama Verifikator <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={verifikatorNama}
                        onChange={(e) => setVerifikatorNama(e.target.value)}
                        placeholder="Nama Admin atau PIC Program"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Kapasitas / Jabatan Verifikator <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={verifikatorRole}
                        onChange={(e) => setVerifikatorRole(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden font-semibold text-slate-800"
                      >
                        <option value="ADMIN">Administrator Utama DPNG</option>
                        <option value="PIC">Koordinator / PIC Program Pelatihan</option>
                        <option value="OPERATOR">Staf Administrasi Akademik Non Gelar</option>
                      </select>
                    </div>
                  </div>

                  {/* Status Decision Picker */}
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-slate-700 text-xs">
                      Keputusan Status Verifikasi:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <label className={`p-3 rounded-xl border-2 flex items-center gap-2.5 cursor-pointer transition-all ${
                        statusVerifikasi === 'Terverifikasi'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}>
                        <input
                          type="radio"
                          name="statusVerifikasiDecision"
                          checked={statusVerifikasi === 'Terverifikasi'}
                          onChange={() => setStatusVerifikasi('Terverifikasi')}
                          className="accent-emerald-600 w-4 h-4"
                        />
                        <div>
                          <span className="block text-xs font-bold text-emerald-700">✓ Terverifikasi (Disetujui)</span>
                          <span className="text-[10px] text-slate-500 block">Berkas valid & lengkap</span>
                        </div>
                      </label>

                      <label className={`p-3 rounded-xl border-2 flex items-center gap-2.5 cursor-pointer transition-all ${
                        statusVerifikasi === 'Perlu Perbaikan'
                          ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}>
                        <input
                          type="radio"
                          name="statusVerifikasiDecision"
                          checked={statusVerifikasi === 'Perlu Perbaikan'}
                          onChange={() => setStatusVerifikasi('Perlu Perbaikan')}
                          className="accent-amber-600 w-4 h-4"
                        />
                        <div>
                          <span className="block text-xs font-bold text-amber-700">⚠ Perlu Perbaikan Berkas</span>
                          <span className="text-[10px] text-slate-500 block">Minta peserta perbaiki</span>
                        </div>
                      </label>

                      <label className={`p-3 rounded-xl border-2 flex items-center gap-2.5 cursor-pointer transition-all ${
                        statusVerifikasi === 'Ditolak'
                          ? 'border-rose-500 bg-rose-50 text-rose-950 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}>
                        <input
                          type="radio"
                          name="statusVerifikasiDecision"
                          checked={statusVerifikasi === 'Ditolak'}
                          onChange={() => setStatusVerifikasi('Ditolak')}
                          className="accent-rose-600 w-4 h-4"
                        />
                        <div>
                          <span className="block text-xs font-bold text-rose-700">✕ Ditolak</span>
                          <span className="text-[10px] text-slate-500 block">Tidak memenuhi syarat</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Notes for applicant */}
                  <div>
                    <label className="block font-semibold text-slate-700 text-xs mb-1">
                      Catatan Verifikasi / Pesan untuk Peserta:
                    </label>
                    <textarea
                      rows={2}
                      value={catatanVerifikasi}
                      onChange={(e) => setCatatanVerifikasi(e.target.value)}
                      placeholder="Contoh: Berkas KTP dan Ijazah lengkap dan telah divalidasi. Selamat mengikuti pelatihan!"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B66] focus:outline-hidden text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Catatan ini dapat dibaca oleh calon peserta pada halaman Status Pendaftaran mereka.
                    </p>
                  </div>

                  {/* Submit Verification */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSavingVerif}
                      className="px-6 py-2.5 bg-[#002B66] hover:bg-[#001D45] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isSavingVerif ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[#FDB913]" />
                          <span>Simpan Hasil Verifikasi</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'cetak' && (
            <div className="bg-white p-6 border border-slate-300 rounded-xl shadow-xs space-y-6 font-serif print:m-0 print:p-0 print:border-none">
              {/* KOP RESMI UNPAD */}
              <div className="text-center border-b-2 border-black pb-3">
                <div className="text-sm font-bold uppercase tracking-wider text-slate-900 font-sans">
                  KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI
                </div>
                <div className="text-base font-black uppercase text-[#002B66] font-sans">
                  UNIVERSITAS PADJADJARAN
                </div>
                <div className="text-xs font-bold uppercase text-slate-800 font-sans">
                  DIREKTORAT PENDIDIKAN NON GELAR
                </div>
                <p className="text-[10px] text-slate-600 font-sans italic mt-0.5">
                  Jl. Dipati Ukur No. 35 Bandung 40132 / Jl. Ir. Soekarno Km. 21 Jatinangor, Sumedang 45363
                  <br />Website: https://unpad.ac.id | Email: dpng@unpad.ac.id
                </p>
              </div>

              {/* Title Surat */}
              <div className="text-center space-y-0.5">
                <h3 className="text-sm font-bold uppercase underline font-sans text-slate-900">
                  SURAT KETERANGAN REGISTRASI PESERTA PENDIDIKAN NON GELAR
                </h3>
                <p className="text-[11px] font-mono text-slate-600 font-sans">
                  Nomor: {peserta.nomorRegistrasi}/UN6.DPNG/SKP/{peserta.tahun}
                </p>
              </div>

              {/* Content body */}
              <div className="text-xs space-y-3 text-slate-800 leading-relaxed font-sans">
                <p>
                  Direktur Pendidikan Non Gelar Universitas Padjadjaran dengan ini menerangkan bahwa:
                </p>

                <div className="pl-6 space-y-1.5 font-sans">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-600">ID Peserta Sistem</span>
                    <span className="col-span-2 font-mono font-bold">: {peserta.id}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-600">Nama Lengkap & Gelar</span>
                    <span className="col-span-2 font-bold">: {fullName}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-600">Nomor Induk Kependudukan (NIK)</span>
                    <span className="col-span-2">: {peserta.nik || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-600">Instansi Asal</span>
                    <span className="col-span-2">: {peserta.instansi || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-600">Kategori Program</span>
                    <span className="col-span-2 font-semibold">: {peserta.kategoriProgram}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-600">Nama Program Kursus</span>
                    <span className="col-span-2 font-bold text-[#002B66]">: {peserta.namaProgram}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-600">Angkatan / Tahun</span>
                    <span className="col-span-2">: {peserta.angkatanBatch || '-'} / {peserta.tahun}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-600">Status Penyelesaian</span>
                    <span className="col-span-2 font-bold">: {peserta.statusPeserta} ({peserta.statusKelulusan})</span>
                  </div>
                  {peserta.nomorSertifikat && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-600">Nomor Sertifikat Kelulusan</span>
                      <span className="col-span-2 font-mono font-bold text-emerald-700">: {peserta.nomorSertifikat}</span>
                    </div>
                  )}
                </div>

                <p className="mt-4">
                  Demikian surat keterangan ini diterbitkan dengan sah dan tercatat secara digital pada pangkalan database Google Sheets Direktorat Pendidikan Non Gelar Universitas Padjadjaran untuk dapat dipergunakan sebagaimana mestinya.
                </p>
              </div>

              {/* Tanda Tangan & QR Code */}
              <div className="pt-6 flex items-end justify-between font-sans">
                <div className="border border-slate-300 p-2.5 rounded-lg text-center">
                  <QrCode className="w-16 h-16 mx-auto text-slate-800" />
                  <span className="text-[9px] text-slate-500 font-mono block mt-1">
                    VERIFIKASI DIGITAL SIMPENDIK
                  </span>
                </div>

                <div className="text-right text-xs space-y-1">
                  <div>Bandung, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  <div className="font-semibold">a.n. Rektor Universitas Padjadjaran</div>
                  <div className="font-bold text-[#002B66]">Direktur Pendidikan Non Gelar,</div>
                  <div className="h-14 flex items-end justify-end">
                    <span className="italic text-[10px] text-slate-400">[Tanda Tangan Digital Tersertifikasi]</span>
                  </div>
                  <div className="font-bold underline">Prof. Dr. Ir. H. Ahmad Santoso, M.Sc.</div>
                  <div className="text-[10px] text-slate-500 font-mono">NIP. 197405121998031002</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox / Document Preview Modal */}
      {previewDocModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#002B66] text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">{previewDocModal.title}</h4>
                <p className="text-[11px] text-amber-200 font-mono truncate max-w-md">
                  {previewDocModal.doc.namaFile} • {previewDocModal.doc.fileSize || 'Ukuran Standar'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {previewDocModal.doc.fileUrl && (
                  <a
                    href={previewDocModal.doc.fileUrl}
                    download={previewDocModal.doc.namaFile}
                    className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
                    title="Unduh Berkas"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewDocModal(null)}
                  className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-900/10 min-h-[300px]">
              {previewDocModal.doc.fileUrl ? (
                previewDocModal.doc.fileUrl.startsWith('data:image') || previewDocModal.doc.namaFile.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                  <img
                    src={previewDocModal.doc.fileUrl}
                    alt={previewDocModal.title}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md border border-slate-200 bg-white"
                  />
                ) : (
                  <div className="text-center p-8 bg-white rounded-xl shadow-xs border border-slate-200 space-y-3">
                    <FileText className="w-16 h-16 text-[#002B66] mx-auto" />
                    <div>
                      <h5 className="font-bold text-slate-800 text-sm">{previewDocModal.doc.namaFile}</h5>
                      <p className="text-xs text-slate-500 mt-1">Dokumen format PDF / Dokumen Resmi Terlampir</p>
                    </div>
                    <a
                      href={previewDocModal.doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#002B66] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-[#001D45]"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#FDB913]" />
                      <span>Buka Dokumen PDF di Tab Baru</span>
                    </a>
                  </div>
                )
              ) : (
                <div className="text-center p-6 text-slate-400">Berkas tidak memiliki data preview</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
