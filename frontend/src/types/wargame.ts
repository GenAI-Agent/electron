// 兵推系統類型定義

// 兵推項目 - 包含多次兵推
export interface WarGameProject {
  id: string;
  name: string;
  type: 'election' | 'referendum' | 'crisis_response';
  description: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'completed' | 'archived';

  // 基本設定
  baseSettings: {
    scenario: string; // "台北市長選舉", "核能公投"
    timeframe: string; // "6個月競選期"
    participants: string[]; // ["候選人A", "候選人B"] 或 ["支持方", "反對方"]
    objectives: string[];
  };

  // 多次兵推記錄
  warGames: WarGameSession[];

  // 總體統計
  summary: {
    totalRuns: number;
    winCount: number;
    lossCount: number;
    drawCount: number;
    averageWinRate: number;
    keyInsights: string[];
    recommendedStrategy: string;
  };

  // 參與者和標籤
  participants: string[];
  tags: string[];
}

// 單次兵推會話
export interface WarGameSession {
  id: string;
  runNumber: number;
  name: string;
  description: string;
  createdAt: Date;
  status: 'planning' | 'running' | 'completed';

  // 本次兵推的變數設定
  variables: WarGameVariables;

  // 策略方案
  strategies: Strategy[];

  // 推演過程
  simulation: SimulationProcess;

  // 結果
  results: WarGameResults;

  // 與其他兵推的比較
  comparison?: {
    previousRun?: string;
    keyDifferences: string[];
    performanceChange: number;
  };
}

// 兵推變數設定
export interface WarGameVariables {
  // 外部環境變數
  environment: {
    economicCondition: 'good' | 'neutral' | 'poor';
    mediaEnvironment: 'favorable' | 'neutral' | 'hostile';
    publicMood: 'optimistic' | 'neutral' | 'pessimistic';
    majorEvents: string[]; // ["颱風災害", "經濟數據公布"]
  };

  // 候選人/陣營狀態
  playerStates: {
    [playerId: string]: {
      initialSupport: number; // 初始支持度
      budget: number;
      teamStrength: number; // 1-10
      mediaRelations: 'good' | 'neutral' | 'poor';
      scandals: string[];
      advantages: string[];
    };
  };

  // 選民結構
  voterStructure: {
    turnoutRate: number;
    demographics: {
      [group: string]: {
        percentage: number;
        volatility: number; // 搖擺程度
        keyIssues: string[];
      };
    };
  };

  // 特殊假設
  assumptions: string[];
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  color: string; // 用於UI顯示的顏色
  
  // 策略內容
  tactics: Tactic[];
  expectedOutcomes: ExpectedOutcome[];
  risks: Risk[];
  opportunities: Opportunity[];
  
  // 資源需求
  resourceRequirements: ResourceRequirement[];
  
  // 評估指標
  metrics: {
    successProbability: number; // 0-100
    confidenceLevel: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high';
    difficulty: number; // 1-10
    timeToImpact: number; // 天數
    costEffectiveness: number; // 1-10
  };
  
  // 預測結果
  predictions: {
    voteShareChange: number; // 預期得票率變化
    supporterGrowth: number; // 支持者增長
    opponentResponse: string; // 對手可能反應
    mediaImpact: 'positive' | 'neutral' | 'negative';
    publicSentiment: number; // -1 to 1
  };
}

export interface Tactic {
  id: string;
  name: string;
  description: string;
  type: 'media' | 'grassroots' | 'policy' | 'event' | 'digital';
  timeline: {
    startWeek: number;
    duration: number; // 週數
  };
  budget: number;
  expectedImpact: number; // 1-10
}

export interface ExpectedOutcome {
  description: string;
  probability: number; // 0-100
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  metrics: {
    voteShare?: number;
    awareness?: number;
    sentiment?: number;
  };
}

export interface Risk {
  id: string;
  description: string;
  probability: number; // 0-100
  impact: 'high' | 'medium' | 'low';
  category: 'political' | 'media' | 'resource' | 'timing' | 'opponent';
  mitigation: string;
  contingencyPlan?: string;
}

export interface Opportunity {
  id: string;
  description: string;
  probability: number; // 0-100
  impact: 'high' | 'medium' | 'low';
  timeWindow: string;
  requirements: string[];
}

