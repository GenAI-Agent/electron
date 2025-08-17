import React, { useEffect, useRef, useState } from 'react';
import { Box, TextField, IconButton, CircularProgress } from '@mui/material';
import { AttachFile, Image, Headset, Article, Extension, Psychology, Send } from '@mui/icons-material';
import ResultPanel from './ResultPanel';

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
  const [input, setInput] = useState('');
  const [panelMode, setPanelMode] = useState<PanelMode>('result');
  const [isLoading, setIsLoading] = useState(false);
  const [streamResponse, setStreamResponse] = useState('');
  const [currentRule, setCurrentRule] = useState<string | null>(null);
  const [usedTools, setUsedTools] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // 內部百分比狀態（可被 props 初始化）
  const [heightPct, setHeightPct] = useState(75);  // 預設上面 75%，下面輸入框 25%
  useEffect(() => { setHeightPct(clamp(topHeight || 75, 70, 85)); }, [topHeight]);

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
      // 獲取當前頁面資料 - 使用 Electron API
      let pageData = null;
      try {
        if (typeof window !== 'undefined' && window.electronAPI?.browserControl?.getPageData) {
          const pageResult = await window.electronAPI.browserControl.getPageData();
          if (pageResult.success) {
            pageData = pageResult.pageData;
            console.log('📄 獲取到真實頁面資料:', pageData);
          } else {
            console.warn('⚠️ 獲取頁面資料失敗:', pageResult.error);
          }
        } else {
          console.warn('⚠️ Electron API 不可用');
        }
      } catch (error) {
        console.warn('⚠️ 獲取頁面資料失敗:', error);
      }

      const response = await fetch('http://localhost:8000/api/agent/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          user_id: 'default_user',
          page_data: pageData
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
    <Box
      ref={containerRef}
      data-agent-panel
      sx={{
        width: '100%',
        height: '100%',
        bgcolor: '#f0f4f8',
        display: 'grid',
        gridTemplateRows: `${heightPct}% 8px 1fr`,   // 上/分隔條/下
        position: 'relative',
      }}
    >
      {/* Top Panel */}
      <Box
        sx={{
          position: 'relative',
          // 移除白色背景，讓內容直接顯示在背景上
          m: '4px',
          mb: 0,
          minHeight: 120,
          overflow: 'hidden',
          zIndex: 1, // 確保面板有正確的層級
        }}
      >
        {/* Toggle */}
        <Box sx={{
          position: 'absolute',
          top: 8,
          right: 10, // 增加 2px 距離，從 8px 改為 10px
          display: 'flex',
          gap: '4px',
          zIndex: 10, // 增加 z-index 確保不被遮蓋
          bgcolor: 'rgba(240, 244, 248, 0.95)', // 改為背景色的半透明版本
          borderRadius: '6px',
          padding: '4px',
          border: '1px solid rgba(226, 232, 240, 0.5)' // 添加淡邊框
        }}>
          <IconButton
            size="small"
            onClick={() => setPanelMode('result')}
            sx={{
              color: panelMode === 'result' ? '#64748b' : '#cbd5e1',
              '&:hover': { bgcolor: '#f1f5f9' },
              width: 24,
              height: 24
            }}
          >
            <Article sx={{ fontSize: 14 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setPanelMode('rules')}
            sx={{
              color: panelMode === 'rules' ? '#64748b' : '#cbd5e1',
              '&:hover': { bgcolor: '#f1f5f9' },
              width: 24,
              height: 24
            }}
          >
            <Extension sx={{ fontSize: 14 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setPanelMode('skills')}
            sx={{
              color: panelMode === 'skills' ? '#64748b' : '#cbd5e1',
              '&:hover': { bgcolor: '#f1f5f9' },
              width: 24,
              height: 24
            }}
          >
            <Psychology sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>

        <ResultPanel
          mode={panelMode}
          streamResponse={streamResponse}
          currentRule={currentRule}
          usedTools={usedTools}
          isLoading={isLoading}
          messages={messages}
        />
      </Box>

      {/* Resizer */}
      <Box
        role="separator"
        aria-orientation="horizontal"
        className="drag-handle drag-handle-vertical"
        sx={{
          height: '8px',
          width: '100%',
          cursor: 'row-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1000,
          WebkitAppRegion: 'no-drag',
          userSelect: 'none',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 8, right: 8,
            top: '50%',
            height: '1px',
            bgcolor: '#e2e8f0',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          },
          '&:hover': { backgroundColor: '#f8fafc' },
        }}
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
      />

      {/* Bottom Panel (Input) */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        p: '8px',
        pr: '10px', // 增加右邊距 2px，從 8px 改為 10px
        position: 'relative',
        zIndex: 2, // 確保輸入框區域在上層
        bgcolor: '#f0f4f8' // 確保有背景色
      }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative' }}
        >
          <TextField
            fullWidth
            multiline
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
              // 確保點擊任何地方都能聚焦到輸入框
              const textarea = e.currentTarget.querySelector('textarea');
              if (textarea) {
                textarea.focus();
              }
            }}
            sx={{
              flex: 1,
              cursor: 'text',
              maxWidth: '50vw', // 限制最大寬度為頁面寬度的一半
              '& .MuiOutlinedInput-root': {
                bgcolor: '#f0f4f8', // 改為與背景色一致
                borderRadius: '8px',
                height: '100%',
                alignItems: 'flex-start',
                cursor: 'text',
                '& fieldset': { borderColor: '#e2e8f0' },
                '&:hover fieldset': { borderColor: '#cbd5e1' },
                '&.Mui-focused fieldset': { borderColor: '#94a3b8' },
              },
              // 多行 textarea 本體
              '& .MuiOutlinedInput-inputMultiline': {
                paddingTop: '8px',
                paddingLeft: '12px',
                paddingRight: '40px',
                paddingBottom: '8px',
                margin: 0,
                fontSize: '10px !important',  // 更小的字體
                lineHeight: 1.3,
                color: '#1a202c',
                cursor: 'text !important',
                '&::placeholder': { color: '#a0aec0', opacity: 1 },
              },
              '& textarea': {
                cursor: 'text !important',
                resize: 'none',
                fontSize: '12px !important'  // 確保 textarea 也是小字體
              },
              // 額外確保所有輸入相關元素都是小字體
              '& input, & textarea, & .MuiInputBase-input': {
                fontSize: '12px !important'
              }
            }}
            slotProps={{
              input: {
                style: { cursor: 'text' }
              }
            }}
          />

          {/* 發送按鈕 */}
          <IconButton
            type="submit"
            disabled={!input.trim() || isLoading}
            sx={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              width: '28px',
              height: '28px',
              color: input.trim() && !isLoading ? '#3b82f6' : '#94a3b8',
              '&:hover': {
                bgcolor: input.trim() && !isLoading ? '#f1f5f9' : 'transparent'
              },
              '&:disabled': {
                color: '#94a3b8'
              }
            }}
          >
            {isLoading ? (
              <CircularProgress size={16} />
            ) : (
              <Send sx={{ fontSize: 16 }} />
            )}
          </IconButton>
        </Box>

        {/* Bottom Icons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: '4px', flexShrink: 0 }}>
          <Box sx={{ display: 'flex', gap: '4px' }}>
            <IconButton size="small" sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' }, width: 20, height: 20 }}>
              <AttachFile sx={{ fontSize: 14 }} />
            </IconButton>
            <IconButton size="small" sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' }, width: 20, height: 20 }}>
              <Image sx={{ fontSize: 14 }} />
            </IconButton>
            <IconButton size="small" sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' }, width: 20, height: 20 }}>
              <Headset sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
          <Box />
        </Box>
      </Box>
    </Box>
  );
};

export default AgentPanel;
