"use client";

import PricingAccordion from "./PricingAccordion";
import { PricingReport } from "@/types";

interface SummaryTabProps {
  currentReportQuery: {
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    error: unknown;
    data: any;
    refetch: () => void;
  };
  reportType: "category" | "publisher";
}

export default function SummaryTab({
  currentReportQuery,
  reportType,
}: SummaryTabProps) {
  const renderSummaryReport = () => {
    if (!currentReportQuery.data) return <div>沒有找到報表數據</div>;

    // 获取对象中的所有键作为类别或出版社列表
    const categories = Object.keys(currentReportQuery.data);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {reportType === "category" ? "書籍種類價格報表" : "出版社價格報表"}
            <span className="ml-4 text-sm text-gray-500">
              顯示市場最低價低於讀冊售價的書籍
            </span>
          </h2>
          <span className="text-sm text-gray-500">
            更新時間: 2025-06-02 10:00:00
          </span>
        </div>
        <div className="h-[70vh] overflow-y-auto py-4">
          {categories.map((category) => {
            const books = currentReportQuery.data[category];
            // 计算该类别/出版社的平均利润率
            const avgMargin =
              books.reduce(
                (sum: number, book: PricingReport) => sum + book.margin,
                0,
              ) / books.length;

            return (
              <PricingAccordion
                key={category}
                title={category}
                count={books.length}
                avgMargin={avgMargin}
                books={books}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="mb-8 mt-4 w-full">
      {currentReportQuery.isLoading || currentReportQuery.isFetching ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="ml-3 text-lg font-medium text-blue-700">
            正在加載報表數據...
          </p>
        </div>
      ) : currentReportQuery.isError ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg bg-red-50 p-6 text-red-600">
          <p className="text-xl font-medium">獲取數據時出錯</p>
          <p className="mt-2">{`${currentReportQuery.error}`}</p>
          <button
            onClick={() => currentReportQuery.refetch()}
            className="mt-4 rounded-md bg-red-100 px-4 py-2 text-red-700 hover:bg-red-200"
          >
            重試
          </button>
        </div>
      ) : (
        renderSummaryReport()
      )}
    </div>
  );
}
