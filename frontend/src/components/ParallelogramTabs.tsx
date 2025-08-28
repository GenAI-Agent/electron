import React from 'react';
import { cn } from '@/utils/cn';
import { X } from 'lucide-react';

export type TabType = 'intelligence' | 'warroom' | 'simulation' | 'data';

interface DataTab {
  id: string;
  title: string;
  source: 'threads' | 'twitter' | 'facebook' | 'ptt' | 'petition';
  filename: string;
  date: string;
  time: string;
  data: any[];
  isActive?: boolean;
  isAnalytics?: boolean;
}

interface Tab {
  id: TabType | string;
  name: string;
  icon?: React.ReactNode;
  isDataTab?: boolean;
  closeable?: boolean;
}

interface ParallelogramTabsProps {
  activeTab: TabType | string;
  onTabChange: (tab: TabType | string) => void;
  className?: string;
  dataTabs?: DataTab[];
  onCloseDataTab?: (tabId: string) => void;
}

const staticTabs: Tab[] = [
  { id: 'warroom', name: '戰情室' },
  { id: 'intelligence', name: '智庫' },
  { id: 'simulation', name: '推演' },
];

export const ParallelogramTabs: React.FC<ParallelogramTabsProps> = ({
  activeTab,
  onTabChange,
  className,
  dataTabs = [],
  onCloseDataTab,
}) => {
  // Combine static tabs with data tabs
  const allTabs: Tab[] = [
    ...staticTabs,
    ...dataTabs.map(dataTab => ({
      id: dataTab.id,
      name: dataTab.filename || `${dataTab.source.toUpperCase()} 資料`,
      isDataTab: true,
      closeable: true,
    }))
  ];

  // Handle double click to close data tabs
  const handleDoubleClick = (tab: Tab) => {
    if (tab.closeable && onCloseDataTab) {
      onCloseDataTab(tab.id as string);
    }
  };

  return (
    <div className={cn("flex items-end justify-start ml-[60px] w-fit mb-[-1px]", className)} >
      {allTabs.map((tab, index) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            onDoubleClick={() => handleDoubleClick(tab)}
            className={cn(
              "relative transition-all duration-200 ease-out cursor-pointer group",
              "flex items-center justify-center text-base font-medium",
              "border-t border-l border-r border-border min-w-0",
              isActive
                ? "h-12 text-white z-20 bg-card min-w-[140px]"
                : "h-9 text-gray-600 hover:text-gray-800 z-10 bg-card hover:bg-muted min-w-[120px]",
              tab.closeable ? "px-8" : "px-12"
            )}
            style={{
              clipPath: 'polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)',
              marginLeft: index > 0 ? '-10px' : '0',
              borderBottom: isActive ? '1px solid transparent' : '1px solid var(--border)',
            }}
          >
            {/* Background */}
            <div
              className={cn(
                "absolute inset-0 transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-orange-500 to-orange-600"
                  : "bg-transparent"
              )}
              style={{
                clipPath: 'inherit',
              }}
            />

            {/* Tab content */}
            <span className="relative z-10 select-none flex items-center gap-2">
              <span className="truncate max-w-[100px]">{tab.name}</span>

              {/* Close button integrated into tab content */}
              {tab.closeable && onCloseDataTab && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseDataTab(tab.id as string);
                  }}
                  className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200",
                    "hover:bg-white/20 opacity-70 hover:opacity-100",
                    isActive ? "text-white" : "text-gray-500"
                  )}
                  title="關閉分頁"
                >
                  <X className="w-3 h-3" />
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ParallelogramTabs;
