import React, { useState, useEffect } from 'react';
import {
  Save,
  X,
  Highlighter,
  Edit,
  RefreshCw,
  Trash2,
  Loader2
} from 'lucide-react';
import { cn } from '@/utils/cn';

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
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <span className="ml-2 text-base">
          正在加載文件...
        </span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-lg">
      {/* 工具欄 */}
      <div className="flex items-center px-4 py-2 border-b border-gray-200">
        <h6 className="flex-1 text-base font-medium">
          {filePath.split(/[/\\]/).pop()}
        </h6>
        
        {isModified && (
          <span className="mr-2 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
            已修改
          </span>
        )}
        
        <button
          onClick={loadFile}
          title="重新加載"
          disabled={loading}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        
        <button
          onClick={clearHighlights}
          title="清除高亮"
          disabled={highlightRanges.length === 0}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Highlighter className="w-4 h-4" />
        </button>
        
        <button
          onClick={saveFile}
          title="保存文件"
          disabled={!isModified || saving}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        </button>
        
        <button
          onClick={() => setShowDeleteDialog(true)}
          title="刪除文件"
          className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        
        <button
          onClick={onClose}
          title="關閉"
          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 錯誤和成功消息 */}
      {error && (
        <div className="m-2 p-3 bg-red-50 border border-red-200 rounded-md flex items-center justify-between">
          <span className="text-sm text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="m-2 p-3 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
          <span className="text-sm text-green-700">{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="ml-2 text-green-500 hover:text-green-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 文件內容編輯區 */}
      <div className="flex-1 flex overflow-hidden p-2">
        {/* 編輯模式 */}
        <textarea
          className="w-full h-full p-3 border border-gray-300 rounded-md font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            fontFamily: 'Consolas, Monaco, "Courier New", monospace'
          }}
        />
      </div>

      {/* 刪除確認對話框 */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">確認刪除</h3>
              <p className="text-gray-700 mb-2">
                確定要刪除文件 "{filePath.split(/[/\\]/).pop()}" 嗎？
              </p>
              <p className="text-sm text-red-600">
                此操作無法撤銷！
              </p>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={deleteFile}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileEditor;
