import React, { useEffect, useRef, useState } from 'react';
import { Paperclip, Image, Headphones, FileText, Puzzle, Brain, Send, Edit } from 'lucide-react';
import { useRouter } from 'next/router';
import ResultPanel from './ResultPanel';
import { sessionManager, FileContext } from '@/utils/sessionManager';
import { cn } from '@/utils/cn';

type PanelMode = 'result' | 'rules' | 'skills';

interface StreamMessage {
  type: 'start' | 'rule' | 'processing' | 'tools' | 'content' | 'complete' | 'error';
  message?: string;
  content?: string;
  rule_name?: string;
  tools?: string[];
  execution_time?: number;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface AgentPanelProps {
  topHeight?: number;                         // 初始百分比（0-100）
  onTopHeightChange?: (heightPct: number) => void;
  onDragStateChange?: (dragging: boolean, cursor?: 'col-resize' | 'row-resize') => void; // 告知父層是否正在拖曳（用於禁用 webview）
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const AgentPanel: React.FC<AgentPanelProps> = ({
  topHeight = 30,
  onTopHeightChange,
  onDragStateChange,
}) => {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [panelMode, setPanelMode] = useState<PanelMode>('result');
  const [isLoading, setIsLoading] = useState(false);
  const [streamResponse, setStreamResponse] = useState('');
  const [currentRule, setCurrentRule] = useState<string | null>(null);
  const [usedTools, setUsedTools] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [fileContext, setFileContext] = useState<FileContext | null>(null);

  // 刷新 session 功能
  const handleRefreshSession = () => {
    // 創建新的 session
    const newSessionId = sessionManager.createNewSession();

    // 清空當前狀態
    setMessages([]);
    setStreamResponse('');
    setCurrentRule(null);
    setUsedTools([]);
    setInput('');

    console.log(`🔄 已創建新 session: ${newSessionId}`);
  };

  // 內部百分比狀態（可被 props 初始化）
  const [heightPct, setHeightPct] = useState(75);  // 預設上面 75%，下面輸入框 25%
  useEffect(() => { setHeightPct(clamp(topHeight || 75, 70, 85)); }, [topHeight]);

  // 檢測當前模式和文件上下文
  useEffect(() => {
    const updateContext = () => {
      const { mode, file, path } = router.query;

      // 更新 session manager 的模式
      if (mode === 'local') {
        sessionManager.setMode('local');
        // 檢查 file 或 path 參數
        const filePath = file || path;
        if (filePath && typeof filePath === 'string') {
          sessionManager.setCurrentFile(filePath);
          console.log('📁 設置文件路徑:', filePath);
        }
      } else {
        sessionManager.setMode('browser');
      }

      // 更新本地狀態
      setFileContext(sessionManager.getCurrentContext());
      console.log('🔄 更新上下文:', sessionManager.getCurrentContext());
    };

    updateContext();

    // 監聽路由變化
    router.events?.on('routeChangeComplete', updateContext);

    return () => {
      router.events?.off('routeChangeComplete', updateContext);
    };
  }, [router.query, router.events]);

  // 移除瀏覽器輪詢邏輯，現在直接使用 Electron HTTP API

  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const startDrag = (clientY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    // Notify parent about drag start immediately
    onDragStateChange?.(true, 'row-resize');

    const move = (y: number) => {
      const raw = ((y - rect.top) / rect.height) * 100;
      const next = clamp(raw, 70, 85);        // 限制：上面 70%-85%（底部 15%-30%）
      // 用 rAF 避免大量 reflow
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setHeightPct(next);
        onTopHeightChange?.(next);
      });
    };

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      move(e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      move(e.touches[0].clientY);
    };

    const stop = (e?: Event) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Clean up event listeners
      document.removeEventListener('mousemove', onMouseMove, { capture: true } as any);
      document.removeEventListener('mouseup', stop, { capture: true } as any);
      document.removeEventListener('touchmove', onTouchMove, { capture: true } as any);
      document.removeEventListener('touchend', stop, { capture: true } as any);

      // Reset styles
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
      document.body.classList.remove('dragging');

      // Cancel any pending animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      onDragStateChange?.(false);
    };

