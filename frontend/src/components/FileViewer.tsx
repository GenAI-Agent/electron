import React, { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { cn } from '@/utils/cn';

interface FileViewerProps {
  filePath: string;
}

interface FileContent {
  type: 'text' | 'pdf' | 'presentation' | 'binary';
  content?: string;
  filePath?: string;
  size?: number;
  extension?: string;
}

const FileViewer: React.FC<FileViewerProps> = ({ filePath }) => {
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const router = useRouter();

  const getFileExtension = (path: string) => {
    return path.split('.').pop()?.toLowerCase() || '';
  };

  const isTextFile = (ext: string) => {
    const textExtensions = ['txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'cpp', 'c', 'h', 'xml', 'yaml', 'yml', 'ini', 'cfg', 'log'];
    return textExtensions.includes(ext);
  };

  const isImageFile = (ext: string) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    return imageExtensions.includes(ext);
  };

  const isPdfFile = (ext: string) => {
    return ext === 'pdf';
  };

  const isPresentationFile = (ext: string) => {
    return ['ppt', 'pptx'].includes(ext);
  };

  const isOfficeFile = (ext: string) => {
    return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
  };

  const isVideoFile = (ext: string) => {
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
    return videoExtensions.includes(ext);
  };

  const isAudioFile = (ext: string) => {
    const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'];
    return audioExtensions.includes(ext);
  };

  useEffect(() => {
    const loadFile = async () => {
      setLoading(true);
      setError(null);

      try {
        if (window.electronAPI?.readFile) {
          const result = await window.electronAPI.readFile(filePath);
          setFileContent(result);

          // 如果是PDF文件，嘗試獲取base64數據
          if (result.type === 'pdf') {
            try {
              const base64Result = await window.electronAPI.readFileBase64(filePath);
              if (base64Result.success) {
                setPdfData(base64Result.data);
              }
            } catch (e) {
              console.warn('無法獲取PDF的base64數據:', e);
            }
          }
        } else {
          throw new Error('無法訪問文件系統');
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : '無法載入文件');
        setLoading(false);
      }
    };

    loadFile();
  }, [filePath]);

  const handleOpenWithSystem = async () => {
    try {
      if (window.electronAPI?.openFile) {
        await window.electronAPI.openFile(filePath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '無法打開文件');
    }
  };

  const handleBack = () => {
    const parentPath = filePath.split(/[/\\]/).slice(0, -1).join('/');
    router.push(`/browser?path=${encodeURIComponent(parentPath)}&mode=local`);
  };

  const renderFileContent = () => {
    const ext = getFileExtension(filePath);
    const fileName = filePath.split(/[/\\]/).pop() || '';

    if (loading) {
      return (
        <div className="flex justify-center items-center h-1/2">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="m-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <span className="text-sm text-red-700">{error}</span>
        </div>
      );
    }

    if (!fileContent) {
      return (
        <div className="m-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <span className="text-sm text-yellow-700">無法載入文件內容</span>
        </div>
      );
    }

    // 文本文件
    if (fileContent.type === 'text') {
      return (
        <div className="p-2 h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed m-0" style={{
            fontFamily: 'Monaco, Consolas, "Courier New", monospace'
          }}>
            {fileContent.content}
          </pre>
        </div>
      );
    }

    // PDF文件
    if (fileContent.type === 'pdf') {
      const renderPdfViewer = () => {
        // 方法1: 使用base64數據
        if (pdfData) {
          return (
            <iframe
              src={`data:application/pdf;base64,${pdfData}`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              title="PDF Viewer"
            />
          );
        }

        // 方法2: 使用embed標籤
        return (
          <embed
            src={`file://${fileContent.filePath}`}
            type="application/pdf"
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            title="PDF Viewer"
          />
        );
      };

      return (
        <div className="h-full relative bg-gray-100">
          {renderPdfViewer()}
        </div>
      );
    }

    // PPT/PPTX文件
    if (fileContent.type === 'presentation') {
      return (
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold mb-2">
              PowerPoint 簡報
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              文件大小: {(fileContent.size! / 1024 / 1024).toFixed(2)} MB
            </p>
            <p className="text-sm text-gray-600 mb-4">
              格式: {fileContent.extension?.toUpperCase()}
            </p>
            <button
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors flex items-center gap-2"
              onClick={handleOpenWithSystem}
            >
              <ExternalLink className="w-4 h-4" />
              用 PowerPoint 打開
            </button>
          </div>
          <div className="flex-1 p-4 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg text-gray-600 mb-2">
                📊 PowerPoint 簡報
              </h3>
              <p className="text-sm text-gray-600">
                此文件需要用 Microsoft PowerPoint 或相容程式開啟
              </p>
              <p className="text-sm text-gray-600 mt-1">
                點擊上方按鈕用系統預設程式開啟
              </p>
            </div>
          </div>
        </div>
      );
    }

    // 圖片文件
    if (isImageFile(ext)) {
      return (
        <div className="p-2 flex justify-center items-center h-full">
          <img
            src={`file://${filePath}`}
            alt={fileName}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    }

    // 影片文件
    if (isVideoFile(ext)) {
      return (
        <div className="p-2 flex justify-center items-center h-full">
          <video
            controls
            className="max-w-full max-h-full"
          >
            <source src={`file://${filePath}`} />
            您的瀏覽器不支援影片播放
          </video>
        </div>
      );
    }

    // 音頻文件
    if (isAudioFile(ext)) {
      return (
        <div className="p-2 flex justify-center items-center h-full">
          <audio controls className="w-full">
            <source src={`file://${filePath}`} />
            您的瀏覽器不支援音頻播放
          </audio>
        </div>
      );
    }

    // Word/Excel文件
    if (['doc', 'docx', 'xls', 'xlsx'].includes(ext)) {
      const fileTypeNames = {
        'doc': 'Word 文檔',
        'docx': 'Word 文檔',
        'xls': 'Excel 試算表',
        'xlsx': 'Excel 試算表'
      };

      return (
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold mb-2">
              {fileTypeNames[ext as keyof typeof fileTypeNames]}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              文件大小: {fileContent.size ? (fileContent.size / 1024 / 1024).toFixed(2) + ' MB' : '未知'}
            </p>
            <button
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors flex items-center gap-2"
              onClick={handleOpenWithSystem}
            >
              <ExternalLink className="w-4 h-4" />
              用系統程式打開
            </button>
          </div>
          <div className="flex-1 p-4 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg text-gray-600 mb-2">
                📄 {fileTypeNames[ext as keyof typeof fileTypeNames]}
              </h3>
              <p className="text-sm text-gray-600">
                此文件需要用 Microsoft Office 或相容程式開啟
              </p>
              <p className="text-sm text-gray-600 mt-1">
                點擊上方按鈕用系統預設程式開啟
              </p>
            </div>
          </div>
        </div>
      );
    }

    // 不支援的文件類型
    return (
      <div className="p-4 text-center">
        <h3 className="text-lg font-semibold mb-2">
          無法預覽此文件類型
        </h3>
        <p className="text-sm text-gray-600">
          文件：{fileName}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          請使用外部程式打開此文件
        </p>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* 文件標題欄 */}
      <div className="px-2 py-1 border-b border-slate-200 flex items-center gap-2 bg-slate-50 min-h-[40px]">
        <button
          onClick={handleBack}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="flex-1 text-sm font-medium truncate">
          {filePath.split(/[/\\]/).pop()}
        </h2>

        {/* PDF文件信息和操作按鈕 */}
        {fileContent?.type === 'pdf' && (
          <>
            <span className="text-xs text-gray-600 mx-1">
              📄 ({(fileContent.size! / 1024 / 1024).toFixed(2)} MB)
            </span>
            <button
              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
              onClick={handleOpenWithSystem}
            >
              <ExternalLink className="w-3 h-3" />
              外部打開
            </button>
          </>
        )}
      </div>

      {/* 文件內容 */}
      <div className="flex-1 overflow-hidden">
        {renderFileContent()}
      </div>
    </div>
  );
};

export default FileViewer;
