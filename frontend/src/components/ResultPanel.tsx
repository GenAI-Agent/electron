import React from 'react';
import { Box, Typography, Chip, CircularProgress } from '@mui/material';
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
    <Box
      sx={{
        width: '100%',
        height: '100%',
        padding: '12px', // 統一 padding
        paddingTop: '40px', // 為 toggle 按鈕留出空間
        paddingRight: '14px', // 增加右邊距 2px
        paddingBottom: '4px',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative', // 確保定位正確
      }}
    >
      {mode === 'result' && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 全版面消息顯示 */}
          {messages.length > 0 ? (
            <Box sx={{
              flex: 1,
              overflow: 'auto',
              p: 1
            }}>
              {messages.map((message, index) => (
                <Box key={message.id} sx={{ mb: 1 }}>
                  {message.type === 'user' ? (
                    /* 用戶消息 - 深色底淺色字 */
                    <Box
                      sx={{
                        bgcolor: '#2d3748',
                        color: '#e2e8f0',
                        p: 1.5,
                        fontSize: '12px',
                        lineHeight: 1.4,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {message.content}
                    </Box>
                  ) : (
                    /* AI 回覆 - 直接顯示在背景上 */
                    <Box
                      sx={{
                        fontSize: '12px',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: '#1e293b',
                        '& h1, & h2, & h3, & h4, & h5, & h6': {
                          fontSize: '14px',
                          fontWeight: 600,
                          mt: 1,
                          mb: 0.5,
                          color: '#1e293b'
                        },
                        '& p': {
                          mb: 1
                        },
                        '& ul, & ol': {
                          pl: 2,
                          mb: 1
                        },
                        '& li': {
                          mb: 0.25
                        },
                        '& code': {
                          bgcolor: '#f1f5f9',
                          px: 0.5,
                          py: 0.25,
                          borderRadius: 0.5,
                          fontSize: '11px',
                          fontFamily: 'monospace'
                        },
                        '& pre': {
                          bgcolor: '#1e293b',
                          color: '#e2e8f0',
                          p: 1,
                          borderRadius: 1,
                          overflow: 'auto',
                          fontSize: '11px',
                          fontFamily: 'monospace'
                        }
                      }}
                    >
                      {message.content || (message.isLoading ? '思考中...' : '')}
                      {message.isLoading && (
                        <CircularProgress size={12} sx={{ ml: 1, color: '#64748b' }} />
                      )}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              fontSize: '12px'
            }}>
              輸入訊息開始對話...
            </Box>
          )}

          {/* 當前規則信息 */}
          {currentRule && (
            <Box sx={{
              borderTop: '1px solid #e2e8f0',
              p: 1,
              bgcolor: '#f8fafc'
            }}>
              <Chip
                label={`當前規則: ${currentRule}`}
                size="small"
                sx={{
                  fontSize: '9px',
                  height: '18px',
                  bgcolor: '#dbeafe',
                  color: '#1e40af'
                }}
              />
            </Box>
          )}
        </Box>
      )}

      {mode === 'rules' && (
        <RulesPanel />
      )}

      {mode === 'skills' && (
        <Box sx={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:'14px' }}>
          技能管理功能開發中...
        </Box>
      )}


    </Box>
  );
};

export default ResultPanel;
