'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Search, X, SlidersHorizontal, MapPin, Heart,
  LocateFixed, Layers, ChevronRight, PlusCircle, Loader2,
} from 'lucide-react';
import { autocomplete, GeoFeature } from '@/lib/utils/geoapify';
import { formatDistanceToNow } from 'date-fns';
import type { MapProject, MapClientRef } from '@/components/map/MapClient';

// ── Dynamic imports (SSR-safe) ────────────────────────────────────
const MapClient = dynamic(() => import('@/components/map/MapClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-muted border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading map…</p>
      </div>
    </div>
  ),
});

// ── Constants ─────────────────────────────────────────────────────
const CATEGORIES = ['All', 'Human', 'Plant', 'Animal', 'Environment', 'Education', 'Health'] as const;

const CAT_EMOJI: Record<string, string> = {
  Human: '🤝', Plant: '🌱', Animal: '🐾',
  Environment: '🌍', Education: '📚', Health: '❤️',
};

const CAT_COLOUR: Record<string, string> = {
  Human: '#6366f1', Plant: '#22c55e', Animal: '#f59e0b',
  Environment: '#14b8a6', Education: '#8b5cf6', Health: '#ec4899',
};

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

// ── Main page ─────────────────────────────────────────────────────
export default function MapPage() {
  // Data
  const [allProjects, setAllProjects] = useState<MapProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<MapProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // UI state
  const [selectedProject, setSelectedProject] = useState<MapProject | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);   // mobile
  const [filterOpen, setFilterOpen] = useState(false);

  // Location search
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<GeoFeature[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Project search
  const [projectSearch, setProjectSearch] = useState('');

  // Radius filter
  const [radiusKm, setRadiusKm] = useState(0);           // 0 = off
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Refs
  const mapRef = useRef<MapClientRef>(null);
  const locationDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch projects ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/projects?limit=200');
        const data = await res.json();
        const valid = (data.projects ?? []).filter((p: MapProject) => {
          const [lng, lat] = p.location?.coordinates ?? [];
          return lat && lng && !isNaN(lat) && !isNaN(lng);
        });
        setAllProjects(valid);
        setFilteredProjects(valid);
      } catch {}
      setIsLoadingProjects(false);
    })();
  }, []);

  // ── Filter logic ────────────────────────────────────────────────
  useEffect(() => {
    let list = allProjects;

    if (selectedCategory !== 'All') {
      list = list.filter(p => p.category === selectedCategory);
    }

    if (projectSearch.trim()) {
      const q = projectSearch.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.location.address.toLowerCase().includes(q)
      );
    }

    if (userCoords && radiusKm > 0) {
      list = list.filter(p => {
        const [lng, lat] = p.location.coordinates;
        const R = 6371;
        const dLat = ((lat - userCoords.lat) * Math.PI) / 180;
        const dLng = ((lng - userCoords.lng) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos((userCoords.lat * Math.PI) / 180) *
          Math.cos((lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return dist <= radiusKm;
      });
    }

    setFilteredProjects(list);
  }, [allProjects, selectedCategory, projectSearch, userCoords, radiusKm]);

  // ── Location search autocomplete ────────────────────────────────
  const handleLocationInput = useCallback((value: string) => {
    setLocationQuery(value);
    if (locationDebounce.current) clearTimeout(locationDebounce.current);
    if (value.length < 2) { setLocationSuggestions([]); setShowLocationDropdown(false); return; }
    locationDebounce.current = setTimeout(async () => {
      setIsLoadingLocation(true);
      try {
        const results = await autocomplete(value, 6);
        setLocationSuggestions(results);
        setShowLocationDropdown(results.length > 0);
      } catch {}
      setIsLoadingLocation(false);
    }, 350);
  }, []);

  const handleLocationSelect = useCallback((feat: GeoFeature) => {
    const label = feat.address_line1 && feat.address_line2
      ? `${feat.address_line1}, ${feat.address_line2}`
      : feat.formatted;
    setLocationQuery(label);
    setShowLocationDropdown(false);
    mapRef.current?.flyTo(feat.lat, feat.lon, 13);
    if (userCoords && radiusKm > 0) {
      mapRef.current?.showUserLocation(feat.lat, feat.lon, radiusKm);
      setUserCoords({ lat: feat.lat, lng: feat.lon });
    }
  }, [userCoords, radiusKm]);

  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserCoords({ lat, lng });
        mapRef.current?.flyTo(lat, lng, 13);
        if (radiusKm > 0) mapRef.current?.showUserLocation(lat, lng, radiusKm);

        // Reverse geocode label
        try {
          const { reverseGeocode } = await import('@/lib/utils/geoapify');
          const feat = await reverseGeocode(lat, lng);
          if (feat) {
            const label = feat.address_line1 && feat.address_line2
              ? `${feat.address_line1}, ${feat.address_line2}`
              : feat.formatted;
            setLocationQuery(label);
          }
        } catch {}
        setIsLoadingLocation(false);
      },
      () => setIsLoadingLocation(false),
      { timeout: 8000 }
    );
  }, [radiusKm]);

  const handleRadiusChange = (km: number) => {
    setRadiusKm(km);
    if (km > 0 && userCoords) {
      mapRef.current?.showUserLocation(userCoords.lat, userCoords.lng, km);
    } else {
      mapRef.current?.clearUserLocation();
    }
  };

  const clearAllFilters = () => {
    setSelectedCategory('All');
    setProjectSearch('');
    setRadiusKm(0);
    setUserCoords(null);
    setLocationQuery('');
    mapRef.current?.clearUserLocation();
  };

  const activeFilterCount = [
    selectedCategory !== 'All',
    projectSearch.trim().length > 0,
    radiusKm > 0,
  ].filter(Boolean).length;

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">

      {/* ═══════════════════════ SIDEBAR ═══════════════════════ */}
      <aside className={`
        flex-none w-80 bg-white border-r border-border flex flex-col z-10 overflow-hidden
        transition-transform duration-300
        max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:h-full max-md:shadow-xl
        ${sidebarOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}
      `}>

        {/* ── Sidebar header ─────────────────────────────── */}
        <div className="p-4 border-b border-border space-y-3">

          {/* Location search */}
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-muted/30 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              {isLoadingLocation
                ? <Loader2 size={14} className="text-primary animate-spin shrink-0" />
                : <MapPin size={14} className="text-muted-foreground shrink-0" />}
              <input
                value={locationQuery}
                onChange={e => handleLocationInput(e.target.value)}
                onFocus={() => locationSuggestions.length && setShowLocationDropdown(true)}
                placeholder="Fly to a location…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {locationQuery && (
                <button onClick={() => { setLocationQuery(''); setShowLocationDropdown(false); }}
                  className="text-muted-foreground hover:text-foreground">
                  <X size={13} />
                </button>
              )}
              <button onClick={handleGPS} title="Use my location"
                className="p-0.5 hover:text-primary text-muted-foreground transition-colors">
                <LocateFixed size={14} />
              </button>
            </div>

            {/* Location dropdown */}
            <AnimatePresence>
              {showLocationDropdown && locationSuggestions.length > 0 && (
                <motion.ul initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                  {locationSuggestions.map((feat, i) => (
                    <li key={feat.place_id ?? i}>
                      <button onMouseDown={() => handleLocationSelect(feat)}
                        className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-accent transition-colors">
                        <MapPin size={13} className="text-primary shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{feat.address_line1 || feat.formatted}</p>
                          {feat.address_line2 && <p className="text-xs text-muted-foreground truncate">{feat.address_line2}</p>}
                        </div>
                      </button>
                    </li>
                  ))}
                  <li className="px-3 py-1.5 border-t border-border bg-muted/30">
                    <span className="text-[10px] text-muted-foreground">Powered by Geoapify</span>
                  </li>
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Project search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-muted/30 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search size={14} className="text-muted-foreground shrink-0" />
            <input value={projectSearch} onChange={e => setProjectSearch(e.target.value)}
              placeholder="Filter projects by name…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            {projectSearch && <button onClick={() => setProjectSearch('')}><X size={13} className="text-muted-foreground" /></button>}
          </div>
        </div>

        {/* ── Category pills ─────────────────────────────── */}
        <div className="p-3 border-b border-border">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                style={selectedCategory === cat && cat !== 'All' ? { background: CAT_COLOUR[cat], color: 'white' } : {}}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all
                  ${selectedCategory === cat
                    ? cat === 'All' ? 'bg-foreground text-background' : ''
                    : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
                {cat !== 'All' && <span>{CAT_EMOJI[cat]}</span>}
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Radius filter ──────────────────────────────── */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Radius search</span>
            {radiusKm > 0 && (
              <button onClick={() => handleRadiusChange(0)} className="text-xs text-destructive hover:underline">Clear</button>
            )}
          </div>
          <div className="flex gap-1.5">
            {RADIUS_OPTIONS.map(km => (
              <button key={km} onClick={() => {
                if (!userCoords) { handleGPS(); }
                handleRadiusChange(radiusKm === km ? 0 : km);
              }}
                className={`flex-1 py-1 rounded-lg text-xs font-medium transition-all border ${radiusKm === km ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50 text-muted-foreground'}`}>
                {km}km
              </button>
            ))}
          </div>
          {!userCoords && radiusKm > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1.5">📍 Using your location — please allow access</p>
          )}
        </div>

        {/* ── Stats bar ──────────────────────────────────── */}
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Showing <strong className="text-foreground">{filteredProjects.length}</strong> of {allProjects.length} projects
          </span>
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} className="text-xs text-primary hover:underline flex items-center gap-1">
              <X size={11} /> Clear all
            </button>
          )}
        </div>

        {/* ── Project list ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingProjects ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-sm font-medium">No projects match your filters</p>
              <button onClick={clearAllFilters} className="mt-2 text-xs text-primary hover:underline">Reset filters</button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredProjects.map(proj => {
                const colour = CAT_COLOUR[proj.category] ?? '#6366f1';
                const isSelected = selectedProject?._id === proj._id;
                const img = proj.images?.[0] || proj.pictureOfSuccess;

                return (
                  <button key={proj._id}
                    onClick={() => {
                      setSelectedProject(proj);
                      const [lng, lat] = proj.location.coordinates;
                      mapRef.current?.flyTo(lat, lng, 14);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-start gap-3 p-3 text-left transition-colors ${isSelected ? 'bg-primary/5 border-l-2 border-primary' : 'hover:bg-muted/60'}`}>
                    {/* Thumb */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted"
                      style={!img ? { background: colour + '33' } : {}}>
                      {img
                        ? <img src={img} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xl">{CAT_EMOJI[proj.category]}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight truncate">{proj.title}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{proj.location.address}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ background: colour + '20', color: colour }}>
                          {CAT_EMOJI[proj.category]} {proj.category}
                        </span>
                        {(proj.totalDonations ?? 0) > 0 && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Heart size={9} fill="currentColor" className="text-pink-400" />
                            ₹{(proj.totalDonations ?? 0).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground mt-1 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Sidebar footer ─────────────────────────────── */}
        <div className="p-3 border-t border-border">
          <Link href="/projects/create"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <PlusCircle size={15} /> Create a Project
          </Link>
        </div>
      </aside>

      {/* ═══════════════════════ MAP AREA ══════════════════════ */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map */}
        <MapClient
          ref={mapRef}
          projects={filteredProjects}
          onSelectProject={setSelectedProject}
          darkMode={darkMode}
        />

        {/* ── Floating top-bar ─────────────────────────── */}
        <div className="absolute top-3 left-3 right-3 z-[400] flex items-start justify-between gap-2 pointer-events-none">
          {/* Mobile sidebar toggle */}
          <button onClick={() => setSidebarOpen(s => !s)}
            className="pointer-events-auto md:hidden bg-white rounded-xl shadow-md border border-border p-2.5 flex items-center gap-2 text-sm font-medium">
            <SlidersHorizontal size={16} />
            {activeFilterCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Project count pill (desktop) */}
          <div className="hidden md:flex pointer-events-auto items-center gap-2 bg-white/90 backdrop-blur-sm border border-border rounded-full px-4 py-2 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium">{filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}</span>
            {activeFilterCount > 0 && <span className="text-xs text-muted-foreground">({activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active)</span>}
          </div>

          {/* Dark mode toggle */}
          <button onClick={() => setDarkMode(d => !d)}
            className="pointer-events-auto bg-white/90 backdrop-blur-sm border border-border rounded-full p-2.5 shadow-md hover:bg-accent transition-colors"
            title="Toggle map style">
            <Layers size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* ── Selected project card ─────────────────────── */}
        <AnimatePresence>
          {selectedProject && (
            <motion.div
              key={selectedProject._id}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] w-[340px] max-w-[calc(100vw-2rem)]"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
                {/* Header image */}
                {(() => {
                  const img = selectedProject.images?.[0] || selectedProject.pictureOfSuccess;
                  const colour = CAT_COLOUR[selectedProject.category] ?? '#6366f1';
                  return img ? (
                    <div className="relative h-32 overflow-hidden">
                      <img src={img} alt={selectedProject.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <button onClick={() => setSelectedProject(null)}
                        className="absolute top-2 right-2 bg-black/40 text-white rounded-full p-1 hover:bg-black/60 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="h-2 w-full" style={{ background: colour }} />
                  );
                })()}

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: (CAT_COLOUR[selectedProject.category] ?? '#6366f1') + '20', color: CAT_COLOUR[selectedProject.category] ?? '#6366f1' }}>
                          {CAT_EMOJI[selectedProject.category]} {selectedProject.category}
                        </span>
                        {selectedProject.status === 'completed' && (
                          <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Completed</span>
                        )}
                      </div>
                      <h3 className="font-bold text-base leading-tight line-clamp-2">{selectedProject.title}</h3>
                    </div>
                    {!(selectedProject.images?.[0] || selectedProject.pictureOfSuccess) && (
                      <button onClick={() => setSelectedProject(null)}
                        className="text-muted-foreground hover:text-foreground p-1 -mt-1 -mr-1 shrink-0">
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  {selectedProject.objective && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{selectedProject.objective}</p>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                    <MapPin size={11} className="shrink-0 text-primary" />
                    <span className="truncate">{selectedProject.location.address}</span>
                  </div>

                  {(selectedProject.totalDonations ?? 0) > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                      <Heart size={11} className="text-pink-400" fill="currentColor" />
                      <span>₹{(selectedProject.totalDonations ?? 0).toLocaleString()} raised</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link href={`/projects/${selectedProject._id}`}
                      className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold text-center transition-opacity hover:opacity-90"
                      style={{ background: CAT_COLOUR[selectedProject.category] ?? '#6366f1' }}>
                      View Project
                    </Link>
                    {selectedProject.creator?._id && (
                      <Link href={`/profile/${selectedProject.creator._id}`}
                        className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors">
                        Profile
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="md:hidden absolute inset-0 bg-black/40 z-[5]" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}