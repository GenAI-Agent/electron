import React, { useState, useEffect } from 'react';
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
  Play,
  Pause,
  RotateCcw,
  Shield,
  X,
  ChevronRight,
  Activity,
  Lightbulb,
  FileText,
  Settings,
  Eye
} from 'lucide-react';

interface ActionRecommendationPageProps {
  className?: string;
  onOpenDataTab?: (source: string, file: any, data?: any[]) => void;
}

// 推演相關接口
interface SimulationRound {
  id: string;
  name: string;
  description: string;
  duration: string;
  status: 'pending' | 'running' | 'completed' | 'paused';
  startTime?: Date;
  endTime?: Date;
  participants: string[];
  objectives: string[];
  results?: SimulationResult;
}

interface SimulationResult {
  marketShare: number;
  revenue: number;
  customerSatisfaction: number;
  competitivePosition: number;
  riskLevel: number;
  keyEvents: TimelineEvent[];
  outcomes: string[];
  lessons: string[];
}

interface TimelineEvent {
  id: string;
  date: string;
  type: 'market_change' | 'competitor_action' | 'internal_decision' | 'external_factor';
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  severity: 'low' | 'medium' | 'high';
  probability: number;
  consequences: string[];
  mitigationActions?: string[];
}

interface ActionPlan {
  id: string;
  title: string;
  category: 'pricing' | 'route' | 'fleet' | 'marketing' | 'service';
  priority: 'high' | 'medium' | 'low';
  impact: number; // 1-100
  effort: number; // 1-100
  timeline: string;
  description: string;

  // 建議來源分析
  dataSource: {
    type: 'strategy' | 'complaints' | 'competition' | 'market' | 'user_behavior';
    description: string;
    confidence: number; // 1-100
    supportingData: string[];
  };

  // 詳細執行計畫
  executionPlan: {
    budget: number;
    expectedROI: number;
    timeline: {
      preparation: string;
      execution: string;
      evaluation: string;
    };
    departments: Array<{
      name: string;
      responsibility: string;
      resources: number; // percentage
    }>;
    milestones: Array<{
      phase: string;
      deadline: string;
      deliverables: string[];
      kpis: string[];
    }>;
    partnerships: Array<{
      partner: string;
      type: 'vendor' | 'airline' | 'hotel' | 'tech' | 'media';
      contribution: string;
    }>;
  };

  expectedResults: {
    revenue: number;
    marketShare: number;
    customerSatisfaction: number;
    riskMitigation: number;
  };

  requirements: string[];
  risks: Array<{
    risk: string;
    probability: number;
    impact: number;
    mitigation: string;
  }>;

  status: 'pending' | 'in-progress' | 'completed';
}

interface FleetSchedule {
  aircraftId: string;
  aircraftType: string;
  currentRoute: string;
  utilization: number;
  nextAvailable: string;
  recommendedAction: string;
  potentialRoutes: string[];
  efficiency: number;
}

interface MarketOpportunity {
  route: string;
  marketSize: number;
  competition: 'low' | 'medium' | 'high';
  profitability: number;
  seasonality: string;
  barriers: string[];
  recommendations: string[];
  priority: number;
}

