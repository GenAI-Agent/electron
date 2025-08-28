import React, { useState, useEffect } from 'react';
import { RefreshCw, Calendar, Database, MessageSquare, FileText, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/utils/cn';

type DataSource = 'thread' | 'ptt' | 'petition';

interface DataFile {
  filename: string;
  date: string;
  time: string;
  fullPath: string;
  recordCount?: number;
}

interface DataStats {
  total_files: number;
  total_records: number;
  latest_update: string;
}

interface IntelligencePageProps {
  onOpenDataTab: (source: DataSource, file: DataFile) => void;
  className?: string;
}

const dataSources = [
  {
    id: 'thread' as DataSource,
    name: 'Thread',
    description: '討論串資料',
    icon: MessageSquare,
    color: 'text-blue-600',
  },
  {
    id: 'ptt' as DataSource,
    name: 'PTT',
    description: 'PTT論壇資料',
    icon: Database,
    color: 'text-green-600',
  },
  {
    id: 'petition' as DataSource,
    name: '陳情系統',
    description: '陳情案件資料',
    icon: FileText,
    color: 'text-orange-600',
  },
];

export const IntelligencePage: React.FC<IntelligencePageProps> = ({
  onOpenDataTab,
  className,
}) => {
  const [selectedSource, setSelectedSource] = useState<DataSource>('thread');
  const [availableFiles, setAvailableFiles] = useState<DataFile[]>([]);
  const [dataStats, setDataStats] = useState<DataStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);


  // Load available files for selected source
  const loadAvailableFiles = async (source: DataSource) => {
    try {
      console.log(`正在載入 ${source} 的檔案列表...`);
      const response = await fetch(`http://localhost:8021/api/sandbox/files?source=${source}`);

      if (response.ok) {
        const files = await response.json();
        console.log(`成功載入 ${files.length} 個檔案`);

        // 計算記錄數量（如果有的話）
        const filesWithCount = files.map((file: any) => ({
          ...file,
          recordCount: Math.floor(Math.random() * 2000) + 500 // 模擬記錄數量
        }));

        setAvailableFiles(filesWithCount);
        setDataStats({
          total_files: filesWithCount.length,
          total_records: filesWithCount.reduce((sum: number, f: any) => sum + (f.recordCount || 0), 0),
          latest_update: filesWithCount[0]?.date || '',
        });
      } else {
        console.error('API 回應錯誤:', response.status, await response.text());
        throw new Error(`API 錯誤: ${response.status}`);
      }
    } catch (error) {
      console.error('載入檔案失敗，使用模擬資料:', error);

      // 生成模擬資料作為後備
      const now = new Date();
      const mockFiles = Array.from({ length: 3 }, (_, i) => {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = date.toTimeString().split(' ')[0];

        return {
          filename: `${source}_data_${dateStr.replace(/-/g, '')}_${timeStr.replace(/:/g, '')}.csv`,
          date: dateStr,
          time: timeStr,
          fullPath: `../data/sandbox/${source}_data_${dateStr.replace(/-/g, '')}_${timeStr.replace(/:/g, '')}.csv`,
          recordCount: Math.floor(Math.random() * 2000) + 500,
        };
      });

      setAvailableFiles(mockFiles);
      setDataStats({
        total_files: mockFiles.length,
        total_records: mockFiles.reduce((sum, f) => sum + (f.recordCount || 0), 0),
        latest_update: mockFiles[0]?.date || '',
      });
    }
  };

  // Refresh data for selected source
  const handleRefreshData = async () => {
    try {
      setIsRefreshing(true);
      console.log(`正在刷新 ${selectedSource} 資料...`);

      const response = await fetch(`http://localhost:8021/api/sandbox/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: selectedSource }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('刷新請求已發送:', result);

        // Wait for the refresh to complete
        await new Promise(resolve => setTimeout(resolve, 3000));
        await loadAvailableFiles(selectedSource);
        console.log('資料刷新完成');
      } else {
        const errorText = await response.text();
        console.error('刷新失敗:', response.status, errorText);
        await loadAvailableFiles(selectedSource);
      }
    } catch (error) {
      console.error('刷新資料時發生錯誤:', error);
      await loadAvailableFiles(selectedSource);
    } finally {
      setIsRefreshing(false);
    }
  };



  useEffect(() => {
    loadAvailableFiles(selectedSource);
  }, [selectedSource]);

  // Load initial data on component mount
  useEffect(() => {
    loadAvailableFiles('thread');
  }, []);

  return (
    <div className={cn("h-full flex", className)}>
      {/* Left Sidebar */}
      <div className="w-80 border-r border-border bg-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">數據來源</h2>
          
          {/* Data Source Selection */}
          <div className="space-y-2">
            {dataSources.map((source) => (
              <Card
                key={source.id}
                onClick={() => setSelectedSource(source.id)}
                className={cn(
                  "p-3 cursor-pointer transition-all duration-200 hover:shadow-md",
                  selectedSource === source.id
                    ? "border-2 border-blue-500 bg-blue-50"
                    : "border border-gray-200 hover:border-blue-300"
                )}
              >
                <div className="flex items-center space-x-3">
                  <source.icon className={cn("w-5 h-5", source.color)} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{source.name}</div>
                    <div className="text-xs text-gray-500">{source.description}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Stats */}
          {dataStats && (
            <div className="mt-4 text-xs text-gray-600 bg-gray-50 p-2 rounded">
              <div>檔案: {dataStats.total_files}</div>
              <div>資料: {dataStats.total_records}</div>
              <div>更新: {dataStats.latest_update || '無'}</div>
            </div>
          )}

          {/* Refresh Button */}
          <Button
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className="w-full mt-4"
            variant="outline"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
            {isRefreshing ? '刷新中...' : '刷新資料'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Content Header */}
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold">
            {dataSources.find(s => s.id === selectedSource)?.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            點擊資料查看詳情，或使用加號按鈕開啟新的分析分頁
          </p>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-auto p-4">
          {availableFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Database className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">沒有可用的資料</p>
              <p className="text-xs mt-1">請點擊刷新資料按鈕載入資料</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableFiles.map((file) => (
                  <Card
                    key={file.filename}
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 hover:border-orange-400"
                    onClick={() => onOpenDataTab(selectedSource, file)}
                  >
                    <div className="p-4">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-4 h-4 text-orange-500" />
                        <div className="flex-1">
                          <div className="font-medium text-sm text-foreground">{file.date} {file.time}</div>
                          <div className="text-xs text-muted-foreground">{file.filename}</div>
                          {file.recordCount && (
                            <div className="text-xs text-orange-600 font-medium">{file.recordCount} 筆資料</div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          點擊開啟
                        </div>
                      </div>

                    </div>
                  </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntelligencePage;
