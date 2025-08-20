/**
 * PageDataExtractorTest - 頁面資料提取器測試組件
 * 用於測試和驗證頁面資料提取功能
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, RefreshCw, Download, Eye } from 'lucide-react';
import { PageData } from '@/types/page-data';
import { extractCurrentPageData, extractPageSummary, refreshInteractiveElements, extractGmailPageDataWithOAuth, isGmailPage } from '@/utils/PageDataExtractor';
import { cn } from '@/utils/cn';

const PageDataExtractorTest: React.FC = () => {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastExtracted, setLastExtracted] = useState<Date | null>(null);

  // 自動提取頁面資料（組件載入時）
  useEffect(() => {
    handleExtractPageData();
  }, []);

  const handleExtractPageData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 開始提取頁面資料...');
      
      // 檢查是否為 Gmail 頁面，如果是則使用 OAuth 方式
      let data;
      if (isGmailPage()) {
        console.log('📧 檢測到 Gmail 頁面，使用 OAuth + API 方式');
        data = await extractGmailPageDataWithOAuth();
      } else {
        console.log('📄 一般頁面，使用 DOM 解析方式');
        data = await extractCurrentPageData();
      }
      
      setPageData(data);
      setLastExtracted(new Date());
      console.log('✅ 頁面資料提取完成:', data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      setError(errorMessage);
      console.error('❌ 頁面資料提取失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshElements = async () => {
    if (!pageData) return;
    
    setLoading(true);
    try {
      console.log('🔄 重新檢測互動元素...');
      const elements = await refreshInteractiveElements();
      setPageData({
        ...pageData,
        interactiveElements: elements
      });
      console.log('✅ 互動元素更新完成');
    } catch (err) {
      console.error('❌ 互動元素更新失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadData = () => {
    if (!pageData) return;
    
    const dataStr = JSON.stringify(pageData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `page-data-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <h1 className="text-3xl font-bold mb-2">
        🔍 頁面資料提取器測試
      </h1>
      
      <p className="text-gray-600 mb-6">
        測試和驗證頁面內容提取、互動元素檢測等功能
      </p>

      {/* 控制按鈕 */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          onClick={handleExtractPageData}
          disabled={loading}
        >
          <RefreshCw className="w-4 h-4" />
          {loading ? '提取中...' : '提取頁面資料'}
        </button>
        
        <button
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          onClick={handleRefreshElements}
          disabled={loading || !pageData}
        >
          <Eye className="w-4 h-4" />
          重新檢測元素
        </button>
        
        <button
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          onClick={handleDownloadData}
          disabled={!pageData}
        >
          <Download className="w-4 h-4" />
          下載資料
        </button>
      </div>

      {/* 錯誤顯示 */}
      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-900 rounded-lg">
          <h3 className="text-lg font-semibold mb-1">❌ 錯誤</h3>
          <p>{error}</p>
        </div>
      )}

      {/* 基本資訊 */}
      {pageData && (
        <div className="bg-white p-6 mb-6 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-4">📊 基本資訊</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
            <div>
              <h3 className="text-sm text-gray-600">頁面標題</h3>
              <p className="text-base">{pageData.title}</p>
            </div>
            <div>
              <h3 className="text-sm text-gray-600">當前 URL</h3>
              <p className="text-sm break-all">
                {pageData.url}
              </p>
            </div>
            <div>
              <h3 className="text-sm text-gray-600">內容長度</h3>
              <p className="text-base">
                {pageData.content.length.toLocaleString()} 字符
              </p>
            </div>
            <div>
              <h3 className="text-sm text-gray-600">互動元素</h3>
              <p className="text-base">
                {pageData.interactiveElements.length} 個
              </p>
            </div>
            <div>
              <h3 className="text-sm text-gray-600">載入狀態</h3>
              <span className={cn(
                "inline-block px-2 py-1 text-xs rounded-full",
                pageData.metadata.loadState === 'complete' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              )}>
                {pageData.metadata.loadState}
              </span>
            </div>
            <div>
              <h3 className="text-sm text-gray-600">提取時間</h3>
              <p className="text-sm">
                {lastExtracted?.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 詳細資料 */}
      {pageData && (
        <div>
          {/* 頁面內容 */}
          <details className="group mb-4">
            <summary className="flex items-center justify-between p-4 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <h3 className="text-lg font-semibold">📄 頁面內容 (Markdown)</h3>
              <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-2">
              <div className="p-4 bg-gray-50 rounded-lg max-h-[400px] overflow-auto">
                <pre className="whitespace-pre-wrap font-mono text-xs">
                  {pageData.content}
                </pre>
              </div>
            </div>
          </details>

          {/* 互動元素 */}
          <details className="group mb-4">
            <summary className="flex items-center justify-between p-4 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <h3 className="text-lg font-semibold">
                🎯 互動元素 ({pageData.interactiveElements.length})
              </h3>
              <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-2">
              <div className="max-h-[400px] overflow-auto">
                {pageData.interactiveElements.map((element, index) => (
                  <div key={element.id} className="p-4 mb-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 text-xs bg-primary-500 text-white rounded">
                        {element.type}
                      </span>
                      <span className={cn(
                        "px-2 py-1 text-xs rounded",
                        element.importance > 0.7 ? "bg-green-100 text-green-700" :
                        element.importance > 0.4 ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      )}>
                        重要性: {(element.importance * 100).toFixed(0)}%
                      </span>
                      {element.isVisible && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                          可見
                        </span>
                      )}
                      {element.isClickable && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                          可點擊
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm mb-1">
                      <strong>文字:</strong> {element.text || '(無文字)'}
                    </p>
                    
                    <p className="text-sm mb-1">
                      <strong>選擇器:</strong> 
                      <code className="bg-gray-200 px-1 py-0.5 ml-1 text-xs">
                        {element.selector}
                      </code>
                    </p>
                    
                    <p className="text-sm mb-1">
                      <strong>位置:</strong> 
                      ({element.position.x}, {element.position.y}) 
                      {element.position.width}×{element.position.height}
                    </p>
                    
                    {element.fallbackSelectors.length > 0 && (
                      <p className="text-sm text-gray-600">
                        <strong>備用選擇器:</strong> {element.fallbackSelectors.length} 個
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </details>

          {/* 元數據 */}
          <details className="group mb-4">
            <summary className="flex items-center justify-between p-4 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <h3 className="text-lg font-semibold">📋 元數據</h3>
              <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-2">
              <div className="p-4 bg-gray-50 rounded-lg">
                <pre className="font-mono text-xs">
                  {JSON.stringify(pageData.metadata, null, 2)}
                </pre>
              </div>
            </div>
          </details>

          {/* 提取錯誤 */}
          {pageData.extractionErrors && pageData.extractionErrors.length > 0 && (
            <details className="group mb-4">
              <summary className="flex items-center justify-between p-4 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <h3 className="text-lg font-semibold text-red-600">
                  ⚠️ 提取錯誤 ({pageData.extractionErrors.length})
                </h3>
                <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-2">
                <div>
                  {pageData.extractionErrors.map((error, index) => (
                    <div key={index} className="p-4 mb-1 bg-red-100 text-red-900 rounded-lg">
                      <p>{error}</p>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

export default PageDataExtractorTest;
