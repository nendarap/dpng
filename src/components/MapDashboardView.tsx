import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { 
  Map as MapIcon, MapPin, Layers, ZoomIn, ZoomOut, Filter, RotateCcw, 
  Users, Building2, Award, GraduationCap, ChevronRight, CheckCircle2, 
  ExternalLink, Eye, Compass, Globe2, School, Search, Info,
  Sparkles, Navigation, ArrowUpRight, ArrowLeft, Bookmark
} from 'lucide-react';
import { Peserta, Kategori, Program } from '../types';
import { UnpadLogo } from './UnpadLogo';
import { GoogleMapsAiModal } from './GoogleMapsAiModal';
import { 
  UNPAD_CAMPUSES, 
  PROVINCE_COORDINATES, 
  CITY_COORDINATES, 
  getParticipantCoordinate,
  resolveInstansiCoordinate
} from '../data/geoCoordinates';

interface MapDashboardViewProps {
  pesertaList: Peserta[];
  kategoriList: Kategori[];
  programList: Program[];
  onNavigateToPeserta: (filter?: Partial<Peserta>) => void;
  initialGroupBy?: 'instansi' | 'wilayah';
  initialInstansi?: string;
  isEmbedded?: boolean;
  onBackToTable?: () => void;
  isPublicView?: boolean;
  onNavigateToDashboard?: () => void;
  onNavigateToDaftar?: () => void;
}

interface LocationCluster {
  key: string;
  name: string;
  type: 'instansi' | 'wilayah';
  instansi?: string;
  provinsi: string;
  kotaKabupaten: string;
  lat: number;
  lng: number;
  count: number;
  pesertaItems: Peserta[];
  lulusCount: number;
  aktifCount: number;
  programs: Record<string, number>;
}

