"use client";

import { cn } from "@/utils/cn";


interface ReportButtonsProps {
  onGetReport: (type: "category" | "publisher") => void;
  categoryReportQuery: {
    isLoading: boolean;
    isFetching: boolean;
  };
  publisherReportQuery: {
    isLoading: boolean;
    isFetching: boolean;
  };
}

export default function ReportButtons({
  onGetReport,
  categoryReportQuery,
  publisherReportQuery,
}: ReportButtonsProps) {
  return (
    <div className="mb-6 flex space-x-4 px-10">
      <button
        onClick={() => onGetReport("category")}
        disabled={
          categoryReportQuery.isLoading || categoryReportQuery.isFetching
        }
        className={cn(
          "group relative flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-white transition-all duration-300 hover:shadow-lg",
          (categoryReportQuery.isLoading || categoryReportQuery.isFetching) &&
          "cursor-not-allowed opacity-75",
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"></div>
        <div className="relative z-10 flex items-center font-medium">
          {categoryReportQuery.isLoading || categoryReportQuery.isFetching ? (
            <>
              <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              載入中...
            </>
          ) : (
            "書籍種類價格報表"
          )}
        </div>
      </button>

      <button
        onClick={() => onGetReport("publisher")}
        disabled={
          publisherReportQuery.isLoading || publisherReportQuery.isFetching
        }
        className={cn(
          "group relative flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-white transition-all duration-300 hover:shadow-lg",
          (publisherReportQuery.isLoading || publisherReportQuery.isFetching) &&
          "cursor-not-allowed opacity-75",
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"></div>
        <div className="relative z-10 flex items-center font-medium">
          {publisherReportQuery.isLoading || publisherReportQuery.isFetching ? (
            <>
              <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              載入中...
            </>
          ) : (
            "出版社價格報表"
          )}
        </div>
      </button>
    </div>
  );
}
