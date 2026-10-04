import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, MapPin, GraduationCap, Users, Share2, 
  Sparkles, ExternalLink, Globe, ArrowRight, ShieldCheck,
  Eye, Check, Copy, X, Search, Building2, Calendar, Award,
  ArrowLeft, Info, Filter, Lock
} from 'lucide-react';
import { Peserta, Kategori, Program } from '../types';
import { UnpadLogo } from './UnpadLogo';
import { DashboardView } from './DashboardView';
import { MapDashboardView } from './MapDashboardView';
import { PublicRegistrationView } from './PublicRegistrationView';
import { ShareRegistrationLinkModal } from './ShareRegistrationLinkModal';

interface PublicPortalViewProps {
  kategoriList: Kategori[];
  programList: Program[];
  allPesertaList: Peserta[];
  initialTab?: 'dashboard' | 'peta' | 'daftar';
  onBackToLogin: () => void;
  onRefreshData?: () => void;
  isLoggedIn?: boolean;
}

// PDP Compliant Name Masking for Public View
const maskPublicName = (name: string): string => {
  if (!name) return '-';
  const parts = name.trim().split(/\s+/);
  return parts.map((part, index) => {
    // Keep standard titles
    const lower = part.toLowerCase();
    if (['dr.', 'prof.', 'ns.', 'ir.', 'apt.', 'dr', 'prof', 'h.', 'hj.'].includes(lower)) {
      return part;
    }
    if (part.length <= 2) return part;
    if (index === 0) {
      // First name: show first 3 chars
      return part.slice(0, 3) + '*'.repeat(Math.max(2, part.length - 3));
    }
    // Subsequent names: show first char + asterisks
    return part[0] + '*'.repeat(Math.max(2, part.length - 1));
  }).join(' ');
};

