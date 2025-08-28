import React from 'react';
import { cn } from '../../utils/cn';

interface TimeSeriesDataPoint {
  period: number;
  date: string;
  playerData: {
    [key: string]: {
      supportRate: number;
      momentum: number;
      mediaExposure: number;
      campaignActivity: number;
      budgetSpent: number;
      keyActions: string[];
    };
  };
  environmentData: {
    mediaAttention: number;
    publicInterest: number;
    majorEvents: string[];
    polls: Array<{
      pollster: string;
      date: string;
      sampleSize: number;
      results: { [key: string]: number };
      marginOfError: number;
      trend: string;
    }>;
  };
}

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  keyEvents?: Array<{
    id: string;
    name: string;
    description: string;
    week: number;
    type: string;
    impact: string;
  }>;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data, keyEvents = [] }) => {
  // 生成24週的完整資料點（插值）
  const generateFullTimeline = () => {
    const fullTimeline: Array<{
      week: number;
      candidateA: number;
      candidateB: number;
      events: string[];
    }> = [];

    // 按period排序
    const sortedData = [...data].sort((a, b) => a.period - b.period);
    
    for (let week = 1; week <= 24; week++) {
      // 找到最接近的資料點
      const beforePoint = sortedData.filter(d => d.period <= week).pop();
      const afterPoint = sortedData.find(d => d.period > week);
      
      let candidateA = 45;
      let candidateB = 42;
      
      if (beforePoint && afterPoint) {
        // 線性插值
        const ratio = (week - beforePoint.period) / (afterPoint.period - beforePoint.period);
        candidateA = beforePoint.playerData['candidate-a'].supportRate + 
          (afterPoint.playerData['candidate-a'].supportRate - beforePoint.playerData['candidate-a'].supportRate) * ratio;
        candidateB = beforePoint.playerData['candidate-b'].supportRate + 
          (afterPoint.playerData['candidate-b'].supportRate - beforePoint.playerData['candidate-b'].supportRate) * ratio;
      } else if (beforePoint) {
        candidateA = beforePoint.playerData['candidate-a'].supportRate;
        candidateB = beforePoint.playerData['candidate-b'].supportRate;
      }
      
      // 找到該週的事件
      const weekEvents = keyEvents.filter(e => e.week === week).map(e => e.name);
      
      fullTimeline.push({
        week,
        candidateA: Math.round(candidateA),
        candidateB: Math.round(candidateB),
        events: weekEvents
      });
    }
    
    return fullTimeline;
  };

  const timeline = generateFullTimeline();
  const maxSupport = Math.max(...timeline.map(t => Math.max(t.candidateA, t.candidateB)));
  const minSupport = Math.min(...timeline.map(t => Math.min(t.candidateA, t.candidateB)));
  const range = maxSupport - minSupport;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">支持度變化趨勢</h3>
      
      {/* 圖表區域 */}
      <div className="relative h-80 mb-6">
        {/* Y軸標籤 */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>{maxSupport}%</span>
          <span>{Math.round((maxSupport + minSupport) / 2)}%</span>
          <span>{minSupport}%</span>
        </div>
        
        {/* 圖表主體 */}
        <div className="ml-12 h-full relative border-l border-b border-gray-200 dark:border-gray-700">
          {/* 網格線 */}
          <div className="absolute inset-0">
            {[0, 25, 50, 75, 100].map(percent => (
              <div
                key={percent}
                className="absolute w-full border-t border-gray-100 dark:border-gray-700"
                style={{ bottom: `${percent}%` }}
              />
            ))}
          </div>
          
          {/* 資料線 */}
          <svg className="absolute inset-0 w-full h-full">
            {/* 候選人A的線 */}
            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              points={timeline.map((point, index) => {
                const x = (index / (timeline.length - 1)) * 100;
                const y = 100 - ((point.candidateA - minSupport) / range) * 100;
                return `${x}%,${y}%`;
              }).join(' ')}
            />
            
            {/* 候選人B的線 */}
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              points={timeline.map((point, index) => {
                const x = (index / (timeline.length - 1)) * 100;
                const y = 100 - ((point.candidateB - minSupport) / range) * 100;
                return `${x}%,${y}%`;
              }).join(' ')}
            />
            
            {/* 資料點 */}
            {timeline.map((point, index) => {
              const x = (index / (timeline.length - 1)) * 100;
              const yA = 100 - ((point.candidateA - minSupport) / range) * 100;
              const yB = 100 - ((point.candidateB - minSupport) / range) * 100;
              
              return (
                <g key={index}>
                  <circle cx={`${x}%`} cy={`${yA}%`} r="4" fill="#10b981" />
                  <circle cx={`${x}%`} cy={`${yB}%`} r="4" fill="#3b82f6" />
                  
                  {/* 事件標記 */}
                  {point.events.length > 0 && (
                    <g>
                      <line x1={`${x}%`} y1="0%" x2={`${x}%`} y2="100%" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,4" />
                      <circle cx={`${x}%`} cy="10%" r="6" fill="#ef4444" />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
          
          {/* X軸標籤 */}
          <div className="absolute -bottom-6 w-full flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>第1週</span>
            <span>第6週</span>
            <span>第12週</span>
            <span>第18週</span>
            <span>第24週</span>
          </div>
        </div>
      </div>
      
      {/* 圖例 */}
      <div className="flex items-center justify-center space-x-8 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-1 bg-green-500"></div>
          <span className="text-sm text-gray-600 dark:text-gray-300">候選人A</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-1 bg-blue-500"></div>
          <span className="text-sm text-gray-600 dark:text-gray-300">候選人B</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-1 bg-red-500 border-dashed"></div>
          <span className="text-sm text-gray-600 dark:text-gray-300">重要事件</span>
        </div>
      </div>
      
      {/* 關鍵事件列表 */}
      {keyEvents.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">關鍵事件</h4>
          <div className="space-y-2">
            {keyEvents.map(event => (
              <div key={event.id} className="flex items-start space-x-3 text-sm">
                <span className="text-gray-500 dark:text-gray-400 w-12">第{event.week}週</span>
                <div className="flex-1">
                  <span className="font-medium text-gray-900 dark:text-white">{event.name}</span>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">{event.description}</p>
                </div>
                <span className={cn("px-2 py-1 rounded text-xs",
                  event.impact === 'positive' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                  event.impact === 'negative' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                )}>
                  {event.impact === 'positive' ? '正面' : event.impact === 'negative' ? '負面' : '中性'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
