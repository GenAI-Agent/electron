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
  X,
  Users,
  DollarSign,
  FileText,
  Swords,
  Zap,
  Upload,
  CheckCircle
} from 'lucide-react';

interface StrategySimulationPageProps {
  className?: string;
  onOpenDataTab?: (source: string, file: any, data?: any[]) => void;
  simulationRecords?: SimulationRecord[];
  onRecordSelect?: (record: SimulationRecord) => void;
}

// 推演設定介面
interface SimulationSetup {
  startDate: string;
  endDate: string;
  competitors: string[];
  budget: number;
  majorEvents: string[];
  marketConditions: string;
  simulationRounds: number;
  strategy1: {
    name: string;
    description: string;
    budget: number;
  };
  strategy2: {
    name: string;
    description: string;
    budget: number;
  };
}

// 推演記錄
interface SimulationRecord {
  id: string;
  title: string;
  date: string;
  participants: {
    side1: string;
    side2: string;
  };
  result: {
    winner: 'side1' | 'side2' | 'draw';
    confidence: number;
  };
  duration: string;
  status: 'completed' | 'running' | 'failed';
  setup: SimulationSetup;
  detailedResults?: {
    overview: {
      totalRounds: number;
      winnerStrategy: string;
      keyFactors: string[];
      marketImpact: string;
      riskLevel: 'low' | 'medium' | 'high';
    };
    roundResults: Array<{
      round: number;
      scenario: string;
      side1Performance: {
        marketShare: number;
        revenue: number;
        customerSatisfaction: number;
        operationalEfficiency: number;
      };
      side2Performance: {
        marketShare: number;
        revenue: number;
        customerSatisfaction: number;
        operationalEfficiency: number;
      };
      keyEvents: string[];
      winner: 'side1' | 'side2';
      analysis: string;
    }>;
    actionRecommendations: Array<{
      category: 'immediate' | 'short-term' | 'long-term';
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      expectedImpact: string;
    }>;
    timelineAnalysis: Array<{
      period: string;
      events: Array<{
        date: string;
        event: string;
        impact: 'positive' | 'negative' | 'neutral';
        description: string;
      }>;
    }>;
  };
}

