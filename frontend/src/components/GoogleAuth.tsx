/**
 * Google OAuth 認證組件
 * 使用桌面 OAuth 2.0 流程進行 Google 登入授權
 */

import React, { useState, useCallback } from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/router';
import { cn } from '@/utils/cn';

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  scope: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface AuthResult {
  success: boolean;
  tokens?: TokenResponse;
  error?: string;
}

const GoogleAuth: React.FC = () => {
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authResult, setAuthResult] = useState<AuthResult | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    '準備授權',
    '瀏覽器授權',
    '獲取 Token',
    '完成'
  ];

  // OAuth 配置 - 這些應該從環境變數或配置文件中獲取
  const oauthConfig: OAuthConfig = {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || '',
    scope: 'openid email profile'
  };

  const handleStartAuth = useCallback(async () => {
    if (!oauthConfig.clientId || !oauthConfig.clientSecret) {
      setAuthResult({
        success: false,
        error: '請設定 Google OAuth 客戶端 ID 和密鑰'
      });
      return;
    }

    setIsAuthenticating(true);
    setAuthResult(null);
    setActiveStep(0);

    try {
      // 步驟 1: 準備授權
      setActiveStep(1);
      
      // 啟動 OAuth 流程
      const flowResult = await window.electronAPI.oauth.startFlow(oauthConfig);
      
      if (!flowResult.success) {
        throw new Error(flowResult.error || '啟動 OAuth 流程失敗');
      }

      // 步驟 2: 瀏覽器授權完成，獲取 Token
      setActiveStep(2);
      
      const tokenResult = await window.electronAPI.oauth.exchangeToken({
        ...oauthConfig,
        code: flowResult.code
      });

      if (!tokenResult.success) {
        throw new Error(tokenResult.error || 'Token 交換失敗');
      }

      // 步驟 3: 完成
      setActiveStep(3);
      
      setAuthResult({
        success: true,
        tokens: tokenResult.tokens
      });

      // 這裡可以將 token 發送到後端保存
      console.log('OAuth 成功，Token:', tokenResult.tokens);

    } catch (error) {
      console.error('OAuth 錯誤:', error);
      setAuthResult({
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤'
      });
      
      // 停止 OAuth 流程
      await window.electronAPI.oauth.stopFlow();
    } finally {
      setIsAuthenticating(false);
    }
  }, [oauthConfig]);

  const handleStopAuth = useCallback(async () => {
    try {
      await window.electronAPI.oauth.stopFlow();
      setIsAuthenticating(false);
      setActiveStep(0);
      setAuthResult(null);
    } catch (error) {
      console.error('停止 OAuth 流程錯誤:', error);
    }
  }, []);

  const handleTestRefresh = useCallback(async () => {
    if (!authResult?.tokens?.refresh_token) {
      setAuthResult({
        success: false,
        error: '沒有 refresh token 可供測試'
      });
      return;
    }

    try {
      const refreshResult = await window.electronAPI.oauth.refreshToken({
        ...oauthConfig,
        refreshToken: authResult.tokens.refresh_token
      });

      if (refreshResult.success) {
        setAuthResult({
          success: true,
          tokens: refreshResult.tokens
        });
        console.log('Token 刷新成功:', refreshResult.tokens);
      } else {
        throw new Error(refreshResult.error || 'Token 刷新失敗');
      }
    } catch (error) {
      console.error('Token 刷新錯誤:', error);
      setAuthResult({
        success: false,
        error: error instanceof Error ? error.message : 'Token 刷新失敗'
      });
    }
  }, [authResult, oauthConfig]);

  const handleNavigateToGoogle = useCallback(async () => {
    try {
      // 導航到 browser 頁面並加載 Google
      router.push('/browser?url=https://www.google.com');
      console.log('已導航到 Browser 頁面，Google 登入狀態應該已保持');
    } catch (error) {
      console.error('導航錯誤:', error);
    }
  }, [router]);

  return (
    <div className="max-w-[600px] mx-auto mt-8 bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-2">
          Google OAuth 登入
        </h2>

        <p className="text-sm text-gray-600 mb-6">
          使用 OAuth 2.0 + PKCE 進行安全的 Google 帳戶登入
        </p>

        {isAuthenticating && (
          <div className="mb-6">
            <div className="flex items-center justify-between">
              {steps.map((label, index) => (
                <div key={label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                      index < activeStep ? "bg-green-500 text-white" :
                      index === activeStep ? "bg-primary-500 text-white" :
                      "bg-gray-200 text-gray-500"
                    )}>
                      {index < activeStep ? <Check className="w-4 h-4" /> : index + 1}
                    </div>
                    <span className="text-xs mt-1 text-center">{label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-2",
                      index < activeStep ? "bg-green-500" : "bg-gray-200"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {authResult && (
          <div className={cn(
            "p-4 mb-4 rounded-lg border",
            authResult.success 
              ? "bg-green-50 border-green-200 text-green-900" 
              : "bg-red-50 border-red-200 text-red-900"
          )}>
            {authResult.success ? (
              <div>
                <h3 className="font-semibold mb-1">認證成功！瀏覽器登入狀態已設置</h3>
                <p className="text-sm mt-1">
                  ✅ Google 登入狀態已複製到瀏覽器
                </p>
                <p className="text-sm mt-1 font-bold">
                  現在可以點擊「前往 Google 」來進入登入狀態！
                </p>
              </div>
            ) : (
              <p className="text-sm">
                錯誤: {authResult.error}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <button
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            onClick={handleStartAuth}
            disabled={isAuthenticating}
          >
            {isAuthenticating && <Loader2 className="w-4 h-4 animate-spin" />}
            {isAuthenticating ? '登入中...' : '開始 Google 登入'}
          </button>

          <button
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={() => router.push('/')}
            disabled={isAuthenticating}
          >
            返回首頁
          </button>

          {authResult?.success && (
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              onClick={handleNavigateToGoogle}
            >
              前往 Google (已登入)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleAuth;
