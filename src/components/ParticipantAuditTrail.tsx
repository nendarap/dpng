import React, { useState, useEffect, useMemo } from 'react';
import { 
  History, Clock, User, Shield, Search, Filter, 
  ArrowRight, CheckCircle2, AlertCircle, FileText, 
  Download, RefreshCw, Plus, ChevronDown, ChevronUp,
  Tag, Award, ShieldCheck, Edit3, MessageSquare, 
  Calendar, Layers, Check, Copy, FileClock, X
} from 'lucide-react';
import { 
  Peserta, 
  ParticipantAuditEntry, 
  ParticipantAuditAction, 
  ParticipantFieldChange,
  UserRole
} from '../types';
import { 
  getParticipantAuditTrail, 
  addManualAuditNote 
} from '../services/storageService';

interface ParticipantAuditTrailProps {
  peserta: Peserta;
  userRole?: UserRole;
  onRefreshParent?: () => void;
  className?: string;
  isCompact?: boolean;
}

export const ParticipantAuditTrail: React.FC<ParticipantAuditTrailProps> = ({
  peserta,
  userRole = 'OPERATOR',
  onRefreshParent,
  className = '',
  isCompact = false,
}) => {
  const [auditList, setAuditList] = useState<ParticipantAuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});

  // Manual Note Form State
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteAuthorName, setNoteAuthorName] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Load audit trail
  const loadAuditHistory = () => {
    if (!peserta) return;
    setLoading(true);
    try {
      const history = getParticipantAuditTrail(peserta.id);
      setAuditList(history);
    } catch (err) {
      console.error('Gagal memuat audit trail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditHistory();
  }, [peserta.id]);

  const toggleExpand = (id: string) => {
    setExpandedEntries(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setIsSubmittingNote(true);
    try {
      addManualAuditNote(peserta.id, noteContent.trim(), {
        name: noteAuthorName.trim() || undefined,
        role: userRole
      });
      setNoteContent('');
      setIsAddingNote(false);
      setFeedbackMsg('Catatan audit manual berhasil ditambahkan.');
      loadAuditHistory();
      onRefreshParent?.();
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch (err: any) {
      alert(`Gagal menambah catatan audit: ${err.message}`);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Format relative time helper
  const getRelativeTime = (isoString: string) => {
    try {
      const entryDate = new Date(isoString.replace(' ', 'T'));
      const now = new Date();
      const diffMs = now.getTime() - entryDate.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 2) return 'Baru saja';
      if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
      if (diffHours < 24) return `${diffHours} jam yang lalu`;
      if (diffDays === 1) return 'Kemarin';
      if (diffDays < 30) return `${diffDays} hari yang lalu`;
      return isoString.substring(0, 10);
    } catch {
      return isoString;
    }
  };

  // Action badge & styling helper
  const getActionConfig = (action: ParticipantAuditAction) => {
    switch (action) {
      case 'CREATE':
        return {
          icon: Plus,
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          dot: 'bg-emerald-500',
          label: 'Registrasi Baru'
        };
      case 'VERIFY':
      case 'DOCUMENT_VERIFY':
        return {
          icon: ShieldCheck,
          bg: 'bg-blue-50 border-blue-200 text-blue-800',
          dot: 'bg-blue-600',
          label: 'Verifikasi Berkas'
        };
      case 'STATUS_CHANGE':
        return {
          icon: ArrowRight,
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          dot: 'bg-amber-500',
          label: 'Perubahan Status'
        };
      case 'CERTIFICATE_ISSUED':
      case 'EVALUATION':
        return {
          icon: Award,
          bg: 'bg-purple-50 border-purple-200 text-purple-800',
          dot: 'bg-purple-500',
          label: 'Sertifikasi / Evaluasi'
        };
      case 'MANUAL_NOTE':
        return {
          icon: MessageSquare,
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          dot: 'bg-rose-500',
          label: 'Catatan Petugas'
        };
      case 'UPDATE':
      default:
        return {
          icon: Edit3,
          bg: 'bg-slate-50 border-slate-200 text-slate-800',
          dot: 'bg-slate-500',
          label: 'Pembaruan Data'
        };
    }
  };

  // Filtered and sorted audit entries
  const filteredAudits = useMemo(() => {
    let result = [...auditList];

    // Filter by action
    if (selectedAction !== 'ALL') {
      result = result.filter(item => {
        if (selectedAction === 'CREATE') return item.action === 'CREATE';
        if (selectedAction === 'VERIFY') return item.action === 'VERIFY' || item.action === 'DOCUMENT_VERIFY';
        if (selectedAction === 'UPDATE') return item.action === 'UPDATE';
        if (selectedAction === 'STATUS') return item.action === 'STATUS_CHANGE';
        if (selectedAction === 'CERTIFICATE') return item.action === 'CERTIFICATE_ISSUED' || item.action === 'EVALUATION';
        if (selectedAction === 'NOTE') return item.action === 'MANUAL_NOTE';
        return true;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.actionTitle.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.actor.email.toLowerCase().includes(q) ||
        (item.actor.nama && item.actor.nama.toLowerCase().includes(q)) ||
        (item.changes && item.changes.some(c => 
          c.label.toLowerCase().includes(q) || 
          String(c.newValue).toLowerCase().includes(q) ||
          String(c.oldValue).toLowerCase().includes(q)
        ))
      );
    }

    // Sort order
    result.sort((a, b) => {
      const timeA = new Date(a.timestamp.replace(' ', 'T')).getTime();
      const timeB = new Date(b.timestamp.replace(' ', 'T')).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [auditList, selectedAction, searchQuery, sortOrder]);

  const handleExportJson = () => {
    const dataStr = JSON.stringify(auditList, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_trail_${peserta.nomorRegistrasi || peserta.id}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* Top Banner Card: Participant Audit Context */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#002B66] text-[#FDB913] flex items-center justify-center font-bold shadow-xs shrink-0">
            <FileClock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Audit Trail & Riwayat Perubahan Peserta
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                {peserta.id} · {peserta.nomorRegistrasi}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Catatan historis lengkap (Siapa, Kapan, dan Apa yang diubah) terintegrasi dengan logging audit UNPAD.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
          {userRole !== 'VIEWER' && (
            <button
              type="button"
              onClick={() => setIsAddingNote(!isAddingNote)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#002B66] hover:bg-[#001D45] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#FDB913]" />
              <span>Tambah Catatan Audit</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportJson}
            disabled={auditList.length === 0}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
            title="Ekspor seluruh rekaman audit ke berkas JSON"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Ekspor JSON</span>
          </button>

          <button
            type="button"
            onClick={loadAuditHistory}
            disabled={loading}
            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs transition cursor-pointer"
            title="Muat Ulang Riwayat"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#002B66]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Manual Note Insertion Form */}
      {isAddingNote && (
        <form onSubmit={handleAddNote} className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-600" />
              <span>Bubuhkan Catatan Verifikasi / Audit Baru</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingNote(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Catatan Pemeriksaan / Alasan Perubahan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Contoh: Dokumen ijazah asli telah diverifikasi langsung oleh verifikator fakultas. Data peserta valid."
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#002B66] bg-white"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Petugas / Auditor
              </label>
              <input
                type="text"
                value={noteAuthorName}
                onChange={(e) => setNoteAuthorName(e.target.value)}
                placeholder="Nama Anda (opsional, default: nama akun)"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#002B66] bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingNote(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/60 rounded-lg font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmittingNote || !noteContent.trim()}
              className="px-4 py-1.5 bg-[#002B66] hover:bg-[#001D45] text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
            >
              {isSubmittingNote ? 'Menyimpan...' : 'Simpan Catatan Audit'}
            </button>
          </div>
        </form>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari dalam riwayat (petugas, kolom yang diubah, isi perubahan)..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#002B66]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#002B66]"
          >
            <option value="ALL">Semua Aksi ({auditList.length})</option>
            <option value="CREATE">Registrasi Awal</option>
            <option value="VERIFY">Verifikasi Dokumen</option>
            <option value="UPDATE">Pembaruan Biodata</option>
            <option value="STATUS">Perubahan Status</option>
            <option value="CERTIFICATE">Sertifikat / Nilai</option>
            <option value="NOTE">Catatan Audit</option>
          </select>

          {/* Sort order toggle */}
          <button
            type="button"
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5 whitespace-nowrap"
            title="Urutan kronologis"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{sortOrder === 'desc' ? 'Terbaru Dahulu' : 'Terlama Dahulu'}</span>
          </button>
        </div>
      </div>

      {/* Main Historical Timeline */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#002B66]" />
          <span>Memuat data audit trail peserta...</span>
        </div>
      ) : filteredAudits.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs space-y-2">
          <History className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700">Tidak ada riwayat perubahan yang sesuai kriteria.</p>
          <p className="text-slate-400">
            {searchQuery || selectedAction !== 'ALL'
              ? 'Coba bersihkan filter pencarian atau pilih kategori aksi "Semua Aksi".'
              : 'Belum ada catatan aktivitas tambahan pada berkas peserta ini.'}
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {filteredAudits.map((entry, index) => {
            const config = getActionConfig(entry.action);
            const IconComponent = config.icon;
            const isExpanded = Boolean(expandedEntries[entry.id]);
            const hasFieldChanges = entry.changes && entry.changes.length > 0;

            return (
              <div key={entry.id || index} className="relative group">
                {/* Timeline Dot Node */}
                <div 
                  className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white shadow-xs flex items-center justify-center ${config.dot} ring-4 ring-slate-100 z-10 transition-transform group-hover:scale-110`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>

                {/* Entry Card */}
                <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-xs transition-all space-y-3">
                  
                  {/* Top Bar: Action Title, Date, & Who */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${config.bg}`}>
                        <IconComponent className="w-3 h-3" />
                        <span>{config.label}</span>
                      </span>

                      <h4 className="font-bold text-slate-900 text-xs">
                        {entry.actionTitle}
                      </h4>

                      <span className="text-[11px] font-mono text-slate-400">
                        {entry.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{entry.timestamp}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {getRelativeTime(entry.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Summary Narrative */}
                  <p className="text-xs text-slate-700 leading-relaxed font-normal">
                    {entry.summary}
                  </p>

                  {/* Actor Information Bar */}
                  <div className="bg-slate-50 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#002B66]/10 text-[#002B66] flex items-center justify-center font-bold text-[10px]">
                        <User className="w-3 h-3" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">
                          {entry.actor.nama || entry.actor.email}
                        </span>
                        {entry.actor.role && (
                          <span className="ml-1.5 text-[10px] bg-slate-200 text-slate-700 px-1 py-0.5 rounded font-bold">
                            {entry.actor.role}
                          </span>
                        )}
                        <span className="ml-1 text-slate-400 text-[10px]">
                          ({entry.actor.email})
                        </span>
                      </div>
                    </div>

                    {entry.actor.ipUserAgent && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {entry.actor.ipUserAgent}
                      </span>
                    )}
                  </div>

                  {/* Detailed Field Diff Grid (What changed) */}
                  {hasFieldChanges && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-blue-600" />
                          <span>Rincian Perubahan Kolom ({entry.changes!.length} kolom)</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => toggleExpand(entry.id)}
                          className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isExpanded ? 'Sembunyikan' : 'Buka Detail'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* Diff Items Grid */}
                      <div className="grid grid-cols-1 gap-1.5">
                        {entry.changes!.slice(0, isExpanded ? entry.changes!.length : 3).map((change, cIdx) => (
                          <div 
                            key={cIdx}
                            className="p-2 rounded-lg border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
                          >
                            <span className="font-semibold text-slate-700 sm:w-1/3 truncate" title={change.label}>
                              {change.label}
                            </span>

                            <div className="flex items-center gap-2 sm:w-2/3 overflow-hidden text-[11px]">
                              {/* Old Value */}
                              <span className="bg-red-50 text-red-700 border border-red-200 line-through px-1.5 py-0.5 rounded truncate max-w-[45%]" title={String(change.oldValue)}>
                                {String(change.oldValue ?? '-')}
                              </span>

                              <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />

                              {/* New Value */}
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-1.5 py-0.5 rounded truncate max-w-[45%]" title={String(change.newValue)}>
                                {String(change.newValue ?? '-')}
                              </span>
                            </div>
                          </div>
                        ))}

                        {!isExpanded && entry.changes!.length > 3 && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(entry.id)}
                            className="text-center text-[11px] text-blue-700 hover:underline font-semibold py-1 cursor-pointer"
                          >
                            + Lihat {entry.changes!.length - 3} perubahan kolom lainnya
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Audit Summary */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>
          Total <strong>{auditList.length}</strong> entri audit tercatat untuk peserta ini.
        </span>
        <span className="text-slate-400">
          Sistem Audit Trail UNPAD · Otomatis & Terenkripsi
        </span>
      </div>

    </div>
  );
};