const mockSimulationRecords: SimulationRecord[] = [
  {
    id: '1',
    title: '價格策略 vs 服務策略',
    date: '2025-09-01 14:30',
    participants: {
      side1: '低價競爭策略',
      side2: '高端服務策略'
    },
    result: {
      winner: 'side2',
      confidence: 0.72
    },
    duration: '4分25秒',
    status: 'completed',
    setup: {
      startDate: '2025-09-01',
      endDate: '2025-12-31',
      competitors: ['長榮航空', '星宇航空'],
      budget: 50000000,
      majorEvents: ['中秋連假', '雙十連假'],
      marketConditions: 'recovery',
      simulationRounds: 3,
      strategy1: { name: '低價競爭策略', description: '降低票價吸引客戶', budget: 25000000 },
      strategy2: { name: '高端服務策略', description: '提升服務品質', budget: 25000000 }
    },
    detailedResults: {
      overview: {
        totalRounds: 3,
        winnerStrategy: '高端服務策略',
        keyFactors: ['服務品質差異化', '客戶忠誠度提升', '品牌價值增強'],
        marketImpact: '市占率提升2.3%，客戶滿意度顯著改善',
        riskLevel: 'medium'
      },
      roundResults: [
        {
          round: 1,
          scenario: '正常市場條件',
          side1Performance: {
            marketShare: 24.2,
            revenue: 1200000000,
            customerSatisfaction: 3.8,
            operationalEfficiency: 82
          },
          side2Performance: {
            marketShare: 25.8,
            revenue: 1350000000,
            customerSatisfaction: 4.3,
            operationalEfficiency: 88
          },
          keyEvents: ['服務品質提升獲得正面評價', '價格敏感客群流失'],
          winner: 'side2',
          analysis: '高端服務策略在正常市場條件下表現更佳，客戶滿意度明顯提升'
        },
        {
          round: 2,
          scenario: '經濟壓力情境',
          side1Performance: {
            marketShare: 26.1,
            revenue: 1180000000,
            customerSatisfaction: 3.6,
            operationalEfficiency: 85
          },
          side2Performance: {
            marketShare: 24.9,
            revenue: 1280000000,
            customerSatisfaction: 4.1,
            operationalEfficiency: 86
          },
          keyEvents: ['經濟壓力下價格優勢顯現', '高端客群維持忠誠度'],
          winner: 'side1',
          analysis: '經濟壓力下低價策略獲得市占率優勢，但營收效率較低'
        },
        {
          round: 3,
          scenario: '市場復甦期',
          side1Performance: {
            marketShare: 23.8,
            revenue: 1320000000,
            customerSatisfaction: 3.9,
            operationalEfficiency: 83
          },
          side2Performance: {
            marketShare: 27.2,
            revenue: 1480000000,
            customerSatisfaction: 4.4,
            operationalEfficiency: 90
          },
          keyEvents: ['市場復甦帶動高端需求', '服務品質成為關鍵差異化因素'],
          winner: 'side2',
          analysis: '市場復甦期高端服務策略優勢明顯，營收和市占率雙重領先'
        }
      ],
      actionRecommendations: [
        {
          category: 'immediate',
          title: '強化服務品質標準',
          description: '立即實施服務品質提升計畫，重點改善客艙服務和地面服務體驗',
          priority: 'high',
          expectedImpact: '客戶滿意度提升0.3分，客戶忠誠度增加15%'
        },
        {
          category: 'short-term',
          title: '差異化定價策略',
          description: '建立多層次定價體系，在保持服務品質的同時提供價格選擇',
          priority: 'high',
          expectedImpact: '擴大客群覆蓋，市占率提升2-3%'
        },
        {
          category: 'long-term',
          title: '品牌價值建設',
          description: '長期投資品牌建設，建立高端服務的市場認知',
          priority: 'medium',
          expectedImpact: '品牌溢價能力提升，長期競爭優勢建立'
        }
      ],
      timelineAnalysis: [
        {
          period: '第1季',
          events: [
            {
              date: '2025-09-15',
              event: '服務標準升級實施',
              impact: 'positive',
              description: '新的服務標準開始實施，客戶反饋積極'
            },
            {
              date: '2025-10-01',
              event: '中秋連假需求高峰',
              impact: 'positive',
              description: '連假期間高端服務策略表現優異，客戶滿意度提升'
            }
          ]
        },
        {
          period: '第2季',
          events: [
            {
              date: '2025-11-15',
              event: '競爭對手降價反應',
              impact: 'negative',
              description: '競爭對手推出降價策略，對市占率造成短期壓力'
            },
            {
              date: '2025-12-01',
              event: '年末旅遊旺季',
              impact: 'positive',
              description: '年末旺季高端服務需求增加，策略優勢明顯'
            }
          ]
        }
      ]
    }
  },
  {
    id: '2',
    title: '數位行銷 vs 傳統廣告',
    date: '2025-08-28 16:15',
    participants: {
      side1: '數位行銷策略',
      side2: '傳統廣告策略'
    },
    result: {
      winner: 'side1',
      confidence: 0.68
    },
    duration: '3分52秒',
    status: 'completed',
    setup: {
      startDate: '2025-09-01',
      endDate: '2025-11-30',
      competitors: ['長榮航空'],
      budget: 30000000,
      majorEvents: ['國慶連假'],
      marketConditions: 'normal',
      simulationRounds: 5,
      strategy1: { name: '數位行銷策略', description: '社群媒體與線上廣告', budget: 15000000 },
      strategy2: { name: '傳統廣告策略', description: '電視與平面廣告', budget: 15000000 }
    },
    detailedResults: {
      overview: {
        totalRounds: 5,
        winnerStrategy: '數位行銷策略',
        keyFactors: ['精準客群定位', '成本效益優勢', '即時反饋調整'],
        marketImpact: '年輕客群增加35%，整體品牌知名度提升',
        riskLevel: 'low'
      },
      roundResults: [
        {
          round: 1,
          scenario: '年輕客群導向',
          side1Performance: {
            marketShare: 26.5,
            revenue: 1250000000,
            customerSatisfaction: 4.1,
            operationalEfficiency: 87
          },
          side2Performance: {
            marketShare: 24.2,
            revenue: 1180000000,
            customerSatisfaction: 3.9,
            operationalEfficiency: 84
          },
          keyEvents: ['社群媒體病毒式傳播', '年輕客群響應熱烈'],
          winner: 'side1',
          analysis: '數位行銷在年輕客群中獲得顯著優勢，社群效應明顯'
        },
        {
          round: 2,
          scenario: '中高齡客群導向',
          side1Performance: {
            marketShare: 23.8,
            revenue: 1150000000,
            customerSatisfaction: 3.8,
            operationalEfficiency: 85
          },
          side2Performance: {
            marketShare: 25.9,
            revenue: 1280000000,
            customerSatisfaction: 4.2,
            operationalEfficiency: 88
          },
          keyEvents: ['傳統媒體觸及率高', '中高齡客群信任度提升'],
          winner: 'side2',
          analysis: '傳統廣告在中高齡客群中表現更佳，信任度和認知度較高'
        }
      ],
      actionRecommendations: [
        {
          category: 'immediate',
          title: '整合行銷策略',
          description: '結合數位和傳統行銷優勢，針對不同客群採用不同策略',
          priority: 'high',
          expectedImpact: '全客群覆蓋，行銷效果最大化'
        }
      ],
      timelineAnalysis: [
        {
          period: '第1季',
          events: [
            {
              date: '2025-09-10',
              event: '數位行銷活動啟動',
              impact: 'positive',
              description: '社群媒體和線上廣告同步啟動，初期反應良好'
            }
          ]
        }
      ]
    }
  }
];

