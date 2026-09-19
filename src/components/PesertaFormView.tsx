import React, { useState, useEffect, useMemo } from 'react';
import { 
  Save, ArrowLeft, AlertCircle, CheckCircle2, 
  User, Mail, Briefcase, GraduationCap, Award, DollarSign, FileCheck,
  AlertTriangle, UserCheck, Plus, ExternalLink, Phone, MessageSquare, X
} from 'lucide-react';
import { Peserta, Kategori, Program, UserRole, StatusPeserta, StatusKelulusan, PicProgram } from '../types';
import { generateNextIdPeserta, checkDuplicate } from '../services/storageService';
import { DEFAULT_MASTER_DATA } from '../data/initialData';

interface PesertaFormViewProps {
  initialData?: Peserta | null;
  kategoriList: Kategori[];
  programList: Program[];
  picList?: PicProgram[];
  onQuickAddPic?: (newPic: PicProgram) => void;
  userRole: UserRole;
  onSave: (data: Partial<Peserta>, bypassDuplicate?: boolean) => { success: boolean; message: string; duplicateInfo?: any };
  onCancel: () => void;
  onViewExisting?: (peserta: Peserta) => void;
}

export const PesertaFormView: React.FC<PesertaFormViewProps> = ({
  initialData,
  kategoriList,
  programList,
  picList = [],
  onQuickAddPic,
  userRole,
  onSave,
  onCancel,
  onViewExisting,
}) => {
  const isEdit = Boolean(initialData);

  // Form State
  const [formData, setFormData] = useState<Partial<Peserta>>({
    tahun: new Date().getFullYear(),
    statusPeserta: 'Terdaftar',
    statusKelulusan: 'Belum Evaluasi',
    jenisKelamin: 'Laki-laki',
    sumberDana: 'Mandiri / Pribadi',
    pendidikanTerakhir: 'Diploma IV (D4) / Sarjana (S1)',
    provinsi: 'Jawa Barat',
    biayaProgram: 0,
    ...initialData
  });

  // ID Preview
  const [generatedId, setGeneratedId] = useState<string>('');

  // Quick Add PIC Modal State
  const [isQuickPicModalOpen, setIsQuickPicModalOpen] = useState(false);
  const [manualPicMode, setManualPicMode] = useState(false);
  const [newPicNama, setNewPicNama] = useState('');
  const [newPicGelarDepan, setNewPicGelarDepan] = useState('');
  const [newPicGelarBelakang, setNewPicGelarBelakang] = useState('');
  const [newPicEmail, setNewPicEmail] = useState('');
  const [newPicHp, setNewPicHp] = useState('');
  const [newPicUnit, setNewPicUnit] = useState('Direktorat Pendidikan Non Gelar');
  const [newPicJabatan, setNewPicJabatan] = useState('Koordinator Program');

  useEffect(() => {
    if (initialData?.id) {
      setGeneratedId(initialData.id);
    } else {
      setGeneratedId(generateNextIdPeserta(formData.tahun));
    }
  }, [formData.tahun, initialData]);

  // Dynamic Programs by Selected Category
  const availablePrograms = useMemo(() => {
    if (!formData.kategoriProgram) return programList;
    const matchedKat = kategoriList.find(k => k.namaKategori === formData.kategoriProgram);
    if (!matchedKat) return programList;
    const filtered = programList.filter(p => p.idKategori === matchedKat.idKategori);
    return filtered.length > 0 ? filtered : programList;
  }, [formData.kategoriProgram, kategoriList, programList]);

  // Selected PIC Object if linked by idPic or name
  const currentSelectedPic = useMemo(() => {
    if (formData.idPic) {
      const found = picList.find(p => p.idPic === formData.idPic);
      if (found) return found;
    }
    if (formData.pic) {
      const found = picList.find(p => {
        const fullDisplay = [p.gelarDepan, p.namaLengkap, p.gelarBelakang].filter(Boolean).join(' ');
        return fullDisplay.toLowerCase() === formData.pic?.toLowerCase() ||
               p.namaLengkap.toLowerCase() === formData.pic?.toLowerCase() ||
               formData.pic?.toLowerCase().includes(p.namaLengkap.toLowerCase());
      });
      if (found) return found;
    }
    return null;
  }, [formData.idPic, formData.pic, picList]);

  // Handle Program Selection with Relational Auto-fill of PIC
  const handleProgramSelection = (val: string) => {
    const matchedProg = programList.find(p => p.namaProgram.toLowerCase() === val.toLowerCase());
    let nextIdPic = formData.idPic;
    let nextPicName = formData.pic;
    let nextKategori = formData.kategoriProgram;
    let nextIdKategori = formData.idKategori;

    if (matchedProg) {
      // Auto-fill category if empty or mismatch
      if (matchedProg.idKategori) {
        nextIdKategori = matchedProg.idKategori;
        const katObj = kategoriList.find(k => k.idKategori === matchedProg.idKategori);
        if (katObj) nextKategori = katObj.namaKategori;
      }

      // Check if this program has a registered PIC assigned in program or picList
      if (matchedProg.idPic) {
        nextIdPic = matchedProg.idPic;
        const picObj = picList.find(p => p.idPic === matchedProg.idPic);
        if (picObj) {
          nextPicName = [picObj.gelarDepan, picObj.namaLengkap, picObj.gelarBelakang].filter(Boolean).join(' ');
        } else if (matchedProg.namaPic) {
          nextPicName = matchedProg.namaPic;
        }
      } else {
        // Look up in picList by idProgramUtama or namaProgramUtama
        const picForProg = picList.find(p => 
          (p.idProgramUtama && p.idProgramUtama === matchedProg.idProgram) ||
          (p.namaProgramUtama && p.namaProgramUtama.toLowerCase() === matchedProg.namaProgram.toLowerCase())
        );
        if (picForProg) {
          nextIdPic = picForProg.idPic;
          nextPicName = [picForProg.gelarDepan, picForProg.namaLengkap, picForProg.gelarBelakang].filter(Boolean).join(' ');
        }
      }
    }

    setFormData(prev => ({
      ...prev,
      namaProgram: val,
      idProgram: matchedProg ? matchedProg.idProgram : prev.idProgram,
      kategoriProgram: nextKategori,
      idKategori: nextIdKategori,
      idPic: nextIdPic,
      pic: nextPicName
    }));
  };

  // Handle Quick Save PIC from within the form
  const handleQuickAddPicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPicNama.trim()) return;

    const fullWithTitles = [newPicGelarDepan.trim(), newPicNama.trim(), newPicGelarBelakang.trim()].filter(Boolean).join(' ');
    const newPic: PicProgram = {
      idPic: '',
      namaLengkap: newPicNama.trim(),
      gelarDepan: newPicGelarDepan.trim() || undefined,
      gelarBelakang: newPicGelarBelakang.trim() || undefined,
      email: newPicEmail.trim(),
      nomorHp: newPicHp.trim(),
      unitFakultas: newPicUnit,
      jabatan: newPicJabatan,
      namaProgramUtama: formData.namaProgram || undefined,
      idProgramUtama: formData.idProgram || undefined,
      statusAktif: 'Ya'
    };

    if (onQuickAddPic) {
      onQuickAddPic(newPic);
    }

    // Associate directly with current form
    setFormData(prev => ({
      ...prev,
      pic: fullWithTitles
    }));

    setIsQuickPicModalOpen(false);
    setNewPicNama('');
    setNewPicGelarDepan('');
    setNewPicGelarBelakang('');
    setNewPicEmail('');
    setNewPicHp('');
  };

  // Duplicate Warning Modal State
  const [dupModalInfo, setDupModalInfo] = useState<{
    isOpen: boolean;
    field?: string;
    value?: string;
    existing?: Peserta;
  }>({ isOpen: false });

  // Error messages
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.namaLengkap?.trim()) errs.namaLengkap = 'Nama lengkap wajib diisi';
    if (!formData.kategoriProgram) errs.kategoriProgram = 'Kategori program wajib dipilih';
    if (!formData.namaProgram) errs.namaProgram = 'Nama program wajib diisi/dipilih';
    if (!formData.tahun) errs.tahun = 'Tahun wajib diisi';
    
    if (formData.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errs.email = 'Format email tidak valid';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent, bypass = false) => {
    e.preventDefault();
    if (!validate()) return;

    // Check duplicate first if not editing or if bypassed
    if (!bypass) {
      const dup = checkDuplicate(formData, initialData?.id);
      if (dup.isDuplicate) {
        setDupModalInfo({
          isOpen: true,
          field: dup.field,
          value: dup.value,
          existing: dup.existingPeserta
        });
        return;
      }
    }

    const payload = {
      ...formData,
      id: initialData?.id || generatedId,
      nomorRegistrasi: formData.nomorRegistrasi || `REG-${formData.tahun}-${generatedId.split('-')[2] || '000001'}`
    };

    const res = onSave(payload, bypass);
    if (res.success) {
      setDupModalInfo({ isOpen: false });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-black text-[#002B66]">
              {isEdit ? 'Edit Data Peserta' : 'Form Input Peserta Baru'}
            </h1>
            <p className="text-xs text-slate-500">
              Direktorat Pendidikan Non Gelar Universitas Padjadjaran
            </p>
          </div>
        </div>

        {/* Auto ID Display */}
        <div className="flex items-center gap-2 bg-[#002B66]/5 px-3 py-1.5 rounded-lg border border-[#002B66]/20">
          <span className="text-[11px] font-semibold text-slate-600">ID Peserta Otomatis:</span>
          <span className="text-xs font-mono font-bold text-[#002B66]">{generatedId}</span>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* BAGIAN A: IDENTITAS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
            <User className="w-4 h-4 text-[#002B66]" />
            <h2 className="text-xs font-bold text-[#002B66] uppercase tracking-wider">
              A. Identitas Diri Peserta
            </h2>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Nama Lengkap (Wajib) */}
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Nama Lengkap Tanpa Gelar <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                value={formData.namaLengkap || ''}
                onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                className={`w-full p-2.5 rounded-lg border ${errors.namaLengkap ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-slate-50'} focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium`}
              />
              {errors.namaLengkap && (
                <span className="text-rose-500 text-[10px] mt-1 block">{errors.namaLengkap}</span>
              )}
            </div>

            {/* Jenis Kelamin */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
              <select
                value={formData.jenisKelamin || 'Laki-laki'}
                onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as any })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            {/* Gelar Depan */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Gelar Depan</label>
              <input
                type="text"
                placeholder="Contoh: Prof. Dr. / Dr. / Ns."
                value={formData.gelarDepan || ''}
                onChange={(e) => setFormData({ ...formData, gelarDepan: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              />
            </div>

            {/* Gelar Belakang */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Gelar Belakang</label>
              <input
                type="text"
                placeholder="Contoh: S.T., M.Kom., Ph.D."
                value={formData.gelarBelakang || ''}
                onChange={(e) => setFormData({ ...formData, gelarBelakang: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              />
            </div>

            {/* NIK */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">NIK (Nomor Induk Kependudukan)</label>
              <input
                type="text"
                maxLength={16}
                placeholder="16 digit NIK KTP"
                value={formData.nik || ''}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              />
            </div>

            {/* NIP */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">NIP (Bagi ASN / Dosen / Pegawai)</label>
              <input
                type="text"
                placeholder="18 digit NIP / Nomor Pegawai"
                value={formData.nip || ''}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              />
            </div>

            {/* Tempat Lahir */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tempat Lahir</label>
              <input
                type="text"
                placeholder="Contoh: Bandung"
                value={formData.tempatLahir || ''}
                onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              />
            </div>

            {/* Tanggal Lahir */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Lahir</label>
              <input
                type="date"
                value={formData.tanggalLahir || ''}
                onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* BAGIAN B: KONTAK & ALAMAT */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#002B66]" />
            <h2 className="text-xs font-bold text-[#002B66] uppercase tracking-wider">
              B. Kontak & Alamat
            </h2>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Email */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Email Peserta <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="nama@domain.com"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full p-2.5 rounded-lg border ${errors.email ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-slate-50'} focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium`}
              />
              {errors.email && (
                <span className="text-rose-500 text-[10px] mt-1 block">{errors.email}</span>
              )}
            </div>

            {/* Nomor HP / WhatsApp */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor HP / WhatsApp</label>
              <input
                type="tel"
                placeholder="08xxxxxxxxxx"
                value={formData.nomorHp || ''}
                onChange={(e) => setFormData({ ...formData, nomorHp: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              />
            </div>

            {/* Provinsi */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Provinsi</label>
              <select
                value={formData.provinsi || 'Jawa Barat'}
                onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              >
                {DEFAULT_MASTER_DATA.provinsi.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Kota / Kabupaten */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kota / Kabupaten</label>
              <input
                type="text"
                placeholder="Contoh: Kota Bandung / Kab. Sumedang"
                value={formData.kotaKabupaten || ''}
                onChange={(e) => setFormData({ ...formData, kotaKabupaten: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              />
            </div>

            {/* Alamat Lengkap */}
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap</label>
              <input
                type="text"
                placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
                value={formData.alamat || ''}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* BAGIAN C: PEKERJAAN */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#002B66]" />
            <h2 className="text-xs font-bold text-[#002B66] uppercase tracking-wider">
              C. Informasi Pekerjaan & Institusi Asal
            </h2>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Instansi / Institusi</label>
              <input
                type="text"
                placeholder="Contoh: Universitas Padjadjaran / PT Telkom"
                value={formData.instansi || ''}
                onChange={(e) => setFormData({ ...formData, instansi: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Jabatan / Profesi</label>
              <input
                type="text"
                placeholder="Contoh: Dosen / Dokter / Manajer"
                value={formData.jabatan || ''}
                onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Fakultas / Unit Kerja</label>
              <input
                type="text"
                placeholder="Contoh: Fakultas Kedokteran"
                value={formData.fakultasUnit || ''}
                onChange={(e) => setFormData({ ...formData, fakultasUnit: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Pendidikan Terakhir</label>
              <select
                value={formData.pendidikanTerakhir || 'Diploma IV (D4) / Sarjana (S1)'}
                onChange={(e) => setFormData({ ...formData, pendidikanTerakhir: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              >
                {DEFAULT_MASTER_DATA.pendidikanTerakhir.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* BAGIAN D: PROGRAM PENDIDIKAN NON GELAR */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#002B66]" />
            <h2 className="text-xs font-bold text-[#002B66] uppercase tracking-wider">
              D. Pendidikan Non Gelar (Program & Pelaksanaan)
            </h2>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* Kategori Program */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kategori Program <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.kategoriProgram || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const matchedKat = kategoriList.find(k => k.namaKategori === val);
                  setFormData({
                    ...formData,
                    kategoriProgram: val,
                    idKategori: matchedKat ? matchedKat.idKategori : '',
                    namaProgram: '' // reset program selection
                  });
                }}
                className={`w-full p-2.5 rounded-lg border ${errors.kategoriProgram ? 'border-rose-500' : 'border-slate-200'} bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium`}
              >
                <option value="">-- Pilih Kategori --</option>
                {kategoriList.map(k => (
                  <option key={k.idKategori} value={k.namaKategori}>{k.namaKategori}</option>
                ))}
              </select>
            </div>

            {/* Nama Program */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nama Program <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                list="program-datalist"
                required
                placeholder="Pilih atau ketik program..."
                value={formData.namaProgram || ''}
                onChange={(e) => handleProgramSelection(e.target.value)}
                className={`w-full p-2.5 rounded-lg border ${errors.namaProgram ? 'border-rose-500' : 'border-slate-200'} bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium`}
              />
              <datalist id="program-datalist">
                {availablePrograms.map(p => (
                  <option key={p.idProgram} value={p.namaProgram} />
                ))}
              </datalist>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Memilih program terdaftar akan otomatis menghubungkan koordinator/PIC yang ditugaskan.
              </span>
            </div>

            {/* Angkatan / Batch */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Angkatan / Batch</label>
              <input
                type="text"
                placeholder="Contoh: Batch 1 - 2026"
                value={formData.angkatanBatch || ''}
                onChange={(e) => setFormData({ ...formData, angkatanBatch: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              />
            </div>

            {/* Tahun Pelaksanaan */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tahun <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={2020}
                max={2030}
                required
                value={formData.tahun || 2026}
                onChange={(e) => setFormData({ ...formData, tahun: Number(e.target.value) })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              />
            </div>

            {/* Tanggal Mulai */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Mulai</label>
              <input
                type="date"
                value={formData.tanggalMulai || ''}
                onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              />
            </div>

            {/* Tanggal Selesai */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Selesai</label>
              <input
                type="date"
                value={formData.tanggalSelesai || ''}
                onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              />
            </div>

            {/* Status Peserta */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status Peserta</label>
              <select
                value={formData.statusPeserta || 'Terdaftar'}
                onChange={(e) => setFormData({ ...formData, statusPeserta: e.target.value as StatusPeserta })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              >
                <option value="Terdaftar">Terdaftar</option>
                <option value="Aktif">Aktif</option>
                <option value="Selesai">Selesai</option>
                <option value="Lulus">Lulus</option>
                <option value="Tidak Lulus">Tidak Lulus</option>
                <option value="Mengundurkan Diri">Mengundurkan Diri</option>
              </select>
            </div>

            {/* Status Kelulusan */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status Kelulusan</label>
              <select
                value={formData.statusKelulusan || 'Belum Evaluasi'}
                onChange={(e) => setFormData({ ...formData, statusKelulusan: e.target.value as StatusKelulusan })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              >
                <option value="Belum Evaluasi">Belum Evaluasi</option>
                <option value="Dalam Proses">Dalam Proses</option>
                <option value="Lulus">Lulus</option>
                <option value="Tidak Lulus">Tidak Lulus</option>
                <option value="Mengundurkan Diri">Mengundurkan Diri</option>
              </select>
            </div>
          </div>
        </div>

        {/* BAGIAN E: SERTIFIKAT */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#002B66]" />
            <h2 className="text-xs font-bold text-[#002B66] uppercase tracking-wider">
              E. Sertifikat & Penilaian
            </h2>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor Sertifikat</label>
              <input
                type="text"
                placeholder="Contoh: UNPAD/DPNG/PKT/2026/001"
                value={formData.nomorSertifikat || ''}
                onChange={(e) => setFormData({ ...formData, nomorSertifikat: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Terbit Sertifikat</label>
              <input
                type="date"
                value={formData.tanggalSertifikat || ''}
                onChange={(e) => setFormData({ ...formData, tanggalSertifikat: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nilai / Skor Akhir</label>
              <input
                type="text"
                placeholder="Contoh: 88.50 / Kompeten (A)"
                value={formData.nilaiSkor || ''}
                onChange={(e) => setFormData({ ...formData, nilaiSkor: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* BAGIAN F & G: KEUANGAN & ADMINISTRASI */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#002B66]" />
            <h2 className="text-xs font-bold text-[#002B66] uppercase tracking-wider">
              F & G. Keuangan & Administrasi
            </h2>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Biaya Program (Rp)</label>
              <input
                type="number"
                min={0}
                step={50000}
                placeholder="0"
                value={formData.biayaProgram || 0}
                onChange={(e) => setFormData({ ...formData, biayaProgram: Number(e.target.value) })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Sumber Dana</label>
              <select
                value={formData.sumberDana || 'Mandiri / Pribadi'}
                onChange={(e) => setFormData({ ...formData, sumberDana: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              >
                {DEFAULT_MASTER_DATA.sumberDana.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* PIC / Koordinator Program Relasional */}
            <div className="md:col-span-2 space-y-2 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="block font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#002B66]" />
                  <span>PIC / Koordinator Program</span>
                </label>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setManualPicMode(!manualPicMode)}
                    className="text-[#002B66] hover:underline font-semibold cursor-pointer"
                  >
                    {manualPicMode ? 'Pilih dari Master PIC' : 'Ketik Manual'}
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setIsQuickPicModalOpen(true)}
                    className="inline-flex items-center gap-1 font-bold text-[#002B66] hover:text-[#083a7e] bg-blue-100/60 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-[#002B66]" />
                    <span>Input PIC Baru</span>
                  </button>
                </div>
              </div>

              {manualPicMode ? (
                <div>
                  <input
                    type="text"
                    placeholder="Ketik nama penanggung jawab / koordinator..."
                    value={formData.pic || ''}
                    onChange={(e) => setFormData({ ...formData, pic: e.target.value, idPic: undefined })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Mode ketik manual aktif. Klik "Pilih dari Master PIC" untuk memilih dari daftar koordinator resmi.
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    id="select-pic-peserta"
                    value={formData.idPic || (currentSelectedPic ? currentSelectedPic.idPic : '')}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (!selectedId) {
                        setFormData({ ...formData, idPic: undefined, pic: '' });
                      } else {
                        const found = picList.find(p => p.idPic === selectedId);
                        if (found) {
                          const full = [found.gelarDepan, found.namaLengkap, found.gelarBelakang].filter(Boolean).join(' ');
                          setFormData({ ...formData, idPic: found.idPic, pic: full });
                        }
                      }
                    }}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-semibold text-slate-800 text-xs cursor-pointer"
                  >
                    <option value="">-- Pilih PIC / Koordinator Resmi Terdaftar ({picList.length}) --</option>
                    {picList.map(pic => {
                      const full = [pic.gelarDepan, pic.namaLengkap, pic.gelarBelakang].filter(Boolean).join(' ');
                      const isAssignedToThisProg = formData.namaProgram && pic.namaProgramUtama && 
                        pic.namaProgramUtama.toLowerCase() === formData.namaProgram.toLowerCase();
                      return (
                        <option key={pic.idPic} value={pic.idPic}>
                          {isAssignedToThisProg ? '★ [Sesuai Program] ' : ''}{full} — {pic.jabatan || 'Koordinator'} ({pic.unitFakultas})
                        </option>
                      );
                    })}
                  </select>

                  {/* Selected PIC Profile Card Preview */}
                  {currentSelectedPic && (
                    <div className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-in fade-in">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-[#002B66] text-white flex items-center justify-center font-bold text-xs shrink-0 border border-[#FDB913]/30">
                          {currentSelectedPic.namaLengkap.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 truncate">
                            {[currentSelectedPic.gelarDepan, currentSelectedPic.namaLengkap, currentSelectedPic.gelarBelakang].filter(Boolean).join(' ')}
                          </div>
                          <div className="text-[10px] text-[#002B66] font-semibold flex items-center gap-1.5 truncate">
                            <span>{currentSelectedPic.jabatan}</span>
                            <span>•</span>
                            <span className="text-slate-500 truncate">{currentSelectedPic.unitFakultas}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center text-[11px]">
                        {currentSelectedPic.email && (
                          <a 
                            href={`mailto:${currentSelectedPic.email}`} 
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded text-slate-700 border border-slate-200"
                            title={currentSelectedPic.email}
                          >
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="hidden md:inline">{currentSelectedPic.email}</span>
                          </a>
                        )}
                        {currentSelectedPic.nomorHp && (
                          <a 
                            href={`https://wa.me/${currentSelectedPic.nomorHp.replace(/[^0-9]/g, '').replace(/^0/, '62')}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 rounded text-emerald-800 border border-emerald-200 font-medium"
                            title="WhatsApp Koordinator"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-600" />
                            <span>{currentSelectedPic.nomorHp}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Keterangan Tambahan</label>
              <input
                type="text"
                placeholder="Catatan khusus berkas/asesmen/kelengkapan pendaftaran..."
                value={formData.keterangan || ''}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#002B66] outline-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* Quick Add PIC Modal */}
        {isQuickPicModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
              <div className="p-4 bg-[#002B66] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#FDB913]" />
                  <h3 className="font-bold text-sm">Input PIC / Koordinator Baru</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuickPicModalOpen(false)}
                  className="text-white/70 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Lengkap (tanpa gelar) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hendra Wijaya"
                    value={newPicNama}
                    onChange={(e) => setNewPicNama(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B66] font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Gelar Depan</label>
                    <input
                      type="text"
                      placeholder="Dr. / Prof."
                      value={newPicGelarDepan}
                      onChange={(e) => setNewPicGelarDepan(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B66]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Gelar Belakang</label>
                    <input
                      type="text"
                      placeholder="M.Pd. / Ph.D."
                      value={newPicGelarBelakang}
                      onChange={(e) => setNewPicGelarBelakang(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B66]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Resmi</label>
                    <input
                      type="email"
                      placeholder="nama@unpad.ac.id"
                      value={newPicEmail}
                      onChange={(e) => setNewPicEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B66]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                    <input
                      type="text"
                      placeholder="0812xxxxxxx"
                      value={newPicHp}
                      onChange={(e) => setNewPicHp(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#002B66]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Kerja / Fakultas</label>
                  <input
                    type="text"
                    placeholder="Contoh: Direktorat Pendidikan Non Gelar"
                    value={newPicUnit}
                    onChange={(e) => setNewPicUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B66]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsQuickPicModalOpen(false)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickAddPicSubmit}
                    disabled={!newPicNama.trim()}
                    className="px-4 py-2 bg-[#002B66] hover:bg-[#083a7e] disabled:opacity-50 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                  >
                    Simpan & Pilih PIC
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit & Cancel Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            id="btn-submit-peserta"
            className="flex items-center gap-2 px-6 py-2.5 bg-[#002B66] hover:bg-[#083a7e] text-white font-bold rounded-lg text-xs shadow-md transition-colors"
          >
            <Save className="w-4 h-4 text-[#FDB913]" />
            <span>{isEdit ? 'Simpan Perubahan' : 'Simpan Data ke Google Sheets'}</span>
          </button>
        </div>
      </form>

      {/* Duplicate Warning Modal with Admin Override Option */}
      {dupModalInfo.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="p-2.5 rounded-full bg-amber-100">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Duplikasi Data Terdeteksi</h3>
                <p className="text-xs text-slate-500">Peringatan Integritas Data Google Sheets</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Data peserta dengan identitas tersebut sudah terdaftar pada sistem:
            </p>

            <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 text-xs space-y-1 mb-5">
              <div>
                <span className="font-semibold text-slate-600">Bidang Duplikat:</span>{' '}
                <span className="font-bold text-amber-700">{dupModalInfo.field}</span> ({dupModalInfo.value})
              </div>
              {dupModalInfo.existing && (
                <div>
                  <span className="font-semibold text-slate-600">Peserta Terdaftar:</span>{' '}
                  <strong className="text-slate-900">{dupModalInfo.existing.namaLengkap}</strong>{' '}
                  ({dupModalInfo.existing.id} - {dupModalInfo.existing.namaProgram})
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDupModalInfo({ isOpen: false })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
              >
                Batalkan & Koreksi
              </button>

              {dupModalInfo.existing && onViewExisting && (
                <button
                  type="button"
                  onClick={() => {
                    setDupModalInfo({ isOpen: false });
                    onViewExisting(dupModalInfo.existing!);
                  }}
                  className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg border border-blue-200"
                >
                  Lihat Data Existing
                </button>
              )}

              {userRole === 'ADMIN' && (
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Tetap Simpan (Override Admin)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
