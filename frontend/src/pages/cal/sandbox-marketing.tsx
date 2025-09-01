import React, { useState, useEffect } from 'react';
import AgentPanel from '@/components/AgentPanel';
import Header, { ViewMode } from '@/components/ui/header';
import DashboardPage from '@/components/sandbox/marketing/DashboardPage';
import StrategySimulationPage from '@/components/sandbox/marketing/StrategySimulationPageNew';
import ActionRecommendationPage from '@/components/sandbox/marketing/ActionRecommendationPageNew';
import IntelligenceHubPage from '@/components/sandbox/marketing/IntelligenceHubPage';
import CompetitorPage from '@/components/sandbox/marketing/CompetitorPage';
import MarketingDataDashboard from '@/components/sandbox/marketing/MarketingDataDashboard';
import MarketingParallelogramTabs from '@/components/sandbox/marketing/MarketingParallelogramTabs';

import { cn } from '@/utils/cn';
import { sessionManager } from '@/utils/sessionManager';

type MarketingDataSource = 'flight' | 'user' | 'competitor' | 'market' | 'loyalty' | 'route' | 'social';

export interface MarketingDataTab {
  id: string;
  title: string;
  source: MarketingDataSource;
  filename: string;
  date: string;
  time: string;
  data: any[];
  isActive?: boolean;
  isAnalytics?: boolean;
}

interface MarketingDataFile {
  filename: string;
  date: string;
  time: string;
  fullPath: string;
}

export type MarketingTabType = 'dashboard' | 'strategy' | 'action' | 'intelligence' | 'competitor';

