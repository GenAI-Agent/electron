import React, { useState, useEffect } from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Typography,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Folder, 
  InsertDriveFile, 
  PictureAsPdf,
  Description,
  TableChart,
  Slideshow,
  Image,
  VideoFile,
  AudioFile,
  Code,
  Archive
} from '@mui/icons-material';
import { useRouter } from 'next/router';

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
      return <Folder sx={{ color: '#3b82f6' }} />;
    }

    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <PictureAsPdf sx={{ color: '#ef4444' }} />;
      case 'doc':
      case 'docx':
        return <Description sx={{ color: '#2563eb' }} />;
      case 'xls':
      case 'xlsx':
        return <TableChart sx={{ color: '#059669' }} />;
      case 'ppt':
      case 'pptx':
        return <Slideshow sx={{ color: '#dc2626' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
        return <Image sx={{ color: '#7c3aed' }} />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return <VideoFile sx={{ color: '#db2777' }} />;
      case 'mp3':
      case 'wav':
      case 'flac':
        return <AudioFile sx={{ color: '#059669' }} />;
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
        return <Code sx={{ color: '#6366f1' }} />;
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive sx={{ color: '#8b5cf6' }} />;
      default:
        return <InsertDriveFile sx={{ color: '#6b7280' }} />;
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          載入中...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Breadcrumbs */}
      <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0' }}>
        <Breadcrumbs>
          {getPathSegments(currentPath).map((segment, index) => (
            <Link
              key={index}
              component="button"
              variant="body2"
              onClick={() => handleBreadcrumbClick(segment.path)}
              sx={{
                textDecoration: 'none',
                color: '#64748b',
                '&:hover': {
                  color: '#3b82f6',
                },
              }}
            >
              {segment.name}
            </Link>
          ))}
        </Breadcrumbs>
      </Box>

      {/* File List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List>
          {items.map((item, index) => (
            <ListItem
              key={index}
              button
              onClick={() => handleItemClick(item)}
              sx={{
                '&:hover': {
                  backgroundColor: '#f8fafc',
                },
              }}
            >
              <ListItemIcon>
                {getFileIcon(item.name, item.isDirectory)}
              </ListItemIcon>
              <ListItemText
                primary={item.name}
                secondary={item.isDirectory ? '資料夾' : '文件'}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default LocalFileBrowser;
