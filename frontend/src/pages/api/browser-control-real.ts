/**
 * Browser Control Real API
 * 處理瀏覽器控制操作的 API 端點
 */

import { NextApiRequest, NextApiResponse } from 'next';

// 模擬的操作隊列
let pendingOperations: Array<{
  id: string;
  operation: any;
  timestamp: number;
}> = [];

// 操作結果存儲
let operationResults: Map<string, any> = new Map();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 設置 CORS 頭
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { action, operationId, result } = req.query;

    if (req.method === 'GET') {
      if (action === 'get_pending') {
        // 返回待執行的操作
        res.status(200).json({
          success: true,
          data: pendingOperations
        });
        return;
      }

      if (action === 'submit_result' && operationId && result) {
        // 提交操作結果
        try {
          const parsedResult = JSON.parse(decodeURIComponent(result as string));
          operationResults.set(operationId as string, parsedResult);
          
          // 從待執行隊列中移除已完成的操作
          pendingOperations = pendingOperations.filter(op => op.id !== operationId);
          
          res.status(200).json({
            success: true,
            message: '結果已提交'
          });
        } catch (error) {
          res.status(400).json({
            success: false,
            error: '結果解析失敗'
          });
        }
        return;
      }
    }

    if (req.method === 'POST') {
      const operation = req.body;
      
      // 生成操作腳本
      const script = generateOperationScript(operation);
      
      if (script) {
        res.status(200).json({
          success: true,
          script: script
        });
      } else {
        res.status(400).json({
          success: false,
          error: '不支持的操作類型'
        });
      }
      return;
    }

    res.status(405).json({
      success: false,
      error: '不支持的請求方法'
    });

  } catch (error) {
    console.error('Browser control API error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '內部服務器錯誤'
    });
  }
}

/**
 * 根據操作類型生成執行腳本
 */
function generateOperationScript(operation: any): string | null {
  const { action, selector, text, url, direction } = operation;

  switch (action) {
    case 'click':
      return `
        (function() {
          try {
            const element = document.querySelector('${selector}');
            if (element) {
              element.click();
              return { success: true, message: '點擊成功' };
            } else {
              return { success: false, error: '元素未找到' };
            }
          } catch (error) {
            return { success: false, error: error.message };
          }
        })();
      `;

    case 'type':
      return `
        (function() {
          try {
            const element = document.querySelector('${selector}');
            if (element) {
              element.focus();
              element.value = '${text}';
              element.dispatchEvent(new Event('input', { bubbles: true }));
              element.dispatchEvent(new Event('change', { bubbles: true }));
              return { success: true, message: '輸入成功' };
            } else {
              return { success: false, error: '元素未找到' };
            }
          } catch (error) {
            return { success: false, error: error.message };
          }
        })();
      `;

    case 'scroll':
      const scrollAmount = direction === 'up' ? -300 : 300;
      return `
        (function() {
          try {
            window.scrollBy(0, ${scrollAmount});
            return { success: true, message: '滾動成功' };
          } catch (error) {
            return { success: false, error: error.message };
          }
        })();
      `;

    case 'navigate':
      return `
        (function() {
          try {
            window.location.href = '${url}';
            return { success: true, message: '導航成功' };
          } catch (error) {
            return { success: false, error: error.message };
          }
        })();
      `;

    case 'get_page_data':
      return `
        (function() {
          try {
            if (typeof window.extractCurrentPageData === 'function') {
              return window.extractCurrentPageData();
            } else {
              return {
                url: window.location.href,
                title: document.title,
                content: '# 頁面資料提取器未載入',
                interactiveElements: [],
                metadata: {
                  timestamp: Date.now(),
                  viewport: { width: window.innerWidth, height: window.innerHeight },
                  scrollPosition: { x: window.scrollX, y: window.scrollY },
                  loadState: document.readyState
                },
                extractionErrors: ['PageDataExtractor not loaded']
              };
            }
          } catch (error) {
            return { success: false, error: error.message };
          }
        })();
      `;

    case 'wait_for_element':
      return `
        (function() {
          return new Promise((resolve) => {
            const timeout = ${operation.timeout || 5000};
            const startTime = Date.now();
            
            function checkElement() {
              const element = document.querySelector('${selector}');
              if (element) {
                resolve({ success: true, message: '元素已找到' });
              } else if (Date.now() - startTime > timeout) {
                resolve({ success: false, error: '等待超時' });
              } else {
                setTimeout(checkElement, 100);
              }
            }
            
            checkElement();
          });
        })();
      `;

    case 'execute_script':
      return operation.script || 'console.log("No script provided");';

    default:
      return null;
  }
}

/**
 * 添加操作到待執行隊列
 */
export function addPendingOperation(operation: any): string {
  const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  pendingOperations.push({
    id,
    operation,
    timestamp: Date.now()
  });
  return id;
}

/**
 * 獲取操作結果
 */
export function getOperationResult(operationId: string): any {
  return operationResults.get(operationId);
}

/**
 * 清理過期的操作
 */
export function cleanupExpiredOperations() {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 分鐘

  pendingOperations = pendingOperations.filter(op => now - op.timestamp < maxAge);
  
  // 清理過期的結果
  for (const [id, result] of operationResults.entries()) {
    if (result.timestamp && now - result.timestamp > maxAge) {
      operationResults.delete(id);
    }
  }
}

// 定期清理過期操作
setInterval(cleanupExpiredOperations, 60000); // 每分鐘清理一次