// Mock data
const mockActionPlans: ActionPlan[] = [
  {
    id: 'dynamic-pricing',
    title: '動態定價策略優化',
    category: 'pricing',
    priority: 'high',
    impact: 85,
    effort: 60,
    timeline: '3個月',
    description: '基於需求預測和競爭分析，實施智能動態定價系統',

    dataSource: {
      type: 'user_behavior',
      description: '基於用戶搜尋行為分析和競爭對手定價策略研究',
      confidence: 88,
      supportingData: [
        '用戶價格敏感度分析顯示15%彈性空間',
        '競爭對手平均票價高出8%',
        '淡旺季需求波動達40%',
        '動態定價可提升15%營收'
      ]
    },

    executionPlan: {
      budget: 12000000,
      expectedROI: 3.2,
      timeline: {
        preparation: '4週 - 系統開發與測試',
        execution: '8週 - 分階段上線實施',
        evaluation: '4週 - 效果評估與優化'
      },
      departments: [
        { name: '資訊部', responsibility: '系統開發與維護', resources: 40 },
        { name: '營收管理部', responsibility: '定價策略制定', resources: 30 },
        { name: '市場分析部', responsibility: '數據分析與監控', resources: 20 },
        { name: '客服部', responsibility: '客戶溝通與反饋', resources: 10 }
      ],
      milestones: [
        {
          phase: '系統開發',
          deadline: '4週後',
          deliverables: ['定價演算法', '監控儀表板', '測試環境'],
          kpis: ['系統穩定性99%', '響應時間<2秒']
        },
        {
          phase: '試點上線',
          deadline: '8週後',
          deliverables: ['部分航線上線', '效果監控', '客戶反饋收集'],
          kpis: ['營收提升5%', '客訴增加<10%']
        },
        {
          phase: '全面推廣',
          deadline: '12週後',
          deliverables: ['全航線覆蓋', '優化調整', '培訓完成'],
          kpis: ['營收提升15%', '市占率提升5%']
        }
      ],
      partnerships: [
        { partner: 'IBM Watson', type: 'tech', contribution: 'AI定價演算法技術支援' },
        { partner: 'Amadeus', type: 'tech', contribution: '航空業數據分析平台' }
      ]
    },

    expectedResults: {
      revenue: 15,
      marketShare: 5,
      customerSatisfaction: -2,
      riskMitigation: 25
    },

    requirements: ['數據分析系統', '定價演算法', '市場監控工具', 'IT人力增加20%'],

    risks: [
      { risk: '客戶反彈導致品牌形象受損', probability: 30, impact: 70, mitigation: '分階段實施，加強溝通說明' },
      { risk: '競爭對手快速跟進', probability: 60, impact: 50, mitigation: '持續優化演算法，保持技術領先' },
      { risk: '系統故障影響營運', probability: 15, impact: 90, mitigation: '建立備援系統，24小時監控' }
    ],

    status: 'pending'
  },
  {
    id: 'new-route-launch',
    title: '開通台北-大阪新航線',
    category: 'route',
    priority: 'high',
    impact: 90,
    effort: 80,
    timeline: '6個月',
    description: '評估並開通台北-大阪直飛航線，搶占日本旅遊復甦商機',

    dataSource: {
      type: 'market',
      description: '基於日本市場復甦趨勢和競爭對手航線分析',
      confidence: 92,
      supportingData: [
        '日本入境旅遊需求回升35%',
        '大阪航線競爭對手僅2家',
        '台日航權談判進展順利',
        '預估年載客量可達28萬人次'
      ]
    },

    executionPlan: {
      budget: 85000000,
      expectedROI: 2.8,
      timeline: {
        preparation: '12週 - 航權申請與機隊準備',
        execution: '8週 - 航線開通與市場推廣',
        evaluation: '4週 - 營運效果評估'
      },
      departments: [
        { name: '航線規劃部', responsibility: '航權申請與航班規劃', resources: 35 },
        { name: '機隊管理部', responsibility: '飛機調配與維修安排', resources: 25 },
        { name: '地勤服務部', responsibility: '大阪機場地勤建置', resources: 20 },
        { name: '行銷部', responsibility: '市場推廣與銷售', resources: 20 }
      ],
      milestones: [
        {
          phase: '航權取得',
          deadline: '8週後',
          deliverables: ['航權許可', '時刻申請', '機場協議'],
          kpis: ['航權核准', '理想時刻取得率80%']
        },
        {
          phase: '營運準備',
          deadline: '16週後',
          deliverables: ['機隊調配', '地勤建置', '系統整合'],
          kpis: ['地勤服務就緒', '系統測試通過']
        },
        {
          phase: '正式開航',
          deadline: '24週後',
          deliverables: ['首航執行', '市場推廣', '服務監控'],
          kpis: ['載客率60%', '準點率85%']
        }
      ],
      partnerships: [
        { partner: '關西機場', type: 'vendor', contribution: '地勤服務與設施租賃' },
        { partner: 'JTB', type: 'vendor', contribution: '日本當地旅遊產品合作' },
        { partner: '雄獅旅遊', type: 'vendor', contribution: '台灣市場包裝行程銷售' }
      ]
    },

    expectedResults: {
      revenue: 25,
      marketShare: 8,
      customerSatisfaction: 10,
      riskMitigation: 40
    },

    requirements: ['航權申請', '機隊調配', '地勤服務建置', '行銷推廣預算', '日語服務人員'],

    risks: [
      { risk: '航權審批延遲或被拒', probability: 25, impact: 95, mitigation: '提前準備備案航線，加強政府關係' },
      { risk: '競爭對手搶先開航', probability: 40, impact: 60, mitigation: '加速執行時程，差異化服務定位' },
      { risk: '市場需求不如預期', probability: 35, impact: 70, mitigation: '彈性調整班次，強化行銷推廣' }
    ],

    status: 'in-progress'
  },
  {
    id: 'fleet-optimization',
    title: '機隊使用效率優化',
    category: 'fleet',
    priority: 'medium',
    impact: 70,
    effort: 50,
    timeline: '2個月',
    description: '重新配置機隊，提高飛機使用率和航線效益',

    dataSource: {
      type: 'strategy',
      description: '基於機隊使用率分析和航線盈利能力評估',
      confidence: 85,
      supportingData: [
        '目前機隊平均使用率僅78%',
        '部分航線盈利能力偏低',
        '維修排程可優化15%效率',
        '機組人員配置有20%改善空間'
      ]
    },

    executionPlan: {
      budget: 8000000,
      expectedROI: 4.5,
      timeline: {
        preparation: '3週 - 數據分析與方案設計',
        execution: '5週 - 逐步調整實施',
        evaluation: '2週 - 效果監控與微調'
      },
      departments: [
        { name: '機隊管理部', responsibility: '機隊調配與維修排程', resources: 45 },
        { name: '航班調度部', responsibility: '航班時刻優化', resources: 30 },
        { name: '人力資源部', responsibility: '機組人員排班優化', resources: 15 },
        { name: '財務部', responsibility: '成本效益分析', resources: 10 }
      ],
      milestones: [
        {
          phase: '現況分析',
          deadline: '2週後',
          deliverables: ['機隊使用率報告', '航線盈利分析', '優化方案'],
          kpis: ['分析完整度100%', '方案可行性評估']
        },
        {
          phase: '試點實施',
          deadline: '5週後',
          deliverables: ['部分航線調整', '維修排程優化', '效果監控'],
          kpis: ['使用率提升5%', '準點率維持85%']
        },
        {
          phase: '全面優化',
          deadline: '8週後',
          deliverables: ['全機隊優化', '標準作業程序', '培訓完成'],
          kpis: ['使用率達85%', '營運成本降低8%']
        }
      ],
      partnerships: [
        { partner: 'Boeing', type: 'vendor', contribution: '維修技術支援與零件供應' },
        { partner: 'Lufthansa Technik', type: 'vendor', contribution: '維修排程優化顧問' }
      ]
    },

    expectedResults: {
      revenue: 12,
      marketShare: 3,
      customerSatisfaction: 5,
      riskMitigation: 60
    },

    requirements: ['航班調度系統升級', '維修排程軟體', '機組人員培訓', '數據分析工具'],

    risks: [
      { risk: '調整期間航班延誤增加', probability: 45, impact: 50, mitigation: '分階段實施，保留緩衝時間' },
      { risk: '維修排程衝突', probability: 30, impact: 70, mitigation: '提前協調，建立備援計畫' },
      { risk: '機組人員適應困難', probability: 25, impact: 40, mitigation: '加強培訓，提供激勵措施' }
    ],

    status: 'pending'
  }
];

