import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { 
  Users, 
  TrendingUp, 
  Plane, 
  MapPin, 
  Clock, 
  BarChart3,
  Activity,
  Search,
  Calendar,
  Globe
} from 'lucide-react';

interface UserDashboardPageProps {
  className?: string;
  onOpenDataTab?: (source: string, file: any, data?: any[]) => void;
}

interface CEOMetrics {
  // 核心KPI
  revenue: { current: number; change: number; trend: 'up' | 'down' };
  loadFactor: { current: number; change: number; trend: 'up' | 'down' };
  onTimePerformance: { current: number; change: number; trend: 'up' | 'down' };
  customerSatisfaction: { current: number; change: number; trend: 'up' | 'down' };

  // 客訴分析
  complaints: {
    total: number;
    change: number;
    categories: Array<{
      category: string;
      count: number;
      change: number;
      severity: 'high' | 'medium' | 'low';
      avgResolutionTime: number;
    }>;
    topIssues: Array<{
      issue: string;
      count: number;
      impact: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
  };

  // 地理分析
  geoAnalysis: Array<{
    country: string;
    city: string;
    userActivity: number;
    flightDemand: number;
    revenue: number;
    growth: number;
    marketShare: number;
  }>;

  // 競爭對手比較
  competitorComparison: Array<{
    metric: string;
    ourValue: number;
    competitorAvg: number;
    ranking: number;
    trend: 'improving' | 'declining' | 'stable';
  }>;

  // 預警系統
  alerts: Array<{
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    impact: string;
    actionRequired: boolean;
    timestamp: string;
  }>;
}

// Mock data for CEO dashboard
const mockCEOMetrics: CEOMetrics = {
  revenue: { current: 18500000000, change: 12.5, trend: 'up' },
  loadFactor: { current: 82.3, change: -2.1, trend: 'down' },
  onTimePerformance: { current: 87.8, change: 3.2, trend: 'up' },
  customerSatisfaction: { current: 4.2, change: -0.3, trend: 'down' },

  complaints: {
    total: 1247,
    change: 15.8,
    categories: [
      { category: '班機延誤', count: 423, change: 22.1, severity: 'high', avgResolutionTime: 2.5 },
      { category: '行李問題', count: 298, change: -8.3, severity: 'medium', avgResolutionTime: 1.8 },
      { category: '餐點服務', count: 187, change: 5.2, severity: 'low', avgResolutionTime: 0.5 },
      { category: '座位問題', count: 156, change: 18.7, severity: 'medium', avgResolutionTime: 1.2 },
      { category: '客服態度', count: 183, change: 31.4, severity: 'high', avgResolutionTime: 3.1 },
    ],
    topIssues: [
      { issue: '天候因素導致延誤', count: 234, impact: 85, trend: 'increasing' },
      { issue: '地勤作業延遲', count: 189, impact: 72, trend: 'stable' },
      { issue: '機械故障', count: 98, impact: 95, trend: 'decreasing' },
      { issue: '行李轉運錯誤', count: 156, impact: 68, trend: 'increasing' },
    ]
  },

  geoAnalysis: [
    { country: '日本', city: '東京', userActivity: 8920, flightDemand: 95, revenue: 2850000000, growth: 15.2, marketShare: 28.5 },
    { country: '韓國', city: '首爾', userActivity: 7650, flightDemand: 88, revenue: 2450000000, growth: 22.8, marketShare: 35.2 },
    { country: '泰國', city: '曼谷', userActivity: 6430, flightDemand: 82, revenue: 1980000000, growth: 8.3, marketShare: 22.8 },
    { country: '新加坡', city: '新加坡', userActivity: 5890, flightDemand: 75, revenue: 1750000000, growth: -3.2, marketShare: 18.7 },
    { country: '香港', city: '香港', userActivity: 5120, flightDemand: 70, revenue: 1420000000, growth: -8.1, marketShare: 15.3 },
  ],

  competitorComparison: [
    { metric: '準點率', ourValue: 87.8, competitorAvg: 85.2, ranking: 2, trend: 'improving' },
    { metric: '客戶滿意度', ourValue: 4.2, competitorAvg: 4.1, ranking: 3, trend: 'declining' },
    { metric: '載客率', ourValue: 82.3, competitorAvg: 84.1, ranking: 4, trend: 'declining' },
    { metric: '市場份額', ourValue: 32.1, competitorAvg: 20.5, ranking: 1, trend: 'stable' },
  ],

  alerts: [
    {
      id: 'alert-001',
      type: 'critical',
      title: '客訴量異常增加',
      description: '本週客訴量較上週增加31.4%，主要集中在客服態度問題',
      impact: '可能影響品牌聲譽和客戶忠誠度',
      actionRequired: true,
      timestamp: '2025-09-01T10:30:00Z'
    },
    {
      id: 'alert-002',
      type: 'warning',
      title: '載客率下降',
      description: '本月載客率較上月下降2.1%，低於競爭對手平均',
      impact: '影響營收和成本效益',
      actionRequired: true,
      timestamp: '2025-09-01T09:15:00Z'
    },
    {
      id: 'alert-003',
      type: 'info',
      title: '準點率改善',
      description: '本月準點率提升3.2%，超越多數競爭對手',
      impact: '正面影響客戶滿意度',
      actionRequired: false,
      timestamp: '2025-09-01T08:45:00Z'
    }
  ]
};

export const UserDashboardPage: React.FC<UserDashboardPageProps> = ({
  className,
  onOpenDataTab
}) => {
  const [metrics, setMetrics] = useState<CEOMetrics>(mockCEOMetrics);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedView, setSelectedView] = useState<'overview' | 'complaints' | 'geo' | 'competition'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  const handleDataExport = (dataType: string) => {
    if (onOpenDataTab) {
      const mockFile = {
        filename: `ceo_${dataType}_${new Date().toISOString().split('T')[0]}.csv`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        fullPath: `marketing-sandbox/ceo_${dataType}.csv`
      };

      let mockData: any[] = [];
      switch (dataType) {
        case 'complaints':
          mockData = metrics.complaints.categories;
          break;
        case 'geo':
          mockData = metrics.geoAnalysis;
          break;
        case 'competition':
          mockData = metrics.competitorComparison;
          break;
        case 'alerts':
          mockData = metrics.alerts;
          break;
      }

      onOpenDataTab('user', mockFile, mockData);
    }
  };

