'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapComponentProps {
  latitude: number;
  longitude: number;
  address: string;
  onLocationSelect?: (lat: number, lng: number) => void;
  interactive?: boolean;
  projects?: Array<{
    _id: string;
    title: string;
    location: {
      coordinates: [number, number];
      address: string;
    };
  }>;
}

export function MapComponent({
  latitude,
  longitude,
  address,
  onLocationSelect,
  interactive = false,
  projects = [],
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Create map ONLY once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(
      [latitude, longitude],
      13
    );

    mapRef.current = map;

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }
    ).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update center + marker
  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.setView([latitude, longitude], 13);

    // Remove old marker
    if (markerRef.current) {
      markerRef.current.remove();
    }

    const marker = L.marker([latitude, longitude], {
      draggable: interactive,
    }).addTo(mapRef.current);

    markerRef.current = marker;

    if (interactive) {
      marker.on('dragend', () => {
        const pos = marker.getLatLng();

        onLocationSelect?.(pos.lat, pos.lng);
      });

      mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;

        marker.setLatLng([lat, lng]);

        onLocationSelect?.(lat, lng);
      });
    } else {
      marker.bindPopup(address);
    }
  }, [latitude, longitude, address, interactive]);

  // Project markers
  useEffect(() => {
    if (!mapRef.current) return;

    projects.forEach((project) => {
      const [lng, lat] = project.location.coordinates;

      L.marker([lat, lng])
        .addTo(mapRef.current!)
        .bindPopup(
          `<strong>${project.title}</strong><br/>${project.location.address}`
        );
    });
  }, [projects]);

  return (
    <div
      ref={containerRef}
      className="w-full h-100 rounded-lg overflow-hidden shadow-md"
    />
  );
}