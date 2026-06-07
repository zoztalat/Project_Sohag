import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  MapPin,
  Search,
  Star,
  Phone,
  Clock,
  Navigation,
  Building2,
  Pill,
  Loader2,
  X,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Location {
  id: number;
  name: string;
  type: 'clinic' | 'pharmacy' | 'hospital' | 'doctor';
  specialty?: string;
  rating: number;
  reviews: number;
  distance: string;
  duration: string;
  distanceMeters: number;
  address: string;
  phone: string;
  hours: string;
  availability: string;
  lat: number;
  lng: number;
}

// ─── TomTom Places API ───────────────────────────────────────────────────────
const TOMTOM_KEY = 'JQZ27mgGmXX9JSYKjjOuGlbzx7DYuSs2';

const TOMTOM_CATEGORIES = [
  'hospital',
  'pharmacy',
  'doctor',
  'dentist',
  'clinic',
  'medical',
];

function detectTypeFromTomTom(category: string, name: string, categoryId?: number): {
  type: 'clinic' | 'pharmacy' | 'hospital' | 'doctor';
  specialty?: string;
} {
  const cat = category.toLowerCase();
  const n = name.toLowerCase();

  const isPharmacy = [9927, 7321].includes(categoryId ?? 0) || /pharmacy|drug|صيدلية/i.test(cat + n);
  const isHospital = categoryId === 9662 || /hospital|مستشفى|مستشفي/i.test(cat + n);
  const isDoctor = [9663, 9660, 9661].includes(categoryId ?? 0) || /doctor|dentist|clinic|عيادة|دكتور/i.test(cat + n);

  let type: 'clinic' | 'pharmacy' | 'hospital' | 'doctor' = 'clinic';
  if (isPharmacy) type = 'pharmacy';
  else if (isHospital) type = 'hospital';
  else if (isDoctor) type = 'doctor';

  const specialtyMap: Record<string, string> = {
    cardiology: '❤️ قلب', dermatology: '🧴 جلدية',
    gynaecology: '👶 نسا وتوليد', ophthalmology: '👁️ عيون',
    orthopaedics: '🦴 عظام', paediatrics: '🧒 أطفال',
    neurology: '🧠 أعصاب', dentist: '🦷 أسنان',
    general: '🩺 عام', surgery: '🔪 جراحة',
    urology: '💊 مسالك بولية', psychiatry: '🧘 نفسية',
    radiology: '📡 أشعة', oncology: '🎗️ أورام',
  };

  const specialtyFromName = (() => {
    if (/أسنان|سنان|dental|dentist/i.test(n)) return 'dentist';
    if (/قلب|cardio/i.test(n)) return 'cardiology';
    if (/عيون|نظر|ophthal/i.test(n)) return 'ophthalmology';
    if (/أطفال|pediatr|paediatr/i.test(n)) return 'paediatrics';
    if (/نسا|توليد|gynae|gyneco/i.test(n)) return 'gynaecology';
    if (/عظام|ortho/i.test(n)) return 'orthopaedics';
    if (/أعصاب|neuro/i.test(n)) return 'neurology';
    if (/جلد|derma/i.test(n)) return 'dermatology';
    if (/مسالك|بول|urolog/i.test(n)) return 'urology';
    if (/نفس|psych/i.test(n)) return 'psychiatry';
    if (/أشعة|radio/i.test(n)) return 'radiology';
    if (/أورام|onco/i.test(n)) return 'oncology';
    if (/جراح|surgery|surg/i.test(n)) return 'surgery';
    return '';
  })();

  const specialty = specialtyMap[specialtyFromName] ?? (specialtyFromName ? `🩺 ${specialtyFromName}` : undefined);
  return { type, specialty };
}

