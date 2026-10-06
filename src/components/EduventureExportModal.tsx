import React, { useState, useMemo } from 'react';
import { 
  X, Download, FileSpreadsheet, Printer, Filter, CheckSquare, 
  Square, Calendar, Building2, Users, DollarSign, CreditCard, 
  Compass, CheckCircle2, AlertCircle, Sparkles, Layers, Search
} from 'lucide-react';
import { EduventureBooking, SkemaPaketEduventure, StatusBayarEduventure, RekeningEduventure } from '../types';
import { UnpadLogo } from './UnpadLogo';

interface EduventureExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  eduventureList: EduventureBooking[];
}

export interface EduventureColumnDef {
  id: string;
  label: string;
  category: 'identitas' | 'jadwal' | 'keuangan' | 'lainnya';
}

export const EDUVENTURE_EXPORT_COLUMNS: EduventureColumnDef[] = [
  { id: 'id', label: 'ID Kunjungan', category: 'identitas' },
  { id: 'namaSekolah', label: 'Nama Sekolah / Instansi', category: 'identitas' },
  { id: 'alamat', label: 'Alamat Sekolah', category: 'identitas' },
  { id: 'kontakPerson', label: 'Narahubung / PIC Guru', category: 'identitas' },
  { id: 'nomorKontak', label: 'Nomor Kontak / WhatsApp', category: 'identitas' },
  { id: 'emailKontak', label: 'Email Narahubung', category: 'identitas' },
  { id: 'jumlahPeserta', label: 'Jumlah Siswa / Peserta', category: 'identitas' },
  { id: 'jumlahGuru', label: 'Jumlah Guru Pendamping', category: 'identitas' },
  { id: 'totalRombongan', label: 'Total Rombongan (Siswa + Guru)', category: 'identitas' },
  
  { id: 'tanggalPelaksanaan', label: 'Tanggal Pelaksanaan', category: 'jadwal' },
  { id: 'waktuMulai', label: 'Waktu Mulai', category: 'jadwal' },
  { id: 'waktuSelesai', label: 'Waktu Selesai', category: 'jadwal' },
  { id: 'tempatPenyelenggaraan', label: 'Tempat / Gedung', category: 'jadwal' },
  { id: 'skemaPaket', label: 'Skema Paket Eduventure', category: 'jadwal' },
  { id: 'pilihanKunjungan', label: 'Pilihan Kunjungan', category: 'jadwal' },
  { id: 'fakultasTujuan', label: 'Fakultas / Prodi Tujuan', category: 'jadwal' },
  { id: 'statusKunjungan', label: 'Status Kunjungan', category: 'jadwal' },
  
  { id: 'statusBayar', label: 'Status Pembayaran', category: 'keuangan' },
  { id: 'nominalTransfer', label: 'Nominal Biaya / Transfer (Rp)', category: 'keuangan' },
  { id: 'tanggalTransfer', label: 'Tanggal Transfer / Bayar', category: 'keuangan' },
  { id: 'rekening', label: 'Rekening VA BNI', category: 'keuangan' },
  { id: 'catatanTambahan', label: 'Catatan / Keterangan', category: 'lainnya' },
];

