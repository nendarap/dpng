import React, { useState } from 'react';
import { 
  X, Printer, Edit2, CheckCircle2, User, Mail, 
  Briefcase, GraduationCap, Award, Calendar, DollarSign, 
  MapPin, ShieldCheck, QrCode
} from 'lucide-react';
import { Peserta, UserRole } from '../types';

interface PesertaDetailModalProps {
  peserta: Peserta | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (peserta: Peserta) => void;
  userRole: UserRole;
}

export const PesertaDetailModal: React.FC<PesertaDetailModalProps> = ({
  peserta,
  isOpen,
  onClose,
  onEdit,
  userRole,
}) => {
  const [activeTab, setActiveTab] = useState<'biodata' | 'program' | 'cetak'>('biodata');

  if (!isOpen || !peserta) return null;

  const fullName = [peserta.gelarDepan, peserta.namaLengkap, peserta.gelarBelakang].filter(Boolean).join(' ');

  const handlePrint = () => {
    window.print();
  };

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
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black">{fullName}</h2>
                <span className="text-[10px] bg-white/20 text-white font-mono px-2 py-0.5 rounded">
                  {peserta.id}
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
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('biodata')}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === 'biodata' 
                ? 'border-[#002B66] text-[#002B66]' 
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Profil & Kontak
          </button>
          <button
            onClick={() => setActiveTab('program')}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === 'program' 
                ? 'border-[#002B66] text-[#002B66]' 
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Program & Sertifikasi
          </button>
          <button
            onClick={() => setActiveTab('cetak')}
            className={`py-3 px-4 border-b-2 transition-all ${
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
                    <span className="text-slate-800">{peserta.pic || '-'}</span>
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
    </div>
  );
};
