import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, 
  Search, Filter, Building2, Users, CheckCircle2, Clock, 
  MapPin, Phone, Eye, Edit2, Sparkles, School, 
  Layers, ArrowUpRight, X, RotateCcw, CalendarDays, ListFilter
} from 'lucide-react';
import { EduventureBooking, UserRole } from '../types';

interface EduventureCalendarViewProps {
  eduventureList: EduventureBooking[];
  tempatList: string[];
  userRole: UserRole;
  onSelectBooking: (booking: EduventureBooking) => void;
  onEditBooking: (booking: EduventureBooking) => void;
  onAddNewBooking: (date?: string) => void;
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_HEADERS = [
  { short: 'Sen', full: 'Senin' },
  { short: 'Sel', full: 'Selasa' },
  { short: 'Rab', full: 'Rabu' },
  { short: 'Kam', full: 'Kamis' },
  { short: 'Jum', full: 'Jumat' },
  { short: 'Sab', full: 'Sabtu' },
  { short: 'Min', full: 'Minggu' }
];

const SKEMA_COLORS: Record<string, { bg: string; text: string; border: string; badge: string; dot: string }> = {
  'Eduventure Lite': {
    bg: 'bg-sky-50 hover:bg-sky-100/80',
    text: 'text-sky-900',
    border: 'border-sky-300',
    badge: 'bg-sky-100 text-sky-800 border-sky-300',
    dot: 'bg-sky-500'
  },
  'Eduventure Experience': {
    bg: 'bg-indigo-50 hover:bg-indigo-100/80',
    text: 'text-indigo-900',
    border: 'border-indigo-300',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    dot: 'bg-indigo-500'
  },
  'Eduventure Tematik': {
    bg: 'bg-emerald-50 hover:bg-emerald-100/80',
    text: 'text-emerald-900',
    border: 'border-emerald-300',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dot: 'bg-emerald-500'
  }
};

function formatIndoDate(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const d = new Date(year, monthIdx, day);
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayName = dayNames[d.getDay()];
  const monthName = MONTH_NAMES_ID[monthIdx] || '';

  return `${dayName}, ${day} ${monthName} ${year}`;
}

function formatShortIndoDate(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const monthShort = MONTH_NAMES_ID[monthIdx]?.substring(0, 3) || '';
  return `${day} ${monthShort} ${year}`;
}

function getWhatsAppUrl(phoneStr?: string): string | null {
  if (!phoneStr) return null;
  const cleaned = phoneStr.replace(/[^\d+]/g, '');
  if (!cleaned) return null;
  let formatted = cleaned;
  if (formatted.startsWith('0')) {
    formatted = '62' + formatted.substring(1);
  } else if (formatted.startsWith('+62')) {
    formatted = formatted.substring(1);
  }
  return `https://wa.me/${formatted}`;
}

export const EduventureCalendarView: React.FC<EduventureCalendarViewProps> = ({
  eduventureList,
  tempatList,
  userRole,
  onSelectBooking,
  onEditBooking,
  onAddNewBooking
}) => {
  // Find initial month: closest month with bookings or today's month
  const initialDate = useMemo(() => {
    const today = new Date();
    if (eduventureList.length === 0) return today;

    // Sort bookings by date
    const sorted = [...eduventureList]
      .filter(b => Boolean(b.tanggalPelaksanaan))
      .sort((a, b) => a.tanggalPelaksanaan.localeCompare(b.tanggalPelaksanaan));

    const todayStr = today.toISOString().substring(0, 10);
    // Find first booking >= today
    const upcoming = sorted.find(b => b.tanggalPelaksanaan >= todayStr);
    if (upcoming) {
      const [y, m, d] = upcoming.tanggalPelaksanaan.split('-').map(Number);
      return new Date(y, m - 1, d || 1);
    }

    // Otherwise use latest booking or today
    const latest = sorted[sorted.length - 1];
    if (latest) {
      const [y, m, d] = latest.tanggalPelaksanaan.split('-').map(Number);
      return new Date(y, m - 1, d || 1);
    }

    return today;
  }, [eduventureList]);

  const [currentYear, setCurrentYear] = useState<number>(() => initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => initialDate.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    // Check if there are bookings today or pick initialDate
    const hasToday = eduventureList.some(b => b.tanggalPelaksanaan === todayStr);
    if (hasToday) return todayStr;
    const sorted = [...eduventureList].sort((a, b) => a.tanggalPelaksanaan.localeCompare(b.tanggalPelaksanaan));
    return sorted[0]?.tanggalPelaksanaan || todayStr;
  });

