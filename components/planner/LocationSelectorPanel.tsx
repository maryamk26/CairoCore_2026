"use client";

import type { SavedLocation, SearchResult } from "./hooks/useLocationSelector";

interface LocationSelectorPanelProps {
  onClose: () => void;
  mode: "browser" | "search" | "saved";
  onModeChange: (m: "browser" | "search" | "saved") => void;
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  shouldSave: boolean;
  onShouldSaveChange: (v: boolean) => void;
  searchResults: SearchResult[];
  savedLocations: SavedLocation[];
  isLoadingBrowser: boolean;
  isSearching: boolean;
  isLoadingSaved: boolean;
  onBrowserLocation: () => void;
  onSearchResultSelect: (r: SearchResult) => void;
  onSavedLocationSelect: (loc: SavedLocation) => void;
  onDeleteLocation: (id: string) => void;
}

export default function LocationSelectorPanel({
  onClose,
  mode,
  onModeChange,
  searchQuery,
  onSearchQueryChange,
  shouldSave,
  onShouldSaveChange,
  searchResults,
  savedLocations,
  isLoadingBrowser,
  isSearching,
  isLoadingSaved,
  onBrowserLocation,
  onSearchResultSelect,
  onSavedLocationSelect,
  onDeleteLocation,
}: LocationSelectorPanelProps) {
  const tabCls = (m: "browser" | "search" | "saved") =>
    mode === m ? "bg-[#d4af37] text-[#3a3428]" : "bg-[#5d4e37] text-white hover:bg-[#6d5e47]";

  return (
    <div className="bg-[#8b6f47] rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-cinzel text-white font-bold text-sm">Select Starting Location</h4>
        <button onClick={onClose} className="text-white/70 hover:text-white" aria-label="Close">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onModeChange("browser")}
          className={`flex-1 px-3 py-2 rounded font-cinzel text-xs font-semibold transition-colors ${tabCls("browser")}`}
        >
          Current
        </button>
        <button
          onClick={() => onModeChange("search")}
          className={`flex-1 px-3 py-2 rounded font-cinzel text-xs font-semibold transition-colors ${tabCls("search")}`}
        >
          Search
        </button>
        <button
          onClick={() => onModeChange("saved")}
          className={`flex-1 px-3 py-2 rounded font-cinzel text-xs font-semibold transition-colors ${tabCls("saved")}`}
        >
          Saved
        </button>
      </div>

      {mode === "browser" && (
        <div className="space-y-2">
          <p className="font-cinzel text-white/80 text-xs">
            Use your device&apos;s current location
          </p>
          <button
            onClick={onBrowserLocation}
            disabled={isLoadingBrowser}
            className="w-full px-4 py-3 bg-[#d4af37] text-[#3a3428] rounded font-cinzel font-bold hover:bg-[#e5bf47] transition-colors disabled:opacity-50"
          >
            {isLoadingBrowser ? "Getting Location..." : "Use Current Location"}
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
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="e.g., Cairo Tower, Zamalek..."
              className="w-full px-3 py-2 rounded bg-[#5d4e37] text-white placeholder-white/50 font-cinzel text-sm"
              autoFocus
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={shouldSave}
              onChange={(e) => onShouldSaveChange(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="font-cinzel text-white text-xs">Save for future use</span>
          </label>
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {isSearching && (
              <p className="font-cinzel text-white/70 text-xs text-center py-4">Searching...</p>
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
                onClick={() => onSearchResultSelect(result)}
                className="w-full p-3 bg-[#5d4e37] hover:bg-[#6d5e47] rounded text-left transition-colors"
              >
                <p className="font-cinzel text-white font-semibold text-sm mb-1">{result.text}</p>
                <p className="font-cinzel text-white/60 text-xs">{result.place_name}</p>
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
                  onClick={() => onSavedLocationSelect(location)}
                  className="flex-1 text-left hover:opacity-80 transition-opacity"
                >
                  <p className="font-cinzel text-white font-semibold text-sm">{location.title}</p>
                  {location.address && (
                    <p className="font-cinzel text-white/60 text-xs mt-1">{location.address}</p>
                  )}
                  <p className="font-cinzel text-white/50 text-xs mt-1">
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </p>
                </button>
                <button
                  onClick={() => onDeleteLocation(location.id)}
                  className="p-1 text-red-400 hover:text-red-300"
                  aria-label="Delete location"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
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
