import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, IconButton } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useRouter } from 'next/router';

interface FileViewerProps {
  filePath: string;
}

const FileViewer: React.FC<FileViewerProps> = ({ filePath }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const isVideoFile = (ext: string) => {
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
    return videoExtensions.includes(ext);
  };

  const isAudioFile = (ext: string) => {
    const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'];
    return audioExtensions.includes(ext);
  };

  const isPdfFile = (ext: string) => {
    return ext === 'pdf';
  };

  useEffect(() => {
    const loadFile = async () => {
      setLoading(true);
      setError(null);

      try {
        const ext = getFileExtension(filePath);
        
        if (isTextFile(ext)) {
          // 使用 Electron API 讀取文本文件內容
          if (window.electronAPI?.readFile) {
            const fileContent = await window.electronAPI.readFile(filePath);
            setContent(fileContent);
          } else {
            throw new Error('無法訪問文件系統');
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : '無法載入文件');
        setLoading(false);
      }
    };

    loadFile();
  }, [filePath]);

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

    if (isTextFile(ext)) {
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
            {content}
          </pre>
        </Box>
      );
    }

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

    if (isPdfFile(ext)) {
      return (
        <Box sx={{ height: '100%' }}>
          <embed 
            src={`file://${filePath}`} 
            type="application/pdf" 
            width="100%" 
            height="100%" 
          />
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
        p: 1, 
        borderBottom: '1px solid #e2e8f0', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        bgcolor: '#f8fafc'
      }}>
        <IconButton size="small" onClick={handleBack}>
          <ArrowBack />
        </IconButton>
        <Typography variant="subtitle2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {filePath.split(/[/\\]/).pop()}
        </Typography>
      </Box>

      {/* 文件內容 */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {renderFileContent()}
      </Box>
    </Box>
  );
};

export default FileViewer;
