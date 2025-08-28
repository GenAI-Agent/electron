import React, { useState, useCallback } from 'react';
import { X, Plus, BarChart3, Database, TrendingUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';

export interface DataTab {
  id: string;
  title: string;
  source: 'thread' | 'ptt' | 'petition';
  filename: string;
  date: string;
  time: string;
  data: any[];
  isActive?: boolean;
}

interface DataTabManagerProps {
  tabs: DataTab[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab?: () => void;
  className?: string;
}

const getSourceIcon = (source: string) => {
  switch (source) {
    case 'thread':
      return <Database className="w-3 h-3" />;
    case 'ptt':
      return <TrendingUp className="w-3 h-3" />;
    case 'petition':
      return <BarChart3 className="w-3 h-3" />;
    default:
      return <Database className="w-3 h-3" />;
  }
};

const getSourceColor = (source: string, isActive: boolean) => {
  if (isActive) {
    return 'text-white bg-orange-500 border-orange-500 shadow-lg';
  }

  switch (source) {
    case 'thread':
      return 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100';
    case 'ptt':
      return 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100';
    case 'petition':
      return 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100';
  }
};

export const DataTabManager: React.FC<DataTabManagerProps> = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onNewTab,
  className,
}) => {
  const [draggedTab, setDraggedTab] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, tabId: string) => {
    setDraggedTab(tabId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTab(null);
  }, []);

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 overflow-x-auto", className)}>
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        const isDragged = draggedTab === tab.id;

        return (
          <div
            key={tab.id}
            draggable
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragEnd={handleDragEnd}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all duration-300 group min-w-0 max-w-52",
              "border text-sm font-medium shadow-sm",
              isDragged && "opacity-50 scale-95",
              getSourceColor(tab.source, isActive)
            )}
            onClick={() => onTabSelect(tab.id)}
          >
            {/* Source icon */}
            <div className="flex-shrink-0">
              {getSourceIcon(tab.source)}
            </div>
            
            {/* Tab title */}
            <div className="flex-1 truncate">
              <div className="truncate font-semibold">
                {tab.source.toUpperCase()}
              </div>
              <div className="truncate text-xs opacity-80">
                {tab.date} {tab.time}
              </div>
            </div>
            
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className={cn(
                "flex-shrink-0 p-1 rounded-full transition-all duration-200",
                isActive
                  ? "hover:bg-orange-600 opacity-70 hover:opacity-100"
                  : "hover:bg-gray-300 opacity-0 group-hover:opacity-100",
                isActive && "opacity-100"
              )}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
      
      {/* Add new tab button */}
      {onNewTab && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewTab}
          className="flex-shrink-0 h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
        >
          <Plus className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default DataTabManager;
