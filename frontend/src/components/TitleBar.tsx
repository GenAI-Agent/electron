import React, { useState, useEffect } from 'react';
import { Globe, Folder, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
  showHomeButton?: boolean;
  showUrlInput?: boolean;
  showNavigation?: boolean;
  onUrlChange?: (url: string) => void;
}

const TitleBar: React.FC<TitleBarProps> = ({
  title = 'Lens',
  showModeSwitch = false,
  showHomeButton = false,
  showUrlInput = false,
  showNavigation = false,
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
      className="title-bar h-8 bg-secondary flex items-center px-3 relative z-[1000] border-b border-border"
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

      {/* Navigation Arrows */}
      <div
        className="flex items-center gap-1 ml-2"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <button
          onClick={() => router.back()}
          className="p-1 rounded hover:bg-accent text-foreground/70 hover:text-foreground transition-colors"
          title="上一頁"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => window.history.forward()}
          className="p-1 rounded hover:bg-accent text-foreground/70 hover:text-foreground transition-colors"
          title="下一頁"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

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
                className="w-full h-5 bg-background rounded-[10px] text-xs text-foreground px-2 pr-6 border border-border hover:border-ring focus:border-ring focus:outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 text-foreground hover:text-foreground p-0.5"
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
              "h-5 bg-background rounded-lg border border-border font-semibold flex items-center justify-center text-foreground text-xs px-3 min-w-[200px] w-full overflow-hidden text-ellipsis whitespace-nowrap pointer-events-auto",
              showUrlInput ? "cursor-pointer border border-transparent hover:bg-background hover:border-border" : "cursor-default"
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
