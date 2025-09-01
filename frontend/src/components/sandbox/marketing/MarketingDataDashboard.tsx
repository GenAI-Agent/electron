import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { 
  X, 
  Download, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Plane,
  Target,
  Globe,
  Filter,
  Calendar,
  Search
} from 'lucide-react';

interface MarketingDataTab {
  id: string;
  title: string;
  source: 'user' | 'flight' | 'competitor' | 'market' | 'loyalty' | 'route' | 'social' | 'strategy' | 'action' | 'intelligence';
  filename: string;
  date: string;
  time: string;
  data: any[];
  isActive?: boolean;
  isAnalytics?: boolean;
}

interface MarketingDataDashboardProps {
  dataTab: MarketingDataTab;
  onClose: () => void;
  className?: string;
}

export const MarketingDataDashboard: React.FC<MarketingDataDashboardProps> = ({
  dataTab,
  onClose,
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Filter and sort data
  const filteredData = dataTab.data.filter(item => {
    if (!searchTerm) return true;
    return Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    
    if (sortDirection === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  // Get table headers
  const getHeaders = () => {
    if (dataTab.data.length === 0) return [];
    return Object.keys(dataTab.data[0]);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExport = () => {
    const csvContent = [
      getHeaders().join(','),
      ...sortedData.map(row => 
        getHeaders().map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${dataTab.filename}_export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'user':
        return <Users className="w-4 h-4" />;
      case 'flight':
      case 'route':
        return <Plane className="w-4 h-4" />;
      case 'competitor':
        return <Target className="w-4 h-4" />;
      case 'market':
      case 'intelligence':
        return <Globe className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  const formatValue = (value: any, key: string) => {
    if (value === null || value === undefined) return '-';
    
    // Format numbers
    if (typeof value === 'number') {
      if (key.includes('rate') || key.includes('percentage') || key.includes('share')) {
        return `${value.toFixed(1)}%`;
      }
      if (key.includes('price') || key.includes('revenue') || key.includes('cost')) {
        return `$${value.toLocaleString()}`;
      }
      if (key.includes('distance')) {
        return `${value.toLocaleString()} km`;
      }
      return value.toLocaleString();
    }
    
    // Format dates
    if (key.includes('date') || key.includes('time')) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('zh-TW');
        }
      } catch (e) {
        // If not a valid date, return as string
      }
    }
    
    // Format arrays
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    return String(value);
  };

  return (
    <div className={cn("h-full flex flex-col bg-white", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-gray-50">
        <div className="flex items-center space-x-3">
          {getSourceIcon(dataTab.source)}
          <div>
            <h2 className="text-xl font-bold text-gray-900">{dataTab.title}</h2>
            <p className="text-sm text-gray-600">
              {dataTab.filename} • {dataTab.date} {dataTab.time} • {dataTab.data.length} 筆記錄
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>匯出 CSV</span>
          </button>
          
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜尋資料..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            <span>顯示 {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedData.length)} / {sortedData.length} 筆</span>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            上一頁
          </button>
          
          <span className="text-sm text-gray-600">
            第 {currentPage} / {totalPages} 頁
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            下一頁
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto">
        {paginatedData.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {getHeaders().map((header) => (
                  <th
                    key={header}
                    onClick={() => handleSort(header)}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>{header.replace(/_/g, ' ')}</span>
                      {sortField === header && (
                        <TrendingUp 
                          className={cn(
                            "w-3 h-3 transition-transform",
                            sortDirection === 'desc' ? "rotate-180" : ""
                          )} 
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  {getHeaders().map((header) => (
                    <td key={header} className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {formatValue(row[header], header)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>沒有找到符合條件的資料</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {dataTab.data.length > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{dataTab.data.length}</p>
              <p className="text-sm text-gray-600">總記錄數</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{filteredData.length}</p>
              <p className="text-sm text-gray-600">篩選結果</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{getHeaders().length}</p>
              <p className="text-sm text-gray-600">資料欄位</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{dataTab.source.toUpperCase()}</p>
              <p className="text-sm text-gray-600">資料來源</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingDataDashboard;