    // Set up global styles for dragging
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    document.body.style.pointerEvents = 'none';
    document.body.classList.add('dragging');

    // Add event listeners with capture to ensure they're not blocked
    document.addEventListener('mousemove', onMouseMove, { passive: false, capture: true });
    document.addEventListener('mouseup', stop, { passive: false, capture: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    document.addEventListener('touchend', stop, { passive: false, capture: true });
  };

  const handleStreamResponse = async (message: string, messageId?: string) => {
    setIsLoading(true);
    setStreamResponse('');
    setCurrentRule(null);
    setUsedTools([]);

    try {
      // 檢查是否是測試命令
      const testCommands = {
        'test_slide': { action: 'scroll', params: ['down', 300], description: '向下滑動300px' },
        'test_navigate': { action: 'navigate', params: ['https://www.google.com'], description: '導覽到Google' },
        'test_click': { action: 'click', params: ['button'], description: '點擊第一個按鈕' },
        'test_input': { action: 'type', params: ['input[type="text"]', 'Hello World'], description: '在文字輸入框輸入Hello World' }
      };

      const lowerMessage = message.trim().toLowerCase();
      const testCommand = testCommands[lowerMessage as keyof typeof testCommands];

      if (testCommand) {
        console.log(`🧪 檢測到測試命令: ${lowerMessage}`);

        try {
          let result;
          const { action, params, description } = testCommand;

          if (typeof window !== 'undefined' && window.electronAPI?.browserControl) {
            switch (action) {
              case 'scroll':
                if (window.electronAPI.browserControl.testScroll) {
                  result = await window.electronAPI.browserControl.testScroll(params[0], params[1]);
                } else {
                  throw new Error('testScroll 函數不存在');
                }
                break;

              case 'navigate':
                if (window.electronAPI.browserControl.testNavigate) {
                  result = await window.electronAPI.browserControl.testNavigate(params[0]);
                } else {
                  throw new Error('testNavigate 函數不存在');
                }
                break;

              case 'click':
                if (window.electronAPI.browserControl.testClick) {
                  result = await window.electronAPI.browserControl.testClick(params[0]);
                } else {
                  throw new Error('testClick 函數不存在');
                }
                break;

              case 'type':
                if (window.electronAPI.browserControl.testType) {
                  result = await window.electronAPI.browserControl.testType(params[0], params[1]);
                } else {
                  throw new Error('testType 函數不存在');
                }
                break;

              default:
                throw new Error(`不支援的測試動作: ${action}`);
            }

            if (result && result.success) {
              const testMessage = `✅ 測試${description}成功！`;
              setStreamResponse(testMessage);

              if (messageId) {
                setMessages(prev => prev.map(msg =>
                  msg.id === messageId
                    ? { ...msg, content: testMessage, isLoading: false }
                    : msg
                ));
              }
            } else {
              const errorMessage = `❌ 測試${description}失敗: ${result?.error || '未知錯誤'}`;
              setStreamResponse(errorMessage);

              if (messageId) {
                setMessages(prev => prev.map(msg =>
                  msg.id === messageId
                    ? { ...msg, content: errorMessage, isLoading: false }
                    : msg
                ));
              }
            }
          } else {
            const errorMessage = '❌ Electron API 不可用';
            setStreamResponse(errorMessage);
            console.error('electronAPI狀態:', {
              electronAPI: typeof window !== 'undefined' ? !!window.electronAPI : 'window undefined',
              browserControl: typeof window !== 'undefined' && window.electronAPI ? !!window.electronAPI.browserControl : 'no electronAPI'
            });

            if (messageId) {
              setMessages(prev => prev.map(msg =>
                msg.id === messageId
                  ? { ...msg, content: errorMessage, isLoading: false }
                  : msg
              ));
            }
          }
        } catch (error) {
          const errorMessage = `❌ 測試${testCommand.description}請求失敗: ${error.message}`;
          setStreamResponse(errorMessage);
          console.error('測試錯誤:', error);

          if (messageId) {
            setMessages(prev => prev.map(msg =>
              msg.id === messageId
                ? { ...msg, content: errorMessage, isLoading: false }
                : msg
            ));
          }
        }

        setIsLoading(false);
        return;
      }

      // 獲取當前頁面資料或文件上下文
      let contextData = null;
      const currentContext = sessionManager.getCurrentContext();

      if (currentContext.mode === 'local' && currentContext.current_file) {
        // Local file 模式：使用文件上下文
        contextData = {
          type: 'file',
          file_path: currentContext.current_file,
          file_summary: currentContext.file_summary
        };
        console.log('📁 使用文件上下文:', contextData);
      } else {
        // Browser 模式：獲取頁面資料
        try {
          if (typeof window !== 'undefined' && window.electronAPI?.browserControl?.getPageData) {
            const pageResult = await window.electronAPI.browserControl.getPageData();
            console.log('📄 完整的頁面結果:', pageResult);

            if (pageResult.success) {
              contextData = {
                type: 'page',
                ...pageResult.data
              };
              console.log('📄 獲取到真實頁面資料:', contextData);
            } else {
              console.warn('⚠️ 獲取頁面資料失敗:', pageResult.error);
            }
          } else {
            console.warn('⚠️ Electron API 不可用');
          }
        } catch (error) {
          console.warn('⚠️ 獲取頁面資料失敗:', error);
        }
      }

      const response = await fetch('http://localhost:8000/api/agent/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          user_id: 'default_user',
          session_id: sessionManager.getSessionId(),
          context_data: contextData
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('無法獲取響應流');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setIsLoading(false);
              return;
            }

            try {
              const parsed: StreamMessage = JSON.parse(data);

              switch (parsed.type) {
                case 'rule':
                  setCurrentRule(parsed.rule_name || null);
                  break;
                case 'content':
                  const content = parsed.content || '';
                  setStreamResponse(prev => prev + content);
                  // 更新消息內容
                  if (messageId) {
                    setMessages(prev => prev.map(msg =>
                      msg.id === messageId
                        ? { ...msg, content: msg.content + content, isLoading: true }
                        : msg
                    ));
                  }

                  break;
                case 'error':
                  const errorMsg = `\n錯誤: ${parsed.message}`;
                  setStreamResponse(prev => prev + errorMsg);
                  if (messageId) {
                    setMessages(prev => prev.map(msg =>
                      msg.id === messageId
                        ? { ...msg, content: msg.content + errorMsg, isLoading: false }
                        : msg
                    ));
                  }
                  break;
                case 'complete':
                  setIsLoading(false);
                  // 標記消息完成
                  if (messageId) {
                    setMessages(prev => prev.map(msg =>
                      msg.id === messageId
                        ? { ...msg, isLoading: false }
                        : msg
                    ));
                  }
                  break;
              }
            } catch (e) {
              console.error('解析流數據失敗:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('流式請求失敗:', error);
      setStreamResponse(`請求失敗: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    // 添加用戶消息
    setMessages(prev => [...prev, userMessage]);

    // 添加加載中的助手消息
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages(prev => [...prev, assistantMessage]);

    // 清空輸入框並開始流式響應
    const currentInput = input.trim();
    setInput('');
    setStreamResponse('');
    handleStreamResponse(currentInput, assistantMessage.id);
  };

  return (
    <div
      ref={containerRef}
      data-agent-panel
      className="w-full h-full bg-[#f0f4f8] grid relative"
      style={{ gridTemplateRows: `${heightPct}% 8px 1fr` }}
    >
      {/* Top Panel */}
      <div className="relative m-1 mb-0 min-h-[120px] overflow-hidden z-[1]">
        {/* 移除白色背景，讓內容直接顯示在背景上 */}
        {/* 刷新按鈕 - 左上角 */}
        <div className="absolute top-2 left-[10px] z-10 bg-[rgba(240,244,248,0.95)] rounded-md p-1 border border-[rgba(226,232,240,0.5)]">
          <button
            onClick={handleRefreshSession}
            className="text-slate-600 hover:bg-slate-100 w-6 h-6 flex items-center justify-center rounded transition-colors"
            title="新建 Session"
          >
            <Edit className="w-[14px] h-[14px]" />
          </button>
        </div>

        {/* Toggle - 右上角 */}
        <div className="absolute top-2 right-[10px] flex gap-1 z-10 bg-[rgba(240,244,248,0.95)] rounded-md p-1 border border-[rgba(226,232,240,0.5)]">
          <button
            onClick={() => setPanelMode('result')}
            className={cn(
              "w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-slate-100",
              panelMode === 'result' ? "text-slate-600" : "text-slate-300"
            )}
          >
            <FileText className="w-[14px] h-[14px]" />
          </button>
          <button
            onClick={() => setPanelMode('rules')}
            className={cn(
              "w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-slate-100",
              panelMode === 'rules' ? "text-slate-600" : "text-slate-300"
            )}
          >
            <Puzzle className="w-[14px] h-[14px]" />
          </button>
          <button
            onClick={() => setPanelMode('skills')}
            className={cn(
              "w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-slate-100",
              panelMode === 'skills' ? "text-slate-600" : "text-slate-300"
            )}
          >
            <Brain className="w-[14px] h-[14px]" />
          </button>
        </div>

        <ResultPanel
          mode={panelMode}
          streamResponse={streamResponse}
          currentRule={currentRule}
          usedTools={usedTools}
          isLoading={isLoading}
          messages={messages}
        />
      </div>

      {/* Resizer */}
      <div
        role="separator"
        aria-orientation="horizontal"
        className="drag-handle drag-handle-vertical h-2 w-full cursor-row-resize flex items-center justify-center relative z-[1000] select-none hover:bg-slate-50 before:content-[''] before:absolute before:left-2 before:right-2 before:top-1/2 before:h-px before:bg-slate-200 before:-translate-y-1/2 before:pointer-events-none"
        style={{ WebkitAppRegion: 'no-drag' }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          startDrag(e.clientY);
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          startDrag(e.touches[0].clientY);
        }}
      ></div>

      {/* Bottom Panel (Input) */}
      <div className="flex flex-col min-h-0 p-2 pr-[10px] relative z-[2] bg-[#f0f4f8]">
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col min-h-0 relative"
        >
          <div className="flex-1 cursor-text max-w-[50vw] relative">
            <textarea
              className="w-full h-full bg-[#f0f4f8] rounded-lg border border-slate-200 hover:border-slate-300 focus:border-slate-400 focus:outline-none pt-2 pl-3 pr-10 pb-2 text-xs leading-tight text-gray-800 cursor-text resize-none placeholder:text-gray-400"
              placeholder="輸入文字"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              autoFocus
              onClick={(e) => {
                e.currentTarget.focus();
              }}
              style={{
                fontSize: '12px',
                cursor: 'text'
              }}
            />
          </div>

          {/* 發送按鈕 */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              "absolute bottom-2 right-2 w-7 h-7 flex items-center justify-center rounded transition-colors",
              input.trim() && !isLoading
                ? "text-blue-500 hover:bg-slate-100"
                : "text-slate-400",
              "disabled:text-slate-400"
            )}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>

        {/* Bottom Icons */}
        <div className="flex justify-between items-center pt-1 flex-shrink-0">
          <div className="flex gap-1">
            <button className="text-slate-600 hover:bg-slate-100 w-5 h-5 flex items-center justify-center rounded transition-colors">
              <Paperclip className="w-[14px] h-[14px]" />
            </button>
            <button className="text-slate-600 hover:bg-slate-100 w-5 h-5 flex items-center justify-center rounded transition-colors">
              <Image className="w-[14px] h-[14px]" />
            </button>
            <button className="text-slate-600 hover:bg-slate-100 w-5 h-5 flex items-center justify-center rounded transition-colors">
              <Headphones className="w-[14px] h-[14px]" />
            </button>
          </div>
          <div />
        </div>
      </div>
    </div>
  );
};

export default AgentPanel;
