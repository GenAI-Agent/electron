import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { cn } from '@/utils/cn';
import BrowserView from '@/components/BrowserView';
import AgentPanel from '@/components/AgentPanel';
import Header, { ViewMode } from '@/components/ui/header';
import { ModalProvider, ModalManager } from '@/components/Modal';

const BrowserPage: React.FC = () => {
  const router = useRouter();
  const { url, path, mode, file } = router.query;
  const [viewMode, setViewMode] = useState<ViewMode>('with-agent');
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
    <ModalProvider>
      <div className="h-screen w-screen flex flex-col bg-background relative overflow-hidden">
      {/* Header */}
      <Header
        title={getTitle()}
        showUrlInput={!isLocalMode}
        onUrlChange={handleUrlChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden min-h-0 mt-[40px]">
        {/* Browser View - Always visible */}
        <div
          className="absolute inset-0 transition-all duration-300 ease-in-out"
          style={{
            right: viewMode === 'with-agent' ? `${100 - leftWidth}%` : '0',
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

        {/* Vertical Resizer */}
        <div
          className={cn(
            "absolute top-0 bottom-0 w-2 cursor-col-resize bg-transparent hover:bg-accent",
            "z-[2000] select-none transition-all duration-300",
            "after:content-[''] after:absolute after:top-1/2 after:left-1/2",
            "after:-translate-x-1/2 after:-translate-y-1/2",
            "after:w-[2px] after:h-8 after:bg-border after:rounded-sm",
            "after:opacity-70 hover:after:opacity-100",
            viewMode === 'with-agent' ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          style={{
            left: `${leftWidth}%`,
            transform: 'translateX(-50%)',
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

        {/* Agent Panel - with slide animation */}
        <div
          className={cn(
            "absolute top-0 right-0 bottom-0 transition-transform duration-300 ease-in-out",
            viewMode === 'with-agent' ? 'translate-x-0' : 'translate-x-full'
          )}
          style={{
            width: `${100 - leftWidth}%`,
          }}
        >
          <AgentPanel
            onDragStateChange={(dragging) => setIsDragging(dragging)}
          />
        </div>

      </div>

      {/* Global Modal Manager */}
      <ModalManager />
      </div>
    </ModalProvider>
  );
};

export default BrowserPage;
