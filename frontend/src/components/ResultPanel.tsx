import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import RulesPanel from './RulesPanel';
import { ReactMarkdownCustom } from './ReactMarkdownCustom';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface ResultPanelProps {
  mode: 'result' | 'rules' | 'skills';
  streamResponse?: string;
  currentRule?: string | null;
  usedTools?: string[];
  isLoading?: boolean;
  messages?: ChatMessage[];
  onRulesUpdate?: () => void;
}

const ResultPanel: React.FC<ResultPanelProps> = ({
  mode,
  streamResponse = '',
  currentRule = null,
  usedTools = [],
  isLoading = false,
  messages = [],
  onRulesUpdate
}) => {
  return (
    <div
      className="w-full h-full p-3 pr-3.5 pb-1 overflow-auto flex flex-col relative"
    >
      {mode === 'result' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 优化的消息显示 */}
          {messages.length > 0 ? (
            <div className="flex-1 overflow-auto space-y-3 p-2">
              {messages.map((message, index) => (
                <div key={message.id} className="flex flex-col">
                  {message.type === 'user' ? (
                    /* 用户消息 - 右对齐气泡样式 */
                    <div className="flex justify-end">
                      <div className="bg-blue-500 text-white px-3 py-2 rounded-lg max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm">
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    /* AI 回复 - 左对齐卡片样式，使用 ReactMarkdown */
                    <div className="flex justify-start">
                      <div className="px-3 py-2 rounded-lg max-w-full">
                        <div className="text-sm leading-relaxed text-slate-700">
                          {message.content ? (
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdownCustom>
                                {message.content}
                              </ReactMarkdownCustom>
                            </div>
                          ) : message.isLoading ? (
                            <span className="text-slate-500">正在思考...</span>
                          ) : null}

                          {message.isLoading && (
                            <div className="flex items-center mt-2">
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
              輸入訊息開始對話...
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

      {mode === 'skills' && (
        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
          技能管理功能開發中...
        </div>
      )}


    </div>
  );
};

export default ResultPanel;
