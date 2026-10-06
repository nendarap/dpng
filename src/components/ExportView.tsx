import React, { useState, useMemo } from 'react';
import { 
  Download, FileSpreadsheet, CheckSquare, Square, 
  Calendar, Layers, Filter, CheckCircle2, AlertCircle, Users, Compass, 
  Printer, Search, DollarSign, CreditCard, Building2, 
  Sparkles, Clock, MapPin, Phone, Mail, School
} from 'lucide-react';
import { Peserta, Kategori, Program, EduventureBooking } from '../types';
import { EDUVENTURE_EXPORT_COLUMNS } from './EduventureExportModal';

interface ExportViewProps {
  pesertaList: Peserta[];
  kategoriList: Kategori[];
  programList: Program[];
  eduventureList?: EduventureBooking[];
}

interface ColumnOption {
  id: string;
  label: string;
}

const AVAILABLE_PESERTA_COLUMNS: ColumnOption[] = [
  { id: 'id', label: 'ID Peserta (DPNG)' },
  { id: 'nomorRegistrasi', label: 'Nomor Registrasi' },
  { id: 'namaLengkap', label: 'Nama Lengkap' },
  { id: 'gelarDepan', label: 'Gelar Depan' },
  { id: 'gelarBelakang', label: 'Gelar Belakang' },
  { id: 'nik', label: 'NIK KTP' },
  { id: 'nip', label: 'NIP / NUPTK' },
  { id: 'jenisKelamin', label: 'Jenis Kelamin' },
  { id: 'tempatLahir', label: 'Tempat Lahir' },
  { id: 'tanggalLahir', label: 'Tanggal Lahir' },
  { id: 'email', label: 'Email' },
  { id: 'nomorHp', label: 'Nomor HP' },
  { id: 'alamat', label: 'Alamat' },
  { id: 'kotaKabupaten', label: 'Kota / Kabupaten' },
  { id: 'provinsi', label: 'Provinsi' },
  { id: 'instansi', label: 'Instansi' },
  { id: 'jabatan', label: 'Jabatan' },
  { id: 'fakultasUnit', label: 'Fakultas / Unit' },
  { id: 'pendidikanTerakhir', label: 'Pendidikan Terakhir' },
  { id: 'kategoriProgram', label: 'Kategori Program' },
  { id: 'namaProgram', label: 'Nama Program' },
  { id: 'angkatanBatch', label: 'Angkatan / Batch' },
  { id: 'tahun', label: 'Tahun' },
  { id: 'tanggalMulai', label: 'Tanggal Mulai' },
  { id: 'tanggalSelesai', label: 'Tanggal Selesai' },
  { id: 'statusPeserta', label: 'Status Peserta' },
  { id: 'statusKelulusan', label: 'Status Kelulusan' },
  { id: 'nomorSertifikat', label: 'Nomor Sertifikat' },
  { id: 'nilaiSkor', label: 'Nilai / Predikat' },
  { id: 'biayaProgram', label: 'Biaya Program' },
  { id: 'sumberDana', label: 'Sumber Dana' },
  { id: 'pic', label: 'PIC' },
  { id: 'keterangan', label: 'Keterangan' },
];

