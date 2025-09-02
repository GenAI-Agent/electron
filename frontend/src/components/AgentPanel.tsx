import React, { useEffect, useRef, useState } from 'react';
import { Paperclip, Image, Headphones, FileText, Puzzle, Brain, Send, Edit, Target, Swords } from 'lucide-react';
import { useRouter } from 'next/router';
import ResultPanel from './ResultPanel';
import { sessionManager, FileContext } from '@/utils/sessionManager';
import { cn } from '@/utils/cn';
import { getOAuthTokens, isGmailPage } from '@/utils/PageDataExtractor';

type PanelMode = 'result' | 'rules' | 'skills' | 'simulation';

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
  sandboxContext?: {
    selectedDatasets: Array<{
      id: string;
      source: string;
      filename: string;
      date: string;
      time: string;
      data: any[];
    }>;
    filePaths: string[];
  };
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const AgentPanel: React.FC<AgentPanelProps> = ({
  topHeight = 30,
  onTopHeightChange,
  onDragStateChange,
  sandboxContext,
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
  const [ruleMatches, setRuleMatches] = useState<{ name: string; category?: string }[]>([]);
  const [availableRules, setAvailableRules] = useState<{ name: string; category?: string }[]>([]);
  const [selectedRuleIndex, setSelectedRuleIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
  const [heightPct, setHeightPct] = useState(65);  // 預設上面 65%，下面輸入框 35%
  useEffect(() => { setHeightPct(clamp(topHeight || 65, 45, 70)); }, [topHeight]);

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
        // 將規則按分類整理（如果沒有分類，則使用規則名稱推斷）
        const rulesWithCategories = rules.map((rule: any) => {
          // 根據規則名稱推斷分類
          let category = '一般';
          const ruleName = rule.name.toLowerCase();

          if (ruleName.includes('gmail') || ruleName.includes('mail') || ruleName.includes('email')) {
            category = '郵件';
          } else if (ruleName.includes('browser') || ruleName.includes('web') || ruleName.includes('page')) {
            category = '瀏覽器';
          } else if (ruleName.includes('file') || ruleName.includes('document') || ruleName.includes('local')) {
            category = '文件';
          } else if (ruleName.includes('data') || ruleName.includes('analysis') || ruleName.includes('chart')) {
            category = '數據分析';
          } else if (ruleName.includes('api') || ruleName.includes('integration')) {
            category = '整合';
          }

          return {
            name: rule.name,
            category: rule.category || category
          };
        });

        setAvailableRules(rulesWithCategories);
        console.log('🔧 載入規則列表:', rulesWithCategories);
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
      const next = clamp(raw, 45, 70);        // 限制：上面 45%-70%（底部 30%-55%）
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

      console.log('🔍 完整的 currentContext:', currentContext);
      console.log('🔍 當前頁面路徑:', window.location.pathname);

      // 在 sandbox 頁面強制走 local file 模式
      const isSandboxPage = window.location.pathname.includes('/sandbox');

      // 🎯 只在 sandbox 頁面且有 sandboxContext 時使用
      if (isSandboxPage && sandboxContext && sandboxContext.selectedDatasets.length > 0) {
        console.log('✅ Sandbox 頁面：使用 sandboxContext 直接傳遞的資料集');
        console.log('📁 選中的資料集:', sandboxContext.selectedDatasets);
        console.log('📁 檔案路徑:', sandboxContext.filePaths);

        contextData = {
          type: 'local_file',
          file_paths: sandboxContext.filePaths,
          files: sandboxContext.selectedDatasets.map(dataset => ({
            source: dataset.source,
            filename: dataset.filename,
            date: dataset.date,
            time: dataset.time,
            file_path: `../data/sandbox/${dataset.filename.endsWith('.csv') ? dataset.filename : dataset.filename + '.csv'}`
          })),
          total_files: sandboxContext.selectedDatasets.length
        };

        console.log('📤 構建的 contextData:', contextData);
      } else if (isSandboxPage && (!sandboxContext || sandboxContext.selectedDatasets.length === 0)) {
        // Sandbox 頁面但沒有選擇資料集
        console.log('⚠️ Sandbox 頁面但沒有選擇資料集');
        contextData = {
          type: 'local_file',
          message: '請先選擇要分析的資料集'
        };
      } else if (currentContext.mode === 'local' && currentContext.current_file) {
        // Local file 模式：使用文件上下文
        console.log('✅ 進入 Local file 模式');

        // 檢查是否為多檔案情況
        console.log('🔍 檢查檔案上下文:', {
          current_file: currentContext.current_file,
          has_file_summary: !!currentContext.file_summary,
          has_data_schema: !!currentContext.file_summary?.data_schema,
          has_sample_data: !!currentContext.file_summary?.data_schema?.sample_data,
          sample_data_length: currentContext.file_summary?.data_schema?.sample_data?.length,
          first_sample: currentContext.file_summary?.data_schema?.sample_data?.[0]
        });

        // 檢查是否為多檔案情況（currentFile 為 'multi_file_context' 或 sample_data 有 source 欄位）
        if (currentContext.current_file === 'multi_file_context' ||
          (currentContext.file_summary?.data_schema?.sample_data &&
            Array.isArray(currentContext.file_summary.data_schema.sample_data) &&
            currentContext.file_summary.data_schema.sample_data[0]?.source)) {
          // 多檔案情況：傳送檔案路徑列表給後端的新多檔案工具
          const datasets = currentContext.file_summary?.data_schema?.sample_data || [];
          const filePaths = datasets.map(dataset => `../data/sandbox/${dataset.filename}`);

          contextData = {
            type: 'local_file',  // 使用 local_file 類型，讓後端使用新的多檔案工具
            file_paths: filePaths,  // 檔案路徑列表，供多檔案工具使用
            files: datasets.map(dataset => ({
              source: dataset.source,
              filename: dataset.filename,
              date: dataset.date,
              time: dataset.time,
              file_path: `../data/sandbox/${dataset.filename.endsWith('.csv') ? dataset.filename : dataset.filename + '.csv'}`
            })),
            total_files: datasets.length
          };
          console.log('📁 使用多檔案上下文:', {
            type: contextData.type,
            total_files: contextData.total_files,
            files: contextData.files.map(f => ({
              source: f.source,
              filename: f.filename
            }))
          });
        } else if (currentContext.current_file) {
          // 單一檔案情況
          contextData = {
            type: 'file',
            file_path: currentContext.current_file,
            file_summary: currentContext.file_summary
          };
          console.log('📁 使用單一檔案上下文:', contextData);
        } else {
          // sandbox 頁面但沒有選擇檔案的情況
          console.log('⚠️ sandbox 頁面但沒有選擇檔案');
          contextData = {
            type: 'local_file',
            message: '請先選擇要分析的資料集'
          };
        }
      } else {
        console.log('❌ 不符合 Local file 模式條件:', {
          mode: currentContext.mode,
          current_file: currentContext.current_file
        });
        // Browser 模式：獲取頁面資料
        try {
          if (typeof window !== 'undefined' && window.electronAPI?.browserControl?.getPageData) {

            // 檢查是否為 Gmail 頁面並準備 OAuth 參數
            let pageDataOptions = {};

            if (isGmailPage()) {
              // 直接從 localStorage 拿 OAuth tokens
              const storedTokens = localStorage.getItem("google_oauth_tokens");

              let tokens = null;
              if (storedTokens) {
                try {
                  tokens = JSON.parse(storedTokens);
                } catch (e) {
                  console.error('🔑 解析 tokens 失敗:', e);
                }
              }

              if (tokens && tokens.access_token) {
                console.log('📧 Gmail 頁面：使用 Gmail 專用流程（批量抓取模式）');

                // 提取 email address
                let emailAddress = '';
                try {
                  const emailResult = await window.electronAPI.browserControl.executeScript(`
                    (function() {
                      const title = document.title;
                      const titleMatch = title.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})/);
                      if (titleMatch) {
                        return titleMatch[1];
                      }
                      return '';
                    })();
                  `);

                  if (emailResult && emailResult.result) {
                    emailAddress = emailResult.result;
                    console.log('✅ 從頁面標題提取到 email:', emailAddress);
                  }
                } catch (e) {
                  console.warn('⚠️ 無法提取 email:', e);
                }

                // Gmail 模式：直接設置 contextData，不調用 getPageData
                contextData = {
                  type: 'gmail',
                  query: message,
                  email_address: emailAddress,
                  oauth_tokens: {
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
                    client_secret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || ''
                  }
                };

                console.log('📧 Gmail 模式 contextData:', {
                  type: contextData.type,
                  email_address: contextData.email_address,
                  has_access_token: !!contextData.oauth_tokens.access_token
                });

              } else {
                console.warn('⚠️ Gmail 頁面但未找到 OAuth token，需要先進行認證');

                // 提示用戶進行 OAuth 認證
                const shouldAuth = confirm('檢測到 Gmail 頁面，但需要先進行 Google OAuth 認證才能使用 Gmail API 功能。\n\n是否現在進行認證？');

                if (shouldAuth) {
                  // 導航到 OAuth 認證頁面
                  window.location.href = '/gmail-auth';
                  return;
                }

                // 用戶選擇不認證，回退到普通頁面模式
                pageDataOptions = { useAPI: false };
              }
            } else {
              console.log('📄 一般頁面：使用標準解析');
            }

            // 只有在非 Gmail 模式或 Gmail 模式失敗時才調用 getPageData
            if (!contextData) {
              const pageResult = await window.electronAPI.browserControl.getPageData(pageDataOptions);

              if (pageResult.success) {
                contextData = {
                  type: 'page',
                  ...pageResult.pageData
                };
                console.log('📄 獲取到頁面資料 (已隱藏詳細內容)');
              } else {
                console.warn('⚠️ 獲取頁面資料失敗:', pageResult.error);
              }
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
        // 只有 "/" 時顯示所有規則（根據選擇的分類過濾）
        const filtered = selectedCategory
          ? availableRules.filter(rule => rule.category === selectedCategory)
          : availableRules;
        setRuleMatches(filtered);
      } else {
        // 模糊匹配規則名稱（同時考慮分類過濾）
        let matches = availableRules.filter(rule =>
          rule.name.toLowerCase().includes(query)
        );

        // 如果有選擇分類，進一步過濾
        if (selectedCategory) {
          matches = matches.filter(rule => rule.category === selectedCategory);
        }

        setRuleMatches(matches);
      }

      setShowRuleAutocomplete(true);
      setSelectedRuleIndex(0);
    } else {
      setShowRuleAutocomplete(false);
      setRuleMatches([]);
      setSelectedCategory(null);
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
        if (ruleMatches[selectedRuleIndex]) {
          selectRule(ruleMatches[selectedRuleIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowRuleAutocomplete(false);
        setRuleMatches([]);
        break;
    }
  };

  // 選擇規則
  const selectRule = (rule: { name: string; category?: string }) => {
    setInput(`/${rule.name} `);
    setShowRuleAutocomplete(false);
    setRuleMatches([]);
    setSelectedCategory(null);
  };

  return (
    <div
      ref={containerRef}
      data-agent-panel
      className="w-full h-full bg-card grid relative shadow-lg border-l border-border"
      style={{ gridTemplateRows: `${heightPct}% 8px 1fr` }}
    >
      {/* Top Panel */}
      <div className="relative min-h-[120px] overflow-hidden z-[1] bg-card/95">
        <div className="flex justify-between items-center p-4">
          <button
            onClick={handleRefreshSession}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-all duration-200 text-muted-foreground hover:bg-accent hover:text-foreground"
            title="新建 Session"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          {/* Toggle - 右上角 */}
          <div className="flex gap-1 z-10">
            <button
              onClick={() => setPanelMode('result')}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-md transition-all duration-200",
                panelMode === 'result'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPanelMode('rules')}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-md transition-all duration-200",
                panelMode === 'rules'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Puzzle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPanelMode('skills')}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-md transition-all duration-200",
                panelMode === 'skills'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Brain className="w-3.5 h-3.5" />
            </button>
          </div>
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
        className="drag-handle drag-handle-vertical h-2 w-full cursor-row-resize flex items-center justify-center relative z-[1000] select-none hover:bg-accent transition-colors before:content-[''] before:absolute before:left-4 before:right-4 before:top-1/2 before:h-[2px] before:bg-border before:-translate-y-1/2 before:pointer-events-none"
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

      {/* Bottom Panel (Input) - 動態高度但底部固定的输入区域 */}
      <div className="flex flex-col min-h-[100px] p-4 pb-8 relative z-[2] bg-card border-t border-border overflow-visible">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col relative flex-1"
        >
          <div className="relative flex-1 flex flex-col min-h-0">
            {/* 外层输入框容器 - 包含文字区域和图标，看起来像一个完整的输入框 */}
            <div className="flex-1 relative border border-border bg-background flex flex-col min-h-[100px]">
              {/* 文字输入区域容器 - 限制文字显示区域，为底部图标预留空间 */}
              <div className="flex-1 relative overflow-hidden mb-12 min-h-0">
                <textarea
                  className="w-full h-full bg-transparent focus:outline-none pt-3 pl-4 pr-4 pb-3 text-base leading-relaxed text-foreground cursor-text resize-none placeholder:text-muted-foreground"
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
                    cursor: 'text',
                    minHeight: '60px'
                  }}
                />
              </div>
            </div>
            {/* 發送按鈕 - 调整位置 */}
            {/* Bottom action buttons row */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              {/* Left side icons */}
              <div className="flex gap-1">
                <button className="text-muted-foreground hover:text-foreground hover:bg-accent w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button className="text-muted-foreground hover:text-foreground hover:bg-accent w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200">
                  <Image className="w-4 h-4" />
                </button>
                <button className="text-muted-foreground hover:text-foreground hover:bg-accent w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200">
                  <Headphones className="w-4 h-4" />
                </button>
              </div>

              {/* Right side send button */}
              <button
                type="submit"
                disabled={!input.trim() || isLoading || isComposing}
                className={cn(
                  "w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200",
                  input.trim() && !isLoading && !isComposing
                    ? "text-foreground hover:bg-accent"
                    : "text-muted-foreground",
                  "disabled:text-muted-foreground"
                )}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Rule Autocomplete 下拉列表 */}
            {showRuleAutocomplete && (ruleMatches.length > 0 || availableRules.length > 0) && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-lg shadow-lg z-[2000] max-h-48 overflow-y-auto">
                {/* 分類選項 */}
                <div className="sticky top-0 bg-card border-b border-border p-2">
                  <div className="flex flex-wrap gap-1">
                    <button
                      className={cn(
                        "px-2 py-1 text-xs rounded-md transition-colors",
                        selectedCategory === null
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                      onClick={() => {
                        setSelectedCategory(null);
                        handleInputChange(input);
                      }}
                    >
                      全部
                    </button>
                    {Array.from(new Set(availableRules.map(r => r.category))).map(category => (
                      <button
                        key={category}
                        className={cn(
                          "px-2 py-1 text-xs rounded-md transition-colors",
                          selectedCategory === category
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                        onClick={() => {
                          setSelectedCategory(category || null);
                          handleInputChange(input);
                        }}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 規則列表 */}
                {ruleMatches.length > 0 ? (
                  <>
                    {ruleMatches.map((rule, index) => (
                      <div
                        key={rule.name}
                        className={cn(
                          "px-3 py-2 text-sm cursor-pointer border-b border-border last:border-b-0",
                          index === selectedRuleIndex
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                        onClick={() => selectRule(rule)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            <span className="text-primary mr-2">/</span>
                            <span className="font-medium">{rule.name}</span>
                          </div>
                          {rule.category && (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded ml-2">
                              {rule.category}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50 border-t border-border">
                      使用 ↑↓ 選擇，Tab 或 Enter 確認，Esc 取消
                    </div>
                  </>
                ) : (
                  <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                    {selectedCategory ? `「${selectedCategory}」分類下沒有符合的規則` : '沒有符合的規則'}
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgentPanel;
