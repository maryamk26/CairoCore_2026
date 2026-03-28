"use client";

interface RouteBuilderHeaderProps {
  onBack: () => void;
  isSinglePlace: boolean;
}

export default function RouteBuilderHeader({ onBack, isSinglePlace }: RouteBuilderHeaderProps) {
  return (
    <div className="mb-8">
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-white/70 hover:text-white transition-colors font-cinzel"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
      <h1 className="font-cinzel text-4xl md:text-5xl font-bold text-white mb-4">
        {isSinglePlace ? "Your Selected Location" : "Your Optimized Route"}
      </h1>
      <p className="font-cinzel text-white/80 text-lg">
        {isSinglePlace
          ? "View your selected location on the map and add more places if you'd like."
          : "Review and adjust your trip route. Drag to reorder stops."}
      </p>
    </div>
  );
}
