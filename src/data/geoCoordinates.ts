// Data Koordinat Geografis Wilayah Indonesia & Kampus Unpad
// Untuk Visualisasi Dashboard Peta SIMPENDIK Non Gelar Unpad

export interface CampusLocation {
  id: string;
  name: string;
  subName: string;
  lat: number;
  lng: number;
  type: 'MAIN_CAMPUS' | 'CITY_CAMPUS' | 'HOSPITAL' | 'STATION';
  description: string;
}

export const UNPAD_CAMPUSES: CampusLocation[] = [
  {
    id: 'unpad-jatinangor',
    name: 'Universitas Padjadjaran (Kampus Utama Jatinangor)',
    subName: 'Gedung Rektorat & Direktorat DPNG',
    lat: -6.9261,
    lng: 107.7747,
    type: 'MAIN_CAMPUS',
    description: 'Pusat administrasi, rektorat, dan sentra perkuliahan program non gelar Universitas Padjadjaran.',
  },
  {
    id: 'unpad-dipatiukur',
    name: 'Universitas Padjadjaran (Kampus Dipati Ukur)',
    subName: 'Pusat Studi & Executive Education',
    lat: -6.8927,
    lng: 107.6166,
    type: 'CITY_CAMPUS',
    description: 'Kampus bersejarah Iwa Koesoemasoemantri, sentra program Executive Education & Pascasarjana di Kota Bandung.',
  },
  {
    id: 'unpad-rshs',
    name: 'RSUP Dr. Hasan Sadikin / FK Unpad',
    subName: 'Sentra Sertifikasi Profesi Kesehatan',
    lat: -6.8953,
    lng: 107.5992,
    type: 'HOSPITAL',
    description: 'Rumah Sakit Pendidikan Utama dan sentra pelatihan klinis & ToT kedokteran Unpad.',
  }
];

// Koordinat default per provinsi di Indonesia
export const PROVINCE_COORDINATES: Record<string, [number, number]> = {
  'Jawa Barat': [-6.9175, 107.6191],
  'DKI Jakarta': [-6.2088, 106.8456],
  'Banten': [-6.4058, 106.0640],
  'Jawa Tengah': [-7.1509, 110.1402],
  'DI Yogyakarta': [-7.7956, 110.3695],
  'Jawa Timur': [-7.5360, 112.2384],
  'Sumatera Utara': [2.1154, 99.5451],
  'Sumatera Barat': [-0.7399, 100.8000],
  'Riau': [0.2933, 101.7068],
  'Kepulauan Riau': [1.0828, 104.0305],
  'Jambi': [-1.4851, 102.4380],
  'Sumatera Selatan': [-3.3194, 104.9144],
  'Bengkulu': [-3.5778, 102.3463],
  'Lampung': [-4.5585, 105.4068],
  'Kepulauan Bangka Belitung': [-2.7410, 106.4405],
  'Aceh': [4.6951, 96.7494],
  'Bali': [-8.4095, 115.1889],
  'Nusa Tenggara Barat': [-8.6529, 117.3616],
  'Nusa Tenggara Timur': [-8.6573, 121.0794],
  'Kalimantan Barat': [-0.2787, 111.4753],
  'Kalimantan Tengah': [-1.6814, 113.3823],
  'Kalimantan Selatan': [-3.0926, 115.2837],
  'Kalimantan Timur': [0.5386, 116.4194],
  'Kalimantan Utara': [3.0730, 116.0413],
  'Sulawesi Utara': [0.6246, 123.9750],
  'Gorontalo': [0.6999, 122.4467],
  'Sulawesi Tengah': [-1.4300, 121.4456],
  'Sulawesi Barat': [-2.8441, 119.2320],
  'Sulawesi Selatan': [-3.6687, 119.9740],
  'Sulawesi Tenggara': [-4.1449, 122.1746],
  'Maluku': [-3.2385, 130.1452],
  'Maluku Utara': [1.5709, 127.8087],
  'Papua': [-4.2699, 138.0803],
  'Papua Barat': [-1.3361, 133.1747],
  'Papua Selatan': [-7.5000, 139.5000],
  'Papua Tengah': [-3.5000, 136.5000],
  'Papua Pegunungan': [-4.0000, 139.0000],
  'Papua Barat Daya': [-0.8833, 131.2500],
};