export const EduventureExportModal: React.FC<EduventureExportModalProps> = ({
  isOpen,
  onClose,
  eduventureList,
}) => {
  // Format state
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'print'>('csv');
  const [exportNotice, setExportNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Filters
  const [filterTahun, setFilterTahun] = useState<string>('ALL');
  const [filterSkema, setFilterSkema] = useState<string>('ALL');
  const [filterStatusBayar, setFilterStatusBayar] = useState<string>('ALL');
  const [filterRekening, setFilterRekening] = useState<string>('ALL');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Column selection state
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    EDUVENTURE_EXPORT_COLUMNS.map(c => c.id)
  );

  // Column Presets
  const applyPreset = (preset: 'all' | 'operasional' | 'keuangan' | 'kontak') => {
    switch (preset) {
      case 'all':
        setSelectedColumns(EDUVENTURE_EXPORT_COLUMNS.map(c => c.id));
        break;
      case 'operasional':
        setSelectedColumns([
          'id', 'namaSekolah', 'tanggalPelaksanaan', 'waktuMulai', 'waktuSelesai', 
          'tempatPenyelenggaraan', 'skemaPaket', 'jumlahPeserta', 'jumlahGuru', 
          'totalRombongan', 'kontakPerson', 'nomorKontak', 'statusKunjungan'
        ]);
        break;
      case 'keuangan':
        setSelectedColumns([
          'id', 'namaSekolah', 'tanggalPelaksanaan', 'skemaPaket', 
          'statusBayar', 'nominalTransfer', 'tanggalTransfer', 'rekening', 'catatanTambahan'
        ]);
        break;
      case 'kontak':
        setSelectedColumns([
          'id', 'namaSekolah', 'alamat', 'kontakPerson', 'nomorKontak', 
          'emailKontak', 'jumlahPeserta', 'jumlahGuru', 'skemaPaket'
        ]);
        break;
    }
  };

  const toggleColumn = (id: string) => {
    if (selectedColumns.includes(id)) {
      setSelectedColumns(selectedColumns.filter(c => c !== id));
    } else {
      setSelectedColumns([...selectedColumns, id]);
    }
  };

  // Filtered dataset
  const filteredData = useMemo(() => {
    return eduventureList.filter(item => {
      if (filterTahun !== 'ALL') {
        const itemYear = (item.tanggalPelaksanaan || '').substring(0, 4);
        if (itemYear !== filterTahun) return false;
      }
      if (filterSkema !== 'ALL' && item.skemaPaket !== filterSkema) return false;
      if (filterStatusBayar !== 'ALL' && item.statusBayar !== filterStatusBayar) return false;
      if (filterRekening !== 'ALL' && item.rekening !== filterRekening) return false;
      
      if (filterStartDate && item.tanggalPelaksanaan && item.tanggalPelaksanaan < filterStartDate) {
        return false;
      }
      if (filterEndDate && item.tanggalPelaksanaan && item.tanggalPelaksanaan > filterEndDate) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSekolah = (item.namaSekolah || '').toLowerCase().includes(q);
        const matchPIC = (item.kontakPerson || '').toLowerCase().includes(q);
        const matchKontak = (item.nomorKontak || '').toLowerCase().includes(q);
        const matchId = (item.id || '').toLowerCase().includes(q);
        const matchTempat = (item.tempatPenyelenggaraan || '').toLowerCase().includes(q);
        if (!matchSekolah && !matchPIC && !matchKontak && !matchId && !matchTempat) {
          return false;
        }
      }

      return true;
    });
  }, [eduventureList, filterTahun, filterSkema, filterStatusBayar, filterRekening, filterStartDate, filterEndDate, searchQuery]);

  // Statistics Summary
  const stats = useMemo(() => {
    let totalSiswa = 0;
    let totalGuru = 0;
    let totalNominal = 0;
    let lunasCount = 0;

    filteredData.forEach(item => {
      totalSiswa += item.jumlahPeserta || 0;
      totalGuru += item.jumlahGuru || 0;
      totalNominal += item.nominalTransfer || 0;
      if (item.statusBayar === 'Sudah' || (item.statusBayar as string) === 'Lunas') lunasCount++;
    });

    return {
      totalKunjungan: filteredData.length,
      totalSiswa,
      totalGuru,
      totalRombongan: totalSiswa + totalGuru,
      totalNominal,
      lunasCount,
      persenLunas: filteredData.length > 0 ? Math.round((lunasCount / filteredData.length) * 100) : 0
    };
  }, [filteredData]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Helper value getter per column
  const getColumnValue = (item: EduventureBooking, colId: string): string => {
    switch (colId) {
      case 'id': return item.id || '';
      case 'namaSekolah': return item.namaSekolah || '';
      case 'alamat': return item.alamat || '';
      case 'kontakPerson': return item.kontakPerson || '';
      case 'nomorKontak': return item.nomorKontak ? `'${item.nomorKontak}` : '';
      case 'emailKontak': return item.emailKontak || '-';
      case 'jumlahPeserta': return String(item.jumlahPeserta || 0);
      case 'jumlahGuru': return String(item.jumlahGuru || 0);
      case 'totalRombongan': return String((item.jumlahPeserta || 0) + (item.jumlahGuru || 0));
      case 'tanggalPelaksanaan': return item.tanggalPelaksanaan || '';
      case 'waktuMulai': return item.waktuMulai || '08:30';
      case 'waktuSelesai': return item.waktuSelesai || '12:00';
      case 'tempatPenyelenggaraan': return item.tempatPenyelenggaraan || 'Bale Sawala';
      case 'skemaPaket': return item.skemaPaket || '';
      case 'pilihanKunjungan': return item.pilihanKunjungan || '';
      case 'fakultasTujuan': return (item.fakultasTujuan || []).join('; ') || '-';
      case 'statusKunjungan': return item.statusKunjungan || 'Dikonfirmasi';
      case 'statusBayar': return item.statusBayar || 'Belum';
      case 'nominalTransfer': return String(item.nominalTransfer || 0);
      case 'tanggalTransfer': return item.tanggalTransfer || '-';
      case 'rekening': return item.rekening || '';
      case 'catatanTambahan': return item.catatanTambahan || '-';
      default: return '';
    }
  };

  // Handle Export File Generation
  const handleExport = () => {
    setExportNotice(null);
    if (selectedColumns.length === 0) {
      setExportNotice({ message: 'Pilih minimal satu kolom untuk diexport.', type: 'error' });
      return;
    }

    if (filteredData.length === 0) {
      setExportNotice({ message: 'Tidak ada data kunjungan Eduventure yang sesuai dengan filter.', type: 'error' });
      return;
    }

    // 1. Handle Print Mode
    if (exportFormat === 'print') {
      handlePrintReport();
      return;
    }

    // 2. Handle CSV / Excel File Download
    const activeColDefs = EDUVENTURE_EXPORT_COLUMNS.filter(c => selectedColumns.includes(c.id));
    const headers = activeColDefs.map(c => c.label);

    const rows = filteredData.map(item => {
      return activeColDefs.map(col => getColumnValue(item, col.id));
    });

    const now = new Date();
    const dateStr = now.toISOString().replace(/[-:T]/g, '').substring(0, 14);

    if (exportFormat === 'xlsx') {
      const xlsContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Data Eduventure</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        </head>
        <body>
          <table border="1">
            <thead>
              <tr style="background-color: #002B66; color: #FFFFFF; font-weight: bold;">
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `<tr>${r.map(v => `<td style="mso-number-format:'\\@';">${String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      const blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Rekap_Eduventure_Unpad_${dateStr}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportNotice({ message: `File Excel (${filteredData.length} baris) berhasil diunduh!`, type: 'success' });
      return;
    }

    const filename = `Rekap_Eduventure_Unpad_${dateStr}.csv`;
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(v => `"${v.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportNotice({ message: `File CSV (${filteredData.length} baris) berhasil diunduh!`, type: 'success' });
  };

  // Handle Printable Official Document without window.open
  const handlePrintReport = () => {
    const activeColDefs = EDUVENTURE_EXPORT_COLUMNS.filter(c => selectedColumns.includes(c.id));

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>Rekapitulasi Kunjungan Kampus Eduventure - Universitas Padjadjaran</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; margin: 30px; color: #111; font-size: 11pt; line-height: 1.4; }
          .kop { display: flex; align-items: center; justify-content: center; border-bottom: 3px double #002B66; padding-bottom: 12px; margin-bottom: 20px; }
          .kop-text { text-align: center; }
          .kop-text h2 { margin: 0; font-size: 14pt; color: #002B66; text-transform: uppercase; font-weight: bold; }
          .kop-text h3 { margin: 3px 0; font-size: 12pt; color: #111; font-weight: bold; }
          .kop-text p { margin: 0; font-size: 9pt; color: #444; }
          .title { text-align: center; margin: 15px 0; font-weight: bold; font-size: 13pt; text-transform: uppercase; color: #002B66; }
          .summary-box { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px 15px; margin-bottom: 15px; font-size: 10pt; font-family: sans-serif; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9pt; }
          th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
          th { background-color: #002B66; color: #fff; font-weight: bold; text-align: center; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .signature-section { margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid; font-size: 10pt; }
          .signature-box { text-align: center; width: 250px; }
          @media print {
            body { margin: 15mm; }
            th { background-color: #002B66 !important; color: white !important; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="kop">
          <div class="kop-text">
            <h2>UNIVERSITAS PADJADJARAN</h2>
            <h3>DIREKTORAT PENDIDIKAN NON GELAR & KERJASAMA STRATEGIS</h3>
            <p>Jalan Dipati Ukur No. 35 Bandung 40132 / Jalan Raya Bandung-Sumedang Km. 21 Jatinangor</p>
            <p>Laman: dpng.unpad.ac.id • Pos-el: eduventure@unpad.ac.id</p>
          </div>
        </div>

        <div class="title">
          LAPORAN REKAPITULASI KUNJUNGAN KAMPUS EDUVENTURE
        </div>

        <div class="summary-box">
          <div><strong>Total Kunjungan:</strong> ${filteredData.length} Sekolah</div>
          <div><strong>Total Siswa:</strong> ${stats.totalSiswa.toLocaleString('id-ID')} Orang</div>
          <div><strong>Total Guru:</strong> ${stats.totalGuru.toLocaleString('id-ID')} Orang</div>
          <div><strong>Total Realisasi VA:</strong> ${formatRupiah(stats.totalNominal)}</div>
          <div><strong>Status Lunas:</strong> ${stats.lunasCount} (${stats.persenLunas}%)</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25px;">No</th>
              ${activeColDefs.map(c => `<th>${c.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${filteredData.map((item, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                ${activeColDefs.map(c => {
                  const val = getColumnValue(item, c.id).replace(/^'/, '');
                  const isNum = ['jumlahPeserta', 'jumlahGuru', 'totalRombongan'].includes(c.id);
                  const isNominal = c.id === 'nominalTransfer';
                  return `<td class="${isNum ? 'text-center' : isNominal ? 'text-right' : ''}">${isNominal ? formatRupiah(item.nominalTransfer || 0) : val}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="signature-section">
          <div class="signature-box">
            <p>Mengetahui,<br><strong>Koordinator Program Eduventure</strong></p>
            <br><br><br>
            <p><strong>( ............................................ )</strong><br>NIP. ........................................</p>
          </div>
          <div class="signature-box">
            <p>Jatinangor, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br><strong>Staf Verifikasi & Keuangan</strong></p>
            <br><br><br>
            <p><strong>( ............................................ )</strong><br>NIP. ........................................</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    document.body.appendChild(printIframe);
    const doc = printIframe.contentWindow?.document || printIframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        printIframe.contentWindow?.focus();
        printIframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(printIframe)) {
            document.body.removeChild(printIframe);
          }
        }, 2000);
      }, 400);
      setExportNotice({ message: 'Dialog cetak dokumen laporan Eduventure telah disiapkan!', type: 'success' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#002B66] via-[#003882] to-[#001D45] text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 text-[#FDB913]">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Export & Rekapitulasi Data Eduventure</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Unduh rekapitulasi data kunjungan sekolah, rombongan, dan realisasi Virtual Account BNI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
          
          {exportNotice && (
            <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold ${
              exportNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}>
              <div className="flex items-center gap-2">
                {exportNotice.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{exportNotice.message}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setExportNotice(null)} 
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Metrics Live Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[11px] text-slate-500 block">Kunjungan Sekolah</span>
              <span className="text-base font-extrabold text-[#002B66] block mt-0.5">
                {stats.totalKunjungan} <span className="text-xs font-normal text-slate-500">Sekolah</span>
              </span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <span className="text-[11px] text-blue-700 block">Total Siswa</span>
              <span className="text-base font-extrabold text-blue-900 block mt-0.5">
                {stats.totalSiswa.toLocaleString('id-ID')} <span className="text-xs font-normal text-blue-700">Org</span>
              </span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <span className="text-[11px] text-amber-700 block">Total Guru</span>
              <span className="text-base font-extrabold text-amber-900 block mt-0.5">
                {stats.totalGuru.toLocaleString('id-ID')} <span className="text-xs font-normal text-amber-700">Org</span>
              </span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 sm:col-span-2">
              <span className="text-[11px] text-emerald-700 block">Total Realisasi VA</span>
              <span className="text-base font-extrabold text-emerald-900 block mt-0.5 truncate" title={formatRupiah(stats.totalNominal)}>
                {formatRupiah(stats.totalNominal)}
              </span>
            </div>
          </div>

          {/* Bagian 1: Kriteria Penyaringan Data (Filters) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Filter className="w-4 h-4 text-[#002B66]" />
                <span>1. Filter & Kriteria Penyaringan</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Cocok: <strong>{filteredData.length} data</strong> dari total {eduventureList.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Filter Tahun */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tahun Pelaksanaan</label>
                <select
                  value={filterTahun}
                  onChange={(e) => setFilterTahun(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  <option value="ALL">Semua Tahun</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>

              {/* Filter Skema Paket */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Skema Paket</label>
                <select
                  value={filterSkema}
                  onChange={(e) => setFilterSkema(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  <option value="ALL">Semua Paket</option>
                  <option value="Eduventure Lite">Eduventure Lite</option>
                  <option value="Eduventure Experience">Eduventure Experience</option>
                  <option value="Eduventure Tematik">Eduventure Tematik</option>
                </select>
              </div>

              {/* Filter Status Bayar */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status Pembayaran</label>
                <select
                  value={filterStatusBayar}
                  onChange={(e) => setFilterStatusBayar(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="Lunas">Lunas (Terverifikasi)</option>
                  <option value="Belum">Belum Bayar</option>
                  <option value="Verifikasi">Perlu Verifikasi</option>
                </select>
              </div>

              {/* Filter Rekening VA */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rekening VA</label>
                <select
                  value={filterRekening}
                  onChange={(e) => setFilterRekening(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  <option value="ALL">Semua Rekening</option>
                  <option value="Eduventure 9882340560200004">BNI Eduventure (...0004)</option>
                  <option value="Luhung 9880619020200219">BNI Luhung (...0219)</option>
                </select>
              </div>

              {/* Filter Rentang Tanggal Mulai */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dari Tanggal</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>

              {/* Filter Rentang Tanggal Selesai */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sampai Tanggal</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>

              {/* Pencarian Teks */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Cari Sekolah / PIC / Tempat</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ketik nama sekolah, guru PIC, atau tempat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bagian 2: Pilihan Format Ekspor */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileSpreadsheet className="w-4 h-4 text-[#002B66]" />
              <span>2. Pilih Format Hasil Ekspor</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                exportFormat === 'csv' ? 'border-[#002B66] bg-[#002B66]/5 font-bold shadow-xs' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="format_edv"
                  checked={exportFormat === 'csv'}
                  onChange={() => setExportFormat('csv')}
                  className="mt-0.5 accent-[#002B66]"
                />
                <div>
                  <span className="block text-slate-800 font-bold">CSV Spreadsheet (.csv)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Kompatibel penuh Excel & Google Sheets (UTF-8 BOM)</span>
                </div>
              </label>

              <label className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                exportFormat === 'xlsx' ? 'border-[#002B66] bg-[#002B66]/5 font-bold shadow-xs' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="format_edv"
                  checked={exportFormat === 'xlsx'}
                  onChange={() => setExportFormat('xlsx')}
                  className="mt-0.5 accent-[#002B66]"
                />
                <div>
                  <span className="block text-slate-800 font-bold">Excel Format (.xlsx)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Format spreadsheet standar untuk arsip kantor</span>
                </div>
              </label>

              <label className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                exportFormat === 'print' ? 'border-amber-500 bg-amber-50/70 font-bold shadow-xs' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="format_edv"
                  checked={exportFormat === 'print'}
                  onChange={() => setExportFormat('print')}
                  className="mt-0.5 accent-amber-600"
                />
                <div>
                  <span className="block text-slate-800 font-bold">Cetak Rekap Resmi (PDF/Print)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Kop surat Unpad resmi, format tabel & kolom tanda tangan</span>
                </div>
              </label>
            </div>
          </div>

          {/* Bagian 3: Pilih Kolom Ekspor */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#002B66]" />
                  <span>3. Pilih Kolom Data Eduventure</span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  {selectedColumns.length} dari {EDUVENTURE_EXPORT_COLUMNS.length} kolom terpilih
                </span>
              </div>

              {/* Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset('all')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
                >
                  Semua Kolom
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('operasional')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-semibold transition-colors"
                >
                  Operasional & Lokasi
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('keuangan')}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-semibold transition-colors"
                >
                  Keuangan & VA
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('kontak')}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[11px] font-semibold transition-colors"
                >
                  Kontak Sekolah
                </button>
              </div>
            </div>

            {/* Column Checkboxes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {EDUVENTURE_EXPORT_COLUMNS.map(col => {
                const isChecked = selectedColumns.includes(col.id);
                return (
                  <label
                    key={col.id}
                    onClick={() => toggleColumn(col.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-colors ${
                      isChecked 
                        ? 'border-[#002B66]/40 bg-[#002B66]/5 font-semibold text-slate-800' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-3.5 h-3.5 text-[#002B66] shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className="truncate">{col.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Pratinjau 3 Baris Teratas */}
          {filteredData.length > 0 && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">
                Pratinjau Data (Contoh 3 Baris Pertama):
              </span>
              <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                      <th className="p-2">ID</th>
                      <th className="p-2">Nama Sekolah</th>
                      <th className="p-2">Tgl Pelaksanaan</th>
                      <th className="p-2">Paket</th>
                      <th className="p-2">Siswa</th>
                      <th className="p-2">Status Bayar</th>
                      <th className="p-2 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.slice(0, 3).map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-2 font-mono text-[10px] text-slate-500">{item.id}</td>
                        <td className="p-2 font-bold text-[#002B66]">{item.namaSekolah}</td>
                        <td className="p-2 font-mono">{item.tanggalPelaksanaan}</td>
                        <td className="p-2">{item.skemaPaket}</td>
                        <td className="p-2 text-center">{item.jumlahPeserta}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.statusBayar === 'Sudah' || (item.statusBayar as string) === 'Lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.statusBayar}
                          </span>
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-800">
                          {formatRupiah(item.nominalTransfer || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-slate-600 text-[11px]">
            Siap mengekspor <strong>{filteredData.length} baris data</strong> ({selectedColumns.length} kolom dipilih).
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={filteredData.length === 0 || selectedColumns.length === 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#002B66] hover:bg-[#001D45] text-white font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {exportFormat === 'print' ? (
                <>
                  <Printer className="w-4 h-4 text-[#FDB913]" />
                  <span>Cetak Laporan Rekap</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-[#FDB913]" />
                  <span>Unduh File {exportFormat.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
