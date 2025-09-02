import React from 'react';
import { Loader2, Target, CheckCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import RulesPanel from './RulesPanel';
import { ReactMarkdownCustom } from './ReactMarkdownCustom';
import JourneyComponent from './JourneyComponent';
import { useModal } from './Modal/ModalProvider';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface ResultPanelProps {
  mode: 'result' | 'rules' | 'skills' | 'simulation';
  streamResponse?: string;
  currentRule?: string | null;
  usedTools?: string[];
  isLoading?: boolean;
  messages?: ChatMessage[];
  onRulesUpdate?: () => void;
  simulationRecords?: Array<{
    id: string;
    title: string;
    participants: { side1: string; side2: string };
    date: string;
    status: string;
    result: { confidence: number };
  }>;
  onSimulationRecordSelect?: (record: any) => void;
}

const ResultPanel: React.FC<ResultPanelProps> = ({
  mode,
  streamResponse = '',
  currentRule = null,
  usedTools = [],
  isLoading = false,
  messages = [],
  onRulesUpdate,
  simulationRecords = [],
  onSimulationRecordSelect
}) => {
  const { openChristmasModal } = useModal();
  return (
    <div
      className="w-full h-full p-3 pr-3.5 pb-2 overflow-auto flex flex-col relative"
    >
      {mode === 'result' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 优化的消息显示 */}
          {messages.length > 0 ? (
            <div className="flex-1 overflow-auto space-y-3 p-2 pb-4">
              {messages.map((message, index) => (
                <div key={message.id} className="flex flex-col">
                  {message.type === 'user' ? (
                    /* 用户消息 - 右对齐气泡样式 */
                    <div className="flex justify-end">
                      <div className="bg-primary text-white px-3 py-2 rounded-lg max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm">
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    /* AI 回复 - 左对齐卡片样式，使用 ReactMarkdown */
                    <div className="flex justify-start">
                      <div className="px-3 py-4 rounded-lg max-w-full">
                        <div className="text-sm leading-relaxed text-slate-700">
                          {/* TODO: DEV 檢查前一筆訊息是否包含「華航旅程」或「聖誕節旅程」 */}
                          {message.type === 'assistant' && index > 0 &&
                            messages[index - 1].content.includes('華航旅程') ? (
                            <div className="prose prose-sm max-w-none flex flex-col gap-2">
                              已經規劃好華航旅程，點擊查看詳細信息
                              <JourneyComponent />
                            </div>
                          ) : message.type === 'assistant' && index > 0 &&
                            messages[index - 1].content.includes('聖誕節旅程') ? (
                            <div className="prose prose-sm max-w-none flex flex-col gap-2">
                              已經規劃好聖誕節旅程，點擊查看詳細信息
                              <button
                                onClick={openChristmasModal}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 w-fit"
                              >
                                🎄 查看2025聖誕節推薦
                              </button>
                            </div>
                          ) : message.content ? (
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdownCustom>
                                {message.content}
                              </ReactMarkdownCustom>
                            </div>
                          ) : message.isLoading ? (
                            <span className="text-slate-500">正在思考...</span>
                          ) : null}
                          {message.isLoading && (
                            <div className="flex items-center mt-2 py-4">
                              <Loader2 className="w-4 h-4 text-blue-500 animate-spin mr-2" />
                              <span className="text-slate-500 text-xs">AI 正在處理中...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* 时间戳 */}
                  <div className={cn(
                    "text-xs text-slate-400 mt-1 px-1",
                    message.type === 'user' ? "text-right" : "text-left"
                  )}>
                    {message.timestamp.toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              DM OPEN AGENT...
            </div>
          )}

          {/* 當前規則信息 */}
          {currentRule && (
            <div className="border-t border-slate-200 p-1 bg-slate-50">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 h-5">
                當前規則: {currentRule}
              </span>
            </div>
          )}
        </div>
      )}

      {mode === 'rules' && (
        <RulesPanel onRulesUpdate={onRulesUpdate} />
      )}

      {mode === 'simulation' && (
        <div className="flex-1 overflow-auto p-2">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-slate-700 mb-2">推演記錄</h3>
            <p className="text-xs text-slate-500">點擊記錄查看詳細分析</p>
          </div>

          <div className="space-y-2">
            {simulationRecords.map((record) => (
              <div
                key={record.id}
                className="p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                onClick={() => onSimulationRecordSelect?.(record)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-900 text-sm">{record.title}</h4>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    record.status === 'completed' ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-600"
                  )}>
                    {record.status === 'completed' ? '完成' : '進行中'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-2">{record.participants.side1} vs {record.participants.side2}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{record.date}</span>
                  <span>信心度: {(record.result.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="mt-2 text-xs text-blue-600 font-medium">
                  點擊查看詳細分析 →
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === 'skills' && (
        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
          新增以使用技能管理功能
        </div>
      )}

    </div>
  );
};

export default ResultPanel;
