"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import PricingTable from "./PricingTable";
import { cn } from "@/utils/cn";
;
import { PricingReport } from "@/types";

interface PricingAccordionProps {
  title: string;
  count: number;
  avgMargin: number;
  books: PricingReport[];
}

export default function PricingAccordion({
  title,
  count,
  avgMargin,
  books,
}: PricingAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-4 overflow-hidden rounded-lg bg-white shadow-md transition-all duration-300">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex cursor-pointer items-center justify-between border-b p-4 transition-all hover:bg-slate-50",
          isOpen ? "border-b-blue-100" : "border-b-transparent",
        )}
      >
        <div className="flex items-center">
          <h3 className="text-xl font-semibold text-indigo-700">
            {title}{" "}
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({count}本)
            </span>
          </h3>
        </div>
        <div className="flex items-center">
          <span className="mr-4 text-sm font-medium">
            平均利潤率:
            <span className="ml-1 text-emerald-600">
              {avgMargin.toFixed(2)}%
            </span>
          </span>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="p-4">
          <PricingTable
            error={""}
            bookResult={books}
            isLoading={false}
            categoryTitle={""}
            searchBar={false}
          />
        </div>
      </div>
    </div>
  );
}