const mockFleetSchedule: FleetSchedule[] = [
  {
    aircraftId: 'B777-001',
    aircraftType: 'Boeing 777-300ER',
    currentRoute: 'TPE-NRT',
    utilization: 85,
    nextAvailable: '2025-09-02 14:30',
    recommendedAction: '調配至TPE-ICN航線',
    potentialRoutes: ['TPE-ICN', 'TPE-BKK', 'TPE-SIN'],
    efficiency: 92
  },
  {
    aircraftId: 'A350-002',
    aircraftType: 'Airbus A350-900',
    currentRoute: 'TPE-LAX',
    utilization: 78,
    nextAvailable: '2025-09-03 08:15',
    recommendedAction: '增加TPE-SFO班次',
    potentialRoutes: ['TPE-SFO', 'TPE-SEA', 'TPE-YVR'],
    efficiency: 88
  },
  {
    aircraftId: 'B787-003',
    aircraftType: 'Boeing 787-9',
    currentRoute: '維修中',
    utilization: 0,
    nextAvailable: '2025-09-05 10:00',
    recommendedAction: '投入TPE-KIX新航線',
    potentialRoutes: ['TPE-KIX', 'TPE-FUK', 'TPE-CTS'],
    efficiency: 95
  }
];

const mockMarketOpportunities: MarketOpportunity[] = [
  {
    route: 'TPE-KIX (大阪)',
    marketSize: 850000,
    competition: 'medium',
    profitability: 78,
    seasonality: '春秋旺季',
    barriers: ['航權限制', '時段競爭'],
    recommendations: ['申請增班', '差異化服務', '聯程票推廣'],
    priority: 95
  },
  {
    route: 'TPE-BNE (布里斯本)',
    marketSize: 320000,
    competition: 'low',
    profitability: 85,
    seasonality: '全年穩定',
    barriers: ['航程較長', '市場認知度低'],
    recommendations: ['包機測試', '旅行社合作', '商務客群開發'],
    priority: 72
  },
  {
    route: 'TPE-DEL (德里)',
    marketSize: 450000,
    competition: 'high',
    profitability: 65,
    seasonality: '冬季旺季',
    barriers: ['簽證限制', '價格敏感'],
    recommendations: ['成本控制', '轉機服務', '貨運結合'],
    priority: 58
  }
];

