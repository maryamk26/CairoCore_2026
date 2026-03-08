"use client";

import { useState, useEffect } from "react";

interface SavedLocation {
  id: string;
  title: string;
  address?: string;
  latitude: number;
  longitude: number;
}

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number];
  text: string;
}

interface LocationSelectorProps {
  onLocationSelect: (location: { lat: number; lng: number; title?: string; address?: string }) => void;
  currentLocation: { lat: number; lng: number } | null;
}

export default function LocationSelector({ onLocationSelect, currentLocation }: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'browser' | 'search' | 'saved'>('browser');
  const [isLoadingBrowser, setIsLoadingBrowser] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [shouldSave, setShouldSave] = useState(false);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  useEffect(() => {
    if (mode === 'saved' && savedLocations.length === 0) {
      fetchSavedLocations();
    }
  }, [mode]);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchLocations(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchSavedLocations = async () => {
    setIsLoadingSaved(true);
    try {
      const response = await fetch('/api/user/locations');
      if (response.ok) {
        const data = await response.json();
        setSavedLocations(data.locations || []);
      }
    } catch (error) {
      console.error('Error fetching saved locations:', error);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const searchLocations = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(query)}&` +
          `countrycodes=eg&` +
          `viewbox=29.5,29.5,32.5,31.5&` +
          `bounded=1&` +
          `limit=5&` +
          `format=json&` +
          `addressdetails=1`,
        {
          headers: { "User-Agent": "CairoCore/1.0" },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const transformedResults = data.map((item: { place_id: number; lon: string; lat: string; display_name: string; name?: string }) => ({
          id: item.place_id.toString(),
          place_name: item.display_name,
          center: [parseFloat(item.lon), parseFloat(item.lat)],
          text: item.name || item.display_name.split(",")[0],
        }));
        setSearchResults(transformedResults);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleBrowserLocation = () => {
    if ('geolocation' in navigator) {
      setIsLoadingBrowser(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocationSelect({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            title: 'Current Location',
          });
          setIsLoadingBrowser(false);
          setIsOpen(false);
        },
        (error) => {
          alert('Please enable location access in your browser settings.');
          setIsLoadingBrowser(false);
        }
      );
    }
  };

  const handleSearchResultSelect = (result: SearchResult) => {
    const [lng, lat] = result.center;

    onLocationSelect({
      lat,
      lng,
      title: result.text,
      address: result.place_name,
    });

    if (shouldSave) {
      saveLocation(result.text, result.place_name, lat, lng);
    }
    setSearchQuery("");
    setSearchResults([]);
    setShouldSave(false);
    setIsOpen(false);
  };

  const saveLocation = async (title: string, address: string, lat: number, lng: number) => {
    try {
      const response = await fetch('/api/user/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          address,
          latitude: lat,
          longitude: lng,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSavedLocations([data.location, ...savedLocations]);
      } else {
        console.error('Failed to save location');
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const deleteLocation = async (locationId: string) => {
    try {
      const response = await fetch(`/api/user/locations?id=${locationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSavedLocations(savedLocations.filter((loc) => loc.id !== locationId));
      } else {
        console.error('Failed to delete location');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
    }
  };

  const handleSavedLocation = (location: SavedLocation) => {
    onLocationSelect({
      lat: location.latitude,
      lng: location.longitude,
      title: location.title,
    });
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-2 bg-[#d4af37] text-[#3a3428] rounded font-cinzel font-semibold hover:bg-[#e5bf47] transition-colors text-sm"
      >
        {currentLocation ? 'Change Starting Location' : 'Set Starting Location'}
      </button>
    );
  }

  return (
    <div className="bg-[#8b6f47] rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-cinzel text-white font-bold text-sm">
          Select Starting Location
        </h4>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/70 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setMode('browser')}
          className={`flex-1 px-3 py-2 rounded font-cinzel text-xs font-semibold transition-colors ${
            mode === 'browser'
              ? 'bg-[#d4af37] text-[#3a3428]'
              : 'bg-[#5d4e37] text-white hover:bg-[#6d5e47]'
          }`}
        >
          Current
        </button>
        <button
          onClick={() => setMode('search')}
          className={`flex-1 px-3 py-2 rounded font-cinzel text-xs font-semibold transition-colors ${
            mode === 'search'
              ? 'bg-[#d4af37] text-[#3a3428]'
              : 'bg-[#5d4e37] text-white hover:bg-[#6d5e47]'
          }`}
        >
          Search
        </button>
        <button
          onClick={() => setMode('saved')}
          className={`flex-1 px-3 py-2 rounded font-cinzel text-xs font-semibold transition-colors ${
            mode === 'saved'
              ? 'bg-[#d4af37] text-[#3a3428]'
              : 'bg-[#5d4e37] text-white hover:bg-[#6d5e47]'
          }`}
        >
          Saved
        </button>
      </div>

      {mode === "browser" && (
        <div className="space-y-2">
          <p className="font-cinzel text-white/80 text-xs">
            Use your device's current location
          </p>
          <button
            onClick={handleBrowserLocation}
            disabled={isLoadingBrowser}
            className="w-full px-4 py-3 bg-[#d4af37] text-[#3a3428] rounded font-cinzel font-bold hover:bg-[#e5bf47] transition-colors disabled:opacity-50"
          >
            {isLoadingBrowser ? 'Getting Location...' : 'Use Current Location'}
          </button>
        </div>
      )}

      {mode === "search" && (
        <div className="space-y-3">
          <div>
            <label className="font-cinzel text-white text-xs mb-1 block">
              Search for a place or address
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., Cairo Tower, Zamalek..."
              className="w-full px-3 py-2 rounded bg-[#5d4e37] text-white placeholder-white/50 font-cinzel text-sm"
              autoFocus
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={shouldSave}
              onChange={(e) => setShouldSave(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="font-cinzel text-white text-xs">
              Save for future use
            </span>
          </label>

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {isSearching && (
              <p className="font-cinzel text-white/70 text-xs text-center py-4">
                Searching...
              </p>
            )}

            {!isSearching && searchQuery.length > 0 && searchQuery.length < 3 && (
              <p className="font-cinzel text-white/70 text-xs text-center py-4">
                Type at least 3 characters to search
              </p>
            )}

            {!isSearching && searchQuery.length >= 3 && searchResults.length === 0 && (
              <p className="font-cinzel text-white/70 text-xs text-center py-4">
                No results found. Try a different search.
              </p>
            )}

            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSearchResultSelect(result)}
                className="w-full p-3 bg-[#5d4e37] hover:bg-[#6d5e47] rounded text-left transition-colors"
              >
                <p className="font-cinzel text-white font-semibold text-sm mb-1">
                  {result.text}
                </p>
                <p className="font-cinzel text-white/60 text-xs">
                  {result.place_name}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === "saved" && (
        <div className="space-y-2">
          {isLoadingSaved ? (
            <p className="font-cinzel text-white/70 text-xs text-center py-4">
              Loading saved locations...
            </p>
          ) : savedLocations.length === 0 ? (
            <p className="font-cinzel text-white/70 text-xs text-center py-4">
              No saved locations yet. Add one manually!
            </p>
          ) : (
            savedLocations.map((location) => (
              <div
                key={location.id}
                className="w-full p-3 bg-[#5d4e37] rounded flex items-start justify-between gap-2"
              >
                <button
                  onClick={() => handleSavedLocation(location)}
                  className="flex-1 text-left hover:opacity-80 transition-opacity"
                >
                  <p className="font-cinzel text-white font-semibold text-sm">
                    {location.title}
                  </p>
                  {location.address && (
                    <p className="font-cinzel text-white/60 text-xs mt-1">
                      {location.address}
                    </p>
                  )}
                  <p className="font-cinzel text-white/50 text-xs mt-1">
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </p>
                </button>
                <button
                  onClick={() => deleteLocation(location.id)}
                  className="p-1 text-red-400 hover:text-red-300"
                  aria-label="Delete location"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

