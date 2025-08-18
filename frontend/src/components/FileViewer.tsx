import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, IconButton, Button } from '@mui/material';
import { ArrowBack, OpenInNew } from '@mui/icons-material';
import { useRouter } from 'next/router';

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
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50%' }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      );
    }

    if (!fileContent) {
      return (
        <Alert severity="warning" sx={{ m: 2 }}>
          無法載入文件內容
        </Alert>
      );
    }

    // 文本文件
    if (fileContent.type === 'text') {
      return (
        <Box sx={{
          p: 2,
          height: '100%',
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#c1c1c1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#a8a8a8',
          },
        }}>
          <pre style={{
            whiteSpace: 'pre-wrap',
            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
            fontSize: '14px',
            lineHeight: '1.5',
            margin: 0
          }}>
            {fileContent.content}
          </pre>
        </Box>
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
        <Box sx={{ height: '100%', position: 'relative', bgcolor: '#f5f5f5' }}>
          {renderPdfViewer()}
        </Box>
      );
    }

    // PPT/PPTX文件
    if (fileContent.type === 'presentation') {
      return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" gutterBottom>
              PowerPoint 簡報
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              文件大小: {(fileContent.size! / 1024 / 1024).toFixed(2)} MB
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              格式: {fileContent.extension?.toUpperCase()}
            </Typography>
            <Button
              variant="contained"
              startIcon={<OpenInNew />}
              onClick={handleOpenWithSystem}
              sx={{ mt: 2 }}
            >
              用 PowerPoint 打開
            </Button>
          </Box>
          <Box sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                📊 PowerPoint 簡報
              </Typography>
              <Typography variant="body2" color="text.secondary">
                此文件需要用 Microsoft PowerPoint 或相容程式開啟
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                點擊上方按鈕用系統預設程式開啟
              </Typography>
            </Box>
          </Box>
        </Box>
      );
    }

    // 圖片文件
    if (isImageFile(ext)) {
      return (
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <img
            src={`file://${filePath}`}
            alt={fileName}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        </Box>
      );
    }

    // 影片文件
    if (isVideoFile(ext)) {
      return (
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <video
            controls
            style={{
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          >
            <source src={`file://${filePath}`} />
            您的瀏覽器不支援影片播放
          </video>
        </Box>
      );
    }

    // 音頻文件
    if (isAudioFile(ext)) {
      return (
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <audio controls style={{ width: '100%' }}>
            <source src={`file://${filePath}`} />
            您的瀏覽器不支援音頻播放
          </audio>
        </Box>
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
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" gutterBottom>
              {fileTypeNames[ext as keyof typeof fileTypeNames]}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              文件大小: {fileContent.size ? (fileContent.size / 1024 / 1024).toFixed(2) + ' MB' : '未知'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<OpenInNew />}
              onClick={handleOpenWithSystem}
              sx={{ mt: 2 }}
            >
              用系統程式打開
            </Button>
          </Box>
          <Box sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                📄 {fileTypeNames[ext as keyof typeof fileTypeNames]}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                此文件需要用 Microsoft Office 或相容程式開啟
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                點擊上方按鈕用系統預設程式開啟
              </Typography>
            </Box>
          </Box>
        </Box>
      );
    }

    // 不支援的文件類型
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          無法預覽此文件類型
        </Typography>
        <Typography variant="body2" color="text.secondary">
          文件：{fileName}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          請使用外部程式打開此文件
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 文件標題欄 */}
      <Box sx={{
        px: 1,
        py: 0.5,
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        bgcolor: '#f8fafc',
        minHeight: '40px'
      }}>
        <IconButton size="small" onClick={handleBack}>
          <ArrowBack />
        </IconButton>
        <Typography variant="subtitle2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {filePath.split(/[/\\]/).pop()}
        </Typography>

        {/* PDF文件信息和操作按鈕 */}
        {fileContent?.type === 'pdf' && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ mx: 1 }}>
              📄 ({(fileContent.size! / 1024 / 1024).toFixed(2)} MB)
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<OpenInNew />}
              onClick={handleOpenWithSystem}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              外部打開
            </Button>
          </>
        )}
      </Box>

      {/* 文件內容 */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {renderFileContent()}
      </Box>
    </Box>
  );
};

export default FileViewer;
