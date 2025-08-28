import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, MapPin, Clock, Users, MessageCircle, Plus, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import IconSidebar from '@/components/ui/IconSidebar';
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

  // 準備側邊欄項目數據
  const sidebarItems = reports.map((report) => ({
    id: report.id,
    icon: report.id === selectedReport?.id ? AlertTriangle :
          report.type === 'urgent' ? AlertTriangle :
          report.type === 'warning' ? Activity : FileText,
    label: report.title,
    isActive: report.id === selectedReport?.id,
    onClick: () => setSelectedReport(report),
    color: report.id === selectedReport?.id ? 'orange' :
           report.type === 'urgent' ? 'red' :
           report.type === 'warning' ? 'orange' : 'gray',
    description: report.summary,
    metadata: `${report.timestamp} • ${report.source} • ${formatSentiment(report.metrics.sentiment).text}`
  }));

  const handleAddNew = () => {
    // 創建新戰情報告的邏輯
    console.log('創建新戰情報告');
  };

  return (
    <div className={cn("h-full flex overflow-hidden", className)}>
      {/* Left Icon Sidebar */}
      <IconSidebar
        items={sidebarItems}
        onAddNew={handleAddNew}
      />

      {/* Main Content - Map and Analysis Dashboard */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {selectedReport ? (
          <div className="flex flex-col">
            {/* Fixed-height Map Section */}
            <div className="h-80 relative bg-gradient-to-br from-blue-50 to-indigo-100 flex-shrink-0">
              {/* Map Container */}
              <div className="absolute inset-0 flex items-center justify-center p-8">
                {/* Taiwan Map Placeholder - 更狹長的比例 */}
                <div className="relative max-w-md h-full">
                  <svg viewBox="0 0 300 500" className="w-full h-full">
                    {/* Taiwan outline */}
                    <path
                      d="M200 50 L250 80 L280 120 L290 180 L285 240 L270 300 L250 360 L220 420 L180 450 L140 420 L120 360 L110 300 L115 240 L130 180 L150 120 L180 80 Z"
                      fill="rgba(59, 130, 246, 0.1)"
                      stroke="rgba(59, 130, 246, 0.3)"
                      strokeWidth="2"
                    />

                    {/* Location markers based on report */}
                    {selectedReport.location && (
                      <g>
                        <circle
                          cx="200"
                          cy="200"
                          r="8"
                          fill={selectedReport.type === 'urgent' ? '#ef4444' : selectedReport.type === 'warning' ? '#f59e0b' : '#3b82f6'}
                          className="animate-pulse"
                        />
                        <circle
                          cx="200"
                          cy="200"
                          r="16"
                          fill="none"
                          stroke={selectedReport.type === 'urgent' ? '#ef4444' : selectedReport.type === 'warning' ? '#f59e0b' : '#3b82f6'}
                          strokeWidth="2"
                          opacity="0.5"
                          className="animate-ping"
                        />
                      </g>
                    )}

                    {/* Additional markers for other reports */}
                    {reports.filter(r => r.id !== selectedReport.id).slice(0, 3).map((report, index) => (
                      <circle
                        key={report.id}
                        cx={150 + index * 100}
                        cy={150 + index * 50}
                        r="4"
                        fill={report.type === 'urgent' ? '#ef4444' : report.type === 'warning' ? '#f59e0b' : '#6b7280'}
                        opacity="0.7"
                      />
                    ))}
                  </svg>

                  {/* Map overlay info */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                    <div className="text-sm font-medium text-gray-900">{selectedReport.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{selectedReport.location || '全台灣'}</div>
                    <div className="flex items-center mt-2 text-xs">
                      <div className={cn("w-2 h-2 rounded-full mr-2",
                        selectedReport.type === 'urgent' ? 'bg-red-500' :
                        selectedReport.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                      )}></div>
                      {selectedReport.type.toUpperCase()}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                    <div className="text-xs font-medium text-gray-900 mb-2">警報等級</div>
                    <div className="space-y-1">
                      <div className="flex items-center text-xs">
                        <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                        緊急
                      </div>
                      <div className="flex items-center text-xs">
                        <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                        警告
                      </div>
                      <div className="flex items-center text-xs">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                        資訊
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Monitor Section */}
            <div className="bg-gray-900 text-white p-6 flex-shrink-0">
              <div className="grid grid-cols-4 gap-6">
                {/* Real-time Status */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-300">即時狀態</h4>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-2xl font-bold text-green-400">ACTIVE</div>
                  <div className="text-xs text-gray-400 mt-1">系統運行中</div>
                </div>

                {/* Alert Count */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-300">警報數量</h4>
                    <div className="text-xs text-red-400">↑ 12%</div>
                  </div>
                  <div className="text-2xl font-bold text-red-400">{reports.length}</div>
                  <div className="text-xs text-gray-400 mt-1">過去24小時</div>
                </div>

                {/* Coverage */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-300">覆蓋率</h4>
                    <div className="text-xs text-blue-400">穩定</div>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">94.2%</div>
                  <div className="text-xs text-gray-400 mt-1">全台監控</div>
                </div>

                {/* Response Time */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-300">響應時間</h4>
                    <div className="text-xs text-green-400">優良</div>
                  </div>
                  <div className="text-2xl font-bold text-green-400">1.2s</div>
                  <div className="text-xs text-gray-400 mt-1">平均延遲</div>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="mt-6 grid grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">資料處理進度</span>
                    <span className="text-blue-400">87%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-400 h-2 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">分析完成度</span>
                    <span className="text-green-400">92%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-400 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Comprehensive Dashboard */}
            <div className="border-t border-border bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 flex-shrink-0 overflow-y-auto">
              <div className="p-6">
                {/* Top Metrics Row */}
                <div className="grid grid-cols-4 gap-6 mb-6">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">情感分析</h4>
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="text-2xl font-bold">
                      <span className={formatSentiment(selectedReport.metrics.sentiment).color}>
                        {formatSentiment(selectedReport.metrics.sentiment).text}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {selectedReport.metrics.sentiment.toFixed(1)}% 支持度
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">參與度</h4>
                      <div className="text-xs text-blue-600 dark:text-blue-400">↑ 8.2%</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatNumber(selectedReport.metrics.engagement)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">互動次數</div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">觸及範圍</h4>
                      <div className="text-xs text-purple-600 dark:text-purple-400">穩定</div>
                    </div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {formatNumber(selectedReport.metrics.reach)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">覆蓋人數</div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">趨勢</h4>
                      <div className="flex items-center justify-center">
                        {selectedReport.metrics.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                        {selectedReport.metrics.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                        {selectedReport.metrics.trend === 'stable' && <Activity className="w-4 h-4 text-gray-500" />}
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      <span className={selectedReport.metrics.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                                     selectedReport.metrics.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                                     'text-gray-600 dark:text-gray-400'}>
                        {selectedReport.metrics.trend === 'up' ? '上升' :
                         selectedReport.metrics.trend === 'down' ? '下降' : '穩定'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">變化趨勢</div>
                  </div>
                </div>

                {/* Charts and Analysis Row */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                  {/* Sentiment Chart */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">情感分佈</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400">正面</span>
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">65%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400">中性</span>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">25%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                        <div className="bg-gray-400 h-2 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400">負面</span>
                        <span className="text-xs font-medium text-red-600 dark:text-red-400">10%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Time Series */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">24小時趨勢</h4>
                    <div className="h-20 flex items-end justify-between space-x-1">
                      {[45, 52, 48, 61, 55, 67, 72, 68, 74, 69, 71, 75].map((height, i) => (
                        <div key={i} className="bg-blue-400 rounded-t" style={{ height: `${height}%`, width: '6px' }}></div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <span>00:00</span>
                      <span>12:00</span>
                      <span>24:00</span>
                    </div>
                  </div>

                  {/* Key Topics */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">熱門話題</h4>
                    <div className="space-y-2">
                      {selectedReport.tags.slice(0, 4).map((tag, index) => (
                        <div key={tag} className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">{tag}</span>
                          <div className="flex items-center">
                            <div className="w-12 bg-gray-200 dark:bg-slate-600 rounded-full h-1 mr-2">
                              <div
                                className="bg-orange-400 h-1 rounded-full"
                                style={{ width: `${85 - index * 15}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{85 - index * 15}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Summary */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">分析摘要</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {selectedReport.summary}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedReport.tags.slice(0, 6).map((tag, index) => (
                      <span key={index} className="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs border border-blue-200 dark:border-blue-700">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
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
