import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Filter, X, Search } from 'lucide-react';

interface DataTableProps {
  headers: string[];
  rows: Record<string, string>[];
  className?: string;
}

interface ColumnFilter {
  column: string;
  value: string;
}

const DataTable: React.FC<DataTableProps> = ({ headers, rows, className = '' }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [filters, setFilters] = useState<ColumnFilter[]>([]);
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(-1);

  // 應用過濾器和全局搜索
  const filteredRows = useMemo(() => {
    let filtered = rows;

    // 應用列過濾器
    filters.forEach(filter => {
      if (filter.value) {
        filtered = filtered.filter(row => 
          (row[filter.column] || '').toLowerCase().includes(filter.value.toLowerCase())
        );
      }
    });

    // 應用全局搜索
    if (globalSearch) {
      filtered = filtered.filter(row =>
        headers.some(header =>
          (row[header] || '').toLowerCase().includes(globalSearch.toLowerCase())
        )
      );
    }

    return filtered;
  }, [rows, filters, globalSearch, headers]);

  // 分頁邏輯
  const totalPages = Math.ceil(filteredRows.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentRows = filteredRows.slice(startIndex, endIndex);

  // 獲取列的唯一值（用於過濾器選項）
  const getColumnUniqueValues = (column: string, filterText: string = '') => {
    const values = rows.map(row => row[column] || '').filter(Boolean);
    const uniqueSet = new Set(values);
    const uniqueValues = Array.from(uniqueSet).sort();

    // 如果有過濾文本，只顯示匹配的選項
    if (filterText) {
      return uniqueValues.filter(value =>
        value.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    return uniqueValues;
  };

  // 添加或更新過濾器
  const updateFilter = (column: string, value: string) => {
    setFilters(prev => {
      const existing = prev.find(f => f.column === column);
      if (existing) {
        if (value === '') {
          return prev.filter(f => f.column !== column);
        }
        return prev.map(f => f.column === column ? { ...f, value } : f);
      }
      return value ? [...prev, { column, value }] : prev;
    });
    setCurrentPage(1); // 重置到第一頁
  };

  // 清除過濾器
  const clearFilter = (column: string) => {
    setFilters(prev => prev.filter(f => f.column !== column));
    setCurrentPage(1);
  };

  // 清除所有過濾器
  const clearAllFilters = () => {
    setFilters([]);
    setGlobalSearch('');
    setCurrentPage(1);
  };

  const getFilterValue = (column: string) => {
    return filters.find(f => f.column === column)?.value || '';
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* 搜索和控制欄 */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="全局搜索..."
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {(filters.length > 0 || globalSearch) && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                清除所有過濾器
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">每頁顯示:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>

        {/* 活動過濾器顯示 */}
        {filters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.map(filter => (
              <div key={filter.column} className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                <span>{filter.column}: {filter.value}</span>
                <button
                  onClick={() => clearFilter(filter.column)}
                  className="ml-2 hover:bg-blue-200 rounded p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 表格容器 */}
      <div className="flex-1 overflow-auto px-4">
        <div className="min-w-full">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {headers.map((header, index) => (
                  <th key={index} className="border border-gray-300 px-4 py-3 text-left font-semibold relative group text-gray-900">
                    <div className="flex items-center justify-between">
                      <span>{header}</span>
                      <div className="flex items-center space-x-1">
                        {getFilterValue(header) && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                        <button
                          onClick={() => {
                            setActiveFilterColumn(activeFilterColumn === header ? null : header);
                            setSelectedOptionIndex(-1);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                        >
                          <Filter className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    
                    {/* 過濾器下拉菜單 */}
                    {activeFilterColumn === header && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 min-w-48">
                        <div className="p-2">
                          <input
                            type="text"
                            placeholder={`過濾 ${header}...`}
                            value={getFilterValue(header)}
                            onChange={(e) => {
                              updateFilter(header, e.target.value);
                              setSelectedOptionIndex(-1);
                            }}
                            onKeyDown={(e) => {
                              const options = getColumnUniqueValues(header, getFilterValue(header)).slice(0, 20);

                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setSelectedOptionIndex(prev =>
                                  prev < options.length - 1 ? prev + 1 : 0
                                );
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setSelectedOptionIndex(prev =>
                                  prev > 0 ? prev - 1 : options.length - 1
                                );
                              } else if (e.key === 'Enter' && selectedOptionIndex >= 0) {
                                e.preventDefault();
                                updateFilter(header, options[selectedOptionIndex]);
                                setActiveFilterColumn(null);
                                setSelectedOptionIndex(-1);
                              } else if (e.key === 'Escape') {
                                setActiveFilterColumn(null);
                                setSelectedOptionIndex(-1);
                              }
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto border-t border-gray-200" style={{ scrollbarWidth: 'thin' }}>
                          {getColumnUniqueValues(header, getFilterValue(header)).slice(0, 20).map((value, idx) => (
                            <button
                              key={idx}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                updateFilter(header, value);
                                setActiveFilterColumn(null);
                                setSelectedOptionIndex(-1);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                                idx === selectedOptionIndex
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentRows.map((row, rowIndex) => (
                <tr key={startIndex + rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {headers.map((header, colIndex) => (
                    <td key={colIndex} className="border border-gray-300 px-4 py-2 text-sm">
                      {row[header] || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分頁控制 */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            顯示 {startIndex + 1} - {Math.min(endIndex, filteredRows.length)} 項，共 {filteredRows.length} 項
            {filteredRows.length !== rows.length && (
              <span className="text-blue-600"> (已過濾，原始數據 {rows.length} 項)</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm border rounded ${
                      currentPage === pageNum
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-foreground border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 點擊外部關閉過濾器 */}
      {activeFilterColumn && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setActiveFilterColumn(null);
            setSelectedOptionIndex(-1);
          }}
        />
      )}
    </div>
  );
};

export default DataTable;
