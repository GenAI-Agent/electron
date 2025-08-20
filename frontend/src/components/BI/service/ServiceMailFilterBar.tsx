import React from "react";

interface FilterBarProps {
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
  };
}

const Button = ({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`rounded-md px-2 py-1 text-sm transition-colors ${
      active ? "bg-blue-100 text-blue-800" : "bg-gray-100 hover:bg-gray-200"
    }`}
  >
    {children}
  </button>
);

export const ServiceMailFilterBar: React.FC<FilterBarProps> = ({
  sort,
  filters,
}) => (
  <div className="flex flex-1 flex-col items-start justify-end gap-1">
    <div className="flex w-full items-center justify-end gap-2">
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">時間排序：</span>
        <Button
          active={sort.order === "asc"}
          onClick={() => sort.setOrder("asc")}
        >
          升序
        </Button>
        <Button
          active={sort.order === "desc"}
          onClick={() => sort.setOrder("desc")}
        >
          降序
        </Button>
      </div>
      {/* 
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">星標：</span>
        <select
          className="rounded-md border border-gray-300 px-1.5 py-0.5 text-sm"
          value={filters.star}
          onChange={(e) => filters.setStar(e.target.value)}
        >
          <option value="all">全部</option>
          <option value="star">已標星</option>
          <option value="noStar">未標星</option>
        </select>
      </div>
 */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">日期：</span>
        <input
          type="date"
          className="rounded-md border border-gray-300 px-1.5 py-0.5 text-sm"
          value={filters.startDate}
          onChange={(e) => filters.setStartDate(e.target.value)}
        />
        <span className="text-xs">至</span>
        <input
          type="date"
          className="rounded-md border border-gray-300 px-1.5 py-0.5 text-sm"
          value={filters.endDate}
          onChange={(e) => filters.setEndDate(e.target.value)}
        />
      </div>
    </div>
    <div className="flex w-full items-center justify-end gap-2">
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">單號：</span>
        <input
          type="text"
          className="w-32 rounded-md border border-gray-300 px-1.5 py-0.5 text-sm placeholder:text-xs"
          value={filters.pkNo}
          onChange={(e) => filters.setPkNo(e.target.value)}
          placeholder="搜索單號..."
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">郵箱：</span>
        <input
          type="text"
          className="w-32 rounded-md border border-gray-300 px-1.5 py-0.5 text-sm placeholder:text-xs"
          value={filters.email}
          onChange={(e) => filters.setEmail(e.target.value)}
          placeholder="搜索郵箱..."
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">客戶ID：</span>
        <input
          type="text"
          className="w-32 rounded-md border border-gray-300 px-1.5 py-0.5 text-sm placeholder:text-xs"
          value={filters.custId}
          onChange={(e) => filters.setCustId(e.target.value)}
          placeholder="搜索客戶ID..."
        />
      </div>
    </div>
  </div>
);