export const MapDashboardView: React.FC<MapDashboardViewProps> = ({
  pesertaList,
  kategoriList,
  programList,
  onNavigateToPeserta,
  initialGroupBy = 'instansi',
  initialInstansi,
  isEmbedded = false,
  onBackToTable,
  isPublicView = false,
  onNavigateToDashboard,
  onNavigateToDaftar,
}) => {
  // Map element ref & Leaflet instance ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Grouping Mode: 'instansi' (Default) or 'wilayah'
  const [groupBy, setGroupBy] = useState<'instansi' | 'wilayah'>(initialGroupBy);

  // Filter States
  const [filterTahun, setFilterTahun] = useState<string>('ALL');
  const [filterKategori, setFilterKategori] = useState<string>('ALL');
  const [filterProgram, setFilterProgram] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterWilayah, setFilterWilayah] = useState<'ALL' | 'JABAR' | 'LUAR_JAWA'>('ALL');
  const [filterInstansi, setFilterInstansi] = useState<string>(initialInstansi || 'ALL');
  const [searchLocationQuery, setSearchLocationQuery] = useState<string>('');

  // View States
  const [mapStyle, setMapStyle] = useState<'google-streets' | 'google-satellite' | 'google-hybrid' | 'google-terrain' | 'positron' | 'osm' | 'topo'>('google-streets');
  const [displayMode, setDisplayMode] = useState<'bubbles' | 'pins'>('bubbles');
  const [showCampuses, setShowCampuses] = useState<boolean>(true);
  const [selectedCluster, setSelectedCluster] = useState<LocationCluster | null>(null);

  // Google Maps AI Grounding State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiModalPrompt, setAiModalPrompt] = useState('');
  const [aiModalLocationName, setAiModalLocationName] = useState('Kampus Unpad Jatinangor');
  const [aiModalCoords, setAiModalCoords] = useState<{ latitude: number; longitude: number } | undefined>({ latitude: -6.9261, longitude: 107.7747 });

  // Update filterInstansi if initialInstansi prop changes
  useEffect(() => {
    if (initialInstansi) {
      setFilterInstansi(initialInstansi);
      setGroupBy('instansi');
    }
  }, [initialInstansi]);

  const handleOpenAiExplorer = (name?: string, coords?: { latitude: number; longitude: number }, customPrompt?: string) => {
    const locName = name || 'Kampus Unpad Jatinangor';
    const locCoords = coords || { latitude: -6.9261, longitude: 107.7747 };
    setAiModalLocationName(locName);
    setAiModalCoords(locCoords);
    setAiModalPrompt(customPrompt || `Rekomendasi fasilitas, akses transportasi, dan akomodasi di sekitar ${locName}`);
    setIsAiModalOpen(true);
  };

  // Unique list of all Instansi sorted by frequency
  const uniqueInstansiList = useMemo(() => {
    const counts: Record<string, number> = {};
    pesertaList.forEach(p => {
      const inst = (p.instansi || 'Pribadi / Mandiri').trim();
      counts[inst] = (counts[inst] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [pesertaList]);

  // Filtered Peserta Data
  const filteredPeserta = useMemo(() => {
    return pesertaList.filter(p => {
      if (filterTahun !== 'ALL' && String(p.tahun) !== filterTahun) return false;
      if (filterKategori !== 'ALL' && p.kategoriProgram !== filterKategori) return false;
      if (filterProgram !== 'ALL' && p.namaProgram !== filterProgram) return false;
      if (filterStatus !== 'ALL' && p.statusPeserta !== filterStatus) return false;
      if (filterInstansi !== 'ALL' && (p.instansi || '').trim() !== filterInstansi) return false;
      if (filterWilayah === 'JABAR' && p.provinsi !== 'Jawa Barat') return false;
      if (filterWilayah === 'LUAR_JAWA' && ['Jawa Barat', 'DKI Jakarta', 'Banten', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur'].includes(p.provinsi)) {
        return false;
      }
      return true;
    });
  }, [pesertaList, filterTahun, filterKategori, filterProgram, filterStatus, filterInstansi, filterWilayah]);

  // Grouping peserta into clusters (by Instansi or by Kota/Wilayah)
  const clusters = useMemo(() => {
    const map = new Map<string, LocationCluster>();

    if (groupBy === 'instansi') {
      // Grouping per Instansi
      const groupedByInstansi: Record<string, Peserta[]> = {};
      filteredPeserta.forEach(p => {
        const inst = (p.instansi || 'Pribadi / Mandiri').trim();
        if (!groupedByInstansi[inst]) groupedByInstansi[inst] = [];
        groupedByInstansi[inst].push(p);
      });

      Object.entries(groupedByInstansi).forEach(([instName, items]) => {
        const coordInfo = resolveInstansiCoordinate(instName, items);
        const cluster: LocationCluster = {
          key: `instansi__${instName}`,
          name: instName,
          type: 'instansi',
          instansi: instName,
          provinsi: coordInfo.provinsi,
          kotaKabupaten: coordInfo.kota,
          lat: coordInfo.lat,
          lng: coordInfo.lng,
          count: items.length,
          pesertaItems: items,
          lulusCount: items.filter(p => p.statusKelulusan === 'Lulus').length,
          aktifCount: items.filter(p => p.statusPeserta === 'Aktif').length,
          programs: {},
        };

        items.forEach(p => {
          const prog = p.namaProgram || 'Umum';
          cluster.programs[prog] = (cluster.programs[prog] || 0) + 1;
        });

        map.set(instName, cluster);
      });
    } else {
      // Grouping per Kota / Wilayah Geografis
      filteredPeserta.forEach(p => {
        const prov = p.provinsi?.trim() || 'Jawa Barat';
        const city = p.kotaKabupaten?.trim() || prov;
        const clusterKey = `${city}__${prov}`;

        if (!map.has(clusterKey)) {
          const [lat, lng] = getParticipantCoordinate(prov, city);
          map.set(clusterKey, {
            key: clusterKey,
            name: city,
            type: 'wilayah',
            provinsi: prov,
            kotaKabupaten: city,
            lat,
            lng,
            count: 0,
            pesertaItems: [],
            lulusCount: 0,
            aktifCount: 0,
            programs: {},
          });
        }

        const cluster = map.get(clusterKey)!;
        cluster.count += 1;
        cluster.pesertaItems.push(p);
        if (p.statusKelulusan === 'Lulus') cluster.lulusCount += 1;
        if (p.statusPeserta === 'Aktif') cluster.aktifCount += 1;

        const prog = p.namaProgram || 'Umum';
        cluster.programs[prog] = (cluster.programs[prog] || 0) + 1;
      });
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filteredPeserta, groupBy]);

  // Top 8 Instansi List for sidebar
  const topInstansiList = useMemo(() => {
    const counts: Record<string, { count: number; lulusCount: number; kota: string; provinsi: string; lat: number; lng: number }> = {};
    filteredPeserta.forEach(p => {
      const inst = (p.instansi || 'Pribadi / Mandiri').trim();
      if (!counts[inst]) {
        counts[inst] = { count: 0, lulusCount: 0, kota: p.kotaKabupaten || '', provinsi: p.provinsi || '', lat: 0, lng: 0 };
      }
      counts[inst].count++;
      if (p.statusKelulusan === 'Lulus') counts[inst].lulusCount++;
    });

    return Object.entries(counts)
      .map(([name, data]) => {
        const coord = resolveInstansiCoordinate(name, filteredPeserta.filter(p => (p.instansi || '').trim() === name));
        return {
          name,
          count: data.count,
          lulusCount: data.lulusCount,
          kota: coord.kota,
          provinsi: coord.provinsi,
          lat: coord.lat,
          lng: coord.lng
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredPeserta]);

  // Top 5 Provinces
  const topProvinces = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredPeserta.forEach(p => {
      const prov = p.provinsi?.trim() || 'Lainnya';
      counts[prov] = (counts[prov] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredPeserta]);

  // Statistics Summary
  const totalMapped = filteredPeserta.length;
  const uniqueInstansiCount = useMemo(() => {
    const set = new Set(filteredPeserta.map(p => (p.instansi || 'Pribadi / Mandiri').trim()));
    return set.size;
  }, [filteredPeserta]);

  const uniqueProvincesCount = useMemo(() => {
    const set = new Set(filteredPeserta.map(p => p.provinsi?.trim()).filter(Boolean));
    return set.size;
  }, [filteredPeserta]);

  const jabarCount = useMemo(() => {
    return filteredPeserta.filter(p => p.provinsi === 'Jawa Barat').length;
  }, [filteredPeserta]);

  const luarJawaCount = useMemo(() => {
    const jawaProvs = ['Jawa Barat', 'DKI Jakarta', 'Banten', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur'];
    return filteredPeserta.filter(p => !jawaProvs.includes(p.provinsi)).length;
  }, [filteredPeserta]);

  // Tile layer URL resolver
  const getTileUrl = (style: 'google-streets' | 'google-satellite' | 'google-hybrid' | 'google-terrain' | 'positron' | 'osm' | 'topo') => {
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
      // Default view: Center of West Java / Bandung
      const map = L.map(mapContainerRef.current, {
        center: [-6.9175, 107.6191],
        zoom: 8,
        zoomControl: false,
        attributionControl: true,
      });

      // Custom zoom control in bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add Base Tile Layer
      const tileConfig = getTileUrl(mapStyle);
      L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: 19,
      }).addTo(map);

      // Layer group for markers
      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;

      mapInstanceRef.current = map;

      // Ensure proper tile rendering after DOM paint
      setTimeout(() => {
        map.invalidateSize();
      }, 250);

      const handleResize = () => {
        map.invalidateSize();
      };
      window.addEventListener('resize', handleResize);
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when style changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const tileConfig = getTileUrl(mapStyle);
    L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 19,
    }).addTo(map);
  }, [mapStyle]);

  // Update Markers & Overlay Layers
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    const group = layerGroupRef.current;
    group.clearLayers();

    // 1. Draw Unpad Campuses (if enabled)
    if (showCampuses) {
      UNPAD_CAMPUSES.forEach(campus => {
        const campusIcon = L.divIcon({
          className: 'custom-campus-marker',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer group">
              <div class="absolute -inset-2 bg-amber-400/40 rounded-full animate-ping pointer-events-none"></div>
              <div class="w-8 h-8 rounded-xl bg-[#002B66] border-2 border-[#FDB913] text-[#FDB913] flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </div>
              <span class="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#002B66] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md pointer-events-none">
                ${campus.id === 'unpad-jatinangor' ? 'Kampus Jatinangor' : campus.id === 'unpad-dipatiukur' ? 'Kampus Dipati Ukur' : 'RSHS / FK'}
              </span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const campusMarker = L.marker([campus.lat, campus.lng], { icon: campusIcon });
        
        campusMarker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; min-width: 230px; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
              <span style="background: #002B66; color: #FDB913; font-weight: 800; font-size: 10px; padding: 2px 6px; border-radius: 4px;">KAMPUS UNPAD</span>
              <span style="font-size: 11px; color: #64748B; font-weight: 600;">Direktorat DPNG</span>
            </div>
            <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 800; color: #002B66; line-height: 1.3;">${campus.name}</h4>
            <p style="margin: 0 0 6px 0; font-size: 11px; color: #475569;">${campus.subName}</p>
            <div style="font-size: 10px; color: #64748B; line-height: 1.4; background: #F8FAFC; padding: 6px 8px; border-radius: 6px; border: 1px solid #E2E8F0; margin-bottom: 8px;">
              ${campus.description}
            </div>
            <div style="display: flex; gap: 4px;">
              <a href="https://www.google.com/maps/search/?api=1&query=${campus.lat},${campus.lng}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background: #002B66; color: #FFFFFF; padding: 5px 8px; border-radius: 6px; text-decoration: none; font-size: 10px; font-weight: 700;">
                📍 Google Maps
              </a>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${campus.lat},${campus.lng}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background: #FDB913; color: #002B66; padding: 5px 8px; border-radius: 6px; text-decoration: none; font-size: 10px; font-weight: 700;">
                🚗 Petunjuk Arah
              </a>
            </div>
          </div>
        `);

        campusMarker.addTo(group);
      });
    }

    // 2. Draw Clusters (either by Instansi or Wilayah)
    clusters.forEach(cluster => {
      if (groupBy === 'instansi') {
        // Distinctive Institution Marker with Building Icon & Badge
        const instansiIcon = L.divIcon({
          className: 'custom-instansi-marker',
          html: `
            <div class="relative flex flex-col items-center cursor-pointer group">
              <div class="px-2.5 py-1 rounded-xl bg-[#002B66] text-white border-2 border-[#FDB913] shadow-lg flex items-center gap-1.5 transform group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-[#FDB913] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
                  <path d="M9 22v-4h6v4"/>
                  <path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/>
                  <path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/>
                  <path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
                </svg>
                <span class="text-xs font-black tracking-tight text-white">${cluster.count}</span>
              </div>
              <div class="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-[#002B66] -mt-[1px]"></div>
              <span class="mt-1 max-w-[130px] truncate text-center text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-white/95 text-[#002B66] shadow-xs border border-slate-200">
                ${cluster.name}
              </span>
            </div>
          `,
          iconSize: [120, 48],
          iconAnchor: [60, 24],
        });

        const marker = L.marker([cluster.lat, cluster.lng], { icon: instansiIcon });
        marker.on('click', () => {
          setSelectedCluster(cluster);
        });

        marker.bindTooltip(`
          <div style="font-family: system-ui, sans-serif; text-align: left; padding: 3px 5px; min-width: 170px;">
            <div style="font-size: 10px; font-weight: 700; color: #FDB913; background: #002B66; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 3px;">INSTANSI PESERTA</div>
            <div style="font-weight: 800; color: #002B66; font-size: 12px; line-height: 1.2;">${cluster.name}</div>
            <div style="font-size: 10.5px; color: #64748B; margin-top: 2px;">📍 ${cluster.kotaKabupaten}, ${cluster.provinsi}</div>
            <div style="margin-top: 4px; font-weight: 800; font-size: 11px; color: #0369a1; border-top: 1px solid #e2e8f0; pt: 3px;">
              👥 ${cluster.count} Peserta (${cluster.lulusCount} Lulus, ${cluster.aktifCount} Aktif)
            </div>
          </div>
        `, { direction: 'top', offset: [0, -20] });

        marker.addTo(group);

      } else {
        // Mode Wilayah: Bubble or Pin
        if (displayMode === 'bubbles') {
          const minRadius = 12;
          const maxRadius = 38;
          const radius = Math.min(maxRadius, Math.max(minRadius, Math.sqrt(cluster.count) * 10));

          let fillColor = '#0284c7';
          let strokeColor = '#0369a1';
          if (cluster.count > 10) {
            fillColor = '#002B66';
            strokeColor = '#FDB913';
          } else if (cluster.count > 4) {
            fillColor = '#0284c7';
            strokeColor = '#0284c7';
          }

          const circle = L.circleMarker([cluster.lat, cluster.lng], {
            radius: radius,
            fillColor: fillColor,
            color: strokeColor,
            weight: 2,
            opacity: 0.9,
            fillOpacity: 0.65,
          });

          circle.on('click', () => {
            setSelectedCluster(cluster);
          });

          circle.bindTooltip(`
            <div style="font-family: system-ui, sans-serif; text-align: center; padding: 2px;">
              <div style="font-weight: 800; color: #002B66; font-size: 12px;">${cluster.name}</div>
              <div style="font-size: 11px; color: #475569;">${cluster.provinsi}</div>
              <div style="margin-top: 3px; font-weight: 800; font-size: 12px; color: #0284c7;">
                ${cluster.count} Peserta (${cluster.lulusCount} Lulus)
              </div>
            </div>
          `, { direction: 'top', offset: [0, -radius] });

          circle.addTo(group);

          const textIcon = L.divIcon({
            className: 'bubble-label',
            html: `<div class="w-full h-full flex items-center justify-center text-white font-extrabold text-[10px] drop-shadow-sm pointer-events-none">${cluster.count}</div>`,
            iconSize: [radius * 2, radius * 2],
            iconAnchor: [radius, radius],
          });
          L.marker([cluster.lat, cluster.lng], { icon: textIcon, interactive: false }).addTo(group);

        } else {
          // Pin Marker Mode
          const pinIcon = L.divIcon({
            className: 'custom-pin-marker',
            html: `
              <div class="relative flex items-center justify-center cursor-pointer group">
                <div class="w-6 h-6 rounded-full bg-[#002B66] border-2 border-white text-white flex items-center justify-center shadow-md font-bold text-[10px] transform group-hover:scale-125 transition-transform">
                  ${cluster.count}
                </div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const pinMarker = L.marker([cluster.lat, cluster.lng], { icon: pinIcon });
          pinMarker.on('click', () => {
            setSelectedCluster(cluster);
          });

          pinMarker.bindTooltip(`
            <strong>${cluster.name}</strong> (${cluster.count} Peserta)
          `);

          pinMarker.addTo(group);
        }
      }
    });

    // Auto focus if initialInstansi is matched
    if (initialInstansi) {
      const match = clusters.find(c => c.name.toLowerCase() === initialInstansi.toLowerCase());
      if (match && mapInstanceRef.current) {
        setSelectedCluster(match);
        mapInstanceRef.current.flyTo([match.lat, match.lng], 11, { duration: 1.2 });
      }
    }
  }, [clusters, displayMode, showCampuses, groupBy, initialInstansi]);

  // Quick Zoom Helper
  const handleQuickZoom = (preset: 'INDONESIA' | 'JABAR' | 'JATINANGOR' | 'DIPATIUKUR' | 'JAKARTA') => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    switch (preset) {
      case 'INDONESIA':
        map.flyTo([-2.5, 118], 5, { duration: 1.2 });
        break;
      case 'JABAR':
        map.flyTo([-6.9175, 107.6191], 8, { duration: 1.2 });
        break;
      case 'JATINANGOR':
        map.flyTo([-6.9261, 107.7747], 15, { duration: 1.2 });
        break;
      case 'DIPATIUKUR':
        map.flyTo([-6.8927, 107.6166], 15, { duration: 1.2 });
        break;
      case 'JAKARTA':
        map.flyTo([-6.2088, 106.8456], 10, { duration: 1.2 });
        break;
    }
  };

  // Zoom to specific cluster
  const handleFocusCluster = (cluster: LocationCluster) => {
    setSelectedCluster(cluster);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([cluster.lat, cluster.lng], 11, { duration: 1 });
    }
  };

  // Zoom to specific Instansi
  const handleFocusInstansi = (inst: { name: string; lat: number; lng: number }) => {
    const cluster = clusters.find(c => c.name === inst.name);
    if (cluster) {
      setSelectedCluster(cluster);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([cluster.lat, cluster.lng], 12, { duration: 1 });
      }
    } else if (mapInstanceRef.current && inst.lat && inst.lng) {
      mapInstanceRef.current.flyTo([inst.lat, inst.lng], 12, { duration: 1 });
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilterTahun('ALL');
    setFilterKategori('ALL');
    setFilterProgram('ALL');
    setFilterStatus('ALL');
    setFilterWilayah('ALL');
    setFilterInstansi('ALL');
    setSearchLocationQuery('');
    setSelectedCluster(null);
  };

  const hasActiveFilters = 
    filterTahun !== 'ALL' ||
    filterKategori !== 'ALL' ||
    filterProgram !== 'ALL' ||
    filterStatus !== 'ALL' ||
    filterWilayah !== 'ALL' ||
    filterInstansi !== 'ALL' ||
    searchLocationQuery.trim() !== '';

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <UnpadLogo variant="color" size="sm" />
          <div className="border-l border-slate-200 pl-3.5">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {isPublicView ? 'Peta Sebaran Mitra & Peserta Publik' : 'Peta Sebaran Peserta Berdasarkan Instansi'}
              </h1>
              {isPublicView && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1 shadow-2xs">
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Akses Publik (View Only)</span>
                </span>
              )}
              <span className="bg-[#002B66] text-[#FDB913] text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-900 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {uniqueInstansiCount} Instansi Mitra
              </span>
              <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Spasial Live
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
              {isPublicView
                ? 'Visualisasi spasial sebaran institusi mitra, rumah sakit, kementerian, BUMN, dan perusahaan asal peserta program Pendidikan Non Gelar Universitas Padjadjaran.'
                : 'Visualisasi sebaran spasial institusi, universitas, rumah sakit, kementerian, dan instansi asal peserta program Pendidikan Non Gelar Universitas Padjadjaran.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {onNavigateToDashboard && (
            <button
              onClick={onNavigateToDashboard}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-[#002B66] rounded-xl text-xs font-bold transition-all cursor-pointer border border-blue-200"
              title="Buka Dashboard Statistik Publik"
            >
              <span>📊 Dashboard Statistik</span>
            </button>
          )}

          {onNavigateToDaftar && (
            <button
              onClick={onNavigateToDaftar}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FDB913] hover:bg-amber-400 text-[#002B66] rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs"
              title="Buka Formulir Pendaftaran Peserta"
            >
              <GraduationCap className="w-4 h-4 text-[#002B66]" />
              <span>Daftar Pelatihan</span>
            </button>
          )}

          {isEmbedded && onBackToTable && !isPublicView && (
            <button
              onClick={onBackToTable}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>Kembali ke Tabel</span>
            </button>
          )}

          <button
            onClick={() => handleOpenAiExplorer()}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            title="Buka AI Explorer dengan data aktual Google Maps"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Tanya Google Maps AI</span>
          </button>

          {!isPublicView && (
            <button
              onClick={() => onNavigateToPeserta()}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#002B66] hover:bg-[#073877] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Users className="w-4 h-4 text-[#FDB913]" />
              <span>Tabel Data Lengkap</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">Total Instansi Mitra</span>
            <Building2 className="w-4 h-4 text-[#002B66]" />
          </div>
          <div className="text-2xl font-black text-[#002B66]">{uniqueInstansiCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-semibold text-emerald-600">{totalMapped} Peserta</span> terdata
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">Provinsi Asal Instansi</span>
            <Globe2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">{uniqueProvincesCount} <span className="text-xs font-normal text-slate-400">/ 38 Provinsi</span></div>
          <div className="text-[11px] text-slate-500 mt-1">
            Jangkauan mitra nasional
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">Instansi Homebase Jabar</span>
            <School className="w-4 h-4 text-[#FDB913]" />
          </div>
          <div className="text-2xl font-black text-amber-600">{jabarCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalMapped > 0 ? `${Math.round((jabarCount / totalMapped) * 100)}% dari total peserta` : '0%'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">Instansi Luar Jawa</span>
            <Compass className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{luarJawaCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Sumatera, Kalimantan, Sulawesi & Papua
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Filter className="w-3.5 h-3.5 text-[#002B66]" />
              <span>Filter Peta Sebaran</span>
            </div>

            {/* Mode Pengelompokan: Berdasarkan Instansi vs Wilayah */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setGroupBy('instansi')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  groupBy === 'instansi'
                    ? 'bg-[#002B66] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3 h-3 text-[#FDB913]" />
                <span>Berdasarkan Instansi</span>
              </button>
              <button
                type="button"
                onClick={() => setGroupBy('wilayah')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  groupBy === 'wilayah'
                    ? 'bg-[#002B66] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>Berdasarkan Wilayah Kota</span>
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          {/* Filter Instansi */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#002B66]" />
              <span>Pilih Instansi Mitra</span>
            </label>
            <select
              value={filterInstansi}
              onChange={(e) => {
                setFilterInstansi(e.target.value);
                if (e.target.value !== 'ALL') {
                  setGroupBy('instansi');
                }
              }}
              className="w-full p-2 rounded-lg border border-slate-300 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#002B66]"
            >
              <option value="ALL">Semua Instansi ({uniqueInstansiList.length} Lembaga)</option>
              {uniqueInstansiList.map(inst => (
                <option key={inst.name} value={inst.name}>
                  {inst.name} ({inst.count} Peserta)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Tahun</label>
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-slate-50 font-medium"
            >
              <option value="ALL">Semua Tahun</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Kategori Program</label>
            <select
              value={filterKategori}
              onChange={(e) => {
                setFilterKategori(e.target.value);
                setFilterProgram('ALL');
              }}
              className="w-full p-2 rounded-lg border border-slate-300 bg-slate-50 font-medium"
            >
              <option value="ALL">Semua Kategori (13 Divisi)</option>
              {kategoriList.map(k => (
                <option key={k.idKategori} value={k.namaKategori}>{k.namaKategori}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Program</label>
            <select
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-slate-50 font-medium"
            >
              <option value="ALL">Semua Program</option>
              {(() => {
                const targetKatId = kategoriList.find(k => k.namaKategori === filterKategori)?.idKategori;
                return programList
                  .filter(p => filterKategori === 'ALL' || (targetKatId && p.idKategori === targetKatId))
                  .map(p => (
                    <option key={p.idProgram} value={p.namaProgram}>{p.namaProgram}</option>
                  ));
              })()}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Status Peserta</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-slate-50 font-medium"
            >
              <option value="ALL">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Selesai">Selesai</option>
              <option value="Lulus">Lulus</option>
              <option value="Tidak Lulus">Tidak Lulus</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Map Content: 8 Columns Map + 4 Columns Institution/Cluster Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Map View (8 Columns) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          {/* Map Top Control Bar */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[#002B66] flex items-center gap-1 text-[11px]">
                <Layers className="w-3.5 h-3.5 text-[#002B66]" />
                <span>Mode:</span>
              </span>

              {/* Grouping Badge */}
              <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                groupBy === 'instansi' ? 'bg-[#002B66] text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {groupBy === 'instansi' ? '🏢 Sebaran Instansi' : '📍 Sebaran Wilayah'}
              </span>

              {/* Map Layer Switcher */}
              <select
                value={mapStyle}
                onChange={(e) => setMapStyle(e.target.value as any)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 font-semibold"
              >
                <option value="google-streets">Google Maps Standar</option>
                <option value="google-satellite">Google Maps Satelit</option>
                <option value="google-hybrid">Google Maps Hybrid</option>
                <option value="google-terrain">Google Maps Terrain</option>
                <option value="positron">Peta Terang (Clean)</option>
                <option value="osm">Peta Standar (OSM)</option>
                <option value="topo">Peta Topografi (Esri)</option>
              </select>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                <input
                  type="checkbox"
                  checked={showCampuses}
                  onChange={(e) => setShowCampuses(e.target.checked)}
                  className="rounded text-[#002B66]"
                />
                <span>Kampus Unpad</span>
              </label>
            </div>

            {/* Quick Zoom Presets */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[10px] font-semibold hidden sm:inline">Zoom:</span>
              <button
                onClick={() => handleQuickZoom('INDONESIA')}
                className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold"
              >
                RI
              </button>
              <button
                onClick={() => handleQuickZoom('JABAR')}
                className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold"
              >
                Jabar
              </button>
              <button
                onClick={() => handleQuickZoom('JATINANGOR')}
                className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[#002B66] text-[10px] font-bold"
                title="Pusat Rektorat & DPNG Jatinangor"
              >
                Jatinangor
              </button>
              <button
                onClick={() => handleQuickZoom('DIPATIUKUR')}
                className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#002B66] text-[10px] font-bold"
                title="Kampus Eksekutif Dipati Ukur"
              >
                DU
              </button>
            </div>
          </div>

          {/* Leaflet Map Canvas */}
          <div className="relative w-full h-[520px] bg-slate-100">
            <div 
              ref={mapContainerRef} 
              id="simpendik-leaflet-map"
              className="w-full h-full z-10" 
            />

            {/* Map Floating Legend */}
            <div className="absolute top-3 right-3 z-20 bg-white/95 backdrop-blur-xs p-3 rounded-xl shadow-md border border-slate-200/90 text-xs max-w-[210px] pointer-events-auto">
              <div className="font-bold text-[#002B66] text-[11px] mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                <span>Legenda Peta {groupBy === 'instansi' ? 'Instansi' : 'Wilayah'}</span>
              </div>
              <div className="space-y-1.5 text-[10px] text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#002B66] border border-[#FDB913] flex items-center justify-center text-[7px] text-white font-bold shrink-0">
                    ★
                  </span>
                  <span>Kampus Unpad DPNG</span>
                </div>
                {groupBy === 'instansi' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-md bg-[#002B66] border border-[#FDB913] flex items-center justify-center text-[8px] text-[#FDB913] font-bold shrink-0">
                        🏢
                      </div>
                      <span>Pin Instansi Mitra</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0"></span>
                      <span>Mitra dengan Kelulusan</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#002B66] opacity-80 shrink-0"></span>
                      <span>Konsentrasi Tinggi (&gt;10)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#0284c7] opacity-80 shrink-0"></span>
                      <span>Konsentrasi Sedang</span>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 text-[9px] text-slate-400">
                *Klik titik marker untuk detail peserta instansi
              </div>
            </div>
          </div>

          {/* Map Footer Helper */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                Menampilkan {clusters.length} titik {groupBy === 'instansi' ? 'instansi mitra' : 'kluster kota'} ({totalMapped} peserta)
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {groupBy === 'instansi' ? 'Geocoding otomatis berdasarkan lokasi instansi & domisili peserta' : 'Koordinat berdasarkan wilayah'}
            </span>
          </div>
        </div>

        {/* Right Detail Panel (4 Columns) */}
        <div className="lg:col-span-4 space-y-4 flex flex-col">
          
          {/* Selected Institution / Location Card (Dynamic) */}
          {selectedCluster ? (
            <div className="bg-white rounded-2xl border-2 border-[#002B66] shadow-md p-4 animate-in fade-in">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-[#002B66]" />
                    {selectedCluster.type === 'instansi' ? 'Instansi Terpilih' : 'Wilayah Terpilih'}
                  </span>
                  <h3 className="text-base font-black text-[#002B66] leading-tight mt-0.5">{selectedCluster.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    📍 {selectedCluster.kotaKabupaten}, {selectedCluster.provinsi}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCluster(null)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  ✕ Tutup
                </button>
              </div>

              {/* Stat summary for selected cluster */}
              <div className="grid grid-cols-3 gap-2 my-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <div>
                  <div className="text-lg font-black text-[#002B66]">{selectedCluster.count}</div>
                  <div className="text-[10px] text-slate-500">Peserta</div>
                </div>
                <div>
                  <div className="text-lg font-black text-emerald-600">{selectedCluster.lulusCount}</div>
                  <div className="text-[10px] text-emerald-600 font-medium">Lulus</div>
                </div>
                <div>
                  <div className="text-lg font-black text-blue-600">{selectedCluster.aktifCount}</div>
                  <div className="text-[10px] text-blue-600 font-medium">Aktif</div>
                </div>
              </div>

              {/* Program Breakdown */}
              <div className="mb-3">
                <div className="text-[11px] font-bold text-slate-700 mb-1.5">Program yang Diikuti:</div>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                  {Object.entries(selectedCluster.programs).map(([progName, count]) => (
                    <div key={progName} className="flex items-center justify-between text-xs p-1.5 rounded bg-slate-50">
                      <span className="truncate max-w-[170px] text-slate-700 font-medium">{progName}</span>
                      <span className="font-bold text-[#002B66] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                        {count} Peserta
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Participants List in Selected Cluster */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5">
                  <span>Daftar Peserta Instansi Ini:</span>
                  <span className="text-slate-400 font-normal">{selectedCluster.pesertaItems.length} orang</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {selectedCluster.pesertaItems.map(p => (
                    <div key={p.id} className="p-2 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 truncate max-w-[160px]">
                          {[p.gelarDepan, p.namaLengkap, p.gelarBelakang].filter(Boolean).join(' ')}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          p.statusKelulusan === 'Lulus' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {p.statusKelulusan || p.statusPeserta}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center justify-between">
                        <span>{p.jabatan || p.nip || p.nik}</span>
                        {p.nomorSertifikat && (
                          <span className="text-[9px] text-emerald-700 font-mono">No. {p.nomorSertifikat}</span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#002B66] font-medium truncate mt-0.5">
                        {p.namaProgram} &bull; {p.tahun}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 mt-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onNavigateToPeserta({ instansi: selectedCluster.name })}
                  className="w-full py-2 px-3 bg-[#002B66] hover:bg-[#002252] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-[#FDB913]" />
                  <span>{isPublicView ? 'Lihat Daftar Peserta Instansi Ini (View Only)' : 'Lihat di Tabel Peserta (Filter Instansi Ini)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAiExplorer(
                    `${selectedCluster.name}, ${selectedCluster.kotaKabupaten}, ${selectedCluster.provinsi}`,
                    { latitude: selectedCluster.lat, longitude: selectedCluster.lng },
                    `Informasi profil, akses transportasi, dan profil instansi ${selectedCluster.name} di ${selectedCluster.kotaKabupaten}, ${selectedCluster.provinsi}`
                  )}
                  className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Eksplorasi dengan Google Maps AI</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCluster.name + ', ' + selectedCluster.kotaKabupaten)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-[11px] flex items-center justify-center gap-1 transition-all text-center"
                  >
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                    <span>Google Maps</span>
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCluster.lat},${selectedCluster.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded-xl text-[11px] flex items-center justify-center gap-1 transition-all text-center border border-amber-200"
                  >
                    <Navigation className="w-3 h-3 text-amber-600" />
                    <span>Petunjuk Rute</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-400">
              <Building2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <h4 className="font-bold text-slate-700 text-xs mb-1">
                Pilih Titik {groupBy === 'instansi' ? 'Instansi' : 'Wilayah'} di Peta
              </h4>
              <p className="text-[11px] text-slate-400">
                Klik salah satu pin instansi pada peta atau pilih dari daftar Top Instansi di bawah untuk melihat rincian peserta.
              </p>
            </div>
          )}

          {/* Top Institutions Leaderboard Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#002B66]" />
                <h3 className="text-xs font-bold text-slate-800">Top Instansi Mitra Terbanyak</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Peserta</span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {topInstansiList.map((inst, index) => {
                const maxCount = topInstansiList[0]?.count || 1;
                const percent = Math.round((inst.count / maxCount) * 100);

                return (
                  <div 
                    key={inst.name} 
                    onClick={() => handleFocusInstansi(inst)}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-100 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-4 h-4 rounded-full bg-[#002B66] text-[#FDB913] text-[9px] font-black flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <span className="font-bold text-slate-800 truncate group-hover:text-[#002B66]">
                          {inst.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-black text-[#002B66]">{inst.count}</span>
                        <span className="text-[10px] text-slate-400">org</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden my-1">
                      <div 
                        className="bg-[#002B66] h-1.5 rounded-full transition-all duration-300 group-hover:bg-[#FDB913]" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>📍 {inst.kota || inst.provinsi || 'Indonesia'}</span>
                      <span className="text-emerald-700 font-semibold">{inst.lulusCount} Lulus</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Google Maps AI Modal */}
      {isAiModalOpen && (
        <GoogleMapsAiModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          initialPrompt={aiModalPrompt}
          initialLocationName={aiModalLocationName}
          initialCoords={aiModalCoords}
        />
      )}
    </div>
  );
};
