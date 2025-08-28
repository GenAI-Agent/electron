import React, { useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { useRouter } from 'next/router';
import Header, { ViewMode } from '@/components/ui/header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import LocalFileCards from '@/components/LocalFileCards';

const LocalPage: React.FC = () => {
  const [path, setPath] = useState('');
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('with-agent');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (path.trim()) {
      router.push(`/browser?path=${encodeURIComponent(path.trim())}&mode=local`);
    } else {
      alert('請輸入有效的檔案路徑');
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col pt-10 bg-background m-0 p-0">
      {/* Header */}
      <Header
        title="Desktop File Explorer"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
        {/* 主標題和描述 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            桌面文件瀏覽器
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            透過 AGI 處理桌面數據，自定義規則讓 AI 理解並處理您的本地文件
          </p>
        </div>

        {/* File Path Input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 w-full max-w-2xl"
        >
          <Input
            placeholder="輸入檔案路徑..."
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="lg">
            <FolderOpen className="w-5 h-5 mr-2" />
            開啟
          </Button>
        </form>

        {/* Local File Cards - 使用真實的文件系統組件 */}
        <LocalFileCards />
      </div>
    </div>
  );
};

export default LocalPage;

