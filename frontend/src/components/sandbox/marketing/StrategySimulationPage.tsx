import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  BarChart3,
  Play,
  Pause,
  RotateCcw,
  Settings,
  ChevronRight,
  Plus,
  X
} from 'lucide-react';

interface StrategySimulationPageProps {
  className?: string;
  onOpenDataTab?: (source: string, file: any, data?: any[]) => void;
}

interface TimeSegment {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  duration: number; // in days
  isActive: boolean;
}

interface Scenario {
  id: string;
  name: string;
  probability: number;
  impact: 'high' | 'medium' | 'low';
  category: 'market' | 'competition' | 'external' | 'internal';
  description: string;
  factors: string[];
  expectedOutcome: {
    revenue: number;
    marketShare: number;
    customerSatisfaction: number;
  };
}

interface SimulationResult {
  id: string;
  scenario: string;
  timeSegment: string;
  timestamp: string;
  status: 'completed' | 'running' | 'failed';
  metrics: {
    revenue: number;
    marketShare: number;
    customerSatisfaction: number;
    riskLevel: number;
    probability: number;
  };
  recommendations: string[];
  keyInsights: string[];
  riskFactors: string[];
}

interface HistoricalSimulation {
  id: string;
  name: string;
  date: string;
  scenarios: string[];
  timeSegments: string[];
  results: SimulationResult[];
  summary: {
    bestCase: SimulationResult;
    worstCase: SimulationResult;
    mostLikely: SimulationResult;
  };
}

// Mock data
const mockTimeSegments: TimeSegment[] = [
  {
    id: 'q1-2025',
    name: '2025 Q1 春節旺季',
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    duration: 90,
    isActive: true
  },
  {
    id: 'q2-2025',
    name: '2025 Q2 淡季調整',
    startDate: '2025-04-01',
    endDate: '2025-06-30',
    duration: 91,
    isActive: false
  },
  {
    id: 'summer-2025',
    name: '2025 暑假旺季',
    startDate: '2025-07-01',
    endDate: '2025-08-31',
    duration: 62,
    isActive: true
  }
];

const mockScenarios: Scenario[] = [
  {
    id: 'fuel-price-rise',
    name: '燃油價格上漲',
    probability: 75,
    impact: 'high',
    category: 'external',
    description: '國際油價持續上升，影響營運成本',
    factors: ['地緣政治', '供需失衡', '匯率波動'],
    expectedOutcome: {
      revenue: -15,
      marketShare: -5,
      customerSatisfaction: -10
    }
  },
  {
    id: 'new-competitor',
    name: '新競爭者進入',
    probability: 60,
    impact: 'medium',
    category: 'competition',
    description: '低成本航空公司開通新航線',
    factors: ['價格競爭', '航線重疊', '市場分割'],
    expectedOutcome: {
      revenue: -8,
      marketShare: -12,
      customerSatisfaction: 0
    }
  },
  {
    id: 'digital-transformation',
    name: '數位轉型成功',
    probability: 80,
    impact: 'high',
    category: 'internal',
    description: '完成數位化升級，提升客戶體驗',
    factors: ['系統整合', '用戶體驗', '營運效率'],
    expectedOutcome: {
      revenue: 20,
      marketShare: 8,
      customerSatisfaction: 25
    }
  },
  {
    id: 'tourism-recovery',
    name: '觀光業復甦',
    probability: 85,
    impact: 'high',
    category: 'market',
    description: '疫後觀光需求強勁反彈',
    factors: ['邊境開放', '消費信心', '報復性旅遊'],
    expectedOutcome: {
      revenue: 30,
      marketShare: 15,
      customerSatisfaction: 20
    }
  }
];