export const StrategySimulationPage: React.FC<StrategySimulationPageProps> = ({
  className,
  onOpenDataTab,
  simulationRecords = mockSimulationRecords,
  onRecordSelect
}) => {
  const [activeView, setActiveView] = useState<'setup' | 'battle' | 'results'>('setup');
  const [simulationSetup, setSimulationSetup] = useState<SimulationSetup>({
    startDate: '2025-09-01',
    endDate: '2025-12-31',
    competitors: ['長榮航空', '星宇航空'],
    budget: 50000000,
    majorEvents: [],
    marketConditions: 'normal',
    simulationRounds: 3,
    strategy1: { name: '', description: '', budget: 25000000 },
    strategy2: { name: '', description: '', budget: 25000000 }
  });
  const [selectedRecord, setSelectedRecord] = useState<SimulationRecord | null>(null);

  // 使用外部傳入的記錄選擇
  const handleRecordSelect = (record: SimulationRecord) => {
    setSelectedRecord(record);
    onRecordSelect?.(record);
  };
  const [isSimulating, setIsSimulating] = useState(false);
  const [detailView, setDetailView] = useState<'overview' | 'rounds' | 'recommendations' | 'timeline'>('overview');

  const handleStartSimulation = () => {
    if (simulationSetup.strategy1.name && simulationSetup.strategy2.name) {
      setIsSimulating(true);
      setActiveView('battle');
      // 模擬推演過程
      setTimeout(() => {
        setIsSimulating(false);
        setActiveView('results');
      }, 3000);
    }
  };

  const exportData = (dataType: string) => {
    if (onOpenDataTab) {
      const mockFile = {
        filename: `simulation_${dataType}_${new Date().toISOString().split('T')[0]}.csv`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        fullPath: `marketing-sandbox/simulation_${dataType}.csv`
      };
      
      let data: any[] = [];
      switch (dataType) {
        case 'setup':
          data = [simulationSetup];
          break;
        case 'records':
          data = mockSimulationRecords;
          break;
      }
      
      onOpenDataTab('simulation', mockFile, data);
    }
  };

  return (
    <div className={cn("h-full overflow-y-auto p-6 bg-gray-50", className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">策略推演</h1>
            <p className="text-gray-600 mt-1">多策略對戰分析與市場情境模擬</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => exportData('records')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              匯出推演記錄
            </button>
          </div>
        </div>
      </div>

      {selectedRecord ? (
        // 查看推演記錄詳情 - 完整版本
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedRecord.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>推演時間: {selectedRecord.date}</span>
                  <span>推演時長: {selectedRecord.duration}</span>
                  <span className="flex items-center">
                    勝出策略:
                    <span className="ml-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      {selectedRecord.result.winner === 'side1' ? selectedRecord.participants.side1 : selectedRecord.participants.side2}
                    </span>
                  </span>
                  <span>信心度: {(selectedRecord.result.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-white p-4 border-b border-gray-200">
            {[
              { id: 'overview', name: '總覽', icon: BarChart3 },
              { id: 'rounds', name: '每輪策略', icon: Target },
              { id: 'recommendations', name: '行動建議', icon: Zap },
              { id: 'timeline', name: '時間序列', icon: Calendar }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDetailView(tab.id as any)}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  detailView === tab.id
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {detailView === 'overview' && selectedRecord.detailedResults && (
              <div className="space-y-6">
                {/* Strategy Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">{selectedRecord.participants.side1}</h3>
                    <p className="text-blue-800 mb-4">{selectedRecord.setup.strategy1.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">預算:</span>
                        <span className="font-medium text-blue-900">${selectedRecord.setup.strategy1.budget.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">勝出輪數:</span>
                        <span className="font-medium text-blue-900">
                          {selectedRecord.detailedResults.roundResults.filter(r => r.winner === 'side1').length} / {selectedRecord.detailedResults.totalRounds}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                    <h3 className="text-lg font-semibold text-red-900 mb-4">{selectedRecord.participants.side2}</h3>
                    <p className="text-red-800 mb-4">{selectedRecord.setup.strategy2.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-red-700">預算:</span>
                        <span className="font-medium text-red-900">${selectedRecord.setup.strategy2.budget.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700">勝出輪數:</span>
                        <span className="font-medium text-red-900">
                          {selectedRecord.detailedResults.roundResults.filter(r => r.winner === 'side2').length} / {selectedRecord.detailedResults.totalRounds}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overview Summary */}
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">推演總結</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">關鍵成功因素</h4>
                      <ul className="space-y-2">
                        {selectedRecord.detailedResults.overview.keyFactors.map((factor, idx) => (
                          <li key={idx} className="flex items-center text-sm text-gray-700">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">市場影響</h4>
                      <p className="text-sm text-gray-700 mb-3">{selectedRecord.detailedResults.overview.marketImpact}</p>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 mr-2">風險等級:</span>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          selectedRecord.detailedResults.overview.riskLevel === 'high' ? "bg-red-100 text-red-700" :
                          selectedRecord.detailedResults.overview.riskLevel === 'medium' ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                        )}>
                          {selectedRecord.detailedResults.overview.riskLevel === 'high' ? '高風險' :
                           selectedRecord.detailedResults.overview.riskLevel === 'medium' ? '中風險' : '低風險'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {detailView === 'rounds' && selectedRecord.detailedResults && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">各輪推演詳情</h3>
                {selectedRecord.detailedResults.roundResults.map((round, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-6 shadow-sm border">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">第 {round.round} 輪: {round.scenario}</h4>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-sm font-medium",
                        round.winner === 'side1' ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                      )}>
                        勝出: {round.winner === 'side1' ? selectedRecord.participants.side1 : selectedRecord.participants.side2}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      <div className="space-y-3">
                        <h5 className="font-medium text-blue-900">{selectedRecord.participants.side1} 表現</h5>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-blue-50 p-3 rounded">
                            <div className="text-blue-600">市占率</div>
                            <div className="font-bold text-blue-900">{round.side1Performance.marketShare}%</div>
                          </div>
                          <div className="bg-blue-50 p-3 rounded">
                            <div className="text-blue-600">營收</div>
                            <div className="font-bold text-blue-900">${(round.side1Performance.revenue / 1000000).toFixed(0)}M</div>
                          </div>
                          <div className="bg-blue-50 p-3 rounded">
                            <div className="text-blue-600">客戶滿意度</div>
                            <div className="font-bold text-blue-900">{round.side1Performance.customerSatisfaction}/5</div>
                          </div>
                          <div className="bg-blue-50 p-3 rounded">
                            <div className="text-blue-600">營運效率</div>
                            <div className="font-bold text-blue-900">{round.side1Performance.operationalEfficiency}%</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h5 className="font-medium text-red-900">{selectedRecord.participants.side2} 表現</h5>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-red-50 p-3 rounded">
                            <div className="text-red-600">市占率</div>
                            <div className="font-bold text-red-900">{round.side2Performance.marketShare}%</div>
                          </div>
                          <div className="bg-red-50 p-3 rounded">
                            <div className="text-red-600">營收</div>
                            <div className="font-bold text-red-900">${(round.side2Performance.revenue / 1000000).toFixed(0)}M</div>
                          </div>
                          <div className="bg-red-50 p-3 rounded">
                            <div className="text-red-600">客戶滿意度</div>
                            <div className="font-bold text-red-900">{round.side2Performance.customerSatisfaction}/5</div>
                          </div>
                          <div className="bg-red-50 p-3 rounded">
                            <div className="text-red-600">營運效率</div>
                            <div className="font-bold text-red-900">{round.side2Performance.operationalEfficiency}%</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">關鍵事件</h5>
                        <ul className="space-y-1">
                          {round.keyEvents.map((event, eventIdx) => (
                            <li key={eventIdx} className="flex items-center text-sm text-gray-700">
                              <ArrowRight className="w-3 h-3 text-gray-400 mr-2" />
                              {event}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">分析結論</h5>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{round.analysis}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {detailView === 'recommendations' && selectedRecord.detailedResults && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">行動建議</h3>

                {/* Immediate Actions */}
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <h4 className="text-lg font-medium text-red-700 mb-4 flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    立即行動 (0-1個月)
                  </h4>
                  <div className="space-y-4">
                    {selectedRecord.detailedResults.actionRecommendations
                      .filter(rec => rec.category === 'immediate')
                      .map((rec, idx) => (
                      <div key={idx} className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-medium text-red-900">{rec.title}</h5>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            rec.priority === 'high' ? "bg-red-100 text-red-700" :
                            rec.priority === 'medium' ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                          )}>
                            {rec.priority === 'high' ? '高優先' : rec.priority === 'medium' ? '中優先' : '低優先'}
                          </span>
                        </div>
                        <p className="text-sm text-red-800 mb-3">{rec.description}</p>
                        <div className="text-xs text-red-700">
                          <strong>預期影響:</strong> {rec.expectedImpact}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Short-term Actions */}
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <h4 className="text-lg font-medium text-orange-700 mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    短期行動 (1-6個月)
                  </h4>
                  <div className="space-y-4">
                    {selectedRecord.detailedResults.actionRecommendations
                      .filter(rec => rec.category === 'short-term')
                      .map((rec, idx) => (
                      <div key={idx} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-medium text-orange-900">{rec.title}</h5>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            rec.priority === 'high' ? "bg-red-100 text-red-700" :
                            rec.priority === 'medium' ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                          )}>
                            {rec.priority === 'high' ? '高優先' : rec.priority === 'medium' ? '中優先' : '低優先'}
                          </span>
                        </div>
                        <p className="text-sm text-orange-800 mb-3">{rec.description}</p>
                        <div className="text-xs text-orange-700">
                          <strong>預期影響:</strong> {rec.expectedImpact}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Long-term Actions */}
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <h4 className="text-lg font-medium text-blue-700 mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    長期規劃 (6個月以上)
                  </h4>
                  <div className="space-y-4">
                    {selectedRecord.detailedResults.actionRecommendations
                      .filter(rec => rec.category === 'long-term')
                      .map((rec, idx) => (
                      <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-medium text-blue-900">{rec.title}</h5>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            rec.priority === 'high' ? "bg-red-100 text-red-700" :
                            rec.priority === 'medium' ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                          )}>
                            {rec.priority === 'high' ? '高優先' : rec.priority === 'medium' ? '中優先' : '低優先'}
                          </span>
                        </div>
                        <p className="text-sm text-blue-800 mb-3">{rec.description}</p>
                        <div className="text-xs text-blue-700">
                          <strong>預期影響:</strong> {rec.expectedImpact}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {detailView === 'timeline' && selectedRecord.detailedResults && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">時間序列分析</h3>

                {selectedRecord.detailedResults.timelineAnalysis.map((period, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-6 shadow-sm border">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">{period.period}</h4>
                    <div className="space-y-4">
                      {period.events.map((event, eventIdx) => (
                        <div key={eventIdx} className="relative">
                          {eventIdx < period.events.length - 1 && (
                            <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
                          )}

                          <div className="flex items-start space-x-4">
                            <div className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                              event.impact === 'positive' ? "bg-green-100 text-green-600" :
                              event.impact === 'negative' ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"
                            )}>
                              {event.impact === 'positive' ? <TrendingUp className="w-5 h-5" /> :
                               event.impact === 'negative' ? <TrendingUp className="w-5 h-5 rotate-180" /> :
                               <Calendar className="w-5 h-5" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h5 className="font-medium text-gray-900">{event.event}</h5>
                                    <p className="text-sm text-gray-500">{event.date}</p>
                                  </div>
                                  <span className={cn(
                                    "px-2 py-1 rounded-full text-xs font-medium",
                                    event.impact === 'positive' ? "bg-green-100 text-green-700" :
                                    event.impact === 'negative' ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                                  )}>
                                    {event.impact === 'positive' ? '正面影響' :
                                     event.impact === 'negative' ? '負面影響' : '中性影響'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{event.description}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeView === 'setup' ? (
        // 推演設定頁面
        <div className="space-y-6">
          {/* 基本設定 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">推演基本設定</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">開始日期</label>
                <input
                  type="date"
                  value={simulationSetup.startDate}
                  onChange={(e) => setSimulationSetup(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">結束日期</label>
                <input
                  type="date"
                  value={simulationSetup.endDate}
                  onChange={(e) => setSimulationSetup(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">總預算 (NT$)</label>
                <input
                  type="number"
                  value={simulationSetup.budget}
                  onChange={(e) => setSimulationSetup(prev => ({ ...prev, budget: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">推演次數</label>
                <select
                  value={simulationSetup.simulationRounds}
                  onChange={(e) => setSimulationSetup(prev => ({ ...prev, simulationRounds: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value={1}>1次</option>
                  <option value={3}>3次</option>
                  <option value={5}>5次</option>
                  <option value={10}>10次</option>
                </select>
              </div>
            </div>
          </div>

          {/* 市場環境設定 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">市場環境設定</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">競爭對手</label>
                <div className="space-y-2">
                  {['長榮航空', '星宇航空', '台灣虎航', '酷航'].map((competitor) => (
                    <label key={competitor} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={simulationSetup.competitors.includes(competitor)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSimulationSetup(prev => ({ 
                              ...prev, 
                              competitors: [...prev.competitors, competitor] 
                            }));
                          } else {
                            setSimulationSetup(prev => ({ 
                              ...prev, 
                              competitors: prev.competitors.filter(c => c !== competitor) 
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{competitor}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">市場狀況</label>
                <select
                  value={simulationSetup.marketConditions}
                  onChange={(e) => setSimulationSetup(prev => ({ ...prev, marketConditions: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="recession">經濟衰退</option>
                  <option value="normal">正常狀況</option>
                  <option value="recovery">復甦期</option>
                  <option value="boom">經濟繁榮</option>
                </select>
              </div>
            </div>
          </div>

          {/* 重大事件設定 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">重大事件設定</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['春節連假', '清明連假', '端午連假', '中秋連假', '雙十連假', '跨年連假', '暑假旺季', '開學季'].map((event) => (
                <label key={event} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={simulationSetup.majorEvents.includes(event)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSimulationSetup(prev => ({ 
                          ...prev, 
                          majorEvents: [...prev.majorEvents, event] 
                        }));
                      } else {
                        setSimulationSetup(prev => ({ 
                          ...prev, 
                          majorEvents: prev.majorEvents.filter(ev => ev !== event) 
                        }));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{event}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 策略設定 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 策略A */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">策略方案 A</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="策略名稱"
                  value={simulationSetup.strategy1.name}
                  onChange={(e) => setSimulationSetup(prev => ({ 
                    ...prev, 
                    strategy1: { ...prev.strategy1, name: e.target.value } 
                  }))}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <textarea
                  placeholder="策略描述..."
                  value={simulationSetup.strategy1.description}
                  onChange={(e) => setSimulationSetup(prev => ({ 
                    ...prev, 
                    strategy1: { ...prev.strategy1, description: e.target.value } 
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                />
                <input
                  type="number"
                  placeholder="預算分配"
                  value={simulationSetup.strategy1.budget}
                  onChange={(e) => setSimulationSetup(prev => ({ 
                    ...prev, 
                    strategy1: { ...prev.strategy1, budget: parseInt(e.target.value) } 
                  }))}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* 策略B */}
            <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-lg border border-red-200">
              <h3 className="text-lg font-semibold text-red-900 mb-4">策略方案 B</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="策略名稱"
                  value={simulationSetup.strategy2.name}
                  onChange={(e) => setSimulationSetup(prev => ({ 
                    ...prev, 
                    strategy2: { ...prev.strategy2, name: e.target.value } 
                  }))}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:border-red-500"
                />
                <textarea
                  placeholder="策略描述..."
                  value={simulationSetup.strategy2.description}
                  onChange={(e) => setSimulationSetup(prev => ({ 
                    ...prev, 
                    strategy2: { ...prev.strategy2, description: e.target.value } 
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:border-red-500 resize-none"
                />
                <input
                  type="number"
                  placeholder="預算分配"
                  value={simulationSetup.strategy2.budget}
                  onChange={(e) => setSimulationSetup(prev => ({ 
                    ...prev, 
                    strategy2: { ...prev.strategy2, budget: parseInt(e.target.value) } 
                  }))}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* 開始推演按鈕 */}
          <div className="text-center">
            <button
              onClick={handleStartSimulation}
              disabled={!simulationSetup.strategy1.name || !simulationSetup.strategy2.name}
              className={cn(
                "px-8 py-3 rounded-lg font-semibold text-white transition-colors",
                simulationSetup.strategy1.name && simulationSetup.strategy2.name
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-gray-400 cursor-not-allowed"
              )}
            >
              <Play className="w-5 h-5 inline mr-2" />
              開始策略推演
            </button>
          </div>
        </div>
      ) : (
        // 推演進行中或結果頁面
        <div className="text-center py-12">
          <div className="mb-6">
            {isSimulating ? (
              <>
                <Zap className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-pulse" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">推演進行中...</h2>
                <p className="text-gray-600">正在分析 {simulationSetup.strategy1.name} vs {simulationSetup.strategy2.name}</p>
              </>
            ) : (
              <>
                <Target className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">推演完成</h2>
                <p className="text-gray-600">策略分析結果已生成</p>
                <button
                  onClick={() => setActiveView('setup')}
                  className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  返回設定
                </button>
              </>
            )}
          </div>
        </div>
      )}


    </div>
  );
};

export default StrategySimulationPage;
