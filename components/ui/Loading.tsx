"use client";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#f5f1e8] via-[#e8ddd4] to-[#d4c4b0]">
      <div className="flex flex-col items-center gap-6">
        <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-[#5d4e37]">CairoCore</h2>
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-[#8b6f47]/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-[#8b6f47] rounded-full animate-spin"></div>
        </div>
        <p className="font-cinzel text-[#5d4e37]/70 text-sm">Loading...</p>
      </div>
    </div>
  );
}
