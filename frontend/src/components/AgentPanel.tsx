import React, { useEffect, useRef, useState } from 'react';
import { Paperclip, Image, Headphones, FileText, Puzzle, Brain, Send, Edit } from 'lucide-react';
import { useRouter } from 'next/router';
import ResultPanel from './ResultPanel';
import { sessionManager, FileContext } from '@/utils/sessionManager';
import { cn } from '@/utils/cn';
import { getOAuthTokens, isGmailPage } from '@/utils/PageDataExtractor';

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
  const [isComposing, setIsComposing] = useState(false); // 中文输入法组合状态

  // Rule autocomplete 相關狀態
  const [showRuleAutocomplete, setShowRuleAutocomplete] = useState(false);
  const [ruleMatches, setRuleMatches] = useState<string[]>([]);
  const [availableRules, setAvailableRules] = useState<string[]>([]);
  const [selectedRuleIndex, setSelectedRuleIndex] = useState(0);

  // 刷新 session 功能
  const handleRefreshSession = () => {
    // 強制刷新 session ID（保留文件上下文）
    const newSessionId = sessionManager.forceRefreshSession();

    // 清空當前狀態
    setMessages([]);
    setStreamResponse('');
    setCurrentRule(null);
    setUsedTools([]);
    setInput('');

    console.log(`🔄 已刷新 session: ${newSessionId}`);
  };

  // 內部百分比狀態（可被 props 初始化）
  const [heightPct, setHeightPct] = useState(85);  // 預設上面 85%，下面輸入框 15%
  useEffect(() => { setHeightPct(clamp(topHeight || 85, 80, 90)); }, [topHeight]);

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

  // 載入可用的規則列表
  const loadAvailableRules = async () => {
    try {
      const response = await fetch('http://localhost:8021/api/rules/');
      if (response.ok) {
        const rules = await response.json();
        const ruleNames = rules.map((rule: any) => rule.name);
        setAvailableRules(ruleNames);
        console.log('🔧 載入規則列表:', ruleNames);
      }
    } catch (error) {
      console.warn('⚠️ 載入規則列表失敗:', error);
    }
  };

  // 組件載入時獲取規則列表
  useEffect(() => {
    loadAvailableRules();
  }, []);

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
      const next = clamp(raw, 80, 90);        // 限制：上面 80%-90%（底部 10%-20%）
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

            // 檢查是否為 Gmail 頁面並準備 OAuth 參數
            let pageDataOptions = {};

            if (isGmailPage()) {
              const tokens = getOAuthTokens();
              console.log('🔑 OAuth tokens:', tokens);
              if (tokens && tokens.access_token) {
                pageDataOptions = {
                  accessToken: tokens.access_token,
                  refreshToken: tokens.refresh_token,
                  clientConfig: {
                    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
                    clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || ''
                  },
                  useAPI: true,
                  maxResults: 100,
                  query: 'category:primary'  // 只獲取主要區域的郵件
                };
                console.log('📧 Gmail 頁面：使用 OAuth token 調用 API');
              } else {
                console.warn('⚠️ Gmail 頁面但未找到 OAuth token，使用 DOM 解析');
                pageDataOptions = { useAPI: false };
              }
            } else {
              console.log('📄 一般頁面：使用標準解析');
            }

            const pageResult = await window.electronAPI.browserControl.getPageData(pageDataOptions);
            console.log('📄 完整的頁面結果:', pageResult);

            if (pageResult.success) {
              contextData = {
                type: 'page',
                ...pageResult.pageData
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

      const response = await fetch('http://localhost:8021/api/agent/stream', {
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
    if (!input.trim() || isLoading || isComposing) return; // 添加 isComposing 检查

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

    // 如果目前在 rules 模式，自動切換回 result 模式
    if (panelMode === 'rules') {
      setPanelMode('result');
    }

    // 隱藏自動完成
    setShowRuleAutocomplete(false);
    setRuleMatches([]);

    // 清空輸入框並開始流式響應
    const currentInput = input.trim();
    setInput('');
    setStreamResponse('');
    handleStreamResponse(currentInput, assistantMessage.id);
  };

  // 處理輸入變化，檢測 "/" 並顯示規則自動完成
  const handleInputChange = (value: string) => {
    setInput(value);

    // 檢測是否以 "/" 開頭
    if (value.startsWith('/')) {
      const query = value.slice(1).toLowerCase(); // 移除 "/" 並轉為小寫

      if (query === '') {
        // 只有 "/" 時顯示所有規則
        setRuleMatches(availableRules);
      } else {
        // 模糊匹配規則名稱
        const matches = availableRules.filter(rule =>
          rule.toLowerCase().includes(query)
        );
        setRuleMatches(matches);
      }

      setShowRuleAutocomplete(true);
      setSelectedRuleIndex(0);
    } else {
      setShowRuleAutocomplete(false);
      setRuleMatches([]);
    }
  };

  // 處理鍵盤事件（上下箭頭選擇，Tab/Enter 選中）
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showRuleAutocomplete || ruleMatches.length === 0) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setSelectedRuleIndex(prev =>
          prev <= 0 ? ruleMatches.length - 1 : prev - 1
        );
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedRuleIndex(prev =>
          prev >= ruleMatches.length - 1 ? 0 : prev + 1
        );
        break;
      case 'Tab':
      case 'Enter':
        e.preventDefault();
        selectRule(ruleMatches[selectedRuleIndex]);
        break;
      case 'Escape':
        e.preventDefault();
        setShowRuleAutocomplete(false);
        setRuleMatches([]);
        break;
    }
  };

  // 選擇規則
  const selectRule = (ruleName: string) => {
    setInput(`/${ruleName} `);
    setShowRuleAutocomplete(false);
    setRuleMatches([]);
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
        <div className="absolute top-2 left-[10px] z-10 bg-[rgba(240,244,248,0.9)] rounded-md p-0.5 border border-[rgba(226,232,240,0.3)]">
          <button
            onClick={handleRefreshSession}
            className="text-slate-600 hover:bg-slate-100 w-6 h-6 flex items-center justify-center rounded transition-colors"
            title="新建 Session"
          >
            <Edit className="w-[14px] h-[14px]" />
          </button>
        </div>

        {/* Toggle - 右上角 */}
        <div className="absolute top-2 right-[10px] flex gap-0.5 z-10 bg-[rgba(240,244,248,0.9)] rounded-md p-0.5 border border-[rgba(226,232,240,0.3)]">
          <button
            onClick={() => setPanelMode('result')}
            className={cn(
              "w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-slate-100",
              panelMode === 'result' ? "text-slate-600" : "text-slate-400"
            )}
          >
            <FileText className="w-[14px] h-[14px]" />
          </button>
          <button
            onClick={() => setPanelMode('rules')}
            className={cn(
              "w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-slate-100",
              panelMode === 'rules' ? "text-slate-600" : "text-slate-400"
            )}
          >
            <Puzzle className="w-[14px] h-[14px]" />
          </button>
          <button
            onClick={() => setPanelMode('skills')}
            className={cn(
              "w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-slate-100",
              panelMode === 'skills' ? "text-slate-600" : "text-slate-400"
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
          onRulesUpdate={loadAvailableRules}
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

      {/* Bottom Panel (Input) - 更紧凑的输入区域 */}
      <div className="flex flex-col min-h-0 p-3 relative z-[2] bg-[#f0f4f8]">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col relative"
        >
          <div className="relative">
            <textarea
              className="w-full bg-white rounded-lg border border-slate-200 hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 pt-3 pl-4 pr-12 pb-3 text-sm leading-relaxed text-gray-800 cursor-text resize-none placeholder:text-gray-400 shadow-sm min-h-[60px] max-h-[120px]"
              placeholder="輸入文字開始對話..."
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                // 處理自動完成的鍵盤事件
                handleKeyDown(e);

                if (e.key === 'Enter' && !e.shiftKey && !isComposing && !showRuleAutocomplete) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              autoFocus
              onClick={(e) => {
                e.currentTarget.focus();
              }}
              style={{
                fontSize: '14px',
                cursor: 'text'
              }}
            />
            {/* 發送按鈕 - 调整位置 */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading || isComposing}
              className={cn(
                "absolute bottom-3 right-3 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200",
                input.trim() && !isLoading && !isComposing
                  ? "text-white bg-blue-500 hover:bg-blue-600 shadow-sm"
                  : "text-slate-400 bg-slate-100",
                "disabled:text-slate-400 disabled:bg-slate-100"
              )}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>

            {/* Rule Autocomplete 下拉列表 */}
            {showRuleAutocomplete && ruleMatches.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg z-[1000] max-h-48 overflow-y-auto">
                {ruleMatches.map((rule, index) => (
                  <div
                    key={rule}
                    className={cn(
                      "px-3 py-2 text-sm cursor-pointer border-b border-slate-100 last:border-b-0",
                      index === selectedRuleIndex
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                    onClick={() => selectRule(rule)}
                  >
                    <div className="flex items-center">
                      <span className="text-blue-500 mr-2">/</span>
                      <span className="font-medium">{rule}</span>
                    </div>
                  </div>
                ))}
                <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-t border-slate-100">
                  使用 ↑↓ 選擇，Tab 或 Enter 確認，Esc 取消
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Bottom Icons - 更紧凑的工具栏 */}
        <div className="flex justify-between items-center pt-2 flex-shrink-0">
          <div className="flex gap-1">
            <button className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 w-7 h-7 flex items-center justify-center rounded transition-colors">
              <Paperclip className="w-[16px] h-[16px]" />
            </button>
            <button className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 w-7 h-7 flex items-center justify-center rounded transition-colors">
              <Image className="w-[16px] h-[16px]" />
            </button>
            <button className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 w-7 h-7 flex items-center justify-center rounded transition-colors">
              <Headphones className="w-[16px] h-[16px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPanel;