// Koordinat spesifik untuk kota / kabupaten
export const CITY_COORDINATES: Record<string, [number, number]> = {
  // Jawa Barat
  'Kota Bandung': [-6.9175, 107.6191],
  'Kab. Sumedang': [-6.8586, 107.9266],
  'Sumedang': [-6.8586, 107.9266],
  'Jatinangor': [-6.9261, 107.7747],
  'Kota Cimahi': [-6.8722, 107.5422],
  'Cimahi': [-6.8722, 107.5422],
  'Kab. Bandung': [-7.0253, 107.5198],
  'Kab. Bandung Barat': [-6.8441, 107.4939],
  'Kota Bogor': [-6.5971, 106.8060],
  'Kab. Bogor': [-6.5518, 106.6291],
  'Kota Depok': [-6.4025, 106.7942],
  'Kota Bekasi': [-6.2383, 106.9756],
  'Kab. Bekasi': [-6.2615, 107.1517],
  'Kota Cirebon': [-6.7320, 108.5523],
  'Kab. Cirebon': [-6.7645, 108.4795],
  'Kota Sukabumi': [-6.9277, 106.9298],
  'Kab. Sukabumi': [-7.0658, 106.7118],
  'Kota Tasikmalaya': [-7.3274, 108.2207],
  'Kab. Tasikmalaya': [-7.3556, 108.1105],
  'Kab. Garut': [-7.2279, 107.9087],
  'Kab. Karawang': [-6.3227, 107.3376],
  'Kab. Subang': [-6.5590, 107.7600],
  'Kab. Purwakarta': [-6.5569, 107.4433],
  'Kab. Cianjur': [-6.8174, 107.1422],
  'Kab. Majalengka': [-6.8361, 108.2275],
  'Kab. Kuningan': [-6.9760, 108.4839],
  'Kab. Indramayu': [-6.3264, 108.3200],
  'Kab. Ciamis': [-7.3256, 108.3533],
  'Kota Banjar': [-7.3686, 108.5332],
  'Kab. Pangandaran': [-7.6833, 108.6500],

  // DKI Jakarta & Banten
  'Jakarta Pusat': [-6.1865, 106.8341],
  'Jakarta Selatan': [-6.2615, 106.8106],
  'Jakarta Barat': [-6.1683, 106.7588],
  'Jakarta Timur': [-6.2250, 106.9004],
  'Jakarta Utara': [-6.1214, 106.8837],
  'Kota Tangerang': [-6.1783, 106.6319],
  'Kota Tangerang Selatan': [-6.2888, 106.7179],
  'Kota Serang': [-6.1104, 106.1640],
  'Kota Cilegon': [-6.0170, 106.0538],

  // Jawa Tengah & DIY
  'Kota Semarang': [-6.9667, 110.4167],
  'Kota Surakarta': [-7.5666, 110.8290],
  'Solo': [-7.5666, 110.8290],
  'Kota Yogyakarta': [-7.7956, 110.3695],
  'Sleman': [-7.7167, 110.3556],
  'Bantul': [-7.8890, 110.3289],
  'Kota Magelang': [-7.4706, 110.2178],
  'Banyumas': [-7.5133, 109.2942],
  'Purwokerto': [-7.4244, 109.2303],

  // Jawa Timur & Bali
  'Kota Surabaya': [-7.2575, 112.7521],
  'Kota Malang': [-7.9797, 112.6304],
  'Kota Kediri': [-7.8480, 112.0178],
  'Kota Denpasar': [-8.6705, 115.2126],
  'Badung': [-8.5819, 115.1771],

  // Luar Jawa
  'Kota Medan': [3.5952, 98.6722],
  'Kota Padang': [-0.9471, 100.4172],
  'Kota Palembang': [-2.9761, 104.7754],
  'Kota Pekanbaru': [0.5071, 101.4478],
  'Kota Bandar Lampung': [-5.4500, 105.2667],
  'Banda Aceh': [5.5483, 95.3238],
  'Kota Pontianak': [-0.0263, 109.3425],
  'Kota Banjarmasin': [-3.3194, 114.5908],
  'Kota Balikpapan': [-1.2379, 116.8529],
  'Kota Samarinda': [-0.5022, 117.1537],
  'Kota Makassar': [-5.1477, 119.4327],
  'Kota Manado': [1.4748, 124.8421],
  'Kota Mataram': [-8.5833, 116.1167],
  'Kota Kupang': [-10.1772, 123.6070],
  'Kota Jayapura': [-2.5489, 140.7136],
  'Kota Ambon': [-3.6954, 128.1814],
};

/**
 * Mencari koordinat geografis terbaik berdasarkan nama kota/kabupaten dan provinsi
 */
