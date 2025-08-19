import React, { useState, useEffect } from 'react';
import { 
  Monitor,
  Folder,
  HardDrive,
  FolderOpen,
  RefreshCw
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
      className="w-[200px] h-[150px] bg-white rounded-lg shadow-md border border-slate-200 cursor-pointer transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] active:translate-y-0"
      onClick={handleClick}
    >
      <div className="flex flex-col items-center justify-center h-full text-center gap-1 p-4">
        <div className="text-slate-500 mb-1">
          {icon}
        </div>
        <h6 className="text-sm font-semibold text-gray-700 mb-0.5">
          {title}
        </h6>
        <p className="text-[11px] text-gray-500 leading-tight">
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
      icon: <Monitor className="w-12 h-12" />,
      path: paths.desktop,
      description: '瀏覽桌面文件',
    },
    {
      title: '文件',
      icon: <FolderOpen className="w-12 h-12" />,
      path: paths.documents,
      description: '瀏覽文件夾',
    },
    {
      title: '磁碟',
      icon: <HardDrive className="w-12 h-12" />,
      path: paths.drives,
      description: '瀏覽系統磁碟',
    },
  ];

  return (
    <div>
      {/* 標題和刷新按鈕 */}
      <div className="flex justify-between items-center mb-2 px-2">
        <h6 className="text-gray-700 font-semibold text-lg">
          本地文件
        </h6>
        <div className="relative group">
          <button
            onClick={loadPaths}
            disabled={isRefreshing}
            className={cn(
              "p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors",
              isRefreshing && "cursor-not-allowed"
            )}
          >
            <RefreshCw 
              className={cn(
                "w-5 h-5",
                isRefreshing && "animate-spin"
              )}
            />
          </button>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            刷新文件列表
          </div>
        </div>
      </div>

      {/* 文件卡片 */}
      <div className="flex gap-3 justify-center items-center flex-wrap mt-2">
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
