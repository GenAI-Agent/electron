import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Grid,
  Card,
  CardContent,
  Pagination,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Download,
  Refresh,
  TableChart,
  Code,
  DataObject
} from '@mui/icons-material';

interface DataFileViewerProps {
  fileContent: {
    type: 'csv' | 'json' | 'excel';
    content?: string;
    data?: {
      headers?: string[];
      rows?: any[];
    };
    totalRows?: number;
    filePath?: string;
    size?: number;
    extension?: string;
  };
  fileName: string;
  onOpenWithSystem?: () => void;
}

const DataFileViewer: React.FC<DataFileViewerProps> = ({
  fileContent,
  fileName,
  onOpenWithSystem
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(20);
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');

  // 處理 JSON 文件
  const jsonData = useMemo(() => {
    if (fileContent.type === 'json' && fileContent.content) {
      try {
        return JSON.parse(fileContent.content);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [fileContent]);

  // 處理分頁
  const paginatedData = useMemo(() => {
    if (fileContent.type === 'csv' && fileContent.data?.rows) {
      const startIndex = (currentPage - 1) * rowsPerPage;
      return fileContent.data.rows.slice(startIndex, startIndex + rowsPerPage);
    }
    return [];
  }, [fileContent, currentPage, rowsPerPage]);

  const totalPages = useMemo(() => {
    if (fileContent.type === 'csv' && fileContent.data?.rows) {
      return Math.ceil(fileContent.data.rows.length / rowsPerPage);
    }
    return 0;
  }, [fileContent, rowsPerPage]);

  // 渲染 CSV 表格
  const renderCSVTable = () => {
    if (!fileContent.data?.headers || !fileContent.data?.rows) {
      return (
        <Alert severity="error">
          無法解析 CSV 文件數據
        </Alert>
      );
    }

    return (
      <Box>
        {/* 統計信息 */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
          <Chip
            label={`${fileContent.totalRows || fileContent.data.rows.length} 行`}
            size="small"
            color="primary"
          />
        </Box>

        {/* 表格 */}
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {fileContent.data.headers.map((header, index) => (
                  <TableCell key={index} sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((row, rowIndex) => (
                <TableRow key={rowIndex} hover>
                  {fileContent.data!.headers!.map((header, cellIndex) => (
                    <TableCell key={cellIndex}>
                      {String(row[header] || '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 分頁 */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, page) => setCurrentPage(page)}
              color="primary"
            />
          </Box>
        )}
      </Box>
    );
  };

  // 渲染 JSON 數據
  const renderJSONData = () => {
    if (!jsonData) {
      return (
        <Alert severity="error">
          無法解析 JSON 文件
        </Alert>
      );
    }

    return (
      <Box>
        {/* 視圖模式切換 */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={viewMode === 'table' ? 'contained' : 'outlined'}
              size="small"
              startIcon={<TableChart />}
              onClick={() => setViewMode('table')}
              disabled={!Array.isArray(jsonData)}
            >
              表格視圖
            </Button>
            <Button
              variant={viewMode === 'json' ? 'contained' : 'outlined'}
              size="small"
              startIcon={<Code />}
              onClick={() => setViewMode('json')}
            >
              JSON 視圖
            </Button>
          </Box>
          <Chip
            label={Array.isArray(jsonData) ? `${jsonData.length} 項目` : '對象'}
            size="small"
            color="primary"
          />
        </Box>

        {/* JSON 表格視圖 */}
        {viewMode === 'table' && Array.isArray(jsonData) && (
          <Box>
            {jsonData.length > 0 && typeof jsonData[0] === 'object' && (
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {Object.keys(jsonData[0]).map((key, index) => (
                        <TableCell key={index} sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>
                          {key}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {jsonData.slice(0, 100).map((item, rowIndex) => (
                      <TableRow key={rowIndex} hover>
                        {Object.keys(jsonData[0]).map((key, cellIndex) => (
                          <TableCell key={cellIndex}>
                            {typeof item[key] === 'object' 
                              ? JSON.stringify(item[key]) 
                              : String(item[key] || '')
                            }
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* JSON 原始視圖 */}
        {viewMode === 'json' && (
          <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
            <pre style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'Monaco, Consolas, "Courier New", monospace',
              fontSize: '12px',
              lineHeight: '1.4',
              margin: 0
            }}>
              {JSON.stringify(jsonData, null, 2)}
            </pre>
          </Paper>
        )}
      </Box>
    );
  };

  // 渲染 Excel 文件信息
  const renderExcelInfo = () => {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <DataObject sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Excel 試算表
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          文件大小: {fileContent.size ? (fileContent.size / 1024 / 1024).toFixed(2) + ' MB' : '未知'}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          格式: {fileContent.extension?.toUpperCase()}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          此文件需要用 Microsoft Excel 或相容程式開啟以查看完整內容
        </Typography>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={onOpenWithSystem}
        >
          用 Excel 打開
        </Button>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      {/* 文件信息標題 */}
      <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="h6">
            {fileName}
          </Typography>
          <Chip
            label={fileContent.type.toUpperCase()}
            size="small"
            color="primary"
          />
          {fileContent.size && (
            <Typography variant="body2" color="text.secondary">
              {(fileContent.size / 1024).toFixed(1)} KB
            </Typography>
          )}
        </Box>
        {fileContent.type === 'csv' && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download />}
            onClick={onOpenWithSystem}
          >
            用 Excel 打開
          </Button>
        )}
      </Box>

      {/* 內容渲染 */}
      {fileContent.type === 'csv' && renderCSVTable()}
      {fileContent.type === 'json' && renderJSONData()}
      {fileContent.type === 'excel' && renderExcelInfo()}
    </Box>
  );
};

export default DataFileViewer;