export function getParticipantCoordinate(provinsi: string, kotaKabupaten?: string): [number, number] {
  if (kotaKabupaten) {
    const cleanCity = kotaKabupaten.trim();
    if (CITY_COORDINATES[cleanCity]) {
      return CITY_COORDINATES[cleanCity];
    }
    // Cek substring
    for (const [key, coord] of Object.entries(CITY_COORDINATES)) {
      if (cleanCity.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(cleanCity.toLowerCase())) {
        return coord;
      }
    }
  }

  if (provinsi) {
    const cleanProv = provinsi.trim();
    if (PROVINCE_COORDINATES[cleanProv]) {
      return PROVINCE_COORDINATES[cleanProv];
    }
    // Cek substring
    for (const [key, coord] of Object.entries(PROVINCE_COORDINATES)) {
      if (cleanProv.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(cleanProv.toLowerCase())) {
        return coord;
      }
    }
  }

  // Default ke Kampus Unpad Jatinangor jika tidak diketahui
  return [-6.9261, 107.7747];
}

// -------------------------------------------------------------
// Fasilitas & Lokasi Penyelenggaraan Eduventure di Kampus Unpad
// -------------------------------------------------------------
export interface EduventureVenueLocation {
  id: string;
  name: string;
  subName: string;
  lat: number;
  lng: number;
  campus: 'Jatinangor' | 'Dipati Ukur';
  capacity: number;
  description: string;
}

export const EDUVENTURE_CAMPUS_VENUES: EduventureVenueLocation[] = [
  {
    id: 'bale-sawala',
    name: 'Bale Sawala',
    subName: 'Gedung Rektorat Unpad Jatinangor Lt. 1',
    lat: -6.9261,
    lng: 107.7747,
    campus: 'Jatinangor',
    capacity: 450,
    description: 'Auditorium utama penerimaan kunjungan kehormatan, presentasi pimpinan universitas, dan seremonial penyambutan rombongan besar sekolah.'
  },
  {
    id: 'bale-rucita',
    name: 'Bale Rucita',
    subName: 'Gedung Rektorat Unpad Jatinangor Lt. 2',
    lat: -6.9264,
    lng: 107.7745,
    campus: 'Jatinangor',
    capacity: 200,
    description: 'Ruang sidang representatif untuk diskusi interaktif, ToT guru pembimbing, dan workshop tematik pimpinan sekolah.'
  },
  {
    id: 'bale-santika',
    name: 'Bale Santika',
    subName: 'Gelanggang Olahraga & Serbaguna Unpad Jatinangor',
    lat: -6.9302,
    lng: 107.7709,
    campus: 'Jatinangor',
    capacity: 1500,
    description: 'Venue kapasitas mega untuk pameran expo pendidikan, gathering massal seluruh jenjang, dan pergelaran seni budaya Unpad.'
  },
  {
    id: 'auditorium-ff',
    name: 'Auditorium Fakultas Farmasi',
    subName: 'Gedung Fakultas Farmasi Unpad Jatinangor',
    lat: -6.9238,
    lng: 107.7716,
    campus: 'Jatinangor',
    capacity: 250,
    description: 'Fasilitas pertemuan sains farmasi, praktikum simulasi formulasi obat, dan laboratorium farmasi bahan alam.'
  },
  {
    id: 'auditorium-fk',
    name: 'Auditorium Fakultas Kedokteran',
    subName: 'Gedung Teaching Hospital & FK Unpad Jatinangor',
    lat: -6.9225,
    lng: 107.7738,
    campus: 'Jatinangor',
    capacity: 350,
    description: 'Pusat eksplorasi biomedical, laboratorium anatomi modern, dan simulasi keterampilan klinis kedokteran.'
  },
  {
    id: 'auditorium-fikom',
    name: 'Auditorium Fakultas Ilmu Komunikasi',
    subName: 'Gedung Pascasarjana Fikom Unpad Jatinangor',
    lat: -6.9248,
    lng: 107.7765,
    campus: 'Jatinangor',
    capacity: 300,
    description: 'Sentra studi komunikasi, laboratorium broadcast radio-televisi, multimedia interaktif, dan public speaking.'
  },
  {
    id: 'gkb-unpad',
    name: 'Gedung Kuliah Bersama (GKB)',
    subName: 'Kompleks Kuliah Terpadu Jatinangor',
    lat: -6.9272,
    lng: 107.7725,
    campus: 'Jatinangor',
    capacity: 500,
    description: 'Smart classroom modern berkapasitas besar untuk kuliah umum orientasi jurusan dan simulasi perkuliahan kampus.'
  },
  {
    id: 'kampus-du',
    name: 'Pusat Studi Dipati Ukur',
    subName: 'Kampus Bersejarah Jl. Dipati Ukur No. 35 Bandung',
    lat: -6.8927,
    lng: 107.6166,
    campus: 'Dipati Ukur',
    capacity: 250,
    description: 'Gedung bersejarah Iwa Koesoemasoemantri, sentra program eksekutif dan kunjungan sejarah kebangsaan Unpad di Kota Bandung.'
  },
  {
    id: 'kandaga-perpus',
    name: 'Kandaga Perpustakaan Pusat',
    subName: 'Gedung Perpustakaan Utama Unpad Jatinangor',
    lat: -6.9255,
    lng: 107.7733,
    campus: 'Jatinangor',
    capacity: 300,
    description: 'Pusat repositori literasi digital terakreditasi, ruang multimedia koleksi langka, dan co-working space mahasiswa.'
  }
];

