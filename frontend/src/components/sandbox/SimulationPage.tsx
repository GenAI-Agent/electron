import React, { useState, useEffect } from 'react';
import { Swords, Upload, FileText, Play, Users, TrendingUp, Target, Clock, Zap, Plus, Settings, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import IconSidebar from '@/components/ui/IconSidebar';
import { cn } from '@/utils/cn';

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
}

interface BattleSetup {
  side1: {
    name: string;
    description: string;
    file?: File;
    avatar?: string;
    power: number;
    winRate: number;
  };
  side2: {
    name: string;
    description: string;
    file?: File;
    avatar?: string;
    power: number;
    winRate: number;
  };
}

interface SimulationPageProps {
  className?: string;
}

const mockSimulationRecords: SimulationRecord[] = [
  {
    id: '1',
    title: '北部 vs 南部選情對比',
    date: '2025-12-01 13:45',
    participants: {
      side1: '北部選區',
      side2: '南部選區'
    },
    result: {
      winner: 'side2',
      confidence: 0.68
    },
    duration: '3分42秒',
    status: 'completed'
  },
  {
    id: '2',
    title: '青年政策 vs 長者福利',
    date: '2025-12-01 11:20',
    participants: {
      side1: '青年政策',
      side2: '長者福利'
    },
    result: {
      winner: 'side1',
      confidence: 0.72
    },
    duration: '5分18秒',
    status: 'completed'
  },
  {
    id: '3',
    title: '經濟政策對比分析',
    date: '2025-12-01 09:15',
    participants: {
      side1: '方案A',
      side2: '方案B'
    },
    result: {
      winner: 'draw',
      confidence: 0.51
    },
    duration: '4分33秒',
    status: 'completed'
  }
];

