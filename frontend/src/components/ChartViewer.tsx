import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ChartInfo {
  filename: string;
  filepath: string;
  size: number;
  created: number;
  chart_type?: string;
  title?: string;
}

interface ChartViewerProps {
  sessionId?: string;
  onRefresh?: () => void;
}

const ChartViewer: React.FC<ChartViewerProps> = ({ 
  sessionId = "default", 
  onRefresh 
}) => {
  const [charts, setCharts] = useState<ChartInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChart, setSelectedChart] = useState<ChartInfo | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // 載入圖表列表
  const loadCharts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/agent/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `使用 list_session_plots_tool 列出會話 ${sessionId} 的所有圖表`,
          session_id: sessionId,
          request_type: 'local_file'
        }),
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        if (reader) {
          let result = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'content' && data.content) {
                    result = data.content;
                  }
                } catch (e) {
                  // 忽略解析錯誤
                }
              }
            }
          }
          
          // 解析結果
          try {
            const plotsData = JSON.parse(result);
            if (plotsData.success && plotsData.plots) {
              setCharts(plotsData.plots);
            }
          } catch (e) {
            console.error('解析圖表數據失敗:', e);
          }
        }
      }
    } catch (error) {
      console.error('載入圖表失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCharts();
  }, [sessionId]);

  const handleRefresh = () => {
    loadCharts();
    onRefresh?.();
  };

  const handleDownload = async (chart: ChartInfo) => {
    try {
      // 使用 Electron API 讀取文件
      if (typeof window !== 'undefined' && window.electronAPI?.readFile) {
        const result = await window.electronAPI.readFile(chart.filepath);
        if (result.type === 'binary') {
          // 創建下載鏈接
          const blob = new Blob([new Uint8Array(result.content)], { type: 'image/png' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = chart.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      console.error('下載圖表失敗:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-TW');
  };

  const getChartTypeColor = (filename: string) => {
    if (filename.includes('line_chart')) return '#2196F3';
    if (filename.includes('bar_chart')) return '#4CAF50';
    if (filename.includes('scatter_plot')) return '#FF9800';
    if (filename.includes('pie_chart')) return '#9C27B0';
    return '#757575';
  };

  const getChartTypeName = (filename: string) => {
    if (filename.includes('line_chart')) return '線圖';
    if (filename.includes('bar_chart')) return '柱狀圖';
    if (filename.includes('scatter_plot')) return '散點圖';
    if (filename.includes('pie_chart')) return '圓餅圖';
    return '圖表';
  };

  if (loading) {
    return (
      <div className="p-2 text-center">
        <p>載入圖表中...</p>
      </div>
    );
  }

  if (charts.length === 0) {
    return (
      <div className="p-2 text-center">
        <p className="text-gray-500">
          尚未創建任何圖表
        </p>
        <button
          onClick={handleRefresh}
          className="mt-2 p-2 rounded hover:bg-gray-100 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="p-2">
      {/* 標題和刷新按鈕 */}
      <div className="flex justify-between items-center mb-2">
        <h6 className="text-lg font-semibold">
          圖表庫 ({charts.length})
        </h6>
        <button
          onClick={handleRefresh}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 圖表網格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {charts.map((chart, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-slate-200 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            onClick={() => setSelectedChart(chart)}
          >
            <div className="p-4">
              {/* 圖表類型標籤 */}
              <div className="mb-2">
                <span
                  className="inline-block px-2 py-1 text-xs text-white rounded-full"
                  style={{ backgroundColor: getChartTypeColor(chart.filename) }}
                >
                  {getChartTypeName(chart.filename)}
                </span>
              </div>

              {/* 文件名 */}
              <h3
                className="font-semibold text-sm mb-2 truncate"
                title={chart.filename}
              >
                {chart.filename}
              </h3>

              {/* 文件信息 */}
              <p className="text-xs text-gray-500">
                大小: {formatFileSize(chart.size)}
              </p>
              <p className="text-xs text-gray-500">
                創建: {formatDate(chart.created)}
              </p>

              {/* 操作按鈕 */}
              <div className="mt-2 flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(chart);
                  }}
                  title="下載"
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 圖表預覽對話框 */}
      {selectedChart && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999] p-2"
          onClick={() => setSelectedChart(null)}
        >
          <div
            className="bg-white rounded-lg p-4 max-w-[90vw] max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 預覽標題 */}
            <div className="flex justify-between items-center mb-4">
              <h6 className="text-lg font-semibold">
                {selectedChart.filename}
              </h6>
              <div className="flex gap-1">
                <button
                  onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                  className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))}
                  className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDownload(selectedChart)}
                  className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 圖片顯示 */}
            <div className="text-center">
              <img
                src={`file://${selectedChart.filepath}`}
                alt={selectedChart.filename}
                className="max-w-full transition-transform duration-200 ease-in-out"
                style={{
                  maxHeight: '70vh',
                  transform: `scale(${zoomLevel})`
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartViewer;
