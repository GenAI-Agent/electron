"use client";

import { cn } from "@/utils/cn";
;

interface TabNavigationProps {
  activeTab: "pricing" | "marketing" | "summary" | "social" | "userReports";
  setActiveTab: (
    tab: "pricing" | "marketing" | "summary" | "social" | "userReports",
  ) => void;
}

export default function TabNavigation({
  activeTab,
  setActiveTab,
}: TabNavigationProps) {
  const tabs = [
    { id: "pricing", label: "價格報表", color: "blue", disabled: false },
    { id: "summary", label: "價格報表摘要", color: "green", disabled: false },
    {
      id: "marketing",
      label: "行銷趨勢報告",
      color: "yellow",
      disabled: false,
    },
    {
      id: "userReports",
      label: "生成的價格報表",
      color: "purple",
      disabled: false,
    },
    { id: "social", label: "本週社群熱度", color: "red", disabled: true },
  ] as const;

  return (
    <div className="mb-4 flex space-x-2 border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
          disabled={tab.disabled}
          className={cn(
            "px-4 py-2 font-medium transition-all",
            tab.disabled && "disabled:cursor-not-allowed disabled:opacity-50",
            activeTab === tab.id
              ? `border-b-2 border-${tab.color}-500 text-${tab.color}-600`
              : "text-gray-500 hover:text-gray-700",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