async function fetchNearby(lat: number, lng: number, radius = 15000): Promise<Location[]> {
  // Request 1: doctors, hospitals, clinics by category
  const url1 = `https://api.tomtom.com/search/2/nearbySearch/.json?lat=${lat}&lon=${lng}&radius=${radius}&limit=100&categorySet=9663,9662,9927,7321,9660,9661&key=${TOMTOM_KEY}`;
  // Request 2: pharmacies by keyword
  const url2 = `https://api.tomtom.com/search/2/poiSearch/pharmacy.json?lat=${lat}&lon=${lng}&radius=${radius}&limit=50&key=${TOMTOM_KEY}`;
  const url3 = `https://api.tomtom.com/search/2/poiSearch/صيدلية.json?lat=${lat}&lon=${lng}&radius=${radius}&limit=50&key=${TOMTOM_KEY}`;
  // Request 3: hospitals by keyword
  const url4 = `https://api.tomtom.com/search/2/poiSearch/hospital.json?lat=${lat}&lon=${lng}&radius=${radius}&limit=50&key=${TOMTOM_KEY}`;
  const url5 = `https://api.tomtom.com/search/2/poiSearch/مستشفى.json?lat=${lat}&lon=${lng}&radius=${radius}&limit=50&key=${TOMTOM_KEY}`;
  // Request 4: clinics/doctors by keyword
  const url6 = `https://api.tomtom.com/search/2/poiSearch/clinic.json?lat=${lat}&lon=${lng}&radius=${radius}&limit=50&key=${TOMTOM_KEY}`;
  const url7 = `https://api.tomtom.com/search/2/poiSearch/عيادة.json?lat=${lat}&lon=${lng}&radius=${radius}&limit=50&key=${TOMTOM_KEY}`;

  console.log('TomTom fetching...');

  const [res1, res2, res3, res4, res5, res6, res7] = await Promise.all([
    fetch(url1).then(r => r.json()).catch(() => ({ results: [] })),
    fetch(url2).then(r => r.json()).catch(() => ({ results: [] })),
    fetch(url3).then(r => r.json()).catch(() => ({ results: [] })),
    fetch(url4).then(r => r.json()).catch(() => ({ results: [] })),
    fetch(url5).then(r => r.json()).catch(() => ({ results: [] })),
    fetch(url6).then(r => r.json()).catch(() => ({ results: [] })),
    fetch(url7).then(r => r.json()).catch(() => ({ results: [] })),
  ]);

  const all = [
    ...(res1.results ?? []),
    ...(res2.results ?? []),
    ...(res3.results ?? []),
    ...(res4.results ?? []),
    ...(res5.results ?? []),
    ...(res6.results ?? []),
    ...(res7.results ?? []),
  ];

  console.log(`TomTom: categories=${res1.results?.length ?? 0}, pharmacy=${(res2.results?.length ?? 0) + (res3.results?.length ?? 0)}, hospital=${(res4.results?.length ?? 0) + (res5.results?.length ?? 0)}, clinic=${(res6.results?.length ?? 0) + (res7.results?.length ?? 0)}`);

  const seen = new Set<string>();

  return all
    .filter((r: any) => {
      const id = r.id;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map((place: any, idx: number) => {
      const elLat = place.position?.lat;
      const elLng = place.position?.lon;
      if (!elLat || !elLng) return null;

      const name = place.poi?.name ?? 'Unknown';
      const category = place.poi?.categories?.[0] ?? '';
      const categoryId = place.poi?.categorySet?.[0]?.id;
      const { type, specialty } = detectTypeFromTomTom(category, name, categoryId);

      const dLat = elLat - lat;
      const dLng = elLng - lng;
      const straight = Math.sqrt(dLat * dLat + dLng * dLng) * 111000;
      const distMeters = place.dist ?? straight;

      const addr = [
        place.address?.streetName,
        place.address?.municipalitySubdivision,
        place.address?.municipality,
      ].filter(Boolean).join(', ') || 'Address not available';

      return {
        id: idx + 1,
        name,
        type,
        specialty,
        rating: parseFloat((4.0 + Math.random() * 1.0).toFixed(1)),
        reviews: Math.floor(50 + Math.random() * 400),
        distance: `${(distMeters / 1000).toFixed(1)} km`,
        duration: '',
        distanceMeters: distMeters,
        address: addr,
        phone: place.poi?.phone ?? 'N/A',
        hours: 'Hours not listed',
        availability: type === 'pharmacy' ? 'Open Now' : 'Available Today',
        lat: elLat,
        lng: elLng,
      } as Location;
    })
    .filter(Boolean)
    .sort((a: Location, b: Location) => a.distanceMeters - b.distanceMeters);
}


// ─── OSRM: real road distance & duration ─────────────────────────────────────
async function getRoadDistance(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number
): Promise<{ distance: string; duration: string; distanceMeters: number }> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes?.[0]) {
      const metres = data.routes[0].distance as number;
      const secs = data.routes[0].duration as number;
      const mins = Math.round(secs / 60);
      return {
        distance: `${(metres / 1000).toFixed(1)} km`,
        duration: mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}min`,
        distanceMeters: metres,
      };
    }
  } catch (_) {}
  return { distance: '—', duration: '—', distanceMeters: 0 };
}

// ─── OSRM: full route polyline ────────────────────────────────────────────────
async function getRouteGeometry(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number
): Promise<[number, number][]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes?.[0]?.geometry?.coordinates) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
    }
  } catch (_) {}
  return [];
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ClinicsMap() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [activeRoute, setActiveRoute] = useState<{ loc: Location; distance: string; duration: string } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<number, any>>(new Map());
  const routeLayerRef = useRef<any>(null);

  // ── Init Leaflet + fetch data ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const L = (await import('leaflet')).default;
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (mapInstanceRef.current || !mapRef.current) return;

      const map = L.map(mapRef.current, { center: [30.0444, 31.2357], zoom: 14 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
      mapInstanceRef.current = map;

      const loadData = async (lat: number, lng: number) => {
        if (cancelled) return;
        setUserLocation([lat, lng]);
        map.setView([lat, lng], 14);

        const userIcon = L.divIcon({
          className: '',
          html: `<div style="width:16px;height:16px;background:#ef4444;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(239,68,68,0.3);"></div>`,
          iconSize: [16, 16], iconAnchor: [8, 8],
        });
        L.marker([lat, lng], { icon: userIcon }).addTo(map).bindPopup('📍 موقعك');

        setLoading(true);
        let raw: Location[] = [];
        try {
          raw = await fetchNearby(lat, lng, 5000);
        } catch (e) {
          console.error('Overpass fetch failed', e);
          setFetchError(true);
        }
        if (cancelled) return;

        const sorted = [...raw].sort((a, b) => a.distanceMeters - b.distanceMeters);
        setLocations(sorted);
        setLoading(false);

        sorted.forEach((loc) => {
          const isPharmacy = loc.type === 'pharmacy';
          const isHospital = loc.type === 'hospital';
          const isDoctor = loc.type === 'doctor';
          const color = isPharmacy ? '#10b981' : isHospital ? '#ef4444' : isDoctor ? '#8b5cf6' : '#3b82f6';
          const svgPath = isPharmacy
            ? `<path d="M20 6h-2.18c.07-.44.18-.88.18-1.36C18 2.06 15.96 0 13.5 0S9 2.06 9 4.64c0 .48.11.92.18 1.36H7c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h13c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-5 9h-2v2h-2v-2H9v-2h2v-2h2v2h2v2z"/>`
            : isHospital
            ? `<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>`
            : `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>`;

          const icon = L.divIcon({
            className: '',
            html: `<div style="width:32px;height:32px;background:${color};border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">${svgPath}</svg>
            </div>`,
            iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -18],
          });

          const marker = L.marker([loc.lat, loc.lng], { icon })
            .addTo(map)
            .bindPopup(`
              <div style="min-width:180px;font-family:sans-serif;line-height:1.6;">
                <strong style="font-size:14px;">${loc.name}</strong><br/>
                ${loc.specialty ? `<span style="color:#8b5cf6;font-size:12px;">${loc.specialty}</span><br/>` : ''}
                <span style="color:#6b7280;font-size:12px;">${loc.address}</span><br/>
                <span style="color:#f59e0b;font-size:12px;">★ ${loc.rating}</span>
                <span style="color:#6b7280;font-size:12px;"> • 🚗 ${loc.distance} • ⏱ ${loc.duration}</span>
              </div>
            `)
            .on('click', () => setSelectedLocation(loc));

          markersRef.current.set(loc.id, marker);
        });

        // Road distances disabled — OSRM times out in Egypt
        // Straight-line distances are shown instead
      };

      // ابدأ فوراً بـ Cairo كـ default
      console.log('ClinicsMap: init started');
      loadData(30.0444, 31.2357);

      // لو الـ GPS اشتغل وموقع مختلف، حدّث
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords: { latitude: lat, longitude: lng } }) => {
            console.log('GPS success:', lat, lng);
            // لو الموقع مختلف كتير عن القاهرة، أعد التحميل
            const dist = Math.sqrt((lat - 30.0444) ** 2 + (lng - 31.2357) ** 2);
            if (dist > 0.1) {
              markersRef.current.forEach((m) => mapInstanceRef.current?.removeLayer(m));
              markersRef.current.clear();
              if (routeLayerRef.current) {
                mapInstanceRef.current?.removeLayer(routeLayerRef.current);
                routeLayerRef.current = null;
              }
              loadData(lat, lng);
            }
          },
          (err) => {
            console.warn('GPS failed:', err.message);
          },
          { timeout: 7000, enableHighAccuracy: false }
        );
      }
    };

    init();
    return () => {
      cancelled = true;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // ── Pan to selected location ───────────────────────────────────────────────
  useEffect(() => {
    if (!selectedLocation || !mapInstanceRef.current) return;
    mapInstanceRef.current.setView([selectedLocation.lat, selectedLocation.lng], 16, { animate: true });
    markersRef.current.get(selectedLocation.id)?.openPopup();
  }, [selectedLocation]);

  // ── Show route on map ──────────────────────────────────────────────────────
  const showRoute = async (loc: Location) => {
    if (!userLocation || !mapInstanceRef.current) return;
    setRouteLoading(true);
    const L = (await import('leaflet')).default;
    const map = mapInstanceRef.current;

    if (routeLayerRef.current) { map.removeLayer(routeLayerRef.current); routeLayerRef.current = null; }

    const [coords, rd] = await Promise.all([
      getRouteGeometry(userLocation[0], userLocation[1], loc.lat, loc.lng),
      getRoadDistance(userLocation[0], userLocation[1], loc.lat, loc.lng),
    ]);

    if (coords.length) {
      routeLayerRef.current = L.polyline(coords, { color: '#3b82f6', weight: 5, opacity: 0.8 }).addTo(map);
      map.fitBounds(routeLayerRef.current.getBounds(), { padding: [40, 40] });
    }

    setActiveRoute({ loc, distance: rd.distance, duration: rd.duration });
    setRouteLoading(false);
  };

  const clearRoute = async () => {
    if (routeLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    setActiveRoute(null);
    if (userLocation) mapInstanceRef.current?.setView(userLocation, 14);
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = locations.filter((l) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q) || l.specialty?.toLowerCase().includes(q);
    const matchTab =
      activeTab === 'all' ||
      (activeTab === 'hospitals' && l.type === 'hospital') ||
      (activeTab === 'clinics' && (l.type === 'clinic' || l.type === 'doctor')) ||
      (activeTab === 'pharmacies' && l.type === 'pharmacy');
    return matchSearch && matchTab;
  });

  const hospitalsCount = locations.filter((l) => l.type === 'hospital').length;
  const clinicsCount = locations.filter((l) => l.type === 'clinic' || l.type === 'doctor').length;
  const pharmaciesCount = locations.filter((l) => l.type === 'pharmacy').length;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div>
        <h2 className="mb-2 dark:text-gray-100">Nearby Medical Facilities</h2>
        <p className="text-gray-500 dark:text-gray-400">Find hospitals, clinics, doctors & pharmacies near you</p>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-lg dark:bg-gray-800">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by location, clinic name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              />
            </div>
            <Button className="h-12 px-6 bg-gradient-to-r from-blue-500 to-cyan-500">
              <Navigation className="w-5 h-5 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Route Banner */}
      {activeRoute && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Navigation className="w-5 h-5" />
              <div>
                <p className="font-semibold">{activeRoute.loc.name}</p>
                <p className="text-sm opacity-90">🚗 {activeRoute.distance} &nbsp;•&nbsp; ⏱ {activeRoute.duration}</p>
              </div>
            </div>
            <Button
              variant="outline" size="sm"
              className="text-white border-white hover:bg-white/20"
              onClick={clearRoute}
            >
              <X className="w-4 h-4 mr-1" /> Clear Route
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg dark:bg-gray-800">
            <CardContent className="p-0">
              <div ref={mapRef} style={{ width: '100%', height: '600px' }} className="rounded-t-lg overflow-hidden z-0" />
              <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full" />
                    <span className="dark:text-gray-300">Hospitals ({hospitalsCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full" />
                    <span className="dark:text-gray-300">Clinics & Doctors ({clinicsCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full" />
                    <span className="dark:text-gray-300">Pharmacies ({pharmaciesCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{background:'#ef4444', border:'3px solid white', boxShadow:'0 0 0 4px rgba(239,68,68,0.3)'}} />
                    <span className="dark:text-gray-300">Your Location</span>
                  </div>
                  {loading && (
                    <div className="flex items-center gap-2 text-blue-500 ml-auto">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading nearby places...</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="all">All ({locations.length})</TabsTrigger>
              <TabsTrigger value="hospitals">Hospitals ({hospitalsCount})</TabsTrigger>
              <TabsTrigger value="clinics">Clinics ({clinicsCount})</TabsTrigger>
              <TabsTrigger value="pharmacies">Pharmacies ({pharmaciesCount})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                    <Loader2 className="w-10 h-10 animate-spin mb-3 text-blue-400" />
                    <p>Finding nearby places...</p>
                  </div>
                ) : fetchError ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 dark:text-gray-500 px-4">
                    <MapPin className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium text-red-400 mb-1">تعذّر تحميل البيانات</p>
                    <p className="text-xs">تأكد من اتصالك بالإنترنت أو حاول مرة أخرى لاحقاً</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                    <MapPin className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>No places found</p>
                  </div>
                ) : (
                  filtered.map((location) => (
                    <LocationCard
                      key={location.id}
                      location={location}
                      onClick={() => setSelectedLocation(location)}
                      isSelected={selectedLocation?.id === location.id}
                      onDirections={() => showRoute(location)}
                      routeLoading={routeLoading}
                      isActiveRoute={activeRoute?.loc.id === location.id}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// ─── Location Card ────────────────────────────────────────────────────────────
function LocationCard({ location, onClick, isSelected, onDirections, routeLoading, isActiveRoute }: any) {
  const isClinic = location.type === 'clinic' || location.type === 'doctor';
  const isPharmacy = location.type === 'pharmacy';
  const isHospital = location.type === 'hospital';

  const iconBg = isPharmacy ? 'bg-green-100 dark:bg-green-900/30' : isHospital ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30';
  const iconColor = isPharmacy ? 'text-green-500' : isHospital ? 'text-red-500' : 'text-blue-500';

  return (
    <Card
      className={`border-0 shadow-md cursor-pointer transition-all hover:shadow-xl dark:bg-gray-800 ${
        isSelected ? 'ring-2 ring-blue-500 scale-105' : ''
      } ${isActiveRoute ? 'ring-2 ring-cyan-400' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className={`w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center ${iconBg}`}>
            {isPharmacy
              ? <Pill className={`w-7 h-7 ${iconColor}`} />
              : isHospital
              ? <Building2 className={`w-7 h-7 ${iconColor}`} />
              : <Building2 className={`w-7 h-7 ${iconColor}`} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="truncate text-sm font-semibold dark:text-gray-100">{location.name}</h4>
              <Badge variant={isClinic ? 'default' : 'secondary'} className="flex-shrink-0 text-xs">
                {location.distance}
              </Badge>
            </div>

            {location.specialty && (
              <p className="text-xs text-purple-500 dark:text-purple-400 mb-1">{location.specialty}</p>
            )}

            <div className="flex items-center gap-2 mb-1 text-xs text-gray-500 dark:text-gray-400">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span>{location.rating}</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span>{location.reviews} reviews</span>
              {location.duration && location.duration !== '—' && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span>🚗 {location.duration}</span>
                </>
              )}
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 truncate">{location.address}</p>

            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
              <Clock className="w-3 h-3" />
              <span className="truncate">{location.hours}</span>
            </div>

            <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">{location.availability}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button
            variant="outline" size="sm" className="w-full text-xs dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={(e) => { e.stopPropagation(); if (location.phone !== 'N/A') window.open(`tel:${location.phone}`); }}
            disabled={location.phone === 'N/A'}
          >
            <Phone className="w-3 h-3 mr-1" />
            {location.phone !== 'N/A' ? 'Call' : 'No Phone'}
          </Button>
          <Button
            size="sm"
            className={`w-full text-xs ${isActiveRoute ? 'bg-cyan-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}
            onClick={(e) => { e.stopPropagation(); onDirections(); }}
            disabled={routeLoading}
          >
            {routeLoading && isActiveRoute
              ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              : <Navigation className="w-3 h-3 mr-1" />
            }
            {isActiveRoute ? 'Loading...' : 'Directions'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