  const [calendarMode, setCalendarMode] = useState<'grid' | 'timeline'>('grid');

  // Filters
  const [filterPaket, setFilterPaket] = useState<string>('ALL');
  const [filterTempat, setFilterTempat] = useState<string>('ALL');
  const [filterStatusBayar, setFilterStatusBayar] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Year options: past year to next 3 years
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    const base = new Date().getFullYear();
    for (let y = base - 1; y <= base + 3; y++) {
      years.push(y);
    }
    return years;
  }, []);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return eduventureList.filter(item => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          item.namaSekolah.toLowerCase().includes(q) ||
          item.kontakPerson.toLowerCase().includes(q) ||
          item.nomorKontak.toLowerCase().includes(q) ||
          item.skemaPaket.toLowerCase().includes(q) ||
          (item.tempatPenyelenggaraan && item.tempatPenyelenggaraan.toLowerCase().includes(q)) ||
          item.id.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Filter Paket
      if (filterPaket !== 'ALL' && item.skemaPaket !== filterPaket) {
        return false;
      }

      // Filter Tempat
      if (filterTempat !== 'ALL') {
        const itemTempat = item.tempatPenyelenggaraan || 'Bale Sawala';
        if (itemTempat !== filterTempat) return false;
      }

      // Filter Status Bayar
      if (filterStatusBayar !== 'ALL' && item.statusBayar !== filterStatusBayar) {
        return false;
      }

      return true;
    });
  }, [eduventureList, searchQuery, filterPaket, filterTempat, filterStatusBayar]);

  // Bookings mapped by date string "YYYY-MM-DD"
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, EduventureBooking[]>();
    filteredBookings.forEach(item => {
      if (!item.tanggalPelaksanaan) return;
      const existing = map.get(item.tanggalPelaksanaan) || [];
      existing.push(item);
      map.set(item.tanggalPelaksanaan, existing);
    });
    return map;
  }, [filteredBookings]);

  // Month stats
  const monthStats = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const itemsInMonth = filteredBookings.filter(b => b.tanggalPelaksanaan?.startsWith(monthPrefix));
    
    const totalVisits = itemsInMonth.length;
    const totalStudents = itemsInMonth.reduce((acc, curr) => acc + (curr.jumlahPeserta || 0), 0);
    const totalTeachers = itemsInMonth.reduce((acc, curr) => acc + (curr.jumlahGuru || 0), 0);
    const venuesUsed = new Set(itemsInMonth.map(b => b.tempatPenyelenggaraan || 'Bale Sawala'));
    const totalPaid = itemsInMonth.filter(b => b.statusBayar === 'Sudah').length;

    return {
      totalVisits,
      totalStudents,
      totalTeachers,
      venuesCount: venuesUsed.size,
      totalPaid,
      itemsInMonth
    };
  }, [filteredBookings, currentYear, currentMonth]);

  // Calendar cells generation (Monday-first)
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInCurrentMonth = lastDayOfMonth.getDate();

    // Monday is index 0. JS getDay() returns 0 for Sunday, 1 for Monday...
    // Adjust so Monday = 0, Tuesday = 1, ... Sunday = 6
    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6; // Sunday becomes 6

    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    interface CellData {
      dateString: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      items: EduventureBooking[];
    }

    const cells: CellData[] = [];
    const todayStr = new Date().toISOString().substring(0, 10);

    // Leading days from previous month
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateString = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        dateString,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateString === todayStr,
        isSelected: dateString === selectedDate,
        items: bookingsByDate.get(dateString) || []
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateString,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateString === todayStr,
        isSelected: dateString === selectedDate,
        items: bookingsByDate.get(dateString) || []
      });
    }

    // Trailing days to fill 5 or 6 weeks (35 or 42 cells)
    const totalSlots = cells.length > 35 ? 42 : 35;
    const remainingSlots = totalSlots - cells.length;
    for (let d = 1; d <= remainingSlots; d++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateString = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateString,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateString === todayStr,
        isSelected: dateString === selectedDate,
        items: bookingsByDate.get(dateString) || []
      });
    }

    return cells;
  }, [currentYear, currentMonth, selectedDate, bookingsByDate]);

  // Selected date's bookings
  const selectedDateBookings = useMemo(() => {
    return bookingsByDate.get(selectedDate) || [];
  }, [bookingsByDate, selectedDate]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleGoToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(today.toISOString().substring(0, 10));
  };

  const handleJumpNearestBooking = () => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const sorted = [...eduventureList]
      .filter(b => Boolean(b.tanggalPelaksanaan))
      .sort((a, b) => a.tanggalPelaksanaan.localeCompare(b.tanggalPelaksanaan));

    const upcoming = sorted.find(b => b.tanggalPelaksanaan >= todayStr) || sorted[0];
    if (upcoming && upcoming.tanggalPelaksanaan) {
      const [y, m] = upcoming.tanggalPelaksanaan.split('-').map(Number);
      setCurrentYear(y);
      setCurrentMonth(m - 1);
      setSelectedDate(upcoming.tanggalPelaksanaan);
    }
  };

  const hasActiveFilters = filterPaket !== 'ALL' || filterTempat !== 'ALL' || filterStatusBayar !== 'ALL' || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setFilterPaket('ALL');
    setFilterTempat('ALL');
    setFilterStatusBayar('ALL');
    setSearchQuery('');
  };

  return (
    <div id="eduventure-calendar-container" className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#002B66] text-white rounded-xl shadow-md">
              <CalendarDays className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Kalender Agenda Eduventure Unpad
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#002B66] border border-blue-200">
                  {eduventureList.length} Total Kunjungan
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring jadwal kunjungan sekolah, kesiapan tempat (venue/auditorium), paket, dan kapasitas rombongan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle: Grid vs Timeline */}
            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCalendarMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  calendarMode === 'grid'
                    ? 'bg-white text-[#002B66] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan Grid Kalender Bulanan"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Kalender Grid</span>
              </button>

              <button
                type="button"
                onClick={() => setCalendarMode('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  calendarMode === 'timeline'
                    ? 'bg-white text-[#002B66] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan Daftar Agenda Kronologis"
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Timeline Agenda</span>
              </button>
            </div>

            {userRole !== 'VIEWER' && (
              <button
                type="button"
                onClick={() => onAddNewBooking(selectedDate)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#002B66] hover:bg-blue-900 text-white font-semibold rounded-xl text-xs shadow transition-all duration-150 transform hover:-translate-y-0.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Tambah Agenda</span>
              </button>
            )}
          </div>
        </div>

        {/* Month Navigator & Quick Controls */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Month Dropdown */}
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-[#002B66] focus:outline-none focus:ring-2 focus:ring-[#002B66]/20"
            >
              {MONTH_NAMES_ID.map((name, idx) => (
                <option key={idx} value={idx}>{name}</option>
              ))}
            </select>

            {/* Year Dropdown */}
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-[#002B66] focus:outline-none focus:ring-2 focus:ring-[#002B66]/20"
            >
              {yearOptions.map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleGoToday}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors ml-1"
            >
              Bulan Ini
            </button>

            <button
              type="button"
              onClick={handleJumpNearestBooking}
              className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
              title="Lompat ke Jadwal Terdekat"
            >
              Jadwal Terdekat
            </button>
          </div>

          {/* Quick Stats Pill for Selected Month */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500">
              Bulan Ini: <strong className="text-slate-800 font-bold">{monthStats.totalVisits} Agenda</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">
              <strong className="text-slate-800 font-bold">{monthStats.totalStudents.toLocaleString('id-ID')}</strong> Siswa
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">
              <strong className="text-purple-700 font-bold">{monthStats.venuesCount}</strong> Tempat Terpakai
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari sekolah, narahubung, tempat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div>
            <select
              value={filterPaket}
              onChange={(e) => setFilterPaket(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="ALL">Semua Skema Paket</option>
              <option value="Eduventure Lite">Eduventure Lite</option>
              <option value="Eduventure Experience">Eduventure Experience</option>
              <option value="Eduventure Tematik">Eduventure Tematik</option>
            </select>
          </div>

          <div>
            <select
              value={filterTempat}
              onChange={(e) => setFilterTempat(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="ALL">Semua Tempat ({tempatList.length})</option>
              {tempatList.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={filterStatusBayar}
              onChange={(e) => setFilterStatusBayar(e.target.value)}
              className="flex-1 py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="ALL">Status Bayar</option>
              <option value="Sudah">Sudah Bayar</option>
              <option value="Belum">Belum Bayar</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Reset Filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Calendar View Body */}
      {calendarMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Calendar Grid (8 Columns on desktop) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Weekday Header */}
            <div className="grid grid-cols-7 bg-[#002B66] text-white text-center text-xs font-semibold py-2.5 border-b border-blue-900/40">
              {DAY_HEADERS.map((dh) => (
                <div key={dh.short} className="py-1">
                  <span className="hidden sm:inline">{dh.full}</span>
                  <span className="sm:hidden">{dh.short}</span>
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-50/50">
              {calendarCells.map((cell) => {
                const hasItems = cell.items.length > 0;
                const isSelected = cell.dateString === selectedDate;
                const totalStudentsOnDay = cell.items.reduce((sum, item) => sum + (item.jumlahPeserta || 0), 0);

                return (
                  <div
                    key={cell.dateString}
                    onClick={() => setSelectedDate(cell.dateString)}
                    className={`min-h-[96px] sm:min-h-[110px] p-1.5 sm:p-2 transition-all cursor-pointer relative flex flex-col justify-between group ${
                      !cell.isCurrentMonth ? 'bg-slate-50/40 text-slate-400' : 'bg-white text-slate-700'
                    } ${
                      isSelected
                        ? 'ring-2 ring-[#002B66] bg-blue-50/30 z-10'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Top Row: Date Number & Badges */}
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                          cell.isToday
                            ? 'bg-[#002B66] text-white font-bold shadow-sm'
                            : isSelected
                            ? 'bg-blue-200 text-[#002B66] font-bold'
                            : !cell.isCurrentMonth
                            ? 'text-slate-300'
                            : 'text-slate-700 group-hover:text-[#002B66]'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {hasItems && (
                        <span 
                          className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded-full text-[10px] font-bold"
                          title={`${cell.items.length} Kunjungan (${totalStudentsOnDay} Peserta)`}
                        >
                          {cell.items.length}
                        </span>
                      )}
                    </div>

                    {/* Bookings on this Day */}
                    <div className="space-y-1 flex-1 overflow-hidden">
                      {cell.items.slice(0, 2).map((item) => {
                        const style = SKEMA_COLORS[item.skemaPaket] || {
                          bg: 'bg-slate-100',
                          text: 'text-slate-800',
                          border: 'border-slate-300',
                          dot: 'bg-slate-500'
                        };

                        return (
                          <div
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(cell.dateString);
                              onSelectBooking(item);
                            }}
                            className={`p-1 rounded text-[10px] border leading-tight transition-all truncate block shadow-2xs hover:shadow-sm ${style.bg} ${style.border} ${style.text}`}
                            title={`${item.namaSekolah} (${item.skemaPaket} - ${item.tempatPenyelenggaraan || 'Bale Sawala'})`}
                          >
                            <div className="flex items-center gap-1 truncate font-semibold">
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
                              <span className="truncate">{item.namaSekolah}</span>
                            </div>
                            <div className="flex items-center justify-between text-[9px] text-slate-500 mt-0.5 truncate">
                              <span className="truncate text-purple-700 font-medium">
                                {item.tempatPenyelenggaraan || 'Bale Sawala'}
                              </span>
                              <span className="font-mono text-indigo-700 font-semibold flex-shrink-0">
                                {item.waktuMulai || '08:30'}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {cell.items.length > 2 && (
                        <div className="text-[10px] font-bold text-[#002B66] text-center pt-0.5 hover:underline">
                          +{cell.items.length - 2} agenda lainnya
                        </div>
                      )}
                    </div>

                    {/* Quick Add on Hover button if empty or hover */}
                    {userRole !== 'VIEWER' && cell.isCurrentMonth && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-1 right-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddNewBooking(cell.dateString);
                          }}
                          className="w-5 h-5 rounded bg-blue-100 hover:bg-[#002B66] text-[#002B66] hover:text-white flex items-center justify-center text-xs shadow-xs"
                          title={`Tambah agenda pada ${cell.dateString}`}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kategori Paket:</span>
                <span className="inline-flex items-center gap-1.5 text-xs text-sky-800 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  Eduventure Lite
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-indigo-800 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  Eduventure Experience
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  Eduventure Tematik
                </span>
              </div>
              <div className="text-slate-400 text-[11px]">
                *Klik tanggal untuk melihat daftar kunjungan lengkap
              </div>
            </div>
          </div>

          {/* Right Panel: Selected Date Agenda Details (4 Columns on desktop) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Agenda Kunjungan Harian
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {formatIndoDate(selectedDate)}
                  </h3>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  selectedDateBookings.length > 0 
                    ? 'bg-amber-100 text-amber-900' 
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {selectedDateBookings.length} Kunjungan
                </span>
              </div>

              {selectedDateBookings.length === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700">Tidak Ada Agenda</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                      Belum ada jadwal kunjungan sekolah pada tanggal ini.
                    </p>
                  </div>
                  {userRole !== 'VIEWER' && (
                    <button
                      type="button"
                      onClick={() => onAddNewBooking(selectedDate)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-[#002B66] font-semibold rounded-xl text-xs transition-colors border border-blue-200"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Jadwalkan Kunjungan Ini
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                  {selectedDateBookings.map((item) => {
                    const style = SKEMA_COLORS[item.skemaPaket] || {
                      badge: 'bg-slate-100 text-slate-800 border-slate-200'
                    };
                    const waUrl = getWhatsAppUrl(item.nomorKontak);

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all bg-white space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${style.badge}`}>
                              {item.skemaPaket}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-1">
                              {item.namaSekolah}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-400">{item.id}</span>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.statusBayar === 'Sudah'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {item.statusBayar === 'Sudah' ? 'Lunas' : 'Menunggu'}
                          </span>
                        </div>

                        {/* Venue & Capacity */}
                        <div className="space-y-1.5 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-indigo-600" />
                              Waktu:
                            </span>
                            <span className="font-semibold text-indigo-700 font-mono">
                              {item.waktuMulai || '08:30'} - {item.waktuSelesai || '12:00'} WIB
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-purple-600" />
                              Tempat:
                            </span>
                            <span className="font-semibold text-purple-900 truncate max-w-[170px] text-right" title={item.tempatPenyelenggaraan || 'Bale Sawala'}>
                              {item.tempatPenyelenggaraan || 'Bale Sawala'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-indigo-600" />
                              Peserta:
                            </span>
                            <span className="font-semibold text-slate-800">
                              {item.jumlahPeserta} Siswa {item.jumlahGuru ? `+ ${item.jumlahGuru} Guru` : ''}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 flex items-center gap-1.5">
                              <School className="w-3.5 h-3.5 text-blue-600" />
                              Tujuan:
                            </span>
                            <span className="font-semibold text-slate-800 text-right truncate max-w-[160px]">
                              {item.pilihanKunjungan === 'Fakultas' && item.fakultasTujuan && item.fakultasTujuan.length > 0
                                ? item.fakultasTujuan.join(', ')
                                : item.pilihanKunjungan}
                            </span>
                          </div>
                        </div>

                        {/* Narahubung & WhatsApp */}
                        <div className="flex items-center justify-between text-xs pt-1">
                          <div className="truncate">
                            <span className="text-[11px] text-slate-400 block">Narahubung:</span>
                            <span className="font-semibold text-slate-800 truncate block">
                              {item.kontakPerson}
                            </span>
                          </div>

                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-[11px] border border-emerald-200 transition-colors flex-shrink-0"
                              title="Chat WhatsApp Narahubung"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              WhatsApp
                            </a>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => onSelectBooking(item)}
                            className="flex-1 py-1.5 px-2.5 bg-blue-50 hover:bg-blue-100 text-[#002B66] font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Lembar Konfirmasi
                          </button>

                          {userRole !== 'VIEWER' && (
                            <button
                              type="button"
                              onClick={() => onEditBooking(item)}
                              className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition-colors flex items-center justify-center gap-1"
                              title="Edit Data Kunjungan"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Timeline Agenda Mode */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Timeline Agenda Kunjungan Eduventure
              </h3>
              <p className="text-xs text-slate-500">
                Daftar kronologis pelaksanaan kunjungan sekolah terurut berdasarkan tanggal pelaksanaan
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-[#002B66] rounded-full border border-blue-200">
              {filteredBookings.length} Agenda Terjadwal
            </span>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CalendarIcon className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm">Tidak ada agenda kunjungan yang sesuai dengan filter.</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-[#002B66] font-semibold hover:underline"
                >
                  Reset semua filter
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 space-y-3">
              {filteredBookings
                .slice()
                .sort((a, b) => (a.tanggalPelaksanaan || '').localeCompare(b.tanggalPelaksanaan || ''))
                .map((item) => {
                  const style = SKEMA_COLORS[item.skemaPaket] || {
                    badge: 'bg-slate-100 text-slate-800 border-slate-200'
                  };
                  const waUrl = getWhatsAppUrl(item.nomorKontak);

                  return (
                    <div
                      key={item.id}
                      className="pt-3 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 p-3 rounded-xl transition-colors"
                    >
                      {/* Left: Date Block & School Info */}
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Big Date Badge */}
                        <div className="flex-shrink-0 w-16 text-center bg-[#002B66] text-white rounded-xl p-2 shadow-xs">
                          <span className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider block">
                            {MONTH_NAMES_ID[new Date(item.tanggalPelaksanaan).getMonth()]?.substring(0, 3) || 'BLN'}
                          </span>
                          <span className="text-xl font-black text-amber-300 block leading-tight">
                            {item.tanggalPelaksanaan ? item.tanggalPelaksanaan.split('-')[2] : '--'}
                          </span>
                          <span className="text-[9px] text-blue-200 block">
                            {item.tanggalPelaksanaan ? item.tanggalPelaksanaan.split('-')[0] : ''}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${style.badge}`}>
                              {item.skemaPaket}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">{item.id}</span>
                            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                              item.statusBayar === 'Sudah'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {item.statusBayar === 'Sudah' ? 'Lunas' : 'Belum Bayar'}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {item.namaSekolah}
                          </h4>

                          <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-indigo-700 font-semibold font-mono">
                              <Clock className="w-3.5 h-3.5 text-indigo-600" />
                              {item.waktuMulai || '08:30'} - {item.waktuSelesai || '12:00'} WIB
                            </span>
                            <span className="inline-flex items-center gap-1 text-purple-700 font-semibold">
                              <Building2 className="w-3.5 h-3.5 text-purple-600" />
                              {item.tempatPenyelenggaraan || 'Bale Sawala'}
                            </span>
                            <span className="inline-flex items-center gap-1 text-slate-700">
                              <Users className="w-3.5 h-3.5 text-indigo-600" />
                              {item.jumlahPeserta} Siswa {item.jumlahGuru ? `(+${item.jumlahGuru} Guru)` : ''}
                            </span>
                            <span className="inline-flex items-center gap-1 text-slate-500">
                              <School className="w-3.5 h-3.5 text-blue-600" />
                              {item.pilihanKunjungan}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Contact & Action */}
                      <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200 transition-colors flex items-center gap-1"
                            title="Chat WhatsApp Narahubung"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => onSelectBooking(item)}
                          className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-[#002B66] font-semibold rounded-lg text-xs transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>

                        {userRole !== 'VIEWER' && (
                          <button
                            type="button"
                            onClick={() => onEditBooking(item)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors"
                            title="Edit Data"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
