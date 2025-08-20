import React from "react";
import type { ServiceMail } from "@/types/service";
import { ServiceMailFilterBar } from "./ServiceMailFilterBar";
import { ServiceMailCard } from "./ServiceMailCard";
// import { Loading } from "@/components/ui/loading";

type FilterType = "all" | "pending" | "needManual" | "needReview" | "reviewed";

interface SortAndFilterProps {
  sort: {
    order: string;
    setOrder: (v: string) => void;
  };
  filters: {
    closed: string;
    star: string;
    startDate: string;
    endDate: string;
    email: string;
    custId: string;
    pkNo: string;
    setClosed: (v: string) => void;
    setStar: (v: string) => void;
    setStartDate: (v: string) => void;
    setEndDate: (v: string) => void;
    setEmail: (v: string) => void;
    setCustId: (v: string) => void;
    setPkNo: (v: string) => void;
    resetFilters: () => void;
    setTodayFilter: () => void;
  };
}

interface ServiceMailListProps {
  lastUpdateTime: string;
  mails: ServiceMail[];
  isLoading: boolean;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  totalPages: number;
  onMailClick: (mail: ServiceMail) => void;
  sortAndFilter: SortAndFilterProps;
  getMailStatus: (mail: ServiceMail) => string;
  currentFilter: FilterType;
  setCurrentFilter: (filter: FilterType) => void;
  getFilteredMails: (filter?: FilterType) => ServiceMail[];
}

const Button = ({
  children,
  onClick,
  className,
  active,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  active?: boolean;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`rounded-md px-3 py-2 transition-colors ${active ? "bg-blue-100 text-blue-800" : "bg-gray-100 hover:bg-gray-200"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className || ""}`}
  >
    {children}
  </button>
);

const FilterButton = ({
  children,
  onClick,
  className,
  active,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  active?: boolean;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`rounded-md px-3 py-2 transition-colors ${active
      ? "bg-gray-800 text-white"
      : "border border-gray-200 bg-white hover:bg-gray-100"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className || ""}`}
  >
    {children}
  </button>
);

export const ServiceMailList: React.FC<ServiceMailListProps> = ({
  lastUpdateTime,
  mails,
  isLoading,
  currentPage,
  setCurrentPage,
  totalPages,
  onMailClick,
  sortAndFilter,
  getMailStatus,
  currentFilter,
  setCurrentFilter,
  getFilteredMails,
}) => (
  <div className="flex-1">
    <div className="mb-4 flex flex-col items-start gap-2">
      <div className="flex w-full items-center justify-between">
        <div className="flex gap-2">
          <Button
            active={currentFilter === "needReview"}
            onClick={() => setCurrentFilter("needReview")}
          >
            AI 已回覆，待人工審核
            <span className="ml-2 text-sm text-gray-500">
              ({getFilteredMails("needReview")?.length})
            </span>
          </Button>
          <Button
            active={currentFilter === "needManual"}
            onClick={() => setCurrentFilter("needManual")}
          >
            需人工回覆
            <span className="ml-2 text-sm text-gray-500">
              ({getFilteredMails("needManual")?.length})
            </span>
          </Button>
          <Button
            active={currentFilter === "reviewed"}
            onClick={() => setCurrentFilter("reviewed")}
          >
            已審核
            <span className="ml-2 text-sm text-gray-500">
              ({getFilteredMails("reviewed")?.length})
            </span>
          </Button>
        </div>
        {/* 顯示每三小時更新一次，並使用最後一筆資料的時間，當作上次更新時間 */}
        <div className="flex flex-col items-end text-left text-xs text-gray-500">
          <div>每三小時更新一次</div>
          <div>最後更新時間: {new Date(lastUpdateTime).toLocaleString()}</div>
        </div>
      </div>

      <div className="flex w-full items-center justify-between">
        <div className="flex gap-2">
          <FilterButton
            onClick={() => {
              sortAndFilter.filters.resetFilters();
            }}
          >
            查看全部
          </FilterButton>
          <FilterButton
            onClick={() => {
              sortAndFilter.filters.setTodayFilter();
            }}
          >
            今日信件
          </FilterButton>
        </div>
        <ServiceMailFilterBar
          sort={sortAndFilter.sort}
          filters={sortAndFilter.filters}
        />
      </div>
    </div>

    {isLoading ? (
      <div className="flex h-64 items-center justify-center">
        {/* <Loading className="h-10 w-10 animate-spin" /> */}
        <div>Loading...</div>
      </div>
    ) : mails.length === 0 ? (
      <div className="flex h-64 items-center justify-center">
        <p>沒有找到匹配的郵件</p>
      </div>
    ) : (
      <>
        <div className="space-y-2">
          {mails.map((mail: ServiceMail) => (
            <ServiceMailCard
              key={mail.pk_no}
              mail={mail}
              status={getMailStatus(mail)}
              onClick={() => onMailClick(mail)}
            />
          ))}
        </div>

        {/* 分页控制 */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            <Button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              上一頁
            </Button>
            <span className="flex items-center px-4">
              第 {currentPage} 頁，共 {totalPages} 頁
            </span>
            <Button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
            >
              下一頁
            </Button>
          </div>
        )}
      </>
    )}
  </div>
);
