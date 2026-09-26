import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { 
  Compass, MapPin, Layers, ZoomIn, ZoomOut, RotateCcw, 
  School, Building2, Users, Calendar, CreditCard, 
  Search, ExternalLink, Eye, MessageCircle, Filter, 
  Sparkles, Route, Navigation, Maximize2, Minimize2,
  CheckCircle2, Clock, AlertTriangle, ChevronRight, Info,
  ArrowUpRight
} from 'lucide-react';
import { EduventureBooking, UserRole } from '../types';
import { GoogleMapsAiModal } from './GoogleMapsAiModal';
import { 
  EDUVENTURE_CAMPUS_VENUES, 
  EduventureVenueLocation, 
  resolveEduventureSchoolLocation,
  calculateDistanceKm
} from '../data/geoCoordinates';

interface EduventureMapViewProps {
  eduventureList: EduventureBooking[];
  onSelectBooking?: (item: EduventureBooking) => void;
  userRole?: UserRole;
  isEmbedded?: boolean; // Whether displayed inside EduventureDashboardView or standalone
}

interface SchoolGeoCluster {
  key: string;
  namaSekolah: string;
  alamat: string;
  kota: string;
  provinsi: string;
  lat: number;
  lng: number;
  distanceKm: number;
  bookings: EduventureBooking[];
  totalPeserta: number;
  totalGuru: number;
  totalPartisipan: number;
  latestDate: string;
  skemaList: string[];
  statusBayarSummary: { sudah: number; belum: number };
}

