import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, IconButton, Tooltip } from '@mui/material';
import {
  DesktopWindows,
  Folder,
  Storage,
  FolderOpen,
  Refresh
} from '@mui/icons-material';
import { useRouter } from 'next/router';

interface FileCardProps {
  title: string;
  icon: React.ReactNode;
  path: string;
  description: string;
}

const FileCard: React.FC<FileCardProps> = ({ title, icon, path, description }) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/browser?path=${encodeURIComponent(path)}&mode=local`);
  };

  return (
    <Card
      sx={{
        width: 200,
        height: 150,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        },
        '&:active': {
          transform: 'translateY(-2px)',
        },
      }}
      onClick={handleClick}
    >
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
          gap: 1,
        }}
      >
        <Box
          sx={{
            fontSize: 48,
            color: '#64748b',
            mb: 1,
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#374151',
            mb: 0.5,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontSize: '11px',
            color: '#6b7280',
            lineHeight: 1.3,
          }}
        >
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};

const LocalFileCards: React.FC = () => {
  const [paths, setPaths] = useState({
    desktop: 'Desktop',
    documents: 'Documents',
    drives: 'C:\\'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPaths = async () => {
    setIsRefreshing(true);
    try {
      if (window.electronAPI?.getDesktopPath) {
        const desktopPath = await window.electronAPI.getDesktopPath();
        const documentsPath = await window.electronAPI.getDocumentsPath();

        setPaths({
          desktop: desktopPath,
          documents: documentsPath,
          drives: process.platform === 'win32' ? 'C:\\' : '/'
        });
      }
    } catch (error) {
      console.error('Failed to load system paths:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPaths();
  }, []);

  const cards = [
    {
      title: '桌面',
      icon: <DesktopWindows sx={{ fontSize: 48 }} />,
      path: paths.desktop,
      description: '瀏覽桌面文件',
    },
    {
      title: '文件',
      icon: <FolderOpen sx={{ fontSize: 48 }} />,
      path: paths.documents,
      description: '瀏覽文件夾',
    },
    {
      title: '磁碟',
      icon: <Storage sx={{ fontSize: 48 }} />,
      path: paths.drives,
      description: '瀏覽系統磁碟',
    },
  ];

  return (
    <Box>
      {/* 標題和刷新按鈕 */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          px: 2
        }}
      >
        <Typography variant="h6" sx={{ color: '#374151', fontWeight: 600 }}>
          本地文件
        </Typography>
        <Tooltip title="刷新文件列表">
          <IconButton
            onClick={loadPaths}
            disabled={isRefreshing}
            sx={{
              color: '#6b7280',
              '&:hover': { color: '#374151' }
            }}
          >
            <Refresh sx={{
              fontSize: 20,
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* 文件卡片 */}
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          mt: 2,
        }}
      >
        {cards.map((card, index) => (
          <FileCard
            key={index}
            title={card.title}
            icon={card.icon}
            path={card.path}
            description={card.description}
          />
        ))}
      </Box>
    </Box>
  );
};

export default LocalFileCards;
