"use client";

import PricingTable from "./PricingTable";
import { PricingReport } from "@/types";

interface PricingTabProps {
  bookResult: PricingReport[];
  pricingData: PricingReport[];
  isSearching: boolean;
  categoryTitle: string;
}

export default function PricingTab({
  bookResult,
  pricingData,
  isSearching,
  categoryTitle,
}: PricingTabProps) {
  return (
    <div className="mb-8 mt-4">
      <PricingTable
        error=""
        bookResult={bookResult.length > 0 ? bookResult : pricingData}
        isLoading={isSearching}
        categoryTitle={
          bookResult.length > 0 ? bookResult[0].prod_title_main : categoryTitle
        }
        searchBar={true}
      />
    </div>
  );
}