export const SimulationPage: React.FC<SimulationPageProps> = ({ className = "" }) => {
  const [selectedRecord, setSelectedRecord] = useState<SimulationRecord | null>(null);
  const [records] = useState<SimulationRecord[]>(mockSimulationRecords);
  const [battleSetup, setBattleSetup] = useState<BattleSetup>({
    side1: {
      name: '',
      description: '',
      power: 50,
      winRate: 50
    },
    side2: {
      name: '',
      description: '',
      power: 50,
      winRate: 50
    }
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [simulationSettings, setSimulationSettings] = useState({
    analysisDepth: 'standard',
    timeRange: '1month',
    reportType: 'summary',
    confidenceThreshold: 75
  });

  const handleFileUpload = (side: 'side1' | 'side2', file: File) => {
    setBattleSetup(prev => ({
      ...prev,
      [side]: {
        ...prev[side],
        file
      }
    }));
  };

  const handleStartSimulation = async () => {
    if (!battleSetup.side1.name || !battleSetup.side2.name) {
      alert('請填寫雙方名稱');
      return;
    }

    setIsSimulating(true);
    setSimulationResult(null);

    // Simulate API call
    setTimeout(() => {
      const mockResult = {
        winner: Math.random() > 0.5 ? 'side1' : 'side2',
        confidence: 0.6 + Math.random() * 0.3,
        reasoning: [
          '根據歷史數據分析，方案A在年輕族群中支持度較高',
          '方案B在經濟效益評估上表現更佳',
          '綜合考量民意調查和專家評估',
          '預測結果基於多維度數據交叉分析'
        ],
        metrics: {
          side1: {
            strength: Math.floor(Math.random() * 40) + 60,
            support: Math.floor(Math.random() * 30) + 50,
            feasibility: Math.floor(Math.random() * 35) + 55
          },
          side2: {
            strength: Math.floor(Math.random() * 40) + 60,
            support: Math.floor(Math.random() * 30) + 50,
            feasibility: Math.floor(Math.random() * 35) + 55
          }
        }
      };
      setSimulationResult(mockResult);
      setIsSimulating(false);
    }, 3000);
  };

  // 統一色彩系統
  const colors = {
    primary: 'text-blue-600 bg-blue-50',
    neutral: 'text-gray-600 bg-gray-50',
    highlight: 'text-blue-700 bg-blue-100'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.primary;
      case 'running':
        return colors.highlight;
      case 'failed':
        return colors.neutral;
      default:
        return colors.neutral;
    }
  };

  const getWinnerText = (winner: string) => {
    switch (winner) {
      case 'side1':
        return '左方勝出';
      case 'side2':
        return '右方勝出';
      case 'draw':
        return '平手';
      default:
        return '未知';
    }
  };

  // 準備側邊欄項目數據
  const sidebarItems = [
    // 推演設定項目
    {
      id: 'settings',
      icon: Settings,
      label: '推演設定',
      isActive: false,
      onClick: () => setShowSettings(true),
      color: 'blue' as const,
      description: '配置分析參數和輸出格式',
      metadata: '點擊開啟設定面板'
    },
    // 推演記錄項目
    ...records.map((record) => ({
      id: record.id,
      icon: record.id === selectedRecord?.id ? Target : FileText,
      label: record.title,
      isActive: record.id === selectedRecord?.id,
      onClick: () => setSelectedRecord(record),
      color: (record.id === selectedRecord?.id ? 'orange' : 'gray') as 'orange' | 'blue' | 'green' | 'purple' | 'gray' | 'red',
      description: `${record.participants.side1} vs ${record.participants.side2}`,
      metadata: `${record.date} • ${record.status} • ${(record.result.confidence * 100).toFixed(0)}% 信心度`
    }))
  ];

  const handleAddNew = () => {
    // 創建新推演的邏輯
    console.log('創建新推演');
  };

  return (
    <div className={cn("h-full flex overflow-hidden", className)}>
      {/* Left Icon Sidebar */}
      <IconSidebar
        items={sidebarItems}
        onAddNew={handleAddNew}
      />

      {/* Main Content - Map and Battle Setup */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedRecord ? (
          <div className="flex-1 flex flex-col">
            {/* Selected Record View */}
            <div className="p-6 border-b border-border">
              <h1 className="text-xl font-bold text-foreground mb-2">{selectedRecord.title}</h1>
              <p className="text-sm text-muted-foreground">
                {selectedRecord.participants.side1} vs {selectedRecord.participants.side2}
              </p>
            </div>
            <div className="flex-1 p-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold mb-4">推演結果</h2>
                <p className="text-muted-foreground">
                  勝出方: {getWinnerText(selectedRecord.result.winner)}
                </p>
                <p className="text-muted-foreground">
                  信心度: {(selectedRecord.result.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Battle Setup Interface when no record selected */}
            <div className="p-6 border-b border-border">
              <h1 className="text-xl font-bold text-foreground mb-2">選情推演對戰</h1>
              <p className="text-sm text-muted-foreground">
                設定雙方條件，讓AI進行深度分析和預測對比
              </p>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-140px)] pb-8">
              {/* Battle Setup - New Design */}
              <div className="flex flex-col">
                {/* Side 1 Setup - Top */}
                <div className="relative bg-gradient-to-br from-blue-100 via-blue-50 to-white p-8">
                  <div className="relative z-10 max-w-2xl mx-auto">
                    <h3 className="text-xl font-bold text-blue-700 mb-6 text-center">上方陣營</h3>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-blue-200">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4 border-r border-blue-200 pr-6">
                          <h4 className="text-lg font-semibold text-blue-700 mb-4">資料填寫</h4>
                          <Input
                            placeholder="陣營名稱"
                            value={battleSetup.side1.name}
                            onChange={(e) => setBattleSetup(prev => ({
                              ...prev,
                              side1: { ...prev.side1, name: e.target.value }
                            }))}
                            className="border-blue-200 focus:border-blue-400"
                          />
                          <Textarea
                            placeholder="描述條件、政策或特點..."
                            value={battleSetup.side1.description}
                            onChange={(e) => setBattleSetup(prev => ({
                              ...prev,
                              side1: { ...prev.side1, description: e.target.value }
                            }))}
                            rows={4}
                            className="border-blue-200 focus:border-blue-400"
                          />
                        </div>
                        <div className="space-y-4 pl-6">
                          <h4 className="text-lg font-semibold text-blue-700 mb-4">檔案上傳</h4>
                          <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors bg-blue-50/50 h-32 flex flex-col justify-center">
                            <Upload className="w-8 h-8 text-blue-500 mb-2 mx-auto" />
                            <span className="text-sm text-blue-700 font-medium">點擊上傳檔案</span>
                            <span className="text-xs text-blue-500 mt-1">CSV, Excel, JSON, TXT</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* VS Section - Middle Bar */}
                <div
                  className="h-20 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 flex items-center justify-center cursor-pointer hover:from-orange-600 hover:via-orange-500 hover:to-orange-600 transition-all duration-300 shadow-lg"
                  onClick={handleStartSimulation}
                >
                  <div className="flex items-center space-x-4">
                    {isSimulating ? (
                      <>
                        <Zap className="w-8 h-8 text-white animate-pulse" />
                        <span className="text-white font-bold text-lg">推演中...</span>
                      </>
                    ) : (
                      <>
                        <Swords className="w-8 h-8 text-white rotate-90" />
                        <span className="text-white font-bold text-lg">VS</span>
                        <Swords className="w-8 h-8 text-white rotate-90" />
                      </>
                    )}
                  </div>
                </div>

                {/* Side 2 Setup - Bottom */}
                <div className="relative bg-gradient-to-br from-red-100 via-red-50 to-white p-8 min-h-[500px]">
                  <div className="relative z-10 max-w-2xl mx-auto">
                    <h3 className="text-xl font-bold text-red-700 mb-6 text-center">下方陣營</h3>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-red-200">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4 border-r border-red-200 pr-6">
                          <h4 className="text-lg font-semibold text-red-700 mb-4">資料填寫</h4>
                          <Input
                            placeholder="陣營名稱"
                            value={battleSetup.side2.name}
                            onChange={(e) => setBattleSetup(prev => ({
                              ...prev,
                              side2: { ...prev.side2, name: e.target.value }
                            }))}
                            className="border-red-200 focus:border-red-400"
                          />
                          <Textarea
                            placeholder="描述條件、政策或特點..."
                            value={battleSetup.side2.description}
                            onChange={(e) => setBattleSetup(prev => ({
                              ...prev,
                              side2: { ...prev.side2, description: e.target.value }
                            }))}
                            rows={4}
                            className="border-red-200 focus:border-red-400"
                          />
                        </div>
                        <div className="space-y-4 pl-6">
                          <h4 className="text-lg font-semibold text-red-700 mb-4">檔案上傳</h4>
                          <div className="border-2 border-dashed border-red-300 rounded-lg p-8 text-center hover:border-red-400 transition-colors bg-red-50/50 h-32 flex flex-col justify-center">
                            <Upload className="w-8 h-8 text-red-500 mb-2 mx-auto" />
                            <span className="text-sm text-red-700 font-medium">點擊上傳檔案</span>
                            <span className="text-xs text-red-500 mt-1">CSV, Excel, JSON, TXT</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


              </div>

              {/* Simulation Result */}
              {simulationResult && (
                <div className="p-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Target className="w-5 h-5 mr-2" />
                        推演結果
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg mb-6">
                        <h3 className="text-2xl font-bold mb-2">
                          {simulationResult.winner === 'side1' ? battleSetup.side1.name : battleSetup.side2.name} 勝出
                        </h3>
                        <p className="text-lg text-muted-foreground">
                          勝率: {(simulationResult.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 推演設定彈出視窗 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-[600px] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">推演設定</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">分析參數</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">分析深度</label>
                      <select
                        value={simulationSettings.analysisDepth}
                        onChange={(e) => setSimulationSettings(prev => ({ ...prev, analysisDepth: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="standard">標準分析</option>
                        <option value="deep">深度分析</option>
                        <option value="expert">專家級分析</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">時間範圍</label>
                      <select
                        value={simulationSettings.timeRange}
                        onChange={(e) => setSimulationSettings(prev => ({ ...prev, timeRange: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="1month">近1個月</option>
                        <option value="3months">近3個月</option>
                        <option value="6months">近6個月</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">輸出格式</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">報告類型</label>
                      <select
                        value={simulationSettings.reportType}
                        onChange={(e) => setSimulationSettings(prev => ({ ...prev, reportType: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="summary">簡要報告</option>
                        <option value="detailed">詳細報告</option>
                        <option value="chart">圖表報告</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        信心度閾值: {simulationSettings.confidenceThreshold}%
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="95"
                        value={simulationSettings.confidenceThreshold}
                        onChange={(e) => setSimulationSettings(prev => ({ ...prev, confidenceThreshold: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>50%</span>
                        <span>95%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(false)}
                  className="px-6"
                >
                  取消
                </Button>
                <Button
                  onClick={() => {
                    setShowSettings(false);
                    // 這裡可以保存設定或觸發其他動作
                  }}
                  className="px-6 bg-blue-600 hover:bg-blue-700"
                >
                  確認設定
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationPage;
