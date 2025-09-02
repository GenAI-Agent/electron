import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  Lightbulb,
  Shield,
  Zap,
  BarChart3,
  Calendar,
  Eye,
  Settings,
  X
} from 'lucide-react';
import IconSidebar from '../ui/IconSidebar';
import { mockWarGameProjects } from '../../data/wargame-projects-mock';
import { WarGameProject, WarGameSession } from '../../types/wargame';
import { TimeSeriesChart } from './TimeSeriesChart';

interface WarGamePageProps {
  className?: string;
}

export const WarGamePage: React.FC<WarGamePageProps> = ({ className }) => {
  const [selectedProject, setSelectedProject] = useState<WarGameProject>(mockWarGameProjects[0]);
  const [activeView, setActiveView] = useState<'overview' | 'sessions' | 'timeline' | 'insights' | 'comparison' | 'results'>('overview');
  const [selectedSession, setSelectedSession] = useState<WarGameSession | null>(null);

  const sidebarItems = mockWarGameProjects.map(project => ({
    icon: project.status === 'completed' ? CheckCircle :
      project.status === 'active' ? Clock : Target,
    label: project.name,
    isActive: project.id === selectedProject.id,
    onClick: () => setSelectedProject(project),
    color: project.status === 'completed' ? 'green' :
      project.status === 'active' ? 'orange' : 'gray' as const,
  }));

  const handleAddNew = () => {
    console.log('創建新兵推場景');
  };

  // 統一色彩系統
  const colors = {
    primary: 'text-blue-600 bg-blue-50 border-blue-200',
    neutral: 'text-gray-600 bg-gray-50 border-gray-200',
    highlight: 'text-blue-700 bg-blue-100 border-blue-300'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.primary;
      case 'active': return colors.highlight;
      case 'archived': return colors.neutral;
      default: return colors.neutral;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'active': return '進行中';
      case 'archived': return '已封存';
      default: return '未知';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return colors.highlight;
      case 'medium': return colors.primary;
      case 'low': return colors.neutral;
      default: return colors.neutral;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={cn("h-full flex overflow-hidden", className)}>
      {/* Left Icon Sidebar */}
      <IconSidebar
        items={sidebarItems as any}
        onAddNew={handleAddNew}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between p-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedProject.name}
              </h1>
              <div className="flex items-center space-x-4 mt-2">
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium border", getStatusColor(selectedProject.status))}>
                  {getStatusText(selectedProject.status)}
                </span>
                <span className="text-sm text-gray-500">
                  {selectedProject.baseSettings.timeframe} • {selectedProject.summary.totalRuns} 次兵推
                </span>
                <span className="text-sm font-medium text-blue-600">
                  {selectedProject.summary.winCount}勝{selectedProject.summary.lossCount}負
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-t border-gray-200">
            {[
              { key: 'overview', label: '總覽', icon: Eye },
              { key: 'sessions', label: '兵推記錄', icon: BarChart3 },
              { key: 'timeline', label: '時間序列', icon: Calendar },
              { key: 'insights', label: '關鍵洞察', icon: Lightbulb },
              { key: 'comparison', label: '對比分析', icon: Target }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key as any)}
                className={cn(
                  "flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeView === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {activeView === 'overview' && (
            <div className="p-6">
              {/* Project Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Basic Info */}
                <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">兵推項目概述</h3>
                  <p className="text-gray-600 mb-4">{selectedProject.description}</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">參與方</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedProject.baseSettings.participants.map(participant => (
                          <span key={participant} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {participant}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">目標</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedProject.baseSettings.objectives.slice(0, 2).map(objective => (
                          <span key={objective} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {objective}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overall Statistics */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">總體統計</h3>

                  <div className="space-y-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedProject.summary.totalRuns}
                      </div>
                      <div className="text-sm text-gray-600">總兵推次數</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-blue-600">
                          {selectedProject.summary.winCount}
                        </div>
                        <div className="text-xs text-gray-600">勝場</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-600">
                          {selectedProject.summary.lossCount}
                        </div>
                        <div className="text-xs text-gray-600">敗場</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-sm text-gray-600">平均勝率</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${selectedProject.summary.averageWinRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedProject.summary.averageWinRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">關鍵洞察</h3>
                <div className="space-y-3">
                  {selectedProject.summary.keyInsights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{insight}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">建議策略</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedProject.summary.recommendedStrategy}
                  </p>
                </div>
              </div>

              {/* Recent War Games */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">最近兵推記錄</h3>
                  <button
                    onClick={() => setActiveView('sessions')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    查看全部 →
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedProject.warGames.slice(0, 3).map(session => (
                    <div
                      key={session.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedSession(session);
                        setActiveView('timeline');
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-900">
                            第{session.runNumber}次 - {session.name}
                          </span>
                          <span className={cn("px-2 py-1 rounded text-xs font-medium",
                            session.results.summary.winningStrategy === 'candidate-a' ?
                              'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                          )}>
                            {session.results.summary.winningStrategy === 'candidate-a' ? '候選人A勝' : '候選人B勝'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {session.createdAt.toLocaleDateString('zh-TW')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{session.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>勝率: {session.results.summary.winProbability}%</span>
                        <span>信心度: {session.results.summary.confidenceLevel}%</span>
                        <span>經濟環境: {
                          session.variables.environment.economicCondition === 'good' ? '良好' :
                            session.variables.environment.economicCondition === 'poor' ? '不佳' : '中性'
                        }</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === 'sessions' && (
            <div className="p-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">所有兵推記錄</h3>

                {/* War Games List */}
                <div className="space-y-4">
                  {selectedProject.warGames.map(session => (
                    <div
                      key={session.id}
                      className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedSession(session);
                        setActiveView('timeline');
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl font-bold text-gray-400">
                            #{session.runNumber}
                          </div>
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">{session.name}</h4>
                            <p className="text-sm text-gray-600">{session.description}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={cn("px-3 py-1 rounded-full text-sm font-medium mb-2",
                            session.results.summary.winningStrategy === 'candidate-a' ?
                              'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                          )}>
                            {session.results.summary.winningStrategy === 'candidate-a' ? '候選人A勝' : '候選人B勝'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {session.createdAt.toLocaleDateString('zh-TW')}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">
                            {session.results.summary.winProbability}%
                          </div>
                          <div className="text-xs text-gray-600">勝率</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">
                            {session.results.summary.confidenceLevel}%
                          </div>
                          <div className="text-xs text-gray-600">信心度</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-700">
                            {session.variables.environment.economicCondition === 'good' ? '良好' :
                              session.variables.environment.economicCondition === 'poor' ? '不佳' : '中性'}
                          </div>
                          <div className="text-xs text-gray-600">經濟環境</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-600">
                            {session.variables.voterStructure.turnoutRate}%
                          </div>
                          <div className="text-xs text-gray-600">投票率</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {session.variables.environment.majorEvents.slice(0, 2).map(event => (
                            <span key={event} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {event}
                            </span>
                          ))}
                        </div>

                        <div className="text-blue-600 text-sm font-medium">
                          點擊查看詳情 →
                        </div>
                      </div>

                      {session.comparison && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">與上次對比:</div>
                          <div className="flex items-center space-x-2">
                            <span className={cn("text-sm font-medium",
                              session.comparison.performanceChange > 0 ? 'text-blue-600' :
                                session.comparison.performanceChange < 0 ? 'text-gray-500' :
                                  'text-gray-600'
                            )}>
                              {session.comparison.performanceChange > 0 ? '+' : ''}{session.comparison.performanceChange}%
                            </span>
                            <span className="text-xs text-gray-500">
                              {session.comparison.keyDifferences[0]}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Other views would be implemented similarly */}
          {activeView === 'timeline' && (
            <div className="p-6">
              {/* Session Selector */}
              <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
                <h3 className="text-lg font-semibold text-gray-900  mb-4">選擇兵推進行時間序列分析</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selectedProject.warGames.map(session => (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-colors",
                        selectedSession?.id === session.id
                          ? "border-blue-500 bg-blue-100 text-blue-900"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      )}
                    >
                      <div className="font-medium text-sm">第{session.runNumber}次</div>
                      <div className="text-xs opacity-75 mt-1">{session.name}</div>
                      <div className="text-xs mt-1">
                        {session.results.summary.winningStrategy === 'candidate-a' ? 'A勝' : 'B勝'}
                        ({session.results.summary.winProbability}%)
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedSession ? (
                <div className="space-y-6">
                  {/* Session Header */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          第{selectedSession.runNumber}次兵推 - {selectedSession.name}
                        </h3>
                        <p className="text-gray-600 mt-1">{selectedSession.description}</p>
                      </div>
                      <button
                        onClick={() => setSelectedSession(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Variables Summary */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700">
                          {selectedSession.variables.environment.economicCondition === 'good' ? '良好' :
                            selectedSession.variables.environment.economicCondition === 'poor' ? '不佳' : '中性'}
                        </div>
                        <div className="text-xs text-gray-600">經濟環境</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700">
                          {selectedSession.variables.environment.mediaEnvironment === 'favorable' ? '友善' :
                            selectedSession.variables.environment.mediaEnvironment === 'hostile' ? '敵對' : '中性'}
                        </div>
                        <div className="text-xs text-gray-600">媒體環境</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700">
                          {selectedSession.variables.voterStructure.turnoutRate}%
                        </div>
                        <div className="text-xs text-gray-600">預期投票率</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-blue-600">
                          {selectedSession.results.summary.winProbability}%
                        </div>
                        <div className="text-xs text-gray-600">最終勝率</div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Chart */}
                  <TimeSeriesChart
                    data={selectedSession.simulation.timeline}
                    keyEvents={selectedSession.simulation.keyEvents}
                  />

                  {/* Detailed Timeline */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">詳細時間軸</h4>
                    <div className="space-y-4">
                      {selectedSession.simulation.timeline.map((timePoint, index) => (
                        <div key={timePoint.period} className="border-l-2 border-gray-200 pl-4 relative">
                          <div className="absolute -left-2 w-4 h-4 bg-gray-400 rounded-full"></div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-gray-900">
                              第{timePoint.period}週 ({timePoint.date})
                            </div>
                            <div className="text-xs text-gray-500">
                              媒體關注度: {timePoint.environmentData.mediaAttention}%
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-sm font-medium text-gray-900 mb-1">候選人A</div>
                              <div className="flex items-center space-x-2">
                                <div className="text-lg font-bold text-blue-600">
                                  {timePoint.playerData['candidate-a']?.supportRate}%
                                </div>
                                <div className={cn("text-xs px-2 py-1 rounded",
                                  timePoint.playerData['candidate-a']?.momentum > 0 ? 'bg-blue-100 text-blue-700' :
                                    timePoint.playerData['candidate-a']?.momentum < 0 ? 'bg-gray-200 text-gray-700' :
                                      'bg-gray-100 text-gray-700'
                                )}>
                                  {timePoint.playerData['candidate-a']?.momentum > 0 ? '+' : ''}{timePoint.playerData['candidate-a']?.momentum}
                                </div>
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                預算使用: {formatCurrency(timePoint.playerData['candidate-a']?.budgetSpent || 0)}
                              </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-sm font-medium text-gray-900 mb-1">候選人B</div>
                              <div className="flex items-center space-x-2">
                                <div className="text-lg font-bold text-gray-700">
                                  {timePoint.playerData['candidate-b']?.supportRate}%
                                </div>
                                <div className={cn("text-xs px-2 py-1 rounded",
                                  timePoint.playerData['candidate-b']?.momentum > 0 ? 'bg-blue-100 text-blue-700' :
                                    timePoint.playerData['candidate-b']?.momentum < 0 ? 'bg-gray-200 text-gray-700' :
                                      'bg-gray-100 text-gray-700'
                                )}>
                                  {timePoint.playerData['candidate-b']?.momentum > 0 ? '+' : ''}{timePoint.playerData['candidate-b']?.momentum}
                                </div>
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                預算使用: {formatCurrency(timePoint.playerData['candidate-b']?.budgetSpent || 0)}
                              </div>
                            </div>
                          </div>

                          {/* Key Actions */}
                          <div className="space-y-2">
                            <div className="text-xs text-gray-600">關鍵行動:</div>
                            <div className="flex flex-wrap gap-1">
                              {timePoint.playerData['candidate-a']?.keyActions.map(action => (
                                <span key={action} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  A: {action}
                                </span>
                              ))}
                              {timePoint.playerData['candidate-b']?.keyActions.map(action => (
                                <span key={action} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  B: {action}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Major Events */}
                          {timePoint.environmentData.majorEvents.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs text-gray-600 mb-1">重大事件:</div>
                              <div className="flex flex-wrap gap-1">
                                {timePoint.environmentData.majorEvents.map(event => (
                                  <span key={event} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                    {event}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Events */}
                  {selectedSession.simulation.keyEvents.length > 0 && (
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">關鍵事件</h4>
                      <div className="space-y-3">
                        {selectedSession.simulation.keyEvents.map(event => (
                          <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-medium text-gray-900">{event.name}</h5>
                              <span className={cn("px-2 py-1 rounded text-xs font-medium",
                                event.impact === 'positive' ? 'bg-blue-100 text-blue-700' :
                                  event.impact === 'negative' ? 'bg-gray-200 text-gray-700' :
                                    'bg-gray-50 text-gray-700'
                              )}>
                                第{event.week}週
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                            <p className="text-sm text-blue-600">{event.response}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                  <div className="text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>請從兵推記錄中選擇一次兵推來查看詳細時間序列</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'insights' && (
            <div className="p-6">
              <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">跨兵推關鍵洞察</h3>
                <div className="space-y-4">
                  {selectedProject.summary.keyInsights.map((insight, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{insight}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Individual Session Insights */}
              <div className="space-y-6">
                {selectedProject.warGames.map(session => (
                  <div key={session.id} className="bg-white rounded-lg p-6 shadow-sm">
                    <h4 className="text-lg font-medium text-gray-900 mb-6">
                      第{session.runNumber}次兵推分析 - {session.name}
                    </h4>

                    {/* 洞察發現 */}
                    <div className="mb-6">
                      <h5 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                        <Lightbulb className="w-5 h-5 text-blue-600 mr-2" />
                        關鍵洞察
                      </h5>
                      <div className="space-y-3">
                        {session.simulation.insights.filter(i => i.type === 'discovery').map(insight => (
                          <div key={insight.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start justify-between mb-2">
                              <h6 className="font-medium text-gray-900">{insight.title}</h6>
                              <span className={cn("px-2 py-1 rounded text-xs font-medium",
                                insight.priority === 'high' ? 'bg-blue-100 text-blue-700' :
                                  insight.priority === 'medium' ? 'bg-gray-200 text-gray-700' :
                                    'bg-gray-100 text-gray-700'
                              )}>
                                {insight.priority === 'high' ? '高重要性' :
                                  insight.priority === 'medium' ? '中重要性' : '低重要性'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                            <div className="text-xs text-gray-600">
                              發現時間：第{insight.discoveredAt}週
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 行動建議 */}
                    <div className="mb-6">
                      <h5 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                        <Target className="w-5 h-5 text-blue-600 mr-2" />
                        行動建議
                      </h5>
                      <div className="space-y-3">
                        {session.simulation.insights.filter(i => i.actionRequired && i.actionItems && i.actionItems.length > 0).map(insight => (
                          <div key={insight.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h6 className="font-medium text-gray-900 mb-2">{insight.title}</h6>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {insight.actionItems?.map((item, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-blue-600 mr-2">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 風險隱憂 */}
                    <div>
                      <h5 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                        風險隱憂
                      </h5>
                      <div className="space-y-3">
                        {session.simulation.insights.filter(i => i.type === 'risk_alert').map(insight => (
                          <div key={insight.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h6 className="font-medium text-gray-900 mb-2">{insight.title}</h6>
                            <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                            {insight.actionItems && insight.actionItems.length > 0 && (
                              <div>
                                <div className="text-xs text-gray-600 mb-1">建議應對措施：</div>
                                <ul className="text-sm text-gray-700 space-y-1">
                                  {insight.actionItems.map((item, index) => (
                                    <li key={index} className="flex items-start">
                                      <span className="text-blue-600 mr-2">•</span>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* 如果沒有風險隱憂，顯示一般性風險 */}
                        {session.simulation.insights.filter(i => i.type === 'risk_alert').length === 0 && (
                          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h6 className="font-medium text-gray-900 mb-2">潛在風險提醒</h6>
                            <p className="text-sm text-gray-700">
                              {session.runNumber <= 2 ? '初期兵推風險相對較低，但需注意突發事件的影響' :
                                session.runNumber <= 5 ? '中期需特別關注媒體環境變化和民意波動' :
                                  '後期兵推複雜度較高，需防範多重風險疊加效應'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'comparison' && (
            <div className="p-6">
              <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">兵推對比分析</h3>

                {/* Performance Comparison Chart */}
                <div className="mb-8">
                  <h4 className="text-md font-medium text-gray-900 mb-4">勝率變化趨勢</h4>
                  <div className="space-y-3">
                    {selectedProject.warGames.map((session, index) => (
                      <div key={session.id} className="flex items-center space-x-4">
                        <div className="w-16 text-sm text-gray-600">
                          第{session.runNumber}次
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {session.name}
                            </span>
                            <span className={cn("px-2 py-1 rounded text-xs font-medium",
                              session.results.summary.winningStrategy === 'candidate-a' ?
                                'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                            )}>
                              {session.results.summary.winningStrategy === 'candidate-a' ? 'A勝' : 'B勝'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-3">
                              <div
                                className={cn("h-3 rounded-full",
                                  session.results.summary.winProbability >= 50 ? 'bg-blue-500' : 'bg-gray-400'
                                )}
                                style={{ width: `${session.results.summary.winProbability}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-12">
                              {session.results.summary.winProbability}%
                            </span>
                            {session.comparison && (
                              <span className={cn("text-xs px-2 py-1 rounded",
                                session.comparison.performanceChange > 0 ? 'bg-blue-100 text-blue-700' :
                                  session.comparison.performanceChange < 0 ? 'bg-gray-200 text-gray-700' :
                                    'bg-gray-100 text-gray-700'
                              )}>
                                {session.comparison.performanceChange > 0 ? '+' : ''}{session.comparison.performanceChange}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Variable Impact Analysis */}
                <div className="mb-8">
                  <h4 className="text-md font-medium text-gray-900 mb-4">變數影響分析</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-900 mb-3">經濟環境影響</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">良好環境</span>
                          <span className="font-medium text-blue-600">平均勝率 80%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">中性環境</span>
                          <span className="font-medium text-gray-700">平均勝率 52%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">不佳環境</span>
                          <span className="font-medium text-gray-600">平均勝率 45%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-900 mb-3">媒體環境影響</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">友善媒體</span>
                          <span className="font-medium text-blue-600">+8% 勝率</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">中性媒體</span>
                          <span className="font-medium text-gray-700">基準</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">敵對媒體</span>
                          <span className="font-medium text-gray-600">-12% 勝率</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-900 mb-3">投票率影響</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">高投票率 (70%+)</span>
                          <span className="font-medium text-blue-600">+5% 勝率</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">中投票率 (60-70%)</span>
                          <span className="font-medium text-gray-700">基準</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">低投票率 (&lt;60%)</span>
                          <span className="font-medium text-gray-600">-3% 勝率</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Differences */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">關鍵差異分析</h4>
                  <div className="space-y-4">
                    {selectedProject.warGames.filter(session => session.comparison).map(session => (
                      <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900">
                            第{session.runNumber}次 vs 第{session.runNumber - 1}次
                          </h5>
                          <span className={cn("px-2 py-1 rounded text-sm font-medium",
                            session.comparison!.performanceChange > 0 ? 'bg-blue-100 text-blue-700' :
                              session.comparison!.performanceChange < 0 ? 'bg-gray-200 text-gray-700' :
                                'bg-gray-50 text-gray-700'
                          )}>
                            {session.comparison!.performanceChange > 0 ? '+' : ''}{session.comparison!.performanceChange}% 變化
                          </span>
                        </div>
                        <div className="space-y-2">
                          {session.comparison!.keyDifferences.map((diff, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-sm text-gray-600">{diff}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* {activeView === 'results' && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">最終結果</h3>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedScenario.results.summary.winProbability}%
                      </div>
                      <div className="text-sm text-gray-600">勝出機率</div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">關鍵成功因素：</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {selectedScenario.results.summary.keyFactors.map((factor: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">策略建議</h3>
                  <div className="space-y-3">
                    {selectedScenario.results.recommendations.slice(0, 3).map((rec: any) => (
                      <div key={rec.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 text-sm">{rec.title}</h4>
                          <span className={cn("px-2 py-1 rounded text-xs font-medium",
                            rec.priority === 'critical' ? 'bg-blue-100 text-blue-700' :
                              rec.priority === 'high' ? 'bg-gray-200 text-gray-700' :
                                'bg-gray-100 text-gray-700'
                          )}>
                            {rec.priority === 'critical' ? '緊急' :
                              rec.priority === 'high' ? '重要' : '一般'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default WarGamePage;