// Mock historical simulations data
const mockHistoricalSimulations: HistoricalSimulation[] = [
  {
    id: 'sim-001',
    name: '2025春節旺季策略推演',
    date: '2025-01-15',
    scenarios: ['觀光業復甦', '燃油價格上漲'],
    timeSegments: ['2025 Q1 春節旺季'],
    results: [
      {
        id: 'result-001',
        scenario: '觀光業復甦',
        timeSegment: '2025 Q1 春節旺季',
        timestamp: '2025-01-15T14:30:00Z',
        status: 'completed',
        metrics: {
          revenue: 1300000,
          marketShare: 40,
          customerSatisfaction: 105,
          riskLevel: 25,
          probability: 85
        },
        recommendations: [
          '增加日韓航線班次',
          '推出春節特惠套裝',
          '加強地勤人力配置'
        ],
        keyInsights: [
          '春節期間日韓航線需求將增長30%',
          '家庭旅遊客群是主要增長動力',
          '競爭對手可能同步增班'
        ],
        riskFactors: [
          '天候因素影響',
          '地勤人力不足',
          '機場容量限制'
        ]
      }
    ],
    summary: {
      bestCase: {
        id: 'best-001',
        scenario: '最佳情況',
        timeSegment: '2025 Q1',
        timestamp: '2025-01-15T14:30:00Z',
        status: 'completed',
        metrics: { revenue: 1300000, marketShare: 40, customerSatisfaction: 105, riskLevel: 25, probability: 85 },
        recommendations: [],
        keyInsights: [],
        riskFactors: []
      },
      worstCase: {
        id: 'worst-001',
        scenario: '最壞情況',
        timeSegment: '2025 Q1',
        timestamp: '2025-01-15T14:30:00Z',
        status: 'completed',
        metrics: { revenue: 850000, marketShare: 20, customerSatisfaction: 70, riskLevel: 75, probability: 15 },
        recommendations: [],
        keyInsights: [],
        riskFactors: []
      },
      mostLikely: {
        id: 'likely-001',
        scenario: '最可能情況',
        timeSegment: '2025 Q1',
        timestamp: '2025-01-15T14:30:00Z',
        status: 'completed',
        metrics: { revenue: 1000000, marketShare: 30, customerSatisfaction: 85, riskLevel: 45, probability: 70 },
        recommendations: [],
        keyInsights: [],
        riskFactors: []
      }
    }
  },
  {
    id: 'sim-002',
    name: '競爭對手進入市場影響評估',
    date: '2025-02-20',
    scenarios: ['新競爭者進入', '數位轉型成功'],
    timeSegments: ['2025 Q2 淡季調整'],
    results: [],
    summary: {
      bestCase: {
        id: 'best-002',
        scenario: '最佳情況',
        timeSegment: '2025 Q2',
        timestamp: '2025-02-20T10:15:00Z',
        status: 'completed',
        metrics: { revenue: 920000, marketShare: 28, customerSatisfaction: 88, riskLevel: 35, probability: 60 },
        recommendations: [],
        keyInsights: [],
        riskFactors: []
      },
      worstCase: {
        id: 'worst-002',
        scenario: '最壞情況',
        timeSegment: '2025 Q2',
        timestamp: '2025-02-20T10:15:00Z',
        status: 'completed',
        metrics: { revenue: 720000, marketShare: 18, customerSatisfaction: 75, riskLevel: 80, probability: 25 },
        recommendations: [],
        keyInsights: [],
        riskFactors: []
      },
      mostLikely: {
        id: 'likely-002',
        scenario: '最可能情況',
        timeSegment: '2025 Q2',
        timestamp: '2025-02-20T10:15:00Z',
        status: 'completed',
        metrics: { revenue: 820000, marketShare: 23, customerSatisfaction: 82, riskLevel: 55, probability: 75 },
        recommendations: [],
        keyInsights: [],
        riskFactors: []
      }
    }
  }
];

