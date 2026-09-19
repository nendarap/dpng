import React, { useState, useMemo } from 'react';
import { 
  UserCheck, Plus, Search, Filter, Phone, Mail, 
  ExternalLink, Building2, Briefcase, GraduationCap, 
  Edit2, Trash2, CheckCircle2, XCircle, AlertTriangle, 
  Users, MessageSquare, ShieldCheck, X
} from 'lucide-react';
import { PicProgram, Program, Kategori, Peserta, UserRole } from '../types';

interface PicKoordinatorViewProps {
  picList: PicProgram[];
  programList: Program[];
  kategoriList: Kategori[];
  pesertaList: Peserta[];
  userRole: UserRole;
  onSavePic: (pic: PicProgram) => void;
  onDeletePic: (idPic: string) => void;
  onNavigateToPeserta?: (picName: string) => void;
}

const FAKULTAS_UNPAD_LIST = [
  'Direktorat Pendidikan Non Gelar',
  'Fakultas Kedokteran (FK)',
  'Fakultas Kedokteran Gigi (FKG)',
  'Fakultas Farmasi (FF)',
  'Fakultas Keperawatan (FKEP)',
  'Fakultas Matematika dan Ilmu Pengetahuan Alam (FMIPA)',
  'Fakultas Teknik Geologi (FTG)',
  'Fakultas Teknologi Industri Pertanian (FTIP)',
  'Fakultas Pertanian (FAPERTA)',
  'Fakultas Peternakan (FAPET)',
  'Fakultas Perikanan dan Ilmu Kelautan (FPIK)',
  'Fakultas Hukum (FH)',
  'Fakultas Ekonomi dan Bisnis (FEB)',
  'Fakultas Ilmu Sosial dan Ilmu Politik (FISIP)',
  'Fakultas Ilmu Budaya (FIB)',
  'Fakultas Psikologi (FPsi)',
  'Fakultas Ilmu Komunikasi (FIKOM)',
  'Sekolah Pascasarjana (SPS)',
  'Lembaga Sertifikasi Profesi (LSP Unpad)',
  'LPK Skill Hub & Migrant Center',
  'Pusat Studi / Unit Lainnya'
];

const JABATAN_OPTIONS = [
  'Koordinator Program',
  'Wakil Koordinator Program',
  'Sekretaris Program & Kerjasama',
  'Penanggung Jawab Teknis & IT',
  'Koordinator Sertifikasi LSP',
  'PIC Administrasi & Asesmen',
  'Fasilitator / Instruktur Utama',
  'Pengelola Kelas'
];

