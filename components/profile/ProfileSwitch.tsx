"use client";

interface ProfileSwitchProps<T extends string> {
  activeTab: T;
  onSwitch: (tab: T) => void;
  tabs: readonly {
    id: T;
    label: string;
  }[];
}

export default function ProfileSwitch<T extends string>({
  activeTab,
  onSwitch,
  tabs,
}: ProfileSwitchProps<T>) {
  return (
    <div className="flex justify-center gap-8 border-b border-[#5d4e37]/20">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSwitch(tab.id)}
          className={`relative pb-3 text-base font-semibold transition-colors duration-200 ${
            activeTab === tab.id
              ? "text-[#5d4e37]"
              : "text-[#5d4e37]/60 hover:text-[#5d4e37]"
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5d4e37]" />
          )}
        </button>
      ))}
    </div>
  );
}
