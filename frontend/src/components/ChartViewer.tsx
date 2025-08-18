import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, IconButton, Grid, Chip } from '@mui/material';
import { Refresh, Download, ZoomIn, ZoomOut, Fullscreen } from '@mui/icons-material';

interface ChartInfo {
  filename: string;
  filepath: string;
  size: number;
  created: number;
  chart_type?: string;
  title?: string;
}

interface ChartViewerProps {
  sessionId?: string;
  onRefresh?: () => void;
}

const ChartViewer: React.FC<ChartViewerProps> = ({ 
  sessionId = "default", 
  onRefresh 
}) => {
  const [charts, setCharts] = useState<ChartInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChart, setSelectedChart] = useState<ChartInfo | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // 載入圖表列表
  const loadCharts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/agent/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `使用 list_session_plots_tool 列出會話 ${sessionId} 的所有圖表`,
          session_id: sessionId,
          request_type: 'local_file'
        }),
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        if (reader) {
          let result = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'content' && data.content) {
                    result = data.content;
                  }
                } catch (e) {
                  // 忽略解析錯誤
                }
              }
            }
          }
          
          // 解析結果
          try {
            const plotsData = JSON.parse(result);
            if (plotsData.success && plotsData.plots) {
              setCharts(plotsData.plots);
            }
          } catch (e) {
            console.error('解析圖表數據失敗:', e);
          }
        }
      }
    } catch (error) {
      console.error('載入圖表失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCharts();
  }, [sessionId]);

  const handleRefresh = () => {
    loadCharts();
    onRefresh?.();
  };

  const handleDownload = async (chart: ChartInfo) => {
    try {
      // 使用 Electron API 讀取文件
      if (typeof window !== 'undefined' && window.electronAPI?.readFile) {
        const result = await window.electronAPI.readFile(chart.filepath);
        if (result.type === 'binary') {
          // 創建下載鏈接
          const blob = new Blob([new Uint8Array(result.content)], { type: 'image/png' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = chart.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      console.error('下載圖表失敗:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-TW');
  };

  const getChartTypeColor = (filename: string) => {
    if (filename.includes('line_chart')) return '#2196F3';
    if (filename.includes('bar_chart')) return '#4CAF50';
    if (filename.includes('scatter_plot')) return '#FF9800';
    if (filename.includes('pie_chart')) return '#9C27B0';
    return '#757575';
  };

  const getChartTypeName = (filename: string) => {
    if (filename.includes('line_chart')) return '線圖';
    if (filename.includes('bar_chart')) return '柱狀圖';
    if (filename.includes('scatter_plot')) return '散點圖';
    if (filename.includes('pie_chart')) return '圓餅圖';
    return '圖表';
  };

  if (loading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>載入圖表中...</Typography>
      </Box>
    );
  }

  if (charts.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">
          尚未創建任何圖表
        </Typography>
        <IconButton onClick={handleRefresh} sx={{ mt: 1 }}>
          <Refresh />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* 標題和刷新按鈕 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          圖表庫 ({charts.length})
        </Typography>
        <IconButton onClick={handleRefresh} size="small">
          <Refresh />
        </IconButton>
      </Box>

      {/* 圖表網格 */}
      <Grid container spacing={2}>
        {charts.map((chart, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { 
                  boxShadow: 3,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease-in-out'
                }
              }}
              onClick={() => setSelectedChart(chart)}
            >
              <CardContent sx={{ p: 2 }}>
                {/* 圖表類型標籤 */}
                <Box sx={{ mb: 1 }}>
                  <Chip
                    label={getChartTypeName(chart.filename)}
                    size="small"
                    sx={{
                      bgcolor: getChartTypeColor(chart.filename),
                      color: 'white',
                      fontSize: '0.75rem'
                    }}
                  />
                </Box>

                {/* 文件名 */}
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 'bold',
                    mb: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={chart.filename}
                >
                  {chart.filename}
                </Typography>

                {/* 文件信息 */}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  大小: {formatFileSize(chart.size)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  創建: {formatDate(chart.created)}
                </Typography>

                {/* 操作按鈕 */}
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(chart);
                    }}
                    title="下載"
                  >
                    <Download sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 圖表預覽對話框 */}
      {selectedChart && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            p: 2
          }}
          onClick={() => setSelectedChart(null)}
        >
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: 2,
              p: 2,
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 預覽標題 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {selectedChart.filename}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton size="small" onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}>
                  <ZoomOut />
                </IconButton>
                <IconButton size="small" onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))}>
                  <ZoomIn />
                </IconButton>
                <IconButton size="small" onClick={() => handleDownload(selectedChart)}>
                  <Download />
                </IconButton>
              </Box>
            </Box>

            {/* 圖片顯示 */}
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={`file://${selectedChart.filepath}`}
                alt={selectedChart.filename}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  transform: `scale(${zoomLevel})`,
                  transition: 'transform 0.2s ease-in-out'
                }}
              />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ChartViewer;
