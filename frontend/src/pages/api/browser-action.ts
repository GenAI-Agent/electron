/**
 * Browser Action API
 * 處理來自後端的瀏覽器操作請求，並轉發給 Electron
 */

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 設置 CORS 頭
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      error: '只支持 POST 請求'
    });
    return;
  }

  try {
    const actionData = req.body;
    console.log('🔧 Browser Action API 收到請求:', actionData);

    // 轉發請求到 Electron HTTP 服務器
    const electronUrl = 'http://localhost:3001/browser-action';
    
    const response = await fetch(electronUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(actionData),
    });

    if (!response.ok) {
      throw new Error(`Electron 服務器響應錯誤: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Electron 響應:', result);

    // 統一響應格式
    const formattedResult = {
      success: result.success || false,
      error: result.error || null,
      page_data: result.pageData || result.data || null,
      screenshot: result.screenshot || null,
      execution_time: result.executionTime || null,
      details: result.details || null
    };

    res.status(200).json(formattedResult);

  } catch (error) {
    console.error('❌ Browser Action API 錯誤:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '內部服務器錯誤',
      page_data: null,
      screenshot: null,
      execution_time: null,
      details: null
    });
  }
}