export const EduventureMapView: React.FC<EduventureMapViewProps> = ({
  eduventureList,
  onSelectBooking,
  userRole = 'ADMIN',
  isEmbedded = false
}) => {
  // Map container & Leaflet instance refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const routesLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // View States
  const [mapStyle, setMapStyle] = useState<'google-streets' | 'google-satellite' | 'google-hybrid' | 'google-terrain' | 'positron' | 'osm' | 'topo'>('google-streets');
  const [viewMode, setViewMode] = useState<'origins' | 'venues' | 'both'>('both');
  const [showRouteLines, setShowRouteLines] = useState<boolean>(true);
  const [selectedSchool, setSelectedSchool] = useState<SchoolGeoCluster | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<EduventureVenueLocation | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Google Maps AI Grounding State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiModalPrompt, setAiModalPrompt] = useState('');
  const [aiModalLocationName, setAiModalLocationName] = useState('Kampus Unpad Jatinangor');
  const [aiModalCoords, setAiModalCoords] = useState<{ latitude: number; longitude: number } | undefined>({ latitude: -6.9261, longitude: 107.7747 });

  const handleOpenAiExplorer = (name?: string, coords?: { latitude: number; longitude: number }, customPrompt?: string) => {
    const locName = name || 'Kampus Unpad Jatinangor';
    const locCoords = coords || { latitude: -6.9261, longitude: 107.7747 };
    setAiModalLocationName(locName);
    setAiModalCoords(locCoords);
    setAiModalPrompt(customPrompt || `Rekomendasi fasilitas, akses rute transportasi, dan tempat kunjungan di sekitar ${locName}`);
    setIsAiModalOpen(true);
  };

  // Filter States
  const [filterTahun, setFilterTahun] = useState<string>('ALL');
  const [filterSkema, setFilterSkema] = useState<string>('ALL');
  const [filterStatusBayar, setFilterStatusBayar] = useState<string>('ALL');
  const [filterWilayah, setFilterWilayah] = useState<'ALL' | 'JABAR' | 'LUAR_JABAR'>('ALL');

  // Unpad Jatinangor Reference Coordinate
  const UNPAD_MAIN_COORDS: [number, number] = [-6.9261, 107.7747];

  // Available Years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    eduventureList.forEach(item => {
      if (item.tanggalPelaksanaan) {
        const y = item.tanggalPelaksanaan.split('-')[0];
        if (y) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [eduventureList]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return eduventureList.filter(item => {
      if (filterTahun !== 'ALL') {
        const y = item.tanggalPelaksanaan?.split('-')[0];
        if (y !== filterTahun) return false;
      }
      if (filterSkema !== 'ALL' && item.skemaPaket !== filterSkema) return false;
      if (filterStatusBayar !== 'ALL' && item.statusBayar !== filterStatusBayar) return false;
      
      if (filterWilayah !== 'ALL') {
        const geo = resolveEduventureSchoolLocation(item.alamat, item.namaSekolah);
        if (filterWilayah === 'JABAR' && geo.provinsi !== 'Jawa Barat') return false;
        if (filterWilayah === 'LUAR_JABAR' && geo.provinsi === 'Jawa Barat') return false;
      }
      return true;
    });
  }, [eduventureList, filterTahun, filterSkema, filterStatusBayar, filterWilayah]);

  // Aggregated School Clusters with Geocoding
  const schoolClusters = useMemo(() => {
    const map = new Map<string, SchoolGeoCluster>();

    filteredBookings.forEach(item => {
      const geo = resolveEduventureSchoolLocation(item.alamat, item.namaSekolah);
      const clusterKey = `${item.namaSekolah}__${geo.kota}`;

      if (!map.has(clusterKey)) {
        map.set(clusterKey, {
          key: clusterKey,
          namaSekolah: item.namaSekolah,
          alamat: item.alamat,
          kota: geo.kota,
          provinsi: geo.provinsi,
          lat: geo.lat,
          lng: geo.lng,
          distanceKm: geo.distanceKm,
          bookings: [],
          totalPeserta: 0,
          totalGuru: 0,
          totalPartisipan: 0,
          latestDate: item.tanggalPelaksanaan || '',
          skemaList: [],
          statusBayarSummary: { sudah: 0, belum: 0 }
        });
      }

      const cluster = map.get(clusterKey)!;
      cluster.bookings.push(item);
      const pCount = Number(item.jumlahPeserta) || 0;
      const gCount = Number(item.jumlahGuru) || 0;
      cluster.totalPeserta += pCount;
      cluster.totalGuru += gCount;
      cluster.totalPartisipan += (pCount + gCount);

      if (item.tanggalPelaksanaan && item.tanggalPelaksanaan > cluster.latestDate) {
        cluster.latestDate = item.tanggalPelaksanaan;
      }

      if (item.skemaPaket && !cluster.skemaList.includes(item.skemaPaket)) {
        cluster.skemaList.push(item.skemaPaket);
      }

      if (item.statusBayar === 'Sudah') {
        cluster.statusBayarSummary.sudah += 1;
      } else {
        cluster.statusBayarSummary.belum += 1;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalPartisipan - a.totalPartisipan);
  }, [filteredBookings]);

  // Search filtered schools for the side list
  const searchedSchools = useMemo(() => {
    if (!searchQuery.trim()) return schoolClusters;
    const q = searchQuery.toLowerCase();
    return schoolClusters.filter(s => 
      s.namaSekolah.toLowerCase().includes(q) || 
      s.kota.toLowerCase().includes(q) || 
      s.provinsi.toLowerCase().includes(q)
    );
  }, [schoolClusters, searchQuery]);

  // KPI Statistics for the Map Header
  const mapStats = useMemo(() => {
    const totalSchools = schoolClusters.length;
    const totalPartisipan = schoolClusters.reduce((acc, c) => acc + c.totalPartisipan, 0);
    const jabarSchools = schoolClusters.filter(c => c.provinsi === 'Jawa Barat').length;
    const luarJabarSchools = totalSchools - jabarSchools;
    const avgDistance = totalSchools > 0 
      ? Math.round(schoolClusters.reduce((acc, c) => acc + c.distanceKm, 0) / totalSchools) 
      : 0;

    return {
      totalSchools,
      totalPartisipan,
      jabarSchools,
      luarJabarSchools,
      avgDistance,
      jabarPct: totalSchools > 0 ? Math.round((jabarSchools / totalSchools) * 100) : 0
    };
  }, [schoolClusters]);

  // Venue booking counts
  const venueStats = useMemo(() => {
    const counts: Record<string, { totalAgendas: number; totalPartisipan: number }> = {};
    filteredBookings.forEach(b => {
      const vName = b.tempatPenyelenggaraan || 'Bale Sawala';
      if (!counts[vName]) counts[vName] = { totalAgendas: 0, totalPartisipan: 0 };
      counts[vName].totalAgendas += 1;
      counts[vName].totalPartisipan += (Number(b.jumlahPeserta) || 0) + (Number(b.jumlahGuru) || 0);
    });
    return counts;
  }, [filteredBookings]);

  // Tile layer URL resolver
  const getTileConfig = (style: 'google-streets' | 'google-satellite' | 'google-hybrid' | 'google-terrain' | 'positron' | 'osm' | 'topo') => {
    switch (style) {
      case 'google-streets':
        return {
          url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
          attribution: '&copy; Google Maps'
        };
      case 'google-satellite':
        return {
          url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
          attribution: '&copy; Google Maps'
        };
      case 'google-hybrid':
        return {
          url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          attribution: '&copy; Google Maps'
        };
      case 'google-terrain':
        return {
          url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
          attribution: '&copy; Google Maps'
        };
      case 'osm':
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; OpenStreetMap contributors'
        };
      case 'topo':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
        };
      case 'positron':
      default:
        return {
          url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
        };
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [-6.9261, 107.7747],
        zoom: 8,
        zoomControl: false,
        attributionControl: false
      });

      const tileConfig = getTileConfig(mapStyle);
      const tiles = L.tileLayer(tileConfig.url, {
        maxZoom: 19,
        attribution: tileConfig.attribution
      }).addTo(map);

      // Store current tile layer on map instance
      (map as any)._currentTileLayer = tiles;

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;

      const routesGroup = L.layerGroup().addTo(map);
      routesLayerGroupRef.current = routesGroup;

      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when mapStyle changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if ((map as any)._currentTileLayer) {
      map.removeLayer((map as any)._currentTileLayer);
    }

    const tileConfig = getTileConfig(mapStyle);
    const newTiles = L.tileLayer(tileConfig.url, {
      maxZoom: 19,
      attribution: tileConfig.attribution
    }).addTo(map);

    (map as any)._currentTileLayer = newTiles;
  }, [mapStyle]);

  // Render Markers and Polylines on Data / Filter Change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    const routesGroup = routesLayerGroupRef.current;
    if (!map || !layerGroup || !routesGroup) return;

    layerGroup.clearLayers();
    routesGroup.clearLayers();

    const bounds = L.latLngBounds([]);

    // 1. UNPAD CENTRAL HUB MARKER (Always Present)
    const unpadPulseIcon = L.divIcon({
      className: 'unpad-hub-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-12 h-12 rounded-full bg-[#002B66]/20 animate-ping"></div>
          <div class="absolute w-8 h-8 rounded-full bg-[#FDB913]/40 animate-pulse"></div>
          <div class="relative w-7 h-7 rounded-full bg-[#002B66] border-2 border-[#FDB913] text-white flex items-center justify-center shadow-lg">
            <span class="text-[10px] font-black tracking-tight text-[#FDB913]">UNPAD</span>
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const unpadMarker = L.marker(UNPAD_MAIN_COORDS, { icon: unpadPulseIcon, zIndexOffset: 1000 })
      .addTo(layerGroup)
      .bindPopup(`
        <div style="font-family: inherit; font-size: 12px; padding: 4px; min-width: 200px;">
          <div style="font-weight: 800; color: #002B66; font-size: 13px; margin-bottom: 2px;">
            Universitas Padjadjaran
          </div>
          <div style="color: #64748b; font-size: 11px; margin-bottom: 8px;">
            Kampus Utama Jatinangor & Sentra Program Eduventure
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px; font-size: 11px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="color: #475569;">Total Sekolah Masuk:</span>
              <strong style="color: #002B66;">${schoolClusters.length} Sekolah</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #475569;">Total Partisipan:</span>
              <strong style="color: #059669;">${mapStats.totalPartisipan.toLocaleString('id-ID')} Orang</strong>
            </div>
          </div>
        </div>
      `);

    bounds.extend(UNPAD_MAIN_COORDS);

    // 2. CAMPUS VENUE MARKERS (If mode is 'venues' or 'both')
    if (viewMode === 'venues' || viewMode === 'both') {
      EDUVENTURE_CAMPUS_VENUES.forEach(venue => {
        const statsForVenue = venueStats[venue.name] || { totalAgendas: 0, totalPartisipan: 0 };
        const hasActiveAgendas = statsForVenue.totalAgendas > 0;

        const venueIcon = L.divIcon({
          className: 'venue-marker-icon',
          html: `
            <div class="relative group cursor-pointer">
              <div class="w-6 h-6 rounded-lg ${hasActiveAgendas ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-700 text-slate-200'} border border-white flex items-center justify-center transition-transform hover:scale-110">
                <span style="font-size: 10px;">🏛️</span>
              </div>
              ${hasActiveAgendas ? `
                <div class="absolute -top-2 -right-2 px-1.5 py-0.2 bg-[#FDB913] text-slate-900 rounded-full text-[9px] font-black border border-white">
                  ${statsForVenue.totalAgendas}
                </div>
              ` : ''}
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([venue.lat, venue.lng], { icon: venueIcon })
          .addTo(layerGroup)
          .on('click', () => {
            setSelectedVenue(venue);
            setSelectedSchool(null);
          })
          .bindPopup(`
            <div style="font-family: inherit; font-size: 12px; padding: 4px; min-width: 220px;">
              <div style="display: inline-block; padding: 2px 6px; background: #f3e8ff; color: #7e22ce; border-radius: 4px; font-size: 10px; font-weight: 700; margin-bottom: 4px;">
                ${venue.campus === 'Jatinangor' ? 'Kampus Jatinangor' : 'Kampus Dipati Ukur'} • Kapasitas: ${venue.capacity} Org
              </div>
              <div style="font-weight: 800; color: #0f172a; font-size: 13px; margin-bottom: 2px;">
                ${venue.name}
              </div>
              <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">
                ${venue.subName}
              </div>
              <p style="color: #475569; font-size: 11px; line-height: 1.4; margin-bottom: 6px;">
                ${venue.description}
              </p>
              <div style="background: #faf5ff; border: 1px solid #f3e8ff; border-radius: 6px; padding: 6px; font-size: 11px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #6b21a8;">Agenda Terjadwal:</span>
                  <strong style="color: #6b21a8;">${statsForVenue.totalAgendas} Kunjungan (${statsForVenue.totalPartisipan} org)</strong>
                </div>
              </div>
            </div>
          `);

        bounds.extend([venue.lat, venue.lng]);
      });
    }

    // 3. SCHOOL ORIGIN MARKERS (If mode is 'origins' or 'both')
    if (viewMode === 'origins' || viewMode === 'both') {
      schoolClusters.forEach(cluster => {
        // Compute radius based on total participants (min 8px, max 24px)
        const radius = Math.min(24, Math.max(8, Math.round(Math.sqrt(cluster.totalPartisipan) * 1.5)));

        // Color depends on payment status dominance or distance
        const isLunas = cluster.statusBayarSummary.sudah > 0 && cluster.statusBayarSummary.belum === 0;
        const color = isLunas ? '#002B66' : '#d97706'; // Unpad Navy or Amber

        const schoolCircle = L.circleMarker([cluster.lat, cluster.lng], {
          radius: radius,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 0.9,
          fillOpacity: 0.75
        }).addTo(layerGroup);

        schoolCircle.on('click', () => {
          setSelectedSchool(cluster);
          setSelectedVenue(null);
        });

        // Popup Content
        const popupHtml = `
          <div style="font-family: inherit; font-size: 12px; padding: 4px; min-width: 240px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="padding: 2px 6px; background: ${isLunas ? '#e0f2fe' : '#fef3c7'}; color: ${isLunas ? '#0369a1' : '#b45309'}; border-radius: 4px; font-size: 10px; font-weight: 700;">
                ${isLunas ? 'Lunas VA' : 'Menunggu Pelunasan'}
              </span>
              <span style="font-size: 10px; color: #64748b; font-family: monospace;">
                ${cluster.distanceKm} km ke Unpad
              </span>
            </div>
            <div style="font-weight: 800; color: #002B66; font-size: 13px; margin-bottom: 2px;">
              ${cluster.namaSekolah}
            </div>
            <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">
              ${cluster.kota}, ${cluster.provinsi}
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px; font-size: 11px; margin-bottom: 6px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span style="color: #475569;">Total Partisipan:</span>
                <strong style="color: #002B66;">${cluster.totalPartisipan} Org (${cluster.totalPeserta} siswa, ${cluster.totalGuru} guru)</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span style="color: #475569;">Skema:</span>
                <strong style="color: #059669;">${cluster.skemaList.join(', ') || 'Eduventure'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #475569;">Agenda Kunjungan:</span>
                <strong style="color: #475569;">${cluster.bookings.length} Agenda (${cluster.latestDate})</strong>
              </div>
            </div>
            <div style="font-size: 10px; color: #94a3b8; text-align: center;">
              Klik sekolah pada panel samping untuk melihat rincian agenda lengkap
            </div>
          </div>
        `;
        schoolCircle.bindPopup(popupHtml);

        bounds.extend([cluster.lat, cluster.lng]);

        // 4. ROUTE LINES (Connecting school to Unpad Jatinangor)
        if (showRouteLines) {
          const polyline = L.polyline([
            [cluster.lat, cluster.lng],
            UNPAD_MAIN_COORDS
          ], {
            color: isLunas ? '#3b82f6' : '#f59e0b',
            weight: 1.5,
            opacity: 0.45,
            dashArray: '5, 8'
          }).addTo(routesGroup);
        }
      });
    }

    // Fit bounds if valid and not empty
    if (bounds.isValid() && schoolClusters.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [schoolClusters, viewMode, showRouteLines, mapStyle]);

  // Handle fly to school location
  const handleFlyToSchool = (cluster: SchoolGeoCluster) => {
    setSelectedSchool(cluster);
    setSelectedVenue(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([cluster.lat, cluster.lng], 13, {
        duration: 1.2
      });
    }
  };

  // Handle fly to venue location
  const handleFlyToVenue = (venue: EduventureVenueLocation) => {
    setSelectedVenue(venue);
    setSelectedSchool(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([venue.lat, venue.lng], 16, {
        duration: 1.2
      });
    }
  };

  // Reset View to fit entire West Java / Indonesia
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(UNPAD_MAIN_COORDS, 8);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getWaLink = (item: EduventureBooking) => {
    const rawNo = item.nomorKontak ? item.nomorKontak.replace(/[^0-9]/g, '') : '';
    let waPhone = rawNo;
    if (waPhone.startsWith('0')) waPhone = '62' + waPhone.substring(1);
    const message = encodeURIComponent(
      `Halo Bapak/Ibu ${item.kontakPerson || 'Narahubung'},\n\nKami dari Sekretariat Eduventure Universitas Padjadjaran mengonfirmasi terkait rencana kunjungan kampus dari *${item.namaSekolah}* pada tanggal *${item.tanggalPelaksanaan}* (${item.waktuMulai || '08:30'} WIB) di *${item.tempatPenyelenggaraan || 'Bale Sawala'}*.\n\nTerima kasih.`
    );
    return `https://wa.me/${waPhone}?text=${message}`;
  };

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm p-4' : ''}`}>
      {/* 1. Header Banner & Analytics Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-[#002B66]/10 text-[#002B66] rounded-xl shrink-0 mt-0.5">
              <Compass className="w-6 h-6 text-[#002B66]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Peta Geografis & Sebaran Eduventure</span>
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-blue-100 text-[#002B66] rounded-full border border-blue-200">
                  Visual GIS
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Visualisasi titik persebaran asal sekolah dari seluruh Indonesia yang mengunjungi Universitas Padjadjaran, rute perjalanan, serta peta auditorium & bale fasilitas kampus.
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-3 py-1.5 bg-blue-50/70 border border-blue-200/60 rounded-xl">
              <span className="text-[10px] font-semibold text-blue-600 uppercase block">Sekolah Terpetakan</span>
              <span className="font-extrabold text-[#002B66] text-sm">{mapStats.totalSchools} Sekolah</span>
            </div>

            <div className="px-3 py-1.5 bg-emerald-50/70 border border-emerald-200/60 rounded-xl">
              <span className="text-[10px] font-semibold text-emerald-600 uppercase block">Total Partisipan</span>
              <span className="font-extrabold text-emerald-800 text-sm">{mapStats.totalPartisipan.toLocaleString('id-ID')} Orang</span>
            </div>

            <div className="px-3 py-1.5 bg-amber-50/70 border border-amber-200/60 rounded-xl">
              <span className="text-[10px] font-semibold text-amber-700 uppercase block">Rata-rata Jarak</span>
              <span className="font-extrabold text-amber-900 text-sm">± {mapStats.avgDistance} km</span>
            </div>

            <div className="px-3 py-1.5 bg-purple-50/70 border border-purple-200/60 rounded-xl">
              <span className="text-[10px] font-semibold text-purple-700 uppercase block">Dominasi Jabar</span>
              <span className="font-extrabold text-purple-900 text-sm">{mapStats.jabarPct}% ({mapStats.jabarSchools} Sek)</span>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAiExplorer(
                'Fasilitas & Venue Eduventure Universitas Padjadjaran',
                { latitude: -6.9261, longitude: 107.7747 },
                'Rekomendasi fasilitas kampus Unpad, auditorium, bale, akses rute bus rombongan, dan tempat kuliner edukasi di Jatinangor'
              )}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              title="Buka AI Explorer dengan Google Maps Grounding"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Tanya Google Maps AI</span>
            </button>
          </div>
        </div>

        {/* 2. Interactive Map Filters Toolbar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Segmented Control */}
            <div className="inline-flex bg-slate-100 p-1 rounded-xl font-medium text-slate-600">
              <button
                type="button"
                onClick={() => setViewMode('origins')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewMode === 'origins' 
                    ? 'bg-white text-[#002B66] font-bold shadow-xs' 
                    : 'hover:text-slate-900'
                }`}
              >
                🏫 Asal Sekolah
              </button>
              <button
                type="button"
                onClick={() => setViewMode('venues')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewMode === 'venues' 
                    ? 'bg-white text-[#002B66] font-bold shadow-xs' 
                    : 'hover:text-slate-900'
                }`}
              >
                🏛️ Fasilitas Kampus Unpad
              </button>
              <button
                type="button"
                onClick={() => setViewMode('both')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewMode === 'both' 
                    ? 'bg-white text-[#002B66] font-bold shadow-xs' 
                    : 'hover:text-slate-900'
                }`}
              >
                🌐 Mode Terpadu
              </button>
            </div>

            {/* Filter Tahun */}
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="ALL">Semua Tahun</option>
              {availableYears.map(y => (
                <option key={y} value={y}>Tahun {y}</option>
              ))}
            </select>

            {/* Filter Skema Paket */}
            <select
              value={filterSkema}
              onChange={(e) => setFilterSkema(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="ALL">Semua Paket</option>
              <option value="Eduventure Lite">Eduventure Lite</option>
              <option value="Eduventure Experience">Eduventure Experience</option>
              <option value="Eduventure Tematik">Eduventure Tematik</option>
            </select>

            {/* Filter Status Bayar */}
            <select
              value={filterStatusBayar}
              onChange={(e) => setFilterStatusBayar(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="ALL">Semua Status Bayar</option>
              <option value="Sudah">Sudah Lunas</option>
              <option value="Belum">Belum Bayar</option>
            </select>

            {/* Filter Wilayah */}
            <select
              value={filterWilayah}
              onChange={(e) => setFilterWilayah(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="ALL">Semua Wilayah</option>
              <option value="JABAR">Jawa Barat Saja</option>
              <option value="LUAR_JABAR">Luar Jawa Barat</option>
            </select>
          </div>

          {/* Map Layer & Auxiliary Controls */}
          <div className="flex items-center gap-2">
            {/* Toggle Route Lines */}
            <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer select-none font-medium">
              <input
                type="checkbox"
                checked={showRouteLines}
                onChange={(e) => setShowRouteLines(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#002B66] focus:ring-[#002B66]"
              />
              <span>Rute Jalur</span>
            </label>

            {/* Map Style Selector */}
            <select
              value={mapStyle}
              onChange={(e) => setMapStyle(e.target.value as any)}
              className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-[#002B66] shadow-2xs"
            >
              <option value="google-streets">🗺️ Google Maps (Jalan)</option>
              <option value="google-satellite">🛰️ Google Maps (Satelit)</option>
              <option value="google-hybrid">🌐 Google Maps (Hibrid)</option>
              <option value="google-terrain">⛰️ Google Maps (Medan)</option>
              <option value="positron">Peta Terang (Carto)</option>
              <option value="osm">OpenStreetMap</option>
              <option value="topo">Topografi / Kontur</option>
            </select>

            {/* Reset View Button */}
            <button
              type="button"
              onClick={handleResetView}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="Reset Tampilan Peta"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title={isFullscreen ? 'Keluar Fullscreen' : 'Perbesar Peta'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Stage: Interactive Map Canvas + Interactive Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map Stage (8 Columns) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col relative h-[520px] lg:h-[600px]">
          {/* Zoom Buttons floating inside map */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 shadow-md">
            <button
              type="button"
              onClick={() => mapInstanceRef.current?.zoomIn()}
              className="w-8 h-8 rounded-lg bg-white/95 backdrop-blur-xs hover:bg-white text-slate-700 flex items-center justify-center font-bold text-sm shadow-xs border border-slate-200/70"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => mapInstanceRef.current?.zoomOut()}
              className="w-8 h-8 rounded-lg bg-white/95 backdrop-blur-xs hover:bg-white text-slate-700 flex items-center justify-center font-bold text-sm shadow-xs border border-slate-200/70"
            >
              -
            </button>
          </div>

          {/* Floating Map Legend */}
          <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-lg text-[11px] space-y-1.5 max-w-[240px]">
            <span className="font-bold text-slate-800 block text-xs">Legenda Peta Eduventure</span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#002B66] border border-white shrink-0"></span>
              <span className="text-slate-600">Sekolah (Lunas VA)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shrink-0"></span>
              <span className="text-slate-600">Sekolah (Belum Lunas)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-purple-600 border border-white shrink-0"></span>
              <span className="text-slate-600">Venue / Bale Kampus Unpad</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 border-t-2 border-dashed border-blue-500 shrink-0"></span>
              <span className="text-slate-600">Rute Perjalanan ke Jatinangor</span>
            </div>
          </div>

          {/* Leaflet DOM Node */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />
        </div>

        {/* Side Panel: School Directory & Selected Detail (4 Columns) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col justify-between h-[520px] lg:h-[600px] space-y-3">
          {/* Search bar inside panel */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama sekolah, kota, atau provinsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002B66]"
            />
          </div>

          {/* Conditional: Active Selection (School or Venue) vs Directory List */}
          {selectedSchool ? (
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-blue-50/50 rounded-xl border border-blue-200">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#002B66] text-white">
                    Sekolah Terpilih
                  </span>
                  <h3 className="text-sm font-bold text-[#002B66] mt-1.5">
                    {selectedSchool.namaSekolah}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedSchool.kota}, {selectedSchool.provinsi}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSchool(null)}
                  className="text-slate-400 hover:text-slate-700 text-xs font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Distance and Participant KPI */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                  <span className="text-[10px] text-slate-400 block font-semibold">Jarak ke Unpad</span>
                  <span className="font-extrabold text-[#002B66]">± {selectedSchool.distanceKm} km</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                  <span className="text-[10px] text-slate-400 block font-semibold">Total Rombongan</span>
                  <span className="font-extrabold text-emerald-700">{selectedSchool.totalPartisipan} Org</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1 bg-white p-2.5 rounded-lg border border-blue-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Siswa:</span>
                  <span className="font-bold text-slate-800">{selectedSchool.totalPeserta} siswa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Guru Pendamping:</span>
                  <span className="font-bold text-slate-800">{selectedSchool.totalGuru} guru</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status Pembayaran:</span>
                  <span className={`font-bold ${selectedSchool.statusBayarSummary.sudah > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {selectedSchool.statusBayarSummary.sudah > 0 ? 'Sudah Lunas' : 'Menunggu Pelunasan'}
                  </span>
                </div>
              </div>

              {/* Booking Items from this School */}
              <div>
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Daftar Agenda Kunjungan ({selectedSchool.bookings.length})
                </span>
                <div className="space-y-2">
                  {selectedSchool.bookings.map(b => (
                    <div key={b.id} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{b.tanggalPelaksanaan}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {b.waktuMulai || '08:30'} WIB
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Venue: <strong>{b.tempatPenyelenggaraan || 'Bale Sawala'}</strong>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Paket: <strong>{b.skemaPaket}</strong>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="font-bold text-[#002B66] text-[11px]">
                          {formatRupiah(b.nominalTransfer)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {b.nomorKontak && (
                            <a
                              href={getWaLink(b)}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                              title="Hubungi Kontak Guru via WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {onSelectBooking && (
                            <button
                              type="button"
                              onClick={() => onSelectBooking(b)}
                              className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                              title="Buka Lembar Detail Agenda"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Google Maps & AI Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => handleOpenAiExplorer(
                    selectedSchool.namaSekolah,
                    { latitude: selectedSchool.lat, longitude: selectedSchool.lng },
                    `Informasi rute perjalanan dari ${selectedSchool.namaSekolah} (${selectedSchool.kota}, ${selectedSchool.provinsi}) menuju Kampus Unpad Jatinangor, estimasi waktu tempuh, gerbang tol terdekat, dan persiapan logistik rombongan`
                  )}
                  className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Analisis Rute & Info Google Maps AI</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedSchool.namaSekolah + ', ' + selectedSchool.alamat)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-[11px] flex items-center justify-center gap-1 transition-all border border-slate-200 text-center"
                  >
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                    <span>Google Maps</span>
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${selectedSchool.lat},${selectedSchool.lng}&destination=-6.9261,107.7747`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded-lg text-[11px] flex items-center justify-center gap-1 transition-all border border-amber-200 text-center"
                  >
                    <Navigation className="w-3 h-3 text-amber-600" />
                    <span>Rute ke Unpad</span>
                  </a>
                </div>
              </div>
            </div>
          ) : selectedVenue ? (
            /* Selected Campus Venue Info */
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-purple-50/50 rounded-xl border border-purple-200">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-700 text-white">
                    Fasilitas Kampus Unpad
                  </span>
                  <h3 className="text-sm font-bold text-purple-900 mt-1.5">
                    {selectedVenue.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedVenue.subName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVenue(null)}
                  className="text-slate-400 hover:text-slate-700 text-xs font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-purple-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Lokasi Kampus:</span>
                  <strong className="text-slate-800">{selectedVenue.campus}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kapasitas Maksimal:</span>
                  <strong className="text-purple-700">{selectedVenue.capacity} Orang</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Agenda Terjadwal:</span>
                  <strong className="text-[#002B66]">{venueStats[selectedVenue.name]?.totalAgendas || 0} Acara</strong>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-purple-100">
                {selectedVenue.description}
              </p>

              {/* Google Maps & AI Actions for Venue */}
              <div className="space-y-2 pt-2 border-t border-purple-200">
                <button
                  type="button"
                  onClick={() => handleOpenAiExplorer(
                    selectedVenue.name,
                    { latitude: selectedVenue.lat, longitude: selectedVenue.lng },
                    `Informasi fasilitas, area parkir bus rombongan, akses jalan, dan titik kumpul di sekitar ${selectedVenue.name} (${selectedVenue.campus})`
                  )}
                  className="w-full py-2 px-3 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Eksplorasi Fasilitas dengan AI</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedVenue.lat},${selectedVenue.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-[11px] flex items-center justify-center gap-1 transition-all border border-purple-200 text-center"
                  >
                    <ExternalLink className="w-3 h-3 text-purple-600" />
                    <span>Google Maps</span>
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedVenue.lat},${selectedVenue.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2 bg-purple-100 hover:bg-purple-200 text-purple-900 font-semibold rounded-lg text-[11px] flex items-center justify-center gap-1 transition-all border border-purple-300 text-center"
                  >
                    <Navigation className="w-3 h-3 text-purple-700" />
                    <span>Petunjuk Rute</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* Default School List Directory */
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
                <span>Daftar Sekolah ({searchedSchools.length})</span>
                <span>Klik untuk fokus di peta</span>
              </div>

              {searchedSchools.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Tidak ada sekolah yang cocok dengan kriteria pencarian.
                </div>
              ) : (
                searchedSchools.map(c => (
                  <div
                    key={c.key}
                    onClick={() => handleFlyToSchool(c)}
                    className="p-2.5 rounded-xl border border-slate-200/80 hover:border-[#002B66] hover:bg-blue-50/40 cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-800 truncate">
                        {c.namaSekolah}
                      </h4>
                      <span className="text-[10px] font-mono font-bold text-[#002B66] shrink-0">
                        {c.distanceKm} km
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{c.kota}</span>
                      <span className="font-bold text-emerald-700">
                        {c.totalPartisipan} Siswa/Guru
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Side Panel Footer Note */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-[#002B66]" />
              <span>Titik koordinat terpetakan otomatis</span>
            </span>
            <span className="font-bold text-[#002B66]">GIS Unpad</span>
          </div>
        </div>
      </div>

      {/* Google Maps AI Grounding Intelligence Modal */}
      <GoogleMapsAiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        initialPrompt={aiModalPrompt}
        initialLocationName={aiModalLocationName}
        initialCoords={aiModalCoords}
      />
    </div>
  );
};
