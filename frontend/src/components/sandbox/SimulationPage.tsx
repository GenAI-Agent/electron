import React, { useState, useEffect } from 'react';
import { Swords, Upload, FileText, Play, Users, TrendingUp, Target, Clock, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
    date: '2024-12-01 13:45',
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
    date: '2024-12-01 11:20',
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
    date: '2024-12-01 09:15',
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

export const SimulationPage: React.FC<SimulationPageProps> = ({ className }) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'running':
        return 'text-blue-600 bg-blue-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
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

  return (
    <div className={cn("h-full flex", className)}>
      {/* Left Sidebar - Simulation Records */}
      <div className="w-80 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">推演記錄</h2>
          <p className="text-sm text-muted-foreground mt-1">歷史對戰分析結果</p>
        </div>
        
        <div className="flex-1 overflow-auto p-2">
          <div className="space-y-2">
            {records.map((record) => (
              <Card
                key={record.id}
                onClick={() => setSelectedRecord(record)}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  selectedRecord?.id === record.id ? "ring-2 ring-blue-500" : ""
                )}
              >
                <CardContent className="p-3">
                  <h4 className="text-sm font-medium line-clamp-2 mb-2">
                    {record.title}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {record.date}
                    </div>
                    <span className={cn("px-2 py-1 rounded-full", getStatusColor(record.status))}>
                      {record.status}
                    </span>
                  </div>
                  <div className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span>{record.participants.side1}</span>
                      <span className="text-muted-foreground">vs</span>
                      <span>{record.participants.side2}</span>
                    </div>
                    <div className="text-center text-muted-foreground">
                      {getWinnerText(record.result.winner)} ({(record.result.confidence * 100).toFixed(0)}%)
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Battle Setup */}
      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold text-foreground mb-2">選情推演對戰</h1>
          <p className="text-sm text-muted-foreground">
            設定雙方條件，讓AI進行深度分析和預測對比
          </p>
        </div>

        <div className="flex-1 overflow-auto relative">
          {/* Battle Setup - New Design */}
          <div className="h-full flex flex-col">
            {/* Side 1 Setup - Top */}
            <div className="flex-1 relative bg-gradient-to-br from-blue-100 via-blue-50 to-white p-8">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4 w-32 h-32 bg-blue-300 rounded-full blur-3xl"></div>
                <div className="absolute bottom-4 right-4 w-24 h-24 bg-blue-400 rounded-full blur-2xl"></div>
              </div>

              <div className="relative z-10 max-w-2xl mx-auto">
                <h3 className="text-xl font-bold text-blue-700 mb-6 text-center">上方陣營</h3>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-blue-200">
                  {/* Book-style layout */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left page - Data input */}
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

                    {/* Right page - File upload */}
                    <div className="space-y-4 pl-6">
                      <h4 className="text-lg font-semibold text-blue-700 mb-4">檔案上傳</h4>
                      <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors bg-blue-50/50 h-32 flex flex-col justify-center">
                        <input
                          type="file"
                          id="side1-upload"
                          className="hidden"
                          accept=".csv,.xlsx,.xls,.json,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload('side1', file);
                          }}
                        />
                        <label htmlFor="side1-upload" className="cursor-pointer flex flex-col items-center">
                          <Upload className="w-8 h-8 text-blue-500 mb-2" />
                          <span className="text-sm text-blue-700 font-medium">點擊上傳檔案</span>
                          <span className="text-xs text-blue-500 mt-1">CSV, Excel, JSON, TXT</span>
                        </label>
                      </div>
                      {battleSetup.side1.file && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm text-green-700 font-medium">
                            ✓ 已上傳: {battleSetup.side1.file.name}
                          </p>
                        </div>
                      )}
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
            <div className="flex-1 relative bg-gradient-to-br from-red-100 via-red-50 to-white p-8">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-32 h-32 bg-red-300 rounded-full blur-3xl"></div>
                <div className="absolute bottom-4 left-4 w-24 h-24 bg-red-400 rounded-full blur-2xl"></div>
              </div>

              <div className="relative z-10 max-w-2xl mx-auto">
                <h3 className="text-xl font-bold text-red-700 mb-6 text-center">下方陣營</h3>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-red-200">
                  {/* Book-style layout */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left page - Data input */}
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

                    {/* Right page - File upload */}
                    <div className="space-y-4 pl-6">
                      <h4 className="text-lg font-semibold text-red-700 mb-4">檔案上傳</h4>
                      <div className="border-2 border-dashed border-red-300 rounded-lg p-8 text-center hover:border-red-400 transition-colors bg-red-50/50 h-32 flex flex-col justify-center">
                        <input
                          type="file"
                          id="side2-upload"
                          className="hidden"
                          accept=".csv,.xlsx,.xls,.json,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload('side2', file);
                          }}
                        />
                        <label htmlFor="side2-upload" className="cursor-pointer flex flex-col items-center">
                          <Upload className="w-8 h-8 text-red-500 mb-2" />
                          <span className="text-sm text-red-700 font-medium">點擊上傳檔案</span>
                          <span className="text-xs text-red-500 mt-1">CSV, Excel, JSON, TXT</span>
                        </label>
                      </div>
                      {battleSetup.side2.file && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm text-green-700 font-medium">
                            ✓ 已上傳: {battleSetup.side2.file.name}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Simulation Result */}
          {simulationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  推演結果
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Winner Announcement */}
                  <div className="col-span-full text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <h3 className="text-2xl font-bold mb-2">
                      {simulationResult.winner === 'side1' ? battleSetup.side1.name : battleSetup.side2.name} 勝出
                    </h3>
                    <p className="text-lg text-muted-foreground">
                      勝率: {(simulationResult.confidence * 100).toFixed(1)}%
                    </p>
                  </div>

                  {/* Metrics Comparison */}
                  <div>
                    <h4 className="font-semibold mb-3 text-blue-600">{battleSetup.side1.name}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>戰力指數</span>
                        <span className="font-medium">{simulationResult.metrics.side1.strength}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>支持度</span>
                        <span className="font-medium">{simulationResult.metrics.side1.support}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>可行性</span>
                        <span className="font-medium">{simulationResult.metrics.side1.feasibility}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-red-600">{battleSetup.side2.name}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>戰力指數</span>
                        <span className="font-medium">{simulationResult.metrics.side2.strength}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>支持度</span>
                        <span className="font-medium">{simulationResult.metrics.side2.support}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>可行性</span>
                        <span className="font-medium">{simulationResult.metrics.side2.feasibility}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reasoning */}
                <div>
                  <h4 className="font-semibold mb-3">推演分析</h4>
                  <ul className="space-y-2">
                    {simulationResult.reasoning.map((reason: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-muted-foreground">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimulationPage;