export default function MarketingSandboxPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('with-agent');
  const [leftWidth, setLeftWidth] = useState(70);
  const [isDragging, setIsDragging] = useState(false);

  // State for the marketing sandbox interface
  const [activeTab, setActiveTab] = useState<MarketingTabType>('dashboard');
  const [dataTabs, setDataTabs] = useState<MarketingDataTab[]>([]);
  const [activeDataTabId, setActiveDataTabId] = useState<string | null>(null);
  const [showDataDashboard, setShowDataDashboard] = useState(false);

  // 推演記錄狀態
  const [selectedSimulationRecord, setSelectedSimulationRecord] = useState<any>(null);

  // Mock 推演記錄數據
  const mockSimulationRecords = [
    {
      id: 'sim-1',
      title: '價格策略 vs 服務策略',
      participants: { side1: '價格策略', side2: '服務策略' },
      date: '2025-09-01 14:30',
      status: 'completed',
      result: { confidence: 0.72 }
    },
    {
      id: 'sim-2',
      title: '數位行銷 vs 傳統廣告',
      participants: { side1: '數位行銷', side2: '傳統廣告' },
      date: '2025-08-28 16:15',
      status: 'completed',
      result: { confidence: 0.68 }
    }
  ];

  // 處理推演記錄選擇
  const handleSimulationRecordSelect = (record: any) => {
    setSelectedSimulationRecord(record);
    // 切換到策略推演頁面並選擇該記錄
    setActiveTab('strategy');
  };

  // Load marketing data
  const loadMarketingData = async (filename: string) => {
    try {
      console.log(`正在載入行銷資料: ${filename}`);
      const response = await fetch(`http://localhost:8021/api/marketing-sandbox/data?filename=${filename}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`載入的資料筆數: ${data.length}`);
        return data;
      } else {
        console.error('行銷資料API錯誤:', await response.text());
      }
    } catch (error) {
      console.error('載入行銷資料失敗:', error);
    }

    // Fallback mock data for marketing
    const mockMarketingData = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      route: `TPE-${['NRT', 'ICN', 'BKK', 'SIN', 'HKG'][Math.floor(Math.random() * 5)]}`,
      passengers: Math.floor(Math.random() * 300) + 50,
      revenue: Math.floor(Math.random() * 1000000) + 100000,
      load_factor: Math.floor(Math.random() * 40) + 60,
      date: `2025-08-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      competitor_price: Math.floor(Math.random() * 20000) + 15000,
      market_share: Math.floor(Math.random() * 30) + 10,
      user_searches: Math.floor(Math.random() * 1000) + 100,
      booking_rate: Math.floor(Math.random() * 20) + 5
    }));

    console.log('使用行銷模擬資料:', mockMarketingData.length, '筆');
    return mockMarketingData;
  };

  // Handle opening new marketing data tab
  const handleOpenMarketingDataTab = async (source: MarketingDataSource, file: MarketingDataFile, providedData?: any[]) => {
    const data = providedData || await loadMarketingData(file.filename);

    const isAnalytics = file.filename.includes('_analytics');

    const newTab: MarketingDataTab = {
      id: `${source}_${file.filename}_${Date.now()}`,
      title: isAnalytics ? `${source.toUpperCase()} 分析報告` : `${source.toUpperCase()} ${file.date}`,
      source: source as MarketingDataSource,
      filename: file.filename,
      date: file.date,
      time: file.time,
      data,
      isAnalytics,
    };

    setDataTabs(prev => [...prev, newTab]);
    setActiveDataTabId(newTab.id);
    setShowDataDashboard(true);
  };

  // Handle closing marketing data tab
  const handleCloseMarketingDataTab = (tabId: string) => {
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

  // Handle unified tab change (static tabs + data tabs)
  const handleUnifiedTabChange = (tabId: MarketingTabType | string) => {
    if (['dashboard', 'strategy', 'action', 'intelligence', 'competitor'].includes(tabId as string)) {
      // Static tab selected
      setActiveTab(tabId as MarketingTabType);
      setActiveDataTabId(null);
      setShowDataDashboard(false);
    } else {
      // Data tab selected
      setActiveDataTabId(tabId as string);
      setActiveTab('dashboard'); // Default to dashboard page to show data
      setShowDataDashboard(true);
    }
  };

  // Update session context based on open data tabs
  const updateSessionContext = () => {
    if (dataTabs.length === 0) return;

    if (dataTabs.length === 1) {
      const tab = dataTabs[0];
      sessionManager.setFileContext({
        filePath: `marketing-sandbox/${tab.filename}`,
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
          <MarketingDataDashboard
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
      case 'dashboard':
        return <DashboardPage className="h-full" onOpenDataTab={handleOpenMarketingDataTab as any} />;
      case 'strategy':
        return <StrategySimulationPage
          className="h-full"
          onOpenDataTab={handleOpenMarketingDataTab as any}
          onRecordSelect={setSelectedSimulationRecord}
        />;
      case 'action':
        return <ActionRecommendationPage className="h-full" onOpenDataTab={handleOpenMarketingDataTab as any} />;
      case 'intelligence':
        return <IntelligenceHubPage className="h-full" onOpenDataTab={handleOpenMarketingDataTab as any} />;
      case 'competitor':
        return <CompetitorPage className="h-full" onOpenDataTab={handleOpenMarketingDataTab as any} />;
      default:
        return <DashboardPage className="h-full" onOpenDataTab={handleOpenMarketingDataTab as any} />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col pt-10 bg-background relative overflow-hidden">
      <Header
        title="Lens Sandbox - Marketing"
        showUrlInput={false}
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
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Page Content Area - with proper scrolling */}
            <div className="flex-1 overflow-hidden">
              {renderPageContent()}
            </div>

            {/* Bottom Parallelogram Tabs - fixed at bottom */}
            <div className="fixed bottom-0 left-0 w-fit bg-card z-30">
              <MarketingParallelogramTabs
                activeTab={activeDataTabId || activeTab}
                onTabChange={handleUnifiedTabChange}
                dataTabs={dataTabs}
                onCloseDataTab={handleCloseMarketingDataTab}
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
                filePaths: dataTabs.map(tab => {
                  const filename = tab.filename;
                  return `../data/marketing-sandbox/${filename.endsWith('.csv') ? filename : filename + '.csv'}`;
                })
              }}
            />
          </div>
        )}

      </div>
    </div>
  );
}