export const ExportView: React.FC<ExportViewProps> = ({
  pesertaList,
  kategoriList,
  programList,
  eduventureList = [],
}) => {
  // Main Tab State: 'peserta' or 'eduventure'
  const [activeExportTab, setActiveExportTab] = useState<'peserta' | 'eduventure'>('peserta');
  const [exportNotice, setExportNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ==========================================
  // STATE: EXPORT PESERTA NON GELAR
  // ==========================================
  const [filterTahun, setFilterTahun] = useState('ALL');
  const [filterKategori, setFilterKategori] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterKelulusan, setFilterKelulusan] = useState('ALL');
  const [exportFormatPeserta, setExportFormatPeserta] = useState<'csv' | 'xlsx'>('csv');

  const [selectedPesertaColumns, setSelectedPesertaColumns] = useState<string[]>(
    AVAILABLE_PESERTA_COLUMNS.map(c => c.id)
  );

  const toggleSelectAllPeserta = () => {
    if (selectedPesertaColumns.length === AVAILABLE_PESERTA_COLUMNS.length) {
      setSelectedPesertaColumns([]);
    } else {
      setSelectedPesertaColumns(AVAILABLE_PESERTA_COLUMNS.map(c => c.id));
    }
  };

  const togglePesertaColumn = (id: string) => {
    if (selectedPesertaColumns.includes(id)) {
      setSelectedPesertaColumns(selectedPesertaColumns.filter(c => c !== id));
    } else {
      setSelectedPesertaColumns([...selectedPesertaColumns, id]);
    }
  };

  const filteredPesertaData = useMemo(() => {
    return pesertaList.filter(p => {
      if (filterTahun !== 'ALL' && String(p.tahun) !== filterTahun) return false;
      if (filterKategori !== 'ALL' && p.kategoriProgram !== filterKategori) return false;
      if (filterStatus !== 'ALL' && p.statusPeserta !== filterStatus) return false;
      if (filterKelulusan !== 'ALL' && p.statusKelulusan !== filterKelulusan) return false;
      return true;
    });
  }, [pesertaList, filterTahun, filterKategori, filterStatus, filterKelulusan]);

  const handleExportPeserta = () => {
    setExportNotice(null);
    if (selectedPesertaColumns.length === 0) {
      setExportNotice({ message: 'Pilih minimal satu kolom untuk diexport.', type: 'error' });
      return;
    }

    if (filteredPesertaData.length === 0) {
      setExportNotice({ message: 'Tidak ada data peserta yang sesuai dengan kriteria filter.', type: 'error' });
      return;
    }

    const activeColDefs = AVAILABLE_PESERTA_COLUMNS.filter(c => selectedPesertaColumns.includes(c.id));
    const headers = activeColDefs.map(c => c.label);

    const rows = filteredPesertaData.map(p => {
      return activeColDefs.map(c => {
        const val = (p as any)[c.id];
        return val !== undefined && val !== null ? String(val) : '';
      });
    });

    const now = new Date();
    const dateStr = now.toISOString().replace(/[-:T]/g, '').substring(0, 14);

    if (exportFormatPeserta === 'xlsx') {
      const xlsContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Data Peserta</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
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
      link.download = `SIMPENDIK_UNPAD_Data_Peserta_${dateStr}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportNotice({ message: `File Excel Data Peserta (${filteredPesertaData.length} baris) berhasil diunduh!`, type: 'success' });
      return;
    }

    const filename = `SIMPENDIK_UNPAD_Data_Peserta_${dateStr}.csv`;
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
    setExportNotice({ message: `File CSV Data Peserta (${filteredPesertaData.length} baris) berhasil diunduh!`, type: 'success' });
  };

  // ==========================================
  // STATE: EXPORT EDUVENTURE
  // ==========================================
  const [filterEdvTahun, setFilterEdvTahun] = useState('ALL');
  const [filterEdvSkema, setFilterEdvSkema] = useState('ALL');
  const [filterEdvStatusBayar, setFilterEdvStatusBayar] = useState('ALL');
  const [filterEdvRekening, setFilterEdvRekening] = useState('ALL');
  const [filterEdvStartDate, setFilterEdvStartDate] = useState('');
  const [filterEdvEndDate, setFilterEdvEndDate] = useState('');
  const [searchEdvQuery, setSearchEdvQuery] = useState('');
  const [exportFormatEdv, setExportFormatEdv] = useState<'csv' | 'xlsx' | 'print'>('csv');

  const [selectedEdvColumns, setSelectedEdvColumns] = useState<string[]>(
    EDUVENTURE_EXPORT_COLUMNS.map(c => c.id)
  );

  const applyEdvPreset = (preset: 'all' | 'operasional' | 'keuangan' | 'kontak') => {
    switch (preset) {
      case 'all':
        setSelectedEdvColumns(EDUVENTURE_EXPORT_COLUMNS.map(c => c.id));
        break;
      case 'operasional':
        setSelectedEdvColumns([
          'id', 'namaSekolah', 'tanggalPelaksanaan', 'waktuMulai', 'waktuSelesai', 
          'tempatPenyelenggaraan', 'skemaPaket', 'jumlahPeserta', 'jumlahGuru', 
          'totalRombongan', 'kontakPerson', 'nomorKontak', 'statusKunjungan'
        ]);
        break;
      case 'keuangan':
        setSelectedEdvColumns([
          'id', 'namaSekolah', 'tanggalPelaksanaan', 'skemaPaket', 
          'statusBayar', 'nominalTransfer', 'tanggalTransfer', 'rekening', 'catatanTambahan'
        ]);
        break;
      case 'kontak':
        setSelectedEdvColumns([
          'id', 'namaSekolah', 'alamat', 'kontakPerson', 'nomorKontak', 
          'emailKontak', 'jumlahPeserta', 'jumlahGuru', 'skemaPaket'
        ]);
        break;
    }
  };

  const toggleEdvColumn = (id: string) => {
    if (selectedEdvColumns.includes(id)) {
      setSelectedEdvColumns(selectedEdvColumns.filter(c => c !== id));
    } else {
      setSelectedEdvColumns([...selectedEdvColumns, id]);
    }
  };

  const filteredEdvData = useMemo(() => {
    return eduventureList.filter(item => {
      if (filterEdvTahun !== 'ALL') {
        const itemYear = (item.tanggalPelaksanaan || '').substring(0, 4);
        if (itemYear !== filterEdvTahun) return false;
      }
      if (filterEdvSkema !== 'ALL' && item.skemaPaket !== filterEdvSkema) return false;
      if (filterEdvStatusBayar !== 'ALL' && item.statusBayar !== filterEdvStatusBayar) return false;
      if (filterEdvRekening !== 'ALL' && item.rekening !== filterEdvRekening) return false;
      
      if (filterEdvStartDate && item.tanggalPelaksanaan && item.tanggalPelaksanaan < filterEdvStartDate) {
        return false;
      }
      if (filterEdvEndDate && item.tanggalPelaksanaan && item.tanggalPelaksanaan > filterEdvEndDate) {
        return false;
      }

      if (searchEdvQuery.trim()) {
        const q = searchEdvQuery.toLowerCase();
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
  }, [eduventureList, filterEdvTahun, filterEdvSkema, filterEdvStatusBayar, filterEdvRekening, filterEdvStartDate, filterEdvEndDate, searchEdvQuery]);

  const edvStats = useMemo(() => {
    let totalSiswa = 0;
    let totalGuru = 0;
    let totalNominal = 0;
    let lunasCount = 0;

    filteredEdvData.forEach(item => {
      totalSiswa += item.jumlahPeserta || 0;
      totalGuru += item.jumlahGuru || 0;
      totalNominal += item.nominalTransfer || 0;
      if (item.statusBayar === 'Sudah' || (item.statusBayar as string) === 'Lunas') lunasCount++;
    });

    return {
      totalKunjungan: filteredEdvData.length,
      totalSiswa,
      totalGuru,
      totalRombongan: totalSiswa + totalGuru,
      totalNominal,
      lunasCount,
      persenLunas: filteredEdvData.length > 0 ? Math.round((lunasCount / filteredEdvData.length) * 100) : 0
    };
  }, [filteredEdvData]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const getEdvColumnValue = (item: EduventureBooking, colId: string): string => {
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

  const handleExportEduventure = () => {
    setExportNotice(null);
    if (selectedEdvColumns.length === 0) {
      setExportNotice({ message: 'Pilih minimal satu kolom untuk diexport.', type: 'error' });
      return;
    }

    if (filteredEdvData.length === 0) {
      setExportNotice({ message: 'Tidak ada data kunjungan Eduventure yang sesuai dengan filter.', type: 'error' });
      return;
    }

    if (exportFormatEdv === 'print') {
      handlePrintEduventureReport();
      return;
    }

    const activeColDefs = EDUVENTURE_EXPORT_COLUMNS.filter(c => selectedEdvColumns.includes(c.id));
    const headers = activeColDefs.map(c => c.label);

    const rows = filteredEdvData.map(item => {
      return activeColDefs.map(col => getEdvColumnValue(item, col.id));
    });

    const now = new Date();
    const dateStr = now.toISOString().replace(/[-:T]/g, '').substring(0, 14);

    if (exportFormatEdv === 'xlsx') {
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
      setExportNotice({ message: `File Excel Data Eduventure (${filteredEdvData.length} baris) berhasil diunduh!`, type: 'success' });
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
    setExportNotice({ message: `File CSV Data Eduventure (${filteredEdvData.length} baris) berhasil diunduh!`, type: 'success' });
  };

  const handlePrintEduventureReport = () => {
    const activeColDefs = EDUVENTURE_EXPORT_COLUMNS.filter(c => selectedEdvColumns.includes(c.id));

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>Rekapitulasi Kunjungan Eduventure - Universitas Padjadjaran</title>
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
            <p>Jalan Dipati Ukur No. 35 Bandung 40132 / Kampus Jatinangor Sumedang</p>
            <p>Laman: dpng.unpad.ac.id • Pos-el: eduventure@unpad.ac.id</p>
          </div>
        </div>

        <div class="title">
          LAPORAN REKAPITULASI RESMI DATA KUNJUNGAN EDUVENTURE
        </div>

        <div class="summary-box">
          <div><strong>Total Kunjungan:</strong> ${edvStats.totalKunjungan} Sekolah</div>
          <div><strong>Total Siswa:</strong> ${edvStats.totalSiswa.toLocaleString('id-ID')} Orang</div>
          <div><strong>Total Guru:</strong> ${edvStats.totalGuru.toLocaleString('id-ID')} Orang</div>
          <div><strong>Total Realisasi VA:</strong> ${formatRupiah(edvStats.totalNominal)}</div>
          <div><strong>Status Lunas:</strong> ${edvStats.lunasCount} (${edvStats.persenLunas}%)</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25px;">No</th>
              ${activeColDefs.map(c => `<th>${c.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${filteredEdvData.map((item, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                ${activeColDefs.map(c => {
                  const val = getEdvColumnValue(item, c.id).replace(/^'/, '');
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
      setExportNotice({ message: 'Dialog pencetakan laporan Eduventure telah disiapkan!', type: 'success' });
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Alert Feedback */}
      {exportNotice && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-xs ${
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
            ✕
          </button>
        </div>
      )}

      {/* Header Banner & Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-[#002B66]">
            {activeExportTab === 'peserta' ? 'Export Data Peserta Non Gelar' : 'Export Data Eduventure (Kunjungan Kampus)'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeExportTab === 'peserta' 
              ? 'Unduh rekapan data peserta pelatihan dalam format Excel atau CSV dengan pemilihan kolom fleksibel'
              : 'Unduh rekapan kunjungan sekolah, rombongan siswa/guru, dan realisasi Virtual Account BNI Eduventure'}
          </p>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 self-stretch sm:self-auto">
          <button
            type="button"
            id="tab-export-peserta"
            onClick={() => setActiveExportTab('peserta')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeExportTab === 'peserta'
                ? 'bg-[#002B66] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#FDB913]" />
            <span>Data Peserta ({pesertaList.length})</span>
          </button>

          <button
            type="button"
            id="tab-export-eduventure"
            onClick={() => setActiveExportTab('eduventure')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeExportTab === 'eduventure'
                ? 'bg-[#002B66] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Data Eduventure ({eduventureList.length})</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODE 1: EXPORT DATA PESERTA NON GELAR */}
      {/* ==================================================== */}
      {activeExportTab === 'peserta' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Kiri: Filter Ekspor & Format */}
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
              <h2 className="font-bold text-[#002B66] flex items-center gap-2 border-b border-slate-100 pb-2">
                <Filter className="w-4 h-4 text-[#002B66]" />
                <span>1. Kriteria Penyaringan Data Peserta</span>
              </h2>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tahun Pelaksanaan</label>
                <select
                  value={filterTahun}
                  onChange={(e) => setFilterTahun(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium"
                >
                  <option value="ALL">Semua Tahun</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori Program</label>
                <select
                  value={filterKategori}
                  onChange={(e) => setFilterKategori(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium"
                >
                  <option value="ALL">Semua Kategori</option>
                  {kategoriList.map(k => (
                    <option key={k.idKategori} value={k.namaKategori}>{k.namaKategori}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Peserta</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="Terdaftar">Terdaftar</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Lulus">Lulus</option>
                  <option value="Tidak Lulus">Tidak Lulus</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Kelulusan</label>
                <select
                  value={filterKelulusan}
                  onChange={(e) => setFilterKelulusan(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium"
                >
                  <option value="ALL">Semua Kelulusan</option>
                  <option value="Lulus">Lulus</option>
                  <option value="Dalam Proses">Dalam Proses</option>
                  <option value="Belum Evaluasi">Belum Evaluasi</option>
                  <option value="Tidak Lulus">Tidak Lulus</option>
                </select>
              </div>
            </div>

            {/* Format File */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
              <h2 className="font-bold text-[#002B66] flex items-center gap-2 border-b border-slate-100 pb-2">
                <FileSpreadsheet className="w-4 h-4 text-[#002B66]" />
                <span>2. Pilih Format Berkas</span>
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 ${
                  exportFormatPeserta === 'csv' ? 'border-[#002B66] bg-[#002B66]/5 font-bold' : 'border-slate-200'
                }`}>
                  <input
                    type="radio"
                    name="format_peserta"
                    checked={exportFormatPeserta === 'csv'}
                    onChange={() => setExportFormatPeserta('csv')}
                  />
                  <span>CSV File (.csv)</span>
                </label>

                <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 ${
                  exportFormatPeserta === 'xlsx' ? 'border-[#002B66] bg-[#002B66]/5 font-bold' : 'border-slate-200'
                }`}>
                  <input
                    type="radio"
                    name="format_peserta"
                    checked={exportFormatPeserta === 'xlsx'}
                    onChange={() => setExportFormatPeserta('xlsx')}
                  />
                  <span>Excel Spreadsheet</span>
                </label>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-slate-600 text-[11px] leading-relaxed">
                Total <strong>{filteredPesertaData.length} data peserta</strong> terpilih sesuai filter. File otomatis menyertakan tanda UTF-8 BOM untuk kompatibilitas Microsoft Excel.
              </div>

              <button
                id="btn-trigger-export-peserta"
                onClick={handleExportPeserta}
                disabled={filteredPesertaData.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#002B66] hover:bg-[#083a7e] text-white font-bold rounded-lg shadow-md transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#FDB913]" />
                <span>Download Berkas Peserta Sekarang</span>
              </button>
            </div>
          </div>

          {/* Kolom Kanan: Pilihan Kolom Ekspor Peserta */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xs font-bold text-[#002B66] uppercase tracking-wider">
                  3. Pilih Kolom Data Peserta
                </h2>
                <p className="text-[11px] text-slate-500">
                  {selectedPesertaColumns.length} dari {AVAILABLE_PESERTA_COLUMNS.length} kolom terpilih
                </p>
              </div>

              <button
                type="button"
                onClick={toggleSelectAllPeserta}
                className="text-xs font-semibold text-[#002B66] hover:underline cursor-pointer"
              >
                {selectedPesertaColumns.length === AVAILABLE_PESERTA_COLUMNS.length ? 'Batal Pilih Semua' : 'Pilih Semua Kolom'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {AVAILABLE_PESERTA_COLUMNS.map(col => {
                const isChecked = selectedPesertaColumns.includes(col.id);
                return (
                  <label 
                    key={col.id} 
                    onClick={() => togglePesertaColumn(col.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
                      isChecked ? 'border-[#002B66]/40 bg-[#002B66]/5 font-medium' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-[#002B66] shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="text-slate-700">{col.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODE 2: EXPORT DATA EDUVENTURE */}
      {/* ==================================================== */}
      {activeExportTab === 'eduventure' && (
        <div className="space-y-6">
          {/* Eduventure Live Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[11px] text-slate-500 block">Kunjungan Sekolah</span>
              <span className="text-lg font-extrabold text-[#002B66] block mt-0.5">
                {edvStats.totalKunjungan} <span className="text-xs font-normal text-slate-500">Sekolah</span>
              </span>
            </div>
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[11px] text-blue-700 block">Total Siswa</span>
              <span className="text-lg font-extrabold text-blue-900 block mt-0.5">
                {edvStats.totalSiswa.toLocaleString('id-ID')} <span className="text-xs font-normal text-blue-700">Org</span>
              </span>
            </div>
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[11px] text-amber-700 block">Total Guru</span>
              <span className="text-lg font-extrabold text-amber-900 block mt-0.5">
                {edvStats.totalGuru.toLocaleString('id-ID')} <span className="text-xs font-normal text-amber-700">Org</span>
              </span>
            </div>
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 shadow-xs sm:col-span-2">
              <span className="text-[11px] text-emerald-700 block">Total Realisasi VA</span>
              <span className="text-lg font-extrabold text-emerald-900 block mt-0.5 truncate" title={formatRupiah(edvStats.totalNominal)}>
                {formatRupiah(edvStats.totalNominal)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Kolom Kiri: Filter & Format Eduventure */}
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
                <h2 className="font-bold text-[#002B66] flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Filter className="w-4 h-4 text-[#002B66]" />
                  <span>1. Kriteria Penyaringan Eduventure</span>
                </h2>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun Pelaksanaan</label>
                  <select
                    value={filterEdvTahun}
                    onChange={(e) => setFilterEdvTahun(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium"
                  >
                    <option value="ALL">Semua Tahun</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Skema Paket</label>
                  <select
                    value={filterEdvSkema}
                    onChange={(e) => setFilterEdvSkema(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium"
                  >
                    <option value="ALL">Semua Paket</option>
                    <option value="Eduventure Lite">Eduventure Lite</option>
                    <option value="Eduventure Experience">Eduventure Experience</option>
                    <option value="Eduventure Tematik">Eduventure Tematik</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Pembayaran</label>
                  <select
                    value={filterEdvStatusBayar}
                    onChange={(e) => setFilterEdvStatusBayar(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium"
                  >
                    <option value="ALL">Semua Status Bayar</option>
                    <option value="Lunas">Lunas (Terverifikasi)</option>
                    <option value="Belum">Belum Bayar</option>
                    <option value="Verifikasi">Perlu Verifikasi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rekening VA BNI</label>
                  <select
                    value={filterEdvRekening}
                    onChange={(e) => setFilterEdvRekening(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium"
                  >
                    <option value="ALL">Semua Rekening</option>
                    <option value="Eduventure 9882340560200004">BNI Eduventure (...0004)</option>
                    <option value="Luhung 9880619020200219">BNI Luhung (...0219)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dari Tanggal</label>
                    <input
                      type="date"
                      value={filterEdvStartDate}
                      onChange={(e) => setFilterEdvStartDate(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 bg-slate-50 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sampai Tanggal</label>
                    <input
                      type="date"
                      value={filterEdvEndDate}
                      onChange={(e) => setFilterEdvEndDate(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 bg-slate-50 font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cari Nama Sekolah / PIC</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Nama sekolah, PIC, kontak..."
                      value={searchEdvQuery}
                      onChange={(e) => setSearchEdvQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Format File Eduventure */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
                <h2 className="font-bold text-[#002B66] flex items-center gap-2 border-b border-slate-100 pb-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#002B66]" />
                  <span>2. Pilih Format Berkas</span>
                </h2>

                <div className="space-y-2">
                  <label className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2.5 ${
                    exportFormatEdv === 'csv' ? 'border-[#002B66] bg-[#002B66]/5 font-bold' : 'border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="format_edv_tab"
                      checked={exportFormatEdv === 'csv'}
                      onChange={() => setExportFormatEdv('csv')}
                    />
                    <span>CSV File (.csv - UTF-8 BOM)</span>
                  </label>

                  <label className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2.5 ${
                    exportFormatEdv === 'xlsx' ? 'border-[#002B66] bg-[#002B66]/5 font-bold' : 'border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="format_edv_tab"
                      checked={exportFormatEdv === 'xlsx'}
                      onChange={() => setExportFormatEdv('xlsx')}
                    />
                    <span>Excel Spreadsheet (.xlsx)</span>
                  </label>

                  <label className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2.5 ${
                    exportFormatEdv === 'print' ? 'border-amber-500 bg-amber-50 font-bold' : 'border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="format_edv_tab"
                      checked={exportFormatEdv === 'print'}
                      onChange={() => setExportFormatEdv('print')}
                    />
                    <span>Cetak Laporan Rekap Resmi (PDF/Print)</span>
                  </label>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg text-slate-600 text-[11px] leading-relaxed">
                  Total <strong>{filteredEdvData.length} data kunjungan</strong> terpilih sesuai filter.
                </div>

                <button
                  id="btn-trigger-export-eduventure"
                  onClick={handleExportEduventure}
                  disabled={filteredEdvData.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#002B66] hover:bg-[#083a7e] text-white font-bold rounded-lg shadow-md transition-colors disabled:opacity-40 cursor-pointer"
                >
                  {exportFormatEdv === 'print' ? (
                    <>
                      <Printer className="w-4 h-4 text-[#FDB913]" />
                      <span>Cetak Laporan Rekap Sekarang</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-[#FDB913]" />
                      <span>Download Berkas Eduventure</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Kolom Kanan: Pilihan Kolom Ekspor Eduventure & Pratinjau */}
            <div className="lg:col-span-2 space-y-5">
              {/* Card Pilihan Kolom */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <h2 className="text-xs font-bold text-[#002B66] uppercase tracking-wider">
                      3. Pilih Kolom Data Eduventure
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {selectedEdvColumns.length} dari {EDUVENTURE_EXPORT_COLUMNS.length} kolom terpilih
                    </p>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyEdvPreset('all')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => applyEdvPreset('operasional')}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Operasional
                    </button>
                    <button
                      type="button"
                      onClick={() => applyEdvPreset('keuangan')}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Keuangan
                    </button>
                    <button
                      type="button"
                      onClick={() => applyEdvPreset('kontak')}
                      className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Kontak
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {EDUVENTURE_EXPORT_COLUMNS.map(col => {
                    const isChecked = selectedEdvColumns.includes(col.id);
                    return (
                      <label 
                        key={col.id} 
                        onClick={() => toggleEdvColumn(col.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                          isChecked ? 'border-[#002B66]/40 bg-[#002B66]/5 font-semibold text-slate-800' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
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

              {/* Pratinjau Tabel Eduventure */}
              {filteredEdvData.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800">
                      Pratinjau Data Eduventure (Top 5 Hasil):
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Menampilkan 5 dari {filteredEdvData.length} kunjungan
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                          <th className="p-2.5">ID</th>
                          <th className="p-2.5">Nama Sekolah</th>
                          <th className="p-2.5">Tgl Kunjungan</th>
                          <th className="p-2.5">Paket</th>
                          <th className="p-2.5 text-center">Siswa</th>
                          <th className="p-2.5">Status Bayar</th>
                          <th className="p-2.5 text-right">Nominal Transfer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEdvData.slice(0, 5).map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-2.5 font-mono text-[11px] text-slate-500">{item.id}</td>
                            <td className="p-2.5 font-bold text-[#002B66]">{item.namaSekolah}</td>
                            <td className="p-2.5 font-mono">{item.tanggalPelaksanaan}</td>
                            <td className="p-2.5">{item.skemaPaket}</td>
                            <td className="p-2.5 text-center font-bold">{item.jumlahPeserta}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.statusBayar === 'Sudah' || (item.statusBayar as string) === 'Lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {item.statusBayar}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-800">
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
          </div>
        </div>
      )}
    </div>
  );
};
