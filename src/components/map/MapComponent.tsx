'use client';

import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { reverseGeocode, geoapifyTileUrl } from '@/lib/utils/geoapify';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PULSE_ICON = L.divIcon({
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  html: `
    <div style="position:relative;width:30px;height:30px">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(99,102,241,0.25);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite"></div>
      <div style="position:absolute;inset:4px;border-radius:50%;background:#6366f1;box-shadow:0 0 0 2px white"></div>
    </div>
    <style>
      @keyframes ping{75%,100%{transform:scale(2);opacity:0}}
    </style>
  `,
});

const DRAG_ICON = L.divIcon({
  className: '',
  iconSize: [36, 44],
  iconAnchor: [18, 44],
  html: `
    <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.059 27.941 0 18 0z" fill="#6366f1"/>
      <circle cx="18" cy="18" r="8" fill="white"/>
      <circle cx="18" cy="18" r="4" fill="#6366f1"/>
    </svg>
  `,
});

interface MapComponentProps {
  latitude: number;
  longitude: number;
  address?: string;
  onLocationSelect?: (lat: number, lng: number, address?: string) => void;
  interactive?: boolean;
  height?: string;
  zoom?: number;
  projects?: Array<{
    _id: string;
    title: string;
    category?: string;
    location: { coordinates: [number, number]; address: string };
  }>;
}

export function MapComponent({
  latitude,
  longitude,
  address = '',
  onLocationSelect,
  interactive = false,
  height = 'h-72',
  zoom = 13,
  projects = [],
}: MapComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const projectLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([latitude || 22.5937, longitude || 78.9629], zoom);

    const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
    if (apiKey) {
      L.tileLayer(geoapifyTileUrl('positron'), {
        maxZoom: 20,
        attribution: '© <a href="https://www.geoapify.com/">Geoapify</a> © <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
      }).addTo(map);
    } else {
      // Fallback to OSM
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);
    }

    // Attribution control (custom)
    L.control.attribution({ prefix: false, position: 'bottomright' }).addTo(map);

    mapRef.current = map;
    projectLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const resolveAddress = useCallback(async (lat: number, lng: number) => {
    if (!onLocationSelect) return;
    try {
      const feat = await reverseGeocode(lat, lng);
      if (feat) {
        const label = feat.address_line1 && feat.address_line2
          ? `${feat.address_line1}, ${feat.address_line2}`
          : feat.formatted;
        onLocationSelect(lat, lng, label);
      } else {
        onLocationSelect(lat, lng);
      }
    } catch {
      onLocationSelect(lat, lng);
    }
  }, [onLocationSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !latitude || !longitude) return;

    map.setView([latitude, longitude], map.getZoom() ?? zoom, { animate: true });

    if (markerRef.current) markerRef.current.remove();

    if (interactive) {
      const marker = L.marker([latitude, longitude], {
        icon: DRAG_ICON,
        draggable: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng();
        resolveAddress(lat, lng);
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        resolveAddress(e.latlng.lat, e.latlng.lng);
      });

      markerRef.current = marker;
    } else {
      const marker = L.marker([latitude, longitude], { icon: PULSE_ICON })
        .addTo(map)
        .bindPopup(address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      markerRef.current = marker;
    }
  }, [latitude, longitude, interactive]);

  useEffect(() => {
    const layer = projectLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    projects.forEach(proj => {
      const [lng, lat] = proj.location.coordinates;
      if (!lat || !lng) return;
      L.marker([lat, lng], { icon: DRAG_ICON })
        .addTo(layer)
        .bindPopup(`<strong>${proj.title}</strong><br/><small>${proj.location.address}</small>`);
    });
  }, [projects]);

  return (
    <div className={`${height} w-full rounded-xl overflow-hidden border border-border shadow-sm relative`}>
      <div ref={containerRef} className="w-full h-full" />
      {interactive && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-400 bg-white/90 backdrop-blur-sm text-xs text-muted-foreground px-3 py-1.5 rounded-full border border-border shadow pointer-events-none">
          Click map or drag the pin to set location
        </div>
      )}
    </div>
  );
}