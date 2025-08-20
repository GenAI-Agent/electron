"use client";

import ReactMarkdown from "react-markdown";

// import { ReactMarkdownCustom } from "@/components/ReactMarkdownCustom";

interface SocialReport {
  [key: string]: string;
}

interface SocialTabProps {
  socialReportQuery: {
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    error: unknown;
    data: SocialReport | undefined;
    refetch: () => void;
  };
}

export default function SocialTab({ socialReportQuery }: SocialTabProps) {
  const renderSocialReport = () => {
    const socialReport = socialReportQuery.data;
    if (!socialReport || Object.keys(socialReport).length === 0)
      return <div>沒有找到社群報告數據</div>;

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-red-600">
          社群關鍵詞熱度分析報告
        </h2>
        <div className="mb-4 text-sm text-gray-500">
          報告生成時間: 2025年5月13日 下午08:00
        </div>

        <div className="">
          {Object.entries(socialReport).map(([key, value]) => (
            <div key={key}>
              <h3 className="text-lg font-bold">{key}</h3>
              <div className="prose max-w-none pl-4">
                <ReactMarkdown>{value}</ReactMarkdown>
                {/* <ReactMarkdownCustom>{value}</ReactMarkdownCustom> */}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mb-8 mt-4 w-full">
      {socialReportQuery.isLoading || socialReportQuery.isFetching ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
          <p className="ml-3 text-lg font-medium text-red-700">
            正在加載社群報告數據...
          </p>
        </div>
      ) : socialReportQuery.isError ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg bg-red-50 p-6 text-red-600">
          <p className="text-xl font-medium">獲取社群數據時出錯</p>
          <p className="mt-2">{`${socialReportQuery.error}`}</p>
          <button
            onClick={() => socialReportQuery.refetch()}
            className="mt-4 rounded-md bg-red-100 px-4 py-2 text-red-700 hover:bg-red-200"
          >
            重試
          </button>
        </div>
      ) : (
        <div className="rounded-lg bg-white p-6 shadow-lg">
          {renderSocialReport()}
        </div>
      )}
    </div>
  );
}
