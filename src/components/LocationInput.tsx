// app/components/LocationInput.tsx - GEOAPIFY VERSION (FIXED)
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LocationSuggestion {
  name?: string;
  address_line1?: string;
  address_line2?: string;
  lat: number;
  lon: number;
  formatted?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface LocationInputProps {
  address: string;
  onAddressSelect: (address: string, lat: number, lng: number) => void;
}

export function LocationInput({
  address,
  onAddressSelect,
}: LocationInputProps) {
  const [searchInput, setSearchInput] = useState(address);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Search locations with Geoapify
  const searchLocations = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
        
        if (!apiKey) {
          setError("Location service not configured");
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
            query
          )}&apiKey=${apiKey}&limit=5&country=IN`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch suggestions");
        }

        const data = await response.json();
        
        if (data.results) {
          setSuggestions(data.results);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Geoapify error:", err);
        setError("Failed to fetch location suggestions");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Debounced search
  const handleInputChange = (value: string) => {
    setSearchInput(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      searchLocations(value);
    }, 500);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    const displayAddress =
      suggestion.address_line1 ||
      suggestion.name ||
      `${suggestion.lat}, ${suggestion.lon}`;

    setSearchInput(displayAddress);
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);

    // Call the callback with coordinates
    onAddressSelect(displayAddress, suggestion.lat, suggestion.lon);
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div className="space-y-2 w-full">
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Enter location (e.g., Mumbai, Delhi, Bangalore)"
            value={searchInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (searchInput.length >= 2) {
                setShowSuggestions(true);
              }
            }}
            className="pl-10 pr-10 py-2"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-600 animate-spin pointer-events-none" />
          )}
          {!isLoading && suggestions.length > 0 && showSuggestions && (
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors duration-150"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {suggestion.address_line1 || suggestion.name}
                    </p>
                    {suggestion.address_line2 && (
                      <p className="text-sm text-gray-600 truncate">
                        {suggestion.address_line2}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      📍 {suggestion.lat.toFixed(4)}, {suggestion.lon.toFixed(4)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No Results */}
        {showSuggestions && suggestions.length === 0 && !isLoading && searchInput.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4">
            <p className="text-sm text-gray-600 text-center">
              No locations found. Try a different search.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Info text */}
      <p className="text-xs text-gray-500">
        💡 Search for any city or address in India
      </p>
    </div>
  );
}