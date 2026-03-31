"use client";

interface Tab {
  label: string;
  value: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="flex items-center gap-1 px-6 h-10
      border-b border-[rgba(255,255,255,0.06)] shrink-0">
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={[
            "px-3 py-1 rounded-md text-[13px] font-medium transition-colors duration-150",
            activeTab === tab.value
              ? "bg-white/[0.08] text-[#f0f0f0]"
              : "text-[#8a8a8a] hover:text-[#f0f0f0] hover:bg-white/5"
          ].join(" ")}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