// 推演mock數據
const mockSimulationRounds: SimulationRound[] = [
  {
    id: 'round-1',
    name: '第一輪：基準情境推演',
    description: '在當前市場條件下，評估各項行動方案的基礎效果',
    duration: '2小時',
    status: 'completed',
    startTime: new Date('2025-08-15T09:00:00'),
    endTime: new Date('2025-08-15T11:00:00'),
    participants: ['行銷總監', '營運總監', '財務總監', '策略分析師'],
    objectives: [
      '建立基準預測模型',
      '識別關鍵影響因子',
      '評估各方案可行性'
    ],
    results: {
      marketShare: 23.5,
      revenue: 1250000000,
      customerSatisfaction: 78,
      competitivePosition: 65,
      riskLevel: 35,
      keyEvents: [
        {
          id: 'event-1',
          date: '2025-09-15',
          type: 'market_change',
          title: '日本旅遊需求回升',
          description: '日本政府放寬入境限制，旅遊需求預期增長40%',
          impact: 'positive',
          severity: 'high',
          probability: 85,
          consequences: ['台日航線需求增加', '票價上漲空間擴大', '競爭加劇'],
          mitigationActions: ['提前增班', '優化定價策略', '加強市場推廣']
        },
        {
          id: 'event-2',
          date: '2025-10-01',
          type: 'competitor_action',
          title: '長榮航空推出促銷活動',
          description: '長榮推出「日本秋遊專案」，票價下調15%',
          impact: 'negative',
          severity: 'medium',
          probability: 70,
          consequences: ['市場價格競爭激化', '客源分流', '毛利率下降'],
          mitigationActions: ['差異化服務', '會員專屬優惠', '聯盟合作']
        }
      ],
      outcomes: [
        '動態定價系統可提升營收12-18%',
        '新航線開通風險可控，預期ROI達2.8',
        '服務升級投資回報期約18個月'
      ],
      lessons: [
        '市場變化速度超出預期，需要更靈活的應對機制',
        '競爭對手反應迅速，差異化策略至關重要',
        '客戶滿意度與營收增長存在平衡點'
      ]
    }
  },
  {
    id: 'round-2',
    name: '第二輪：壓力測試情境',
    description: '模擬極端市場條件下的應對策略',
    duration: '3小時',
    status: 'completed',
    startTime: new Date('2025-08-20T13:00:00'),
    endTime: new Date('2025-08-20T16:00:00'),
    participants: ['CEO', '行銷總監', '營運總監', '風險管理總監', '外部顧問'],
    objectives: [
      '測試極端情境下的韌性',
      '制定危機應對預案',
      '優化風險管控機制'
    ],
    results: {
      marketShare: 19.2,
      revenue: 980000000,
      customerSatisfaction: 65,
      competitivePosition: 45,
      riskLevel: 75,
      keyEvents: [
        {
          id: 'event-3',
          date: '2025-11-15',
          type: 'external_factor',
          title: '油價大幅上漲',
          description: '國際油價因地緣政治因素上漲35%',
          impact: 'negative',
          severity: 'high',
          probability: 40,
          consequences: ['營運成本激增', '票價被迫上調', '需求下降'],
          mitigationActions: ['燃油避險', '航線優化', '成本控制']
        },
        {
          id: 'event-4',
          date: '2025-12-01',
          type: 'competitor_action',
          title: '廉航大舉進入市場',
          description: '3家新廉航同時進入台日航線市場',
          impact: 'negative',
          severity: 'high',
          probability: 60,
          consequences: ['價格戰爆發', '市占率流失', '獲利能力下降'],
          mitigationActions: ['服務差異化', '會員忠誠計畫', '成本優化']
        }
      ],
      outcomes: [
        '極端情境下仍能維持基本營運',
        '風險管控機制需要強化',
        '多元化策略有助於分散風險'
      ],
      lessons: [
        '單一策略風險過高，需要組合拳',
        '成本控制能力是生存關鍵',
        '危機溝通預案必須提前準備'
      ]
    }
  },
  {
    id: 'round-3',
    name: '第三輪：機會最大化情境',
    description: '探索最佳情境下的成長策略',
    duration: '2.5小時',
    status: 'running',
    startTime: new Date('2025-08-25T10:00:00'),
    participants: ['策略長', '行銷總監', '產品總監', '數據分析師'],
    objectives: [
      '挖掘最大成長潛力',
      '制定積極擴張策略',
      '評估投資優先順序'
    ]
  }
];

