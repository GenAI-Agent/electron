"use client";

import { cn } from "@/utils/cn";
;
import { PricingReport } from "@/types";
import PricingTable from "./PricingTable";

interface UserReport {
  uuid: string;
  report_name: string;
  prod_ids: string;
  created_at: string;
}

interface CsvUploadResponse {
  status: string;
  message: string;
  uuid: string;
  report_name: string;
  processed_count: number;
  data: any;
}

interface UserReportsTabProps {
  // CSV上传相关
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  reportName: string;
  setReportName: (name: string) => void;
  isUploading: boolean;
  uploadResult: CsvUploadResponse | null;
  handleCsvUpload: () => void;

  // 用户报告列表相关
  userReports: UserReport[];
  isLoadingReports: boolean;
  fetchUserReports: () => void;
  selectedReport: UserReport | null;
  selectedReportData: PricingReport[];
  isLoadingReportData: boolean;
  fetchReportData: (report: UserReport) => void;
}

export default function UserReportsTab({
  selectedFile,
  setSelectedFile,
  reportName,
  setReportName,
  isUploading,
  uploadResult,
  handleCsvUpload,
  userReports,
  isLoadingReports,
  fetchUserReports,
  selectedReport,
  selectedReportData,
  isLoadingReportData,
  fetchReportData,
}: UserReportsTabProps) {
  return (
    <div className="mb-8 mt-4 w-full">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* CSV上传区域 */}
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold text-purple-700">
            上傳CSV書單
          </h2>

          {/* 上传表单 */}
          <div className="space-y-4">
            {/* 报告名称输入 */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                報告名稱
              </label>
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="請輸入報告名稱"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            {/* 文件选择 */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                選擇CSV文件
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 file:mr-4 file:rounded-md file:border-0 file:bg-purple-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-purple-700 hover:file:bg-purple-100"
                />
                {selectedFile && (
                  <div className="flex items-center justify-between rounded-md bg-gray-50 p-2">
                    <span className="text-sm text-gray-600">
                      已選擇: {selectedFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      清除
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                CSV文件應包含: prod_id, org_prod_id, prod_title_main 欄位
              </p>
            </div>

            {/* 上传按钮 */}
            <button
              onClick={handleCsvUpload}
              disabled={isUploading || !selectedFile || !reportName.trim()}
              className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-2 text-white transition-all duration-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                  >
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
                  上傳中...
                </div>
              ) : (
                "上傳並生成報告"
              )}
            </button>
          </div>

          {/* 上传结果显示 */}
          {uploadResult && (
            <div className="mt-4 rounded-lg bg-green-50 p-4">
              <h3 className="font-medium text-green-800">上傳成功！</h3>
              <p className="text-sm text-green-700">{uploadResult.message}</p>
              <p className="text-sm text-green-700">
                處理了 {uploadResult.processed_count} 本書籍
              </p>
            </div>
          )}
        </div>

        {/* 用户报告列表区域 */}
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-purple-700">
              生成的價格報表
            </h2>
            <button
              onClick={fetchUserReports}
              disabled={isLoadingReports}
              className="rounded-md bg-purple-100 px-3 py-1 text-sm text-purple-700 hover:bg-purple-200 disabled:opacity-50"
            >
              {isLoadingReports ? "載入中..." : "重新整理"}
            </button>
          </div>

          {/* 报告列表 */}
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {isLoadingReports ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
              </div>
            ) : userReports.length === 0 ? (
              <p className="text-center text-gray-500">尚無報告</p>
            ) : (
              userReports.map((report) => {
                const bookCount = report.prod_ids.length;

                return (
                  <div
                    key={report.uuid}
                    onClick={() => fetchReportData(report)}
                    className={cn(
                      "cursor-pointer rounded-lg border p-3 transition-all hover:bg-purple-50 hover:shadow-md",
                      selectedReport?.uuid === report.uuid
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200",
                    )}
                  >
                    <h3 className="font-medium text-gray-900">
                      {report.report_name || "未命名報告"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      建立時間:{" "}
                      {report.created_at
                        ? new Date(report.created_at).toLocaleString("zh-TW")
                        : "未知時間"}
                    </p>
                    <p className="text-sm text-gray-500">
                      書籍數量: {bookCount} 本
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 选中报告的数据显示区域 */}
      {selectedReport && (
        <div className="mt-6 rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold text-purple-700">
            報告詳情: {selectedReport.report_name}
          </h2>

          {isLoadingReportData ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
              <p className="ml-3 text-lg font-medium text-purple-700">
                正在載入報告數據...
              </p>
            </div>
          ) : selectedReportData.length === 0 ? (
            <p className="text-center text-gray-500">
              該報告沒有找到對應的價格數據
            </p>
          ) : (
            <PricingTable
              error=""
              bookResult={selectedReportData}
              isLoading={false}
              categoryTitle={selectedReport.report_name}
              searchBar={false}
            />
          )}
        </div>
      )}
    </div>
  );
}
