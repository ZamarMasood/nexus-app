"use client";

import { Plus, SlidersHorizontal } from "lucide-react";

interface PageHeaderProps {
  title: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  showFilter?: boolean;
}

export function PageHeader({ title, primaryAction, showFilter }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 h-14
      border-b border-[rgba(255,255,255,0.06)] shrink-0">

      <h1 className="text-[15px] font-medium text-[#f0f0f0] tracking-[-0.01em]">
        {title}
      </h1>

      <div className="flex items-center gap-2">
        {showFilter && (
          <button className="p-1.5 rounded-md text-[#555] hover:text-[#8a8a8a]
            hover:bg-white/5 transition-colors duration-150">
            <SlidersHorizontal size={15} />
          </button>
        )}

        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5
              bg-[#5e6ad2] hover:bg-[#6872e5] active:scale-[0.98]
              text-white text-[13px] font-medium rounded-md
              transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[rgba(94,106,210,0.35)]"
          >
            <Plus size={14} />
            {primaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
