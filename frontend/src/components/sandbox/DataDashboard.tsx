import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, PieChart, Activity, Download, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import SocialMediaAnalytics from '@/components/sandbox/SocialMediaAnalytics';
import { DataTab } from '@/pages/sandbox-election';

interface DataDashboardProps {
  dataTab: DataTab;
  onClose: () => void;
  className?: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
  }[];
}

interface AnalysisMetrics {
  totalRecords: number;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  engagement: {
    high: number;
    medium: number;
    low: number;
  };
  trends: {
    period: string;
    change: number;
    direction: 'up' | 'down' | 'stable';
  }[];
  topKeywords: {
    word: string;
    count: number;
    sentiment: number;
  }[];
}

export const DataDashboard: React.FC<DataDashboardProps> = ({
  dataTab,
  onClose,
  className,
}) => {
  const [metrics, setMetrics] = useState<AnalysisMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRawData, setShowRawData] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'analysis' | 'raw'>('dashboard');

  // Mock data generation
  useEffect(() => {
    const generateMockData = () => {
      const mockMetrics: AnalysisMetrics = {
        totalRecords: dataTab.data?.length || Math.floor(Math.random() * 5000) + 1000,
        sentiment: {
          positive: Math.floor(Math.random() * 40) + 30,
          negative: Math.floor(Math.random() * 30) + 15,
          neutral: Math.floor(Math.random() * 35) + 35,
        },
        engagement: {
          high: Math.floor(Math.random() * 25) + 15,
          medium: Math.floor(Math.random() * 40) + 35,
          low: Math.floor(Math.random() * 35) + 25,
        },
        trends: [
          { period: '本週', change: Math.random() * 20 - 10, direction: Math.random() > 0.5 ? 'up' : 'down' },
          { period: '本月', change: Math.random() * 30 - 15, direction: Math.random() > 0.5 ? 'up' : 'down' },
          { period: '本季', change: Math.random() * 40 - 20, direction: Math.random() > 0.5 ? 'up' : 'down' },
        ],
        topKeywords: [
          { word: '政策', count: Math.floor(Math.random() * 500) + 200, sentiment: Math.random() * 2 - 1 },
          { word: '選舉', count: Math.floor(Math.random() * 400) + 150, sentiment: Math.random() * 2 - 1 },
          { word: '經濟', count: Math.floor(Math.random() * 350) + 100, sentiment: Math.random() * 2 - 1 },
          { word: '民生', count: Math.floor(Math.random() * 300) + 80, sentiment: Math.random() * 2 - 1 },
          { word: '改革', count: Math.floor(Math.random() * 250) + 60, sentiment: Math.random() * 2 - 1 },
        ],
      };

      const mockChartData: ChartData = {
        labels: ['正面', '負面', '中性'],
        datasets: [{
          label: '情感分析',
          data: [mockMetrics.sentiment.positive, mockMetrics.sentiment.negative, mockMetrics.sentiment.neutral],
          backgroundColor: ['#10B981', '#EF4444', '#6B7280'],
        }],
      };

      setMetrics(mockMetrics);
      setChartData(mockChartData);
      setIsLoading(false);
    };

    // Simulate loading
    setTimeout(generateMockData, 1000);
  }, [dataTab]);

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-green-600';
    if (sentiment < -0.3) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className={cn("h-full flex items-center justify-center bg-background", className)}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-muted-foreground">正在分析數據...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col bg-background overflow-hidden pb-14", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">
              {dataTab.source.toUpperCase()} 數據分析
            </h1>
            <p className="text-sm text-muted-foreground">
              {dataTab.date} {dataTab.time} | {metrics?.totalRecords} 筆資料
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              匯出
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              關閉
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Check if this is an analytics tab */}
        {dataTab.isAnalytics ? (
          <SocialMediaAnalytics
            analyticsData={{
              source: dataTab.source,
              data: dataTab.data,
              sourceName: dataTab.source.charAt(0).toUpperCase() + dataTab.source.slice(1)
            }}
          />
        ) : currentView === 'dashboard' && metrics && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">總資料筆數</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalRecords.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">正面情感</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{metrics.sentiment.positive}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">負面情感</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{metrics.sentiment.negative}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">中性情感</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-600">{metrics.sentiment.neutral}%</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sentiment Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="w-5 h-5 mr-2" />
                    情感分析分布
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                    <div className="text-center">
                      <PieChart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-muted-foreground">圓餅圖 (需要圖表庫)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Engagement Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    參與度分析
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-muted-foreground">長條圖 (需要圖表庫)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trends and Keywords */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>趨勢分析</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.trends.map((trend, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{trend.period}</span>
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(trend.direction)}
                          <span className={cn(
                            "text-sm font-medium",
                            trend.change > 0 ? "text-green-600" : trend.change < 0 ? "text-red-600" : "text-gray-600"
                          )}>
                            {trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Keywords */}
              <Card>
                <CardHeader>
                  <CardTitle>熱門關鍵字</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.topKeywords.map((keyword, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{keyword.word}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">{keyword.count}</span>
                          <span className={cn("text-xs", getSentimentColor(keyword.sentiment))}>
                            {keyword.sentiment > 0 ? '正面' : keyword.sentiment < 0 ? '負面' : '中性'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentView === 'analysis' && (
          <Card>
            <CardHeader>
              <CardTitle>深度數據分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center bg-gray-50 rounded">
                <div className="text-center">
                  <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-muted-foreground">深度分析圖表區域</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    這裡將顯示更詳細的數據分析結果
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentView === 'raw' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                原始數據
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRawData(!showRawData)}
                >
                  {showRawData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showRawData ? '隱藏' : '顯示'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showRawData ? (
                <div className="max-h-96 overflow-auto">
                  <pre className="text-xs bg-gray-50 p-4 rounded">
                    {JSON.stringify(dataTab.data?.slice(0, 10) || [], null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center bg-gray-50 rounded">
                  <p className="text-muted-foreground">點擊顯示按鈕查看原始數據</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DataDashboard;
