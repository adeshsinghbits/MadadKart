'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LocateFixed, Loader2 } from 'lucide-react';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';

export default function NearbyProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGPSLoading, setIsGPSLoading] = useState(false);
  const [error, setError] = useState('');
  const [radius, setRadius] = useState(25);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);

  const fetchNearby = async (lat: number, lng: number, km: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects?lat=${lat}&lng=${lng}&radius=${km}&limit=50`);
      const data = await res.json();
      setProjects(data.projects ?? []);
    } catch { setError('Failed to load nearby projects.'); }
    setIsLoading(false);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    setIsGPSLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        try {
          const { reverseGeocode } = await import('@/lib/utils/geoapify');
          const feat = await reverseGeocode(lat, lng);
          if (feat) label = feat.address_line1 && feat.address_line2 ? `${feat.address_line1}, ${feat.address_line2}` : feat.formatted;
        } catch {}
        setUserLocation({ lat, lng, label });
        fetchNearby(lat, lng, radius);
        setIsGPSLoading(false);
      },
      () => { setError('Location permission denied.'); setIsGPSLoading(false); },
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    if (userLocation) fetchNearby(userLocation.lat, userLocation.lng, radius);
  }, [radius]);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-2">Nearby Projects</h1>
          <p className="text-muted-foreground text-sm mb-6">Discover social impact projects close to you.</p>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={handleUseLocation} disabled={isGPSLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
              {isGPSLoading ? <Loader2 size={15} className="animate-spin" /> : <LocateFixed size={15} />}
              Use my location
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Radius:</span>
              {[5, 10, 25, 50, 100].map(km => (
                <button key={km} onClick={() => setRadius(km)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${radius === km ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'}`}>
                  {km}km
                </button>
              ))}
            </div>
          </div>

          {userLocation && (
            <p className="mt-3 text-sm text-muted-foreground">📍 Near <strong>{userLocation.label}</strong> within <strong>{radius}km</strong></p>
          )}
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {!userLocation && !isLoading && (
          <EmptyState icon="📍" title="Enable location to see nearby projects"
            description="Click 'Use my location' to discover projects near you." />
        )}
        {isLoading && <LoadingSpinner text="Finding nearby projects…" />}
        {!isLoading && userLocation && projects.length === 0 && (
          <EmptyState icon="🗺️" title="No projects nearby"
            description={`No active projects found within ${radius}km. Try increasing the radius.`}
            action={{ label: 'Explore all projects', href: '/explore' }} />
        )}
        {!isLoading && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {projects.map(p => <ProjectCard key={p._id} project={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
