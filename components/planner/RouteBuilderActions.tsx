"use client";

interface RouteBuilderActionsProps {
  hasUserLocation: boolean;
  placesCount: number;
  onYallaClick: () => void;
  onSave: () => void | Promise<void>;
  onBack: () => void;
  saving?: boolean;
}

export default function RouteBuilderActions({
  hasUserLocation,
  placesCount,
  onYallaClick,
  onSave,
  onBack,
  saving = false,
}: RouteBuilderActionsProps) {
  return (
    <div className="space-y-3">
      {hasUserLocation && placesCount >= 1 && (
        <button
          type="button"
          onClick={onYallaClick}
          className="w-full px-6 py-4 bg-gradient-to-r from-[#d4af37] to-[#e5bf47] text-[#3a3428] rounded-lg font-cinzel font-bold hover:from-[#e5bf47] hover:to-[#f5cf57] transition-all transform hover:scale-105 shadow-lg text-lg"
        >
          Yalla! Let&apos;s Go
        </button>
      )}
      <button
        onClick={onSave}
        disabled={placesCount < 1 || saving}
        className="w-full px-6 py-3 bg-[#d4af37] text-[#3a3428] rounded-lg font-cinzel font-bold hover:bg-[#e5bf47] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Saving..." : "Save Route"}
      </button>
      <button
        onClick={onBack}
        className="w-full px-6 py-3 bg-[#8b6f47] text-white rounded-lg font-cinzel font-semibold hover:bg-[#9d7f57] transition-colors"
      >
        Add More Places
      </button>
    </div>
  );
}
