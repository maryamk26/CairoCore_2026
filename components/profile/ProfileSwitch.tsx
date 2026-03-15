"use client";

interface ProfileSwitchProps {
  activeTab: "created" | "saved";
  onSwitch: (tab: "created" | "saved") => void;
}

export default function ProfileSwitch({ activeTab, onSwitch }: ProfileSwitchProps) {
  return (
    <div className="flex justify-center gap-8 border-b border-[#5d4e37]/20">
      <button
        onClick={() => onSwitch("created")}
        className={`relative pb-3 text-base font-semibold transition-colors duration-200 ${
          activeTab === "created"
            ? "text-[#5d4e37]"
            : "text-[#5d4e37]/60 hover:text-[#5d4e37]"
        }`}
      >
        Created
        {activeTab === "created" && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5d4e37]" />
        )}
      </button>
      <button
        onClick={() => onSwitch("saved")}
        className={`relative pb-3 text-base font-semibold transition-colors duration-200 ${
          activeTab === "saved"
            ? "text-[#5d4e37]"
            : "text-[#5d4e37]/60 hover:text-[#5d4e37]"
        }`}
      >
        Saved
        {activeTab === "saved" && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5d4e37]" />
        )}
      </button>
    </div>
  );
}