export const PicKoordinatorView: React.FC<PicKoordinatorViewProps> = ({
  picList,
  programList,
  kategoriList,
  pesertaList,
  userRole,
  onSavePic,
  onDeletePic,
  onNavigateToPeserta,
}) => {
  const [searchKw, setSearchKw] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'Aktif' | 'Non-Aktif'>('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PicProgram | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PicProgram | null>(null);

  // Form State
  const [namaLengkap, setNamaLengkap] = useState('');
  const [gelarDepan, setGelarDepan] = useState('');
  const [gelarBelakang, setGelarBelakang] = useState('');
  const [nip, setNip] = useState('');
  const [email, setEmail] = useState('');
  const [nomorHp, setNomorHp] = useState('');
  const [jabatan, setJabatan] = useState('Koordinator Program');
  const [unitFakultas, setUnitFakultas] = useState(FAKULTAS_UNPAD_LIST[0]);
  const [idProgramUtama, setIdProgramUtama] = useState('');
  const [statusAktif, setStatusAktif] = useState<'Ya' | 'Tidak'>('Ya');
  const [keterangan, setKeterangan] = useState('');

  // Count assigned participants for a PIC
  const getParticipantCount = (pic: PicProgram) => {
    return pesertaList.filter(p => {
      if (p.idPic && p.idPic === pic.idPic) return true;
      if (!p.idPic && p.pic && pic.namaLengkap) {
        return p.pic.toLowerCase().includes(pic.namaLengkap.toLowerCase()) ||
               pic.namaLengkap.toLowerCase().includes(p.pic.toLowerCase());
      }
      return false;
    }).length;
  };

  // Metrics
  const totalPic = picList.length;
  const activePic = picList.filter(p => p.statusAktif === true || p.statusAktif === 'Ya').length;
  const uniqueUnits = useMemo(() => {
    const units = new Set(picList.map(p => p.unitFakultas).filter(Boolean));
    return units.size;
  }, [picList]);
  const totalPesertaCoordinated = useMemo(() => {
    const picNames = picList.map(p => p.namaLengkap.toLowerCase());
    return pesertaList.filter(p => p.idPic || (p.pic && picNames.some(n => p.pic.toLowerCase().includes(n)))).length;
  }, [picList, pesertaList]);

  // Filtered PIC
  const filteredPicList = useMemo(() => {
    return picList.filter(p => {
      if (selectedUnit !== 'ALL' && p.unitFakultas !== selectedUnit) return false;
      if (selectedStatus !== 'ALL') {
        const isActive = p.statusAktif === true || p.statusAktif === 'Ya';
        if (selectedStatus === 'Aktif' && !isActive) return false;
        if (selectedStatus === 'Non-Aktif' && isActive) return false;
      }
      if (searchKw.trim()) {
        const q = searchKw.toLowerCase();
        const fullDisplay = [p.gelarDepan, p.namaLengkap, p.gelarBelakang].filter(Boolean).join(' ').toLowerCase();
        const match = fullDisplay.includes(q) ||
          (p.nip && p.nip.toLowerCase().includes(q)) ||
          (p.email && p.email.toLowerCase().includes(q)) ||
          (p.nomorHp && p.nomorHp.includes(q)) ||
          (p.jabatan && p.jabatan.toLowerCase().includes(q)) ||
          (p.unitFakultas && p.unitFakultas.toLowerCase().includes(q)) ||
          (p.namaProgramUtama && p.namaProgramUtama.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [picList, selectedUnit, selectedStatus, searchKw]);

  const handleOpenAdd = () => {
    setEditItem(null);
    setNamaLengkap('');
    setGelarDepan('');
    setGelarBelakang('');
    setNip('');
    setEmail('');
    setNomorHp('');
    setJabatan('Koordinator Program');
    setUnitFakultas(FAKULTAS_UNPAD_LIST[0]);
    setIdProgramUtama(programList[0]?.idProgram || '');
    setStatusAktif('Ya');
    setKeterangan('');
    setModalOpen(true);
  };

  const handleOpenEdit = (p: PicProgram) => {
    setEditItem(p);
    setNamaLengkap(p.namaLengkap);
    setGelarDepan(p.gelarDepan || '');
    setGelarBelakang(p.gelarBelakang || '');
    setNip(p.nip || '');
    setEmail(p.email);
    setNomorHp(p.nomorHp);
    setJabatan(p.jabatan || 'Koordinator Program');
    setUnitFakultas(p.unitFakultas || FAKULTAS_UNPAD_LIST[0]);
    setIdProgramUtama(p.idProgramUtama || '');
    setStatusAktif(p.statusAktif === true || p.statusAktif === 'Ya' ? 'Ya' : 'Tidak');
    setKeterangan(p.keterangan || '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLengkap.trim()) return;

    const matchedProgram = programList.find(prg => prg.idProgram === idProgramUtama);

    const payload: PicProgram = {
      idPic: editItem ? editItem.idPic : '',
      namaLengkap: namaLengkap.trim(),
      gelarDepan: gelarDepan.trim() || undefined,
      gelarBelakang: gelarBelakang.trim() || undefined,
      nip: nip.trim() || undefined,
      email: email.trim(),
      nomorHp: nomorHp.trim(),
      jabatan,
      unitFakultas,
      idProgramUtama: idProgramUtama || undefined,
      namaProgramUtama: matchedProgram ? matchedProgram.namaProgram : undefined,
      idKategoriUtama: matchedProgram ? matchedProgram.idKategori : undefined,
      statusAktif,
      keterangan: keterangan.trim() || undefined,
    };

    onSavePic(payload);
    setModalOpen(false);
  };

  const formatCleanPhone = (phone: string) => {
    return phone.replace(/[^0-9]/g, '');
  };

  const getWaLink = (phone: string) => {
    let clean = formatCleanPhone(phone);
    if (clean.startsWith('0')) {
      clean = '62' + clean.substring(1);
    }
    return `https://wa.me/${clean}`;
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header View */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[#002B66]/10 text-[#002B66] border border-[#002B66]/20">
              Master Data Operasional
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Relasi Input Peserta Baru</span>
          </div>
          <h1 className="text-xl font-black text-[#002B66] mt-1 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#FDB913]" />
            PIC & Koordinator Program
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Kelola data koordinator kursus, penanggung jawab akademik, dan pengelola program non-gelar Unpad yang otomatis terintegrasi ke form input peserta baru.
          </p>
        </div>

        {userRole !== 'VIEWER' && (
          <button
            id="btn-tambah-pic"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#002B66] hover:bg-[#083a7e] text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-[#FDB913]" />
            <span>Tambah PIC / Koordinator</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#002B66] flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5 text-[#002B66]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total PIC</div>
            <div className="text-xl font-black text-slate-800 mt-0.5">{totalPic}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Koordinator Aktif</div>
            <div className="text-xl font-black text-emerald-600 mt-0.5">{activePic}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Unit / Fakultas</div>
            <div className="text-xl font-black text-amber-600 mt-0.5">{uniqueUnits}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Peserta Terbina</div>
            <div className="text-xl font-black text-purple-700 mt-0.5">{totalPesertaCoordinated}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="search-input-pic"
            type="text"
            placeholder="Cari nama, NIP, email, program, atau unit/fakultas..."
            value={searchKw}
            onChange={(e) => setSearchKw(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#002B66]"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              id="filter-unit-pic"
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full sm:w-56 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">Semua Unit / Fakultas</option>
              {FAKULTAS_UNPAD_LIST.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <select
            id="filter-status-pic"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as 'ALL' | 'Aktif' | 'Non-Aktif')}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none shrink-0"
          >
            <option value="ALL">Semua Status</option>
            <option value="Aktif">Aktif Saja</option>
            <option value="Non-Aktif">Non-Aktif Saja</option>
          </select>
        </div>
      </div>

      {/* PIC Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPicList.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
            <UserCheck className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
            <div className="font-semibold text-sm text-slate-600">Tidak ada PIC / Koordinator yang ditemukan</div>
            <p className="text-xs text-slate-400">Silakan sesuaikan kata kunci pencarian atau filter unit fakultas.</p>
          </div>
        ) : (
          filteredPicList.map((pic) => {
            const count = getParticipantCount(pic);
            const isActive = pic.statusAktif === true || pic.statusAktif === 'Ya';
            const fullNameWithTitle = [pic.gelarDepan, pic.namaLengkap, pic.gelarBelakang].filter(Boolean).join(' ');
            
            // Get initials for avatar
            const initials = pic.namaLengkap
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map(n => n[0])
              .join('')
              .toUpperCase();

            return (
              <div 
                key={pic.idPic}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  {/* Top card bar: ID and Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#002B66] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {pic.idPic}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {isActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Aktif</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>Non-Aktif</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Profile section */}
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#002B66] to-[#0d47a1] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0 border border-[#FDB913]/30">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 leading-snug truncate" title={fullNameWithTitle}>
                        {fullNameWithTitle}
                      </h3>
                      <div className="text-[11px] font-semibold text-[#002B66] flex items-center gap-1 mt-0.5 truncate">
                        <Briefcase className="w-3 h-3 text-[#FDB913] shrink-0" />
                        <span>{pic.jabatan || 'Koordinator Program'}</span>
                      </div>
                      {pic.nip && (
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          NIP: {pic.nip}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Unit & Program Info */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-start gap-1.5 text-slate-600">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span className="text-[11px] font-medium leading-tight">{pic.unitFakultas}</span>
                    </div>

                    {pic.namaProgramUtama && (
                      <div className="flex items-start gap-1.5 text-slate-700">
                        <GraduationCap className="w-3.5 h-3.5 text-[#002B66] mt-0.5 shrink-0" />
                        <span className="text-[11px] font-semibold text-slate-800 leading-tight">
                          {pic.namaProgramUtama}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Contact Badges */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-[11px]">
                    {pic.email && (
                      <a 
                        href={`mailto:${pic.email}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#002B66] rounded-lg border border-slate-200 transition-colors font-medium truncate max-w-full"
                        title={pic.email}
                      >
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{pic.email}</span>
                      </a>
                    )}

                    {pic.nomorHp && (
                      <a 
                        href={getWaLink(pic.nomorHp)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 transition-colors font-medium"
                        title="Hubungi via WhatsApp"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{pic.nomorHp}</span>
                      </a>
                    )}
                  </div>

                  {pic.keterangan && (
                    <p className="text-[11px] text-slate-500 italic line-clamp-2 bg-slate-50 p-2 rounded border border-slate-100">
                      "{pic.keterangan}"
                    </p>
                  )}
                </div>

                {/* Card Footer */}
                <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-500">Binaan:</span>
                    <button
                      onClick={() => onNavigateToPeserta && onNavigateToPeserta(pic.namaLengkap)}
                      className="inline-flex items-center gap-1 font-bold text-[#002B66] bg-white px-2 py-0.5 rounded border border-slate-200 hover:border-[#002B66] transition-colors cursor-pointer"
                      title="Klik untuk melihat peserta dengan PIC ini"
                    >
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>{count} Peserta</span>
                    </button>
                  </div>

                  {userRole !== 'VIEWER' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(pic)}
                        className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit PIC"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(pic)}
                        className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        title="Hapus PIC"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add / Edit PIC */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 bg-[#002B66] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#FDB913]">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {editItem ? 'Edit Data PIC / Koordinator' : 'Tambah PIC / Koordinator Program Baru'}
                  </h3>
                  <p className="text-[11px] text-white/70">
                    Master data koordinator yang terelasi ke formulir pendaftaran peserta
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Section 1: Identitas Personal */}
              <div className="space-y-3 pb-3 border-b border-slate-100">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#002B66]" />
                  <span>Identitas Koordinator</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Gelar Depan</label>
                    <input
                      type="text"
                      placeholder="Dr. / Prof."
                      value={gelarDepan}
                      onChange={(e) => setGelarDepan(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B66]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nama Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama tanpa gelar (misal: Hendra Wijaya)"
                      value={namaLengkap}
                      onChange={(e) => setNamaLengkap(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B66] font-semibold text-slate-800"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Gelar Belakang</label>
                    <input
                      type="text"
                      placeholder="M.Pd. / Ph.D."
                      value={gelarBelakang}
                      onChange={(e) => setGelarBelakang(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B66]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">NIP / NIDN / NUPTK</label>
                  <input
                    type="text"
                    placeholder="Contoh: 197503142000031001"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#002B66]"
                  />
                </div>
              </div>

              {/* Section 2: Penugasan & Program */}
              <div className="space-y-3 pb-3 border-b border-slate-100">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#002B66]" />
                  <span>Jabatan & Penugasan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Jabatan / Peran <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={jabatan}
                      onChange={(e) => setJabatan(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
                    >
                      {JABATAN_OPTIONS.map(j => (
                        <option key={j} value={j}>{j}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Unit Kerja / Fakultas <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={unitFakultas}
                      onChange={(e) => setUnitFakultas(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
                    >
                      {FAKULTAS_UNPAD_LIST.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Program Utama yang Dikoordinasikan
                  </label>
                  <select
                    value={idProgramUtama}
                    onChange={(e) => setIdProgramUtama(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
                  >
                    <option value="">-- Tidak Terikat Program Spesifik (Lintas Program) --</option>
                    {programList.map(prg => (
                      <option key={prg.idProgram} value={prg.idProgram}>
                        {prg.namaProgram}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Saat program ini dipilih pada form Peserta Baru, PIC ini akan otomatis terpilih secara cerdas.
                  </span>
                </div>
              </div>

              {/* Section 3: Kontak & Komunikasi */}
              <div className="space-y-3 pb-3 border-b border-slate-100">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#002B66]" />
                  <span>Kontak Resmi</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Email Resmi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="nama@unpad.ac.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B66]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nomor WhatsApp / HP <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 081221345678"
                      value={nomorHp}
                      onChange={(e) => setNomorHp(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#002B66]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Status Aktif Penugasan
                  </label>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="statusAktif"
                        checked={statusAktif === 'Ya'}
                        onChange={() => setStatusAktif('Ya')}
                        className="text-[#002B66] focus:ring-[#002B66]"
                      />
                      <span className="font-semibold text-emerald-700">Aktif (Dapat dipilih di form pendaftaran)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="statusAktif"
                        checked={statusAktif === 'Tidak'}
                        onChange={() => setStatusAktif('Tidak')}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span className="font-medium text-slate-500">Non-Aktif</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Keterangan / Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Informasi tambahan penugasan atau keahlian koordinator..."
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#002B66]"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#002B66] hover:bg-[#083a7e] text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  {editItem ? 'Simpan Perubahan' : 'Tambahkan PIC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-slate-900 text-base">Hapus PIC / Koordinator?</h3>
              <p className="text-xs text-slate-500">
                Anda akan menghapus data PIC <strong>{deleteTarget.namaLengkap}</strong> ({deleteTarget.idPic}).
              </p>
            </div>

            {(() => {
              const assignedCount = getParticipantCount(deleteTarget);
              if (assignedCount > 0) {
                return (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Perhatian:</strong> PIC ini masih terikat dengan{' '}
                      <span className="font-black underline">{assignedCount} peserta</span>. Sistem akan mencegah penghapusan untuk menjaga konsistensi data riwayat peserta.
                    </div>
                  </div>
                );
              }
              return (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  PIC ini tidak memiliki peserta aktif yang terikat dan aman untuk dihapus.
                </div>
              );
            })()}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeletePic(deleteTarget.idPic);
                  setDeleteTarget(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
              >
                Ya, Hapus PIC
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
