/**
 * PageDataExtractorTest - 頁面資料提取器測試組件
 * 用於測試和驗證頁面資料提取功能
 */

import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, Chip } from '@mui/material';
import { ExpandMore, Refresh, Download, Visibility } from '@mui/icons-material';
import { PageData } from '@/types/page-data';
import { extractCurrentPageData, extractPageSummary, refreshInteractiveElements } from '@/utils/PageDataExtractor';

const PageDataExtractorTest: React.FC = () => {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastExtracted, setLastExtracted] = useState<Date | null>(null);

  // 自動提取頁面資料（組件載入時）
  useEffect(() => {
    handleExtractPageData();
  }, []);

  const handleExtractPageData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 開始提取頁面資料...');
      const data = await extractCurrentPageData();
      setPageData(data);
      setLastExtracted(new Date());
      console.log('✅ 頁面資料提取完成:', data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      setError(errorMessage);
      console.error('❌ 頁面資料提取失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshElements = async () => {
    if (!pageData) return;
    
    setLoading(true);
    try {
      console.log('🔄 重新檢測互動元素...');
      const elements = await refreshInteractiveElements();
      setPageData({
        ...pageData,
        interactiveElements: elements
      });
      console.log('✅ 互動元素更新完成');
    } catch (err) {
      console.error('❌ 互動元素更新失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadData = () => {
    if (!pageData) return;
    
    const dataStr = JSON.stringify(pageData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `page-data-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        🔍 頁面資料提取器測試
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        測試和驗證頁面內容提取、互動元素檢測等功能
      </Typography>

      {/* 控制按鈕 */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={handleExtractPageData}
          disabled={loading}
        >
          {loading ? '提取中...' : '提取頁面資料'}
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<Visibility />}
          onClick={handleRefreshElements}
          disabled={loading || !pageData}
        >
          重新檢測元素
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={handleDownloadData}
          disabled={!pageData}
        >
          下載資料
        </Button>
      </Box>

      {/* 錯誤顯示 */}
      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography variant="h6">❌ 錯誤</Typography>
          <Typography>{error}</Typography>
        </Paper>
      )}

      {/* 基本資訊 */}
      {pageData && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>📊 基本資訊</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">頁面標題</Typography>
              <Typography variant="body1">{pageData.title}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">當前 URL</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {pageData.url}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">內容長度</Typography>
              <Typography variant="body1">
                {pageData.content.length.toLocaleString()} 字符
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">互動元素</Typography>
              <Typography variant="body1">
                {pageData.interactiveElements.length} 個
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">載入狀態</Typography>
              <Chip 
                label={pageData.metadata.loadState} 
                color={pageData.metadata.loadState === 'complete' ? 'success' : 'warning'}
                size="small"
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">提取時間</Typography>
              <Typography variant="body2">
                {lastExtracted?.toLocaleTimeString()}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* 詳細資料 */}
      {pageData && (
        <Box>
          {/* 頁面內容 */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">📄 頁面內容 (Markdown)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 400, overflow: 'auto' }}>
                <Typography 
                  component="pre" 
                  variant="body2" 
                  sx={{ 
                    whiteSpace: 'pre-wrap', 
                    fontFamily: 'monospace',
                    fontSize: '0.8rem'
                  }}
                >
                  {pageData.content}
                </Typography>
              </Paper>
            </AccordionDetails>
          </Accordion>

          {/* 互動元素 */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                🎯 互動元素 ({pageData.interactiveElements.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {pageData.interactiveElements.map((element, index) => (
                  <Paper key={element.id} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip label={element.type} size="small" color="primary" />
                      <Chip 
                        label={`重要性: ${(element.importance * 100).toFixed(0)}%`} 
                        size="small" 
                        color={element.importance > 0.7 ? 'success' : element.importance > 0.4 ? 'warning' : 'default'}
                      />
                      {element.isVisible && <Chip label="可見" size="small" color="success" />}
                      {element.isClickable && <Chip label="可點擊" size="small" color="info" />}
                    </Box>
                    
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>文字:</strong> {element.text || '(無文字)'}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>選擇器:</strong> 
                      <code style={{ backgroundColor: '#f5f5f5', padding: '2px 4px', marginLeft: '4px' }}>
                        {element.selector}
                      </code>
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>位置:</strong> 
                      ({element.position.x}, {element.position.y}) 
                      {element.position.width}×{element.position.height}
                    </Typography>
                    
                    {element.fallbackSelectors.length > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>備用選擇器:</strong> {element.fallbackSelectors.length} 個
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* 元數據 */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">📋 元數據</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography component="pre" variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {JSON.stringify(pageData.metadata, null, 2)}
                </Typography>
              </Paper>
            </AccordionDetails>
          </Accordion>

          {/* 提取錯誤 */}
          {pageData.extractionErrors && pageData.extractionErrors.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" color="error">
                  ⚠️ 提取錯誤 ({pageData.extractionErrors.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  {pageData.extractionErrors.map((error, index) => (
                    <Paper key={index} sx={{ p: 2, mb: 1, bgcolor: 'error.light' }}>
                      <Typography color="error.contrastText">{error}</Typography>
                    </Paper>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      )}
    </Box>
  );
};

export default PageDataExtractorTest;
