import React from 'react';
import { cn } from '@/utils/cn';
import { X, Users, Target, Zap, Globe, TrendingUp } from 'lucide-react';

export type MarketingTabType = 'dashboard' | 'strategy' | 'action' | 'intelligence' | 'competitor';

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

interface MarketingTab {
  id: MarketingTabType | string;
  name: string;
  icon?: React.ReactNode;
  isDataTab?: boolean;
  closeable?: boolean;
}

interface MarketingParallelogramTabsProps {
  activeTab: MarketingTabType | string;
  onTabChange: (tab: MarketingTabType | string) => void;
  className?: string;
  dataTabs?: MarketingDataTab[];
  onCloseDataTab?: (tabId: string) => void;
}

const staticMarketingTabs: MarketingTab[] = [
  { 
    id: 'dashboard', 
    name: '用戶儀錶板',
    icon: <Users className="w-4 h-4" />
  },
  { 
    id: 'strategy', 
    name: '策略推演',
    icon: <Target className="w-4 h-4" />
  },
  { 
    id: 'action', 
    name: '行動建議',
    icon: <Zap className="w-4 h-4" />
  },
  { 
    id: 'intelligence', 
    name: '智庫',
    icon: <Globe className="w-4 h-4" />
  },
  { 
    id: 'competitor', 
    name: '競爭者',
    icon: <TrendingUp className="w-4 h-4" />
  },
];

export const MarketingParallelogramTabs: React.FC<MarketingParallelogramTabsProps> = ({
  activeTab,
  onTabChange,
  className,
  dataTabs = [],
  onCloseDataTab,
}) => {
  // Combine static tabs with data tabs
  const allTabs: MarketingTab[] = [
    ...staticMarketingTabs,
    ...dataTabs.map(dataTab => ({
      id: dataTab.id,
      name: dataTab.title || `${dataTab.source.toUpperCase()} 資料`,
      isDataTab: true,
      closeable: true,
    }))
  ];

  // Handle double click to close data tabs
  const handleDoubleClick = (tab: MarketingTab) => {
    if (tab.closeable && onCloseDataTab) {
      onCloseDataTab(tab.id as string);
    }
  };

  // Handle close button click
  const handleCloseClick = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    if (onCloseDataTab) {
      onCloseDataTab(tabId);
    }
  };

  return (
    <div className={cn("flex items-end justify-start ml-[60px] w-fit mb-[-1px]", className)}>
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
                  ? "bg-gradient-to-r from-blue-500 to-blue-600"
                  : "bg-transparent"
              )}
              style={{
                clipPath: 'polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)',
              }}
            />

            {/* Content */}
            <div className="relative z-10 flex items-center space-x-2 truncate">
              {tab.icon && (
                <span className={cn(
                  "flex-shrink-0",
                  isActive ? "text-white" : "text-gray-500"
                )}>
                  {tab.icon}
                </span>
              )}
              <span className="truncate text-sm">{tab.name}</span>
            </div>

            {/* Close button for data tabs */}
            {tab.closeable && (
              <button
                onClick={(e) => handleCloseClick(e, tab.id as string)}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 z-20",
                  "w-4 h-4 rounded-full flex items-center justify-center",
                  "opacity-0 group-hover:opacity-100 transition-opacity",
                  isActive
                    ? "text-white hover:bg-white/20"
                    : "text-gray-500 hover:bg-gray-200"
                )}
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Data tab indicator */}
            {tab.isDataTab && (
              <div
                className={cn(
                  "absolute top-1 right-1 w-2 h-2 rounded-full",
                  isActive ? "bg-white/60" : "bg-blue-500"
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default MarketingParallelogramTabs;
