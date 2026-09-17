import React, { useState } from 'react';
import { 
  X, Copy, Check, Download, FileCode, Terminal, 
  ExternalLink, Layers, CheckCircle2, ChevronRight, BookOpen
} from 'lucide-react';
import { GAS_FILES, SETUP_GUIDE as DEPLOYMENT_GUIDE } from '../data/gasSourceCode';

interface GasSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GasSourceModal: React.FC<GasSourceModalProps> = ({ isOpen, onClose }) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'code' | 'guide'>('code');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentFile = GAS_FILES[selectedFileIndex] || GAS_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadCurrentFile = () => {
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    GAS_FILES.forEach((f, idx) => {
      setTimeout(() => {
        const blob = new Blob([f.content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = f.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, idx * 150);
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#002B66] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FDB913] text-[#002B66] flex items-center justify-center font-black">
              <FileCode className="w-5 h-5 text-[#002B66]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black">
                  Source Code Google Apps Script (GAS) & Database Sheets
                </h2>
                <span className="text-[10px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded">
                  Siap Deploy
                </span>
              </div>
              <p className="text-xs text-amber-200">
                13 File Modular Bersih Tanpa Placeholder untuk Direktorat Pendidikan Non Gelar Unpad
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#FDB913] hover:bg-amber-400 text-[#002B66] rounded-lg text-xs font-bold transition-colors"
              title="Download Seluruh 13 Berkas GAS"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Semua File</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 text-xs font-bold">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('code')}
              className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'code'
                  ? 'border-[#002B66] text-[#002B66]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>File Editor ({GAS_FILES.length} Berkas)</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'guide'
                  ? 'border-[#002B66] text-[#002B66]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Panduan Deployment 7 Langkah</span>
            </button>
          </div>

          {activeTab === 'code' && (
            <div className="flex items-center gap-2 py-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#002B66] hover:bg-[#083a7e] text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#FDB913]" />
                    <span>Salin Kode File Ini</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadCurrentFile}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                title={`Unduh ${currentFile.name}`}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Unduh File</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {activeTab === 'code' ? (
            <>
              {/* File List Left Sidebar */}
              <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 overflow-y-auto p-2 space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Daftar Berkas GAS & HTML
                </div>

                {GAS_FILES.map((file, idx) => {
                  const isSelected = idx === selectedFileIndex;
                  return (
                    <button
                      key={file.name}
                      onClick={() => { setSelectedFileIndex(idx); setCopied(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors text-left ${
                        isSelected 
                          ? 'bg-[#002B66] text-white shadow-2xs' 
                          : 'text-slate-700 hover:bg-slate-200/70'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`text-[10px] font-mono px-1 rounded ${
                          file.name.endsWith('.gs') 
                            ? 'bg-amber-400/20 text-amber-600' 
                            : 'bg-blue-400/20 text-blue-600'
                        } ${isSelected ? 'text-white bg-white/20' : ''}`}>
                          {file.name.endsWith('.gs') ? 'GS' : 'HTML'}
                        </span>
                        <span className="truncate">{file.name}</span>
                      </div>
                      {isSelected && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Code Viewer */}
              <div className="flex-1 flex flex-col bg-[#1E1E1E] text-slate-100 overflow-hidden">
                <div className="bg-[#2D2D2D] px-4 py-2 border-b border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400">{currentFile.name}</span>
                    <span className="text-[11px] text-slate-400">
                      ({currentFile.content.split('\n').length} baris)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Google Apps Script / JavaScript Syntax
                  </span>
                </div>

                <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed custom-scrollbar">
                  <pre className="text-slate-300">
                    <code>{currentFile.content}</code>
                  </pre>
                </div>
              </div>
            </>
          ) : (
            /* Guide View */
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 max-w-4xl mx-auto">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-900 text-sm">
                    PANDUAN DEPLOYMENT WEB APP GOOGLE APPS SCRIPT (GAS)
                  </h3>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Aplikasi ini menggunakan arsitektur modular resmi Google Apps Script dengan <strong>Google Sheets sebagai Database Utama</strong>. Ikuti langkah-langkah di bawah untuk men-deploy aplikasi ke domain @unpad.ac.id.
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 font-sans text-xs">
                <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap font-mono text-[11px] bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto">
                  {DEPLOYMENT_GUIDE}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
