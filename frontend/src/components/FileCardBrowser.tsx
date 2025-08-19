import React, { useState, useEffect } from 'react';
import {
  Folder,
  File,
  ArrowLeft,
  Home,
  Image,
  Video,
  Music,
  FileText,
  Code,
  FileIcon,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/router';
import { cn } from '@/utils/cn';

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
}

interface FileCardBrowserProps {
  initialPath: string;
}

const FileCardBrowser: React.FC<FileCardBrowserProps> = ({ initialPath }) => {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const getFileIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) {
      return <Folder className="w-12 h-12 text-blue-500" />;
    }

    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    
    // 圖片文件
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
      return <Image className="w-12 h-12 text-green-500" />;
    }
    
    // 影片文件
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(ext)) {
      return <Video className="w-12 h-12 text-amber-500" />;
    }
    
    // 音頻文件
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)) {
      return <Music className="w-12 h-12 text-purple-500" />;
    }
    
    // PDF 文件
    if (ext === 'pdf') {
      return <FileText className="w-12 h-12 text-red-500" />;
    }
    
    // 程式碼文件
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'cpp', 'c', 'h'].includes(ext)) {
      return <Code className="w-12 h-12 text-indigo-500" />;
    }
    
    // 文本文件
    if (['txt', 'md', 'json', 'xml', 'yaml', 'yml'].includes(ext)) {
      return <FileText className="w-12 h-12 text-slate-500" />;
    }
    
    // 默認文件圖標
    return <File className="w-12 h-12 text-slate-500" />;
  };

  const canPreviewInApp = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const previewableExtensions = [
      'txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'cpp', 'c', 'h', 'xml', 'yaml', 'yml', 'ini', 'cfg', 'log',
      'csv',
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp',
      'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv',
      'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a',
      'pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'
    ];
    return previewableExtensions.includes(ext);
  };

  const loadDirectory = async (path: string) => {
    setLoading(true);
    setError(null);

    try {
      if (window.electronAPI?.readDirectory) {
        const result = await window.electronAPI.readDirectory(path);
        if (result.success && result.items) {
          // 排序：文件夾在前，然後按名稱排序
          const sortedItems = result.items.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
          });
          setItems(sortedItems);
          setCurrentPath(path);

          // 更新 URL 以反映當前路徑，這樣標題欄也會更新
          router.push(`/browser?path=${encodeURIComponent(path)}&mode=local`, undefined, { shallow: true });
        } else {
          setError(result.error || '無法讀取目錄');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '讀取目錄時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirectory(initialPath);
  }, [initialPath]);

  const handleItemClick = async (item: FileItem) => {
    if (item.isDirectory) {
      loadDirectory(item.path);
    } else {
      if (canPreviewInApp(item.name)) {
        router.push(`/browser?file=${encodeURIComponent(item.path)}&mode=local`);
      } else {
        try {
          if (window.electronAPI?.openFile) {
            await window.electronAPI.openFile(item.path);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : '無法打開文件');
        }
      }
    }
  };

  const handleBack = () => {
    const separator = currentPath.includes('\\') ? '\\' : '/';
    const parentPath = currentPath.split(/[/\\]/).slice(0, -1).join(separator);
    if (parentPath && parentPath !== currentPath) {
      loadDirectory(parentPath);
    }
  };

  const handleHome = () => {
    router.push('/');
  };

  const pathSegments = currentPath.split(/[/\\]/).filter(Boolean);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-1/2">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-2 overflow-hidden">
      {/* 導航欄 */}
      <div className="flex items-center mb-2 gap-1 flex-shrink-0">
        <button
          onClick={handleHome}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        >
          <Home className="w-4 h-4" />
        </button>
        <button
          onClick={handleBack}
          disabled={pathSegments.length <= 1}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <nav className="flex-1 flex items-center text-sm">
          {pathSegments.map((segment, index) => {
            const isLast = index === pathSegments.length - 1;
            const separator = currentPath.includes('\\') ? '\\' : '/';
            const segmentPath = pathSegments.slice(0, index + 1).join(separator);

            return (
              <React.Fragment key={index}>
                {index > 0 && <span className="mx-1 text-gray-400">/</span>}
                {isLast ? (
                  <span className="text-gray-900">{segment}</span>
                ) : (
                  <button
                    onClick={() => loadDirectory(segmentPath)}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {segment}
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* 錯誤提示 */}
      {error && (
        <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-md flex-shrink-0">
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* 文件卡片網格 - 可滾動區域 */}
      <div className="flex-1 overflow-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2 pb-2">
          {items.map((item) => (
            <div
              key={item.path}
              className="w-[120px] h-[140px] bg-white rounded-lg shadow-sm border border-slate-200 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
              onClick={() => handleItemClick(item)}
            >
              <div className="flex flex-col items-center justify-center h-full text-center p-2">
                {getFileIcon(item.name, item.isDirectory)}
                <span className="mt-2 text-[11px] font-medium text-gray-700 leading-tight overflow-hidden line-clamp-2 break-words">
                  {item.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FileCardBrowser;
