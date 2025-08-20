"use client";

// import { ReactMarkdownCustom } from "@/components/ReactMarkdownCustom";
import ReactMarkdown from "react-markdown";

interface MarketingReport {
  id: string;
  content: string;
  created_at: string;
  books_event: string[];
  eslite_event: string[];
  kingstone_event: string[];
}

interface MarketingTabProps {
  marketingData: MarketingReport | null;
  isLoadingMarketing: boolean;
}

export default function MarketingTab({
  marketingData,
  isLoadingMarketing,
}: MarketingTabProps) {
  return (
    <div className="mb-8 mt-4 rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-4 text-xl font-semibold text-green-700">
        書籍市場行銷趨勢報告
      </h2>
      {isLoadingMarketing ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
        </div>
      ) : marketingData ? (
        <div className="prose max-w-none">
          <div className="mb-4 text-sm text-gray-500">
            報告生成時間:{" "}
            {new Date(
              new Date(marketingData.created_at).getTime() + 8 * 60 * 60 * 1000,
            ).toLocaleString("zh-TW", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          {/* <ReactMarkdownCustom>{marketingData.content}</ReactMarkdownCustom> */}
          <ReactMarkdown>{marketingData.content}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-gray-500">暫時沒有行銷趨勢報告</p>
      )}
    </div>
  );
}
