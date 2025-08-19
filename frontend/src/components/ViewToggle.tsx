import React from 'react';
import { 
  Monitor,
  MessageCircle,
  Columns
} from 'lucide-react';
import { cn } from '@/utils/cn';

type ViewMode = 'left-only' | 'right-only' | 'both';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onViewModeChange }) => {
  const modes: { key: ViewMode; icon: React.ReactNode }[] = [
    { key: 'left-only', icon: <Monitor className="w-3 h-3" /> },
    { key: 'both', icon: <Columns className="w-3 h-3" /> },
    { key: 'right-only', icon: <MessageCircle className="w-3 h-3" /> },
  ];

  return (
    <div className="fixed bottom-[7px] right-3 flex bg-white rounded-[20px] border border-slate-200 shadow-lg overflow-hidden z-[1000]">
      {modes.map((mode, index) => (
        <button
          key={mode.key}
          onClick={() => onViewModeChange(mode.key)}
          className={cn(
            "w-6 h-5 flex items-center justify-center transition-colors",
            "hover:bg-slate-50",
            viewMode === mode.key 
              ? "bg-slate-100 text-slate-600" 
              : "bg-transparent text-slate-400 hover:bg-slate-50",
            index > 0 && "border-l border-slate-200"
          )}
        >
          {mode.icon}
        </button>
      ))}
    </div>
  );
};

export default ViewToggle;
