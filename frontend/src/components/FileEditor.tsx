import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Toolbar,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Save as SaveIcon,
  Close as CloseIcon,
  Highlight as HighlightIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

interface FileEditorProps {
  filePath: string;
  onClose: () => void;
  onSave?: (filePath: string, content: string) => void;
}

interface HighlightRange {
  start: number;
  end: number;
  color?: string;
}

const FileEditor: React.FC<FileEditorProps> = ({ filePath, onClose, onSave }) => {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [highlightRanges, setHighlightRanges] = useState<HighlightRange[]>([]);
  const [isModified, setIsModified] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // 加載文件內容
  useEffect(() => {
    loadFile();
  }, [filePath]);

  // 檢查內容是否修改
  useEffect(() => {
    setIsModified(content !== originalContent);
  }, [content, originalContent]);

  const loadFile = async () => {
    try {
      setLoading(true);
      setError(null);

      if (window.electronAPI?.readFile) {
        const result = await window.electronAPI.readFile(filePath);
        
        if (result.type === 'text' && result.content) {
          setContent(result.content);
          setOriginalContent(result.content);
        } else {
          setError('無法讀取文件內容或文件不是文本格式');
        }
      } else {
        setError('文件讀取功能不可用');
      }
    } catch (err) {
      setError(`讀取文件失敗: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const saveFile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (window.electronAPI?.writeFile) {
        const result = await window.electronAPI.writeFile(filePath, content);
        
        if (result.success) {
          setOriginalContent(content);
          setSuccess('文件保存成功');
          
          if (onSave) {
            onSave(filePath, content);
          }
        } else {
          setError(`保存失敗: ${result.error}`);
        }
      } else {
        setError('文件保存功能不可用');
      }
    } catch (err) {
      setError(`保存文件失敗: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteFile = async () => {
    try {
      setError(null);

      if (window.electronAPI?.deleteFile) {
        const result = await window.electronAPI.deleteFile(filePath);
        
        if (result.success) {
          setSuccess('文件刪除成功');
          setTimeout(() => {
            onClose();
          }, 1500);
        } else {
          setError(`刪除失敗: ${result.error}`);
        }
      } else {
        setError('文件刪除功能不可用');
      }
    } catch (err) {
      setError(`刪除文件失敗: ${err}`);
    }
    setShowDeleteDialog(false);
  };

  const highlightLines = (startLine: number, endLine: number) => {
    const newRange: HighlightRange = {
      start: startLine,
      end: endLine,
      color: '#ffeb3b'
    };
    
    setHighlightRanges(prev => [...prev, newRange]);
  };

  const clearHighlights = () => {
    setHighlightRanges([]);
  };

  const getLineNumbers = () => {
    const lines = content.split('\n');
    return lines.map((_, index) => index + 1);
  };

  const renderContentWithHighlights = () => {
    const lines = content.split('\n');
    
    return lines.map((line, index) => {
      const lineNumber = index + 1;
      const isHighlighted = highlightRanges.some(
        range => lineNumber >= range.start && lineNumber <= range.end
      );
      
      return (
        <Box
          key={index}
          sx={{
            display: 'flex',
            backgroundColor: isHighlighted ? '#fff3e0' : 'transparent',
            '&:hover': { backgroundColor: '#f5f5f5' }
          }}
        >
          <Typography
            variant="body2"
            sx={{
              minWidth: 50,
              textAlign: 'right',
              pr: 2,
              color: 'text.secondary',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              lineHeight: 1.5
            }}
          >
            {lineNumber}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              lineHeight: 1.5,
              whiteSpace: 'pre',
              flex: 1
            }}
          >
            {line || ' '}
          </Typography>
        </Box>
      );
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          正在加載文件...
        </Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 工具欄 */}
      <Toolbar variant="dense" sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ flex: 1, fontSize: '1rem' }}>
          {filePath.split(/[/\\]/).pop()}
        </Typography>
        
        {isModified && (
          <Chip
            label="已修改"
            size="small"
            color="warning"
            sx={{ mr: 1 }}
          />
        )}
        
        <IconButton
          size="small"
          onClick={loadFile}
          title="重新加載"
          disabled={loading}
        >
          <RefreshIcon />
        </IconButton>
        
        <IconButton
          size="small"
          onClick={clearHighlights}
          title="清除高亮"
          disabled={highlightRanges.length === 0}
        >
          <HighlightIcon />
        </IconButton>
        
        <IconButton
          size="small"
          onClick={saveFile}
          title="保存文件"
          disabled={!isModified || saving}
        >
          {saving ? <CircularProgress size={20} /> : <SaveIcon />}
        </IconButton>
        
        <IconButton
          size="small"
          onClick={() => setShowDeleteDialog(true)}
          title="刪除文件"
          color="error"
        >
          <DeleteIcon />
        </IconButton>
        
        <IconButton
          size="small"
          onClick={onClose}
          title="關閉"
        >
          <CloseIcon />
        </IconButton>
      </Toolbar>

      {/* 錯誤和成功消息 */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 1 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ m: 1 }}>
          {success}
        </Alert>
      )}

      {/* 文件內容編輯區 */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 編輯模式 */}
        <TextField
          multiline
          fullWidth
          value={content}
          onChange={(e) => setContent(e.target.value)}
          variant="outlined"
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              height: '100%',
              alignItems: 'flex-start',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              lineHeight: 1.5
            },
            '& .MuiOutlinedInput-input': {
              height: '100% !important',
              overflow: 'auto !important'
            }
          }}
          InputProps={{
            style: {
              fontFamily: 'Consolas, Monaco, "Courier New", monospace'
            }
          }}
        />
      </Box>

      {/* 刪除確認對話框 */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>確認刪除</DialogTitle>
        <DialogContent>
          <Typography>
            確定要刪除文件 "{filePath.split(/[/\\]/).pop()}" 嗎？
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            此操作無法撤銷！
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>
            取消
          </Button>
          <Button onClick={deleteFile} color="error" variant="contained">
            刪除
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default FileEditor;
