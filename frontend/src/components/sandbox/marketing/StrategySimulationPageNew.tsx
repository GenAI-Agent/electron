import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import {
  Calendar,
  Clock,
  TrendingUp,
  Target,
  BarChart3,
  Play,
  X,
  Zap,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import HistorySidebar from '@/components/ui/HistorySidebar';

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
      timelineData: Array<{
        week: number;
        date: string;
        side1Metrics: {
          marketShare: number;
          revenue: number;
          customerSatisfaction: number;
          momentum: number;
          budgetSpent: number;
          keyActions: string[];
        };
        side2Metrics: {
          marketShare: number;
          revenue: number;
          customerSatisfaction: number;
          momentum: number;
          budgetSpent: number;
          keyActions: string[];
        };
        environmentData: {
          marketConditions: string;
          competitorActions: string[];
          externalEvents: string[];
          mediaAttention: number;
        };
        events: Array<{
          date: string;
          event: string;
          impact: 'positive' | 'negative' | 'neutral';
          description: string;
          affectedStrategy: 'side1' | 'side2' | 'both';
        }>;
      }>;
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
    title: '搶奪市占率',
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
      simulationRounds: 6,
      strategy1: { name: '低價競爭策略', description: '降低票價吸引客戶', budget: 25000000 },
      strategy2: { name: '高端服務策略', description: '提升服務品質', budget: 25000000 }
    },
    detailedResults: {
      overview: {
        totalRounds: 6,
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
          analysis: '高端服務策略在正常市場條件下表現更佳，客戶滿意度明顯提升',
          timelineData: Array.from({ length: 24 }, (_, week) => ({
            week: week + 1,
            date: new Date(2025, 8, 1 + week * 7).toISOString().split('T')[0],
            side1Metrics: {
              marketShare: 24.2 + week * 0.2,
              revenue: 1200000000 + week * 3000000,
              customerSatisfaction: 3.8 + week * 0.02,
              momentum: 1.5 + week * 0.05,
              budgetSpent: 8000000 + week * 400000,
              keyActions: ['價格調整', '市場宣傳', '客戶溝通']
            },
            side2Metrics: {
              marketShare: 25.8 + week * 0.3,
              revenue: 1350000000 + week * 5000000,
              customerSatisfaction: 4.3 + week * 0.03,
              momentum: 2.2 + week * 0.08,
              budgetSpent: 6000000 + week * 300000,
              keyActions: ['服務標準制定', '員工培訓', '客戶體驗優化']
            },
            environmentData: {
              marketConditions: '正常市場條件',
              competitorActions: ['觀望態度', '服務競爭'],
              externalEvents: ['經濟穩定', '旅遊需求正常'],
              mediaAttention: 75 + week * 0.3
            },
            events: week % 4 === 0 ? [{
              date: new Date(2025, 8, 1 + week * 7).toISOString().split('T')[0],
              event: `第${week + 1}週市場評估`,
              impact: 'positive',
              description: '服務策略執行進展順利',
              affectedStrategy: 'side2'
            }] : []
          }))
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
          analysis: '經濟壓力下低價策略獲得市占率優勢，但營收效率較低',
          timelineData: Array.from({ length: 24 }, (_, week) => ({
            week: week + 1,
            date: new Date(2025, 8, 8 + week * 7).toISOString().split('T')[0],
            side1Metrics: {
              marketShare: 26.1 + week * 0.3,
              revenue: 1180000000 + week * 4000000,
              customerSatisfaction: 3.6 + week * 0.02,
              momentum: 2.1 + week * 0.08,
              budgetSpent: 10000000 + week * 500000,
              keyActions: ['價格優勢發揮', '成本控制', '市場擴張']
            },
            side2Metrics: {
              marketShare: 24.9 + week * 0.1,
              revenue: 1280000000 + week * 2000000,
              customerSatisfaction: 4.1 + week * 0.01,
              momentum: 1.8 + week * 0.03,
              budgetSpent: 8000000 + week * 400000,
              keyActions: ['高端客群維護', '服務品質維持', '品牌價值保護']
            },
            environmentData: {
              marketConditions: '經濟壓力情境',
              competitorActions: ['價格競爭', '成本控制'],
              externalEvents: ['經濟壓力', '消費緊縮'],
              mediaAttention: 70 + week * 0.4
            },
            events: week % 3 === 0 ? [{
              date: new Date(2025, 8, 8 + week * 7).toISOString().split('T')[0],
              event: `經濟壓力第${Math.floor(week/3) + 1}階段評估`,
              impact: 'positive',
              description: '價格策略在經濟壓力下優勢顯現',
              affectedStrategy: 'side1'
            }] : []
          }))
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
          analysis: '市場復甦期高端服務策略優勢明顯，營收和市占率雙重領先',
          timelineData: Array.from({ length: 24 }, (_, week) => ({
            week: week + 1,
            date: new Date(2025, 8, 15 + week * 7).toISOString().split('T')[0],
            side1Metrics: {
              marketShare: 23.8 + week * 0.1,
              revenue: 1320000000 + week * 3000000,
              customerSatisfaction: 3.9 + week * 0.02,
              momentum: 1.2 + week * 0.04,
              budgetSpent: 12000000 + week * 600000,
              keyActions: ['市場適應', '策略調整', '競爭應對']
            },
            side2Metrics: {
              marketShare: 27.2 + week * 0.4,
              revenue: 1480000000 + week * 6000000,
              customerSatisfaction: 4.4 + week * 0.04,
              momentum: 2.8 + week * 0.12,
              budgetSpent: 10000000 + week * 500000,
              keyActions: ['高端需求滿足', '服務品質提升', '市場領導']
            },
            environmentData: {
              marketConditions: '市場復甦期',
              competitorActions: ['服務競爭', '品質提升'],
              externalEvents: ['經濟復甦', '高端需求增長'],
              mediaAttention: 85 + week * 0.5
            },
            events: week % 4 === 0 ? [{
              date: new Date(2025, 8, 15 + week * 7).toISOString().split('T')[0],
              event: `市場復甦第${Math.floor(week/4) + 1}階段評估`,
              impact: 'positive',
              description: '服務策略在復甦期優勢明顯',
              affectedStrategy: 'side2'
            }] : []
          }))
        },
        {
          round: 4,
          scenario: '競爭加劇期',
          side1Performance: {
            marketShare: 25.1,
            revenue: 1250000000,
            customerSatisfaction: 3.7,
            operationalEfficiency: 87
          },
          side2Performance: {
            marketShare: 28.5,
            revenue: 1520000000,
            customerSatisfaction: 4.5,
            operationalEfficiency: 92
          },
          keyEvents: ['競爭對手跟進服務提升', '價格戰降溫'],
          winner: 'side2',
          analysis: '服務策略在競爭加劇中展現優勢，客戶忠誠度成為關鍵',
          timelineData: Array.from({ length: 24 }, (_, week) => ({
            week: week + 1,
            date: new Date(2025, 8, 22 + week * 7).toISOString().split('T')[0],
            side1Metrics: {
              marketShare: 25.1 + week * 0.15,
              revenue: 1250000000 + week * 3500000,
              customerSatisfaction: 3.7 + week * 0.015,
              momentum: 1.4 + week * 0.06,
              budgetSpent: 14000000 + week * 700000,
              keyActions: ['競爭應對', '成本控制', '市場維持']
            },
            side2Metrics: {
              marketShare: 28.5 + week * 0.45,
              revenue: 1520000000 + week * 7000000,
              customerSatisfaction: 4.5 + week * 0.05,
              momentum: 3.0 + week * 0.14,
              budgetSpent: 12000000 + week * 600000,
              keyActions: ['服務創新', '客戶體驗升級', '競爭優勢鞏固']
            },
            environmentData: {
              marketConditions: '競爭加劇期',
              competitorActions: ['服務提升', '價格調整'],
              externalEvents: ['市場競爭激烈', '客戶選擇多樣化'],
              mediaAttention: 88 + week * 0.4
            },
            events: week % 5 === 0 ? [{
              date: new Date(2025, 8, 22 + week * 7).toISOString().split('T')[0],
              event: `競爭加劇第${Math.floor(week/5) + 1}階段評估`,
              impact: 'positive',
              description: '服務策略在競爭中優勢明顯',
              affectedStrategy: 'side2'
            }] : []
          }))
        },
        {
          round: 5,
          scenario: '市場成熟期',
          side1Performance: {
            marketShare: 26.3,
            revenue: 1280000000,
            customerSatisfaction: 3.8,
            operationalEfficiency: 89
          },
          side2Performance: {
            marketShare: 29.8,
            revenue: 1580000000,
            customerSatisfaction: 4.6,
            operationalEfficiency: 94
          },
          keyEvents: ['市場格局穩定', '服務差異化確立'],
          winner: 'side2',
          analysis: '服務策略在市場成熟期確立領導地位',
          timelineData: Array.from({ length: 24 }, (_, week) => ({
            week: week + 1,
            date: new Date(2025, 8, 29 + week * 7).toISOString().split('T')[0],
            side1Metrics: {
              marketShare: 26.3 + week * 0.12,
              revenue: 1280000000 + week * 3200000,
              customerSatisfaction: 3.8 + week * 0.012,
              momentum: 1.6 + week * 0.05,
              budgetSpent: 16000000 + week * 800000,
              keyActions: ['市場維持', '效率提升', '成本優化']
            },
            side2Metrics: {
              marketShare: 29.8 + week * 0.5,
              revenue: 1580000000 + week * 8000000,
              customerSatisfaction: 4.6 + week * 0.06,
              momentum: 3.4 + week * 0.16,
              budgetSpent: 14000000 + week * 700000,
              keyActions: ['市場領導', '服務標準制定', '品牌價值提升']
            },
            environmentData: {
              marketConditions: '市場成熟期',
              competitorActions: ['跟隨策略', '差異化定位'],
              externalEvents: ['市場穩定', '客戶需求成熟'],
              mediaAttention: 90 + week * 0.3
            },
            events: week % 6 === 0 ? [{
              date: new Date(2025, 8, 29 + week * 7).toISOString().split('T')[0],
              event: `市場成熟第${Math.floor(week/6) + 1}階段評估`,
              impact: 'positive',
              description: '服務策略市場領導地位確立',
              affectedStrategy: 'side2'
            }] : []
          }))
        },
        {
          round: 6,
          scenario: '長期競爭優勢',
          side1Performance: {
            marketShare: 27.1,
            revenue: 1310000000,
            customerSatisfaction: 3.9,
            operationalEfficiency: 91
          },
          side2Performance: {
            marketShare: 31.2,
            revenue: 1650000000,
            customerSatisfaction: 4.7,
            operationalEfficiency: 96
          },
          keyEvents: ['長期競爭優勢確立', '品牌價值最大化'],
          winner: 'side2',
          analysis: '服務策略建立長期競爭優勢，品牌價值最大化',
          timelineData: Array.from({ length: 24 }, (_, week) => ({
            week: week + 1,
            date: new Date(2025, 9, 5 + week * 7).toISOString().split('T')[0],
            side1Metrics: {
              marketShare: 27.1 + week * 0.1,
              revenue: 1310000000 + week * 3000000,
              customerSatisfaction: 3.9 + week * 0.01,
              momentum: 1.8 + week * 0.04,
              budgetSpent: 18000000 + week * 900000,
              keyActions: ['長期規劃', '效率最大化', '市場適應']
            },
            side2Metrics: {
              marketShare: 31.2 + week * 0.55,
              revenue: 1650000000 + week * 9000000,
              customerSatisfaction: 4.7 + week * 0.07,
              momentum: 3.8 + week * 0.18,
              budgetSpent: 16000000 + week * 800000,
              keyActions: ['長期領導', '創新引領', '競爭優勢鞏固']
            },
            environmentData: {
              marketConditions: '長期競爭優勢期',
              competitorActions: ['跟隨策略', '市場適應'],
              externalEvents: ['市場成熟', '長期投資重視'],
              mediaAttention: 92 + week * 0.25
            },
            events: week % 8 === 0 ? [{
              date: new Date(2025, 9, 5 + week * 7).toISOString().split('T')[0],
              event: `長期競爭第${Math.floor(week/8) + 1}階段評估`,
              impact: 'positive',
              description: '服務策略長期競爭優勢確立',
              affectedStrategy: 'side2'
            }] : []
          }))
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
    title: '品牌推廣',
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
      startDate: '2025-08-28',
      endDate: '2025-12-28',
      competitors: ['長榮航空'],
      budget: 30000000,
      majorEvents: ['國慶連假'],
      marketConditions: 'normal',
      simulationRounds: 6,
      strategy1: { name: '數位行銷', description: '全面數位化行銷策略，精準投放', budget: 15000000 },
      strategy2: { name: '傳統廣告', description: '電視、報紙等傳統媒體廣告', budget: 15000000 }
    },
    detailedResults: {
      overview: {
        totalRounds: 6,
        winnerStrategy: '數位行銷',
        keyFactors: ['投放精準度', '成本效益', '受眾覆蓋'],
        marketImpact: '數位行銷在成本效益和精準度方面優勢明顯',
        riskLevel: 'low'
      },
      roundResults: [
        {
          round: 1,
          scenario: '初期投放效果',
          side1Performance: {
            marketShare: 26.8,
            revenue: 1280000000,
            customerSatisfaction: 72,
            operationalEfficiency: 88
          },
          side2Performance: {
            marketShare: 27.2,
            revenue: 1300000000,
            customerSatisfaction: 70,
            operationalEfficiency: 75
          },
          keyEvents: ['數位廣告上線', '傳統廣告投放'],
          winner: 'side2',
          analysis: '傳統廣告初期覆蓋面更廣',
          timelineData: Array.from({ length: 24 }, (_, week) => ({
            week: week + 1,
            date: new Date(2025, 7, 28 + week * 7).toISOString().split('T')[0],
            side1Metrics: {
              marketShare: 26.8 + week * 0.4,
              revenue: 1280000000 + week * 6000000,
              customerSatisfaction: 72 + week * 0.3,
              momentum: 1.8 + week * 0.1,
              budgetSpent: 5000000 + week * 300000,
              keyActions: ['數位廣告投放', '數據分析開始', '受眾定位']
            },
            side2Metrics: {
              marketShare: 27.2 + week * 0.2,
              revenue: 1300000000 + week * 4000000,
              customerSatisfaction: 70 + week * 0.2,
              momentum: 2.2 - week * 0.05,
              budgetSpent: 8000000 + week * 500000,
              keyActions: ['電視廣告投放', '報紙廣告刊登', '媒體合作']
            },
            environmentData: {
              marketConditions: '數位化趨勢明顯',
              competitorActions: ['數位轉型加速', '傳統媒體調整'],
              externalEvents: ['網路使用率提升', '移動設備普及'],
              mediaAttention: 70 + week * 0.6
            },
            events: week % 4 === 0 ? [{
              date: new Date(2025, 7, 28 + week * 7).toISOString().split('T')[0],
              event: `數位行銷第${Math.floor(week/4) + 1}階段評估`,
              impact: 'positive',
              description: '數位行銷效果逐漸顯現',
              affectedStrategy: 'side1'
            }] : []
          }))
        },
        {
          round: 2,
          scenario: '精準度對比',
          side1Performance: {
            marketShare: 28.5,
            revenue: 1320000000,
            customerSatisfaction: 75,
            operationalEfficiency: 90
          },
          side2Performance: {
            marketShare: 27.8,
            revenue: 1310000000,
            customerSatisfaction: 71,
            operationalEfficiency: 78
          },
          keyEvents: ['數據分析結果', '投放策略調整'],
          winner: 'side1',
          analysis: '數位行銷精準度優勢開始顯現',
          timelineData: Array.from({ length: 24 }, (_, week) => ({
            week: week + 1,
            date: new Date(2025, 8, 4 + week * 7).toISOString().split('T')[0],
            side1Metrics: {
              marketShare: 28.5 + week * 0.5,
              revenue: 1320000000 + week * 7000000,
              customerSatisfaction: 75 + week * 0.4,
              momentum: 2.3 + week * 0.12,
              budgetSpent: 7000000 + week * 400000,
              keyActions: ['精準投放優化', '受眾分析', '轉換率提升']
            },
            side2Metrics: {
              marketShare: 27.8 + week * 0.15,
              revenue: 1310000000 + week * 3000000,
              customerSatisfaction: 71 + week * 0.15,
              momentum: 1.8 - week * 0.03,
              budgetSpent: 10000000 + week * 600000,
              keyActions: ['傳統媒體調整', '覆蓋面擴大', '品牌曝光']
            },
            environmentData: {
              marketConditions: '精準投放需求增加',
              competitorActions: ['數位化加速', '傳統媒體轉型'],
              externalEvents: ['數據分析技術成熟', '個性化需求增長'],
              mediaAttention: 75 + week * 0.5
            },
            events: week % 3 === 0 ? [{
              date: new Date(2025, 8, 4 + week * 7).toISOString().split('T')[0],
              event: `精準度第${Math.floor(week/3) + 1}次對比`,
              impact: 'positive',
              description: '數位行銷精準度優勢確立',
              affectedStrategy: 'side1'
            }] : []
          }))
        },
        {
          round: 3,
          scenario: '成本效益分析',
          side1Performance: {
            marketShare: 30.2,
            revenue: 1350000000,
            customerSatisfaction: 78,
            operationalEfficiency: 92
          },
          side2Performance: {
            marketShare: 28.1,
            revenue: 1320000000,
            customerSatisfaction: 72,
            operationalEfficiency: 80
          },
          keyEvents: ['ROI計算完成', '成本控制優化'],
          winner: 'side1',
          analysis: '數位行銷成本效益明顯優於傳統廣告',
          timelineData: Array.from({ length: 24 }, (_, week) => ({
            week: week + 1,
            date: new Date(2025, 8, 11 + week * 7).toISOString().split('T')[0],
            side1Metrics: {
              marketShare: 30.2 + week * 0.6,
              revenue: 1350000000 + week * 8000000,
              customerSatisfaction: 78 + week * 0.5,
              momentum: 2.8 + week * 0.15,
              budgetSpent: 9000000 + week * 500000,
              keyActions: ['成本效益優化', 'ROI提升', '自動化投放']
            },
            side2Metrics: {
              marketShare: 28.1 + week * 0.1,
              revenue: 1320000000 + week * 2000000,
              customerSatisfaction: 72 + week * 0.1,
              momentum: 1.5 - week * 0.05,
              budgetSpent: 12000000 + week * 700000,
              keyActions: ['成本控制', '效率提升', '媒體整合']
            },
            environmentData: {
              marketConditions: '成本效益成為關鍵',
              competitorActions: ['數位化轉型', '成本控制'],
              externalEvents: ['經濟效益考量', '投資回報重視'],
              mediaAttention: 80 + week * 0.4
            },
            events: week % 6 === 0 ? [{
              date: new Date(2025, 8, 11 + week * 7).toISOString().split('T')[0],
              event: `成本效益第${Math.floor(week/6) + 1}階段評估`,
              impact: 'positive',
              description: '數位行銷成本效益優勢確立',
              affectedStrategy: 'side1'
            }] : []
          }))
        },
        {
          round: 4,
          scenario: '受眾覆蓋對比',
          side1Performance: {
            marketShare: 31.8,
            revenue: 1380000000,
            customerSatisfaction: 81,
            operationalEfficiency: 94
          },
          side2Performance: {
            marketShare: 28.5,
            revenue: 1330000000,
            customerSatisfaction: 73,
            operationalEfficiency: 82
          },
          keyEvents: ['受眾分析完成', '覆蓋策略調整'],
          winner: 'side1',
          analysis: '數位行銷在受眾覆蓋和精準度方面全面領先',
          timelineData: Array.from({ length: 24 }, (_, week) => ({
            week: week + 1,
            date: new Date(2025, 8, 18 + week * 7).toISOString().split('T')[0],
            side1Metrics: {
              marketShare: 31.8 + week * 0.7,
              revenue: 1380000000 + week * 9000000,
              customerSatisfaction: 81 + week * 0.6,
              momentum: 3.2 + week * 0.18,
              budgetSpent: 11000000 + week * 600000,
              keyActions: ['受眾擴展', '覆蓋面提升', '精準度維持']
            },
            side2Metrics: {
              marketShare: 28.5 + week * 0.05,
              revenue: 1330000000 + week * 1000000,
              customerSatisfaction: 73 + week * 0.05,
              momentum: 1.2 - week * 0.08,
              budgetSpent: 14000000 + week * 800000,
              keyActions: ['覆蓋面維持', '成本控制', '效果評估']
            },
            environmentData: {
              marketConditions: '受眾覆蓋成為競爭焦點',
              competitorActions: ['數位化加速', '傳統媒體轉型'],
              externalEvents: ['受眾需求多樣化', '媒體碎片化'],
              mediaAttention: 85 + week * 0.3
            },
            events: week % 4 === 0 ? [{
              date: new Date(2025, 8, 18 + week * 7).toISOString().split('T')[0],
              event: `受眾覆蓋第${Math.floor(week/4) + 1}階段評估`,
              impact: 'positive',
              description: '數位行銷受眾覆蓋優勢確立',
              affectedStrategy: 'side1'
            }] : []
          }))
        },
        {
          round: 5,
          scenario: '長期效果評估',
          side1Performance: {
            marketShare: 33.2,
            revenue: 1420000000,
            customerSatisfaction: 84,
            operationalEfficiency: 96
          },
          side2Performance: {
            marketShare: 28.8,
            revenue: 1340000000,
            customerSatisfaction: 74,
            operationalEfficiency: 84
          },
          keyEvents: ['長期數據分析', '策略效果評估'],
          winner: 'side1',
          analysis: '數位行銷在長期效果和可持續性方面優勢明顯',
          timelineData: Array.from({ length: 24 }, (_, week) => ({
            week: week + 1,
            date: new Date(2025, 8, 25 + week * 7).toISOString().split('T')[0],
            side1Metrics: {
              marketShare: 33.2 + week * 0.8,
              revenue: 1420000000 + week * 10000000,
              customerSatisfaction: 84 + week * 0.7,
              momentum: 3.8 + week * 0.2,
              budgetSpent: 13000000 + week * 700000,
              keyActions: ['長期策略規劃', '可持續發展', '創新投放']
            },
            side2Metrics: {
              marketShare: 28.8 + week * 0.02,
              revenue: 1340000000 + week * 500000,
              customerSatisfaction: 74 + week * 0.02,
              momentum: 0.8 - week * 0.1,
              budgetSpent: 16000000 + week * 900000,
              keyActions: ['效果維持', '成本控制', '策略調整']
            },
            environmentData: {
              marketConditions: '長期效果成為關鍵考量',
              competitorActions: ['數位化轉型', '長期策略規劃'],
              externalEvents: ['市場成熟', '長期投資重視'],
              mediaAttention: 88 + week * 0.25
            },
            events: week % 8 === 0 ? [{
              date: new Date(2025, 8, 25 + week * 7).toISOString().split('T')[0],
              event: `長期效果第${Math.floor(week/8) + 1}階段評估`,
              impact: 'positive',
              description: '數位行銷長期優勢確立',
              affectedStrategy: 'side1'
            }] : []
          }))
        },
        {
          round: 6,
          scenario: '市場領導地位',
          side1Performance: {
            marketShare: 35.1,
            revenue: 1480000000,
            customerSatisfaction: 87,
            operationalEfficiency: 98
          },
          side2Performance: {
            marketShare: 29.2,
            revenue: 1350000000,
            customerSatisfaction: 75,
            operationalEfficiency: 86
          },
          keyEvents: ['市場領導地位確立', '競爭優勢鞏固'],
          winner: 'side1',
          analysis: '數位行銷全面領先，確立市場領導地位',
          timelineData: Array.from({ length: 24 }, (_, week) => ({
            week: week + 1,
            date: new Date(2025, 9, 1 + week * 7).toISOString().split('T')[0],
            side1Metrics: {
              marketShare: 35.1 + week * 0.9,
              revenue: 1480000000 + week * 12000000,
              customerSatisfaction: 87 + week * 0.8,
              momentum: 4.2 + week * 0.25,
              budgetSpent: 15000000 + week * 800000,
              keyActions: ['市場領導', '創新引領', '競爭優勢鞏固']
            },
            side2Metrics: {
              marketShare: 29.2 + week * 0.01,
              revenue: 1350000000 + week * 200000,
              customerSatisfaction: 75 + week * 0.01,
              momentum: 0.5 - week * 0.12,
              budgetSpent: 18000000 + week * 1000000,
              keyActions: ['跟隨策略', '成本控制', '市場維持']
            },
            environmentData: {
              marketConditions: '市場領導地位確立',
              competitorActions: ['跟隨策略', '差異化定位'],
              externalEvents: ['市場成熟', '領導者優勢'],
              mediaAttention: 92 + week * 0.2
            },
            events: week % 12 === 0 ? [{
              date: new Date(2025, 9, 1 + week * 7).toISOString().split('T')[0],
              event: `市場領導第${Math.floor(week/12) + 1}階段評估`,
              impact: 'positive',
              description: '數位行銷市場領導地位確立',
              affectedStrategy: 'side1'
            }] : []
          }))
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
    simulationRounds: 6,
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
  const [detailView, setDetailView] = useState<'overview' | 'rounds' | 'recommendations'>('overview');
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());

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

  const toggleRoundExpansion = (roundNumber: number) => {
    const newExpanded = new Set(expandedRounds);
    if (newExpanded.has(roundNumber)) {
      newExpanded.delete(roundNumber);
    } else {
      newExpanded.add(roundNumber);
    }
    setExpandedRounds(newExpanded);
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
    <div className={cn("h-full flex overflow-hidden pb-14", className)}>
      {/* Left Icon Sidebar */}
      <HistorySidebar
        items={mockSimulationRecords.map((record) => ({
          id: record.id,
          title: record.title,
          date: record.date,
          duration: record.duration,
          status: record.status,
          description: `勝出策略: ${record.detailedResults?.overview.winnerStrategy || '未知'}`,
          metadata: `${record.participants.side1} vs ${record.participants.side2}`,
          isActive: selectedRecord?.id === record.id,
          onClick: () => setSelectedRecord(record)
        }))}
        onAddNew={() => { }}
        title="推演歷史"
      />
      {selectedRecord ? (
        <div className="h-full w-full flex flex-col">
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
                    <span className="ml-1 text-gray-900 font-medium">
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
            { id: 'recommendations', name: '行動建議', icon: Zap }
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
                          {selectedRecord.detailedResults.roundResults.filter(r => r.winner === 'side1').length} / {selectedRecord.detailedResults.overview.totalRounds}
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
                          {selectedRecord.detailedResults.roundResults.filter(r => r.winner === 'side2').length} / {selectedRecord.detailedResults.overview.totalRounds}
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
                            <CheckCircle className="w-4 h-4 text-blue-500 mr-2" />
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
                          selectedRecord.detailedResults.overview.riskLevel === 'high' ? "bg-orange-100 text-orange-700" :
                            selectedRecord.detailedResults.overview.riskLevel === 'medium' ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
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
                         round.winner === 'side1' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
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
                         <h5 className="font-medium text-orange-900">{selectedRecord.participants.side2} 表現</h5>
                         <div className="grid grid-cols-2 gap-3 text-sm">
                           <div className="bg-orange-50 p-3 rounded">
                             <div className="text-orange-600">市占率</div>
                             <div className="font-bold text-orange-900">{round.side2Performance.marketShare}%</div>
                           </div>
                           <div className="bg-orange-50 p-3 rounded">
                             <div className="text-orange-600">營收</div>
                             <div className="font-bold text-orange-900">${(round.side2Performance.revenue / 1000000).toFixed(0)}M</div>
                           </div>
                           <div className="bg-orange-50 p-3 rounded">
                             <div className="text-orange-600">客戶滿意度</div>
                             <div className="font-bold text-orange-900">{round.side2Performance.customerSatisfaction}/5</div>
                           </div>
                           <div className="bg-orange-50 p-3 rounded">
                             <div className="text-orange-600">營運效率</div>
                             <div className="font-bold text-orange-900">{round.side2Performance.operationalEfficiency}%</div>
                           </div>
                         </div>
                       </div>
                     </div>

                     <div className="space-y-3 mb-6">
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

                                           {/* 時間序列分析 */}
                      <div className="border-t pt-6">
                        <button
                          onClick={() => toggleRoundExpansion(round.round)}
                          className="flex items-center justify-between w-full text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
                        >
                          <h5 className="font-medium text-gray-700 flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            24週時間序列分析
                          </h5>
                          {expandedRounds.has(round.round) ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                        
                                                 {expandedRounds.has(round.round) && (
                           <>
                             {/* 詳細時間軸數據 */}
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                               <div>
                                 <h6 className="font-medium text-blue-700 mb-2">{selectedRecord.participants.side1} 時間軸數據</h6>
                                 <div className="space-y-2 max-h-64 overflow-y-auto">
                                   {round.timelineData.slice(0, 8).map((data, weekIdx) => (
                                     <div key={weekIdx} className="bg-blue-50 p-3 rounded text-sm">
                                       <div className="flex justify-between items-center mb-1">
                                         <span className="font-medium text-blue-900">第{data.week}週 ({data.date})</span>
                                         <span className="text-blue-700">市占率: {data.side1Metrics.marketShare.toFixed(1)}%</span>
                                       </div>
                                       <div className="grid grid-cols-2 gap-2 text-xs">
                                         <div>營收: ${(data.side1Metrics.revenue / 1000000).toFixed(0)}M</div>
                                         <div>滿意度: {data.side1Metrics.customerSatisfaction.toFixed(1)}</div>
                                         <div>動能: {data.side1Metrics.momentum.toFixed(1)}</div>
                                         <div>預算: ${(data.side1Metrics.budgetSpent / 1000000).toFixed(1)}M</div>
                                       </div>
                                       <div className="mt-2">
                                         <div className="text-xs text-blue-600 font-medium">關鍵行動:</div>
                                         <div className="text-xs text-blue-700">
                                           {data.side1Metrics.keyActions.join(', ')}
                                         </div>
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                               </div>

                               <div>
                                 <h6 className="font-medium text-red-700 mb-2">{selectedRecord.participants.side2} 時間軸數據</h6>
                                 <div className="space-y-2 max-h-64 overflow-y-auto">
                                   {round.timelineData.slice(0, 8).map((data, weekIdx) => (
                                     <div key={weekIdx} className="bg-red-50 p-3 rounded text-sm">
                                       <div className="flex justify-between items-center mb-1">
                                         <span className="font-medium text-red-900">第{data.week}週 ({data.date})</span>
                                         <span className="text-red-700">市占率: {data.side2Metrics.marketShare.toFixed(1)}%</span>
                                       </div>
                                       <div className="grid grid-cols-2 gap-2 text-xs">
                                         <div>營收: ${(data.side2Metrics.revenue / 1000000).toFixed(0)}M</div>
                                         <div>滿意度: {data.side2Metrics.customerSatisfaction.toFixed(1)}</div>
                                         <div>動能: {data.side2Metrics.momentum.toFixed(1)}</div>
                                         <div>預算: ${(data.side2Metrics.budgetSpent / 1000000).toFixed(1)}M</div>
                                       </div>
                                       <div className="mt-2">
                                         <div className="text-xs text-red-600 font-medium">關鍵行動:</div>
                                         <div className="text-xs text-red-700">
                                           {data.side2Metrics.keyActions.join(', ')}
                                         </div>
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             </div>

                             {/* 環境數據和重大事件 */}
                             <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                               <div className="bg-gray-50 p-4 rounded">
                                 <h6 className="font-medium text-gray-700 mb-2">市場環境變化</h6>
                                 <div className="space-y-2 text-sm">
                                   {round.timelineData.slice(0, 6).map((data, weekIdx) => (
                                     <div key={weekIdx} className="border-l-2 border-gray-300 pl-3">
                                       <div className="text-xs text-gray-500">第{data.week}週</div>
                                       <div className="text-gray-700">{data.environmentData.marketConditions}</div>
                                       <div className="text-xs text-gray-600">
                                         競爭者行動: {data.environmentData.competitorActions.join(', ')}
                                       </div>
                                       <div className="text-xs text-gray-600">
                                         外部事件: {data.environmentData.externalEvents.join(', ')}
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                               </div>

                               <div className="bg-gray-50 p-4 rounded">
                                 <h6 className="font-medium text-gray-700 mb-2">重大事件時間軸</h6>
                                 <div className="space-y-2 text-sm">
                                   {round.timelineData.filter(data => data.events.length > 0).slice(0, 6).map((data, weekIdx) => (
                                     <div key={weekIdx}>
                                       {data.events.map((event, eventIdx) => (
                                         <div key={eventIdx} className="border-l-2 border-orange-400 pl-3 mb-2">
                                           <div className="text-xs text-gray-500">{event.date}</div>
                                           <div className="font-medium text-gray-700">{event.event}</div>
                                           <div className="text-xs text-gray-600">{event.description}</div>
                                           <span className={cn(
                                             "inline-block px-2 py-1 rounded text-xs mt-1",
                                             event.impact === 'positive' ? "bg-green-100 text-green-700" :
                                             event.impact === 'negative' ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                                           )}>
                                             {event.impact === 'positive' ? '正面影響' : 
                                              event.impact === 'negative' ? '負面影響' : '中性影響'}
                                           </span>
                                         </div>
                                       ))}
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             </div>
                           </>
                         )}
                      </div>
                   </div>
                 ))}
               </div>
             )}

                         {detailView === 'recommendations' && selectedRecord.detailedResults && (
               <div className="space-y-6">
                 <h3 className="text-lg font-semibold text-gray-900">行動建議</h3>

                 {/* 立即行動 */}
                 <div className="bg-white rounded-lg p-6 shadow-sm border">
                   <h4 className="text-lg font-medium text-orange-700 mb-4 flex items-center">
                     <Zap className="w-5 h-5 mr-2" />
                     立即行動 (0-1個月)
                   </h4>
                   <div className="space-y-4">
                     {selectedRecord.detailedResults.actionRecommendations
                       .filter(rec => rec.category === 'immediate')
                       .map((rec, idx) => (
                         <div key={idx} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                           <div className="flex items-start justify-between mb-2">
                             <h5 className="font-medium text-gray-900">{rec.title}</h5>
                             <span className={cn(
                               "px-2 py-1 rounded-full text-xs font-medium",
                               rec.priority === 'high' ? "bg-orange-100 text-orange-700" :
                                 rec.priority === 'medium' ? "bg-orange-100 text-orange-700" : "bg-orange-100 text-orange-700"
                             )}>
                               {rec.priority === 'high' ? '高優先' : rec.priority === 'medium' ? '中優先' : '低優先'}
                             </span>
                           </div>
                           <p className="text-sm text-gray-800 mb-3">{rec.description}</p>
                           
                           {/* 詳細執行計畫 */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                             <div>
                               <div className="font-medium text-gray-700 mb-1">預算分配</div>
                               <div className="text-gray-600">NT$ 5,000,000</div>
                               <div className="text-gray-600">- 人員培訓: NT$ 1,500,000</div>
                               <div className="text-gray-600">- 系統升級: NT$ 2,000,000</div>
                               <div className="text-gray-600">- 宣傳材料: NT$ 1,500,000</div>
                             </div>
                             <div>
                               <div className="font-medium text-gray-700 mb-1">負責部門</div>
                               <div className="text-gray-600">- 行銷部門 (主要)</div>
                               <div className="text-gray-600">- 客服部門 (配合)</div>
                               <div className="text-gray-600">- IT部門 (支援)</div>
                             </div>
                           </div>

                           <div className="mt-3">
                             <div className="font-medium text-gray-700 mb-1">執行時程</div>
                             <div className="text-gray-600">第1週: 計畫制定與團隊組建</div>
                             <div className="text-gray-600">第2週: 系統評估與需求分析</div>
                             <div className="text-gray-600">第3週: 開始實施與培訓</div>
                             <div className="text-gray-600">第4週: 效果評估與調整</div>
                           </div>

                           <div className="text-xs text-gray-700 mt-3">
                             <strong>預期影響:</strong> {rec.expectedImpact}
                           </div>
                         </div>
                       ))}
                   </div>
                 </div>

                 {/* 短期行動 */}
                 <div className="bg-white rounded-lg p-6 shadow-sm border">
                   <h4 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
                     <Clock className="w-5 h-5 mr-2" />
                     短期行動 (1-6個月)
                   </h4>
                   <div className="space-y-4">
                     {selectedRecord.detailedResults.actionRecommendations
                       .filter(rec => rec.category === 'short-term')
                       .map((rec, idx) => (
                         <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                           <div className="flex items-start justify-between mb-2">
                             <h5 className="font-medium text-gray-900">{rec.title}</h5>
                             <span className={cn(
                               "px-2 py-1 rounded-full text-xs font-medium",
                               rec.priority === 'high' ? "bg-gray-100 text-gray-700" :
                                 rec.priority === 'medium' ? "bg-gray-100 text-gray-700" : "bg-gray-100 text-gray-700"
                             )}>
                               {rec.priority === 'high' ? '高優先' : rec.priority === 'medium' ? '中優先' : '低優先'}
                             </span>
                           </div>
                           <p className="text-sm text-gray-800 mb-3">{rec.description}</p>
                           
                           {/* 詳細執行計畫 */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                             <div>
                               <div className="font-medium text-gray-700 mb-1">預算分配</div>
                               <div className="text-gray-600">NT$ 15,000,000</div>
                               <div className="text-gray-600">- 市場研究: NT$ 3,000,000</div>
                               <div className="text-gray-600">- 策略制定: NT$ 5,000,000</div>
                               <div className="text-gray-600">- 實施推廣: NT$ 7,000,000</div>
                             </div>
                             <div>
                               <div className="font-medium text-gray-700 mb-1">負責部門</div>
                               <div className="text-gray-600">- 策略部門 (主導)</div>
                               <div className="text-gray-600">- 行銷部門 (執行)</div>
                               <div className="text-gray-600">- 財務部門 (配合)</div>
                             </div>
                           </div>

                           <div className="mt-3">
                             <div className="font-medium text-gray-700 mb-1">執行時程</div>
                             <div className="text-gray-600">第1-2個月: 市場分析與策略規劃</div>
                             <div className="text-gray-600">第3-4個月: 試點實施與效果評估</div>
                             <div className="text-gray-600">第5-6個月: 全面推廣與優化</div>
                           </div>

                           <div className="text-xs text-gray-700 mt-3">
                             <strong>預期影響:</strong> {rec.expectedImpact}
                           </div>
                         </div>
                       ))}
                   </div>
                 </div>

                 {/* 長期規劃 */}
                 <div className="bg-white rounded-lg p-6 shadow-sm border">
                   <h4 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
                     <Target className="w-5 h-5 mr-2" />
                     長期規劃 (6個月以上)
                   </h4>
                   <div className="space-y-4">
                     {selectedRecord.detailedResults.actionRecommendations
                       .filter(rec => rec.category === 'long-term')
                       .map((rec, idx) => (
                         <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                           <div className="flex items-start justify-between mb-2">
                             <h5 className="font-medium text-gray-900">{rec.title}</h5>
                             <span className={cn(
                               "px-2 py-1 rounded-full text-xs font-medium",
                               rec.priority === 'high' ? "bg-gray-100 text-gray-700" :
                                 rec.priority === 'medium' ? "bg-gray-100 text-gray-700" : "bg-gray-100 text-gray-700"
                             )}>
                               {rec.priority === 'high' ? '高優先' : rec.priority === 'medium' ? '中優先' : '低優先'}
                             </span>
                           </div>
                           <p className="text-sm text-gray-800 mb-3">{rec.description}</p>
                           
                           {/* 詳細執行計畫 */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                             <div>
                               <div className="font-medium text-gray-700 mb-1">預算分配</div>
                               <div className="text-gray-600">NT$ 30,000,000</div>
                               <div className="text-gray-600">- 品牌建設: NT$ 12,000,000</div>
                               <div className="text-gray-600">- 技術投資: NT$ 10,000,000</div>
                               <div className="text-gray-600">- 人才培養: NT$ 8,000,000</div>
                             </div>
                             <div>
                               <div className="font-medium text-gray-700 mb-1">負責部門</div>
                               <div className="text-gray-600">- 品牌部門 (主導)</div>
                               <div className="text-gray-600">- 研發部門 (配合)</div>
                               <div className="text-gray-600">- 人資部門 (支援)</div>
                             </div>
                           </div>

                           <div className="mt-3">
                             <div className="font-medium text-gray-700 mb-1">執行時程</div>
                             <div className="text-gray-600">第1年: 品牌定位與基礎建設</div>
                             <div className="text-gray-600">第2年: 市場擴張與影響力提升</div>
                             <div className="text-gray-600">第3年: 領導地位確立與維護</div>
                           </div>

                           <div className="text-xs text-gray-700 mt-3">
                             <strong>預期影響:</strong> {rec.expectedImpact}
                           </div>
                         </div>
                       ))}
                   </div>
                 </div>

                 {/* 異業合作建議 */}
                 <div className="bg-white rounded-lg p-6 shadow-sm border">
                   <h4 className="text-lg font-medium text-purple-700 mb-4 flex items-center">
                     <TrendingUp className="w-5 h-5 mr-2" />
                     異業合作建議
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                       <h5 className="font-medium text-purple-900 mb-2">旅遊平台合作</h5>
                       <p className="text-sm text-purple-800 mb-3">與各大旅遊平台建立戰略合作關係，提供獨家優惠和專屬服務</p>
                       <div className="text-xs text-purple-700">
                         <div><strong>合作對象:</strong> 雄獅旅遊、易遊網、可樂旅遊</div>
                         <div><strong>預期效益:</strong> 增加15%的訂單量</div>
                         <div><strong>投資預算:</strong> NT$ 8,000,000</div>
                       </div>
                     </div>
                     
                     <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                       <h5 className="font-medium text-purple-900 mb-2">信用卡聯名</h5>
                       <p className="text-sm text-purple-800 mb-3">與銀行合作推出聯名信用卡，提供專屬優惠和積分回饋</p>
                       <div className="text-xs text-purple-700">
                         <div><strong>合作對象:</strong> 國泰世華、中國信託、台新銀行</div>
                         <div><strong>預期效益:</strong> 提升客戶忠誠度20%</div>
                         <div><strong>投資預算:</strong> NT$ 5,000,000</div>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* 風險評估與應對 */}
                 <div className="bg-white rounded-lg p-6 shadow-sm border">
                   <h4 className="text-lg font-medium text-gray-700 mb-4">風險評估與應對策略</h4>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                       <h5 className="font-medium text-red-900 mb-2">高風險項目</h5>
                       <ul className="text-xs text-red-700 space-y-1">
                         <li>• 市場競爭加劇</li>
                         <li>• 經濟環境變化</li>
                         <li>• 法規政策調整</li>
                       </ul>
                       <div className="mt-2 text-xs text-red-600">
                         <strong>應對策略:</strong> 建立快速反應機制，保持策略靈活性
                       </div>
                     </div>
                     
                     <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                       <h5 className="font-medium text-yellow-900 mb-2">中風險項目</h5>
                       <ul className="text-xs text-yellow-700 space-y-1">
                         <li>• 技術更新需求</li>
                         <li>• 人才流失風險</li>
                         <li>• 客戶需求變化</li>
                       </ul>
                       <div className="mt-2 text-xs text-yellow-600">
                         <strong>應對策略:</strong> 持續投資技術和人才，建立客戶反饋機制
                       </div>
                     </div>
                     
                     <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                       <h5 className="font-medium text-green-900 mb-2">低風險項目</h5>
                       <ul className="text-xs text-green-700 space-y-1">
                         <li>• 品牌知名度</li>
                         <li>• 服務品質穩定</li>
                         <li>• 財務狀況良好</li>
                       </ul>
                       <div className="mt-2 text-xs text-green-600">
                         <strong>應對策略:</strong> 維持現有優勢，持續改進
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             )}
          </div>
        </div>
      ) : activeView === 'setup' ? (
        <div className={cn("h-full overflow-y-auto p-6 w-full bg-gray-50", className)}>
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">策略推演</h1>
                <p className="text-gray-600 mt-1">多策略對戰分析與市場情境模擬</p>
              </div>
            </div>
          </div>
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
        </div>
      ) : (
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
