import React, { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  X, Printer, Download, ZoomIn, ZoomOut, RotateCcw, 
  CheckCircle2, QrCode, FileText, Building2, User, 
  GraduationCap, Briefcase, Award, MapPin, Phone, Mail,
  RefreshCw
} from 'lucide-react';
import { Pegawai } from '../types';
import { UnpadLogo } from './UnpadLogo';

interface PegawaiPdfPreviewModalProps {
  pegawai: Pegawai | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PegawaiPdfPreviewModal: React.FC<PegawaiPdfPreviewModalProps> = ({
  pegawai,
  isOpen,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !pegawai) return null;

  const fullName = [pegawai.gelarDepan, pegawai.nama, pegawai.gelarBelakang].filter(Boolean).join(' ');
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 15, 160));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 15, 60));
  const handleZoomReset = () => setZoomLevel(100);

  // Direct Save As PDF function
  const handleSaveAsPdf = async () => {
    if (!printRef.current || isExportingPdf) return;
    setIsExportingPdf(true);
    setDownloadSuccessMsg(null);

    try {
      const element = printRef.current;
      const originalTransform = element.style.transform;
      // Temporarily clear zoom scaling so html2canvas renders exact pixels
      element.style.transform = 'none';

      const canvas = await html2canvas(element, {
        scale: 2, // 2x resolution for razor-sharp text
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200
      });

      // Restore zoom transform immediately
      element.style.transform = originalTransform;

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 210; // A4 mm
      const pdfHeight = 297; // A4 mm
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      const safeNip = (pegawai.nip || pegawai.id || 'pegawai').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeNama = (pegawai.nama || 'biodata').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `Biodata_Pegawai_${safeNip}_${safeNama}.pdf`;

      pdf.save(fileName);
      setDownloadSuccessMsg(`File "${fileName}" berhasil diunduh!`);
      setTimeout(() => setDownloadSuccessMsg(null), 5000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Gagal membuat file PDF. Silakan gunakan tombol "Cetak" untuk menyimpan sebagai PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/85 backdrop-blur-xs animate-in fade-in print:bg-white print:p-0 print:static print:inset-auto">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            background-color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          nav, aside, header.print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
      {/* Top Floating Toolbar (Hidden during print) */}
      <header className="h-14 px-4 sm:px-6 bg-[#002B66] text-white flex items-center justify-between border-b border-blue-900/60 shadow-lg shrink-0 print:hidden select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FDB913] text-[#002B66] flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold truncate max-w-[200px] sm:max-w-md">
              Pratinjau PDF Biodata: {fullName || pegawai.nama}
            </h2>
            <p className="text-[10px] text-blue-200">
              Format Standar A4 Resmi • NIP: {pegawai.nip || '-'}
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="hidden md:flex items-center bg-white/10 rounded-lg p-0.5 border border-white/15 text-xs">
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-white/10 rounded text-slate-200 hover:text-white"
              title="Perkecil (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-blue-100 min-w-[42px] text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-white/10 rounded text-slate-200 hover:text-white"
              title="Perbesar (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomReset}
              className="p-1.5 hover:bg-white/10 rounded text-slate-200 hover:text-white ml-0.5 border-l border-white/10"
              title="Reset Zoom (100%)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={handleSaveAsPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FDB913] hover:bg-[#e0a410] disabled:bg-slate-300 disabled:text-slate-600 text-[#002B66] font-extrabold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
            title="Download langsung file PDF biodata pegawai"
          >
            {isExportingPdf ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Membuat PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Save As PDF</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg border border-white/20 shadow-xs transition-all cursor-pointer"
            title="Cetak langsung atau simpan via browser print dialog"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cetak</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/15 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
            title="Tutup Pratinjau (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Success Download Alert Banner */}
      {downloadSuccessMsg && (
        <div className="bg-emerald-600 text-white text-xs px-4 py-2 flex items-center justify-between shadow-md print:hidden animate-in fade-in">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{downloadSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setDownloadSuccessMsg(null)}
            className="text-white/80 hover:text-white font-bold text-xs p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* PDF Viewport Container */}
      <main className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-8 flex justify-center items-start print:p-0 print:overflow-visible">
        {/* Printable A4 Sheet */}
        <div
          ref={printRef}
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
          }}
          className="w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[15mm] sm:p-[20mm] shadow-2xl rounded-sm border border-slate-300 transition-transform duration-150 print:m-0 print:p-0 print:border-none print:shadow-none print:w-full print:transform-none select-text"
        >
          {/* ======================================================== */}
          {/* KOP RESMI UNIVERSITAS PADJADJARAN                       */}
          {/* ======================================================== */}
          <div className="relative pb-3 mb-4 border-b-2 border-slate-900">
            <div className="flex items-center justify-between gap-4">
              {/* Logo Unpad */}
              <div className="shrink-0 w-24">
                <UnpadLogo variant="color" size="lg" />
              </div>

              {/* Teks Kop Surat */}
              <div className="flex-1 text-center font-serif">
                <h3 className="text-[11pt] font-bold uppercase tracking-wider text-slate-900 leading-tight">
                  KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI
                </h3>
                <h1 className="text-[14pt] font-black uppercase text-[#002B66] tracking-wide leading-tight mt-0.5">
                  UNIVERSITAS PADJADJARAN
                </h1>
                <h2 className="text-[10pt] font-bold uppercase text-slate-800 leading-tight mt-0.5">
                  DIREKTORAT PENDIDIKAN NON GELAR
                </h2>
                <p className="text-[8pt] text-slate-600 font-sans mt-1 leading-snug">
                  Jalan Raya Bandung - Sumedang Km. 21 Jatinangor, Sumedang 45363
                  <br />
                  Laman: www.unpad.ac.id | Pos-el: dpng@unpad.ac.id / info@unpad.ac.id | Telp: (022) 7796010
                </p>
              </div>

              {/* Logo / Badge Pelengkap Kanan (Simpendik) */}
              <div className="shrink-0 w-24 text-right">
                <span className="inline-block px-2 py-1 text-[8pt] font-mono font-bold text-[#002B66] border border-[#002B66] rounded">
                  SIMPENDIK
                </span>
                <div className="text-[7pt] text-slate-400 font-mono mt-1">
                  FORM-BIO-01
                </div>
              </div>
            </div>

            {/* Garis Ganda Khas Surat Resmi */}
            <div className="mt-2 border-b border-slate-900 w-full" />
          </div>

          {/* ======================================================== */}
          {/* JUDUL DOKUMEN & FOTO BOX                                */}
          {/* ======================================================== */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 text-center">
              <h2 className="text-[13pt] font-black text-slate-900 uppercase tracking-wide underline font-serif">
                DAFTAR RIWAYAT HIDUP & BIODATA PEGAWAI
              </h2>
              <p className="text-[8.5pt] font-mono text-slate-600 mt-0.5">
                Nomor Registrasi: UN6.DPNG/KP/{pegawai.id}/{new Date().getFullYear()}
              </p>
            </div>

            {/* Box Pas Foto 3x4 */}
            <div className="w-[28mm] h-[36mm] border-2 border-dashed border-slate-400 rounded bg-slate-50 flex flex-col items-center justify-center text-center p-1 shrink-0 print:border-slate-800">
              <User className="w-8 h-8 text-slate-400 mb-1" />
              <span className="text-[7.5pt] text-slate-500 font-semibold leading-tight">
                Pas Foto Resmi
                <br />
                3 x 4 cm
              </span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* TABEL ATRIBUT BIODATA LENGKAP (44 FIELDS)               */}
          {/* ======================================================== */}
          <div className="space-y-4 text-[9pt] text-slate-800 font-sans">
            {/* ---------------------------------------------------- */}
            {/* I. DATA KEPEGAWAIAN                                  */}
            {/* ---------------------------------------------------- */}
            <div>
              <div className="bg-[#002B66] text-white px-2.5 py-1 font-bold text-[9pt] tracking-wide uppercase flex items-center justify-between">
                <span>I. Identitas & Status Kepegawaian</span>
                <span className="text-[8pt] text-[#FDB913]">Atribut 1 - 12</span>
              </div>
              <table className="w-full border-collapse border border-slate-300 mt-1">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="w-8 p-1.5 text-center font-bold text-slate-500 border-r border-slate-200">1</td>
                    <td className="w-52 p-1.5 font-semibold text-slate-600 border-r border-slate-200">Nama Lengkap & Gelar</td>
                    <td className="p-1.5 font-bold text-slate-900" colSpan={3}>
                      {fullName || pegawai.nama}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <td className="p-1.5 text-center font-bold text-slate-500 border-r border-slate-200">2</td>
                    <td className="p-1.5 font-semibold text-slate-600 border-r border-slate-200">Nomor Induk Pegawai (NIP)</td>
                    <td className="p-1.5 font-mono font-bold text-[#002B66] border-r border-slate-200">
                      {pegawai.nip || '-'}
                    </td>
                    <td className="w-36 p-1.5 font-semibold text-slate-600 border-r border-slate-200">Kartu Pegawai (Karpeg)</td>
                    <td className="p-1.5 font-mono text-slate-800">
                      {pegawai.kartuPegawai || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 text-center font-bold text-slate-500 border-r border-slate-200">3</td>
                    <td className="p-1.5 font-semibold text-slate-600 border-r border-slate-200">NIDN / NUPTK</td>
                    <td className="p-1.5 font-mono text-slate-800 border-r border-slate-200">
                      {pegawai.nidnNuptk || '-'}
                    </td>
                    <td className="p-1.5 font-semibold text-slate-600 border-r border-slate-200">Status Kepegawaian</td>
                    <td className="p-1.5 font-bold text-slate-800">
                      {pegawai.statusKepegawaian || 'PNS'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <td className="p-1.5 text-center font-bold text-slate-500 border-r border-slate-200">4</td>
                    <td className="p-1.5 font-semibold text-slate-600 border-r border-slate-200">Status Aktif Kepegawaian</td>
                    <td className="p-1.5 font-bold text-emerald-700 border-r border-slate-200">
                      {pegawai.statusAktif || 'Aktif'}
                    </td>
                    <td className="p-1.5 font-semibold text-slate-600 border-r border-slate-200">TMT Status Aktif</td>
                    <td className="p-1.5 text-slate-800">
                      {pegawai.tanggalDitetapkanStatus || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 text-center font-bold text-slate-500 border-r border-slate-200">5</td>
                    <td className="p-1.5 font-semibold text-slate-600 border-r border-slate-200">Keterangan Status Aktif</td>
                    <td className="p-1.5 text-slate-800" colSpan={3}>
                      {pegawai.keteranganStatusAktif || 'Bertugas Aktif'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <td className="p-1.5 text-center font-bold text-slate-500 border-r border-slate-200">6</td>
                    <td className="p-1.5 font-semibold text-slate-600 border-r border-slate-200">Unit Kerja Penempatan</td>
                    <td className="p-1.5 font-semibold text-slate-900 border-r border-slate-200" colSpan={3}>
                      {pegawai.unitKerja || 'Direktorat Pendidikan Non Gelar'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center font-bold text-slate-500 border-r border-slate-200">7</td>
                    <td className="p-1.5 font-semibold text-slate-600 border-r border-slate-200">Bagian / Bidang Kerja</td>
                    <td className="p-1.5 text-slate-800" colSpan={3}>
                      {pegawai.bagian || '-'} {pegawai.bidangKerja ? `• Bidang: ${pegawai.bidangKerja}` : ''}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ---------------------------------------------------- */}
            {/* II. BIODATA PRIBADI                                  */}
            {/* ---------------------------------------------------- */}
            <div>
              <div className="bg-[#002B66] text-white px-2.5 py-1 font-bold text-[9pt] tracking-wide uppercase flex items-center justify-between">
                <span>II. Data Pribadi & Domisili</span>
                <span className="text-[8pt] text-[#FDB913]">Atribut 13 - 28</span>
              </div>
              <table className="w-full border-collapse border border-slate-300 mt-1">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="w-8 p-1.5 text-center font-bold text-slate-500 border-r border-slate-200">8</td>
                    <td className="w-52 p-1.5 font-semibold text-slate-600 border-r border-slate-200">Tempat, Tanggal Lahir</td>
                    <td className="p-1.5 text-slate-900 border-r border-slate-200">
                      <strong>{pegawai.tempatLahir || '-'}</strong>, {pegawai.tanggalLahir || '-'}
                    </td>
                    <td className="w-36 p-1.5 font-semibold text-slate-600 border-r border-slate-200">Jenis Kelamin</td>
                    <td className="p-1.5 text-slate-800">
                      {pegawai.jenisKelamin || 'Laki-laki'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <td className="p-1.5 text-center font-bold text-slate-500 border-r border-slate-200">9</td>
                    <td className="p-1.5 font-semibold text-slate-600 border-r border-slate-200">Agama / Golongan Darah</td>
                    <td className="p-1.5 text-slate-800 border-r border-slate-200">
                      {pegawai.agama || 'Islam'} / Gol. Darah: <strong>{pegawai.golonganDarah || '-'}</strong>
                    </td>
                    <td className="p-1.5 font-semibold text-slate-600 border-r border-slate-200">Suku / Bangsa</td>
                    <td className="p-1.5 text-slate-800">
                      {pegawai.sukuBangsa || 'Sunda'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 text-center font-bold text-slate-500 border-r border-slate-200">10</td>
                    <td className="p-1.5 font-semibold text-slate-600 border-r border-slate-200">Kewarganegaraan</td>
                    <td className="p-1.5 text-slate-800 border-r border-slate-200">
                      {pegawai.kewarganegaraan || 'WNI'}
                    </td>
                    <td className="p-1.5 font-semibold text-slate-600 border-r border-slate-200">Status Perkawinan</td>
                    <td className="p-1.5 text-slate-800">
                      {pegawai.statusMarital || 'Kawin'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <td className="p-1.5 text-center font-bold text-slate-500 border-r border-slate-200">11</td>
                    <td className="p-1.5 font-semibold text-slate-600 border-r border-slate-200">Alamat Tempat Tinggal</td>
                    <td className="p-1.5 text-slate-800" colSpan={3}>
                      {pegawai.alamat || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center font-bold text-slate-500 border-r border-slate-200">12</td>
                    <td className="p-1.5 font-semibold text-slate-600 border-r border-slate-200">Wilayah Administratif</td>
                    <td className="p-1.5 text-slate-800 text-[8.5pt]" colSpan={3}>
                      RT {pegawai.rt || '-'}/RW {pegawai.rw || '-'}, Kel. {pegawai.kelurahan || '-'}, Kec. {pegawai.kecamatan || '-'}, {pegawai.kota || '-'}, Prov. {pegawai.propinsi || 'Jawa Barat'} {pegawai.kodePos ? `(${pegawai.kodePos})` : ''}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ---------------------------------------------------- */}
            {/* III. KONTAK KOMUNIKASI                               */}
            {/* ---------------------------------------------------- */}
            <div>
              <div className="bg-[#002B66] text-white px-2.5 py-1 font-bold text-[9pt] tracking-wide uppercase flex items-center justify-between">
                <span>III. Kontak Komunikasi & Korespondensi</span>
                <span className="text-[8pt] text-[#FDB913]">Atribut 29 - 31</span>
              </div>
              <table className="w-full border-collapse border border-slate-300 mt-1">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="w-8 p-1.5 text-center font-bold text-slate-500 border-r border-slate-200">13</td>
                    <td className="w-52 p-1.5 font-semibold text-slate-600 border-r border-slate-200">Telepon Rumah / Kantor</td>
                    <td className="p-1.5 text-slate-800 border-r border-slate-200">
                      {pegawai.telepon || '-'}
                    </td>
                    <td className="w-36 p-1.5 font-semibold text-slate-600 border-r border-slate-200">No. Handphone (WA)</td>
                    <td className="p-1.5 font-bold text-slate-900">
                      {pegawai.hp || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center font-bold text-slate-500 border-r border-slate-200">14</td>
                    <td className="p-1.5 font-semibold text-slate-600 border-r border-slate-200">Alamat Email Institusi</td>
                    <td className="p-1.5 font-mono text-[#002B66] font-semibold" colSpan={3}>
                      {pegawai.email || '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ---------------------------------------------------- */}
            {/* IV. PENDIDIKAN TERAKHIR                              */}
            {/* ---------------------------------------------------- */}
            <div>
              <div className="bg-[#002B66] text-white px-2.5 py-1 font-bold text-[9pt] tracking-wide uppercase flex items-center justify-between">
                <span>IV. Riwayat Pendidikan Terakhir</span>
                <span className="text-[8pt] text-[#FDB913]">Atribut 32 - 38</span>
              </div>
              <table className="w-full border-collapse border border-slate-300 mt-1">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="w-8 p-1.5 text-center font-bold text-slate-500 border-r border-slate-200">15</td>
                    <td className="w-52 p-1.5 font-semibold text-slate-600 border-r border-slate-200">Jenjang & Jurusan</td>
                    <td className="p-1.5 font-bold text-slate-900 border-r border-slate-200">
                      {pegawai.jenjang || '-'} {pegawai.jurusan ? `• ${pegawai.jurusan}` : ''}
                    </td>
                    <td className="w-36 p-1.5 font-semibold text-slate-600 border-r border-slate-200">Tahun Lulus</td>
                    <td className="p-1.5 font-bold text-slate-800">
                      {pegawai.tahunLulus || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <td className="p-1.5 text-center font-bold text-slate-500 border-r border-slate-200">16</td>
                    <td className="p-1.5 font-semibold text-slate-600 border-r border-slate-200">Perguruan Tinggi / Lembaga</td>
                    <td className="p-1.5 text-slate-800 border-r border-slate-200">
                      {pegawai.lembagaPendidikan || '-'}
                    </td>
                    <td className="p-1.5 font-semibold text-slate-600 border-r border-slate-200">Kota / Tempat</td>
                    <td className="p-1.5 text-slate-800">
                      {pegawai.tempat || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center font-bold text-slate-500 border-r border-slate-200">17</td>
                    <td className="p-1.5 font-semibold text-slate-600 border-r border-slate-200">Gelar Akademik</td>
                    <td className="p-1.5 text-slate-800" colSpan={3}>
                      Gelar Depan: <strong>{pegawai.gelarDepan || '-'}</strong> | Gelar Belakang: <strong>{pegawai.gelarBelakang || '-'}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ---------------------------------------------------- */}
            {/* V. KEPANGKATAN & JABATAN                            */}
            {/* ---------------------------------------------------- */}
            <div>
              <div className="bg-[#002B66] text-white px-2.5 py-1 font-bold text-[9pt] tracking-wide uppercase flex items-center justify-between">
                <span>V. Kepangkatan & Jabatan (Struktural / Fungsional)</span>
                <span className="text-[8pt] text-[#FDB913]">Atribut 39 - 44</span>
              </div>
              <table className="w-full border-collapse border border-slate-300 mt-1">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="w-8 p-1.5 text-center font-bold text-slate-500 border-r border-slate-200">18</td>
                    <td className="w-52 p-1.5 font-semibold text-slate-600 border-r border-slate-200">Pangkat / Golongan Ruang</td>
                    <td className="p-1.5 text-slate-900 border-r border-slate-200">
                      <strong>{pegawai.pangkat || '-'}</strong> ({pegawai.golongan || '-'})
                    </td>
                    <td className="w-36 p-1.5 font-semibold text-slate-600 border-r border-slate-200">Jabatan Fungsional</td>
                    <td className="p-1.5 font-bold text-slate-900">
                      {pegawai.jabatanFungsional || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <td className="p-1.5 text-center font-bold text-slate-500 border-r border-slate-200">19</td>
                    <td className="p-1.5 font-semibold text-slate-600 border-r border-slate-200">Jabatan Struktural</td>
                    <td className="p-1.5 font-semibold text-slate-800 border-r border-slate-200">
                      {pegawai.jabatanStruktural || '-'}
                    </td>
                    <td className="p-1.5 font-semibold text-slate-600 border-r border-slate-200">Periode Jabatan</td>
                    <td className="p-1.5 text-slate-800">
                      {pegawai.periode || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center font-bold text-slate-500 border-r border-slate-200">20</td>
                    <td className="p-1.5 font-semibold text-slate-600 border-r border-slate-200">Unit Kerja Jabatan Struktural</td>
                    <td className="p-1.5 text-slate-800" colSpan={3}>
                      {pegawai.unitKerjaJabatanStruktural || '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ======================================================== */}
            {/* VI. PERNYATAAN & PENGESAHAN DOKUMEN                    */}
            {/* ======================================================== */}
            <div className="pt-2">
              <p className="text-[8pt] text-slate-700 italic leading-relaxed text-justify mb-4">
                Demikian daftar riwayat hidup dan biodata kepegawaian ini saya buat dengan sesungguhnya dan sebenar-benarnya. Apabila di kemudian hari terdapat keterangan yang tidak benar, saya bersedia mempertanggungjawabkannya sesuai ketentuan peraturan perundang-undangan yang berlaku di lingkungan Universitas Padjadjaran.
              </p>

              <div className="grid grid-cols-3 gap-2 pt-2 items-end text-center text-[8.5pt]">
                {/* Mengetahui Atasan */}
                <div className="space-y-1">
                  <div>Mengetahui,</div>
                  <div className="font-semibold text-slate-700">Atasan Langsung / Direktur,</div>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-[7.5pt] text-slate-400 italic">[Tanda Tangan & Cap]</span>
                  </div>
                  <div className="font-bold underline text-slate-900">
                    Prof. Dr. Ir. H. Ahmad Santoso, M.Sc.
                  </div>
                  <div className="text-[7.5pt] text-slate-500 font-mono">
                    NIP. 197405121998031002
                  </div>
                </div>

                {/* QR Code Verifikasi SIMPENDIK */}
                <div className="flex flex-col items-center justify-center p-2">
                  <div className="border border-slate-300 p-2 bg-white rounded shadow-2xs">
                    <QrCode className="w-16 h-16 text-slate-800 mx-auto" />
                  </div>
                  <span className="text-[6.5pt] font-mono text-slate-500 mt-1 uppercase tracking-tight">
                    VERIFIKASI RESMI SIMPENDIK UNPAD
                  </span>
                  <span className="text-[6pt] font-mono text-slate-400">
                    ID: {pegawai.id}
                  </span>
                </div>

                {/* Pegawai Yang Bersangkutan */}
                <div className="space-y-1">
                  <div>Sumedang, {todayFormatted}</div>
                  <div className="font-semibold text-slate-700">Pegawai yang Bersangkutan,</div>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-[7.5pt] text-slate-400 italic">[Tanda Tangan Asli]</span>
                  </div>
                  <div className="font-bold underline text-slate-900">
                    {fullName || pegawai.nama}
                  </div>
                  <div className="text-[7.5pt] text-slate-500 font-mono">
                    NIP. {pegawai.nip || '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