/**
 * Menghitung jarak garis lurus antara dua titik koordinat (rumus Haversine) dalam kilometer
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius bumi dalam km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Mendeteksi lokasi dan koordinat sekolah pemesan Eduventure dari teks alamat dan nama sekolah
 */
export function resolveEduventureSchoolLocation(alamat: string, namaSekolah: string): {
  lat: number;
  lng: number;
  kota: string;
  provinsi: string;
  distanceKm: number;
} {
  const combinedText = `${alamat || ''} ${namaSekolah || ''}`.toLowerCase();
  
  // Koordinat acuan Unpad Jatinangor
  const UNPAD_LAT = -6.9261;
  const UNPAD_LNG = 107.7747;

  // Cek Kota / Kabupaten
  for (const [cityKey, coord] of Object.entries(CITY_COORDINATES)) {
    const searchTarget = cityKey.toLowerCase().replace(/^(kota|kab\.|kabupaten)\s+/, '');
    if (combinedText.includes(searchTarget) || combinedText.includes(cityKey.toLowerCase())) {
      // Tentukan provinsi dari konteks kota
      let prov = 'Jawa Barat';
      if (['jakarta pusat', 'jakarta selatan', 'jakarta barat', 'jakarta timur', 'jakarta utara'].some(j => cityKey.toLowerCase().includes(j))) {
        prov = 'DKI Jakarta';
      } else if (['tangerang', 'serang', 'cilegon'].some(b => cityKey.toLowerCase().includes(b))) {
        prov = 'Banten';
      } else if (['semarang', 'surakarta', 'solo', 'magelang', 'banyumas', 'purwokerto'].some(jt => cityKey.toLowerCase().includes(jt))) {
        prov = 'Jawa Tengah';
      } else if (['yogyakarta', 'sleman', 'bantul'].some(y => cityKey.toLowerCase().includes(y))) {
        prov = 'DI Yogyakarta';
      } else if (['surabaya', 'malang', 'kediri'].some(jtm => cityKey.toLowerCase().includes(jtm))) {
        prov = 'Jawa Timur';
      } else if (['denpasar', 'badung'].some(bl => cityKey.toLowerCase().includes(bl))) {
        prov = 'Bali';
      } else if (['medan', 'padang', 'palembang', 'pekanbaru', 'lampung', 'bandar lampung', 'aceh'].some(s => cityKey.toLowerCase().includes(s))) {
        prov = 'Sumatera';
      } else if (['pontianak', 'banjarmasin', 'samarinda', 'balikpapan'].some(k => cityKey.toLowerCase().includes(k))) {
        prov = 'Kalimantan';
      } else if (['makassar', 'manado'].some(sul => cityKey.toLowerCase().includes(sul))) {
        prov = 'Sulawesi';
      }

      const dist = calculateDistanceKm(coord[0], coord[1], UNPAD_LAT, UNPAD_LNG);
      return {
        lat: coord[0],
        lng: coord[1],
        kota: cityKey,
        provinsi: prov,
        distanceKm: dist
      };
    }
  }

  // Cek Provinsi
  for (const [provKey, coord] of Object.entries(PROVINCE_COORDINATES)) {
    if (combinedText.includes(provKey.toLowerCase())) {
      const dist = calculateDistanceKm(coord[0], coord[1], UNPAD_LAT, UNPAD_LNG);
      return {
        lat: coord[0],
        lng: coord[1],
        kota: provKey,
        provinsi: provKey,
        distanceKm: dist
      };
    }
  }

  // Default jika tidak terdeteksi (Bandung / Sekitar Unpad)
  return {
    lat: -6.9175,
    lng: 107.6191,
    kota: 'Kota Bandung',
    provinsi: 'Jawa Barat',
    distanceKm: 25
  };
}

