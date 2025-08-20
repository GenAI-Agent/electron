import { ChevronDown, ChevronUp, Edit2, X } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";
;
import { ReactMarkdownCustom } from "@/components/ReactMarkdownCustom";
const ERROR_CODE_DESCRIPTIONS: Record<string, string> = {
  A: "值正確但 Key 名稱與標準欄位不同",
  B: "值本身錯誤（單位、格式沒有轉換，或是填寫錯誤）",
  C: "應該有值卻漏填",
  D: "其他異常（如重複、多餘、無法判斷）",
};
interface ExpandedSections {
  short: boolean;
  long: boolean;
  errors: boolean;
  nonAllocated: boolean;
}

interface DetailModalProps {
  currentResult: any;
  needsModification: (result: any) => boolean;
  handleCloseDetail: () => void;
  handleEdit: (result: any) => void;
  toggleSection: (section: keyof ExpandedSections) => void;
  expandedSections: ExpandedSections;
}

export default function DetailModal({
  currentResult,
  needsModification,
  handleCloseDetail,
  handleEdit,
  toggleSection,
  expandedSections,
}: DetailModalProps) {
  if (!currentResult) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex justify-between">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">
              {currentResult.book_name || "文檔詳情"}
            </h2>
            {needsModification(currentResult) && (
              <span className="ml-2 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                需要修改
              </span>
            )}
          </div>
          <button
            onClick={handleCloseDetail}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4 border-b border-gray-200 pb-4">
          <div>
            <p className="text-sm text-gray-500">創建時間</p>
            <p className="font-medium">
              {currentResult.create_time
                ? new Date(currentResult.create_time).toLocaleString()
                : "無創建時間"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">更新時間</p>
            <p className="font-medium">
              {currentResult.updated_at
                ? new Date(currentResult.updated_at).toLocaleString()
                : "無更新時間"}
            </p>
          </div>
        </div>

        {/* 短文本欄位 */}
        <div className="mb-4 rounded-lg border border-gray-200">
          <div
            className="flex cursor-pointer items-center justify-between bg-gray-50 p-3"
            onClick={() => toggleSection("short")}
          >
            <h3 className="font-semibold">標準短文本欄位</h3>
            {expandedSections.short ? <ChevronUp /> : <ChevronDown />}
          </div>
          {expandedSections.short && (
            <div className="p-3">
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="w-1/3 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        欄位名稱
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        數值
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {Object.entries(currentResult.short_text).map(
                      ([key, value], idx) => (
                        <tr
                          key={key}
                          className={cn(
                            idx % 2 === 0 ? "bg-white" : "bg-gray-50",
                            currentResult.short_error[key] ? "bg-red-50" : "",
                          )}
                        >
                          <td className="whitespace-nowrap px-4 py-2 text-sm">
                            <div className="flex items-center">
                              <span className="font-medium text-gray-900">
                                {key}
                              </span>
                              {currentResult.short_error[key] && (
                                <span
                                  className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800"
                                  title={
                                    ERROR_CODE_DESCRIPTIONS[
                                    currentResult.short_error[key]
                                    ]
                                  }
                                >
                                  錯誤 {currentResult.short_error[key]}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {value ? value.toString() : ""}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 長文本欄位 */}
        <div className="mb-4 rounded-lg border border-gray-200">
          <div
            className="flex cursor-pointer items-center justify-between bg-gray-50 p-3"
            onClick={() => toggleSection("long")}
          >
            <h3 className="font-semibold">標準長文本欄位</h3>
            {expandedSections.long ? <ChevronUp /> : <ChevronDown />}
          </div>
          {expandedSections.long && (
            <div className="space-y-4 p-3">
              {Object.entries(currentResult.long_text).map(([key, value]) => (
                <div
                  key={key}
                  className="overflow-hidden rounded-md border border-gray-200"
                >
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                    <h4 className="text-sm font-semibold text-gray-700">
                      {key}
                    </h4>
                  </div>
                  <div className="bg-white p-4">
                    <ReactMarkdownCustom className="prose max-w-none text-gray-600">
                      {value ? value.toString() : ""}
                    </ReactMarkdownCustom>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 錯誤欄位 */}
        {Object.keys(currentResult.short_error).length > 0 && (
          <div className="mb-4 rounded-lg border border-red-200">
            <div
              className="flex cursor-pointer items-center justify-between bg-red-50 p-3"
              onClick={() => toggleSection("errors")}
            >
              <div className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                <h3 className="font-semibold text-red-700">
                  需要修正的欄位 (
                  {Object.keys(currentResult.short_error).length})
                </h3>
              </div>
              {expandedSections.errors ? <ChevronUp /> : <ChevronDown />}
            </div>
            {expandedSections.errors && (
              <div className="p-3">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        欄位名稱
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        錯誤代碼
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        錯誤描述
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        當前值
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(currentResult.short_error).map(
                      ([key, code]) => (
                        <tr key={key}>
                          <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-900">
                            {key}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-900">
                            {String(code)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {ERROR_CODE_DESCRIPTIONS[code as string] ||
                              "未知錯誤"}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {currentResult.short_text[key] || "無數據"}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 未分配的長文本 */}
        {currentResult.long_non_allocate.length > 0 && (
          <div className="mb-4 rounded-lg border border-yellow-200">
            <div
              className="flex cursor-pointer items-center justify-between bg-yellow-50 p-3"
              onClick={() => toggleSection("nonAllocated")}
            >
              <div className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold text-yellow-700">
                  未分配的文本 ({currentResult.long_non_allocate.length})
                </h3>
              </div>
              {expandedSections.nonAllocated ? <ChevronUp /> : <ChevronDown />}
            </div>
            {expandedSections.nonAllocated && (
              <div className="p-3">
                {currentResult.long_non_allocate.map((text: any, idx: any) => (
                  <div
                    key={idx}
                    className="mb-2 rounded-md border border-gray-200 bg-gray-50 p-2"
                  >
                    <p className="whitespace-pre-wrap text-sm text-gray-600">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={handleCloseDetail}
            className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300"
          >
            關閉
          </button>
          {needsModification(currentResult) && (
            <button
              onClick={() => handleEdit(currentResult)}
              className="flex items-center rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600"
            >
              <Edit2 className="mr-2 h-4 w-4" />
              修改資料
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
