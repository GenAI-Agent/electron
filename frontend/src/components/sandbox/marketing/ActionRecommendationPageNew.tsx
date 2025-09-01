import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import { 
  Plane, 
  MapPin, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Users,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Calendar,
  BarChart3,
  Target,
  Zap,
  Globe,
  Eye,
  X
} from 'lucide-react';

interface ActionRecommendationPageProps {
  className?: string;
  onOpenDataTab?: (source: string, file: any, data?: any[]) => void;
}

interface ActionPlan {
  id: string;
  title: string;
  category: 'pricing' | 'service' | 'marketing' | 'operations';
  priority: 'high' | 'medium' | 'low';
  impact: number;
  effort: number;
  timeline: string;
  description: string;
  expectedOutcome: string;
  budget: number;
  roi: number;
  risks: string[];
  dependencies: string[];
  kpis: string[];
  dataSource: {
    type: 'dashboard' | 'intelligence' | 'competitor' | 'simulation';
    description: string;
  };
}

// Mock data
const mockActionPlans: ActionPlan[] = [
  {
    id: '1',
    title: '日本航線動態定價策略',
    category: 'pricing',
    priority: 'high',
    impact: 85,
    effort: 60,
    timeline: '3個月',
    description: '基於市場需求和競爭對手價格，實施動態定價機制以最大化日本航線收益',
    expectedOutcome: '預期增加日本航線營收15-20%，提升載客率至90%以上',
    budget: 8000000,
    roi: 2.5,
    risks: ['系統技術風險', '客戶接受度', '競爭對手反應'],
    dependencies: ['IT系統升級', '定價團隊培訓', '市場數據整合'],
    kpis: ['營收成長率', '載客率', '平均票價', '客戶滿意度'],
    dataSource: {
      type: 'dashboard',
      description: '基於儀表板顯示日本航線載客率85.2%，有提升空間'
    }
  },
  {
    id: '2',
    title: '客訴熱點改善計畫',
    category: 'service',
    priority: 'high',
    impact: 75,
    effort: 45,
    timeline: '2個月',
    description: '針對班機延誤和行李問題等主要客訴類型，制定系統性改善方案',
    expectedOutcome: '客訴數量減少30%，客戶滿意度提升至4.5分以上',
    budget: 5000000,
    roi: 3.2,
    risks: ['執行阻力', '成本超支', '效果不如預期'],
    dependencies: ['跨部門協調', '員工培訓', '流程優化'],
    kpis: ['客訴數量', '客戶滿意度', '準點率', '行李處理時間'],
    dataSource: {
      type: 'dashboard',
      description: '基於客訴熱點分析，班機延誤佔35%，行李問題佔25%'
    }
  },
  {
    id: '3',
    title: '越南市場開拓策略',
    category: 'marketing',
    priority: 'medium',
    impact: 70,
    effort: 80,
    timeline: '6個月',
    description: '利用越南經濟快速成長機會，開發年輕客群和商務航線市場',
    expectedOutcome: '越南航線乘客數量增長40%，建立品牌知名度',
    budget: 12000000,
    roi: 1.8,
    risks: ['政策變化', '文化差異', '基礎設施限制'],
    dependencies: ['市場調研', '當地合作夥伴', '行銷團隊'],
    kpis: ['乘客數量', '市場佔有率', '品牌知名度', '營收貢獻'],
    dataSource: {
      type: 'intelligence',
      description: '基於智庫分析，越南市場成長率18.7%，競爭程度低'
    }
  },
  {
    id: '4',
    title: '數位服務競爭力提升',
    category: 'service',
    priority: 'medium',
    impact: 65,
    effort: 70,
    timeline: '4個月',
    description: '強化數位服務能力，提升年輕客群吸引力和整體競爭力',
    expectedOutcome: '數位服務使用率提升50%，年輕客群比例增加15%',
    budget: 15000000,
    roi: 2.1,
    risks: ['技術複雜度', '用戶習慣', '投資回報週期長'],
    dependencies: ['技術開發', 'UI/UX設計', '用戶測試'],
    kpis: ['App使用率', '線上報到率', '數位服務滿意度', '年輕客群比例'],
    dataSource: {
      type: 'competitor',
      description: '基於競爭分析，華航數位化轉型較慢，需要加強'
    }
  }
];

// 生成週計畫的函數
const getWeeklyPlan = (plan: ActionPlan) => {
  const baseWeeks = parseInt(plan.timeline.replace(/[^0-9]/g, '')) || 4;
  const weeks = [];

  if (plan.category === 'pricing') {
    weeks.push(
      { week: 1, phase: '準備階段', tasks: ['系統需求分析', '技術架構設計', '團隊組建', '預算確認'] },
      { week: 2, phase: '開發階段', tasks: ['定價演算法開發', '數據接口建置', '測試環境搭建'] },
      { week: 3, phase: '測試階段', tasks: ['系統測試', '用戶接受度測試', '性能優化', '安全檢測'] },
      { week: 4, phase: '上線階段', tasks: ['正式上線', '監控系統啟動', '用戶培訓', '效果評估'] }
    );
  } else if (plan.category === 'service') {
    weeks.push(
      { week: 1, phase: '分析階段', tasks: ['客訴數據分析', '流程梳理', '問題根因分析', '改善方案設計'] },
      { week: 2, phase: '實施階段', tasks: ['員工培訓', '流程優化', '系統調整', '標準作業程序更新'] },
      { week: 3, phase: '驗證階段', tasks: ['試運行', '效果監控', '問題調整', '持續改善'] },
      { week: 4, phase: '推廣階段', tasks: ['全面實施', '成效評估', '經驗總結', '最佳實務分享'] }
    );
  } else {
    // 通用計畫
    for (let i = 1; i <= baseWeeks; i++) {
      weeks.push({
        week: i,
        phase: i === 1 ? '啟動階段' : i === baseWeeks ? '完成階段' : '執行階段',
        tasks: [`第${i}週任務規劃`, `進度檢查`, `風險評估`, `調整優化`]
      });
    }
  }

  return weeks;
};