  const getChangeIcon = (trend: 'up' | 'down') => {
    return trend === 'up' ?
      <TrendingUp className="w-4 h-4 text-green-500" /> :
      <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
  };

  const getAlertIcon = (type: 'critical' | 'warning' | 'info') => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };



  return (
    <div className={cn("h-full overflow-y-auto p-6 bg-gray-50", className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CEO 營運儀錶板</h1>
            <p className="text-gray-600 mt-1">核心指標監控、客訴分析與競爭情報</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* View Selector */}
            <div className="flex bg-white rounded-lg p-1 shadow-sm border">
              {[
                { id: 'overview', name: '總覽' },
                { id: 'complaints', name: '客訴' },
                { id: 'geo', name: '地理' },
                { id: 'competition', name: '競爭' }
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => setSelectedView(view.id as any)}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    selectedView === view.id
                      ? "bg-blue-500 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {view.name}
                </button>
              ))}
            </div>

            {/* Time Range Selector */}
            <div className="flex bg-white rounded-lg p-1 shadow-sm border">
              {(['24h', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    selectedTimeRange === range
                      ? "bg-green-500 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {range === '24h' ? '24小時' : range === '7d' ? '7天' : '30天'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 預警系統 - 始終顯示 */}
      {metrics.alerts.filter(alert => alert.actionRequired).length > 0 && (
        <div className="mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-red-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-red-700 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                緊急預警
              </h3>
              <button
                onClick={() => handleDataExport('alerts')}
                className="text-sm text-red-600 hover:text-red-800"
              >
                查看所有預警
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {metrics.alerts.filter(alert => alert.actionRequired).map((alert) => (
                <div key={alert.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start space-x-2">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <h4 className="font-medium text-red-900">{alert.title}</h4>
                      <p className="text-sm text-red-700 mt-1">{alert.description}</p>
                      <p className="text-xs text-red-600 mt-2">影響: {alert.impact}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 核心KPI指標 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-gray-600">營收 (月)</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(metrics.revenue.current / 1000000000).toFixed(1)}B
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
          <div className="flex items-center space-x-2">
            {getChangeIcon(metrics.revenue.trend)}
            <span className={cn(
              "text-sm font-medium",
              metrics.revenue.trend === 'up' ? "text-green-600" : "text-red-600"
            )}>
              {metrics.revenue.change > 0 ? '+' : ''}{metrics.revenue.change}%
            </span>
            <span className="text-xs text-gray-500">vs 上月</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-gray-600">載客率</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.loadFactor.current}%</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
          <div className="flex items-center space-x-2">
            {getChangeIcon(metrics.loadFactor.trend)}
            <span className={cn(
              "text-sm font-medium",
              metrics.loadFactor.trend === 'up' ? "text-green-600" : "text-red-600"
            )}>
              {metrics.loadFactor.change > 0 ? '+' : ''}{metrics.loadFactor.change}%
            </span>
            <span className="text-xs text-gray-500">vs 上月</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-gray-600">準點率</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.onTimePerformance.current}%</p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
          <div className="flex items-center space-x-2">
            {getChangeIcon(metrics.onTimePerformance.trend)}
            <span className={cn(
              "text-sm font-medium",
              metrics.onTimePerformance.trend === 'up' ? "text-green-600" : "text-red-600"
            )}>
              {metrics.onTimePerformance.change > 0 ? '+' : ''}{metrics.onTimePerformance.change}%
            </span>
            <span className="text-xs text-gray-500">vs 上月</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-gray-600">客戶滿意度</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.customerSatisfaction.current}/5.0</p>
            </div>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="flex items-center space-x-2">
            {getChangeIcon(metrics.customerSatisfaction.trend)}
            <span className={cn(
              "text-sm font-medium",
              metrics.customerSatisfaction.trend === 'up' ? "text-green-600" : "text-red-600"
            )}>
              {metrics.customerSatisfaction.change > 0 ? '+' : ''}{metrics.customerSatisfaction.change}
            </span>
            <span className="text-xs text-gray-500">vs 上月</span>
          </div>
        </div>
      </div>

      {/* 主要內容區域 - 根據選擇的視圖顯示不同內容 */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 地理分析概覽 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">主要市場表現</h3>
              <button
                onClick={() => handleDataExport('geo')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                查看詳細數據
              </button>
            </div>

            <div className="space-y-4">
              {metrics.geoAnalysis.slice(0, 5).map((geo, index) => (
                <div key={geo.country} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <Globe className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="font-medium text-gray-900">{geo.country}</span>
                      <p className="text-xs text-gray-500">{geo.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${(geo.revenue / 1000000000).toFixed(1)}B
                      </p>
                      <p className="text-xs text-gray-500">營收</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{geo.marketShare}%</p>
                      <p className="text-xs text-gray-500">市占率</p>
                    </div>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      geo.growth > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                    )}>
                      {geo.growth > 0 ? '+' : ''}{geo.growth}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 競爭對手比較 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">競爭力分析</h3>
              <button
                onClick={() => handleDataExport('competition')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                查看詳細數據
              </button>
            </div>

            <div className="space-y-4">
              {metrics.competitorComparison.map((comp, index) => (
                <div key={comp.metric} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Target className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{comp.metric}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {comp.metric.includes('率') || comp.metric.includes('份額') ?
                          `${comp.ourValue}%` : comp.ourValue}
                      </p>
                      <p className="text-xs text-gray-500">我們</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-500">
                        {comp.metric.includes('率') || comp.metric.includes('份額') ?
                          `${comp.competitorAvg}%` : comp.competitorAvg}
                      </p>
                      <p className="text-xs text-gray-500">競爭對手平均</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        comp.ranking <= 2 ? "bg-green-50 text-green-600" :
                        comp.ranking <= 3 ? "bg-yellow-50 text-yellow-600" : "bg-red-50 text-red-600"
                      )}>
                        #{comp.ranking}
                      </span>
                      <span className={cn(
                        "text-xs",
                        comp.trend === 'improving' ? "text-green-600" :
                        comp.trend === 'declining' ? "text-red-600" : "text-gray-600"
                      )}>
                        {comp.trend === 'improving' ? '↗' :
                         comp.trend === 'declining' ? '↘' : '→'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 客訴分析視圖 */}
      {selectedView === 'complaints' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 客訴類別分析 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">客訴類別分析</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">總計:</span>
                <span className="text-lg font-bold text-red-600">{metrics.complaints.total}</span>
                <span className={cn(
                  "text-sm font-medium",
                  metrics.complaints.change > 0 ? "text-red-600" : "text-green-600"
                )}>
                  ({metrics.complaints.change > 0 ? '+' : ''}{metrics.complaints.change}%)
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {metrics.complaints.categories.map((category, index) => (
                <div key={category.category} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{category.category}</span>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium border",
                        getSeverityColor(category.severity)
                      )}>
                        {category.severity === 'high' ? '高' :
                         category.severity === 'medium' ? '中' : '低'}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{category.count}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <span className={cn(
                        "font-medium",
                        category.change > 0 ? "text-red-600" : "text-green-600"
                      )}>
                        {category.change > 0 ? '+' : ''}{category.change}% vs 上月
                      </span>
                      <span className="text-gray-600">
                        平均處理: {category.avgResolutionTime}天
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 主要問題趨勢 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">主要問題趨勢</h3>
              <button
                onClick={() => handleDataExport('complaints')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                查看原始數據
              </button>
            </div>

            <div className="space-y-4">
              {metrics.complaints.topIssues.map((issue, index) => (
                <div key={issue.issue} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{issue.issue}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-900">{issue.count}</span>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        issue.trend === 'increasing' ? "bg-red-50 text-red-600" :
                        issue.trend === 'decreasing' ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-600"
                      )}>
                        {issue.trend === 'increasing' ? '↗ 增加' :
                         issue.trend === 'decreasing' ? '↘ 減少' : '→ 穩定'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">業務影響度</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={cn(
                            "h-2 rounded-full",
                            issue.impact > 80 ? "bg-red-500" :
                            issue.impact > 60 ? "bg-yellow-500" : "bg-green-500"
                          )}
                          style={{ width: `${issue.impact}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{issue.impact}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 地理分析視圖 */}
      {selectedView === 'geo' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">地理市場熱力圖</h3>
              <button
                onClick={() => handleDataExport('geo')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                匯出地理數據
              </button>
            </div>

            {/* 地理數據表格 */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">市場</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">用戶活躍度</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">航班需求</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">營收</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">成長率</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">市占率</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.geoAnalysis.map((geo, index) => (
                    <tr key={geo.country} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{geo.country}</div>
                          <div className="text-sm text-gray-500">{geo.city}</div>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">
                        <div className="flex items-center justify-end space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${Math.min(geo.userActivity / 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{geo.userActivity.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 font-medium">{geo.flightDemand}%</td>
                      <td className="text-right py-3 px-4 font-medium">
                        ${(geo.revenue / 1000000000).toFixed(1)}B
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className={cn(
                          "font-medium",
                          geo.growth > 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {geo.growth > 0 ? '+' : ''}{geo.growth}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 font-medium">{geo.marketShare}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 競爭分析視圖 */}
      {selectedView === 'competition' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">競爭力雷達圖</h3>
              <button
                onClick={() => handleDataExport('competition')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                匯出競爭數據
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {metrics.competitorComparison.map((comp, index) => (
                <div key={comp.metric} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{comp.metric}</h4>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      comp.ranking <= 2 ? "bg-green-50 text-green-600" :
                      comp.ranking <= 3 ? "bg-yellow-50 text-yellow-600" : "bg-red-50 text-red-600"
                    )}>
                      業界排名 #{comp.ranking}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">我們的表現</span>
                      <span className="font-bold text-blue-600">
                        {comp.metric.includes('率') || comp.metric.includes('份額') ?
                          `${comp.ourValue}%` : comp.ourValue}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">競爭對手平均</span>
                      <span className="font-medium text-gray-500">
                        {comp.metric.includes('率') || comp.metric.includes('份額') ?
                          `${comp.competitorAvg}%` : comp.competitorAvg}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">趨勢</span>
                      <span className={cn(
                        "text-sm font-medium",
                        comp.trend === 'improving' ? "text-green-600" :
                        comp.trend === 'declining' ? "text-red-600" : "text-gray-600"
                      )}>
                        {comp.trend === 'improving' ? '↗ 改善中' :
                         comp.trend === 'declining' ? '↘ 下滑中' : '→ 穩定'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboardPage;
