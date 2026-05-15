import { useState, useEffect, useCallback } from "react";

export interface SavedLocation {
  id: string;
  title: string;
  address?: string;
  latitude: number;
  longitude: number;
}

export interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number];
  text: string;
}

export type LocationSelectorMode = "browser" | "search" | "saved";

export function useLocationSelector(
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    title?: string;
    address?: string;
  }) => void
) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<LocationSelectorMode>("browser");
  const [isLoadingBrowser, setIsLoadingBrowser] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [shouldSave, setShouldSave] = useState(false);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  const fetchSavedLocations = useCallback(async () => {
    setIsLoadingSaved(true);
    try {
      const response = await fetch("/api/user/locations");
      if (response.ok) {
        const data = await response.json();
        setSavedLocations(data.locations || []);
      }
    } catch {
      setSavedLocations([]);
    } finally {
      setIsLoadingSaved(false);
    }
  }, []);

  useEffect(() => {
    if (mode === "saved" && savedLocations.length === 0) fetchSavedLocations();
  }, [mode, savedLocations.length, fetchSavedLocations]);

  const searchLocations = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(Array.isArray(data.results) ? data.results : []);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => searchLocations(searchQuery), 500);
    return () => clearTimeout(t);
  }, [searchQuery, searchLocations]);

  const handleBrowserLocation = useCallback(() => {
    if (!("geolocation" in navigator)) return;
    setIsLoadingBrowser(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationSelect({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          title: "Current Location",
        });
        setIsLoadingBrowser(false);
        setIsOpen(false);
      },
      () => {
        alert("Please enable location access in your browser settings.");
        setIsLoadingBrowser(false);
      }
    );
  }, [onLocationSelect]);

  const saveLocation = useCallback(
    async (title: string, address: string, lat: number, lng: number) => {
      try {
        const res = await fetch("/api/user/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, address, latitude: lat, longitude: lng }),
        });
        if (res.ok) {
          const data = await res.json();
          setSavedLocations((prev) => [data.location, ...prev]);
        }
      } catch {
        return;
      }
    },
    []
  );

  const deleteLocation = useCallback(async (locationId: string) => {
    try {
      const res = await fetch(`/api/user/locations?id=${locationId}`, {
        method: "DELETE",
      });
      if (res.ok) setSavedLocations((prev) => prev.filter((loc) => loc.id !== locationId));
    } catch {
      return;
    }
  }, []);

  const handleSearchResultSelect = useCallback(
    (result: SearchResult) => {
      const [lng, lat] = result.center;
      onLocationSelect({
        lat,
        lng,
        title: result.text,
        address: result.place_name,
      });
      if (shouldSave) saveLocation(result.text, result.place_name, lat, lng);
      setSearchQuery("");
      setSearchResults([]);
      setShouldSave(false);
      setIsOpen(false);
    },
    [onLocationSelect, shouldSave, saveLocation]
  );

  const handleSavedLocation = useCallback(
    (location: SavedLocation) => {
      onLocationSelect({
        lat: location.latitude,
        lng: location.longitude,
        title: location.title,
      });
      setIsOpen(false);
    },
    [onLocationSelect]
  );

  return {
    isOpen,
    setIsOpen,
    mode,
    setMode,
    searchQuery,
    setSearchQuery,
    shouldSave,
    setShouldSave,
    searchResults,
    savedLocations,
    isLoadingBrowser,
    isSearching,
    isLoadingSaved,
    handleBrowserLocation,
    handleSearchResultSelect,
    handleSavedLocation,
    deleteLocation,
  };
}
