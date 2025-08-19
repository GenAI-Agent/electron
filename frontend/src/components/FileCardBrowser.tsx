import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  IconButton, 
  Breadcrumbs, 
  Link,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import {
  Folder,
  InsertDriveFile,
  ArrowBack,
  Home,
  Image,
  VideoFile,
  AudioFile,
  PictureAsPdf,
  Code,
  Description
} from '@mui/icons-material';
import { useRouter } from 'next/router';

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
      return <Folder sx={{ fontSize: 48, color: '#3b82f6' }} />;
    }

    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    
    // 圖片文件
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
      return <Image sx={{ fontSize: 48, color: '#10b981' }} />;
    }
    
    // 影片文件
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(ext)) {
      return <VideoFile sx={{ fontSize: 48, color: '#f59e0b' }} />;
    }
    
    // 音頻文件
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)) {
      return <AudioFile sx={{ fontSize: 48, color: '#8b5cf6' }} />;
    }
    
    // PDF 文件
    if (ext === 'pdf') {
      return <PictureAsPdf sx={{ fontSize: 48, color: '#ef4444' }} />;
    }
    
    // 程式碼文件
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'cpp', 'c', 'h'].includes(ext)) {
      return <Code sx={{ fontSize: 48, color: '#6366f1' }} />;
    }
    
    // 文本文件
    if (['txt', 'md', 'json', 'xml', 'yaml', 'yml'].includes(ext)) {
      return <Description sx={{ fontSize: 48, color: '#64748b' }} />;
    }
    
    // 默認文件圖標
    return <InsertDriveFile sx={{ fontSize: 48, color: '#64748b' }} />;
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      p: 2,
      overflow: 'hidden' // 確保父容器不會溢出
    }}>
      {/* 導航欄 */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        mb: 2,
        gap: 1,
        flexShrink: 0 // 防止導航欄被壓縮
      }}>
        <IconButton onClick={handleHome} size="small">
          <Home />
        </IconButton>
        <IconButton onClick={handleBack} size="small" disabled={pathSegments.length <= 1}>
          <ArrowBack />
        </IconButton>

        <Breadcrumbs sx={{ flex: 1 }}>
          {pathSegments.map((segment, index) => {
            const isLast = index === pathSegments.length - 1;
            const separator = currentPath.includes('\\') ? '\\' : '/';
            const segmentPath = pathSegments.slice(0, index + 1).join(separator);

            return isLast ? (
              <Typography key={index} color="text.primary" sx={{ fontSize: '14px' }}>
                {segment}
              </Typography>
            ) : (
              <Link
                key={index}
                component="button"
                variant="body2"
                onClick={() => loadDirectory(segmentPath)}
                sx={{ fontSize: '14px' }}
              >
                {segment}
              </Link>
            );
          })}
        </Breadcrumbs>
      </Box>

      {/* 錯誤提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }}>
          {error}
        </Alert>
      )}

      {/* 文件卡片網格 - 可滾動區域 */}
      <Box sx={{
        flex: 1,
        overflow: 'auto',
        minHeight: 0, // 重要：允許 flex 子項縮小
        '&::-webkit-scrollbar': {
          width: '8px',
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
        <Grid container spacing={2} sx={{ pb: 2 }}>
          {items.map((item) => (
            <Grid item key={item.path}>
              <Card
                sx={{
                  width: 120,
                  height: 140,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  },
                  '&:active': {
                    transform: 'translateY(0px)',
                  },
                }}
                onClick={() => handleItemClick(item)}
              >
                <CardContent
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    textAlign: 'center',
                    p: 1,
                    '&:last-child': { pb: 1 }
                  }}
                >
                  {getFileIcon(item.name, item.isDirectory)}
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 1,
                      fontSize: '11px',
                      fontWeight: 500,
                      color: '#374151',
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      wordBreak: 'break-word'
                    }}
                  >
                    {item.name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default FileCardBrowser;
