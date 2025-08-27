import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { RefreshCw, Calendar, Database, MessageSquare, FileText, Plus, Minus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AgentPanel from '@/components/AgentPanel';
import Header from '@/components/ui/header';

import { cn } from '@/utils/cn';
import { sessionManager } from '@/utils/sessionManager';

type DataSource = 'thread' | 'ptt' | 'petition';
type ViewMode = 'left-only' | 'both';

interface DataFile {
  filename: string;
  date: string;
  time: string;
  fullPath: string;
}

interface SelectedDataset {
  id: string;
  source: DataSource;
  filename: string;
  date: string;
  time: string;
  data: any[];
}

export default function SandboxPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [leftWidth, setLeftWidth] = useState(70);
  const [isDragging, setIsDragging] = useState(false);

  const [selectedSource, setSelectedSource] = useState<DataSource>('thread');
  const [availableFiles, setAvailableFiles] = useState<DataFile[]>([]);
  const [selectedDatasets, setSelectedDatasets] = useState<SelectedDataset[]>([]);
  const [activeDatasetIndex, setActiveDatasetIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dataStats, setDataStats] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expandedDatasets, setExpandedDatasets] = useState<Set<number>>(new Set());
  const [collapsedDatasets, setCollapsedDatasets] = useState<Set<string>>(new Set());

  // 資料來源配置
  const dataSources = [
    {
      id: 'thread' as DataSource,
      name: 'Thread',
      icon: MessageSquare,
      description: '社群討論串資料',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'ptt' as DataSource,
      name: 'PTT',
      icon: Database,
      description: 'PTT論壇資料',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      id: 'petition' as DataSource,
      name: '陳情系統',
      icon: FileText,
      description: '政府陳情案件資料',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  // 載入可用檔案列表
  const loadAvailableFiles = async (source: DataSource) => {
    try {
      setIsLoading(true);
      console.log(`正在載入 ${source} 的檔案列表...`);

      const [filesResponse, statsResponse] = await Promise.all([
        fetch(`http://localhost:8021/api/sandbox/files?source=${source}`),
        fetch(`http://localhost:8021/api/sandbox/stats?source=${source}`)
      ]);

      console.log(`檔案API回應狀態: ${filesResponse.status}`);
      console.log(`統計API回應狀態: ${statsResponse.status}`);

      if (filesResponse.ok) {
        const files = await filesResponse.json();
        console.log('載入的檔案:', files);
        setAvailableFiles(files);
      } else {
        console.error('檔案API錯誤:', await filesResponse.text());
        // 如果API失敗，使用模擬資料
        const mockFiles = [
          {
            filename: `${source}_2025-08-27_04-36-02.csv`,
            date: '2025-08-27',
            time: '04:36:02',
            fullPath: `/data/${source}/${source}_2025-08-27_04-36-02.csv`
          },
          {
            filename: `${source}_2025-08-26_15-20-15.csv`,
            date: '2025-08-26',
            time: '15:20:15',
            fullPath: `/data/${source}/${source}_2025-08-26_15-20-15.csv`
          }
        ];
        console.log('使用模擬檔案資料:', mockFiles);
        setAvailableFiles(mockFiles);
      }

      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        console.log('載入的統計:', stats);
        setDataStats(stats);
      } else {
        console.error('統計API錯誤:', await statsResponse.text());
        // 使用模擬統計資料
        setDataStats({
          total_files: 2,
          total_records: 100,
          latest_update: '2025-08-27 04:36:02'
        });
      }
    } catch (error) {
      console.error('載入檔案列表失敗:', error);
      // 網路錯誤時使用模擬資料
      const mockFiles = [
        {
          filename: `${source}_2025-08-27_04-36-02.csv`,
          date: '2025-08-27',
          time: '04:36:02',
          fullPath: `/data/${source}/${source}_2025-08-27_04-36-02.csv`
        }
      ];
      setAvailableFiles(mockFiles);
      setDataStats({
        total_files: 1,
        total_records: 50,
        latest_update: '2025-08-27 04:36:02'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 載入檔案資料
  const loadFileData = async (filename: string) => {
    try {
      console.log(`正在載入檔案資料: ${filename}`);
      const response = await fetch(`http://localhost:8021/api/sandbox/data?filename=${filename}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`載入的資料筆數: ${data.length}`);
        return data;
      } else {
        console.error('資料API錯誤:', await response.text());
      }
    } catch (error) {
      console.error('載入檔案資料失敗:', error);
    }

    // 如果API失敗，返回模擬資料
    const mockData = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      title: `模擬標題 ${i + 1}`,
      content: `這是第 ${i + 1} 筆模擬資料內容，用於測試界面顯示效果。`,
      author: `用戶${i + 1}`,
      timestamp: `2025-08-27 ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      category: ['政治', '經濟', '社會', '科技'][Math.floor(Math.random() * 4)],
      score: Math.floor(Math.random() * 100)
    }));

    console.log('使用模擬資料:', mockData.length, '筆');
    return mockData;
  };

  // 更新Session上下文，支援多個資料集
  const updateSessionContext = (datasets: SelectedDataset[]) => {
    if (datasets.length === 0) return;

    if (datasets.length === 1) {
      const dataset = datasets[0];
      sessionManager.setFileContext({
        filePath: `sandbox/${dataset.filename}`,
        fileName: `${dataset.source}_${dataset.date}_${dataset.time}`,
        fileType: 'csv',
        content: dataset.data
      });
    } else {
      // 多檔案情況：保存每個檔案的詳細資訊
      const filesData = datasets.map(dataset => ({
        source: dataset.source,
        date: dataset.date,
        time: dataset.time,
        filename: dataset.filename,
        data: dataset.data
      }));

      sessionManager.setMultiFileContext({
        files: filesData,
        totalFiles: datasets.length
      });
    }
  };

  // 添加資料集到分析列表
  const addDataset = async (source: DataSource, file: DataFile) => {
    const data = await loadFileData(file.filename);
    const dataset: SelectedDataset = {
      id: `${source}_${file.filename}`,
      source,
      filename: file.filename,
      date: file.date,
      time: file.time,
      data
    };

    setSelectedDatasets(prev => {
      const existing = prev.find(d => d.id === dataset.id);
      if (existing) return prev;
      const newDatasets = [...prev, dataset];
      updateSessionContext(newDatasets);
      return newDatasets;
    });
  };

  // 移除資料集
  const removeDataset = (id: string) => {
    setSelectedDatasets(prev => {
      const removedIndex = prev.findIndex(d => d.id === id);
      const newDatasets = prev.filter(d => d.id !== id);

      // 調整activeDatasetIndex
      if (removedIndex <= activeDatasetIndex && activeDatasetIndex > 0) {
        setActiveDatasetIndex(activeDatasetIndex - 1);
      } else if (newDatasets.length === 0) {
        setActiveDatasetIndex(0);
      } else if (activeDatasetIndex >= newDatasets.length) {
        setActiveDatasetIndex(newDatasets.length - 1);
      }

      updateSessionContext(newDatasets);
      return newDatasets;
    });
  };

  // 刷新資料
  const refreshData = async () => {
    if (selectedSource === 'petition') {
      alert('陳情系統資料為靜態資料，無需刷新');
      return;
    }

    try {
      setIsRefreshing(true);
      console.log(`正在刷新 ${selectedSource} 資料...`);

      const response = await fetch(`http://localhost:8021/api/sandbox/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source: selectedSource }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('刷新成功:', result);
        alert(`資料刷新成功！新檔案：${result.filename}`);
        await loadAvailableFiles(selectedSource);
      } else {
        console.error('刷新API錯誤:', await response.text());
        // 即使API失敗，也重新載入檔案列表（可能會使用模擬資料）
        await loadAvailableFiles(selectedSource);
        alert('資料刷新完成（使用模擬資料）');
      }
    } catch (error) {
      console.error('刷新資料失敗:', error);
      // 網路錯誤時也重新載入檔案列表
      await loadAvailableFiles(selectedSource);
      alert('資料刷新完成（使用模擬資料）');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAvailableFiles(selectedSource);
  }, [selectedSource]);

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [dropdownOpen]);

  const getTimeOptions = () => {
    return availableFiles.map((file, index) => ({
      value: file.filename,
      label: index === 0 ? `最新 (${file.date} ${file.time})` : `${file.date} ${file.time}`,
      file
    }));
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background relative overflow-hidden">
      <Header
        title="AI選情沙盒"
        showUrlInput={false}
        showNavigation={false}
        showViewToggle={true}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div
        className="flex-1 grid relative overflow-hidden min-h-0"
        style={{
          gridTemplateColumns: viewMode === 'both' ? `${leftWidth}% 8px ${100 - leftWidth}%` : '1fr',
          gridTemplateRows: '1fr',
        }}
      >
        {(viewMode === 'left-only' || viewMode === 'both') && (
          <div
            className="h-full relative overflow-hidden min-h-0 flex flex-col"
            style={{ gridColumn: viewMode === 'both' ? 1 : '1 / -1' }}
          >
            <div className="p-4 border-b border-border">
              <div className="grid grid-cols-3 gap-2 mb-4">
                {dataSources.map((source) => (
                  <Card
                    key={source.id}
                    onClick={() => setSelectedSource(source.id)}
                    className={cn(
                      "p-3 cursor-pointer transition-all duration-200 hover:shadow-md",
                      selectedSource === source.id
                        ? "border-2 border-blue-500 bg-blue-50"
                        : "border border-gray-200 hover:border-blue-300"
                    )}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <source.icon className={cn("w-5 h-5", source.color)} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{source.name}</div>
                        <div className="text-xs text-gray-500">{source.description}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex items-center gap-2 mb-2">
                {dataStats && (
                  <div className="text-xs text-gray-600 flex-1">
                    <span>檔案: {dataStats.total_files} | 資料: {dataStats.total_records} | 更新: {dataStats.latest_update || '無'}</span>
                  </div>
                )}
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative dropdown-container">
                      <button
                        className="flex h-9 w-40 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        disabled={isLoading}
                      >
                        <span className={availableFiles.length === 0 ? "text-muted-foreground" : ""}>
                          {isLoading ? "載入中..." : availableFiles.length > 0 ? "選擇檔案" : "無可用檔案"}
                        </span>
                        <Calendar className="h-4 w-4 opacity-50" />
                      </button>

                      {dropdownOpen && availableFiles.length > 0 && (
                        <div className="absolute top-full left-0 w-60 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-background shadow-lg">
                          {getTimeOptions().map((option) => (
                            <button
                              key={option.value}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground text-left"
                              onClick={() => {
                                console.log('選擇檔案:', option.value);
                                const file = availableFiles.find(f => f.filename === option.value);
                                if (file) {
                                  console.log('找到檔案:', file);
                                  addDataset(selectedSource, file);
                                  setDropdownOpen(false);
                                } else {
                                  console.error('找不到檔案:', option.value, '可用檔案:', availableFiles);
                                }
                              }}
                            >
                              <Calendar className="w-4 h-4" />
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedSource !== 'petition' && (
                      <Button
                        size="sm"
                        onClick={refreshData}
                        disabled={isRefreshing}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                        刷新
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {selectedDatasets.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">請選擇時間來添加資料集</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="px-4 py-2 border-b border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">資料集 ({selectedDatasets.length})</span>
                    </div>
                    <div className="space-y-2">
                      {selectedDatasets.map((dataset, index) => (
                        <div
                          key={dataset.id}
                          className="flex items-center justify-between w-full p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            const newCollapsed = new Set(collapsedDatasets);
                            if (collapsedDatasets.has(dataset.id)) {
                              newCollapsed.delete(dataset.id);
                            } else {
                              newCollapsed.add(dataset.id);
                            }
                            setCollapsedDatasets(newCollapsed);
                          }}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {React.createElement(dataSources.find(s => s.id === dataset.source)!.icon, {
                              className: cn("w-4 h-4", dataSources.find(s => s.id === dataset.source)!.color)
                            })}
                            <div className="text-left">
                              <div className="text-sm font-medium text-gray-900">
                                {dataSources.find(s => s.id === dataset.source)?.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {dataset.date} {dataset.time} ({dataset.data.length} 筆)
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">
                              {collapsedDatasets.has(dataset.id) ? '▶' : '▼'}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeDataset(dataset.id);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedDatasets.map((dataset, index) =>
                    !collapsedDatasets.has(dataset.id) && (
                      <div key={dataset.id} className="flex-1 overflow-hidden p-2 m-0">
                        <div className="h-96 overflow-y-auto space-y-2 border rounded-md p-2">
                          {dataset.data.slice(0, 50).map((item, itemIndex) => {
                            const isExpanded = expandedDatasets.has(itemIndex);
                            return (
                              <Card key={itemIndex} className="p-3 hover:bg-gray-50">
                                <div className="text-sm">
                                  {typeof item === 'object' ? (
                                    <div className="space-y-1">
                                      {Object.entries(item).slice(0, isExpanded ? undefined : 3).map(([key, value]) => (
                                        <div key={key} className="flex">
                                          <span className="text-gray-600 w-20 text-xs shrink-0">{key}:</span>
                                          <span className={cn(
                                            "text-gray-900 text-xs flex-1",
                                            !isExpanded && "truncate"
                                          )}>
                                            {String(value)}
                                          </span>
                                        </div>
                                      ))}
                                      {Object.entries(item).length > 3 && (
                                        <button
                                          className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                                          onClick={() => {
                                            const newExpanded = new Set(expandedDatasets);
                                            if (isExpanded) {
                                              newExpanded.delete(itemIndex);
                                            } else {
                                              newExpanded.add(itemIndex);
                                            }
                                            setExpandedDatasets(newExpanded);
                                          }}
                                        >
                                          {isExpanded
                                            ? "收合"
                                            : `展開 (還有 ${Object.entries(item).length - 3} 個欄位)`
                                          }
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-900">{String(item)}</span>
                                  )}
                                </div>
                              </Card>
                            );
                          })}
                          {dataset.data.length > 50 && (
                            <div className="text-center text-xs text-gray-500 py-2">
                              顯示前 50 筆，共 {dataset.data.length} 筆資料
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'both' && (
          <div
            className={cn(
              "drag-handle drag-handle-horizontal",
              "h-full cursor-col-resize bg-transparent hover:bg-accent",
              "z-[2000] relative select-none transition-colors",
              "after:content-[''] after:absolute after:top-1/2 after:left-1/2",
              "after:-translate-x-1/2 after:-translate-y-1/2",
              "after:w-[2px] after:h-8 after:bg-border after:rounded-sm",
              "after:opacity-70 hover:after:opacity-100"
            )}
            style={{
              gridColumn: 2,
              WebkitAppRegion: 'no-drag',
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();

              setIsDragging(true);

              const startX = e.clientX;
              const startWidth = leftWidth;

              const onMove = (ev: MouseEvent) => {
                ev.preventDefault();
                ev.stopPropagation();
                const delta = ev.clientX - startX;
                const containerWidth = window.innerWidth;
                const newWidth = startWidth + (delta / containerWidth) * 100;
                setLeftWidth(Math.max(40, Math.min(75, newWidth)));
              };

              const onUp = (ev: MouseEvent) => {
                ev.preventDefault();
                ev.stopPropagation();

                document.removeEventListener('mousemove', onMove, { capture: true } as any);
                document.removeEventListener('mouseup', onUp, { capture: true } as any);

                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                document.body.style.pointerEvents = '';
                document.body.classList.remove('dragging');

                setIsDragging(false);
              };

              document.body.style.cursor = 'col-resize';
              document.body.style.userSelect = 'none';
              document.body.style.pointerEvents = 'none';
              document.body.classList.add('dragging');

              document.addEventListener('mousemove', onMove, { passive: false, capture: true });
              document.addEventListener('mouseup', onUp, { passive: false, capture: true });
            }}
          ></div>
        )}

        {/* Right Panel - Agent Panel */}
        <div
          className="h-full overflow-hidden min-h-0"
          style={{
            gridColumn: viewMode === 'both' ? 3 : '1 / -1',
          }}
        >
          <AgentPanel
            onDragStateChange={(dragging) => setIsDragging(dragging)}
            sandboxContext={{
              selectedDatasets: selectedDatasets,
              filePaths: selectedDatasets.map(dataset => `../data/sandbox/${dataset.filename}`)
            }}
          />
        </div>

        {/* Full Left View */}
        {viewMode === 'left-only' && (
          <div
            className="h-full relative overflow-hidden min-h-0"
            style={{
              gridColumn: '1 / -1',
            }}
          >
            {/* Left Panel Content */}
            <div className="h-full flex flex-col bg-background">
              {/* 這裡放原本左側的內容 */}
            </div>
          </div>
        )}


      </div>
    </div>
  );
}