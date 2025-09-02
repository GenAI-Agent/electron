import React, { useState } from "react";
import { cn } from "@/utils/cn";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Calendar,
} from "lucide-react";

interface HistoryItem {
  id: string;
  title: string;
  date: string;
  duration: string;
  status: 'completed' | 'running' | 'failed';
  description?: string;
  metadata?: string;
  isActive?: boolean;
  onClick?: () => void;
}

interface HistorySidebarProps {
  items: HistoryItem[];
  onAddNew?: () => void;
  className?: string;
  showAddButton?: boolean;
  title?: string;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  items,
  onAddNew,
  className,
  showAddButton = true,
  title = "推演歷史"
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'running':
        return <Play className="w-4 h-4 text-orange-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string, isActive: boolean = false) => {
    if (isActive) {
      return "bg-blue-100 text-blue-900 shadow-lg border-blue-200";
    }

    switch (status) {
      case 'completed':
        return "text-gray-700 hover:bg-blue-50 border-gray-200";
      case 'running':
        return "text-gray-700 hover:bg-orange-50 border-gray-200";
      case 'failed':
        return "text-gray-700 hover:bg-gray-50 border-gray-200";
      default:
        return "text-gray-700 hover:bg-gray-50 border-gray-200";
    }
  };

  return (
    <div
      className={cn(
        "bg-card flex flex-col relative transition-all duration-300 border-r border-border",
        isExpanded ? "w-72" : "w-16",
        className
      )}
    >
      {/* Header with Toggle Button */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {isExpanded && (
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {isExpanded ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Add New Button */}
      {showAddButton && onAddNew && (
        <div className="p-3 border-b border-border">
          <button
            onClick={onAddNew}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg text-blue-600 hover:bg-blue-50 border border-dashed border-blue-300 hover:border-blue-400 transition-all duration-200",
              !isExpanded && "justify-center"
            )}
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            {isExpanded && (
              <span className="text-sm font-medium">新增推演</span>
            )}
          </button>
        </div>
      )}

      {/* History Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={cn(
              "w-full text-left p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] hover:shadow-sm",
              getStatusColor(item.status, item.isActive),
              !isExpanded && "flex justify-center"
            )}
          >
            {isExpanded ? (
              <div className="space-y-2">
                {/* Title and Status */}
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                    {item.title}
                  </h4>
                  <div className="ml-2 flex-shrink-0">
                    {getStatusIcon(item.status)}
                  </div>
                </div>


              </div>
            ) : (
              // Collapsed view - just show status icon
              <div className="flex justify-center">
                {getStatusIcon(item.status)}
              </div>
            )}
          </button>
        ))}

        {/* Empty State */}
        {items.length === 0 && isExpanded && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">暫無推演歷史</p>
            <p className="text-xs mt-1">開始你的第一個推演</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorySidebar;