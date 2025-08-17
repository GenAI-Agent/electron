/**
 * Browser Controller - 瀏覽器控制器組件
 * 負責執行來自後端的瀏覽器操作指令
 */

import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';

interface PendingOperation {
  id: string;
  operation: {
    action: string;
    selector?: string;
    text?: string;
    url?: string;
    options?: Record<string, any>;
  };
  timestamp: number;
}

const BrowserController: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [lastOperation, setLastOperation] = useState<string>('');
  const [operationCount, setOperationCount] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkForOperations = async () => {
      try {
        const response = await fetch('/api/browser-control-real?action=get_pending');
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          setIsActive(true);
          
          for (const pendingOp of result.data) {
            await executeOperation(pendingOp);
          }
          
          setIsActive(false);
        }
      } catch (error) {
        console.error('檢查待執行操作失敗:', error);
      }
    };

    const executeOperation = async (pendingOp: PendingOperation) => {
      const { id, operation } = pendingOp;
      
      console.log(`🔧 執行操作: ${operation.action}`, operation);
      setLastOperation(`${operation.action} - ${operation.selector || operation.url || ''}`);
      setOperationCount(prev => prev + 1);
      
      try {
        // 獲取執行腳本
        const scriptResponse = await fetch('/api/browser-control-real', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(operation)
        });
        
        const scriptResult = await scriptResponse.json();
        
        if (scriptResult.success && scriptResult.script) {
          // 執行腳本
          const result = eval(scriptResult.script);
          
          console.log(`✅ 操作結果:`, result);
          
          // 提交結果
          await fetch(`/api/browser-control-real?action=submit_result&operationId=${id}&result=${encodeURIComponent(JSON.stringify(result))}`);
        }
      } catch (error) {
        console.error(`❌ 操作執行失敗:`, error);
        
        // 提交錯誤結果
        const errorResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        await fetch(`/api/browser-control-real?action=submit_result&operationId=${id}&result=${encodeURIComponent(JSON.stringify(errorResult))}`);
      }
    };

    // 每秒檢查一次待執行操作
    intervalId = setInterval(checkForOperations, 1000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        top: 10, 
        right: 10, 
        p: 2, 
        minWidth: 300,
        zIndex: 9999,
        backgroundColor: isActive ? 'action.selected' : 'background.paper',
        border: isActive ? '2px solid' : '1px solid',
        borderColor: isActive ? 'primary.main' : 'divider'
      }}
    >
      <Typography variant="h6" gutterBottom>
        🤖 瀏覽器控制器
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Chip 
          label={isActive ? "執行中" : "待機中"} 
          color={isActive ? "primary" : "default"}
          size="small"
        />
        <Typography variant="body2" color="text.secondary">
          操作次數: {operationCount}
        </Typography>
      </Box>
      
      {lastOperation && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          最後操作: {lastOperation}
        </Typography>
      )}
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        此組件會自動執行來自後端的瀏覽器操作指令
      </Typography>
    </Paper>
  );
};

export default BrowserController;
