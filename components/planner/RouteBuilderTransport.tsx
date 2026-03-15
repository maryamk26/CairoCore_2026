"use client";

interface RouteBuilderTransportProps {
  transportMode: string;
  onTransportModeChange: (mode: string) => void;
}

const MODES = ["walk", "car", "motorcycle"] as const;

export default function RouteBuilderTransport({
  transportMode,
  onTransportModeChange,
}: RouteBuilderTransportProps) {
  return (
    <div className="bg-[#5d4e37] rounded-lg p-6">
      <h3 className="font-cinzel text-xl font-bold text-white mb-1">How you get around</h3>
      <p className="font-cinzel text-white/70 text-sm mb-4">
        Choose how you’ll travel between stops to see travel time and total trip duration.
      </p>
      <div className="flex flex-wrap gap-2">
        {MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onTransportModeChange(mode)}
            className={`px-4 py-2 rounded-lg font-cinzel font-semibold capitalize transition-colors ${
              transportMode === mode
                ? "bg-[#d4af37] text-[#3a3428]"
                : "bg-[#8b6f47] text-white hover:bg-[#9d7f57]"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
      {!transportMode && (
        <p className="font-cinzel text-white/50 text-xs mt-3">
          Choose Walk, Car, or Motorcycle above.
        </p>
      )}
    </div>
  );
}
