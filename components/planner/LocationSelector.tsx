"use client";

import { useLocationSelector } from "./hooks/useLocationSelector";
import LocationSelectorPanel from "./LocationSelectorPanel";

interface LocationSelectorProps {
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    title?: string;
    address?: string;
  }) => void;
  currentLocation: { lat: number; lng: number } | null;
}

export default function LocationSelector({
  onLocationSelect,
  currentLocation,
}: LocationSelectorProps) {
  const {
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
  } = useLocationSelector(onLocationSelect);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-2 bg-[#d4af37] text-[#3a3428] rounded font-cinzel font-semibold hover:bg-[#e5bf47] transition-colors text-sm"
      >
        {currentLocation ? "Change Starting Location" : "Set Starting Location"}
      </button>
    );
  }

  return (
    <LocationSelectorPanel
      onClose={() => setIsOpen(false)}
      mode={mode}
      onModeChange={setMode}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      shouldSave={shouldSave}
      onShouldSaveChange={setShouldSave}
      searchResults={searchResults}
      savedLocations={savedLocations}
      isLoadingBrowser={isLoadingBrowser}
      isSearching={isSearching}
      isLoadingSaved={isLoadingSaved}
      onBrowserLocation={handleBrowserLocation}
      onSearchResultSelect={handleSearchResultSelect}
      onSavedLocationSelect={handleSavedLocation}
      onDeleteLocation={deleteLocation}
    />
  );
}
