import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, MapPin, Clock, Users, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface WarReport {
  id: string;
  title: string;
  type: 'urgent' | 'warning' | 'info';
  timestamp: string;
  source: string;
  summary: string;
  metrics: {
    sentiment: number; // -1 to 1
    engagement: number;
    reach: number;
    trend: 'up' | 'down' | 'stable';
  };
  location?: string;
  tags: string[];
}

interface WarRoomPageProps {
  className?: string;
}

const mockWarReports: WarReport[] = [
  {
    id: '1',
    title: '選情緊急警報：北部地區民調急劇下滑',
    type: 'urgent',
    timestamp: '2024-12-01 14:30',
    source: 'Thread + PTT 綜合分析',
    summary: '根據最新數據分析，北部地區支持度在過去24小時內下降8.5%，主要原因為政策爭議擴散',
    metrics: {
      sentiment: -0.65,
      engagement: 8500,
      reach: 125000,
      trend: 'down'
    },
    location: '台北市、新北市',
    tags: ['民調', '政策爭議', '北部', '緊急']
  },
  {
    id: '2',
    title: '中南部選情穩定，青年族群支持度上升',
    type: 'info',
    timestamp: '2024-12-01 12:15',
    source: 'PTT 論壇分析',
    summary: '中南部地區整體選情穩定，特別是18-35歲青年族群支持度較上週提升3.2%',
    metrics: {
      sentiment: 0.42,
      engagement: 3200,
      reach: 45000,
      trend: 'up'
    },
    location: '台中市、台南市、高雄市',
    tags: ['青年', '中南部', '穩定成長']
  },
  {
    id: '3',
    title: '網路輿情異常：特定議題討論量暴增',
    type: 'warning',
    timestamp: '2024-12-01 10:45',
    source: '陳情系統 + Thread',
    summary: '發現特定政策議題在網路上討論量異常增加300%，需要密切關注發展趨勢',
    metrics: {
      sentiment: -0.23,
      engagement: 12000,
      reach: 89000,
      trend: 'up'
    },
    tags: ['網路輿情', '異常', '政策議題']
  }
];

const getReportTypeColor = (type: string) => {
  switch (type) {
    case 'urgent':
      return 'border-red-500 bg-red-50 text-red-700';
    case 'warning':
      return 'border-yellow-500 bg-yellow-50 text-yellow-700';
    case 'info':
      return 'border-blue-500 bg-blue-50 text-blue-700';
    default:
      return 'border-gray-500 bg-gray-50 text-gray-700';
  }
};

const getReportTypeIcon = (type: string) => {
  switch (type) {
    case 'urgent':
      return <AlertTriangle className="w-4 h-4" />;
    case 'warning':
      return <Activity className="w-4 h-4" />;
    case 'info':
      return <MessageCircle className="w-4 h-4" />;
    default:
      return <MessageCircle className="w-4 h-4" />;
  }
};

export const WarRoomPage: React.FC<WarRoomPageProps> = ({ className }) => {
  const [selectedReport, setSelectedReport] = useState<WarReport | null>(mockWarReports[0]);
  const [reports] = useState<WarReport[]>(mockWarReports);

  const formatSentiment = (sentiment: number) => {
    if (sentiment > 0.3) return { text: '正面', color: 'text-green-600' };
    if (sentiment < -0.3) return { text: '負面', color: 'text-red-600' };
    return { text: '中性', color: 'text-gray-600' };
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className={cn("h-full flex", className)}>
      {/* Left Sidebar - War Reports */}
      <div className="w-80 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">戰情報告</h2>
          <p className="text-sm text-muted-foreground mt-1">即時選情分析與警報</p>
        </div>
        
        <div className="flex-1 overflow-auto p-2">
          <div className="space-y-2">
            {reports.map((report) => (
              <Card
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md border-l-4",
                  selectedReport?.id === report.id ? "ring-2 ring-blue-500" : "",
                  getReportTypeColor(report.type)
                )}
              >
                <CardContent className="p-3">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 mt-0.5">
                      {getReportTypeIcon(report.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium line-clamp-2 mb-1">
                        {report.title}
                      </h4>
                      <div className="flex items-center text-xs text-muted-foreground mb-2">
                        <Clock className="w-3 h-3 mr-1" />
                        {report.timestamp}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{report.source}</span>
                        <div className="flex items-center space-x-1">
                          {report.metrics.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                          {report.metrics.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                          <span className={formatSentiment(report.metrics.sentiment).color}>
                            {formatSentiment(report.metrics.sentiment).text}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Analysis Dashboard */}
      <div className="flex-1 flex flex-col">
        {selectedReport ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold text-foreground mb-2">
                    {selectedReport.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {selectedReport.timestamp}
                    </div>
                    <div className="flex items-center">
                      <Activity className="w-4 h-4 mr-1" />
                      {selectedReport.source}
                    </div>
                    {selectedReport.location && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {selectedReport.location}
                      </div>
                    )}
                  </div>
                </div>
                <div className={cn("px-3 py-1 rounded-full text-xs font-medium", getReportTypeColor(selectedReport.type))}>
                  {selectedReport.type.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">情感分析</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      <span className={formatSentiment(selectedReport.metrics.sentiment).color}>
                        {formatSentiment(selectedReport.metrics.sentiment).text}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(selectedReport.metrics.sentiment * 100).toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">參與度</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatNumber(selectedReport.metrics.engagement)}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      互動次數
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">觸及範圍</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatNumber(selectedReport.metrics.reach)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      人次瀏覽
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">趨勢</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      {selectedReport.metrics.trend === 'up' && <TrendingUp className="w-6 h-6 text-green-500" />}
                      {selectedReport.metrics.trend === 'down' && <TrendingDown className="w-6 h-6 text-red-500" />}
                      {selectedReport.metrics.trend === 'stable' && <Activity className="w-6 h-6 text-gray-500" />}
                      <span className="text-lg font-semibold capitalize">
                        {selectedReport.metrics.trend === 'up' ? '上升' : 
                         selectedReport.metrics.trend === 'down' ? '下降' : '穩定'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>分析摘要</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedReport.summary}
                  </p>
                </CardContent>
              </Card>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {selectedReport.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>選擇一個戰情報告查看詳細分析</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarRoomPage;
