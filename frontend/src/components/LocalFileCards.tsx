import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Folder,
  HardDrive,
  FolderOpen
} from 'lucide-react';
import { useRouter } from 'next/router';
import { cn } from '@/utils/cn';

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
    <div
      className="w-[200px] h-[150px] bg-card rounded-lg border border-border cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg hover:border-primary/50 group"
      onClick={handleClick}
    >
      <div className="flex flex-col items-center justify-center h-full text-center gap-2 p-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
          <div className="text-primary">
            {icon}
          </div>
        </div>
        <h6 className="text-sm font-semibold text-foreground mb-1">
          {title}
        </h6>
        <p className="text-xs text-muted-foreground leading-tight">
          {description}
        </p>
      </div>
    </div>
  );
};

const LocalFileCards: React.FC = () => {
  const [paths, setPaths] = useState({
    desktop: 'Desktop',
    documents: 'Documents',
    drives: 'C:\\'
  });

  const loadPaths = async () => {
    try {
      if (window.electronAPI?.getDesktopPath) {
        const desktopPath = await window.electronAPI.getDesktopPath();
        const documentsPath = await window.electronAPI.getDocumentsPath();

        console.log('Loaded paths:', { desktopPath, documentsPath });

        setPaths({
          desktop: desktopPath,
          documents: documentsPath,
          drives: process.platform === 'win32' ? 'C:\\' : '/'
        });
      } else {
        console.error('electronAPI not available');
      }
    } catch (error) {
      console.error('Failed to load system paths:', error);
    }
  };

  useEffect(() => {
    loadPaths();
  }, []);

  const cards = [
    {
      title: '桌面',
      icon: <Monitor className="w-6 h-6" />,
      path: paths.desktop,
      description: '瀏覽桌面文件',
    },
    {
      title: '文件',
      icon: <FolderOpen className="w-6 h-6" />,
      path: paths.documents,
      description: '瀏覽文件夾',
    },
    {
      title: '磁碟',
      icon: <HardDrive className="w-6 h-6" />,
      path: paths.drives,
      description: '瀏覽系統磁碟',
    },
  ];

  return (
    <div>
      {/* 文件卡片 */}
      <div className="flex gap-3 justify-center items-center flex-wrap">
        {cards.map((card, index) => (
          <FileCard
            key={index}
            title={card.title}
            icon={card.icon}
            path={card.path}
            description={card.description}
          />
        ))}
      </div>
    </div>
  );
};

export default LocalFileCards;
