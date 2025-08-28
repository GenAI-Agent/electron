import React, { useState, useEffect } from 'react';
import { Globe, Folder, Search, ChevronLeft, ChevronRight, User, Square, Monitor, Home } from 'lucide-react';
import { useRouter } from 'next/router';
import { cn } from '@/utils/cn';
import { Button } from './button';
import { LensOSLogo } from '../LensLogo';

// 擴展 CSSProperties 類型以支持 WebkitAppRegion
declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag';
  }
}

interface HeaderProps {
  title?: string;
  showHomeButton?: boolean;
  showUrlInput?: boolean;
  showNavigation?: boolean;
  showUserInfo?: boolean;
  onUrlChange?: (url: string) => void;
  userInfo?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  rightContent?: React.ReactNode;
  showViewToggle?: boolean;
  viewMode?: 'with-agent' | 'fullscreen';
  onViewModeChange?: (mode: 'with-agent' | 'fullscreen') => void;
}

const Header: React.FC<HeaderProps> = ({
  title = 'Lens OS',
  showHomeButton = false,
  showUrlInput = false,
  showNavigation = false,
  showUserInfo = false,
  onUrlChange,
  userInfo,
  rightContent,
  showViewToggle = false,
  viewMode = 'with-agent',
  onViewModeChange,
}) => {
  const router = useRouter();
  const [urlInput, setUrlInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (title && title !== 'Lens OS' && !isEditing) {
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
    if (showUrlInput) {
      setIsEditing(true);
    }
  };

  return (
    <header
      className="h-[40px] bg-card flex items-center px-6 relative z-[1000] border-b border-border shadow-sm"
      style={{ WebkitAppRegion: 'drag' }}
    >
      {/* Left section - Navigation */}
      <div className="flex items-center gap-4 flex-1">
        {/* Parallelogram Traffic Lights */}
        <div
          className="flex items-center gap-1.5"
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          {/* Close button - Red */}
          <div
            className="w-4 h-3 bg-red-500 cursor-pointer flex items-center justify-center text-[8px] text-transparent hover:bg-red-600 hover:text-white transition-colors"
            style={{
              clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)',
            }}
            onClick={() => {
              if (window.electronAPI?.closeWindow) {
                window.electronAPI.closeWindow();
              }
            }}
            title="關閉"
          >
            ×
          </div>
          {/* Minimize button - Yellow */}
          <div
            className="w-4 h-3 bg-yellow-500 cursor-pointer flex items-center justify-center text-[8px] text-transparent hover:bg-yellow-600 hover:text-white transition-colors"
            style={{
              clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)',
            }}
            onClick={() => {
              if (window.electronAPI?.minimizeWindow) {
                window.electronAPI.minimizeWindow();
              }
            }}
            title="最小化"
          >
            −
          </div>
          {/* Maximize button - Green */}
          <div
            className="w-4 h-3 bg-green-500 cursor-pointer flex items-center justify-center text-[8px] text-transparent hover:bg-green-600 hover:text-white transition-colors"
            style={{
              clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)',
            }}
            onClick={() => {
              if (window.electronAPI?.maximizeWindow) {
                window.electronAPI.maximizeWindow();
              }
            }}
            title="最大化"
          >
            □
          </div>
        </div>



        {/* Navigation Arrows */}
        {showNavigation && (
          <div
            className="flex items-center gap-1"
            style={{ WebkitAppRegion: 'no-drag' }}
          >
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-accent text-foreground/70 hover:text-foreground transition-colors"
              title="上一頁"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => window.history.forward()}
              className="p-2 rounded-lg hover:bg-accent text-foreground/70 hover:text-foreground transition-colors"
              title="下一頁"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Center section - Title or URL Input */}
      <div
        className="flex-1 max-w-2xl mx-auto px-4"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        {showUrlInput && isEditing ? (
          <form
            onSubmit={handleUrlSubmit}
            className="w-full"
          >
            <div className="relative w-full">
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onBlur={() => setIsEditing(false)}
                autoFocus
                placeholder="輸入網址..."
                className="w-full h-10 bg-background rounded-lg text-sm text-foreground px-4 pr-10 border border-border hover:border-ring focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground transition-all duration-200"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <div
            onClick={handleUrlInputClick}
            className={cn(
              "h-10 flex items-center justify-center text-foreground text-sm px-4 overflow-hidden text-ellipsis whitespace-nowrap transition-all duration-200 relative",
              showUrlInput ? "cursor-pointer" : "cursor-default"
            )}
          >
            {/* Left Double Arrows - Back Navigation */}
            <button
              className="absolute left-2 flex items-center hover:opacity-70 transition-opacity"
              onClick={() => router.back()}
              title="上一頁"
              style={{ WebkitAppRegion: 'no-drag' }}
            >
              {/* Outer Left Arrow */}
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {/* Inner Left Arrow */}
              <svg className="w-4 h-4 -ml-1" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Title Text */}
            <span className="mx-12">
              {showUrlInput ? urlInput || title : title}
            </span>

            {/* Right Double Arrows - Forward Navigation */}
            <button
              className="absolute right-2 flex items-center hover:opacity-70 transition-opacity"
              onClick={() => window.history.forward()}
              title="下一頁"
              style={{ WebkitAppRegion: 'no-drag' }}
            >
              {/* Inner Right Arrow */}
              <svg className="w-4 h-4 -mr-1" viewBox="0 0 16 16" fill="none">
                <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {/* Outer Right Arrow */}
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Right section - Custom content and view toggle */}
      <div className="flex items-center gap-2 flex-1 justify-end mr-4" style={{ WebkitAppRegion: 'no-drag' }}>
        {rightContent}

        {/* Home Button */}
        {showViewToggle && (
          <button
            onClick={() => router.push('/')}
            className="text-foreground hover:text-primary transition-all duration-200 p-2 rounded-md hover:bg-accent transform hover:scale-110"
          >
            <Home className="w-4 h-4" />
          </button>
        )}

        {/* View Toggle Button */}
        {showViewToggle && onViewModeChange && (
          <button
            onClick={() => onViewModeChange(viewMode === 'with-agent' ? 'fullscreen' : 'with-agent')}
            className="text-foreground hover:text-primary transition-all duration-200 p-2 rounded-md hover:bg-accent transform hover:scale-110"
          >
            {viewMode === 'with-agent' ? (
              <Monitor className="w-5 h-5 transition-all duration-200 transform" />
            ) : (
              <Square className="w-5 h-5 transition-all duration-200 transform" />
            )}
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;