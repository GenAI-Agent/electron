import React, { useState, useEffect } from 'react';
import { Globe, Folder, Search } from 'lucide-react';
import { useRouter } from 'next/router';
import { cn } from '@/utils/cn';

// 擴展 CSSProperties 類型以支持 WebkitAppRegion
declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag';
  }
}

interface TitleBarProps {
  title?: string;
  showModeSwitch?: boolean;
  isWebMode?: boolean;
  onModeChange?: (isWebMode: boolean) => void;
  showHomeButton?: boolean;
  showUrlInput?: boolean;
  onUrlChange?: (url: string) => void;
}

const TitleBar: React.FC<TitleBarProps> = ({
  title = 'Lens',
  showModeSwitch = false,
  isWebMode = true,
  onModeChange,
  showHomeButton = false,
  showUrlInput = false,
  onUrlChange,
}) => {
  const router = useRouter();
  const [urlInput, setUrlInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (title && title !== 'Lens' && !isEditing) {
      setUrlInput(title);
    }
  }, [title, isEditing]);

  const handleHomeClick = () => {
    router.push('/');
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim() && onUrlChange) {
      onUrlChange(urlInput.trim());
      setIsEditing(false);
    }
  };

  const handleUrlInputClick = () => {
    console.log('URL input clicked, showUrlInput:', showUrlInput);
    if (showUrlInput) {
      setIsEditing(true);
    }
  };

  return (
    <div
      className="title-bar h-8 bg-gray-700 flex items-center px-3 relative z-[1000] border-b border-gray-600"
      style={{ WebkitAppRegion: 'drag' }}
    >
      {/* Traffic Lights */}
      <div
        className="flex items-center gap-1.5"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        {/* Close button - Red */}
        <div
          className="w-3 h-3 rounded-full bg-red-500 cursor-pointer flex items-center justify-center text-[8px] text-transparent hover:bg-red-600 hover:text-white transition-colors"
          onClick={() => {
            if (window.electronAPI?.closeWindow) {
              window.electronAPI.closeWindow();
            }
          }}
        >
          ×
        </div>

        {/* Minimize button - Yellow */}
        <div
          className="w-3 h-3 rounded-full bg-amber-500 cursor-pointer flex items-center justify-center text-[8px] text-transparent hover:bg-amber-600 hover:text-white transition-colors"
          onClick={() => {
            if (window.electronAPI?.minimizeWindow) {
              window.electronAPI.minimizeWindow();
            }
          }}
        >
          −
        </div>

        {/* Maximize button - Green */}
        <div
          className="w-3 h-3 rounded-full bg-emerald-500 cursor-pointer flex items-center justify-center text-[8px] text-transparent hover:bg-emerald-600 hover:text-white transition-colors"
          onClick={() => {
            if (window.electronAPI?.maximizeWindow) {
              window.electronAPI.maximizeWindow();
            }
          }}
        >
          □
        </div>

        {/* Home button - Blue (new) */}
        {showHomeButton && (
          <div
            className="w-3 h-3 rounded-full bg-blue-500 cursor-pointer flex items-center justify-center text-[8px] text-transparent hover:bg-blue-600 hover:text-white transition-colors"
            onClick={handleHomeClick}
          >
            ⌂
          </div>
        )}
      </div>

      {/* Mode Switch */}
      {showModeSwitch && (
        <div
          className="ml-2"
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          <label className="flex items-center gap-1 text-gray-300 text-[10px]">
            <input
              type="checkbox"
              checked={isWebMode}
              onChange={(e) => onModeChange?.(e.target.checked)}
              className="sr-only"
            />
            <div className={cn(
              "relative inline-block w-6 h-3 rounded-full transition-colors",
              isWebMode ? "bg-blue-500" : "bg-gray-600"
            )}>
              <div className={cn(
                "absolute top-0.5 w-2 h-2 bg-white rounded-full transition-transform",
                isWebMode ? "translate-x-3.5" : "translate-x-0.5"
              )} />
            </div>
            <div className="flex items-center gap-1">
              {isWebMode ? <Globe className="w-3 h-3" /> : <Folder className="w-3 h-3" />}
              <span className="text-[10px] text-gray-300">
                {isWebMode ? 'Web' : 'Local'}
              </span>
            </div>
          </label>
        </div>
      )}

      {/* Title Display / URL Input - 絕對置中，佔頁面寬度的一半 */}
      <div
        className="absolute left-1/4 w-1/2 flex justify-center items-center pointer-events-auto"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        {showUrlInput && isEditing ? (
          <form
            onSubmit={handleUrlSubmit}
            className="w-full pointer-events-auto"
            style={{ WebkitAppRegion: 'no-drag' }}
          >
            <div className="relative w-full">
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onBlur={() => setIsEditing(false)}
                autoFocus
                placeholder="輸入網址..."
                className="w-full h-5 bg-gray-600 rounded-[10px] text-[10px] text-gray-300 px-2 pr-6 border border-gray-500 hover:border-gray-400 focus:border-blue-500 focus:outline-none placeholder:text-gray-500"
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-0.5"
              >
                <Search className="w-3 h-3" />
              </button>
            </div>
          </form>
        ) : (
          <div
            onClick={handleUrlInputClick}
            onMouseDown={(e) => {
              console.log('Mouse down on URL area');
              e.stopPropagation();
            }}
            className={cn(
              "h-4 bg-gray-600 rounded-lg flex items-center justify-center text-gray-300 text-[10px] font-normal px-3 min-w-[200px] w-full overflow-hidden text-ellipsis whitespace-nowrap pointer-events-auto",
              showUrlInput ? "cursor-pointer border border-transparent hover:bg-gray-500 hover:border-gray-400" : "cursor-default"
            )}
            style={{ WebkitAppRegion: 'no-drag' }}
          >
            {title}
          </div>
        )}
      </div>
    </div>
  );
};

export default TitleBar;