export const ActionRecommendationPage: React.FC<ActionRecommendationPageProps> = ({
  className,
  onOpenDataTab
}) => {
  const [activeTab, setActiveTab] = useState<'plans' | 'simulation' | 'strategy' | 'action' | 'timeline'>('plans');
  const [selectedPlan, setSelectedPlan] = useState<ActionPlan | null>(null);

  // 推演相關狀態
  const [selectedRound, setSelectedRound] = useState<SimulationRound | null>(mockSimulationRounds[0]);
  const [simulationStatus, setSimulationStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const [currentEvent, setCurrentEvent] = useState<TimelineEvent | null>(null);

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pricing':
        return <DollarSign className="w-4 h-4" />;
      case 'route':
        return <MapPin className="w-4 h-4" />;
      case 'fleet':
        return <Plane className="w-4 h-4" />;
      case 'marketing':
        return <Target className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getCompetitionColor = (competition: 'low' | 'medium' | 'high') => {
    switch (competition) {
      case 'low':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-red-600 bg-red-50';
    }
  };

  const exportData = (dataType: string) => {
    if (onOpenDataTab) {
      const mockFile = {
        filename: `action_${dataType}_${new Date().toISOString().split('T')[0]}.csv`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        fullPath: `marketing-sandbox/action_${dataType}.csv`
      };
      
      let data: any[] = [];
      switch (dataType) {
        case 'plans':
          data = mockActionPlans;
          break;
        case 'fleet':
          data = mockFleetSchedule;
          break;
        case 'opportunities':
          data = mockMarketOpportunities;
          break;
      }
      
      onOpenDataTab('action', mockFile, data);
    }
  };

  return (
    <div className={cn("h-full overflow-y-auto p-6 bg-gray-50", className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">行動建議</h1>
            <p className="text-gray-600 mt-1">策略方案、機隊調度與市場機會分析</p>
          </div>
        </div>
      </div>

              {/* Tab Navigation */}
        <div className="flex border-t border-gray-200">
          {[
            { key: 'plans', label: '行動計畫', icon: Target },
            { key: 'simulation', label: '推演記錄', icon: BarChart3 },
            { key: 'strategy', label: '每輪策略', icon: Eye },
            { key: 'action', label: '行動建議', icon: Zap },
            { key: 'timeline', label: '時間序列', icon: Calendar }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                "flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.key
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>}

      {/* 行動建議內容 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Action Plans List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">推薦行動方案</h3>
              <button
                onClick={() => exportData('plans')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                匯出數據
              </button>
            </div>
            
            {mockActionPlans.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "bg-white rounded-lg p-6 shadow-sm border cursor-pointer transition-colors",
                  selectedPlan?.id === plan.id ? "border-blue-500 bg-blue-50" : "hover:border-gray-300"
                )}
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(plan.category)}
                    <div>
                      <h4 className="font-semibold text-gray-900">{plan.title}</h4>
                      <p className="text-sm text-gray-600">{plan.description}</p>
                    </div>
                  </div>
                  {getStatusIcon(plan.status)}
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium border",
                      getPriorityColor(plan.priority)
                    )}>
                      {plan.priority === 'high' ? '高優先' :
                       plan.priority === 'medium' ? '中優先' : '低優先'}
                    </span>
                    <span className="text-sm text-gray-600">
                      影響度: {plan.impact}% | 執行難度: {plan.effort}%
                    </span>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      plan.dataSource.confidence > 80 ? "bg-green-50 text-green-600" :
                      plan.dataSource.confidence > 60 ? "bg-yellow-50 text-yellow-600" : "bg-red-50 text-red-600"
                    )}>
                      信心度: {plan.dataSource.confidence}%
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{plan.timeline}</span>
                </div>

                <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-900">建議來源</span>
                  </div>
                  <p className="text-sm text-blue-800">{plan.dataSource.description}</p>
                </div>

                <div className="flex items-center space-x-6 text-sm mb-3">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">+{plan.expectedResults.revenue}%</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    <span className="text-blue-600">+{plan.expectedResults.marketShare}%</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span className={cn(
                      plan.expectedResults.customerSatisfaction >= 0 ? "text-purple-600" : "text-red-600"
                    )}>
                      {plan.expectedResults.customerSatisfaction >= 0 ? '+' : ''}{plan.expectedResults.customerSatisfaction}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <span className="text-orange-600">ROI: {plan.executionPlan.expectedROI}x</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Plan Analysis */}
          {selectedPlan && (
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">{selectedPlan.title} - 詳細執行計畫</h3>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 支撐數據 */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-3">支撐數據與分析依據</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedPlan.dataSource.supportingData.map((data, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <BarChart3 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-blue-800">{data}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 預算與ROI */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <DollarSign className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-green-600">總預算</p>
                  <p className="text-lg font-bold text-green-900">
                    ${(selectedPlan.executionPlan.budget / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <TrendingUp className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-blue-600">預期ROI</p>
                  <p className="text-lg font-bold text-blue-900">
                    {selectedPlan.executionPlan.expectedROI}x
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <Calendar className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                  <p className="text-sm text-purple-600">執行週期</p>
                  <p className="text-lg font-bold text-purple-900">{selectedPlan.timeline}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg text-center">
                  <Shield className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                  <p className="text-sm text-orange-600">風險緩解</p>
                  <p className="text-lg font-bold text-orange-900">
                    {selectedPlan.expectedResults.riskMitigation}%
                  </p>
                </div>
              </div>

              {/* 時程規劃 */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-4">執行時程</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h5 className="font-medium text-yellow-900 mb-2">準備階段</h5>
                    <p className="text-sm text-yellow-800">{selectedPlan.executionPlan.timeline.preparation}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h5 className="font-medium text-green-900 mb-2">執行階段</h5>
                    <p className="text-sm text-green-800">{selectedPlan.executionPlan.timeline.execution}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">評估階段</h5>
                    <p className="text-sm text-blue-800">{selectedPlan.executionPlan.timeline.evaluation}</p>
                  </div>
                </div>
              </div>

              {/* 部門協調 */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-4">部門協調與資源分配</h4>
                <div className="space-y-3">
                  {selectedPlan.executionPlan.departments.map((dept, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Users className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">{dept.name}</p>
                          <p className="text-sm text-gray-600">{dept.responsibility}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{dept.resources}%</p>
                        <p className="text-xs text-gray-500">資源配置</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 里程碑 */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-4">關鍵里程碑</h4>
                <div className="space-y-4">
                  {selectedPlan.executionPlan.milestones.map((milestone, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">{milestone.phase}</h5>
                        <span className="text-sm text-gray-500">{milestone.deadline}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">交付成果:</p>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {milestone.deliverables.map((deliverable, idx) => (
                              <li key={idx} className="flex items-center">
                                <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                                {deliverable}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">關鍵指標:</p>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {milestone.kpis.map((kpi, idx) => (
                              <li key={idx} className="flex items-center">
                                <Target className="w-3 h-3 text-blue-500 mr-2" />
                                {kpi}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 異業合作 */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-4">異業合作夥伴</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedPlan.executionPlan.partnerships.map((partnership, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{partnership.partner}</h5>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          partnership.type === 'tech' ? "bg-blue-50 text-blue-600" :
                          partnership.type === 'vendor' ? "bg-green-50 text-green-600" :
                          partnership.type === 'airline' ? "bg-purple-50 text-purple-600" :
                          partnership.type === 'hotel' ? "bg-yellow-50 text-yellow-600" : "bg-gray-50 text-gray-600"
                        )}>
                          {partnership.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{partnership.contribution}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 風險評估與緩解 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">風險評估與緩解策略</h4>
                  <div className="space-y-3">
                    {selectedPlan.risks.map((risk, index) => (
                      <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-medium text-red-900">{risk.risk}</h5>
                          <div className="text-right">
                            <p className="text-xs text-red-600">機率: {risk.probability}%</p>
                            <p className="text-xs text-red-600">影響: {risk.impact}%</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{risk.mitigation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">執行要求</h4>
                  <ul className="space-y-2">
                    {selectedPlan.requirements.map((req, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t">
                <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  開始執行方案
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 移除fleet標籤內容，因為已經簡化為只有行動建議 */}
      {false && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">機隊調度建議</h3>
            <button
              onClick={() => exportData('fleet')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              匯出數據
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {mockFleetSchedule.map((aircraft) => (
              <div key={aircraft.aircraftId} className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Plane className="w-5 h-5 text-blue-500" />
                    <h4 className="font-semibold text-gray-900">{aircraft.aircraftId}</h4>
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    aircraft.utilization > 80 ? "bg-green-50 text-green-600" :
                    aircraft.utilization > 60 ? "bg-yellow-50 text-yellow-600" : "bg-red-50 text-red-600"
                  )}>
                    使用率 {aircraft.utilization}%
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">機型</p>
                    <p className="font-medium text-gray-900">{aircraft.aircraftType}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">當前航線</p>
                    <p className="font-medium text-gray-900">{aircraft.currentRoute}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">下次可用時間</p>
                    <p className="font-medium text-gray-900">{aircraft.nextAvailable}</p>
                  </div>
                  
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-600 mb-2">建議行動</p>
                    <p className="font-medium text-blue-600">{aircraft.recommendedAction}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">可選航線</p>
                    <div className="flex flex-wrap gap-1">
                      {aircraft.potentialRoutes.map((route, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {route}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'opportunities' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">潛在市場機會</h3>
            <button
              onClick={() => exportData('opportunities')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              匯出數據
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockMarketOpportunities.map((opportunity, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-green-500" />
                    <h4 className="font-semibold text-gray-900">{opportunity.route}</h4>
                  </div>
                  <span className="text-sm font-medium text-blue-600">
                    優先度: {opportunity.priority}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">市場規模</p>
                    <p className="font-medium text-gray-900">{opportunity.marketSize.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">獲利性</p>
                    <p className="font-medium text-green-600">{opportunity.profitability}%</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">競爭程度</p>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      getCompetitionColor(opportunity.competition)
                    )}>
                      {opportunity.competition === 'low' ? '低競爭' :
                       opportunity.competition === 'medium' ? '中競爭' : '高競爭'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">季節性</p>
                    <p className="text-sm font-medium text-gray-900">{opportunity.seasonality}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">進入障礙</p>
                    <div className="space-y-1">
                      {opportunity.barriers.map((barrier, idx) => (
                        <p key={idx} className="text-xs text-red-600 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {barrier}
                        </p>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">建議策略</p>
                    <div className="space-y-1">
                      {opportunity.recommendations.map((rec, idx) => (
                        <p key={idx} className="text-xs text-green-600 flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {rec}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionRecommendationPage;