export const PublicPortalView: React.FC<PublicPortalViewProps> = ({
  kategoriList,
  programList,
  allPesertaList,
  initialTab = 'dashboard',
  onBackToLogin,
  onRefreshData,
  isLoggedIn = false,
}) => {
  // Determine initial tab from props or URL
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'peta' | 'daftar'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode') || params.get('view');
      if (mode === 'peta' || mode === 'map' || window.location.hash === '#peta' || window.location.hash === '#map') {
        return 'peta';
      }
      if (mode === 'daftar' || params.get('register') === 'true' || window.location.hash === '#daftar') {
        return 'daftar';
      }
      if (mode === 'dashboard' || mode === 'publik' || window.location.hash === '#dashboard' || window.location.hash === '#publik') {
        return 'dashboard';
      }
    } catch {
      // ignore
    }
    return initialTab;
  });

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copyLinkToast, setCopyLinkToast] = useState(false);

  // View-Only Public Filter Modal
  const [selectedPublicFilter, setSelectedPublicFilter] = useState<Partial<Peserta> | null>(null);
  const [filterSearchTerm, setFilterSearchTerm] = useState('');
  const [filterModalPage, setFilterModalPage] = useState(1);
  const itemsPerPage = 10;

  // Sync tab change to URL
  const handleTabChange = (tab: 'dashboard' | 'peta' | 'daftar') => {
    setCurrentTab(tab);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('mode', tab);
      window.history.pushState({}, '', url.toString());
    } catch {
      // ignore
    }
  };

  // Copy current public link
  const handleQuickCopyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', currentTab);
    navigator.clipboard.writeText(url.toString());
    setCopyLinkToast(true);
    setTimeout(() => setCopyLinkToast(false), 3000);
  };

  // Listen to popstate URL changes
  useEffect(() => {
    const handleUrlChange = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get('mode') || params.get('view');
        if (mode === 'peta' || mode === 'map' || window.location.hash === '#peta' || window.location.hash === '#map') {
          setCurrentTab('peta');
        } else if (mode === 'daftar' || params.get('register') === 'true' || window.location.hash === '#daftar') {
          setCurrentTab('daftar');
        } else if (mode === 'dashboard' || mode === 'publik' || window.location.hash === '#dashboard' || window.location.hash === '#publik') {
          setCurrentTab('dashboard');
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Filtered participants for Public Preview Modal
  const filteredModalPeserta = useMemo(() => {
    if (!selectedPublicFilter) return [];
    return allPesertaList.filter(p => {
      // Apply the passed filter criteria
      if (selectedPublicFilter.statusPeserta && p.statusPeserta !== selectedPublicFilter.statusPeserta) return false;
      if (selectedPublicFilter.statusKelulusan && p.statusKelulusan !== selectedPublicFilter.statusKelulusan) return false;
      if (selectedPublicFilter.instansi && p.instansi?.toLowerCase() !== selectedPublicFilter.instansi.toLowerCase()) return false;
      if (selectedPublicFilter.kategoriProgram && p.kategoriProgram !== selectedPublicFilter.kategoriProgram) return false;
      if (selectedPublicFilter.namaProgram && p.namaProgram !== selectedPublicFilter.namaProgram) return false;
      if (selectedPublicFilter.tahun && p.tahun !== selectedPublicFilter.tahun) return false;

      // Search term filter within modal
      if (filterSearchTerm.trim()) {
        const q = filterSearchTerm.toLowerCase();
        const matchInstansi = p.instansi?.toLowerCase().includes(q);
        const matchProgram = p.namaProgram?.toLowerCase().includes(q);
        const matchKategori = p.kategoriProgram?.toLowerCase().includes(q);
        const matchKota = p.kotaKabupaten?.toLowerCase().includes(q);
        const matchProvinsi = p.provinsi?.toLowerCase().includes(q);
        if (!matchInstansi && !matchProgram && !matchKategori && !matchKota && !matchProvinsi) {
          return false;
        }
      }

      return true;
    });
  }, [allPesertaList, selectedPublicFilter, filterSearchTerm]);

  // Pagination for Public Modal
  const totalModalPages = Math.max(1, Math.ceil(filteredModalPeserta.length / itemsPerPage));
  const currentModalItems = useMemo(() => {
    const start = (filterModalPage - 1) * itemsPerPage;
    return filteredModalPeserta.slice(start, start + itemsPerPage);
  }, [filteredModalPeserta, filterModalPage]);

  // Human-readable filter title
  const filterTitle = useMemo(() => {
    if (!selectedPublicFilter) return 'Daftar Peserta';
    if (selectedPublicFilter.instansi) return `Instansi: ${selectedPublicFilter.instansi}`;
    if (selectedPublicFilter.statusPeserta) return `Status Peserta: ${selectedPublicFilter.statusPeserta}`;
    if (selectedPublicFilter.statusKelulusan) return `Status Kelulusan: ${selectedPublicFilter.statusKelulusan}`;
    if (selectedPublicFilter.namaProgram) return `Program: ${selectedPublicFilter.namaProgram}`;
    if (selectedPublicFilter.kategoriProgram) return `Kategori: ${selectedPublicFilter.kategoriProgram}`;
    return 'Daftar Peserta Terfilter';
  }, [selectedPublicFilter]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans antialiased selection:bg-[#002B66] selection:text-white">
      {/* Top Public Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#002B66] text-white border-b border-[#001D45] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 gap-3">
            {/* Logo & Portal Identity */}
            <div className="flex items-center gap-3 shrink-0">
              <UnpadLogo variant="light" size="sm" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base tracking-wide text-white">
                    PORTAL PUBLIK NON-GELAR
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FDB913] text-[#002B66] flex items-center gap-1 shadow-2xs">
                    <Eye className="w-3 h-3 text-[#002B66]" />
                    <span>View Only</span>
                  </span>
                </div>
                <p className="text-[11px] text-amber-200/90 font-medium hidden md:block">
                  Universitas Padjadjaran • Direktorat Pendidikan Non Gelar
                </p>
              </div>
            </div>

            {/* Central Navigation Tabs */}
            <nav className="flex items-center bg-white/10 p-1 rounded-xl backdrop-blur-md border border-white/15">
              <button
                type="button"
                id="btn-public-tab-dashboard"
                onClick={() => handleTabChange('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentTab === 'dashboard'
                    ? 'bg-[#FDB913] text-[#002B66] shadow-xs'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dashboard Statistik</span>
                <span className="sm:hidden">Dashboard</span>
              </button>

              <button
                type="button"
                id="btn-public-tab-peta"
                onClick={() => handleTabChange('peta')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentTab === 'peta'
                    ? 'bg-[#FDB913] text-[#002B66] shadow-xs'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Peta Sebaran Mitra</span>
                <span className="sm:hidden">Peta Mitra</span>
              </button>

              <button
                type="button"
                id="btn-public-tab-daftar"
                onClick={() => handleTabChange('daftar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentTab === 'daftar'
                    ? 'bg-[#FDB913] text-[#002B66] shadow-xs'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pendaftaran Peserta</span>
                <span className="sm:hidden">Daftar</span>
              </button>
            </nav>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                id="btn-public-quick-share"
                onClick={handleQuickCopyLink}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer border border-white/15"
                title="Salin tautan tampilan publik ini"
              >
                {copyLinkToast ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-300" />
                    <span>Salin Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer border border-white/15"
                title="Bagikan tautan portal publik ini"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Bagikan</span>
              </button>

              <button
                type="button"
                id="btn-public-back-login"
                onClick={onBackToLogin}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white hover:text-amber-300 text-xs font-bold transition-all border border-white/20 cursor-pointer"
                title={isLoggedIn ? 'Kembali ke aplikasi internal SIMPENDIK' : 'Masuk ke sistem internal (Administrator / PIC / Operator)'}
              >
                {isLoggedIn ? (
                  <>
                    <ArrowLeft className="w-3.5 h-3.5 text-[#FDB913]" />
                    <span>Kembali ke Sistem</span>
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5 text-[#FDB913]" />
                    <span>Login Petugas</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Public Announcement Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-[#002B66] to-slate-900 text-white border-b border-blue-800/60 py-2.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold text-amber-300">Transparansi Data Publik:</span>
            <span className="text-slate-200">
              {currentTab === 'dashboard' && 'Dashboard capaian & statistik peserta pendidikan non-gelar Unpad terbuka untuk publik (Mode View Only).'}
              {currentTab === 'peta' && 'Peta spasial persebaran instansi mitra, universitas, rumah sakit, & peserta di seluruh Indonesia.'}
              {currentTab === 'daftar' && 'Pendaftaran peserta program pelatihan, sertifikasi, & kursus non-gelar Universitas Padjadjaran.'}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-white/60 text-[11px] hidden md:inline">
              Data Diperbarui Real-Time • {allPesertaList.length} Peserta Terdata
            </span>
            <button
              onClick={() => handleTabChange(currentTab === 'dashboard' ? 'peta' : 'dashboard')}
              className="text-[#FDB913] hover:underline font-bold text-[11px] cursor-pointer"
            >
              {currentTab === 'dashboard' ? 'Lihat Peta Sebaran →' : 'Lihat Dashboard Statistik →'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'dashboard' && (
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <DashboardView
              pesertaList={allPesertaList}
              kategoriList={kategoriList}
              programList={programList}
              recentLogs={[]}
              isPublicView={true}
              onNavigateToPeserta={(filter) => {
                setSelectedPublicFilter(filter || {});
                setFilterSearchTerm('');
                setFilterModalPage(1);
              }}
              onNavigateToTambah={() => handleTabChange('daftar')}
              onNavigateToMap={() => handleTabChange('peta')}
            />
          </div>
        )}

        {currentTab === 'peta' && (
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <MapDashboardView
              pesertaList={allPesertaList}
              kategoriList={kategoriList}
              programList={programList}
              isEmbedded={true}
              isPublicView={true}
              onNavigateToPeserta={(filter) => {
                setSelectedPublicFilter(filter || {});
                setFilterSearchTerm('');
                setFilterModalPage(1);
              }}
              onNavigateToDashboard={() => handleTabChange('dashboard')}
              onNavigateToDaftar={() => handleTabChange('daftar')}
            />
          </div>
        )}

        {currentTab === 'daftar' && (
          <PublicRegistrationView
            kategoriList={kategoriList}
            programList={programList}
            allPesertaList={allPesertaList}
            onBackToLogin={onBackToLogin}
            onRefreshData={onRefreshData}
            onNavigateToDashboard={() => handleTabChange('dashboard')}
            onNavigateToMap={() => handleTabChange('peta')}
          />
        )}
      </main>

      {/* Public Footer */}
      <footer className="bg-slate-900 text-white/70 py-6 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <UnpadLogo variant="light" size="sm" />
            <div>
              <p className="font-bold text-white">Direktorat Pendidikan Non Gelar — Universitas Padjadjaran</p>
              <p className="text-[11px] text-white/50">Gedung Rektorat Unpad Jatinangor, Sumedang, Jawa Barat 45363</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] flex-wrap justify-center">
            <button
              type="button"
              onClick={() => handleTabChange('dashboard')}
              className={`hover:text-amber-300 transition-colors cursor-pointer ${currentTab === 'dashboard' ? 'text-amber-300 font-bold' : ''}`}
            >
              Dashboard Publik
            </button>
            <span className="text-white/20">•</span>
            <button
              type="button"
              onClick={() => handleTabChange('peta')}
              className={`hover:text-amber-300 transition-colors cursor-pointer ${currentTab === 'peta' ? 'text-amber-300 font-bold' : ''}`}
            >
              Peta Sebaran Mitra
            </button>
            <span className="text-white/20">•</span>
            <button
              type="button"
              onClick={() => handleTabChange('daftar')}
              className={`hover:text-amber-300 transition-colors cursor-pointer ${currentTab === 'daftar' ? 'text-amber-300 font-bold' : ''}`}
            >
              Pendaftaran Peserta
            </button>
            <span className="text-white/20">•</span>
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-[#FDB913] hover:underline font-bold cursor-pointer"
            >
              {isLoggedIn ? 'Kembali ke SIMPENDIK' : 'Login Staf / Admin'}
            </button>
          </div>
        </div>
      </footer>

      {/* Share Modal */}
      <ShareRegistrationLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        programList={programList}
        kategoriList={kategoriList}
      />

      {/* View-Only Public Participant List Modal */}
      {selectedPublicFilter && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#002B66] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-white">
                      {filterTitle}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FDB913] text-[#002B66]">
                      {filteredModalPeserta.length} Peserta
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Data Pribadi Disamarkan (PDP)</span>
                    </span>
                  </div>
                  <p className="text-xs text-blue-100 mt-0.5">
                    Transparansi publik data peserta pendidikan non-gelar Unpad (Mode View Only).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPublicFilter(null)}
                className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={filterSearchTerm}
                  onChange={(e) => {
                    setFilterSearchTerm(e.target.value);
                    setFilterModalPage(1);
                  }}
                  placeholder="Cari program, instansi, kota..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#002B66] focus:ring-1 focus:ring-[#002B66]"
                />
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#002B66]" />
                <span>Untuk pendaftaran program baru, buka tab <strong>Pendaftaran Peserta</strong>.</span>
              </div>
            </div>

            {/* Modal Table Content */}
            <div className="flex-1 overflow-auto p-4">
              {currentModalItems.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Tidak ada peserta yang cocok</p>
                  <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#002B66] text-white">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold text-center w-12">No</th>
                        <th className="py-2.5 px-3 font-semibold">Nama Peserta (Masked)</th>
                        <th className="py-2.5 px-3 font-semibold">Program</th>
                        <th className="py-2.5 px-3 font-semibold">Instansi Asal</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Tahun</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                        <th className="py-2.5 px-3 font-semibold">Wilayah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentModalItems.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                            {(filterModalPage - 1) * itemsPerPage + idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {maskPublicName(p.namaLengkap)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-slate-800 block truncate max-w-[200px]" title={p.namaProgram}>
                              {p.namaProgram}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {p.kategoriProgram}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-medium">
                            <span className="truncate block max-w-[180px]" title={p.instansi || '-'}>
                              {p.instansi || '-'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-600 font-mono">
                            {p.tahun}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.statusPeserta === 'Lulus' 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : p.statusPeserta === 'Aktif'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : p.statusPeserta === 'Selesai'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-slate-100 text-slate-700'
                            }`}>
                              {p.statusPeserta}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                            {p.kotaKabupaten ? `${p.kotaKabupaten}, ${p.provinsi || ''}` : p.provinsi || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Pagination & Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-500">
                Menampilkan {(filterModalPage - 1) * itemsPerPage + 1} - {Math.min(filterModalPage * itemsPerPage, filteredModalPeserta.length)} dari {filteredModalPeserta.length} peserta
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={filterModalPage <= 1}
                  onClick={() => setFilterModalPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
                >
                  Sebelumnya
                </button>
                <span className="font-bold text-slate-700 px-1">
                  Hal {filterModalPage} / {totalModalPages}
                </span>
                <button
                  type="button"
                  disabled={filterModalPage >= totalModalPages}
                  onClick={() => setFilterModalPage(p => Math.min(totalModalPages, p + 1))}
                  className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
                >
                  Selanjutnya
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPublicFilter(null)}
                  className="ml-3 px-4 py-1.5 bg-[#002B66] text-white font-bold rounded-lg hover:bg-[#001D45] cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

