import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Chip, 
  IconButton,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { ArrowBack, Settings } from '@mui/icons-material';

interface Rule {
  id: string;
  name: string;
  description: string;
  prompt?: string;
  model: string;
  tools: string[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface RuleDetail extends Rule {
  agents: string[];
  prompt: string;
}

interface RulesPanelProps {
  // 可以添加其他 props
}

const RulesPanel: React.FC<RulesPanelProps> = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [selectedRule, setSelectedRule] = useState<RuleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 載入規則列表
  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/rules/');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入規則失敗');
    } finally {
      setLoading(false);
    }
  };

  // 載入規則詳情
  const loadRuleDetail = async (ruleId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/rules/${ruleId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSelectedRule(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入規則詳情失敗');
    } finally {
      setLoading(false);
    }
  };

  // 組件載入時獲取規則列表
  useEffect(() => {
    loadRules();
  }, []);

  // 返回規則列表
  const handleBack = () => {
    setSelectedRule(null);
    setError(null);
  };

  // 點擊規則卡片
  const handleRuleClick = (rule: Rule) => {
    loadRuleDetail(rule.id);
  };

  // 如果正在載入
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  // 如果有錯誤
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Box>
    );
  }

  // 如果選中了規則，顯示詳情
  if (selectedRule) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
        {/* 返回按鈕 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ fontSize: '16px' }}>
            {selectedRule.name}
          </Typography>
        </Box>

        {/* 規則詳情 */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontSize: '12px', color: '#666', mb: 1 }}>
                描述
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '12px', mb: 2 }}>
                {selectedRule.description}
              </Typography>

              <Typography variant="subtitle2" sx={{ fontSize: '12px', color: '#666', mb: 1 }}>
                模型
              </Typography>
              <Chip 
                label={selectedRule.model} 
                size="small" 
                sx={{ fontSize: '10px', mb: 2 }}
              />

              {selectedRule.tools.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ fontSize: '12px', color: '#666', mb: 1 }}>
                    工具
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {selectedRule.tools.map((tool, index) => (
                      <Chip 
                        key={index}
                        label={tool} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontSize: '10px' }}
                      />
                    ))}
                  </Box>
                </>
              )}

              <Typography variant="subtitle2" sx={{ fontSize: '12px', color: '#666', mb: 1 }}>
                系統提示詞
              </Typography>
              <Box sx={{ 
                bgcolor: '#f8fafc', 
                borderRadius: 1, 
                p: 2,
                border: '1px solid #e2e8f0',
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {selectedRule.prompt || '無系統提示詞'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    );
  }

  // 顯示規則列表
  return (
    <Box sx={{
      height: '100%',
      p: 1,  // 減少 padding
      overflow: 'auto',  // 直接在這層滑動
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',  // 固定兩列
      gap: 1,  // 減少間距
      alignContent: 'start'  // 內容從頂部開始
    }}>
        {rules.map((rule) => (
          <Card
            key={rule.id}
            sx={{
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: 1
              },
              height: '140px',  // 增加高度
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={() => handleRuleClick(rule)}
          >
            <CardContent sx={{
              p: 1.5,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              '&:last-child': { pb: 1.5 }  // 確保最後一個元素的 padding
            }}>
              {/* 標題 */}
              <Box sx={{ mb: 0.5 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontSize: '12px',
                    fontWeight: 600,
                    lineHeight: 1.1
                  }}
                >
                  {rule.name}
                </Typography>
              </Box>

              {/* 描述 - 顯示 prompt 內容 */}
              <Typography
                variant="body2"
                sx={{
                  fontSize: '9px',  // 更小字體
                  color: '#666',
                  mb: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.3,
                  flex: 1  // 佔據剩餘空間
                }}
              >
                {rule.prompt || rule.description}
              </Typography>

              {/* 底部信息 - model chip 在左下角 */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end' }}>
                <Chip
                  label={rule.model}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '7px',  // 更小字體
                    height: '14px',   // 更小高度
                    '& .MuiChip-label': {
                      px: 0.5
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        ))}

        {rules.length === 0 && (
          <Box sx={{
            gridColumn: '1 / -1',  // 跨越所有列
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            color: '#6b7280'
          }}>
            <Typography sx={{ fontSize: '11px' }}>
              沒有找到規則
            </Typography>
          </Box>
        )}
    </Box>
  );
};

export default RulesPanel;
