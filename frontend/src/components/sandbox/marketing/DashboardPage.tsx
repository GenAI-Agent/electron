import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Plane,
  Globe,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  Activity,
  Zap,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  MapPin
} from 'lucide-react';

interface DashboardPageProps {
  className?: string;
  onOpenDataTab?: (source: string, file: any, data?: any[]) => void;
}

interface KPIMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  changeType: 'increase' | 'decrease';
  target: number;
  status: 'good' | 'warning' | 'critical';
  description: string;
}

interface AlertItem {
  id: string;
  type: 'opportunity' | 'risk' | 'action_required';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
  source: string;
}

// Mock KPI數據
const mockKPIs: KPIMetric[] = [
  {
    id: 'revenue',
    name: '月營收',
    value: 125.8,
    unit: 'M',
    change: 12.5,
    changeType: 'increase',
    target: 130,
    status: 'good',
    description: '較上月成長12.5%，接近目標值'
  },
  {
    id: 'market_share',
    name: '市占率',
    value: 23.5,
    unit: '%',
    change: -1.2,
    changeType: 'decrease',
    target: 25,
    status: 'warning',
    description: '較上月下降1.2%，需要關注'
  },
  {
    id: 'customer_satisfaction',
    name: '客戶滿意度',
    value: 4.2,
    unit: '/5',
    change: 0.3,
    changeType: 'increase',
    target: 4.5,
    status: 'good',
    description: '持續改善中，接近目標'
  },
  {
    id: 'load_factor',
    name: '載客率',
    value: 78.5,
    unit: '%',
    change: 5.2,
    changeType: 'increase',
    target: 80,
    status: 'good',
    description: '旺季效應，表現良好'
  },
  {
    id: 'on_time_performance',
    name: '準點率',
    value: 85.2,
    unit: '%',
    change: -2.1,
    changeType: 'decrease',
    target: 90,
    status: 'warning',
    description: '天氣因素影響，需要改善'
  },
  {
    id: 'cost_per_seat',
    name: '每座位成本',
    value: 2.8,
    unit: 'K',
    change: -3.5,
    changeType: 'decrease',
    target: 2.5,
    status: 'good',
    description: '成本控制有效'
  }
];

