import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  File, 
  FileText,
  FileSpreadsheet,
  Presentation,
  Image,
  Video,
  Music,
  Code,
  Archive,
  Loader2,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/router';
import { cn } from '@/utils/cn';

interface FileItem {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
  path: string;
}

interface LocalFileBrowserProps {
  initialPath: string;
}

const LocalFileBrowser: React.FC<LocalFileBrowserProps> = ({ initialPath }) => {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const getFileIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) {
      return <Folder className="w-5 h-5 text-blue-500" />;
    }

    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
      case 'ppt':
      case 'pptx':
        return <Presentation className="w-5 h-5 text-red-600" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
        return <Image className="w-5 h-5 text-purple-600" />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return <Video className="w-5 h-5 text-pink-600" />;
      case 'mp3':
      case 'wav':
      case 'flac':
        return <Music className="w-5 h-5 text-green-600" />;
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'html':
      case 'css':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
        return <Code className="w-5 h-5 text-indigo-500" />;
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive className="w-5 h-5 text-purple-500" />;
      default:
        return <File className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const loadDirectory = async (path: string) => {
    setLoading(true);
    setError(null);
    
    try {
      if (window.electronAPI?.readDirectory) {
        const result = await window.electronAPI.readDirectory(path);
        if (result.success) {
          setItems(result.items);
          setCurrentPath(path);
        } else {
          setError(result.error || '無法讀取目錄');
        }
      } else {
        setError('文件系統 API 不可用');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  const canPreviewInApp = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const previewableExtensions = [
      // 文本文件
      'txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'cpp', 'c', 'h', 'xml', 'yaml', 'yml', 'ini', 'cfg', 'log',
      // 數據文件
      'csv',
      // 圖片文件
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp',
      // 影片文件
      'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv',
      // 音頻文件
      'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a',
      // PDF和Office文件
      'pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'
    ];
    return previewableExtensions.includes(ext);
  };

  const handleItemClick = async (item: FileItem) => {
    if (item.isDirectory) {
      // Navigate to subdirectory
      router.push(`/browser?path=${encodeURIComponent(item.path)}&mode=local`);
    } else {
      // 判斷是否可以在應用內預覽
      if (canPreviewInApp(item.name)) {
        // 在應用內打開文件
        router.push(`/browser?file=${encodeURIComponent(item.path)}&mode=local`);
      } else {
        // 用系統默認程式打開
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

  const getPathSegments = (path: string) => {
    const segments = path.split(/[/\\]/).filter(Boolean);
    const result = [];
    let currentPath = '';
    
    for (let i = 0; i < segments.length; i++) {
      currentPath += (i === 0 ? '' : '/') + segments[i];
      result.push({
        name: segments[i],
        path: currentPath
      });
    }
    
    return result;
  };

  const handleBreadcrumbClick = (path: string) => {
    router.push(`/browser?path=${encodeURIComponent(path)}&mode=local`);
  };

  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath]);

  useEffect(() => {
    if (initialPath !== currentPath) {
      setCurrentPath(initialPath);
    }
  }, [initialPath]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full flex-col gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">載入中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2">
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumbs */}
      <div className="p-2 border-b border-slate-200">
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
          {getPathSegments(currentPath).map((segment, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              <button
                onClick={() => handleBreadcrumbClick(segment.path)}
                className="text-foreground hover:text-primary transition-colors"
              >
                {segment.name}
              </button>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto">
        <div className="divide-y divide-slate-100">
          {items.map((item, index) => (
            <div
              key={index}
              onClick={() => handleItemClick(item)}
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="flex-shrink-0">
                {getFileIcon(item.name, item.isDirectory)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {item.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.isDirectory ? '資料夾' : '文件'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocalFileBrowser;
