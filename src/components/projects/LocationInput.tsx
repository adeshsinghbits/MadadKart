'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Loader2, AlertCircle, LocateFixed, X, ChevronDown } from 'lucide-react';
import { autocomplete, reverseGeocode, GeoFeature } from '@/lib/utils/geoapify';

export interface LocationValue {
  address: string;
  lat: number;
  lng: number;
  city?: string;
  state?: string;
}

interface LocationInputProps {
  /** Current address string (controlled) */
  address: string;
  /** Called when user picks a suggestion or uses "my location" */
  onAddressSelect: (address: string, lat: number, lng: number) => void;
  placeholder?: string;
  /** Restrict to country ISO-2, default "in" */
  countryCode?: string;
  className?: string;
  /** Show "Use my location" GPS button */
  showGPS?: boolean;
  /** Show small lat/lng badge under the input after selection */
  showCoords?: boolean;
  /** Current lat/lng to display in badge */
  lat?: number;
  lng?: number;
}

export function LocationInput({
  address,
  onAddressSelect,
  placeholder = 'Search for a city, area, or address…',
  countryCode = 'in',
  className = '',
  showGPS = true,
  showCoords = false,
  lat,
  lng,
}: LocationInputProps) {
  const [inputValue, setInputValue] = useState(address);
  const [suggestions, setSuggestions] = useState<GeoFeature[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep input in sync when parent updates address prop
  useEffect(() => {
    setInputValue(address);
  }, [address]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); }, []);

  const runSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) { setSuggestions([]); setShowDropdown(false); return; }
    setIsLoadingSuggestions(true);
    setError(null);
    try {
      const results = await autocomplete(query, 7, countryCode);
      setSuggestions(results);
      setShowDropdown(results.length > 0);
      setHighlightIndex(-1);
    } catch {
      setError('Location search unavailable. Check your API key.');
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [countryCode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setError(null);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => runSearch(val), 350);
  };

  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    setShowDropdown(false);
    setError(null);
  };

  const handleSelect = (feat: GeoFeature) => {
    const label = feat.address_line1 && feat.address_line2
      ? `${feat.address_line1}, ${feat.address_line2}`
      : feat.formatted;
    setInputValue(label);
    setSuggestions([]);
    setShowDropdown(false);
    setError(null);
    onAddressSelect(label, feat.lat, feat.lon);
  };

  const handleGPS = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported by your browser.'); return; }
    setIsLoadingGPS(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const feat = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          if (feat) {
            const label = feat.address_line1 && feat.address_line2
              ? `${feat.address_line1}, ${feat.address_line2}`
              : feat.formatted;
            setInputValue(label);
            onAddressSelect(label, feat.lat, feat.lon);
          } else {
            const fallback = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
            setInputValue(fallback);
            onAddressSelect(fallback, pos.coords.latitude, pos.coords.longitude);
          }
        } catch {
          setError('Could not reverse-geocode your position.');
        } finally {
          setIsLoadingGPS(false);
        }
      },
      (err) => {
        setIsLoadingGPS(false);
        if (err.code === err.PERMISSION_DENIED) setError('Location permission denied.');
        else setError('Could not get your location. Try again.');
      },
      { timeout: 8000 }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIndex(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && highlightIndex >= 0) { e.preventDefault(); handleSelect(suggestions[highlightIndex]); }
    else if (e.key === 'Escape') { setShowDropdown(false); }
  };

  const iconForType = (type?: string) => {
    if (!type) return '📍';
    if (type.includes('city') || type.includes('town')) return '🏙️';
    if (type.includes('country')) return '🌍';
    if (type.includes('street') || type.includes('road')) return '🛣️';
    if (type.includes('postcode')) return '📮';
    return '📍';
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input row */}
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-white transition-all
        ${error ? 'border-destructive ring-2 ring-destructive/20' : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'}`}>
        {isLoadingSuggestions ? (
          <Loader2 size={16} className="text-primary shrink-0 animate-spin" />
        ) : (
          <MapPin size={16} className="text-muted-foreground shrink-0" />
        )}

        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
        />

        {/* Clear button */}
        {inputValue && (
          <button type="button" onClick={handleClear}
            className="p-0.5 rounded hover:bg-muted transition-colors">
            <X size={14} className="text-muted-foreground" />
          </button>
        )}

        {/* GPS button */}
        {showGPS && (
          <button type="button" onClick={handleGPS} disabled={isLoadingGPS}
            title="Use my current location"
            className="p-1 rounded-lg hover:bg-accent transition-colors disabled:opacity-50 shrink-0">
            {isLoadingGPS
              ? <Loader2 size={15} className="animate-spin text-primary" />
              : <LocateFixed size={15} className="text-primary" />}
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <ul className="max-h-72 overflow-y-auto divide-y divide-border">
            {suggestions.map((feat, i) => (
              <li key={feat.place_id ?? i}>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); handleSelect(feat); }}
                  onMouseEnter={() => setHighlightIndex(i)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${i === highlightIndex ? 'bg-accent' : 'hover:bg-muted/60'}`}>
                  <span className="text-base leading-none mt-0.5 shrink-0">{iconForType(feat.result_type)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{feat.address_line1 || feat.formatted}</p>
                    {feat.address_line2 && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{feat.address_line2}</p>
                    )}
                    {feat.rank?.confidence != null && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="h-1 w-16 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary/60 rounded-full" style={{ width: `${Math.round(feat.rank.confidence * 100)}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{Math.round(feat.rank.confidence * 100)}%</span>
                      </div>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Powered by Geoapify</span>
            <span className="text-[10px] text-muted-foreground">{suggestions.length} result{suggestions.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* No results message */}
      {showDropdown && suggestions.length === 0 && !isLoadingSuggestions && inputValue.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-border rounded-xl shadow-lg z-50 px-4 py-4 text-center">
          <p className="text-sm text-muted-foreground">No locations found for "<strong>{inputValue}</strong>"</p>
          <p className="text-xs text-muted-foreground mt-1">Try a more specific address or city name.</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg">
          <AlertCircle size={14} className="shrink-0" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      {/* Coord badge */}
      {showCoords && lat != null && lng != null && !error && (
        <p className="mt-1.5 text-[11px] text-muted-foreground flex items-center gap-1">
          <MapPin size={10} />
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      )}
    </div>
  );
}
