"use client";

import { cn } from "@/utils/cn";
;

interface TypeSelectorProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
}

export default function TypeSelector({
  selectedType,
  onTypeChange,
}: TypeSelectorProps) {
  const types = [
    {
      id: "bestsellers",
      title: "200本暢銷書籍",
      gradient: "from-purple-500/80 to-blue-500/80",
      selectedGradient: "from-purple-700 to-blue-700",
    },
    {
      id: "readbook",
      title: "讀冊買斷書籍",
      gradient: "from-purple-500/80 to-blue-500/80",
      selectedGradient: "from-purple-700 to-blue-700",
    },
    {
      id: "discount79",
      title: "79折書籍",
      gradient: "from-purple-500/80 to-blue-500/80",
      selectedGradient: "from-purple-700 to-blue-700",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-3 gap-4 px-10">
      {types.map((type) => (
        <button
          key={type.id}
          onClick={() => onTypeChange(type.id)}
          className={cn(
            "group relative flex h-32 items-center justify-center overflow-hidden rounded-lg p-1 text-white shadow-xl transition-all duration-300",
            selectedType === type.id
              ? `bg-gradient-to-br ${type.selectedGradient} shadow-lg ring-4 ring-purple-300`
              : `bg-gradient-to-br ${type.gradient} hover:shadow`,
          )}
        >
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br from-purple-600/30 to-blue-600/30 blur-xl transition-opacity duration-300",
              selectedType === type.id
                ? "opacity-0"
                : "opacity-0 group-hover:opacity-100",
            )}
          ></div>
          <div
            className={cn(
              "absolute -inset-1 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 blur-md transition-opacity duration-300",
              selectedType === type.id
                ? "opacity-0"
                : "opacity-0 group-hover:opacity-70",
            )}
          />
          <div className="relative z-10 text-center font-bold">
            <span className="text-lg">{type.title}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