export interface ResourceRequirement {
  type: 'budget' | 'personnel' | 'time' | 'media' | 'technology';
  amount: number;
  unit: string;
  priority: 'critical' | 'important' | 'optional';
  availability: 'available' | 'limited' | 'unavailable';
}

export interface SimulationProcess {
  // 推演階段
  phases: SimulationPhase[];

  // 時間序列數據
  timeline: TimelineData[];

  // 關鍵事件
  keyEvents: KeyEvent[];

  // 決策點
  decisionPoints: DecisionPoint[];

  // 洞察發現
  insights: Insight[];

  // 每週/每月的詳細數據
  periodicData: PeriodicData[];
}

// 時間序列數據
export interface TimelineData {
  period: number; // 週數或月數
  date: string;

  // 各候選人/陣營的數據
  playerData: {
    [playerId: string]: {
      supportRate: number;
      momentum: number; // 動能 -10 to 10
      mediaExposure: number;
      campaignActivity: number;
      budgetSpent: number;
      keyActions: string[];
    };
  };

  // 整體環境數據
  environmentData: {
    mediaAttention: number;
    publicInterest: number;
    majorEvents: string[];
    polls: PollData[];
  };
}

// 民調數據
export interface PollData {
  pollster: string;
  date: string;
  sampleSize: number;
  results: {
    [playerId: string]: number;
  };
  marginOfError: number;
  trend: 'up' | 'down' | 'stable';
}

// 週期性數據
export interface PeriodicData {
  period: number;
  type: 'week' | 'month';

  // 策略執行情況
  strategyExecution: {
    [strategyId: string]: {
      activeTactics: string[];
      effectiveness: number; // 1-10
      budgetUsed: number;
      milestones: string[];
      issues: string[];
    };
  };

  // 選民反應
  voterResponse: {
    [demographic: string]: {
      supportChange: number;
      sentimentChange: number;
      keyReactions: string[];
    };
  };

  // 媒體報導
  mediaReports: {
    positive: number;
    negative: number;
    neutral: number;
    keyStories: string[];
  };
}

export interface SimulationPhase {
  id: string;
  name: string;
  description: string;
  startWeek: number;
  duration: number;
  objectives: string[];
  keyActivities: string[];
  expectedOutcomes: string[];
  actualOutcomes?: string[];
  status: 'planned' | 'active' | 'completed';
}

export interface KeyEvent {
  id: string;
  name: string;
  description: string;
  week: number;
  type: 'milestone' | 'risk_materialized' | 'opportunity' | 'external_event';
  impact: 'positive' | 'negative' | 'neutral';
  affectedStrategies: string[];
  response: string;
}

export interface DecisionPoint {
  id: string;
  name: string;
  description: string;
  week: number;
  options: DecisionOption[];
  selectedOption?: string;
  rationale?: string;
  consequences: string[];
}

export interface DecisionOption {
  id: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  riskLevel: 'low' | 'medium' | 'high';
  resourceCost: number;
}

export interface TimelineEvent {
  week: number;
  events: {
    strategy: string;
    activity: string;
    status: 'planned' | 'active' | 'completed' | 'delayed' | 'cancelled';
    impact?: number;
  }[];
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  type: 'discovery' | 'risk_alert' | 'opportunity' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
  discoveredAt: number; // 週數
  relatedStrategies: string[];
  actionRequired: boolean;
  actionItems?: string[];
}

export interface WarGameResults {
  summary: {
    winningStrategy: string;
    winProbability: number;
    confidenceLevel: number;
    keyFactors: string[];
  };
  
  strategyComparison: StrategyComparison[];
  
  riskAssessment: {
    overallRiskLevel: 'low' | 'medium' | 'high';
    topRisks: Risk[];
    mitigationPlan: string[];
  };
  
  recommendations: Recommendation[];
  
  nextSteps: string[];
  
  lessons: string[];
}

export interface StrategyComparison {
  strategyId: string;
  finalScore: number;
  ranking: number;
  strengths: string[];
  weaknesses: string[];
  bestCaseScenario: string;
  worstCaseScenario: string;
  recommendedAdjustments: string[];
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'strategy' | 'tactics' | 'resources' | 'timing' | 'risk_management';
  implementation: {
    timeframe: string;
    resources: string[];
    steps: string[];
  };
  expectedImpact: string;
}
