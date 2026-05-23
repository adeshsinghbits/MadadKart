'use client';

/**
 * MapClient — full-featured interactive map for the /map page
 * Features:
 *  - Geoapify styled tiles (positron / dark-matter)
 *  - Marker clustering via leaflet.markercluster
 *  - Category-coloured custom markers
 *  - Popup project preview cards
 *  - User location circle
 *  - Radius search ring
 *  - Programmatic fly-to
 */

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import L from 'leaflet';
import 'leaflet.markercluster';
import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { geoapifyTileUrl } from '@/lib/utils/geoapify';

// ── Types ────────────────────────────────────────────────────────
export interface MapProject {
  _id: string;
  title: string;
  objective?: string;
  category: string;
  status?: string;
  totalDonations?: number;
  images?: string[];
  pictureOfSuccess?: string;
  creator?: { _id?: string; name?: string };
  location: { coordinates: [number, number]; address: string };
}

export interface MapClientRef {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  showUserLocation: (lat: number, lng: number, radiusKm?: number) => void;
  clearUserLocation: () => void;
}

interface MapClientProps {
  projects?: MapProject[];
  onSelectProject?: (project: MapProject) => void;
  darkMode?: boolean;

  latitude?: number;
  longitude?: number;
  address?: string;
  interactive?: boolean;
}

// ── Category colours ─────────────────────────────────────────────
const CAT_COLOUR: Record<string, string> = {
  Human:       '#6366f1',
  Plant:       '#22c55e',
  Animal:      '#f59e0b',
  Environment: '#14b8a6',
  Education:   '#8b5cf6',
  Health:      '#ec4899',
};

function makeMarkerIcon(category: string, status?: string) {
  const colour = CAT_COLOUR[category] ?? '#6366f1';
  const opacity = status === 'completed' ? '0.55' : '1';
  return L.divIcon({
    className: '',
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -44],
    html: `
      <svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg" style="opacity:${opacity}">
        <path d="M17 0C7.611 0 0 7.611 0 17c0 12.75 17 25 17 25S34 29.75 34 17C34 7.611 26.389 0 17 0z" fill="${colour}"/>
        <circle cx="17" cy="17" r="7" fill="rgba(255,255,255,0.92)"/>
        <circle cx="17" cy="17" r="3.5" fill="${colour}"/>
      </svg>`,
  });
}

const DRAG_ICON = L.divIcon({
  className: '',
  iconSize: [36, 44],
  iconAnchor: [18, 44],
  html: `
    <svg
      width="36"
      height="44"
      viewBox="0 0 36 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.059 27.941 0 18 0z"
        fill="#6366f1"
      />
      <circle cx="18" cy="18" r="8" fill="white" />
      <circle cx="18" cy="18" r="4" fill="#6366f1" />
    </svg>
  `,
});

const USER_ICON = L.divIcon({
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  html: `
    <div style="width:20px;height:20px;position:relative">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.3);animation:ping 1.5s infinite"></div>
      <div style="position:absolute;inset:3px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>
    </div>
    <style>@keyframes ping{75%,100%{transform:scale(2.2);opacity:0}}</style>`,
});

// ── Component ────────────────────────────────────────────────────
const MapClient = forwardRef<MapClientRef, MapClientProps>(
  ({ projects, onSelectProject, darkMode = false }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
    const userMarkerRef = useRef<L.Marker | null>(null);
    const userCircleRef = useRef<L.Circle | null>(null);
    const projectLayerRef = useRef<L.LayerGroup | null>(null);

    /* Expose imperative methods ---------------------------------- */
    useImperativeHandle(ref, () => ({
      flyTo(lat, lng, zoom = 14) {
        mapRef.current?.flyTo([lat, lng], zoom, { duration: 1.2 });
      },
      showUserLocation(lat, lng, radiusKm = 10) {
        const map = mapRef.current;
        if (!map) return;

        userMarkerRef.current?.remove();
        userCircleRef.current?.remove();

        userMarkerRef.current = L.marker([lat, lng], { icon: USER_ICON, zIndexOffset: 1000 })
          .addTo(map)
          .bindPopup('<strong>You are here</strong>');

        userCircleRef.current = L.circle([lat, lng], {
          radius: radiusKm * 1000,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.06,
          weight: 1.5,
          dashArray: '6 4',
        }).addTo(map);

        map.flyTo([lat, lng], 12, { duration: 1.4 });
      },
      clearUserLocation() {
        userMarkerRef.current?.remove();
        userCircleRef.current?.remove();
        userMarkerRef.current = null;
        userCircleRef.current = null;
      },
    }), []);

    /* Init map --------------------------------------------------- */
    useEffect(() => {
      if (!containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [22.5937, 78.9629],
        zoom: 5,
        minZoom: 3,
        maxZoom: 19,
        zoomControl: false,
      });

      // Zoom control — top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Tiles — Geoapify styled if key available, else OSM fallback
      const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
      if (apiKey) {
        L.tileLayer(
          darkMode ? geoapifyTileUrl('dark-matter') : geoapifyTileUrl('positron'),
          { maxZoom: 20, attribution: '© Geoapify © OpenStreetMap' }
        ).addTo(map);
      } else {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19, attribution: '© OpenStreetMap contributors',
        }).addTo(map);
      }

      // Marker cluster group
      const cluster = (L as any).markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 60,
        spiderfyOnMaxZoom: true,
        iconCreateFunction: (clusterArg: any) => {
          const count = clusterArg.getChildCount();
          return L.divIcon({
            className: '',
            iconSize: [44, 44],
            iconAnchor: [22, 22],
            html: `<div style="width:44px;height:44px;border-radius:50%;background:#6366f1;color:white;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(99,102,241,0.4);border:3px solid white">${count}</div>`,
          });
        },
      }) as L.MarkerClusterGroup;

      cluster.addTo(map);
      clusterRef.current = cluster;
      mapRef.current = map;

      return () => {
        map.remove();
        mapRef.current = null;
        clusterRef.current = null;
      };
    }, []);

    useEffect(() => {
      const layer = projectLayerRef.current;
      if (!layer) return;

      layer.clearLayers();

      if (!projects?.length) return;

      projects.forEach((proj) => {
        const [lng, lat] = proj.location.coordinates;

        if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

        L.marker([lat, lng], {
          icon: DRAG_ICON,
        })
          .addTo(layer)
          .bindPopup(`
            <strong>${proj.title}</strong><br/>
            <small>${proj.location.address}</small>
          `);
      });
    }, [projects]);

    return (
      <div ref={containerRef} className="w-full h-full" />
    );
  }
);

MapClient.displayName = 'MapClient';
export default MapClient;
