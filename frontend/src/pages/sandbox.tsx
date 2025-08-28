import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { RefreshCw, Calendar, Database, MessageSquare, FileText, Plus, Minus, X, ChevronLeft, ChevronRight, Square, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import AgentPanel from '@/components/AgentPanel';
import Header from '@/components/ui/header';
import ParallelogramTabs, { TabType } from '@/components/ParallelogramTabs';
import { DataTab } from '@/components/DataTabManager';
import { DataTab } from '@/components/DataTabManager';
import IntelligencePage from '@/components/sandbox/IntelligencePage';
import WarRoomPage from '@/components/sandbox/WarRoomPage';
import SimulationPage from '@/components/sandbox/SimulationPage';
import DataDashboard from '@/components/sandbox/DataDashboard';

import { cn } from '@/utils/cn';
import { sessionManager } from '@/utils/sessionManager';

type DataSource = 'thread' | 'ptt' | 'petition';
type ViewMode = 'with-agent' | 'fullscreen';

interface DataFile {
  filename: string;
  date: string;
  time: string;
  fullPath: string;
}

export default function SandboxPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('with-agent');
  const [leftWidth, setLeftWidth] = useState(70);
  const [isDragging, setIsDragging] = useState(false);

  // New state for the redesigned interface
  const [activeTab, setActiveTab] = useState<TabType>('intelligence');
  const [dataTabs, setDataTabs] = useState<DataTab[]>([]);
  const [activeDataTabId, setActiveDataTabId] = useState<string | null>(null);
  const [showDataDashboard, setShowDataDashboard] = useState(false);




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

  // Handle opening new data tab
  const handleOpenDataTab = async (source: DataSource, file: DataFile) => {
    const data = await loadFileData(file.filename);
    const newTab: DataTab = {
      id: `${source}_${file.filename}_${Date.now()}`,
      title: `${source.toUpperCase()} ${file.date}`,
      source,
      filename: file.filename,
      date: file.date,
      time: file.time,
      data,
    };

    setDataTabs(prev => [...prev, newTab]);
    setActiveDataTabId(newTab.id);
    setShowDataDashboard(true);
  };

  // Handle closing data tab
  const handleCloseDataTab = (tabId: string) => {
    setDataTabs(prev => prev.filter(tab => tab.id !== tabId));
    if (activeDataTabId === tabId) {
      const remainingTabs = dataTabs.filter(tab => tab.id !== tabId);
      if (remainingTabs.length > 0) {
        setActiveDataTabId(remainingTabs[remainingTabs.length - 1].id);
      } else {
        setActiveDataTabId(null);
        setShowDataDashboard(false);
      }
    }
  };

  // Handle tab selection with navigation
  const handleTabSelect = (tabId: string) => {
    setActiveDataTabId(tabId);
    setActiveTab('data'); // 切換到數據展示頁面
  };

  // Handle unified tab change (static tabs + data tabs)
  const handleUnifiedTabChange = (tabId: TabType | string) => {
    if (tabId === 'intelligence' || tabId === 'warroom' || tabId === 'simulation') {
      // Static tab selected
      setActiveTab(tabId as TabType);
      setActiveDataTabId(null); // Clear data tab selection
      setShowDataDashboard(false); // Hide data dashboard
    } else {
      // Data tab selected
      setActiveDataTabId(tabId as string);
      setActiveTab('intelligence'); // Switch to intelligence page to show data
      setShowDataDashboard(true); // Make sure data dashboard is visible
    }
  };

  // Update session context based on open data tabs
  const updateSessionContext = () => {
    if (dataTabs.length === 0) return;

    if (dataTabs.length === 1) {
      const tab = dataTabs[0];
      sessionManager.setFileContext({
        filePath: `sandbox/${tab.filename}`,
        fileName: `${tab.source}_${tab.date}_${tab.time}`,
        fileType: 'csv',
        content: tab.data
      });
    } else {
      const filesData = dataTabs.map(tab => ({
        source: tab.source,
        date: tab.date,
        time: tab.time,
        filename: tab.filename,
        data: tab.data
      }));

      sessionManager.setMultiFileContext({
        files: filesData,
        totalFiles: dataTabs.length
      });
    }
  };



  // Update session context when data tabs change
  useEffect(() => {
    updateSessionContext();
  }, [dataTabs]);

  // Render current page content based on active tab
  const renderPageContent = () => {
    if (showDataDashboard && activeDataTabId) {
      const activeDataTab = dataTabs.find(tab => tab.id === activeDataTabId);
      if (activeDataTab) {
        return (
          <DataDashboard
            dataTab={activeDataTab}
            onClose={() => {
              setShowDataDashboard(false);
              setActiveDataTabId(null);
            }}
          />
        );
      }
    }

    switch (activeTab) {
      case 'intelligence':
        return <IntelligencePage onOpenDataTab={handleOpenDataTab} />;
      case 'warroom':
        return <WarRoomPage />;
      case 'simulation':
        return <SimulationPage />;
      default:
        return <IntelligencePage onOpenDataTab={handleOpenDataTab} />;
    }
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
          gridTemplateColumns: viewMode === 'with-agent' ? `${leftWidth}% 8px ${100 - leftWidth}%` : '1fr',
          gridTemplateRows: '1fr',
        }}
      >
        <div
          className="h-full relative overflow-hidden min-h-0 flex flex-col"
          style={{ gridColumn: viewMode === 'with-agent' ? 1 : '1 / -1' }}
        >


            {/* Main Page Content */}
            <div className="flex-1 flex flex-col relative">
              {renderPageContent()}

              {/* Bottom Parallelogram Tabs - positioned absolutely at bottom */}
              <div className="absolute bottom-0 left-0 right-0 z-30">
                <ParallelogramTabs
                  activeTab={activeDataTabId || activeTab}
                  onTabChange={handleUnifiedTabChange}
                  dataTabs={dataTabs}
                  onCloseDataTab={handleCloseDataTab}
                />
              </div>
            </div>
        </div>

        {/* Drag Handle */}
        {viewMode === 'with-agent' && (
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
        {viewMode === 'with-agent' && (
          <div
            className="h-full overflow-hidden min-h-0"
            style={{
              gridColumn: 3,
            }}
          >
            <AgentPanel
              onDragStateChange={(dragging) => setIsDragging(dragging)}
              sandboxContext={{
                selectedDatasets: dataTabs.map(tab => ({
                  id: tab.id,
                  source: tab.source,
                  filename: tab.filename,
                  date: tab.date,
                  time: tab.time,
                  data: tab.data
                })),
                filePaths: dataTabs.map(tab => `../data/sandbox/${tab.filename}`)
              }}
            />
          </div>
        )}

      </div>
    </div>
  );
}