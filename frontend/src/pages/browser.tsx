import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { useRouter } from 'next/router';
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
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#f0f4f8', // More blue-tinted light background
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Title Bar */}
      <TitleBar
        title={getTitle()}
        showHomeButton={true}
        showUrlInput={!isLocalMode}
        onUrlChange={handleUrlChange}
      />

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          display: 'grid',
          position: 'relative',
          overflow: 'hidden', // 防止溢出
          minHeight: 0, // 允許 flex 子項縮小
          gridTemplateColumns:
            viewMode === 'both'
              ? `${leftWidth}% 6px ${100 - leftWidth}%`
              : '1fr',
          gridTemplateRows: '1fr', // 確保行高度正確
        }}
      >
        {/* Left Panel - Browser View */}
        {(viewMode === 'left-only' || viewMode === 'both') && (
          <Box sx={{
            gridColumn: viewMode === 'both' ? 1 : '1 / -1',
            height: '100%',
            position: 'relative',
            overflow: 'hidden', // 防止溢出
            minHeight: 0 // 允許縮小
          }}>
            <BrowserView
              url={currentUrl || url as string}
              path={path as string}
              file={file as string}
              mode={isLocalMode ? 'local' : 'web'}
              disablePointerEvents={isDragging}
            />
          </Box>
        )}

        {/* Vertical Resizer - middle grid column */}
        {viewMode === 'both' && (
          <Box
            className="drag-handle drag-handle-horizontal"
            sx={{
              gridColumn: 2,
              height: '100%',
              cursor: 'col-resize',
              bgcolor: 'transparent',
              '&:hover': { bgcolor: '#e2e8f0' },
              zIndex: 2000,
              position: 'relative',
              WebkitAppRegion: 'no-drag',
              userSelect: 'none',
              // Add visual indicator
              '&::after': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '2px',
                height: '20px',
                bgcolor: '#94a3b8',
                borderRadius: '1px',
                opacity: 0.5,
              },
              '&:hover::after': {
                opacity: 1,
              }
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
          />
        )}

        {/* Right Panel - Agent Panel */}
        {(viewMode === 'right-only' || viewMode === 'both') && (
          <Box sx={{
            gridColumn: viewMode === 'both' ? 3 : '1 / -1',
            height: '100%',
            overflow: 'hidden', // 防止溢出
            minHeight: 0 // 允許縮小
          }}>
            <AgentPanel
              onDragStateChange={(dragging) => setIsDragging(dragging)}
            />
          </Box>
        )}

        {/* View Toggle */}
        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </Box>
    </Box>
  );
};

export default BrowserPage;
