"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  AlertCircle,
  X,
  Download,
  CheckSquare,
  Square,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
;
import { LONG_STD_COLUMNS } from "@/constants/standard";
import DetailModal from "./Modal/DetailModal";
import EditModal from "./Modal/EditModal";
import * as XLSX from "xlsx";

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
interface ExpandedSections {
  short: boolean;
  long: boolean;
  errors: boolean;
  nonAllocated: boolean;
}

// 定義標準欄位順序
const STANDARD_FIELD_ORDER = [
  "出版社",
  "供應商代碼",
  "出版社代碼",
  "原文出版社",
  "商品條碼(EAN)",
  "ISBN/ISSN",
  "EISBN",
  "商品貨號",
  "業種別",
  "主要商品名稱",
  "次要商品名稱",
  "期數",
  "主要作者",
  "次要作者",
  "出版日期",
  "譯者",
  "編者",
  "繪者",
  "頁數",
  "冊數",
  "版別",
  "出版國",
  "內容語言別",
  "語文對照",
  "注音註記",
  "印刷模式",
  "編排型式",
  "出版型式",
  "裝訂型式",
  "裝訂型式補述",
  "叢書名稱(書系)",
  "CIP",
  "學思行分類",
  "商品內容分級",
  "適合年齡(起)",
  "適合年齡(迄)",
  "商品單位代碼",
  "商品定價",
  "商品特價",
  "商品批價",
  "進貨折扣",
  "銷售地區限制",
  "海外商品原幣別",
  "海外商品原定價",
  "商品銷售稅別",
  "商品長度",
  "商品寬度",
  "商品高度",
  "商品重量",
  "特別收錄／編輯的話",
  "商品簡介",
  "封面故事",
  "作者簡介",
  "譯者簡介",
  "內容頁次",
  "前言／序",
  "內文試閱",
  "名人導讀",
  "媒體推薦",
  "名人推薦",
  "得獎紀錄",
  "目錄／曲目",
  "附加商品標題",
  "附加商品內容",
  "絕版註記",
  "外幣兌匯率",
  "有庫存才賣註記",
  "二手書銷售註記",
  "系列代碼",
  "廠商店內碼",
  "紙張開數",
  "關鍵字詞",
  "商品截退日期",
  "銷售通路限制",
  "首批進倉日期",
  "隨貨附件",
];

export default function ResultsSection() {
  const [results, setResults] = useState<BookData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<BookData | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    short: false,
    long: false,
    errors: true,
    nonAllocated: true,
  });
  const [showLongTextModal, setShowLongTextModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteItemIndex, setDeleteItemIndex] = useState<number | null>(null);
  const [currentNonAllocatedText, setCurrentNonAllocatedText] = useState<{
    text: string;
    index: number;
  } | null>(null);
  const [longFieldsInput, setLongFieldsInput] = useState<
    Record<string, string>
  >({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchResultsData();
  }, []);

  useEffect(() => {
    // 當結果改變時重置選擇狀態
    setSelectedItems(new Set());
    setSelectAll(false);
  }, [results]);

  const fetchResultsData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/docAgent/results");
      if (!response.ok) {
        throw new Error("獲取結果數據失敗");
      }
      const data = await response.json();
      // 按照創建時間排序，由新到舊
      const sortedResults = [...(data.results || [])].sort((a, b) => {
        const dateA = new Date(a.create_time).getTime();
        const dateB = new Date(b.create_time).getTime();
        return dateB - dateA; // 由新到舊排序
      });
      setResults(sortedResults);
    } catch (error) {
      console.error("獲取結果數據錯誤:", error);
      toast.error("無法獲取結果數據");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowDetail = (result: BookData) => {
    setCurrentResult(result);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setCurrentResult(null);
  };

  const handleEdit = (result: BookData) => {
    if (!result) return;
    setEditedData({
      ...result,
      short_text: { ...result.short_text },
      long_text: { ...result.long_text },
      short_error: { ...result.short_error },
      long_non_allocate: [...result.long_non_allocate],
    });
    setShowEditModal(true);
    setShowDetail(false);
    setHasChanges(false);
  };

  const handleSaveEdit = async () => {
    if (!editedData || !editedData._id) return;

    setIsLoading(true);
    toast.loading("正在儲存修改...");

    try {
      // 首先更新書籍數據
      await updateBookData();

      toast.dismiss(); // 關閉所有toast
      toast.success("數據已成功更新", { duration: 3000 });
      setShowEditModal(false);
      setEditedData(null);
      fetchResultsData(); // 重新獲取數據
    } catch (error) {
      toast.dismiss(); // 關閉所有toast
      console.error("更新數據錯誤:", error);
      toast.error(
        `無法更新數據: ${error instanceof Error ? error.message : "未知錯誤"}`,
        { duration: 5000 },
      );

      // 顯示失敗但保留編輯的數據，以便用戶可以再次嘗試
    } finally {
      setIsLoading(false);
    }
  };

  // 更新書籍數據的函數
  const updateBookData = async () => {
    try {
      // 準備要發送到API的數據

      const dataToUpdate = {
        _id: editedData._id,
        book_name: editedData.book_name,
        short_text: editedData.short_text,
        long_text: editedData.long_text,
        short_error: editedData.short_error,
        long_non_allocate: editedData.long_non_allocate,
      };
      console.log("正在更新數據:", dataToUpdate);

      toast.loading("步驟 1/1: 更新書籍數據...", { id: "update-data" });

      // 發送請求到自訂API端點
      const response = await fetch(`/api/docAgent/books/updateData`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToUpdate),
        credentials: "include",
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        console.error("解析響應失敗:", e);
        throw new Error("無法解析服務器響應");
      }

      if (!response.ok) {
        console.error("伺服器返回錯誤:", responseData);
        throw new Error(
          responseData?.error || responseData?.message || "更新書籍數據失敗",
        );
      }

      console.log("書籍數據更新成功:", responseData);
      toast.success("書籍數據更新成功", { id: "update-data" });
      return responseData;
    } catch (error) {
      toast.error("更新書籍數據失敗", { id: "update-data" });
      throw error; // 重新拋出錯誤以便上層處理
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditedData(null);
  };

  const needsModification = (result: BookData) => {
    return (
      Object.keys(result.short_error).length > 0 ||
      result.long_non_allocate.length > 0
    );
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  const handleUpdateField = (
    type: "short_text" | "long_text",
    key: string,
    value: string,
  ) => {
    if (!editedData) return;

    setEditedData({
      ...editedData,
      [type]: {
        ...editedData[type],
        [key]: value,
      },
    });
    setHasChanges(true);
  };

  // const handleAddToShortText = (text: string, index: number) => {
  //   if (!editedData) return;

  //   // 提示用戶輸入欄位名稱
  //   const fieldName = prompt("請輸入欄位名稱:");
  //   if (!fieldName) return;

  //   // 更新 short_text 和 移除 long_non_allocate 中的項目
  //   setEditedData({
  //     ...editedData,
  //     short_text: {
  //       ...editedData.short_text,
  //       [fieldName]: text,
  //     },
  //     long_non_allocate: editedData.long_non_allocate.filter(
  //       (_: string, i: number) => i !== index,
  //     ),
  //   });
  //   setHasChanges(true);
  // };

  const handleAddToLongText = (text: string, index: number) => {
    if (!editedData) return;

    // 初始化輸入欄位值，僅填入現有資料，不自動選擇欄位
    const initialLongFieldsInput: Record<string, string> = {};
    LONG_STD_COLUMNS.forEach((field) => {
      // 如果已經有資料，就填入現有資料，否則為空字串
      initialLongFieldsInput[field] = editedData.long_text[field] || "";
    });

    // 保存當前選擇的文本和索引，準備添加到長文本欄位
    setCurrentNonAllocatedText({ text, index });
    setLongFieldsInput(initialLongFieldsInput);
    setShowLongTextModal(true);
    // 注意：实际修改在handleSaveLongText中进行并标记hasChanges
  };

  const handleDeleteNonAllocatedText = (index: number) => {
    if (!editedData) return;

    setDeleteItemIndex(index);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteNonAllocatedText = () => {
    if (!editedData || deleteItemIndex === null) return;

    setEditedData({
      ...editedData,
      long_non_allocate: editedData.long_non_allocate.filter(
        (_: string, i: number) => i !== deleteItemIndex,
      ),
    });

    setShowDeleteConfirmModal(false);
    setDeleteItemIndex(null);
    setHasChanges(true);
  };

  const handleSaveLongText = () => {
    if (!editedData || !currentNonAllocatedText) return;

    // 檢查是否至少有一個欄位被填寫
    const hasInput = Object.values(longFieldsInput).some(
      (value) => value.trim() !== "",
    );

    if (!hasInput) {
      toast.error("請至少填寫一個欄位");
      return;
    }

    // 創建新的 long_text 對象
    const newLongText = { ...editedData.long_text };

    // 將輸入的內容添加到對應的欄位中
    Object.entries(longFieldsInput).forEach(([field, value]) => {
      if (value.trim() !== "") {
        newLongText[field] = value;
      }
    });

    // 更新數據並移除已處理的未分配文本
    setEditedData({
      ...editedData,
      long_text: newLongText,
      long_non_allocate: editedData.long_non_allocate.filter(
        (_: string, i: number) => i !== currentNonAllocatedText.index,
      ),
    });

    setShowLongTextModal(false);
    setCurrentNonAllocatedText(null);
    setHasChanges(true);
  };

  const handleLongFieldInputChange = (field: string, value: string) => {
    setLongFieldsInput((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 添加處理選擇項目的函數
  const toggleSelectItem = (id: string) => {
    const newSelectedItems = new Set(selectedItems);
    if (newSelectedItems.has(id)) {
      newSelectedItems.delete(id);
    } else {
      newSelectedItems.add(id);
    }
    setSelectedItems(newSelectedItems);

    // 檢查是否所有項目都已選中
    setSelectAll(newSelectedItems.size === results.length);
  };

  // 處理全選/取消全選
  const toggleSelectAll = () => {
    if (selectAll) {
      // 取消全選
      setSelectedItems(new Set());
    } else {
      // 全選
      const allIds = results.map((item) => item._id);
      setSelectedItems(new Set(allIds));
    }
    setSelectAll(!selectAll);
  };

  // 導出XLS函數
  const exportToXLS = () => {
    if (selectedItems.size === 0) {
      toast.error("請選擇要導出的資料");
      return;
    }

    // 過濾選中的項目
    const selectedData = results.filter((item) => selectedItems.has(item._id));

    // 獲取所有可能的欄位名稱
    const allShortTextKeys = new Set<string>();
    const allLongTextKeys = new Set<string>();

    selectedData.forEach((item) => {
      Object.keys(item.short_text).forEach((key) => allShortTextKeys.add(key));
      Object.keys(item.long_text).forEach((key) => allLongTextKeys.add(key));
    });

    // 創建一個按標準順序排列的欄位集合
    const allFieldsOrdered: string[] = [];

    // 首先添加標準順序中存在的欄位
    STANDARD_FIELD_ORDER.forEach((field) => {
      if (allShortTextKeys.has(field) || allLongTextKeys.has(field)) {
        allFieldsOrdered.push(field);
      }
    });

    // 然後添加標準順序中不存在但資料中存在的欄位
    const allFieldsSet = new Set([...allShortTextKeys, ...allLongTextKeys]);
    allFieldsSet.forEach((field) => {
      if (
        !STANDARD_FIELD_ORDER.includes(field) &&
        !allFieldsOrdered.includes(field)
      ) {
        allFieldsOrdered.push(field);
      }
    });

    // 轉換為工作表所需的格式
    const sheetData = selectedData.map((item) => {
      const rowData: Record<string, string> = {};

      // 按照排序後的欄位順序添加數據
      allFieldsOrdered.forEach((field) => {
        if (allShortTextKeys.has(field)) {
          rowData[field] = item.short_text[field] || "";
        } else if (allLongTextKeys.has(field)) {
          rowData[field] = item.long_text[field] || "";
        } else {
          rowData[field] = "";
        }
      });

      return rowData;
    });

    // 創建工作簿和工作表
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sheetData);

    // 將工作表添加到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, "書籍資料");

    // 生成 Excel 檔案並下載
    XLSX.writeFile(
      workbook,
      `書籍資料_${new Date().toISOString().slice(0, 10)}.xlsx`,
      { bookType: "xlsx" },
    );

    toast.success(`成功導出 ${selectedItems.size} 條資料`);
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-4 text-gray-600">加載結果數據中...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-700">暫無結果數據</h3>
          <p className="text-gray-500">目前沒有可顯示的結果數據</p>
        </div>
      </div>
    );
  }

  // 长文本字段选择模态框
  const LongTextFieldModal = () => {
    if (!showLongTextModal || !currentNonAllocatedText) return null;

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
          <div className="mb-4 flex justify-between">
            <h2 className="text-xl font-semibold">編輯標準長文本欄位</h2>
            <button
              onClick={() => setShowLongTextModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4">
            <h3 className="mb-2 font-medium text-gray-700">待添加的文本：</h3>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <pre className="whitespace-pre-wrap text-sm text-gray-600">
                {currentNonAllocatedText.text}
              </pre>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-2 font-medium text-gray-700">
              請編輯標準欄位內容：
            </h3>
            <div className="space-y-4">
              {LONG_STD_COLUMNS.map((field) => {
                const hasExistingData = editedData?.long_text[field];
                return (
                  <div
                    key={field}
                    className="rounded-lg border border-gray-200 bg-white p-3"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <label className="font-medium text-gray-700">
                        {field}
                      </label>
                      {hasExistingData && (
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                          已有資料
                        </span>
                      )}
                    </div>
                    <textarea
                      value={longFieldsInput[field] || ""}
                      onChange={(e) =>
                        handleLongFieldInputChange(field, e.target.value)
                      }
                      placeholder="輸入內容"
                      className="w-full rounded-md border border-gray-300 p-2 text-sm"
                      rows={5}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={() => setShowLongTextModal(false)}
              className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300"
            >
              取消
            </button>
            <button
              onClick={handleSaveLongText}
              className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600"
            >
              確認儲存
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 确认删除模态框
  const DeleteConfirmModal = () => {
    if (!showDeleteConfirmModal || deleteItemIndex === null || !editedData)
      return null;

    const textToDelete = editedData.long_non_allocate[deleteItemIndex];

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center">
            <AlertCircle className="mr-3 h-6 w-6 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-800">確認刪除</h2>
          </div>

          <div className="mb-6">
            <p className="mb-4 text-gray-600">
              您確定要刪除這段未分配的文本嗎？此操作無法撤銷。
            </p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <pre className="whitespace-pre-wrap text-sm text-gray-600">
                {textToDelete}
              </pre>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowDeleteConfirmModal(false);
                setDeleteItemIndex(null);
              }}
              className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300"
            >
              取消
            </button>
            <button
              onClick={confirmDeleteNonAllocatedText}
              className="rounded-lg bg-red-500 px-4 py-2 font-medium text-white transition-colors hover:bg-red-600"
            >
              確認刪除
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[60vh] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow">
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">書籍資料分析結果</h2>
          <div className="flex space-x-2">
            <button
              onClick={exportToXLS}
              className={cn(
                "flex items-center rounded-lg px-3 py-1 text-sm font-medium transition-colors",
                selectedItems.size > 0
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "cursor-not-allowed bg-gray-200 text-gray-500",
              )}
              disabled={selectedItems.size === 0}
            >
              <Download className="mr-1 h-4 w-4" />
              導出所選 ({selectedItems.size})
            </button>
            <button
              onClick={fetchResultsData}
              className="flex items-center rounded-lg bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600"
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              刷新
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3">
                  <div
                    className="flex cursor-pointer items-center justify-center"
                    onClick={toggleSelectAll}
                  >
                    {selectAll ? (
                      <CheckSquare className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  書籍名稱
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  創建時間
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  更新時間
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  狀態
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {results.map((result, index) => (
                <tr key={result._id || index} className="hover:bg-gray-50">
                  <td className="px-3 py-4">
                    <div
                      className="flex cursor-pointer items-center justify-center"
                      onClick={() => toggleSelectItem(result._id)}
                    >
                      {selectedItems.has(result._id) ? (
                        <CheckSquare className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {result.book_name || "未命名書籍"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {result.create_time
                      ? new Date(result.create_time).toLocaleString()
                      : "無創建時間"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {result.updated_at
                      ? new Date(result.updated_at).toLocaleString()
                      : "無更新時間"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 text-xs font-semibold leading-5",
                        needsModification(result)
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800",
                      )}
                    >
                      {needsModification(result) ? "需要修正" : "完整資料"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleShowDetail(result)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      查看詳情
                    </button>
                    <button
                      onClick={() => {
                        handleEdit(result);
                      }}
                      className="ml-3 text-green-600 hover:text-green-900"
                    >
                      修改
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showDetail && (
        <DetailModal
          currentResult={currentResult}
          needsModification={needsModification}
          handleCloseDetail={handleCloseDetail}
          handleEdit={handleEdit}
          toggleSection={toggleSection}
          expandedSections={expandedSections}
        />
      )}
      {showEditModal && (
        <EditModal
          editedData={editedData}
          handleCancelEdit={handleCancelEdit}
          handleSaveEdit={handleSaveEdit}
          handleUpdateField={handleUpdateField}
          handleAddToLongText={handleAddToLongText}
          handleDeleteNonAllocatedText={handleDeleteNonAllocatedText}
          hasChanges={hasChanges}
          setEditedData={setEditedData}
          setHasChanges={setHasChanges}
        />
      )}
      {showLongTextModal && <LongTextFieldModal />}
      {showDeleteConfirmModal && <DeleteConfirmModal />}
    </div>
  );
}
