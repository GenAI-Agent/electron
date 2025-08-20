"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ArrowUpDown, Settings } from "lucide-react";
// import { Loading } from "@/components/Loading";
import { PricingReport } from "@/types";
import { cn } from "@/utils/cn";
;

interface PricingTableProps {
  bookResult: PricingReport[];
  isLoading: boolean;
  error: string | null;
  categoryTitle: string;
  searchBar?: boolean;
}

// 店家配置
const SHOP_CONFIG = [
  { key: "eslite_prices", name: "誠品", width: "80px" },
  { key: "shopee_prices", name: "蝦皮", width: "80px" },
  { key: "momo_prices", name: "MOMO", width: "80px" },
  { key: "pchome_prices", name: "PCHome", width: "80px" },
  { key: "rakuten_prices", name: "樂天市場", width: "80px" },
  { key: "books_prices", name: "博客來", width: "80px" },
  { key: "goldstone_prices", name: "金石堂", width: "80px" },
  { key: "star_prices", name: "晨星", width: "80px" },
  { key: "sanmin_prices", name: "三民", width: "80px" },
  { key: "tien_prices", name: "墊腳石", width: "80px" },
  { key: "iread_prices", name: "iRead灰熊", width: "80px" },
];

export default function PricingTable({
  bookResult,
  isLoading = false,
  error = null,
  categoryTitle = "",
  searchBar = true,
}: PricingTableProps) {
  const [pricingData, setPricingData] = useState<PricingReport[]>([]);
  const [filteredData, setFilteredData] = useState<PricingReport[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // 排序相关状态
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // 分頁相關狀態
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // 店家選擇狀態
  const [selectedShops, setSelectedShops] = useState<string[]>([
    "eslite_prices",
    "shopee_prices",
    "momo_prices",
    "books_prices",
  ]);
  const [showShopSelector, setShowShopSelector] = useState(false);

  // 調整後利潤選擇的店家
  const [marginShop, setMarginShop] = useState<string>("books_prices");

  // 当接收到新的bookResult时，更新pricingData
  useEffect(() => {
    if (bookResult && bookResult.length > 0) {
      setPricingData(bookResult);
      setFilteredData(bookResult);

      // 重置分頁到第一頁
      setCurrentPage(1);
      // 重置搜索和排序
      setSearchTerm("");
      setSortField(null);
      setSortDirection("asc");
    }
  }, [bookResult]);

  // 添加搜索处理函数
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1); // 重置为第一页

    if (value.trim() === "") {
      setFilteredData(pricingData);
      return;
    }

    // 根据产品名称或产品ID进行过滤
    const filtered = pricingData.filter(
      (item) =>
        item.prod_title_main.toLowerCase().includes(value.toLowerCase()) ||
        item.org_prod_id.toLowerCase().includes(value.toLowerCase()),
    );

    setFilteredData(filtered);
  };

  // 添加排序处理函数
  const handleSort = (field: string) => {
    // 如果点击的是当前排序字段，则切换排序方向
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // 否则，设置新的排序字段并默认为升序
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // 排序数据的函数
  const sortData = (data: PricingReport[]) => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      let aValue: any = a[sortField as keyof PricingReport];
      let bValue: any = b[sortField as keyof PricingReport];

      // 确保值是数字
      aValue = typeof aValue === "string" ? parseFloat(aValue) : aValue;
      bValue = typeof bValue === "string" ? parseFloat(bValue) : bValue;

      // 处理无效值
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // 根据排序方向返回结果
      if (sortDirection === "asc") {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  };

  // 在useEffect中添加对搜索和排序的监听
  useEffect(() => {
    if (pricingData.length > 0) {
      let processed = [...pricingData];

      // 先应用搜索过滤
      if (searchTerm.trim() !== "") {
        processed = processed.filter(
          (item) =>
            item.prod_title_main
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            item.org_prod_id.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      }

      // 再应用排序
      if (sortField) {
        processed = sortData(processed);
      }

      setFilteredData(processed);
    }
  }, [pricingData, searchTerm, sortField, sortDirection]);

  // 修改分頁邏輯，使用过滤后的数据
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // 頁面變更處理函數
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  // 格式化價格為貨幣形式
  const formatPrice = (price: number | string | null) => {
    if (price === null || price === undefined) return " - ";
    // 確保價格是數字類型
    const numPrice = typeof price === "string" ? parseInt(price) : price;
    // 檢查是否為有效數字
    if (isNaN(numPrice)) return " - ";
    return `${numPrice.toFixed(0)}`;
  };

  // 獲取數組中的最低價格 - 更新以處理新的 JSON 格式
  const getLowestPrice = (prices: { price: number; url: string }[] | null) => {
    if (!prices || prices.length === 0) return null;

    // 過濾出有效價格並找出最小值
    const validPrices = prices
      .map((item) => item.price)
      .filter(
        (price) => typeof price === "number" && !isNaN(price) && price > 0,
      );

    if (validPrices.length === 0) return { price: 0, url: "" };
    return {
      price: Math.min(...validPrices),
      url: prices.find((item) => item.price === Math.min(...validPrices))?.url,
    };
  };

  // 安全地將值轉換為數字並格式化為百分比
  const formatPercentage = (value: number | string | null) => {
    if (value === null || value === undefined) return "";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "無效數據";
    return `${numValue.toFixed(0)}%`;
  };

  // 計算調整後利潤
  const calculateMargin = (item: PricingReport, shopKey: string) => {
    const shopPrices = item[shopKey as keyof PricingReport] as {
      price: number;
      url: string;
    }[];
    const lowestPrice = getLowestPrice(shopPrices);

    if (!lowestPrice?.price || !item.cost || !item.sale_price) return 0;

    return ((lowestPrice.price - item.cost) / item.sale_price) * 100;
  };

  // 店家選擇處理
  const handleShopToggle = (shopKey: string) => {
    setSelectedShops((prev) =>
      prev.includes(shopKey)
        ? prev.filter((s) => s !== shopKey)
        : [...prev, shopKey],
    );
  };

  // 點擊外部關閉店家選擇面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".shop-selector")) {
        setShowShopSelector(false);
      }
    };

    if (showShopSelector) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showShopSelector]);

  // 添加排序指示器组件
  const SortIndicator = ({ field }: { field: string }) => {
    if (sortField !== field)
      return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-500" />;
    return sortDirection === "asc" ? (
      <ArrowUpDown className="ml-1 h-4 w-4 text-blue-500" />
    ) : (
      <ArrowUpDown className="ml-1 h-4 w-4 rotate-180 text-blue-500" />
    );
  };

  return (
    <div className="flex w-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        {categoryTitle && (
          <h2 className="text-xl font-bold">{categoryTitle} - 價格比較報表</h2>
        )}
        <div className="flex items-center space-x-4">
          {searchBar && (
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="搜尋產品名稱或ID..."
                className="w-64 rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          )}

          {/* 店家選擇按鈕 */}
          <div className="shop-selector relative">
            <button
              onClick={() => setShowShopSelector(!showShopSelector)}
              className="flex items-center space-x-2 rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
            >
              <Settings className="h-4 w-4" />
              <span>選擇店家</span>
              {selectedShops.length > 0 && (
                <span className="ml-1 rounded-full bg-blue-500 px-2 py-0.5 text-sm text-white">
                  {selectedShops.length}
                </span>
              )}
            </button>

            {showShopSelector && (
              <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-md border border-gray-200 bg-white p-4 shadow-lg">
                <h3 className="mb-3">選擇要顯示的店家</h3>
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {SHOP_CONFIG.map((shop) => (
                    <label
                      key={shop.key}
                      className="flex cursor-pointer items-center space-x-2 rounded p-1 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedShops.includes(shop.key)}
                        onChange={() => handleShopToggle(shop.key)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{shop.name}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() =>
                      setSelectedShops(SHOP_CONFIG.map((s) => s.key))
                    }
                    className="flex-1 rounded-md bg-gray-500 py-2 text-sm text-white hover:bg-gray-600"
                  >
                    全選
                  </button>
                  <button
                    onClick={() => setSelectedShops([])}
                    className="flex-1 rounded-md bg-red-500 py-2 text-sm text-white hover:bg-red-600"
                  >
                    清空
                  </button>
                </div>
                <button
                  onClick={() => setShowShopSelector(false)}
                  className="mt-2 w-full rounded-md bg-blue-500 py-2 text-sm text-white hover:bg-blue-600"
                >
                  確定
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-lg border border-gray-100 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12">
            {/* <Loading /> */}
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 p-4 text-red-700">{error}</div>
        ) : (
          <table
            className="w-full table-fixed"
            style={{ minWidth: `${1200 + selectedShops.length * 80}px` }}
          >
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="w-64 px-2 py-1">產品名稱</th>
                <th className="w-32 px-2 py-1">產品ID</th>
                <th className="w-20 px-2 py-1">商品進折</th>
                <th className="w-32 px-2 py-1">供應商</th>
                <th className="w-32 px-2 py-1">出版社</th>
                <th className="w-32 px-2 py-1">PM姓名</th>
                <th
                  className="w-20 cursor-pointer px-2 py-1"
                  onClick={() => handleSort("list_price")}
                >
                  <div className="flex items-center justify-center gap-1">
                    定價
                    {sortField === "list_price" ? (
                      <SortIndicator field="list_price" />
                    ) : null}
                  </div>
                </th>
                <th className="w-20 px-2 py-1">售價折扣</th>
                <th
                  className="w-20 cursor-pointer px-2 py-1"
                  onClick={() => handleSort("cost")}
                >
                  <div className="flex items-center justify-center gap-1">
                    成本
                    {sortField === "cost" || !sortField ? (
                      <SortIndicator field="cost" />
                    ) : null}
                  </div>
                </th>
                <th
                  className="w-32 cursor-pointer px-2 py-1 text-sm"
                  onClick={() => handleSort("sale_price")}
                >
                  <div className="flex items-center justify-center gap-1">
                    讀冊售價
                    {sortField === "sale_price" ? (
                      <SortIndicator field="sale_price" />
                    ) : null}
                  </div>
                </th>

                {/* 動態渲染選中的店家欄位 */}
                {selectedShops.map((shopKey) => {
                  const shop = SHOP_CONFIG.find((s) => s.key === shopKey);
                  return (
                    <th key={shopKey} className="w-20 px-2 py-1 text-sm">
                      {shop?.name}
                    </th>
                  );
                })}

                <th className="w-24 px-2 py-1 text-sm">市場最低價</th>
                <th className="w-24 px-2 py-1">
                  現有利潤
                  {sortField === "org_margin" ? (
                    <SortIndicator field="org_margin" />
                  ) : null}
                </th>
                <th className="w-32 px-2 py-1">
                  <div className="flex flex-col space-y-1">
                    <span>調整後利潤</span>
                    <select
                      value={marginShop}
                      onChange={(e) => setMarginShop(e.target.value)}
                      className="rounded border px-1 py-0.5 text-sm"
                    >
                      {SHOP_CONFIG.map((shop) => (
                        <option key={shop.key} value={shop.key}>
                          {shop.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </th>
                <th className="w-24 px-2 py-1">更新時間</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentItems.length > 0 ? (
                currentItems.map((item: PricingReport, index: number) => (
                  <tr
                    key={index}
                    className="transition-colors hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/book/${item.org_prod_id}`}
                        target="_blank"
                        className="line-clamp-3 cursor-pointer text-primary hover:text-primary/80 hover:underline"
                      >
                        {item.prod_title_main}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.org_prod_id}
                    </td>
                    <td className="px-4 py-3 text-center text-blue-600">
                      {formatPercentage(item.pur_disc)}
                    </td>
                    <td className="w-64 px-4 py-3 text-center text-gray-600">
                      {item.supplier_nm || "-"}
                    </td>
                    <td
                      className="px-4 py-3 text-center text-gray-600"
                      style={{ width: "100px" }}
                    >
                      {item.publisher_nm || "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {item.pm_name || "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {formatPrice(item.list_price)}
                    </td>
                    <td className="px-4 py-3 text-center text-blue-600">
                      {formatPercentage(item.sale_disc)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900">
                      {formatPrice(item.cost)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <a
                        href={`https://www.taaze.tw/products/${item.org_prod_id}.html`}
                        target="_blank"
                        className={cn(
                          "text-indigo-600 hover:text-indigo-800 hover:underline",
                          item.sale_price >
                            (getLowestPrice(item.books_prices)?.price || 0) &&
                            item.books_prices.length > 0
                            ? "text-red-600"
                            : "text-indigo-600 hover:text-indigo-800 hover:underline",
                        )}
                      >
                        {formatPrice(item.sale_price)}
                      </a>
                    </td>

                    {/* 動態渲染選中的店家價格 */}
                    {selectedShops.map((shopKey) => {
                      const prices = item[shopKey as keyof PricingReport] as {
                        price: number;
                        url: string;
                      }[];
                      return (
                        <td
                          key={shopKey}
                          className="w-32 px-4 py-3 text-center"
                        >
                          <a
                            href={getLowestPrice(prices)?.url || ""}
                            target="_blank"
                            className={cn(
                              getLowestPrice(prices)?.url
                                ? "cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                                : "text-gray-500",
                            )}
                          >
                            {formatPrice(getLowestPrice(prices)?.price || null)}
                          </a>
                        </td>
                      );
                    })}

                    <td className="w-32 px-4 py-3 text-center text-red-600">
                      {formatPrice(item.market_min_price)}
                    </td>
                    <td className="w-32 px-4 py-3 text-center">
                      <span
                        className={`${item.org_margin < 0 ? "text-red-600" : "text-gray-500"}`}
                      >
                        {formatPercentage(item.org_margin)}
                      </span>
                    </td>
                    <td className="w-32 px-4 py-3 text-center">
                      <span
                        className={`${calculateMargin(item, marginShop) < 0 ? "text-red-600" : "text-gray-500"}`}
                      >
                        {formatPercentage(calculateMargin(item, marginShop))}
                      </span>
                    </td>
                    <td className="w-32 px-4 py-3 text-center text-gray-600">
                      {new Date(item.created_at).toLocaleString("zh-TW", {
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={10 + selectedShops.length}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    暫無數據
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 分頁控制 - 移出滾動容器 */}
      {filteredData.length > 0 && !isLoading && !error && (
        <div className="mt-4 flex items-center justify-center space-x-3 rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-4">
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className="flex items-center justify-center rounded-md border border-gray-300 px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            上一頁
          </button>

          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                // 顯示當前頁和相鄰的2頁, 以及首頁和末頁
                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 2
                );
              })
              .map((page, index, array) => {
                // 如有跳躍的頁數，添加省略號
                const showEllipsis = index > 0 && array[index - 1] !== page - 1;

                return (
                  <div key={page} className="flex items-center">
                    {showEllipsis && (
                      <span className="px-1 text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => paginate(page)}
                      className={`flex h-8 w-8 items-center justify-center rounded-md ${currentPage === page
                        ? "bg-primary text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                      {page}
                    </button>
                  </div>
                );
              })}
          </div>

          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="flex items-center justify-center rounded-md border border-gray-300 px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            下一頁
          </button>

          <span className="ml-2 text-sm text-gray-500">
            第 {currentPage} 頁，共 {totalPages} 頁
          </span>
        </div>
      )}
    </div>
  );
}