export const ActionRecommendationPage: React.FC<ActionRecommendationPageProps> = ({
  className,
  onOpenDataTab
}) => {
  const [selectedPlan, setSelectedPlan] = useState<ActionPlan | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'impact' | 'effort' | 'priority'>('impact');

  const filteredPlans = mockActionPlans
    .filter(plan => filterCategory === 'all' || plan.category === filterCategory)
    .filter(plan => filterPriority === 'all' || plan.priority === filterPriority)
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b[sortBy] - a[sortBy];
    });

  const exportData = (dataType: string) => {
    if (onOpenDataTab) {
      const mockFile = {
        filename: `action_plans_${dataType}_${new Date().toISOString().split('T')[0]}.csv`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        fullPath: `marketing-sandbox/action_plans_${dataType}.csv`
      };
      
      onOpenDataTab('action-plans', mockFile, filteredPlans);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pricing': return DollarSign;
      case 'service': return Users;
      case 'marketing': return Target;
      case 'operations': return Plane;
      default: return BarChart3;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'pricing': return 'bg-green-50 text-green-700 border-green-200';
      case 'service': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'marketing': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'operations': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className={cn("h-full overflow-y-auto p-6 bg-gray-50", className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">行動建議</h1>
            <p className="text-gray-600 mt-1">基於數據分析生成的策略建議與執行方案</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => exportData('all')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              匯出建議數據
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">類別:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="all">全部</option>
              <option value="pricing">定價策略</option>
              <option value="service">服務改善</option>
              <option value="marketing">行銷推廣</option>
              <option value="operations">營運優化</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">優先級:</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="all">全部</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">排序:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="impact">影響力</option>
              <option value="effort">執行難度</option>
              <option value="priority">優先級</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Plans List - Full Width */}
      <div className="space-y-4">
        {filteredPlans.map((plan) => {
          const CategoryIcon = getCategoryIcon(plan.category);
          const isExpanded = selectedPlan?.id === plan.id;

          return (
            <div key={plan.id} className="bg-white rounded-lg shadow-sm border">
              {/* Plan Header - Always Visible */}
              <div
                className={cn(
                  "p-6 cursor-pointer transition-colors",
                  isExpanded ? "border-b border-gray-200" : "hover:bg-gray-50"
                )}
                onClick={() => setSelectedPlan(isExpanded ? null : plan)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={cn("p-2 rounded-lg border", getCategoryColor(plan.category))}>
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{plan.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium border", getPriorityColor(plan.priority))}>
                      {plan.priority === 'high' ? '高優先' : plan.priority === 'medium' ? '中優先' : '低優先'}
                    </span>
                    <ArrowRight className={cn("w-4 h-4 text-gray-400 transition-transform", isExpanded && "rotate-90")} />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{plan.impact}</div>
                    <div className="text-xs text-gray-600">影響力</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{plan.effort}</div>
                    <div className="text-xs text-gray-600">執行難度</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{plan.roi}x</div>
                    <div className="text-xs text-gray-600">投資回報</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{plan.timeline}</div>
                    <div className="text-xs text-gray-600">執行時間</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-indigo-600">${(plan.budget / 1000000).toFixed(0)}M</div>
                    <div className="text-xs text-gray-600">預算</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center text-xs text-gray-500">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    <span>建議來源: {plan.dataSource.description}</span>
                  </div>
                  <div className="text-blue-600 font-medium">
                    {isExpanded ? '收起詳情' : '展開執行計畫'}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="p-6 bg-gray-50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                      {/* Expected Outcome */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <Target className="w-4 h-4 mr-2 text-green-600" />
                          預期成果
                        </h4>
                        <p className="text-sm text-gray-700 bg-white p-4 rounded-lg border">
                          {plan.expectedOutcome}
                        </p>
                      </div>

                      {/* KPIs */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
                          關鍵指標 (KPIs)
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {plan.kpis.map((kpi, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border text-sm text-gray-700">
                              <CheckCircle className="w-3 h-3 text-green-500 inline mr-2" />
                              {kpi}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Dependencies */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <Globe className="w-4 h-4 mr-2 text-purple-600" />
                          執行依賴
                        </h4>
                        <div className="space-y-2">
                          {plan.dependencies.map((dep, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border text-sm text-gray-700 flex items-center">
                              <ArrowRight className="w-3 h-3 text-gray-400 mr-2" />
                              {dep}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Risks */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
                          風險評估
                        </h4>
                        <div className="space-y-2">
                          {plan.risks.map((risk, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border text-sm text-gray-700 flex items-center">
                              <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                              {risk}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Only Timeline */}
                    <div className="space-y-6">
                      {/* Weekly Timeline */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-indigo-600" />
                          執行時程規劃
                        </h4>
                        <div className="space-y-3">
                          {getWeeklyPlan(plan).map((week, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-lg border">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-gray-900">第 {week.week} 週</h5>
                                <span className="text-xs text-gray-500">{week.phase}</span>
                              </div>
                              <ul className="space-y-1">
                                {week.tasks.map((task, taskIdx) => (
                                  <li key={taskIdx} className="text-sm text-gray-700 flex items-center">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></div>
                                    {task}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                    <button className="bg-blue-500 text-white py-3 px-8 rounded-lg hover:bg-blue-600 transition-colors font-medium">
                      開始執行此計畫
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActionRecommendationPage;
