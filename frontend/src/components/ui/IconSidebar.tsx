import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import {
  Plus,
  FileText,
  Clock,
  Target,
  BarChart3,
  Settings,
  Home,
  Search,
  Archive
} from 'lucide-react';

interface SidebarItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  color?: 'orange' | 'blue' | 'green' | 'purple' | 'gray' | 'red';
  description?: string;
  metadata?: string;
}

interface IconSidebarProps {
  items: SidebarItem[];
  onAddNew?: () => void;
  className?: string;
  showAddButton?: boolean;
}

const IconSidebar: React.FC<IconSidebarProps> = ({
  items,
  onAddNew,
  className,
  showAddButton = true
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getColorClasses = (color: string = 'gray', isActive: boolean = false) => {
    const colors = {
      orange: {
        active: 'bg-orange-500 text-white shadow-lg shadow-orange-500/30',
        inactive: 'text-orange-500 hover:bg-orange-50 hover:text-orange-600'
      },
      blue: {
        active: 'bg-blue-500 text-white shadow-lg shadow-blue-500/30',
        inactive: 'text-blue-500 hover:bg-blue-50 hover:text-blue-600'
      },
      green: {
        active: 'bg-green-500 text-white shadow-lg shadow-green-500/30',
        inactive: 'text-green-500 hover:bg-green-50 hover:text-green-600'
      },
      purple: {
        active: 'bg-purple-500 text-white shadow-lg shadow-purple-500/30',
        inactive: 'text-purple-500 hover:bg-purple-50 hover:text-purple-600'
      },
      red: {
        active: 'bg-red-500 text-white shadow-lg shadow-red-500/30',
        inactive: 'text-red-500 hover:bg-red-50 hover:text-red-600'
      },
      gray: {
        active: 'bg-gray-500 text-white shadow-lg shadow-gray-500/30',
        inactive: 'text-gray-500 hover:bg-gray-50 hover:text-gray-600'
      }
    };

    return isActive ? colors[color as keyof typeof colors].active : colors[color as keyof typeof colors].inactive;
  };

  return (
    <div
      className={cn(
        "bg-card flex flex-col py-4 relative transition-all duration-300 overflow-hidden",
        isHovered ? "w-48" : "w-16",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Items - Centered in 50% of viewport height, no horizontal scroll */}
      <div
        className="flex flex-col space-y-3 flex-1 justify-center overflow-y-auto overflow-x-hidden"
        style={{ maxHeight: '50vh' }}
      >
        {/* Add New Button - at the top of main items */}
        {showAddButton && onAddNew && (
          <button
            onClick={onAddNew}
            className={cn(
              "rounded-lg flex items-center transition-all duration-200 transform hover:scale-105 px-3 py-2 mx-2",
              "text-green-500 hover:bg-green-50 hover:text-green-600",
              isHovered ? "justify-start w-full" : "justify-center w-10 h-10"
            )}
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            {isHovered && (
              <span className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden">
                新增
              </span>
            )}
          </button>
        )}

        {/* Regular Items */}
        {items.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={cn(
                "rounded-lg flex items-center transition-all duration-200 transform hover:scale-105 px-3 py-2 mx-2",
                getColorClasses(item.color, item.isActive),
                isHovered ? "justify-start w-full" : "justify-center w-10 h-10"
              )}
            >
              <IconComponent className="w-5 h-5 flex-shrink-0" />
              {isHovered && (
                <div className="ml-3 flex-1 text-left overflow-hidden">
                  <div className="text-sm text-black font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.label}
                  </div>
                </div>
              )}
            </button>
          );
        })}

        {/* Settings Button - moved to main items area */}
        <button
          className={cn(
            "rounded-lg flex items-center transition-all duration-200 transform hover:scale-105 px-3 py-2 mx-2",
            "text-gray-500 hover:bg-gray-50 hover:text-gray-600",
            isHovered ? "justify-start w-full" : "justify-center w-10 h-10"
          )}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {isHovered && (
            <span className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden">
              設定
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default IconSidebar;