// Mock 警示數據
const mockAlerts: AlertItem[] = [
  {
    id: 'alert-1',
    type: 'opportunity',
    severity: 'high',
    title: '日本旅遊需求激增',
    description: '日本政府宣布進一步放寬入境限制，預期台日航線需求將增長40%',
    timestamp: '2025-09-01 09:30',
    source: '市場情報'
  },
  {
    id: 'alert-2',
    type: 'risk',
    severity: 'medium',
    title: '競爭對手降價策略',
    description: '長榮航空推出秋季促銷，主要航線票價下調15%',
    timestamp: '2025-09-01 08:15',
    source: '競爭分析'
  },
  {
    id: 'alert-3',
    type: 'action_required',
    severity: 'high',
    title: '動態定價系統待部署',
    description: '系統開發已完成，等待管理層批准上線時程',
    timestamp: '2025-08-31 16:45',
    source: '行動建議'
  }
];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  className,
  onOpenDataTab
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // 模擬數據刷新
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAlertColor = (type: string, severity: string) => {
    if (type === 'opportunity') return 'border-l-green-500 bg-green-50';
    if (type === 'risk') return 'border-l-red-500 bg-red-50';
    return severity === 'high' ? 'border-l-orange-500 bg-orange-50' : 'border-l-blue-500 bg-blue-50';
  };

  return (
    <div className={cn("h-full overflow-y-auto p-6 pb-16 bg-gray-50", className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">營運儀表板</h1>
            <p className="text-gray-600 mt-1">即時監控關鍵營運指標與市場動態</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="24h">過去24小時</option>
              <option value="7d">過去7天</option>
              <option value="30d">過去30天</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isRefreshing
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-50 text-blue-600 hover:bg-blue-100"
              )}
            >
              <Activity className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              <span>{isRefreshing ? '更新中...' : '刷新數據'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 航線營運狀況 */}
      <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">航線營運狀況</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">航線</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">載客率</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">準點率</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">月營收</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">成長率</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">競爭狀況</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">狀態</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  route: 'TPE-NRT',
                  loadFactor: 85.2,
                  onTime: 88.5,
                  revenue: 28.5,
                  growth: 12.3,
                  competition: 'high',
                  status: 'good'
                },
                {
                  route: 'TPE-ICN',
                  loadFactor: 78.9,
                  onTime: 92.1,
                  revenue: 22.8,
                  growth: 8.7,
                  competition: 'medium',
                  status: 'good'
                },
                {
                  route: 'TPE-BKK',
                  loadFactor: 82.4,
                  onTime: 85.3,
                  revenue: 25.2,
                  growth: 15.1,
                  competition: 'high',
                  status: 'good'
                },
                {
                  route: 'TPE-SIN',
                  loadFactor: 75.6,
                  onTime: 89.7,
                  revenue: 19.8,
                  growth: -2.1,
                  competition: 'medium',
                  status: 'warning'
                },
                {
                  route: 'TPE-HKG',
                  loadFactor: 68.3,
                  onTime: 91.2,
                  revenue: 16.5,
                  growth: -5.8,
                  competition: 'high',
                  status: 'critical'
                },
                {
                  route: 'TPE-KUL',
                  loadFactor: 79.1,
                  onTime: 87.4,
                  revenue: 18.9,
                  growth: 6.2,
                  competition: 'low',
                  status: 'good'
                }
              ].map((route, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{route.route}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className={cn(
                        "font-medium",
                        route.loadFactor >= 80 ? "text-green-600" :
                          route.loadFactor >= 70 ? "text-yellow-600" : "text-red-600"
                      )}>
                        {route.loadFactor}%
                      </span>
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div
                          className={cn(
                            "h-2 rounded-full",
                            route.loadFactor >= 80 ? "bg-green-500" :
                              route.loadFactor >= 70 ? "bg-yellow-500" : "bg-red-500"
                          )}
                          style={{ width: `${route.loadFactor}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      "font-medium",
                      route.onTime >= 90 ? "text-green-600" :
                        route.onTime >= 85 ? "text-yellow-600" : "text-red-600"
                    )}>
                      {route.onTime}%
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">${route.revenue}M</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1">
                      {route.growth > 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                      <span className={cn(
                        "font-medium",
                        route.growth > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {route.growth > 0 ? '+' : ''}{route.growth}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      route.competition === 'high' ? "bg-red-100 text-red-700" :
                        route.competition === 'medium' ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                    )}>
                      {route.competition === 'high' ? '激烈' :
                        route.competition === 'medium' ? '中等' : '溫和'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      route.status === 'good' ? "bg-green-100 text-green-700" :
                        route.status === 'warning' ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                    )}>
                      {route.status === 'good' ? '良好' :
                        route.status === 'warning' ? '注意' : '警告'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {mockKPIs.map((kpi) => (
          <div key={kpi.id} className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">{kpi.name}</h3>
              <span className={cn(
                "px-2 py-1 rounded-full text-xs font-medium border",
                getStatusColor(kpi.status)
              )}>
                {kpi.status === 'good' ? '良好' :
                  kpi.status === 'warning' ? '注意' : '警告'}
              </span>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {kpi.value}
                  </span>
                  <span className="text-sm text-gray-500">{kpi.unit}</span>
                </div>
                <div className="flex items-center mt-2">
                  {kpi.changeType === 'increase' ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  )}
                  <span className={cn(
                    "text-sm font-medium ml-1",
                    kpi.changeType === 'increase' ? "text-green-600" : "text-red-600"
                  )}>
                    {Math.abs(kpi.change)}%
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">目標: {kpi.target}{kpi.unit}</div>
                <div className="w-16 h-2 bg-gray-200 rounded-full">
                  <div
                    className={cn(
                      "h-2 rounded-full",
                      kpi.status === 'good' ? "bg-green-500" :
                        kpi.status === 'warning' ? "bg-yellow-500" : "bg-red-500"
                    )}
                    style={{ width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600 mt-3">{kpi.description}</p>
          </div>
        ))}
      </div>

      {/* 客訴熱點分析 */}
      <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">客訴熱點分析</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 客訴類型分布 */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">客訴類型分布</h4>
            {[
              { type: '班機延誤', count: 45, percentage: 35, color: 'bg-red-500' },
              { type: '行李問題', count: 32, percentage: 25, color: 'bg-orange-500' },
              { type: '服務品質', count: 28, percentage: 22, color: 'bg-yellow-500' },
              { type: '票務問題', count: 23, percentage: 18, color: 'bg-blue-500' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={cn("w-3 h-3 rounded-full", item.color)}></div>
                  <span className="text-sm text-gray-700">{item.type}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div
                      className={cn("h-2 rounded-full", item.color)}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 航線客訴熱點 */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">航線客訴熱點</h4>
            {[
              { route: 'TPE-NRT', complaints: 28, severity: 'high' },
              { route: 'TPE-ICN', complaints: 22, severity: 'medium' },
              { route: 'TPE-BKK', complaints: 19, severity: 'medium' },
              { route: 'TPE-SIN', complaints: 15, severity: 'low' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium text-gray-900">{item.route}</span>
                  <span className="text-sm text-gray-600 ml-2">{item.complaints} 件</span>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  item.severity === 'high' ? "bg-red-100 text-red-700" :
                    item.severity === 'medium' ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                )}>
                  {item.severity === 'high' ? '高風險' :
                    item.severity === 'medium' ? '中風險' : '低風險'}
                </span>
              </div>
            ))}
          </div>

          {/* 時段分析 */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">客訴時段分析</h4>
            {[
              { time: '06:00-12:00', count: 35, label: '早班' },
              { time: '12:00-18:00', count: 52, label: '午班' },
              { time: '18:00-24:00', count: 41, label: '晚班' }
            ].map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.label} ({item.time})</span>
                  <span className="font-medium text-gray-900">{item.count} 件</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${(item.count / 52) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 乘客飛行熱點分析 */}
      <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">乘客飛行熱點分析</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 熱門航線 */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">熱門航線排行</h4>
            {[
              { route: 'TPE-NRT', passengers: 2850, growth: 15.2, rank: 1 },
              { route: 'TPE-ICN', passengers: 2640, growth: 8.7, rank: 2 },
              { route: 'TPE-BKK', passengers: 2420, growth: 12.3, rank: 3 },
              { route: 'TPE-SIN', passengers: 2180, growth: -2.1, rank: 4 },
              { route: 'TPE-HKG', passengers: 1950, growth: 5.8, rank: 5 }
            ].map((item) => (
              <div key={item.route} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white",
                    item.rank <= 3 ? "bg-yellow-500" : "bg-gray-400"
                  )}>
                    {item.rank}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{item.route}</div>
                    <div className="text-sm text-gray-600">{item.passengers.toLocaleString()} 人次/月</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "text-sm font-medium",
                    item.growth > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {item.growth > 0 ? '+' : ''}{item.growth}%
                  </div>
                  <div className="text-xs text-gray-500">月成長</div>
                </div>
              </div>
            ))}
          </div>

          {/* 乘客類型分析 */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">乘客類型分析</h4>
            <div className="space-y-3">
              {[
                { type: '商務旅客', percentage: 35, count: 4200, color: 'bg-blue-500' },
                { type: '休閒旅客', percentage: 45, count: 5400, color: 'bg-green-500' },
                { type: '探親旅客', percentage: 20, count: 2400, color: 'bg-purple-500' }
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{item.type}</span>
                    <span className="text-sm text-gray-900">{item.percentage}% ({item.count.toLocaleString()})</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full">
                    <div
                      className={cn("h-3 rounded-full", item.color)}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">熱點洞察</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 日本航線商務客比例最高 (42%)</li>
                <li>• 東南亞航線休閒客佔主導 (58%)</li>
                <li>• 週五晚班機載客率達95%</li>
                <li>• 會員乘客貢獻65%營收</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 重要警示 */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">重要警示</h3>
          <span className="text-sm text-gray-500">{mockAlerts.length} 項待處理</span>
        </div>

        <div className="space-y-3">
          {mockAlerts.map((alert) => (
            <div key={alert.id} className={cn(
              "p-4 rounded-lg border-l-4",
              getAlertColor(alert.type, alert.severity)
            )}>
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900">{alert.title}</h4>
                <span className="text-xs text-gray-500">{alert.timestamp}</span>
              </div>
              <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">來源: {alert.source}</span>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  alert.type === 'opportunity' ? "bg-green-100 text-green-700" :
                    alert.type === 'risk' ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                )}>
                  {alert.type === 'opportunity' ? '機會' :
                    alert.type === 'risk' ? '風險' : '待辦'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
