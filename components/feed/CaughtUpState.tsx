"use client";

export default function CaughtUpState() {
  return (
    <div className="rounded-[28px] border border-[#d8c9b8] bg-white/90 px-6 py-10 text-center shadow-sm">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#8b6f47]/30 bg-[#faf7f2]">
        <svg
          className="h-8 w-8 text-[#8b6f47]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="font-cinzel text-2xl text-[#3a3428]">You&apos;re All Caught Up</h3>
    </div>
  );
}
