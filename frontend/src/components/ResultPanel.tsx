import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import RulesPanel from './RulesPanel';
import ChartViewer from './ChartViewer';

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
}

const ResultPanel: React.FC<ResultPanelProps> = ({
  mode,
  streamResponse = '',
  currentRule = null,
  usedTools = [],
  isLoading = false,
  messages = []
}) => {
  return (
    <div
      className="w-full h-full p-3 pt-10 pr-3.5 pb-1 overflow-auto flex flex-col relative"
    >
      {mode === 'result' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 全版面消息顯示 */}
          {messages.length > 0 ? (
            <div className="flex-1 overflow-auto p-1">
              {messages.map((message, index) => (
                <div key={message.id} className="mb-1">
                  {message.type === 'user' ? (
                    /* 用戶消息 - 深色底淺色字 */
                    <div
                      className="bg-slate-700 text-slate-200 p-1.5 text-xs leading-relaxed whitespace-pre-wrap break-words"
                    >
                      {message.content}
                    </div>
                  ) : (
                    /* AI 回覆 - 直接顯示在背景上 */
                    <div
                      className={cn(
                        "text-xs leading-normal whitespace-pre-wrap break-words text-slate-800",
                        "[&_h1]:text-sm [&_h1]:font-semibold [&_h1]:mt-1 [&_h1]:mb-0.5 [&_h1]:text-slate-800",
                        "[&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-1 [&_h2]:mb-0.5 [&_h2]:text-slate-800",
                        "[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-1 [&_h3]:mb-0.5 [&_h3]:text-slate-800",
                        "[&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mt-1 [&_h4]:mb-0.5 [&_h4]:text-slate-800",
                        "[&_h5]:text-sm [&_h5]:font-semibold [&_h5]:mt-1 [&_h5]:mb-0.5 [&_h5]:text-slate-800",
                        "[&_h6]:text-sm [&_h6]:font-semibold [&_h6]:mt-1 [&_h6]:mb-0.5 [&_h6]:text-slate-800",
                        "[&_p]:mb-1",
                        "[&_ul]:pl-2 [&_ul]:mb-1",
                        "[&_ol]:pl-2 [&_ol]:mb-1", 
                        "[&_li]:mb-0.5",
                        "[&_code]:bg-slate-100 [&_code]:px-0.5 [&_code]:py-0.5 [&_code]:rounded-sm [&_code]:text-xs [&_code]:font-mono",
                        "[&_pre]:bg-slate-800 [&_pre]:text-slate-200 [&_pre]:p-1 [&_pre]:rounded [&_pre]:overflow-auto [&_pre]:text-xs [&_pre]:font-mono"
                      )}
                    >
                      {message.content || (message.isLoading ? '思考中...' : '')}
                      {message.isLoading && (
                        <Loader2 className="inline w-3 h-3 ml-1 text-slate-500 animate-spin" />
                      )}
                    </div>
                  )}
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
        <RulesPanel />
      )}

      {mode === 'skills' && (
        <div className="h-full flex items-center justify-center text-slate-400 text-sm">
          技能管理功能開發中...
        </div>
      )}


    </div>
  );
};

export default ResultPanel;
