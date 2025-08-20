"use client";

import { useState, Dispatch, SetStateAction } from "react";
import { Check, X, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { cn } from "@/utils/cn";
;
import { LONG_STD_COLUMNS, SHORT_STD_COLUMNS } from "@/constants/standard";

// 定義錯誤代碼說明
const ERROR_CODE_DESCRIPTIONS: Record<string, string> = {
  A: "值正確但 Key 名稱與標準欄位不同",
  B: "值本身錯誤（單位、格式沒有轉換，或是填寫錯誤）",
  C: "應該有值卻漏填",
  D: "其他異常（如重複、多餘、無法判斷）",
};

// 定義資料類型
type BookData = {
  _id: string;
  book_name: string;
  short_text: Record<string, string>;
  long_text: Record<string, string>;
  short_error: Record<string, string>;
  long_non_allocate: string[];
  create_time: string;
  updated_at?: string;
};

interface EditModalProps {
  editedData: BookData;
  handleCancelEdit: () => void;
  handleSaveEdit: () => void;
  handleUpdateField: (
    field: "short_text" | "long_text",
    key: string,
    value: string,
  ) => void;
  handleAddToLongText: (text: string, idx: number) => void;
  handleDeleteNonAllocatedText: (idx: number) => void;
  hasChanges: boolean;
  setEditedData: Dispatch<SetStateAction<BookData>>;
  setHasChanges: Dispatch<SetStateAction<boolean>>;
}

// 定義 Tab 類型
type TabType = "一般修復" | "AI錯誤偵測";

export default function EditModal({
  editedData,
  handleCancelEdit,
  handleSaveEdit,
  handleUpdateField,
  handleAddToLongText,
  handleDeleteNonAllocatedText,
  hasChanges,
  setEditedData,
  setHasChanges,
}: EditModalProps) {
  // 添加已修复字段的状态
  const [fixedFields, setFixedFields] = useState<
    Record<string, { value: string; errorCode: string }>
  >({});

  // 添加折叠状态
  const [collapsed, setCollapsed] = useState({
    shortFields: false,
    longFields: false,
    errors: false,
    fixed: false,
    nonAllocated: false,
  });

  // 添加当前Tab状态
  const [activeTab, setActiveTab] = useState<TabType>("一般修復");

  // 检查是否有AI错误
  const hasAIErrors =
    Object.keys(editedData.short_error).length > 0 ||
    editedData.long_non_allocate.length > 0 ||
    Object.keys(fixedFields).length > 0;

  const handleRemoveError = (key: string) => {
    if (!editedData) return;

    const newErrors = { ...editedData.short_error };
    const errorCode = newErrors[key]; // 保存错误代码，用于显示在已修复字段中
    delete newErrors[key];

    // 将已修复的字段添加到fixedFields状态中
    setFixedFields((prev) => ({
      ...prev,
      [key]: {
        value: editedData.short_text[key] || "",
        errorCode: errorCode,
      },
    }));

    setEditedData({
      ...editedData,
      short_error: newErrors,
    });
    setHasChanges(true);
  };

  // 从已修复列表中恢复错误
  const handleRestoreError = (key: string) => {
    if (!editedData || !fixedFields[key]) return;

    const newFixedFields = { ...fixedFields };
    const errorCode = newFixedFields[key].errorCode;
    delete newFixedFields[key];

    setFixedFields(newFixedFields);

    setEditedData({
      ...editedData,
      short_error: {
        ...editedData.short_error,
        [key]: errorCode,
      },
    });
    setHasChanges(true);
  };

  // 切换折叠状态
  const toggleCollapse = (section: keyof typeof collapsed) => {
    setCollapsed((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex justify-between">
          <h2 className="text-xl font-semibold">
            修改資料: {editedData.book_name}
          </h2>
          <button
            onClick={handleCancelEdit}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tab 切換 */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-4">
            <button
              className={cn(
                "border-b-2 pb-2 font-medium transition-colors",
                activeTab === "一般修復"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
              )}
              onClick={() => setActiveTab("一般修復")}
            >
              一般修復
            </button>

            {hasAIErrors && (
              <button
                className={cn(
                  "border-b-2 pb-2 font-medium transition-colors",
                  activeTab === "AI錯誤偵測"
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                )}
                onClick={() => setActiveTab("AI錯誤偵測")}
              >
                AI錯誤偵測
                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                  {Object.keys(editedData.short_error).length +
                    editedData.long_non_allocate.length +
                    (Object.keys(fixedFields).length > 0
                      ? Object.keys(fixedFields).length
                      : 0)}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* 一般修復内容 */}
        {activeTab === "一般修復" && (
          <div className="space-y-6">
            {/* 短文本編輯區塊 */}
            <div className="mb-6">
              <div
                className="mb-2 flex cursor-pointer items-center justify-between"
                onClick={() => toggleCollapse("shortFields")}
              >
                <h3 className="font-semibold text-blue-700">
                  編輯標準短文本欄位
                </h3>
                {collapsed.shortFields ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                )}
              </div>

              {!collapsed.shortFields && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {SHORT_STD_COLUMNS.map((fieldName) => {
                      const isError = editedData.short_error[fieldName];
                      // const isFixed = fixedFields[fieldName];

                      // 所有字段都显示（不再跳过错误字段）
                      return (
                        <div
                          key={fieldName}
                          className={cn(
                            "rounded-lg border p-3",
                            isError
                              ? "border-red-300 bg-red-50"
                              : editedData.short_text[fieldName]
                                ? "border-gray-200 bg-white"
                                : "border-gray-200 bg-gray-50",
                          )}
                        >
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            {fieldName}
                            {isError && (
                              <span className="ml-2 text-xs text-red-500">
                                {
                                  ERROR_CODE_DESCRIPTIONS[
                                  editedData.short_error[fieldName] as string
                                  ]
                                }
                              </span>
                            )}
                          </label>
                          <input
                            type="text"
                            value={editedData.short_text[fieldName] || ""}
                            onChange={(e) =>
                              handleUpdateField(
                                "short_text",
                                fieldName,
                                e.target.value,
                              )
                            }
                            placeholder={`輸入${fieldName}`}
                            className={cn(
                              "w-full rounded-md border p-2 text-sm",
                              isError
                                ? "border-red-300 bg-red-50"
                                : "border-gray-300",
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 長文本編輯區塊 */}
            <div className="mb-6">
              <div
                className="mb-2 flex cursor-pointer items-center justify-between"
                onClick={() => toggleCollapse("longFields")}
              >
                <h3 className="font-semibold text-purple-700">
                  編輯標準長文本欄位
                </h3>
                {collapsed.longFields ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                )}
              </div>

              {!collapsed.longFields && (
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                  <div className="space-y-4">
                    {LONG_STD_COLUMNS.map((fieldName) => (
                      <div
                        key={fieldName}
                        className={cn(
                          "rounded-lg border p-3",
                          editedData.long_text[fieldName]
                            ? "border-gray-200 bg-white"
                            : "border-gray-200 bg-gray-50",
                        )}
                      >
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          {fieldName}
                        </label>
                        <textarea
                          value={editedData.long_text[fieldName] || ""}
                          onChange={(e) =>
                            handleUpdateField(
                              "long_text",
                              fieldName,
                              e.target.value,
                            )
                          }
                          placeholder={`輸入${fieldName}`}
                          className="w-full rounded-md border border-gray-300 p-2 text-sm"
                          rows={4}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI錯誤偵測内容 */}
        {activeTab === "AI錯誤偵測" && hasAIErrors && (
          <div className="space-y-6">
            {/* 需要修正的欄位 */}
            {Object.keys(editedData.short_error).length > 0 && (
              <div className="mb-6">
                <div
                  className="mb-2 flex cursor-pointer items-center justify-between"
                  onClick={() => toggleCollapse("errors")}
                >
                  <h3 className="font-semibold text-red-700">
                    需要修正、確認的欄位
                  </h3>
                  {collapsed.errors ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  )}
                </div>

                {!collapsed.errors && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="w-1/4 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                            >
                              欄位名稱
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                            >
                              錯誤類型
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                            >
                              數值
                            </th>
                            <th
                              scope="col"
                              className="w-16 px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                            >
                              動作
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {Object.entries(editedData.short_error).map(
                            ([key, code]) => (
                              <tr key={key}>
                                <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-gray-900">
                                  {key}
                                </td>
                                <td className="px-4 py-2">
                                  <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-700">
                                    {String(code)}:{" "}
                                    {ERROR_CODE_DESCRIPTIONS[code as string]}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="text"
                                    value={editedData.short_text[key] || ""}
                                    onChange={(e) =>
                                      handleUpdateField(
                                        "short_text",
                                        key,
                                        e.target.value,
                                      )
                                    }
                                    className="w-full rounded-md border border-gray-300 p-2 text-sm"
                                  />
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <button
                                    onClick={() => handleRemoveError(key)}
                                    className="rounded-full bg-green-100 p-1 text-green-800 hover:bg-green-200"
                                    title="標記為已修復"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
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
            )}

            {/* 新增已修复字段区块 */}
            {Object.keys(fixedFields).length > 0 && (
              <div className="mb-6">
                <div
                  className="mb-2 flex cursor-pointer items-center justify-between"
                  onClick={() => toggleCollapse("fixed")}
                >
                  <h3 className="font-semibold text-green-700">已修復的欄位</h3>
                  {collapsed.fixed ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  )}
                </div>

                {!collapsed.fixed && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="w-1/4 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                            >
                              欄位名稱
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                            >
                              原錯誤類型
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                            >
                              修復後的值
                            </th>
                            <th
                              scope="col"
                              className="w-16 px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                            >
                              動作
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {Object.entries(fixedFields).map(
                            ([key, { value, errorCode }]) => (
                              <tr key={key} className="bg-green-50">
                                <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-gray-900">
                                  {key}
                                </td>
                                <td className="px-4 py-2">
                                  <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                                    {String(errorCode)}:{" "}
                                    {
                                      ERROR_CODE_DESCRIPTIONS[
                                      errorCode as string
                                      ]
                                    }
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {value}
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <button
                                    onClick={() => handleRestoreError(key)}
                                    className="rounded-full bg-red-100 p-1 text-red-800 hover:bg-red-200"
                                    title="還原到未修復狀態"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
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
            )}

            {/* 未分配的長文本 */}
            {editedData.long_non_allocate.length > 0 && (
              <div className="mb-6">
                <div
                  className="mb-2 flex cursor-pointer items-center justify-between"
                  onClick={() => toggleCollapse("nonAllocated")}
                >
                  <h3 className="font-semibold text-yellow-700">
                    未分配的文本
                  </h3>
                  {collapsed.nonAllocated ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  )}
                </div>

                {!collapsed.nonAllocated && (
                  <div className="overflow-x-auto rounded-lg border border-yellow-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-yellow-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-700"
                          >
                            文本內容
                          </th>
                          <th
                            scope="col"
                            className="w-48 px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-700"
                          >
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {editedData.long_non_allocate.map(
                          (text: string, idx: number) => (
                            <tr key={idx}>
                              <td className="max-w-md px-4 py-2">
                                <div className="max-h-32 overflow-y-auto">
                                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-600">
                                    {text}
                                  </pre>
                                </div>
                              </td>
                              <td className="w-48 px-4 py-2">
                                <div className="flex items-start justify-center space-x-2">
                                  <button
                                    onClick={() =>
                                      handleAddToLongText(text, idx)
                                    }
                                    className="rounded-md bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 hover:bg-blue-200"
                                  >
                                    添加至標準欄位
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteNonAllocatedText(idx)
                                    }
                                    className="rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-200"
                                    title="刪除"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
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
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <button
            onClick={handleCancelEdit}
            className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300"
          >
            取消
          </button>
        </div>

        {hasChanges && (
          <div className="fixed bottom-6 right-6 z-10">
            <button
              onClick={handleSaveEdit}
              className="flex items-center space-x-2 rounded-lg bg-blue-500 px-4 py-2 font-medium text-white shadow-lg transition-colors hover:bg-blue-600"
            >
              <Check className="h-4 w-4" />
              <span>保存修改</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
