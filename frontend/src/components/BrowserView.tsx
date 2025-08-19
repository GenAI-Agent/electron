import React, { useEffect, useRef } from 'react';
import FileCardBrowser from './FileCardBrowser';
import FileViewer from './FileViewer';
import { cn } from '@/utils/cn';

interface BrowserViewProps {
  url?: string;
  path?: string;
  file?: string;
  mode?: 'web' | 'local';
  disablePointerEvents?: boolean; // 拖曳時停用 webview 以避免吃掉事件
}



const BrowserView: React.FC<BrowserViewProps> = ({
  url,
  path,
  file,
  mode = 'web',
  disablePointerEvents = false
}) => {
  const webviewRef = useRef<any>(null);

  // If in local mode with a specific file, render file viewer
  if (mode === 'local' && file) {
    return (
      <div className="w-full h-full bg-white relative overflow-hidden flex flex-col">
        <FileViewer filePath={file as string} />
      </div>
    );
  }

  // If in local mode with path, render file browser
  if (mode === 'local' && path) {
    return (
      <div className="w-full h-full bg-white relative overflow-hidden flex flex-col">
        <FileCardBrowser initialPath={path} />
      </div>
    );
  }

  useEffect(() => {
    if (!webviewRef.current || !url) return;

    const webview = webviewRef.current;

    // Add protocol if missing
    let formattedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      formattedUrl = `https://${url}`;
    }

    // Wait for webview to be ready
    const handleDomReady = () => {
      console.log('Webview is ready');
    };

    const handleDidFailLoad = (event: any) => {
      console.error('Failed to load:', event.errorDescription);
    };

    const handleDidStartLoading = () => {
      console.log('Started loading:', formattedUrl);
    };

    // Add event listeners
    webview.addEventListener('dom-ready', handleDomReady);
    webview.addEventListener('did-fail-load', handleDidFailLoad);
    webview.addEventListener('did-start-loading', handleDidStartLoading);

    // Set the URL
    webview.src = formattedUrl;

    // Cleanup
    return () => {
      if (webview.removeEventListener) {
        webview.removeEventListener('dom-ready', handleDomReady);
        webview.removeEventListener('did-fail-load', handleDidFailLoad);
        webview.removeEventListener('did-start-loading', handleDidStartLoading);
      }
    };
  }, [url]);

  return (
    <div className="w-full h-full bg-white relative min-w-[200px] pr-1">
      <webview
        ref={webviewRef}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          pointerEvents: disablePointerEvents ? 'none' : 'auto',
          // Ensure webview doesn't interfere with drag operations
          userSelect: disablePointerEvents ? 'none' : 'auto',
        }}
        nodeintegration={false}
        webpreferences="contextIsolation=true,webSecurity=false"
        allowpopups={true}
        useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        partition="persist:browser"
      />
    </div>
  );
};

export default BrowserView;