export const StrategySimulationPage: React.FC<StrategySimulationPageProps> = ({
  className,
  onOpenDataTab
}) => {
  const [selectedTimeSegments, setSelectedTimeSegments] = useState<string[]>(['q1-2025']);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(['tourism-recovery']);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [historicalSimulations] = useState<HistoricalSimulation[]>(mockHistoricalSimulations);
  const [selectedHistoricalSim, setSelectedHistoricalSim] = useState<HistoricalSimulation | null>(null);
  const [activeView, setActiveView] = useState<'new' | 'history'>('new');
  const [showNewSegmentModal, setShowNewSegmentModal] = useState(false);

  const handleTimeSegmentToggle = (segmentId: string) => {
    setSelectedTimeSegments(prev => 
      prev.includes(segmentId) 
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  const handleScenarioToggle = (scenarioId: string) => {
    setSelectedScenarios(prev => 
      prev.includes(scenarioId) 
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock results
    const results: SimulationResult[] = [];
    selectedTimeSegments.forEach(segmentId => {
      selectedScenarios.forEach(scenarioId => {
        const segment = mockTimeSegments.find(s => s.id === segmentId);
        const scenario = mockScenarios.find(s => s.id === scenarioId);
        
        if (segment && scenario) {
          results.push({
            scenario: scenario.name,
            timeSegment: segment.name,
            metrics: {
              revenue: 1000000 + (scenario.expectedOutcome.revenue * 10000),
              marketShare: 25 + scenario.expectedOutcome.marketShare,
              customerSatisfaction: 80 + scenario.expectedOutcome.customerSatisfaction,
              riskLevel: scenario.impact === 'high' ? 75 : scenario.impact === 'medium' ? 50 : 25
            },
            recommendations: [
              '調整定價策略以應對市場變化',
              '加強客戶關係管理',
              '優化航線配置'
            ]
          });
        }
      });
    });
    
    setSimulationResults(results);
    setIsSimulating(false);
  };

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'market':
        return <BarChart3 className="w-4 h-4" />;
      case 'competition':
        return <Target className="w-4 h-4" />;
      case 'external':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const exportResults = () => {
    if (onOpenDataTab && simulationResults.length > 0) {
      const mockFile = {
        filename: `strategy_simulation_${new Date().toISOString().split('T')[0]}.csv`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        fullPath: 'marketing-sandbox/strategy_simulation.csv'
      };
      
      onOpenDataTab('strategy', mockFile, simulationResults);
    }
  };

  return (
    <div className={cn("h-full overflow-y-auto p-6 bg-gray-50", className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">策略推演</h1>
            <p className="text-gray-600 mt-1">多時間區段策略模擬與情境預測</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex bg-white rounded-lg p-1 shadow-sm border">
              <button
                onClick={() => setActiveView('new')}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  activeView === 'new'
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                新推演
              </button>
              <button
                onClick={() => setActiveView('history')}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  activeView === 'history'
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                歷史記錄
              </button>
            </div>

            {activeView === 'new' && (
              <div className="flex space-x-3">
                <button
                  onClick={runSimulation}
                  disabled={isSimulating || selectedTimeSegments.length === 0 || selectedScenarios.length === 0}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors",
                    isSimulating || selectedTimeSegments.length === 0 || selectedScenarios.length === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  )}
                >
                  {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isSimulating ? '模擬中...' : '開始模擬'}</span>
                </button>

                {simulationResults.length > 0 && (
                  <button
                    onClick={exportResults}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>匯出結果</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 新推演視圖 */}
      {activeView === 'new' && (
        <div className="space-y-6">
          {/* 垂直時間軸佈局 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                時間區段與情境選擇
              </h3>
              <button
                onClick={() => setShowNewSegmentModal(true)}
                className="text-blue-600 hover:text-blue-800"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* 垂直時間軸 */}
            <div className="relative">
              {/* 時間軸線 */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

              <div className="space-y-8">
                {mockTimeSegments.map((segment, index) => (
                  <div key={segment.id} className="relative flex items-start space-x-6">
                    {/* 時間點 */}
                    <div className={cn(
                      "relative z-10 w-4 h-4 rounded-full border-2 bg-white",
                      selectedTimeSegments.includes(segment.id)
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    )}>
                      {selectedTimeSegments.includes(segment.id) && (
                        <div className="absolute inset-1 bg-white rounded-full"></div>
                      )}
                    </div>

                    {/* 時間段內容 */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "p-4 rounded-lg border-2 cursor-pointer transition-colors",
                          selectedTimeSegments.includes(segment.id)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        )}
                        onClick={() => handleTimeSegmentToggle(segment.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{segment.name}</h4>
                          <span className="text-sm text-gray-500">{segment.duration} 天</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {segment.startDate} ~ {segment.endDate}
                        </p>

                        {/* 該時間段的情境選擇 */}
                        {selectedTimeSegments.includes(segment.id) && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h5 className="text-sm font-medium text-gray-900 mb-3">選擇情境:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {mockScenarios.map((scenario) => (
                                <div
                                  key={scenario.id}
                                  className={cn(
                                    "p-3 rounded-lg border cursor-pointer transition-colors",
                                    selectedScenarios.includes(scenario.id)
                                      ? "border-green-500 bg-green-50"
                                      : "border-gray-200 hover:border-gray-300"
                                  )}
                                  onClick={() => handleScenarioToggle(scenario.id)}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-900">{scenario.name}</span>
                                    <span className="text-xs text-gray-500">{scenario.probability}%</span>
                                  </div>
                                  <p className="text-xs text-gray-600">{scenario.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* 模擬結果顯示 */}
          {(simulationResults.length > 0 || isSimulating) && (
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                模擬結果
              </h3>

              {isSimulating ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">正在模擬中...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {simulationResults.map((result, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{result.scenario}</h4>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          result.status === 'completed' ? "bg-green-50 text-green-600" :
                          result.status === 'running' ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
                        )}>
                          {result.status === 'completed' ? '完成' :
                           result.status === 'running' ? '進行中' : '失敗'}
                        </span>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">營收影響</span>
                          <span className={cn(
                            "text-sm font-medium",
                            result.metrics.revenue > 1000000 ? "text-green-600" : "text-red-600"
                          )}>
                            {result.metrics.revenue > 1000000 ? '+' : ''}{((result.metrics.revenue - 1000000) / 10000).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">市占率</span>
                          <span className="text-sm font-medium text-gray-900">{result.metrics.marketShare}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">發生機率</span>
                          <span className="text-sm font-medium text-blue-600">{result.metrics.probability}%</span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-600">
                        風險等級: <span className={cn(
                          "font-medium",
                          result.metrics.riskLevel > 60 ? "text-red-600" :
                          result.metrics.riskLevel > 40 ? "text-yellow-600" : "text-green-600"
                        )}>
                          {result.metrics.riskLevel > 60 ? '高' :
                           result.metrics.riskLevel > 40 ? '中' : '低'}
                        </span>
                      </div>

                      {result.keyInsights.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-1">關鍵洞察:</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {result.keyInsights.slice(0, 2).map((insight, idx) => (
                              <li key={idx}>• {insight}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 歷史記錄視圖 */}
      {activeView === 'history' && (
        <div className="space-y-6">
          {/* 歷史推演列表 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">歷史推演記錄</h3>
              <button
                onClick={() => exportResults()}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                匯出所有記錄
              </button>
            </div>

            <div className="space-y-4">
              {historicalSimulations.map((simulation) => (
                <div
                  key={simulation.id}
                  className={cn(
                    "p-4 rounded-lg border-2 cursor-pointer transition-colors",
                    selectedHistoricalSim?.id === simulation.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => setSelectedHistoricalSim(simulation)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{simulation.name}</h4>
                    <span className="text-sm text-gray-500">{simulation.date}</span>
                  </div>

                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {simulation.timeSegments.length} 個時間區段
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {simulation.scenarios.length} 個情境
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {simulation.scenarios.map((scenario, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {scenario}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 選中的歷史推演詳情 */}
          {selectedHistoricalSim && (
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedHistoricalSim.name} - 詳細結果
                </h3>
                <span className="text-sm text-gray-500">{selectedHistoricalSim.date}</span>
              </div>

              {/* 三種情況對比 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* 最佳情況 */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-green-900">最佳情況</h4>
                    <span className="text-sm text-green-600">
                      {selectedHistoricalSim.summary.bestCase.metrics.probability}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-green-700">營收</span>
                      <span className="font-medium text-green-900">
                        ${(selectedHistoricalSim.summary.bestCase.metrics.revenue / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-green-700">市占率</span>
                      <span className="font-medium text-green-900">
                        {selectedHistoricalSim.summary.bestCase.metrics.marketShare}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-green-700">風險</span>
                      <span className="font-medium text-green-900">
                        {selectedHistoricalSim.summary.bestCase.metrics.riskLevel}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* 最可能情況 */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-blue-900">最可能情況</h4>
                    <span className="text-sm text-blue-600">
                      {selectedHistoricalSim.summary.mostLikely.metrics.probability}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">營收</span>
                      <span className="font-medium text-blue-900">
                        ${(selectedHistoricalSim.summary.mostLikely.metrics.revenue / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">市占率</span>
                      <span className="font-medium text-blue-900">
                        {selectedHistoricalSim.summary.mostLikely.metrics.marketShare}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">風險</span>
                      <span className="font-medium text-blue-900">
                        {selectedHistoricalSim.summary.mostLikely.metrics.riskLevel}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* 最壞情況 */}
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-red-900">最壞情況</h4>
                    <span className="text-sm text-red-600">
                      {selectedHistoricalSim.summary.worstCase.metrics.probability}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-red-700">營收</span>
                      <span className="font-medium text-red-900">
                        ${(selectedHistoricalSim.summary.worstCase.metrics.revenue / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-red-700">市占率</span>
                      <span className="font-medium text-red-900">
                        {selectedHistoricalSim.summary.worstCase.metrics.marketShare}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-red-700">風險</span>
                      <span className="font-medium text-red-900">
                        {selectedHistoricalSim.summary.worstCase.metrics.riskLevel}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 詳細結果列表 */}
              {selectedHistoricalSim.results.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">詳細推演結果</h4>
                  <div className="space-y-4">
                    {selectedHistoricalSim.results.map((result, index) => (
                      <div key={result.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900">{result.scenario}</h5>
                          <span className="text-sm text-gray-500">{result.timeSegment}</span>
                        </div>

                        {result.keyInsights.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">關鍵洞察:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {result.keyInsights.map((insight, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="text-blue-500 mr-2">•</span>
                                  {insight}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {result.recommendations.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">建議行動:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {result.recommendations.map((rec, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="text-green-500 mr-2">→</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StrategySimulationPage;
