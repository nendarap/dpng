import { LoginPresetBackground, LoginSettings } from '../types';

export const LOGIN_PRESET_BACKGROUNDS: LoginPresetBackground[] = [
  {
    id: 'rektorat',
    name: 'Gedung Rektorat Unpad',
    location: 'Kampus Jatinangor, Sumedang',
    imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'gerbang',
    name: 'Gerbang & Boulevard Utama',
    location: 'Pintu Masuk Utama Kampus Unpad',
    imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'cisral',
    name: 'Perpustakaan Pusat & Riset',
    location: 'Gedung CISRAL Unpad Jatinangor',
    imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1600&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'dipatiukur',
    name: 'Kampus Heritage Dipatiukur',
    location: 'Jl. Dipati Ukur No. 35, Bandung',
    imageUrl: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1600&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'jatinangor',
    name: 'Panorama Kampus Hijau',
    location: 'Lembah & Arboretum Unpad',
    imageUrl: 'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=1600&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=300&auto=format&fit=crop&q=80',
  },
];

export const LOGIN_GRADIENT_OPTIONS = [
  {
    id: 'navy-gold',
    name: 'Unpad Classic Navy & Gold',
    desc: 'Biru Dongker (#002B66) & Kuning Emas (#FDB913)',
    cssClass: 'from-[#002B66] via-[#001D47] to-[#0B1528]',
    previewHex: '#002B66',
  },
  {
    id: 'emerald-forest',
    name: 'Kampus Lestari Emerald',
    desc: 'Nuansa Hijau Kampus Asri Unpad (#046A38)',
    cssClass: 'from-[#046A38] via-[#024021] to-[#062013]',
    previewHex: '#046A38',
  },
  {
    id: 'midnight-slate',
    name: 'Midnight Slate Dark',
    desc: 'Elegan, Modern, dan Kontras Tinggi (#0F172A)',
    cssClass: 'from-[#0F172A] via-[#1E293B] to-[#020617]',
    previewHex: '#0F172A',
  },
  {
    id: 'royal-maroon',
    name: 'Royal Maroon Wibawa',
    desc: 'Wibawa Merah Marun Akademik (#881337) & Emas',
    cssClass: 'from-[#881337] via-[#4C0519] to-[#1F020A]',
    previewHex: '#881337',
  },
];

export const DEFAULT_LOGIN_SETTINGS: LoginSettings = {
  bgType: 'preset',
  bgPresetId: 'rektorat',
  bgCustomUrl: '',
  bgGradient: 'navy-gold',
  bgOverlayOpacity: 45,
  bgBlurAmount: 2,
  
  judulLogin: 'SIMPENDIK NON GELAR',
  subjudulLogin: 'Sistem Informasi Manajemen Data Peserta Pendidikan Non Gelar Universitas Padjadjaran.',
  cardHeroTag: 'Portal Resmi Non Gelar',
  
  showAnnouncement: true,
  announcementText: 'Pendaftaran Program Pelatihan, Kredensial Mikro & Eduventure Semester Gasal 2026/2027 Telah Dibuka.',
  announcementType: 'info',
  
  allowGoogleSso: true,
  googleSsoButtonText: 'Single Sign-On Akun @unpad.ac.id',
  footerContactText: 'Gedung Rektorat Unpad Jatinangor, Sumedang, Jawa Barat | Layanan Bantuan: dpng@unpad.ac.id',
  showFeatureHighlights: true,
};
