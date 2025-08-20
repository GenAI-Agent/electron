import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { cn } from '@/utils/cn';
import BrowserView from '@/components/BrowserView';
import ViewToggle from '@/components/ViewToggle';
import AgentPanel from '@/components/AgentPanel';
import TitleBar from '@/components/TitleBar';

type ViewMode = 'left-only' | 'right-only' | 'both';

const BrowserPage: React.FC = () => {
  const router = useRouter();
  const { url, path, mode, file } = router.query;
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [leftWidth, setLeftWidth] = useState(70); // percentage for left/right split (50%-75% range)
  const [isDragging, setIsDragging] = useState(false); // 拖曳時停用 webview 事件
  const [currentUrl, setCurrentUrl] = useState(url as string || '');
  const isLocalMode = mode === 'local';

  // 動態生成標題
  const getTitle = () => {
    if (isLocalMode) {
      if (file) {
        // 如果有文件參數，顯示文件名
        const fileName = typeof file === 'string' ? file.split(/[/\\]/).pop() : '';
        return fileName || 'Local File';
      } else if (path) {
        // 如果有路徑參數，顯示路徑
        return typeof path === 'string' ? path : 'Local Files';
      } else {
        return 'Local Files';
      }
    } else {
      return currentUrl || (url as string) || 'Browser';
    }
  };

  const handleUrlChange = (newUrl: string) => {
    setCurrentUrl(newUrl);
    // 導航到新的 URL
    router.push(`/browser?url=${encodeURIComponent(newUrl)}`);
  };

  useEffect(() => {
    if (!url && !path && !file) {
      router.push('/');
    }
  }, [url, path, file, router]);

  // 同步 URL 變化
  useEffect(() => {
    if (url && url !== currentUrl) {
      setCurrentUrl(url as string);
    }
  }, [url, currentUrl]);

  if (!url && !path && !file) return null;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f0f4f8] relative overflow-hidden">
      {/* Title Bar */}
      <TitleBar
        title={getTitle()}
        showHomeButton={true}
        showUrlInput={!isLocalMode}
        showNavigation={true}
        onUrlChange={handleUrlChange}
      />

      {/* Main Content Area */}
      <div
        className="flex-1 grid relative overflow-hidden min-h-0"
        style={{
          gridTemplateColumns:
            viewMode === 'both'
              ? `${leftWidth}% 6px ${100 - leftWidth}%`
              : '1fr',
          gridTemplateRows: '1fr',
        }}
      >
        {/* Left Panel - Browser View */}
        {(viewMode === 'left-only' || viewMode === 'both') && (
          <div
            className="h-full relative overflow-hidden min-h-0"
            style={{
              gridColumn: viewMode === 'both' ? 1 : '1 / -1',
            }}
          >
            <BrowserView
              url={currentUrl || url as string}
              path={path as string}
              file={file as string}
              mode={isLocalMode ? 'local' : 'web'}
              disablePointerEvents={isDragging}
            />
          </div>
        )}

        {/* Vertical Resizer - middle grid column */}
        {viewMode === 'both' && (
          <div
            className={cn(
              "drag-handle drag-handle-horizontal",
              "h-full cursor-col-resize bg-transparent hover:bg-slate-200",
              "z-[2000] relative select-none",
              "after:content-[''] after:absolute after:top-1/2 after:left-1/2",
              "after:-translate-x-1/2 after:-translate-y-1/2",
              "after:w-0.5 after:h-5 after:bg-slate-400 after:rounded-[1px]",
              "after:opacity-50 hover:after:opacity-100"
            )}
            style={{
              gridColumn: 2,
              WebkitAppRegion: 'no-drag',
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();

              // Set dragging state immediately
              setIsDragging(true);

              const startX = e.clientX;
              const startWidth = leftWidth;

              const onMove = (ev: MouseEvent) => {
                ev.preventDefault();
                ev.stopPropagation();
                const delta = ev.clientX - startX;
                const containerWidth = window.innerWidth;
                const newWidth = startWidth + (delta / containerWidth) * 100;
                // Constrain between 40% and 75% (left browser panel) - 設置最小寬度為 40%
                setLeftWidth(Math.max(40, Math.min(75, newWidth)));
              };

              const onUp = (ev: MouseEvent) => {
                ev.preventDefault();
                ev.stopPropagation();

                // Clean up event listeners with capture
                document.removeEventListener('mousemove', onMove, { capture: true } as any);
                document.removeEventListener('mouseup', onUp, { capture: true } as any);

                // Reset styles
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                document.body.style.pointerEvents = '';
                document.body.classList.remove('dragging');

                setIsDragging(false);
              };

              // Set up global styles for dragging
              document.body.style.cursor = 'col-resize';
              document.body.style.userSelect = 'none';
              document.body.style.pointerEvents = 'none';
              document.body.classList.add('dragging');

              // Set up global event listeners with capture
              document.addEventListener('mousemove', onMove, { passive: false, capture: true });
              document.addEventListener('mouseup', onUp, { passive: false, capture: true });
            }}
          ></div>
        )}

        {/* Right Panel - Agent Panel */}
        {(viewMode === 'right-only' || viewMode === 'both') && (
          <div
            className="h-full overflow-hidden min-h-0"
            style={{
              gridColumn: viewMode === 'both' ? 3 : '1 / -1',
            }}
          >
            <AgentPanel
              onDragStateChange={(dragging) => setIsDragging(dragging)}
            />
          </div>
        )}

        {/* View Toggle */}
        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>
    </div>
  );
};

export default BrowserPage;
